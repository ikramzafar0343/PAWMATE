const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const crypto = require('crypto');
const MedicalRecord = require('../models/MedicalRecord');
const Pet = require('../models/Pet');
const { medicalRecordsCache, MEDICAL_RECORDS_CACHE_TTL_MS, CACHING_ENABLED } = require('../utils/cache');

// @desc    Get medical records for a pet
// @route   GET /api/medical-records/:petId
// @access  Private
const getMedicalRecords = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const petId = req.params.petId;

  // Validate ObjectId format
  if (!petId || petId === 'null' || petId === 'undefined' || !mongoose.Types.ObjectId.isValid(petId)) {
    res.status(400);
    throw new Error('Invalid pet ID');
  }

  // Build cache key
  const typeFilter = req.query.type ? { type: req.query.type } : {};
  const cacheKey = `medicalRecords_${petId}_${JSON.stringify(typeFilter)}`;
  
  // Check cache only if enabled
  let cached;
  if (CACHING_ENABLED) {
    const ifNoneMatch = req.headers['if-none-match'];
    cached = medicalRecordsCache.get(cacheKey);
    if (ifNoneMatch && cached && cached.etag === ifNoneMatch) {
      const duration = Date.now() - startTime;
      res.set('ETag', cached.etag);
      const { infoRequest } = require('../utils/logger');
      infoRequest({
        method: req.method,
        url: req.originalUrl,
        status: 304,
        label: 'records',
        count: (cached.data || []).length,
        dbMs: 0,
        totalMs: duration
      });
      res.locals.requestLogged = true;
      return res.status(304).end();
    }
  }

  // Serve fresh cached data directly (TTL) to avoid DB hits
  if (CACHING_ENABLED && cached && (Date.now() - cached.timestamp) < MEDICAL_RECORDS_CACHE_TTL_MS) {
    const duration = Date.now() - startTime;
    res.set('ETag', cached.etag);
    res.set('Cache-Control', 'private, max-age=60');
    const { infoRequest } = require('../utils/logger');
    infoRequest({
      method: req.method,
      url: req.originalUrl,
      status: 200,
      label: 'records',
      count: cached.data.length,
      dbMs: 0,
      totalMs: duration
    });
    res.locals.requestLogged = true;
    return res.status(200).json(cached.data);
  }

  // Check access in parallel with pet lookup
  const pet = await Pet.findById(petId).select('ownerId').lean();

  if (!pet) {
      res.status(404);
      throw new Error('Pet not found');
  }

  // Check access: Owner, Vet, or Admin
  if (req.user.role !== 'admin' && req.user.role !== 'vet' && pet.ownerId.toString() !== req.user.id) {
      res.status(401);
      throw new Error('Not authorized to view records for this pet');
  }

  // Optional filters
  const limit = Math.min(parseInt(req.query.limit || '50', 10) || 50, 200);
  const page = Math.max(parseInt(req.query.page || '1', 10) || 1, 1);
  const skip = (page - 1) * limit;

  // Use .find() with .hint() to FORCE index usage (more reliable than aggregation for simple queries)
  const matchQuery = { 
    petId: new mongoose.Types.ObjectId(petId),
    ...typeFilter 
  };
  
  const queryStartTime = Date.now();
  // Optimized query - MongoDB will automatically use the best index
  // Remove hint() to let MongoDB choose the optimal index
  const summary = req.query.summary === 'true';
  const selectFields = summary 
    ? 'petId vetId type date title createdAt'
    : 'petId vetId type date time title details attachments createdAt updatedAt';
  const records = await MedicalRecord.find(matchQuery)
    .select(selectFields)
    .lean()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .maxTimeMS(3000);
  const queryDuration = Date.now() - queryStartTime;
  
  // Generate ETag from data hash
  const dataString = JSON.stringify(records);
  const etag = crypto.createHash('md5').update(dataString).digest('hex');
  
  // Cache the result with ETag if enabled
  if (CACHING_ENABLED) {
    medicalRecordsCache.set(cacheKey, { etag, data: records, timestamp: Date.now() });
    res.set('ETag', etag);
    res.set('Cache-Control', 'private, max-age=60');
  }
  
  const duration = Date.now() - startTime;
  const { infoRequest } = require('../utils/logger');
  infoRequest({
    method: req.method,
    url: req.originalUrl,
    status: 200,
    label: 'records',
    count: records.length,
    dbMs: queryDuration,
    totalMs: duration
  });
  res.locals.requestLogged = true;
  
  res.status(200).json(records);
});

