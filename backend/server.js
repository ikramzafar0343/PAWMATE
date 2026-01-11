const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const seedDatabase = require('./utils/seedDatabase');
const cacheService = require('./utils/cacheService');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

// Suppress dotenv banner logs
const _origLog = console.log;
console.log = (...args) => {
  if (args[0] && typeof args[0] === 'string' && args[0].includes('[dotenv@')) return;
  _origLog(...args);
};
dotenv.config();
console.log = _origLog;

const app = express();

// Connect to database BEFORE starting server
// This ensures database is ready before handling requests
let server;

const startServer = async () => {
  try {
    // Wait for database connection
    await connectDB();
    
    // Seed database after connection
    setTimeout(() => {
      seedDatabase();
    }, 500);
    
    // Start server only after DB connection is established
    const PORT = process.env.PORT || 5000;
    server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

// ==================== MIDDLEWARE STACK (Optimized Order) ====================

// 1. Compression - Should be first to compress all responses
app.use(compression({
  level: 6, // Balance between compression and CPU (1-9)
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use compression for all other responses
    return compression.filter(req, res);
  }
}));

// 2. CORS - Before parsing body
const isProd = process.env.NODE_ENV === 'production';
let allowedOrigin = process.env.FRONTEND_URL || 'https://pawmate-frontend.onrender.com';
if (allowedOrigin && !allowedOrigin.startsWith('http')) {
  allowedOrigin = `https://${allowedOrigin}`;
}
if (!isProd && process.env.FRONTEND_URL === undefined) {
  allowedOrigin = 'http://localhost:5173';
}
app.use(cors({ origin: allowedOrigin, credentials: true, maxAge: 86400 }));

// 3. Rate Limiting - Protect against abuse
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Limit each IP
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/' || req.path === '/health';
  }
});
app.use('/api/', limiter);

// 4. Body Parsing - Optimized limits (reduce from 50MB)
app.use(express.json({ 
  limit: '10mb', // Reduced from 50mb - use streaming for larger files
  verify: (req, res, buf, encoding) => {
    // Optional: Add body validation here
  }
}));
app.use(express.urlencoded({ 
  limit: '10mb', // Reduced from 50mb
  extended: true,
  parameterLimit: 100 // Limit number of parameters
}));

// 5. Request logging and performance middleware
app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  if (req.method === 'GET') {
    res.set('Cache-Control', 'private, max-age=5');
  }
  res.on('finish', () => {
    const duration = Number(process.hrtime.bigint() - start) / 1e6;
    if (!res.locals || !res.locals.requestLogged) {
      if (isProd) {
        if (res.statusCode >= 400) {
          console.log(`[WARN] ${req.method} ${req.originalUrl} → ${res.statusCode}, ${duration.toFixed(0)}ms`);
        }
      } else {
        console.log(`[INFO] ${req.method} ${req.originalUrl} → ${res.statusCode}, total: ${duration.toFixed(0)}ms`);
      }
    }
  });
  next();
});

// Serve uploaded files statically
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/pets', require('./routes/petRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/medical-records', require('./routes/medicalRecordRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/listings', require('./routes/listingRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/prescriptions', require('./routes/prescriptionRoutes'));
app.use('/api/medicines', require('./routes/medicineRoutes'));
app.use('/api/activities', require('./routes/activityRoutes'));
app.use('/api/consultations', require('./routes/consultationRoutes'));
// Prediction routes
const predictionRouter = require('./routes/predictionRoutes');
const { protect } = require('./middleware/authMiddleware');
const { analyzeSymptoms } = require('./controllers/predictionController');

