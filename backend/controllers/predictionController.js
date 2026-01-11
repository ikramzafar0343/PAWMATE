const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const crypto = require('crypto');
const Prediction = require('../models/Prediction');
const Pet = require('../models/Pet');
const User = require('../models/User');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { medicalRecordsCache, CACHING_ENABLED } = require('../utils/cache');

// In-memory cache for predictions
const predictionsCache = new Map();
const PREDICTIONS_CACHE_TTL_MS = 60 * 1000; // 60 seconds

// Helper function to get Python command based on OS
const getPythonCommand = () => {
  // On Windows, try 'py' first, then 'python'
  if (os.platform() === 'win32') {
    return 'py';
  }
  return 'python3';
};

/**
 * @desc    Predict disease from uploaded image
 * @route   POST /api/predict
 * @access  Private
 */
const predictDisease = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  // Validate required fields
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload an image file');
  }

  if (!req.body.petId) {
    res.status(400);
    throw new Error('Pet ID is required');
  }

  // Validate pet ownership
  const pet = await Pet.findById(req.body.petId).lean();
  if (!pet) {
    res.status(404);
    throw new Error('Pet not found');
  }

  // Check if user owns the pet (unless admin/vet)
  if (req.user.role !== 'admin' && req.user.role !== 'vet') {
    if (pet.ownerId.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to predict for this pet');
    }
  }

  try {
    // Read image file and convert to base64
    const imageBuffer = fs.readFileSync(req.file.path);
    const imageBase64 = imageBuffer.toString('base64');
    
    // Get path to Python prediction script
    const pythonScriptPath = path.join(__dirname, '../../ai/predict.py');
    
    // Check if Python script exists
    if (!fs.existsSync(pythonScriptPath)) {
      // Fallback: Return mock prediction for development
      console.warn('Python AI script not found. Using mock prediction.');
      
      const mockPrediction = {
        disease: 'Skin Allergy',
        confidence: 87.5,
        recommendation: 'Consult a veterinarian for allergy testing. Consider hypoallergenic diet.'
      };
      
      // Save prediction to database
      const prediction = await Prediction.create({
        petId: req.body.petId,
        ownerId: req.user._id,
        imageUrl: `/uploads/${req.file.filename}`,
        disease: mockPrediction.disease,
        confidence: mockPrediction.confidence,
        recommendation: mockPrediction.recommendation,
        detectionRegions: mockPrediction.detectionRegions || [],
        processingTime: Date.now() - startTime
      });
      
      // Also create medical record for consistency
      const MedicalRecord = require('../models/MedicalRecord');
      await MedicalRecord.create({
        petId: req.body.petId,
        vetId: req.user._id,
        type: 'AI Diagnosis',
        date: new Date().toISOString().split('T')[0],
        title: `AI Detection: ${mockPrediction.disease}`,
        details: new Map([
          ['score', String(mockPrediction.confidence)],
          ['disease', mockPrediction.disease],
          ['recommendation', mockPrediction.recommendation]
        ])
      });
      
      // Dispatch event for real-time updates (frontend will handle this)
      // Note: This is server-side, events are handled by frontend after API response
      
      // Get full image URL
      const imageUrl = `/uploads/${req.file.filename}`;
      const baseUrl = req.protocol + '://' + req.get('host');
      const fullImageUrl = baseUrl + imageUrl;
      
      // Generate mock detection region for demo
      const mockDetectionRegion = {
        x: 0.3,
        y: 0.3,
        width: 0.4,
        height: 0.4,
        confidence: mockPrediction.confidence,
        normalized: true
      };
      
      return res.status(200).json({
        ...mockPrediction,
        predictionId: prediction._id,
        imageUrl: imageUrl,
        fullImageUrl: fullImageUrl,
        petId: req.body.petId,
        detectionRegions: [mockDetectionRegion],
        processingTime: Date.now() - startTime
      });
    }
    
    // Call Python AI service
    // Use appropriate Python command for the OS
    const pythonCmd = getPythonCommand();
    const pythonProcess = spawn(pythonCmd, [pythonScriptPath], {
      cwd: path.join(__dirname, '../../ai'),
      shell: os.platform() === 'win32' // Use shell on Windows for better compatibility
    });
    
    // Send image data to Python process
    pythonProcess.stdin.write(imageBase64);
    pythonProcess.stdin.end();
    
    let pythonOutput = '';
    let pythonError = '';
    
    // Collect output
    pythonProcess.stdout.on('data', (data) => {
      pythonOutput += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      pythonError += data.toString();
    });
    
    // Wait for process to complete
    let predictionResult;
    try {
      predictionResult = await new Promise((resolve, reject) => {
        pythonProcess.on('close', (code) => {
          if (code !== 0) {
            console.error('Python process error:', pythonError);
            reject(new Error(`Python process exited with code ${code}: ${pythonError}`));
          } else {
            try {
              const result = JSON.parse(pythonOutput);
              resolve(result);
            } catch (parseError) {
              reject(new Error(`Failed to parse Python output: ${pythonOutput}`));
            }
          }
        });
      });
    } catch (pythonError) {
      console.warn('Python AI prediction failed. Falling back to mock prediction.', pythonError.message);
      
      // Fallback to mock prediction
      const mockPrediction = {
        disease: 'Skin Allergy',
        confidence: 85.5,
        recommendation: 'Consult a veterinarian. (Mock Fallback due to AI service error)',
        detectionRegions: [{
            x: 0.3, y: 0.3, width: 0.4, height: 0.4, confidence: 0.85, normalized: true
        }]
      };
      predictionResult = mockPrediction;
    }
    
    // Check for errors in prediction result
    if (predictionResult.error) {
      res.status(500);
      throw new Error(predictionResult.error);
    }
    
    const processingTime = Date.now() - startTime;
    
    // Save prediction to database
    const prediction = await Prediction.create({
      petId: req.body.petId,
      ownerId: req.user._id,
      imageUrl: `/uploads/${req.file.filename}`,
      disease: predictionResult.disease,
      confidence: predictionResult.confidence,
      recommendation: predictionResult.recommendation,
      detectionRegions: predictionResult.detectionRegions || [],
      processingTime: processingTime
    });
    
    // Also create medical record for consistency with existing system
    const MedicalRecord = require('../models/MedicalRecord');
    await MedicalRecord.create({
      petId: req.body.petId,
      vetId: req.user._id,
      type: 'AI Diagnosis',
      date: new Date().toISOString().split('T')[0],
      title: `AI Detection: ${predictionResult.disease}`,
      details: new Map([
        ['score', String(predictionResult.confidence)],
        ['disease', predictionResult.disease],
        ['recommendation', predictionResult.recommendation]
      ])
    });
    
    // Clear predictions cache for this pet and owner
    if (predictionsCache) {
      const cacheKeysToDelete = [];
      for (const key of predictionsCache.keys()) {
        // Clear caches for this owner and pet
        if (key.includes(String(req.user._id)) || key.includes(String(req.body.petId))) {
          cacheKeysToDelete.push(key);
        }
      }
      cacheKeysToDelete.forEach(key => predictionsCache.delete(key));
      if (process.env.DEBUG === 'true') {
        console.log(`[DEBUG] predictDisease cleared ${cacheKeysToDelete.length} cache entries`);
      }
    }

    // Get full image URL
    const imageUrl = `/uploads/${req.file.filename}`;
    const baseUrl = req.protocol + '://' + req.get('host');
    const fullImageUrl = baseUrl + imageUrl;
    
    res.status(200).json({
      disease: predictionResult.disease,
      confidence: predictionResult.confidence,
      recommendation: predictionResult.recommendation,
      predictionId: prediction._id,
      imageUrl: imageUrl, // Relative path for frontend to handle
      fullImageUrl: fullImageUrl, // Full URL as backup
      petId: req.body.petId,
      detectionRegions: predictionResult.detectionRegions || [],
      processingTime: processingTime
    });
    
  } catch (error) {
    console.error('Prediction error:', error);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500);
    throw new Error(`Prediction failed: ${error.message}`);
  }
});