// @desc    Create medical record
// @route   POST /api/medical-records
// @access  Private
const createMedicalRecord = asyncHandler(async (req, res) => {
  const { petId, type, date, time, title, details, attachments } = req.body;

  // Validate required fields
  if (!petId || !type || !date || !title) {
    res.status(400);
    throw new Error('Please provide petId, type, date, and title');
  }

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(petId)) {
    res.status(400);
    throw new Error('Invalid pet ID');
  }

  // Verify pet exists and user has access
  const pet = await Pet.findById(petId).select('ownerId').lean();
  if (!pet) {
    res.status(404);
    throw new Error('Pet not found');
  }

  // Check access rights
  const isPetOwner = pet.ownerId.toString() === req.user.id;
  const isVetOrAdmin = req.user.role === 'vet' || req.user.role === 'admin';

  // Owners can create records for their own pets
  // Vets/Admins can create records for any pet
  if (!isPetOwner && !isVetOrAdmin) {
    res.status(401);
    throw new Error('Not authorized to add records for this pet');
  }

  // Some record types may have additional restrictions (can be added later if needed)
  // For now, allow all record types for pet owners and vets

  // Ensure consistent user ID format
  const userId = (req.user._id || req.user.id).toString();
  
  const record = await MedicalRecord.create({
    petId,
    vetId: userId, // Using current user as 'vetId' (creator)
    type,
    date,
    time,
    title,
    details, // This is a Map/Object
    attachments
  });

  // Clear cache for this pet's medical records
  medicalRecordsCache.delete(`medicalRecords_${petId}_{}`);
  if (req.query.type) {
    medicalRecordsCache.delete(`medicalRecords_${petId}_${JSON.stringify({ type: req.query.type })}`);
  }

  res.status(201).json(record);
});

// @desc    Update medical record
// @route   PUT /api/medical-records/:id
// @access  Private
const updateMedicalRecord = asyncHandler(async (req, res) => {
    const record = await MedicalRecord.findById(req.params.id);

    if (!record) {
        res.status(404);
        throw new Error('Medical Record not found');
    }

    // Check access:
    // - Vets/Admins: can update any record
    // - Pet owners: can update records for their own pets except Prescription and Lab Result
    if (req.user.role !== 'vet' && req.user.role !== 'admin') {
        const pet = await Pet.findById(record.petId).select('ownerId').lean();
        if (!pet || pet.ownerId.toString() !== req.user.id) {
            res.status(401);
            throw new Error('Not authorized to update records for this pet');
        }
        if (record.type === 'Prescription' || record.type === 'Lab Result') {
            res.status(401);
            throw new Error('Not authorized to update this record type');
        }
    }

    const updatedRecord = await MedicalRecord.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, lean: true }
    );

    // Clear cache for this pet's medical records
    const petId = record.petId.toString();
    medicalRecordsCache.delete(`medicalRecords_${petId}_{}`);
    // Clear all type-specific caches for this pet
    for (const key of medicalRecordsCache.keys()) {
      if (key.startsWith(`medicalRecords_${petId}_`)) {
        medicalRecordsCache.delete(key);
      }
    }

    res.status(200).json(updatedRecord);
});

// @desc    Delete medical record
// @route   DELETE /api/medical-records/:id
// @access  Private
const deleteMedicalRecord = asyncHandler(async (req, res) => {
    const record = await MedicalRecord.findById(req.params.id);

    if (!record) {
        res.status(404);
        throw new Error('Medical Record not found');
    }

    // Check access
    const isCreator = record.vetId?.toString() === (req.user.id || req.user._id?.toString());
    const isOwnerAllowedType = record.type === 'Breeding' || record.type === 'AI Diagnosis' || record.type === 'Vaccination';
    console.log('[deleteMedicalRecord] Access check:', {
      recordId: req.params.id,
      recordType: record.type,
      recordVetId: record.vetId?.toString(),
      userId: (req.user.id || req.user._id?.toString()),
      userRole: req.user.role,
      isCreator,
      isOwnerAllowedType
    });
    
    if (req.user.role !== 'vet' && req.user.role !== 'admin') {
        // If regular user:
        // 1. Allow if they created the record (regardless of type)
        // 2. Allow if they own the pet AND it's an allowed type (for records created by others/system)
        
        if (!isCreator) {
            if (!isOwnerAllowedType) {
                res.status(403);
                throw new Error('Not authorized to delete this record type');
            }
            // Verify ownership of the pet associated with the record
            const pet = await Pet.findById(record.petId).select('ownerId').lean();
            if (!pet || pet.ownerId.toString() !== req.user.id) {
                res.status(403);
                throw new Error('Not authorized to delete records for this pet');
            }
        }
    }

    const petId = record.petId.toString();
    
    await record.deleteOne();

    // Clear cache for this pet's medical records
    for (const key of medicalRecordsCache.keys()) {
      if (key.startsWith(`medicalRecords_${petId}_`)) {
        medicalRecordsCache.delete(key);
      }
    }

    res.status(200).json({ id: req.params.id });
});

module.exports = {
  getMedicalRecords,
  createMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord
};
