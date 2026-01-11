const User = require('../models/User');
const Pet = require('../models/Pet');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
  try {
    // Check if users already exist
    const userCount = await User.countDocuments();
    
    if (userCount > 0) {
      return; // Skip seeding silently if users exist
    }

    // Seed database silently

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

    const createdUsers = [];

    for (const userData of users) {
      // Let the User model pre-save hook handle the hashing
      const user = await User.create(userData);
      
      createdUsers.push(user);
      
      // Create a sample pet for the pet owner
      if (user.role === 'pet-owner') {
        await Pet.create({
          name: 'Max',
          breed: 'Golden Retriever',
          age: '3 years',
          weight: '32 kg',
          image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80',
          ownerId: user._id
        });
      }
    }
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
  }
};

module.exports = seedDatabase;

