const mongoose = require('mongoose');

const prescriptionSchema = mongoose.Schema({
  petId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Pet',
  },
  vetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  medication: {
    type: String,
    required: true,
  },
  dosage: {
    type: String,
    required: true, // e.g., "2x Daily"
  },
  duration: {
    type: String,
    required: true, // e.g., "7 Days"
  },
  instructions: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled'],
    default: 'pending', // New prescriptions start as pending, require approval before becoming active
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true,
  },
}, {
  timestamps: true,
});

// Performance indexes - optimized for prescription queries
prescriptionSchema.index({ petId: 1, status: 1, createdAt: -1 }); // Fast pet prescriptions by status, newest first
prescriptionSchema.index({ vetId: 1, createdAt: -1 }); // Fast vet prescriptions, newest first
prescriptionSchema.index({ petId: 1, createdAt: -1 }); // Fast pet prescriptions, newest first
prescriptionSchema.index({ status: 1, createdAt: -1 }); // Fast status filtering with date
prescriptionSchema.index({ createdAt: -1 }); // Fast sorting by creation date

module.exports = mongoose.model('Prescription', prescriptionSchema);