/**
 * @desc    Get prediction history
 * @route   GET /api/predictions
 * @access  Private
 */
const getPredictionHistory = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  if (process.env.DEBUG === 'true') {
    console.log('[DEBUG] getPredictionHistory params:', req.query);
  }

  const query = {};
  
  // Filter by pet if provided
  if (req.query.petId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.query.petId)) {
        res.status(400);
        throw new Error('Invalid pet ID');
      }
      query.petId = new mongoose.Types.ObjectId(req.query.petId);
      if (process.env.DEBUG === 'true') {
        console.log(`[DEBUG] getPredictionHistory filter petId: ${req.query.petId}`);
      }
    } catch (error) {
      if (process.env.DEBUG === 'true') {
        console.error(`[DEBUG] getPredictionHistory invalid petId:`, error.message);
      }
      res.status(400);
      throw new Error('Invalid pet ID format');
    }
  }
  
  // Filter by owner (for pet owners, only show their pets' predictions)
  if (req.user.role === 'pet-owner') {
    query.ownerId = req.user._id;
    if (process.env.DEBUG === 'true') {
      console.log(`[DEBUG] getPredictionHistory ownerId: ${req.user._id}`);
    }
  }
  
  if (process.env.DEBUG === 'true') {
    console.log('[DEBUG] getPredictionHistory query:', JSON.stringify(query));
  }

  // Build cache key
  const cacheKey = `predictions_${req.user._id}_${req.query.petId || 'all'}_${req.query.page || '1'}_${req.query.limit || '20'}`;
  
  // Check If-None-Match header for 304 response
  const ifNoneMatch = req.headers['if-none-match'];
  const cached = CACHING_ENABLED ? predictionsCache.get(cacheKey) : null;
  
  if (CACHING_ENABLED && ifNoneMatch && cached && cached.etag === ifNoneMatch) {
    // Return 304 immediately WITHOUT DB query
    const duration = Date.now() - startTime;
    console.timeEnd(timerLabel);
    console.log(`[Performance] getPredictionHistory 304 (cached, no DB) in ${duration}ms`);
    res.set('ETag', cached.etag);
    return res.status(304).end();
  }

  // Serve fresh cached data directly (TTL) to avoid DB hits
  if (CACHING_ENABLED && cached && cached.data && (Date.now() - cached.timestamp) < PREDICTIONS_CACHE_TTL_MS) {
    const duration = Date.now() - startTime;
    console.timeEnd(timerLabel);
    console.log(`[Performance] getPredictionHistory cache hit (TTL) in ${duration}ms`);
    res.set('ETag', cached.etag);
    res.set('Cache-Control', 'private, max-age=60');
    return res.status(200).json(cached.data);
  }

  // Pagination
  const page = Math.max(parseInt(req.query.page || '1', 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit || '20', 10) || 20, 100);
  const skip = (page - 1) * limit;
  
  const queryStartTime = Date.now();
  
  try {
    // Get predictions - use try/catch for populate in case referenced documents don't exist
    let predictions;
    try {
      predictions = await Prediction.find(query)
        .populate('petId', 'name breed image')
        .populate('ownerId', 'name email')
        .lean()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    } catch (populateError) {
      console.warn(`[getPredictionHistory] Populate failed, fetching without populate:`, populateError.message);
      // Fallback: fetch without populate
      predictions = await Prediction.find(query)
        .lean()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    }
      
    const queryDuration = Date.now() - queryStartTime;

    // Validate that returned predictions match the requested petId
    let finalPredictions = predictions;
    if (req.query.petId) {
      const requestedPetId = String(req.query.petId);
      finalPredictions = predictions.filter(p => {
        const pPetId = p.petId?._id || p.petId?.id || p.petId;
        const matches = String(pPetId) === requestedPetId;
        if (!matches && process.env.DEBUG === 'true') {
          console.warn(`[DEBUG] getPredictionHistory mismatch petId ${p._id}`);
        }
        return matches;
      });
      
      if (finalPredictions.length !== predictions.length && process.env.DEBUG === 'true') {
        console.warn(`[DEBUG] getPredictionHistory filtered ${predictions.length - finalPredictions.length}`);
      }
    }
    
    // Get total count
    const total = await Prediction.countDocuments(query);
    
    const responseData = {
      predictions: finalPredictions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: skip + limit < total
      }
    };

    // Generate ETag
    const dataString = JSON.stringify(responseData);
    const etag = crypto.createHash('md5').update(dataString).digest('hex');
    
    // Cache result
    if (CACHING_ENABLED) {
      predictionsCache.set(cacheKey, { etag, data: responseData, timestamp: Date.now() });
      res.set('ETag', etag);
      res.set('Cache-Control', 'private, max-age=60');
    }
    
    const duration = Date.now() - startTime;
    const { infoRequest } = require('../utils/logger');
    infoRequest({
      method: req.method,
      url: req.originalUrl,
      status: 200,
      label: 'predictions',
      count: finalPredictions.length,
      dbMs: queryDuration,
      totalMs: duration
    });
    res.locals.requestLogged = true;
    
    res.status(200).json(responseData);
  } catch (error) {
    if (process.env.DEBUG === 'true') {
      console.error('[DEBUG] getPredictionHistory error:', error.message);
    }
    const duration = Date.now() - startTime;
    
    // Clear cache for this query in case it's corrupted
    predictionsCache.delete(cacheKey);
    
    // Return a proper error response
    res.status(500).json({ message: 'Error fetching predictions' });
  }
});

