const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['pet-owner', 'vet', 'admin'],
    default: 'pet-owner',
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'suspended'],
    default: 'active',
  },
  image: {
    type: String,
    default: '',
  },
  phone: {
    type: String,
    default: '',
  },
  address: {
    type: String,
    default: '',
  },
  city: {
    type: String,
    default: '',
  },
  zipCode: {
    type: String,
    default: '',
  },
  // Vet specific fields
  specialization: String,
  clinicName: String,
  experience: String,
  availability: {
    type: [mongoose.Schema.Types.Mixed], // Supports both strings (legacy) and objects { start: "HH:mm", end: "HH:mm" }
    default: []
  },
  consultationFees: {
    video: { type: Number, default: 45 },
    chat: { type: Number, default: 30 },
    visit: { type: Number, default: 60 }
  },
}, {
  timestamps: true,
});

// Performance indexes
// userSchema.index({ email: 1 }, { unique: true }); // Removed duplicate index, defined in schema
userSchema.index({ role: 1, status: 1 }); // Fast vet/owner filtering
userSchema.index({ role: 1 }); // Fast role-based queries
// Note: _id is automatically indexed by MongoDB, no need to add it

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre('save', async function () {
  // Skip password hashing if password hasn't been modified
  if (!this.isModified('password')) {
    return;
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', userSchema);
