const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { protect } = require('../middleware/authMiddleware');
const fs = require('fs');
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer (Storage on disk temporarily)
const storage = multer.diskStorage({
  destination(req, file, cb) {
    const uploadPath = 'uploads/';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)){
        fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename(req, file, cb) {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const checkFileType = (file, cb) => {
  // Allow images and webp format
  const filetypes = /jpg|jpeg|png|gif|webp|pdf|doc|docx/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype) || file.mimetype.startsWith('image/');

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Images and Documents only! (JPG, PNG, GIF, WEBP, PDF, DOC, DOCX)'));
  }
};

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

// @desc    Upload file to Cloudinary
// @route   POST /api/upload
// @access  Private
/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Upload a file (image/doc)
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                 public_id:
 *                   type: string
 *                 format:
 *                   type: string
 *                 resource_type:
 *                   type: string
 */
router.post('/', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Check if Cloudinary is configured
    const hasCloudinaryConfig = 
      process.env.CLOUDINARY_CLOUD_NAME && 
      process.env.CLOUDINARY_API_KEY && 
      process.env.CLOUDINARY_API_SECRET;

    if (!hasCloudinaryConfig) {
      if (process.env.NODE_ENV === 'production') {
        // Strict in production: require Cloudinary configuration
        if (req.file?.path) {
          try { fs.unlinkSync(req.file.path); } catch {}
        }
        return res.status(500).json({ message: 'Cloudinary not configured' });
      }
      console.warn('[Upload] Cloudinary not configured (dev), using base64 fallback');
      const fileBuffer = fs.readFileSync(req.file.path);
      const base64 = fileBuffer.toString('base64');
      const mimeType = req.file.mimetype;
      const dataUrl = `data:${mimeType};base64,${base64}`;
      fs.unlinkSync(req.file.path);
      return res.json({
        url: dataUrl,
        public_id: null,
        format: req.file.mimetype.split('/')[1],
        resource_type: 'image',
        isBase64: true
      });
    }

    // Upload to Cloudinary
    try {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'pawmate',
        resource_type: 'auto'
      });

      // Remove file from local storage
      fs.unlinkSync(req.file.path);

      res.json({
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        resource_type: result.resource_type,
        isBase64: false
      });
    } catch (cloudinaryError) {
      console.error('[Upload] Cloudinary error:', cloudinaryError);
      if (process.env.NODE_ENV === 'production') {
        // Strict in production: do not fallback to base64
        if (req.file?.path) {
          try { fs.unlinkSync(req.file.path); } catch {}
        }
        return res.status(500).json({ message: 'Image upload failed' });
      }
      console.warn('[Upload] Cloudinary upload failed (dev), using base64 fallback');
      const fileBuffer = fs.readFileSync(req.file.path);
      const base64 = fileBuffer.toString('base64');
      const mimeType = req.file.mimetype;
      const dataUrl = `data:${mimeType};base64,${base64}`;
      fs.unlinkSync(req.file.path);
      res.json({
        url: dataUrl,
        public_id: null,
        format: req.file.mimetype.split('/')[1],
        resource_type: 'image',
        isBase64: true
      });
    }
  } catch (error) {
    console.error('[Upload] Error:', error);
    // Try to remove file if upload failed
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('[Upload] Failed to remove temp file:', unlinkError);
      }
    }
    res.status(500).json({ 
      message: 'Image upload failed', 
      error: error.message,
      details: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
});

module.exports = router;
