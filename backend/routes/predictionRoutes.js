const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/authMiddleware');
const {
  predictDisease,
  analyzeSymptoms,
  getPredictionHistory,
  getPredictionById,
  deletePrediction,
  getPredictionStats
} = require('../controllers/predictionController');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'prediction-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|heic|heif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (JPG, PNG, HEIC)'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  },
  fileFilter: fileFilter
});

// All routes require authentication
router.use(protect);

// POST routes for prediction
// IMPORTANT: Specific routes must come before parameterized routes

/**
 * @swagger
 * /predictions/symptoms:
 *   post:
 *     summary: Analyze symptoms
 *     tags: [Predictions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               symptoms:
 *                 type: string
 *     responses:
 *       200:
 *         description: Analysis result
 */
// POST /api/predict/symptoms - Analyze symptoms text (must be before /:id)
router.post('/symptoms', (req, res, next) => {
  console.log('[ROUTE DEBUG] /symptoms route hit!', {
    method: req.method,
    path: req.path,
    url: req.url,
    originalUrl: req.originalUrl,
    body: req.body
  });
  next();
}, analyzeSymptoms);

/**
 * @swagger
 * /predictions:
 *   post:
 *     summary: Predict disease from image
 *     tags: [Predictions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Prediction result
 *   get:
 *     summary: Get prediction history
 *     tags: [Predictions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Prediction history
 */
// POST /api/predict - Main endpoint (when mounted at /api/predict, router.post('/') handles it)
// POST /api/predictions/predict - Alternative endpoint
router.post('/', upload.single('image'), predictDisease);
router.post('/predict', upload.single('image'), predictDisease);

/**
 * @swagger
 * /predictions/stats:
 *   get:
 *     summary: Get prediction statistics
 *     tags: [Predictions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Prediction statistics
 */
// GET /api/predictions/stats - Get prediction stats
// IMPORTANT: Must be before /:id routes
router.get('/stats', getPredictionStats);

// GET routes for history (only work when mounted at /api/predictions)
// GET /api/predictions - Get prediction history
router.get('/', getPredictionHistory);

/**
 * @swagger
 * /predictions/{id}:
 *   delete:
 *     summary: Delete prediction
 *     tags: [Predictions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Prediction deleted
 *   get:
 *     summary: Get prediction by ID
 *     tags: [Predictions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Prediction details
 */
// DELETE /api/predictions/:id - Delete prediction
// IMPORTANT: Must be before GET /:id to avoid route conflicts
router.delete('/:id', (req, res, next) => {
  console.log('[ROUTE DEBUG] DELETE /:id route hit!', {
    method: req.method,
    path: req.path,
    url: req.url,
    params: req.params
  });
  next();
}, deletePrediction);

// GET /api/predictions/:id - Get single prediction
// Must be last to avoid conflicts with other routes
router.get('/:id', getPredictionById);

module.exports = router;

