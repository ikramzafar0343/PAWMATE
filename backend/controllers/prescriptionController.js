const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const crypto = require('crypto');
const Prescription = require('../models/Prescription');
const Pet = require('../models/Pet');
const cacheService = require('../utils/cacheService');

// Cache TTL configuration
const PRESCRIPTIONS_CACHE_TTL_SEC = 300; // 5 minutes
const CACHE_KEY_PREFIX = 'prescriptions';

// @desc    Get prescriptions
// @route   GET /api/prescriptions
// @access  Private
const getPrescriptions = asyncHandler(async (req, res) => {
  let query = {};
  
  if (req.query.petId) {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.query.petId)) {
      res.status(400);
      throw new Error('Invalid pet ID');
    }
    query.petId = req.query.petId;
  }
  
  if (req.query.status) {
    query.status = req.query.status;
  }
  
  if (req.user.role === 'vet') {
    query.vetId = req.user.id || req.user._id;
  } else if (req.user.role === 'pet-owner') {
    // Optimized: Use ownerId lookup instead of fetching all pets first
    // This avoids N+1 query pattern by using aggregation or direct lookup
    // For now, keep the current approach but with better caching
    const pets = await Pet.find({ ownerId: req.user.id || req.user._id }).select('_id').lean();
    const petIds = pets.map(p => p._id);
    if (petIds.length === 0) {
      // No pets owned, return empty array
      res.status(200).json([]);
      return;
    }
    query.petId = { $in: petIds };
  }
  // Admin sees all

  // Check if cache should be bypassed (for benchmarking)
  const bypassCache = req.query.nocache === 'true' || req.query.nocache === '1';
  
  // Generate cache key
  const cacheKey = `${CACHE_KEY_PREFIX}:${req.user.id || req.user._id}:${req.user.role}:${JSON.stringify(query)}`;
  const etagKey = `${cacheKey}:etag`;
  
  // Check cache - skip if bypassing cache
  if (!bypassCache) {
    try {
      const cached = await cacheService.get(cacheKey);
      const cachedEtag = await cacheService.get(etagKey);
      
      if (cached) {
        const ifNoneMatch = req.headers['if-none-match'];
        if (ifNoneMatch && cachedEtag === ifNoneMatch) {
          res.set('ETag', cachedEtag);
          return res.status(304).end();
        }
        
        res.set('ETag', cachedEtag || crypto.createHash('md5').update(JSON.stringify(cached)).digest('hex'));
        res.set('Cache-Control', 'private, max-age=300');
        return res.status(200).json(cached);
      }
    } catch (error) {
      // Cache error - continue with DB query
    }
  } else {
    console.log('[Performance] getPrescriptions CACHE BYPASSED (nocache=true)');
  }

  // Fix: sort and limit must come BEFORE lean()
  // Populate petId with ownerId for owner name lookup (for vet/admin views)
  let queryBuilder = Prescription.find(query)
    .sort({ createdAt: -1 })  // Sort first for index usage
    .limit(100);  // Limit before populate
  
  // Populate pet and vet information
  queryBuilder = queryBuilder
    .populate({
      path: 'petId',
      select: 'name breed image ownerId',
      populate: {
        path: 'ownerId',
        select: 'name'
      }
    })
    .populate('vetId', 'name image clinicName');
  
  const prescriptions = await queryBuilder
    .lean()  // lean() must be last
    .maxTimeMS(5000);  // Prevent runaway queries (5 seconds max)

  // Generate ETag for caching
  const dataString = JSON.stringify(prescriptions);
  const etag = crypto.createHash('md5').update(dataString).digest('hex');
  
  cacheService.set(cacheKey, prescriptions, PRESCRIPTIONS_CACHE_TTL_SEC);
  cacheService.set(etagKey, etag, PRESCRIPTIONS_CACHE_TTL_SEC);

  res.set('ETag', etag);
  res.set('Cache-Control', 'private, max-age=300');
  res.status(200).json(prescriptions);
});

// @desc    Get prescription by ID
// @route   GET /api/prescriptions/:id
// @access  Private
const getPrescriptionById = asyncHandler(async (req, res) => {
  const prescriptionId = req.params.id;
  
  // Validate ObjectId format
  if (!prescriptionId || !mongoose.Types.ObjectId.isValid(prescriptionId)) {
    res.status(400);
    throw new Error('Invalid prescription ID');
  }
  
  const prescription = await Prescription.findById(prescriptionId)
    .populate('petId', 'name breed image ownerId')
    .populate('vetId', 'name image clinicName');

  if (!prescription) {
    res.status(404);
    throw new Error('Prescription not found');
  }

  // Check access
  if (req.user.role === 'pet-owner') {
    const pet = prescription.petId;
    if (!pet || pet.ownerId.toString() !== req.user.id) {
      res.status(401);
      throw new Error('Not authorized');
    }
  } else if (req.user.role === 'vet' && prescription.vetId._id.toString() !== req.user.id && req.user.role !== 'admin') {
    res.status(401);
    throw new Error('Not authorized');
  }

  // Convert to plain object after access check
  const prescriptionObj = prescription.toObject();

  res.status(200).json(prescription);
});

