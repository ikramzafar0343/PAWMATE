const mongoose = require('mongoose');

const listingSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  breed: {
    type: String,
  },
  age: {
    type: String,
    required: true,
  },
  price: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true, // 'For Sale', 'Adoption', 'Product'
  },
  gender: {
    type: String,
  },
  status: {
    type: String,
    default: 'pending', // 'active', 'pending', 'sold'
  },
  image: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Performance indexes
listingSchema.index({ status: 1, createdAt: -1 }); // Fast active listings, newest first
listingSchema.index({ type: 1, status: 1 }); // Fast filtering by type and status
listingSchema.index({ sellerId: 1 }); // Fast seller listings
listingSchema.index({ name: 'text', breed: 'text', location: 'text' }); // Text search index

module.exports = mongoose.model('Listing', listingSchema);
