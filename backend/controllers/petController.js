const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Pet = require('../models/Pet');

// Simple in-memory cache for ETags (cleared on mutations)
const petsCache = new Map();
const PETS_CACHE_TTL_MS = 60 * 1000;
const CACHING_ENABLED = (process.env.CACHE_ENABLED ?? 'false') !== 'false';

// @desc    Get pets
// @route   GET /api/pets
// @access  Private
const getPets = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  // Ensure we have a valid user
  if (!req.user || !req.user._id) {
    res.status(401);
    throw new Error('User not authenticated');
  }

  const userId = req.user._id.toString();
  const cacheKey = `pets_${userId}_${req.user.role}`;
  
  // Check cache only if enabled
  let cached;
  if (CACHING_ENABLED) {
    const ifNoneMatch = req.headers['if-none-match'];
    cached = petsCache.get(cacheKey);
    if (ifNoneMatch && cached && cached.etag === ifNoneMatch) {
      const duration = Date.now() - startTime;
      res.set('ETag', cached.etag);
      const { infoRequest } = require('../utils/logger');
      infoRequest({
        method: req.method,
        url: req.originalUrl,
        status: 304,
        label: 'pets',
        count: (cached.data || []).length,
        dbMs: 0,
        totalMs: duration
      });
      res.locals.requestLogged = true;
      return res.status(304).end();
    }
  }

  // Serve fresh cached data directly (TTL) to avoid DB hits
  if (CACHING_ENABLED && cached && (Date.now() - cached.timestamp) < PETS_CACHE_TTL_MS) {
    const duration = Date.now() - startTime;
    res.set('ETag', cached.etag);
    res.set('Cache-Control', 'private, max-age=60');
    const { infoRequest } = require('../utils/logger');
    infoRequest({
      method: req.method,
      url: req.originalUrl,
      status: 200,
      label: 'pets',
      count: (cached.data || []).length,
      dbMs: 0,
      totalMs: duration
    });
    res.locals.requestLogged = true;
    return res.status(200).json(cached.data || []);
  }
  
  let pets;
  let dbMs = undefined;
  
  if (req.user.role === 'vet' || req.user.role === 'admin') {
      // Vets/Admins might want to see all or search, but for now let's return all or filter by query
      if (req.query.ownerId) {
          // Validate ownerId is a valid ObjectId
          if (mongoose.Types.ObjectId.isValid(req.query.ownerId)) {
              const queryStartTime = Date.now();
              const ownerObjectId = new mongoose.Types.ObjectId(req.query.ownerId);
              // Use aggregation pipeline for better performance
              pets = await Pet.aggregate([
                { $match: { ownerId: ownerObjectId } },
                { $sort: { createdAt: -1 } },
                {
                  $project: {
                    name: 1,
                    breed: 1,
                    image: 1,
                    ownerId: 1,
                    createdAt: 1
                  }
                }
              ]);
              dbMs = Date.now() - queryStartTime;
          } else {
              res.status(400);
              throw new Error('Invalid ownerId');
          }
      } else {
          // Pagination for admins/vets
          const page = Math.max(parseInt(req.query.page || '1', 10) || 1, 1);
          const limit = Math.min(parseInt(req.query.limit || '20', 10) || 20, 100);
          const skip = (page - 1) * limit;
          
      const queryStartTime = Date.now();
      const selectFields = (req.query.summary === 'true')
        ? 'name breed image ownerId createdAt'
        : 'name breed age weight image gender species color microchipNumber status statusColor ownerId createdAt updatedAt';
      pets = await Pet.find({})
        .select(selectFields)
        .lean()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .maxTimeMS(3000);
        // Removed .hint() - MongoDB will automatically use the best available index
      dbMs = Date.now() - queryStartTime;
      }
  } else {
      // Owners only see their pets - use strict userId matching with proper ObjectId conversion
      // Convert userId string to ObjectId for optimal index usage
      const ownerObjectId = mongoose.Types.ObjectId.isValid(userId) 
        ? new mongoose.Types.ObjectId(userId) 
        : userId;
      
      const queryStartTime = Date.now();
      const page = Math.max(parseInt(req.query.page || '1', 10) || 1, 1);
      const limit = Math.min(parseInt(req.query.limit || '20', 10) || 20, 100);
      const skip = (page - 1) * limit;
      const selectFields = (req.query.summary === 'true')
        ? 'name breed image ownerId createdAt'
        : 'name breed age weight image gender species color microchipNumber status statusColor ownerId createdAt updatedAt';
      pets = await Pet.find({ ownerId: ownerObjectId })
        .select(selectFields)
        .lean()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .maxTimeMS(3000);
      dbMs = Date.now() - queryStartTime;
  }
  
  // Generate ETag from data hash
  const crypto = require('crypto');
  const dataString = JSON.stringify(pets);
  const etag = crypto.createHash('md5').update(dataString).digest('hex');
  
  // Cache the result with ETag if enabled
  if (CACHING_ENABLED) {
    petsCache.set(cacheKey, { etag, data: pets, timestamp: Date.now() });
    res.set('ETag', etag);
    res.set('Cache-Control', 'private, max-age=60');
  }
  
  const duration = Date.now() - startTime;
  const { infoRequest } = require('../utils/logger');
  infoRequest({
    method: req.method,
    url: req.originalUrl,
    status: 200,
    label: 'pets',
    count: (pets || []).length,
    dbMs,
    totalMs: duration
  });
  res.locals.requestLogged = true;
  
  // Ensure we return an array even if empty
  res.status(200).json(pets || []);
});