// @desc    Create prescription
// @route   POST /api/prescriptions
// @access  Private (Vet/Admin)
const createPrescription = asyncHandler(async (req, res) => {
  const { petId, medication, dosage, duration, instructions, date } = req.body;

  if (!petId || !medication || !dosage || !duration) {
    res.status(400);
    throw new Error('Please add all required fields');
  }

  // Validate petId ObjectId format
  if (!mongoose.Types.ObjectId.isValid(petId)) {
    res.status(400);
    throw new Error('Invalid pet ID');
  }
  
  // Verify pet exists
  const pet = await Pet.findById(petId);
  if (!pet) {
    res.status(404);
    throw new Error('Pet not found');
  }

  // Check if user is vet or admin
  if (req.user.role !== 'vet' && req.user.role !== 'admin') {
    res.status(401);
    throw new Error('Only veterinarians can create prescriptions');
  }

  const prescription = await Prescription.create({
    petId,
    vetId: req.user.id || req.user._id,
    medication,
    dosage,
    duration,
    instructions: instructions || '',
    date: date || new Date().toISOString().split('T')[0],
    status: 'pending' // New prescriptions start as pending, require approval
  });

  const populated = await Prescription.findById(prescription._id)
    .populate('petId', 'name breed image')
    .populate('vetId', 'name image clinicName');

  cacheService.delPattern(`${CACHE_KEY_PREFIX}:*`);

  res.status(201).json(populated);
});

// @desc    Update prescription
// @route   PUT /api/prescriptions/:id
// @access  Private
const updatePrescription = asyncHandler(async (req, res) => {
  const prescriptionId = req.params.id;
  
  // Validate ObjectId format
  if (!prescriptionId || !mongoose.Types.ObjectId.isValid(prescriptionId)) {
    res.status(400);
    throw new Error('Invalid prescription ID');
  }
  
  const prescription = await Prescription.findById(prescriptionId);

  if (!prescription) {
    res.status(404);
    throw new Error('Prescription not found');
  }

  // Check access
  if (req.user.role === 'vet' && prescription.vetId.toString() !== req.user.id && req.user.role !== 'admin') {
    res.status(401);
    throw new Error('Not authorized');
  }

  const updated = await Prescription.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  )
    .populate('petId', 'name breed image')
    .populate('vetId', 'name image clinicName');

  cacheService.delPattern(`${CACHE_KEY_PREFIX}:*`);

  res.status(200).json(updated);
});

// @desc    Delete prescription
// @route   DELETE /api/prescriptions/:id
// @access  Private
const deletePrescription = asyncHandler(async (req, res) => {
  const prescriptionId = req.params.id;
  
  // Validate ObjectId format
  if (!prescriptionId || !mongoose.Types.ObjectId.isValid(prescriptionId)) {
    res.status(400);
    throw new Error('Invalid prescription ID');
  }
  
  const prescription = await Prescription.findById(prescriptionId);

  if (!prescription) {
    res.status(404);
    throw new Error('Prescription not found');
  }

  // Check access
  if (req.user.role === 'vet' && prescription.vetId.toString() !== req.user.id && req.user.role !== 'admin') {
    res.status(401);
    throw new Error('Not authorized');
  }

  await prescription.deleteOne();

  cacheService.delPattern(`${CACHE_KEY_PREFIX}:*`);

  res.status(200).json({ id: req.params.id });
});

// @desc    Get active prescription for a pet
// @route   GET /api/prescriptions/pet/:petId/active
// @access  Private
const getActivePrescription = asyncHandler(async (req, res) => {
  const petId = req.params.petId;
  
  // Validate ObjectId format
  if (!petId || petId === 'null' || petId === 'undefined' || !mongoose.Types.ObjectId.isValid(petId)) {
    res.status(400);
    throw new Error('Invalid pet ID');
  }
  
  const pet = await Pet.findById(petId);

  if (!pet) {
    res.status(404);
    throw new Error('Pet not found');
  }

  // Check access
  if (req.user.role !== 'admin' && req.user.role !== 'vet' && pet.ownerId.toString() !== req.user.id) {
    res.status(401);
    throw new Error('Not authorized');
  }

  // Fix: sort must come before populate
  // Get active prescriptions (approved prescriptions become active)
  const prescription = await Prescription.findOne({
    petId: req.params.petId,
    status: 'active' // Only active (approved) prescriptions
  })
    .sort({ createdAt: -1 })  // Sort first
    .populate('petId', 'name breed image')
    .populate('vetId', 'name image clinicName');

  res.status(200).json(prescription);
});

