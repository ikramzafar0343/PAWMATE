const mongoose = require('mongoose');

const medicalRecordSchema = mongoose.Schema({
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
  type: {
    type: String,
    enum: ['Vaccination', 'Treatment', 'Prescription', 'Lab Result', 'Vet Note', 'Breeding', 'AI Diagnosis'],
    required: true,
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true,
  },
  time: {
    type: String,
  },
  title: {
    type: String,
    required: true,
  },
  details: {
    type: Map,
    of: String, // Flexible object for "vaccine", "batchNumber", "dosage", etc.
  },
  attachments: [String], // Array of URLs
}, {
  timestamps: true,
});

// Performance indexes - optimized for common queries
medicalRecordSchema.index({ petId: 1, type: 1, createdAt: -1 }); // Fast pet records by type, newest first (compound)
medicalRecordSchema.index({ petId: 1, createdAt: -1 }); // Fast pet records, newest first
medicalRecordSchema.index({ vetId: 1, createdAt: -1 }); // Fast vet records, newest first
medicalRecordSchema.index({ type: 1, date: -1 }); // Fast type filtering with date

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