// @desc    Get pet by ID
// @route   GET /api/pets/:id
// @access  Private
const getPetById = asyncHandler(async (req, res) => {
    const timerLabel = `getPetById_${Date.now()}_${Math.random()}`;
    const startTime = Date.now();
    console.time(timerLabel);
    const petId = req.params.id;
    
    // Validate ObjectId format
    if (!petId || petId === 'null' || petId === 'undefined' || !mongoose.Types.ObjectId.isValid(petId)) {
        res.status(400).json({ 
            message: 'Invalid pet ID format',
            code: 'INVALID_PET_ID'
        });
        return;
    }

    const userId = (req.user._id || req.user.id).toString();
    const cacheKey = `pet_${petId}`;

    // Check If-None-Match header for 304 response
    const ifNoneMatch = req.headers['if-none-match'];
    const cached = petsCache.get(cacheKey);

    if (ifNoneMatch && cached && cached.etag === ifNoneMatch) {
        // Verify user access before returning cached data
        const petOwnerId = (cached.data.ownerId && typeof cached.data.ownerId === 'object' && cached.data.ownerId._id) 
            ? cached.data.ownerId._id.toString() 
            : cached.data.ownerId.toString();

        if (req.user.role === 'admin' || req.user.role === 'vet' || petOwnerId === userId) {
            const duration = Date.now() - startTime;
            console.timeEnd(timerLabel);
            console.log(`[Performance] getPetById 304 (cached, no DB) in ${duration}ms`);
            res.set('ETag', cached.etag);
            return res.status(304).end();
        }
    }

    // Serve fresh cached data directly (TTL)
    if (cached && (Date.now() - cached.timestamp) < PETS_CACHE_TTL_MS) {
         // Verify user access
         const petOwnerId = (cached.data.ownerId && typeof cached.data.ownerId === 'object' && cached.data.ownerId._id) 
            ? cached.data.ownerId._id.toString() 
            : cached.data.ownerId.toString();

        if (req.user.role === 'admin' || req.user.role === 'vet' || petOwnerId === userId) {
            const duration = Date.now() - startTime;
            console.timeEnd(timerLabel);
            console.log(`[Performance] getPetById cache hit (TTL) in ${duration}ms`);
            res.set('ETag', cached.etag);
            res.set('Cache-Control', 'private, max-age=60');
            return res.status(200).json(cached.data);
        }
    }
    
    const pet = await Pet.findById(petId)
      .populate('ownerId', 'name email')
      .lean();

    if (!pet) {
        res.status(404).json({ 
            message: 'Pet not found',
            code: 'PET_NOT_FOUND'
        });
        return;
    }

    // Check access rights
    // Handle both populated and non-populated ownerId
    const petOwnerId = (pet.ownerId && typeof pet.ownerId === 'object' && pet.ownerId._id) 
      ? pet.ownerId._id.toString() 
      : pet.ownerId.toString();
    
    if (req.user.role !== 'admin' && req.user.role !== 'vet' && petOwnerId !== userId) {
        res.status(403).json({ 
            message: 'Not authorized to access this pet',
            code: 'ACCESS_DENIED'
        });
        return;
    }

    // Generate ETag
    const crypto = require('crypto');
    const dataString = JSON.stringify(pet);
    const etag = crypto.createHash('md5').update(dataString).digest('hex');
    
    // Cache result
    petsCache.set(cacheKey, { etag, data: pet, timestamp: Date.now() });

    console.timeEnd(timerLabel);
    res.set('ETag', etag);
    res.status(200).json(pet);
});


