const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;

    // 🔒 Enforce MongoDB Atlas usage only
    if (!mongoUri) {
      throw new Error(
        'MONGO_URI is missing.\n' +
        'Set it in backend/.env as:\n' +
        'mongodb+srv://PAWMATE:<PASSWORD>@pawmate.rwfkdpr.mongodb.net/pawmate?retryWrites=true&w=majority'
      );
    }

    if (!mongoUri.startsWith('mongodb+srv://')) {
      throw new Error('Only MongoDB Atlas (mongodb+srv://) is supported.');
    }

    // ✅ Atlas-optimized options for better performance
    const options = {
      serverSelectionTimeoutMS: 10000, // Increased for better reliability
      socketTimeoutMS: 45000, // Standard timeout
      maxPoolSize: 50, // Increased connection pool for better concurrency
      minPoolSize: 10, // Keep more connections ready
      retryWrites: true,
      w: 'majority',
      tls: true,
      // Connection pool settings
      maxIdleTimeMS: 30000, // Close connections after 30s of inactivity
      heartbeatFrequencyMS: 10000, // Check connection health every 10s
      // Performance optimizations
      compressors: ['zlib'], // Enable compression for faster data transfer
      zlibCompressionLevel: 6, // Balance between speed and compression
    };

    // 🔌 Connect with optimized settings
    await mongoose.connect(mongoUri, options);

    console.log('[INFO] MongoDB Atlas connected');

    // 📊 Ensure critical indexes exist (idempotent - safe to run multiple times)
    try {
      const db = mongoose.connection.db;
      const collections = {
        pets: db.collection('pets'),
        appointments: db.collection('appointments'),
        medicalrecords: db.collection('medicalrecords'),
        listings: db.collection('listings'),
        messages: db.collection('messages'),
        prescriptions: db.collection('prescriptions'),
        users: db.collection('users')
      };

      // Create indexes if they don't exist (critical for performance)
      // Pet indexes
      await collections.pets.createIndex({ ownerId: 1, createdAt: -1 }, { background: true });
      await collections.pets.createIndex({ ownerId: 1 }, { background: true });
      
      // Appointment indexes - critical for fast queries
      await collections.appointments.createIndex({ ownerId: 1, date: 1, time: 1 }, { background: true });
      await collections.appointments.createIndex({ ownerId: 1 }, { background: true }); // Single field index for ownerId queries
      await collections.appointments.createIndex({ vetId: 1, date: 1, time: 1 }, { background: true });
      await collections.appointments.createIndex({ petId: 1, date: -1 }, { background: true });
      await collections.appointments.createIndex({ status: 1, date: 1 }, { background: true });
      await collections.appointments.createIndex({ date: 1, time: 1 }, { background: true });
      
      // Medical record indexes
      await collections.medicalrecords.createIndex({ petId: 1, type: 1, createdAt: -1 }, { background: true });
      await collections.medicalrecords.createIndex({ petId: 1, createdAt: -1 }, { background: true });
      
      // Listing indexes - critical for marketplace performance
      await collections.listings.createIndex({ status: 1, createdAt: -1 }, { background: true });
      await collections.listings.createIndex({ type: 1, status: 1 }, { background: true });
      await collections.listings.createIndex({ sellerId: 1 }, { background: true });
      
      // Messages indexes - optimize conversation fetch and sort
      await collections.messages.createIndex({ sender: 1, receiver: 1, createdAt: 1 }, { background: true });
      await collections.messages.createIndex({ receiver: 1, sender: 1, createdAt: 1 }, { background: true });
      await collections.messages.createIndex({ conversationId: 1, createdAt: 1 }, { background: true });
      
      // Prescriptions indexes - optimize by vet/pet and time
      await collections.prescriptions.createIndex({ vetId: 1, createdAt: -1 }, { background: true });
      await collections.prescriptions.createIndex({ petId: 1, status: 1, createdAt: -1 }, { background: true });
      
      // Users indexes - optimize vets listing
      await collections.users.createIndex({ role: 1, status: 1, name: 1 }, { background: true });
      
      if (process.env.DEBUG === 'true') {
        console.log('[DEBUG] Indexes verified/created');
      }
    } catch (indexError) {
      // Index creation is idempotent, but log if there's an issue
      if (process.env.DEBUG === 'true') {
        console.warn('[DEBUG] Index creation warning:', indexError.message);
      }
    }

    // 🩺 Connection health monitoring
    mongoose.connection.on('error', (err) => {
      console.error('[ERROR] MongoDB error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[WARN] MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('[INFO] MongoDB reconnected');
    });

  } catch (error) {
    console.error('[ERROR] MongoDB connection failed:', error.message);

    console.error(`
Fix checklist:
1. Verify username/password in MongoDB Atlas
2. URL-encode special characters in password:
   @=%40  #=%23  $=%24  %=%25  &=%26  /=%2F
3. Ensure IP Whitelist includes your server IP (0.0.0.0/0 for testing)
4. Example .env value:

MONGO_URI=mongodb+srv://PAWMATE:ENCODED_PASSWORD@pawmate.rwfkdpr.mongodb.net/pawmate?retryWrites=true&w=majority
    `);

    process.exit(1);
  }
};

module.exports = connectDB;
