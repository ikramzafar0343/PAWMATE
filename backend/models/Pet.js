const mongoose = require('mongoose');

const petSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  breed: {
    type: String,
    required: true,
  },
  age: {
    type: String, // Storing as string "3 years" or date string
    required: true,
  },
  weight: {
    type: String, // "32 kg"
    required: true,
  },
  image: {
    type: String,
    default: '',
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  // Add other fields that are coming from frontend
  gender: { type: String },
  species: { type: String },
  color: { type: String },
  microchipNumber: { type: String },
  status: { type: String },
  statusColor: { type: String },
}, {
  timestamps: true,
});

// Performance indexes - optimized for common queries
petSchema.index({ ownerId: 1, createdAt: -1 }); // Fast owner's pets, newest first (compound)
petSchema.index({ ownerId: 1 }); // Fast lookup by owner
petSchema.index({ createdAt: -1 }); // Fast sorting by creation date (for admin/vet queries)
petSchema.index({ name: 1 }); // Fast search by name
petSchema.index({ breed: 1 }); // Fast search by breed
// Note: _id is automatically indexed by MongoDB, no need to add it

module.exports = mongoose.model('Pet', petSchema);