// @desc    Approve prescription (change status from pending to approved/active)
// @route   PUT /api/prescriptions/:id/approve
// @access  Private (Vet/Admin)
const approvePrescription = asyncHandler(async (req, res) => {
  const prescriptionId = req.params.id;
  
  // Validate ObjectId format
  if (!prescriptionId || !mongoose.Types.ObjectId.isValid(prescriptionId)) {
    res.status(400);
    throw new Error('Invalid prescription ID');
  }
  
  const prescription = await Prescription.findById(prescriptionId);

  if (!prescription) {
    res.status(404);
    throw new Error('Prescription not found');
  }

  // Check authorization - only vet/admin can approve
  if (req.user.role !== 'vet' && req.user.role !== 'admin') {
    res.status(401);
    throw new Error('Not authorized to approve prescriptions');
  }

  // Only approve if status is pending
  if (prescription.status !== 'pending') {
    res.status(400);
    throw new Error(`Cannot approve prescription with status: ${prescription.status}. Only pending prescriptions can be approved.`);
  }

  // Update status to active (approved prescriptions become active)
  prescription.status = 'active';
  await prescription.save();

  // Invalidate cache
  cacheService.delPattern(`${CACHE_KEY_PREFIX}:*`);

  // Populate before returning
  const populated = await Prescription.findById(prescription._id)
    .populate({
      path: 'petId',
      select: 'name breed image ownerId',
      populate: {
        path: 'ownerId',
        select: 'name'
      }
    })
    .populate('vetId', 'name image clinicName')
    .lean();

  res.status(200).json(populated);
});

// @desc    Get pending prescriptions
// @route   GET /api/prescriptions/pending
// @access  Private (Vet/Admin)
const getPendingPrescriptions = asyncHandler(async (req, res) => {
  const query = { status: 'pending' };
  
  // Vets see only their pending prescriptions, admins see all
  if (req.user.role === 'vet') {
    query.vetId = req.user.id || req.user._id;
  }
  // Admin sees all pending prescriptions

  // Check if cache should be bypassed (for benchmarking)
  const bypassCache = req.query.nocache === 'true' || req.query.nocache === '1';
  
  // Generate cache key
  const cacheKey = `${CACHE_KEY_PREFIX}:pending:${req.user.id || req.user._id}:${req.user.role}`;
  const etagKey = `${cacheKey}:etag`;
  
  // Check cache - skip if bypassing cache
  if (!bypassCache) {
    try {
      const cached = await cacheService.get(cacheKey);
      const cachedEtag = await cacheService.get(etagKey);
      
      if (cached) {
        const ifNoneMatch = req.headers['if-none-match'];
        if (ifNoneMatch && cachedEtag === ifNoneMatch) {
          res.set('ETag', cachedEtag);
          return res.status(304).end();
        }
        
        res.set('ETag', cachedEtag || crypto.createHash('md5').update(JSON.stringify(cached)).digest('hex'));
        res.set('Cache-Control', 'private, max-age=300');
        return res.status(200).json(cached);
      }
    } catch (error) {
      // Cache error - continue with DB query
    }
  } else {
    console.log('[Performance] getPendingPrescriptions CACHE BYPASSED (nocache=true)');
  }

  // Fetch pending prescriptions with owner information
  const prescriptions = await Prescription.find(query)
    .sort({ createdAt: -1 })
    .limit(100)
    .populate({
      path: 'petId',
      select: 'name breed image ownerId',
      populate: {
        path: 'ownerId',
        select: 'name'
      }
    })
    .populate('vetId', 'name image clinicName')
    .lean()
    .maxTimeMS(5000);

  // Generate ETag for caching
  const dataString = JSON.stringify(prescriptions);
  const etag = crypto.createHash('md5').update(dataString).digest('hex');
  
  cacheService.set(cacheKey, prescriptions, PRESCRIPTIONS_CACHE_TTL_SEC);
  cacheService.set(etagKey, etag, PRESCRIPTIONS_CACHE_TTL_SEC);

  res.set('ETag', etag);
  res.set('Cache-Control', 'private, max-age=300');
  res.status(200).json(prescriptions);
});

module.exports = {
  getPrescriptions,
  getPrescriptionById,
  createPrescription,
  updatePrescription,
  deletePrescription,
  getActivePrescription,
  approvePrescription,
  getPendingPrescriptions,
};