app.use('/api/predictions', predictionRouter);
// Mount same router at /api/predict - router handles POST / and GET routes appropriately
app.use('/api/predict', predictionRouter);

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'PAWMATE API',
    version: '1.0.0',
    description: 'API documentation for PAWMATE backend',
  },
  servers: [
    { url: `${process.env.RENDER_EXTERNAL_URL || 'http://localhost:5000'}/api` }
  ],
  components: {
    schemas: {
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          role: { type: 'string', enum: ['pet-owner', 'vet', 'admin'] }
        },
        required: ['name', 'email', 'role']
      },
      Pet: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          ownerId: { type: 'string' },
          name: { type: 'string' },
          species: { type: 'string' }
        },
        required: ['ownerId', 'name']
      },
      Appointment: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          ownerId: { type: 'string' },
          vetId: { type: 'string' },
          petId: { type: 'string' },
          date: { type: 'string' },
          time: { type: 'string' },
          status: { type: 'string' }
        }
      },
      MedicalRecord: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          petId: { type: 'string' },
          type: { type: 'string' },
          date: { type: 'string' },
          title: { type: 'string' }
        }
      },
      Listing: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          title: { type: 'string' },
          status: { type: 'string' }
        }
      },
      Prescription: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          petId: { type: 'string' },
          vetId: { type: 'string' },
          medicines: { 
            type: 'array',
            items: {
              type: 'object',
              properties: {
                medicine: { type: 'string' },
                dosage: { type: 'string' },
                frequency: { type: 'string' },
                duration: { type: 'string' }
              }
            }
          },
          status: { type: 'string', enum: ['active', 'completed', 'cancelled'] }
        }
      },
      Medicine: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          stock: { type: 'number' },
          price: { type: 'number' }
        }
      },
      Report: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          reporterId: { type: 'string' },
          targetId: { type: 'string' },
          type: { type: 'string' },
          description: { type: 'string' },
          status: { type: 'string', enum: ['pending', 'resolved'] }
        }
      },
      Activity: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          userId: { type: 'string' },
          type: { type: 'string' },
          description: { type: 'string' },
          createdAt: { type: 'string' }
        }
      },
      Prediction: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          petId: { type: 'string' },
          disease: { type: 'string' },
          confidence: { type: 'number' }
        }
      },
      AuthResponse: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          role: { type: 'string' },
          token: { type: 'string' }
        }
      }
    }
  },
  paths: {
    '/auth/login': {
      post: {
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' }
                },
                required: ['email', 'password']
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Login successful',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } }
          }
        }
      }
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                  password: { type: 'string' },
                  role: { type: 'string' }
                },
                required: ['name', 'email', 'password']
              }
            }
          }
        },
        responses: {
          201: {
            description: 'User registered',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } }
          }
        }
      }
    }
  }
};

const swaggerSpec = swaggerJsdoc({ 
  definition: swaggerDefinition, 
  apis: ['./routes/*.js', './controllers/*.js'] // Scan routes and controllers for docs
});
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { 
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }', // Cleaner look
  customSiteTitle: "PAWMATE API Documentation"
}));
// Also register /symptoms route directly as a fallback (for debugging)
// This ensures the route is definitely available
// NOTE: Commented out to avoid duplicate route handling - router should handle it
// app.post('/api/predict/symptoms', protect, async (req, res, next) => {
//   console.log('[DIRECT ROUTE] /api/predict/symptoms hit directly!');
//   try {
//     await analyzeSymptoms(req, res, next);
//   } catch (error) {
//     console.error('[DIRECT ROUTE] Error in analyzeSymptoms:', error);
//     if (!res.headersSent) {
//       res.status(500).json({ 
//         message: error.message || 'Symptom analysis failed',
//         error: process.env.NODE_ENV !== 'production' ? error.stack : undefined
//       });
//     }
//   }
// });

// Debug: Log all registered routes
if (process.env.DEBUG === 'true') {
  console.log('[DEBUG] Routes registered: /api/predict(s)/symptoms, /api/predict, /api/predictions');
}

// Health check endpoint (no rate limiting)
app.get('/', (req, res) => {
  res.redirect('/api/docs');
});

app.get('/status', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'PAWMATE API is running',
    timestamp: new Date().toISOString(),
    cache: cacheService.getStats()
  });
});

app.get('/health', (req, res) => {
  const dbStatus = require('mongoose').connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    status: 'ok',
    database: dbStatus,
    cache: cacheService.getStats(),
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      external: Math.round(process.memoryUsage().external / 1024 / 1024)
    }
  });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  
  // Log error for debugging with full details
  console.error('❌ Error Handler:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  res.json({
    message: err.message || 'Server Error',
    error: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

// Server is started in startServer() function above
