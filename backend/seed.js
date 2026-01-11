const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');
const Pet = require('./models/Pet');

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pawmate');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    console.log('\n⚠️  MongoDB is not running. Please:');
    console.log('1. Start MongoDB locally, OR');
    console.log('2. Update MONGO_URI in .env to use MongoDB Atlas, OR');
    console.log('3. The server will use in-memory database as fallback');
    
    // Try in-memory database as fallback
    try {
      console.log('\nAttempting to start In-Memory MongoDB...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      
      console.log(`In-Memory MongoDB started at ${uri}`);
      const conn = await mongoose.connect(uri);
      console.log(`MongoDB Connected (In-Memory): ${conn.connection.host}`);
    } catch (memError) {
      console.error(`Failed to start In-Memory MongoDB: ${memError.message}`);
      console.log('\nPlease start MongoDB and try again.');
      process.exit(1);
    }
  }
};

const seedUsers = async () => {
  try {
    // Clear existing users (optional - comment out if you want to keep existing data)
    // await User.deleteMany({});

    // Create demo users
    const users = [
      {
        name: 'Pet Owner',
        email: 'owner@pawmate.com',
        password: 'password123',
        role: 'pet-owner',
        status: 'active'
      },
      {
        name: 'Dr. Sarah Johnson',
        email: 'vet@pawmate.com',
        password: 'password123',
        role: 'vet',
        status: 'active',
        specialization: 'General Practice',
        clinicName: 'Sunshine Animal Hospital',
        experience: '10 years'
      },
      {
        name: 'Admin User',
        email: 'admin@pawmate.com',
        password: 'password123',
        role: 'admin',
        status: 'active'
      }
    ];

    for (const userData of users) {
      const existingUser = await User.findOne({ email: userData.email });
      
      if (!existingUser) {
        // Hash password
        const salt = await bcrypt.genSalt(10);
        userData.password = await bcrypt.hash(userData.password, salt);
        
        const user = await User.create(userData);
        console.log(`✓ Created user: ${user.email} (${user.role})`);
        
        // Create a sample pet for the pet owner
        if (user.role === 'pet-owner') {
          const existingPet = await Pet.findOne({ ownerId: user._id, name: 'Max' });
          if (!existingPet) {
            await Pet.create({
              name: 'Max',
              breed: 'Golden Retriever',
              age: '3 years',
              weight: '32 kg',
              image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80',
              ownerId: user._id
            });
            console.log(`✓ Created sample pet: Max for ${user.email}`);
          }
        }
      } else {
        console.log(`- User already exists: ${userData.email}`);
      }
    }

    console.log('\n✅ Seeding completed!');
    console.log('\nDemo credentials:');
    console.log('Pet Owner: owner@pawmate.com / password123');
    console.log('Vet: vet@pawmate.com / password123');
    console.log('Admin: admin@pawmate.com / password123');
  } catch (error) {
    console.error('Error seeding users:', error);
  }
};

const runSeed = async () => {
  await connectDB();
  await seedUsers();
  process.exit(0);
};

runSeed();