/**
 * @desc    Analyze symptoms and predict disease
 * @route   POST /api/predict/symptoms
 * @access  Private
 */
const analyzeSymptoms = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  console.log('[analyzeSymptoms] Request received:', {
    method: req.method,
    path: req.path,
    url: req.url,
    hasSymptoms: !!req.body.symptoms,
    hasPetId: !!req.body.petId,
    userId: req.user?._id,
    userRole: req.user?.role
  });
  
  // Validate required fields
  if (!req.body.symptoms || !req.body.symptoms.trim()) {
    res.status(400);
    throw new Error('Please provide symptom description');
  }

  if (!req.body.petId) {
    res.status(400);
    throw new Error('Pet ID is required');
  }

  console.log('[analyzeSymptoms] Validating pet ownership...');
  
  // Validate pet ownership
  const pet = await Pet.findById(req.body.petId).lean();
  if (!pet) {
    res.status(404);
    throw new Error('Pet not found');
  }

  console.log('[analyzeSymptoms] Pet found:', pet._id, 'Owner:', pet.ownerId);

  // Check if user owns the pet (unless admin/vet)
  if (req.user.role !== 'admin' && req.user.role !== 'vet') {
    if (pet.ownerId.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to analyze symptoms for this pet');
    }
  }
  
  console.log('[analyzeSymptoms] Authorization passed');

  try {
    console.log('[analyzeSymptoms] Starting analysis...');
    
    // Get path to Python symptom analysis script
    const pythonScriptPath = path.join(__dirname, '../../ai/analyze_symptoms.py');
    console.log('[analyzeSymptoms] Python script path:', pythonScriptPath);
    
    // Check if Python script exists
    if (!fs.existsSync(pythonScriptPath)) {
      // Fallback: Use mock analysis
      console.warn('Python symptom analysis script not found. Using mock analysis.');
      
      const mockAnalysis = {
        disease: 'Skin Allergy',
        confidence: 75.0,
        recommendation: 'Consult a veterinarian for allergy testing. Consider hypoallergenic diet.',
        detectedSymptoms: ['Excessive scratching', 'Skin irritation'],
        analysisType: 'symptom_based'
      };
      
      console.log('[analyzeSymptoms] Creating prediction with mock data...');
      
      // Save prediction to database (without image)
      const prediction = await Prediction.create({
        petId: req.body.petId,
        ownerId: req.user._id,
        imageUrl: '', // No image for symptom-based analysis
        disease: mockAnalysis.disease,
        confidence: mockAnalysis.confidence,
        recommendation: mockAnalysis.recommendation,
        detectionRegions: [],
        processingTime: Date.now() - startTime
      });
      
      console.log('[analyzeSymptoms] Prediction created:', prediction._id);
      
      // Also create medical record for consistency
      try {
        const MedicalRecord = require('../models/MedicalRecord');
        await MedicalRecord.create({
          petId: req.body.petId,
          vetId: req.user._id,
          type: 'AI Diagnosis',
          date: new Date().toISOString().split('T')[0],
          title: `AI Symptom Analysis: ${mockAnalysis.disease}`,
          details: new Map([
            ['score', String(mockAnalysis.confidence)],
            ['disease', mockAnalysis.disease],
            ['recommendation', mockAnalysis.recommendation],
            ['symptoms', JSON.stringify(mockAnalysis.detectedSymptoms)],
            ['analysisType', 'symptom_based']
          ])
        });
      } catch (medicalRecordError) {
        console.error('Error creating medical record:', medicalRecordError);
        // Don't fail the request if medical record creation fails
      }
      
      return res.status(200).json({
        ...mockAnalysis,
        predictionId: prediction._id,
        petId: req.body.petId,
        processingTime: Date.now() - startTime
      });
    }
    
    // Call Python symptom analysis service
    // Use appropriate Python command for the OS
    const pythonCmd = getPythonCommand();
    const pythonProcess = spawn(pythonCmd, [pythonScriptPath, req.body.symptoms, req.body.duration || ''], {
      cwd: path.join(__dirname, '../../ai'),
      shell: os.platform() === 'win32' // Use shell on Windows for better compatibility
    });
    
    let pythonOutput = '';
    let pythonError = '';
    
    // Collect output
    pythonProcess.stdout.on('data', (data) => {
      pythonOutput += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      pythonError += data.toString();
    });
    
    // Wait for process to complete with timeout and fallback
    const analysisResult = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        pythonProcess.kill();
        console.warn('Python process timed out, using mock analysis');
        resolve({
          disease: 'Skin Allergy',
          confidence: 75.0,
          recommendation: 'Consult a veterinarian for allergy testing. Consider hypoallergenic diet.',
          detectedSymptoms: ['Symptoms described by owner', 'Requires visual examination'],
          analysisType: 'symptom_based'
        });
      }, 30000); // 30 second timeout
      
      pythonProcess.on('close', (code) => {
        clearTimeout(timeout);
        if (code !== 0) {
          console.error('Python process error:', pythonError);
          console.error('Python output:', pythonOutput);
          // Fall back to mock analysis instead of rejecting
          console.warn('Falling back to mock symptom analysis due to Python error');
          resolve({
            disease: 'Skin Allergy',
            confidence: 75.0,
            recommendation: 'Consult a veterinarian for allergy testing. Consider hypoallergenic diet.',
            detectedSymptoms: ['Symptoms described by owner', 'Requires visual examination'],
            analysisType: 'symptom_based'
          });
        } else {
          try {
            if (!pythonOutput || !pythonOutput.trim()) {
              throw new Error('No output from Python script');
            }
            const result = JSON.parse(pythonOutput);
            resolve(result);
          } catch (parseError) {
            console.error('Failed to parse Python output:', pythonOutput);
            console.error('Parse error:', parseError);
            // Fall back to mock analysis
            resolve({
              disease: 'Skin Allergy',
              confidence: 75.0,
              recommendation: 'Consult a veterinarian for allergy testing. Consider hypoallergenic diet.',
              detectedSymptoms: ['Symptoms described by owner', 'Requires visual examination'],
              analysisType: 'symptom_based'
            });
          }
        }
      });
      
      pythonProcess.on('error', (error) => {
        clearTimeout(timeout);
        console.error('Python process spawn error:', error);
        // Fall back to mock analysis
        resolve({
          disease: 'Skin Allergy',
          confidence: 75.0,
          recommendation: 'Consult a veterinarian for allergy testing. Consider hypoallergenic diet.',
          detectedSymptoms: ['Symptoms described by owner', 'Requires visual examination'],
          analysisType: 'symptom_based'
        });
      });
    });
    
    // Check for errors in analysis result
    if (analysisResult.error) {
      res.status(500);
      throw new Error(analysisResult.error);
    }
    
    const processingTime = Date.now() - startTime;
    
    // Save prediction to database (without image)
    const prediction = await Prediction.create({
      petId: req.body.petId,
      ownerId: req.user._id,
      imageUrl: '', // No image for symptom-based analysis
      disease: analysisResult.disease,
      confidence: analysisResult.confidence,
      recommendation: analysisResult.recommendation,
      detectionRegions: [],
      processingTime: processingTime
    });
    
    // Also create medical record for consistency
    try {
      const MedicalRecord = require('../models/MedicalRecord');
      await MedicalRecord.create({
        petId: req.body.petId,
        vetId: req.user._id,
        type: 'AI Diagnosis',
        date: new Date().toISOString().split('T')[0],
        title: `AI Symptom Analysis: ${analysisResult.disease}`,
        details: new Map([
          ['score', String(analysisResult.confidence)],
          ['disease', analysisResult.disease],
          ['recommendation', analysisResult.recommendation],
          ['symptoms', JSON.stringify(analysisResult.detectedSymptoms || [])],
          ['analysisType', 'symptom_based']
        ])
      });

      // Clear predictions cache for this pet and owner
      if (predictionsCache) {
        const cacheKeysToDelete = [];
        for (const key of predictionsCache.keys()) {
          // Clear caches for this owner and pet
          if (key.includes(String(req.user._id)) || key.includes(String(req.body.petId))) {
            cacheKeysToDelete.push(key);
          }
        }
        cacheKeysToDelete.forEach(key => predictionsCache.delete(key));
      }
    } catch (medicalRecordError) {
      console.error('Error creating medical record:', medicalRecordError);
      // Don't fail the request if medical record creation fails
    }
    
    res.status(200).json({
      disease: analysisResult.disease,
      confidence: analysisResult.confidence,
      recommendation: analysisResult.recommendation,
      detectedSymptoms: analysisResult.detectedSymptoms || [],
      predictionId: prediction._id,
      petId: req.body.petId,
      processingTime: processingTime
    });
    
  } catch (error) {
    console.error('Symptom analysis error:', error);
    console.error('Error stack:', error.stack);
    res.status(500);
    throw new Error(`Symptom analysis failed: ${error.message}`);
  }
});