// @desc    Create pet
// @route   POST /api/pets
// @access  Private
const createPet = asyncHandler(async (req, res) => {
  // Check authentication
  if (!req.user || !req.user._id) {
    res.status(401);
    throw new Error('Not authenticated. Please log in.');
  }

  if (!req.body.name || !req.body.breed) {
    res.status(400);
    throw new Error('Please add required fields: name and breed');
  }

  // Helper function to safely trim strings
  const safeTrim = (value) => {
    if (!value || typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  };

  // Ensure required fields have defaults if not provided
  const ownerId = req.user._id || req.user.id;
  if (!ownerId || !mongoose.Types.ObjectId.isValid(ownerId)) {
    res.status(400);
    throw new Error('Invalid user ID');
  }
  
  // Convert to string for consistency
  const ownerIdString = ownerId.toString();
  
  // Clear cache for this user's pets
  petsCache.delete(`pets_${ownerIdString}_${req.user.role}`);
  if (req.user.role === 'vet' || req.user.role === 'admin') {
    petsCache.clear();
  }

  const petData = {
    name: (req.body.name && typeof req.body.name === 'string') ? req.body.name.trim() : String(req.body.name || 'New Pet'),
    breed: (req.body.breed && typeof req.body.breed === 'string') ? req.body.breed.trim() : String(req.body.breed || 'Unknown'),
    age: safeTrim(req.body.age) || 'Unknown',
    weight: safeTrim(req.body.weight) || 'Unknown',
    image: req.body.image || '',
    ownerId: ownerIdString, // Use consistent string format
    // Optional fields - only include if they have values
    ...(safeTrim(req.body.gender) && { gender: safeTrim(req.body.gender) }),
    ...(safeTrim(req.body.species) && { species: safeTrim(req.body.species) }),
    ...(safeTrim(req.body.color) && { color: safeTrim(req.body.color) }),
    ...(safeTrim(req.body.microchipNumber) && { microchipNumber: safeTrim(req.body.microchipNumber) }),
    ...(safeTrim(req.body.status) && { status: safeTrim(req.body.status) }),
    ...(safeTrim(req.body.statusColor) && { statusColor: safeTrim(req.body.statusColor) }),
  };

  try {
    const pet = await Pet.create(petData);
    res.status(201).json(pet);
  } catch (error) {
    console.error('Error creating pet:', error);
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message).join(', ');
      res.status(400);
      throw new Error(`Validation error: ${messages}`);
    }
    // Handle duplicate key errors
    if (error.code === 11000) {
      res.status(400);
      throw new Error('Pet with this information already exists');
    }
    // Handle cast errors (invalid ObjectId, etc.)
    if (error.name === 'CastError') {
      res.status(400);
      throw new Error(`Invalid data format: ${error.message}`);
    }
    res.status(500);
    throw new Error(`Failed to create pet: ${error.message}`);
  }
});

// @desc    Update pet
// @route   PUT /api/pets/:id
// @access  Private
const updatePet = asyncHandler(async (req, res) => {
  const timerLabel = `updatePet_${Date.now()}_${Math.random()}`;
  console.time(timerLabel);
  const pet = await Pet.findById(req.params.id).lean();
  
  // Clear cache for this pet's owner
  if (pet && pet.ownerId) {
    const ownerId = pet.ownerId.toString();
    petsCache.delete(`pets_${ownerId}_pet-owner`);
    if (req.user.role === 'vet' || req.user.role === 'admin') {
      petsCache.clear();
    }
  }

  if (!pet) {
    res.status(404);
    throw new Error('Pet not found');
  }

  // Check user
  if (pet.ownerId.toString() !== req.user.id && req.user.role !== 'admin') {
    res.status(401);
    throw new Error('User not authorized');
  }

  const updatedPet = await Pet.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    lean: true
  });

  console.timeEnd(timerLabel);
  res.status(200).json(updatedPet);
});

// @desc    Delete pet
// @route   DELETE /api/pets/:id
// @access  Private
const deletePet = asyncHandler(async (req, res) => {
  const timerLabel = `deletePet_${Date.now()}_${Math.random()}`;
  console.time(timerLabel);
  const pet = await Pet.findById(req.params.id).lean();
  
  // Clear cache for this pet's owner
  if (pet && pet.ownerId) {
    const ownerId = pet.ownerId.toString();
    petsCache.delete(`pets_${ownerId}_pet-owner`);
    if (req.user.role === 'vet' || req.user.role === 'admin') {
      petsCache.clear();
    }
  }

  if (!pet) {
    res.status(404);
    throw new Error('Pet not found');
  }

  // Check user
  if (pet.ownerId.toString() !== req.user.id && req.user.role !== 'admin') {
    res.status(401);
    throw new Error('User not authorized');
  }

  await Pet.deleteOne({ _id: req.params.id });

  console.timeEnd(timerLabel);
  res.status(200).json({ id: req.params.id });
});

// @desc    Get breeding matches (all pets except own)
// @route   GET /api/pets/matches
// @access  Private
const getBreedingMatches = asyncHandler(async (req, res) => {
    const timerLabel = `getBreedingMatches_${Date.now()}_${Math.random()}`;
    console.time(timerLabel);
    const limit = Math.min(parseInt(req.query.limit || '50', 10) || 50, 100);
    const pets = await Pet.find({ ownerId: { $ne: req.user.id } })
      .lean()
      .limit(limit)
      .sort({ createdAt: -1 });
    console.timeEnd(timerLabel);
    res.status(200).json(pets);
});

module.exports = {
  getPets,
  getPetById,
  createPet,
  updatePet,
  deletePet,
  getBreedingMatches,
};
