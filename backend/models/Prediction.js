const mongoose = require('mongoose');

/**
 * Prediction Schema for AI Disease Detection
 * Stores results from AI model predictions
 */
const predictionSchema = mongoose.Schema({
  // Pet reference
  petId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Pet',
    index: true
  },
  
  // Owner reference
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    index: true
  },
  
  // Image information (optional for symptom-based analysis)
  imageUrl: {
    type: String,
    required: false,
    default: ''
  },
  
  // AI Prediction Results
  disease: {
    type: String,
    required: true,
    enum: [
      'Healthy',
      'Skin Allergy',
      'Flea Infestation',
      'Ringworm',
      'Hot Spots',
      'Mange',
      'Ear Infection',
      'Dermatitis',
      'Unknown'
    ]
  },
  
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  
  recommendation: {
    type: String,
    required: true
  },
  
  // Additional metadata
  modelVersion: {
    type: String,
    default: '1.0'
  },
  
  processingTime: {
    type: Number, // in milliseconds
    default: 0
  },
  
  // Detection regions (bounding boxes) where disease was detected
  detectionRegions: [{
    x: Number, // X coordinate (0-1 normalized or pixels)
    y: Number, // Y coordinate (0-1 normalized or pixels)
    width: Number, // Width (0-1 normalized or pixels)
    height: Number, // Height (0-1 normalized or pixels)
    confidence: Number, // Confidence for this specific region
    normalized: { type: Boolean, default: true } // Whether coordinates are normalized (0-1)
  }]
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Indexes for performance
predictionSchema.index({ petId: 1, createdAt: -1 }); // Fast queries by pet, newest first
predictionSchema.index({ ownerId: 1, createdAt: -1 }); // Fast queries by owner
predictionSchema.index({ disease: 1 }); // Fast filtering by disease type

module.exports = mongoose.model('Prediction', predictionSchema);