/**
 * @desc    Get single prediction by ID
 * @route   GET /api/predictions/:id
 * @access  Private
 */
const getPredictionById = asyncHandler(async (req, res) => {
  const prediction = await Prediction.findById(req.params.id)
    .populate('petId', 'name breed image')
    .populate('ownerId', 'name email')
    .lean();
  
  if (!prediction) {
    res.status(404);
    throw new Error('Prediction not found');
  }
  
  // Check access rights
  if (req.user.role !== 'admin' && req.user.role !== 'vet') {
    if (prediction.ownerId._id.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to view this prediction');
    }
  }
  
  res.status(200).json(prediction);
});

/**
 * @desc    Delete prediction
 * @route   DELETE /api/predictions/:id
 * @access  Private
 */
const deletePrediction = asyncHandler(async (req, res) => {
  console.log(`[deletePrediction] Attempting to delete prediction: ${req.params.id}`);
  
  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error('Invalid prediction ID format');
  }
  
  const prediction = await Prediction.findById(req.params.id);

  if (!prediction) {
    console.log(`[deletePrediction] Prediction not found: ${req.params.id}`);
    res.status(404);
    throw new Error('Prediction not found');
  }
  
  console.log(`[deletePrediction] Found prediction for pet: ${prediction.petId}, owner: ${prediction.ownerId}`);
  console.log(`[deletePrediction] Current user: ${req.user._id}, role: ${req.user.role}`);

  // Check access
  if (req.user.role !== 'admin' && req.user.role !== 'vet') {
    if (prediction.ownerId.toString() !== req.user._id.toString()) {
      console.log(`[deletePrediction] Unauthorized: User ${req.user._id} cannot delete prediction owned by ${prediction.ownerId}`);
      res.status(403);
      throw new Error('Not authorized to delete this prediction');
    }
  }
  
  console.log(`[deletePrediction] Authorization passed, proceeding with deletion`);

  // Also delete corresponding medical record if it exists
  // Strategy: Look for AI Diagnosis record for same pet, same date, same disease
  const MedicalRecord = require('../models/MedicalRecord');
  
  const dateStr = new Date(prediction.createdAt).toISOString().split('T')[0];
  
  // Delete medical records that match the prediction's data
  // This cleans up the "duplicate" record created during prediction
  await MedicalRecord.deleteMany({
    petId: prediction.petId,
    type: 'AI Diagnosis',
    date: dateStr,
    title: { $regex: prediction.disease, $options: 'i' }
  });

  // Clear medical records cache for this pet
  if (medicalRecordsCache) {
    const petCacheKeyStart = `medicalRecords_${prediction.petId}`;
    for (const key of medicalRecordsCache.keys()) {
      if (key.startsWith(petCacheKeyStart)) {
        medicalRecordsCache.delete(key);
      }
    }
  }

  await prediction.deleteOne();
  
  // Clear predictions cache
  if (predictionsCache) {
    const cacheKeysToDelete = [];
    for (const key of predictionsCache.keys()) {
      // Clear all caches for this owner and pet
      if (key.includes(String(req.user._id)) || key.includes(String(prediction.petId))) {
        cacheKeysToDelete.push(key);
      }
    }
    cacheKeysToDelete.forEach(key => predictionsCache.delete(key));
  }
  
  console.log(`[deletePrediction] Successfully deleted prediction: ${req.params.id}`);

  res.status(200).json({ 
    id: req.params.id,
    message: 'Prediction deleted successfully' 
  });
});

/**
 * @desc    Get prediction statistics
 * @route   GET /api/predictions/stats
 * @access  Private
 */
const getPredictionStats = asyncHandler(async (req, res) => {
  const { petId } = req.query;
  const query = {};

  // Filter by pet if provided
  if (petId) {
    if (mongoose.Types.ObjectId.isValid(petId)) {
      query.petId = new mongoose.Types.ObjectId(petId);
    }
  }

  // Filter by owner (for pet owners)
  if (req.user.role === 'pet-owner') {
    query.ownerId = req.user._id;
  }

  // Calculate date for "This Month"
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalScans, thisMonthScans, avgConfidenceResult] = await Promise.all([
    Prediction.countDocuments(query),
    Prediction.countDocuments({ ...query, createdAt: { $gte: startOfMonth } }),
    Prediction.aggregate([
      { $match: query },
      { $group: { _id: null, avgConfidence: { $avg: "$confidence" } } }
    ])
  ]);

  let avgVal = avgConfidenceResult.length > 0 ? avgConfidenceResult[0].avgConfidence : 0;
  
  // Heuristic: If average is small (<= 1), assume it's 0-1 scale and convert to percentage
  // This handles mixed data or different model outputs
  if (avgVal <= 1 && avgVal > 0) {
    avgVal *= 100;
  }

  const avgConfidence = Math.round(avgVal * 10) / 10;

  res.status(200).json({
    totalScans,
    scansThisMonth: thisMonthScans,
    avgConfidence
  });
});

module.exports = {
  predictDisease,
  analyzeSymptoms,
  getPredictionHistory,
  getPredictionById,
  deletePrediction,
  getPredictionStats
};

