const mongoose = require('mongoose');

const appointmentSchema = mongoose.Schema({
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
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true,
  },
  time: {
    type: String, // HH:MM AM/PM
    required: true,
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Scheduled',
  },
  reason: {
    type: String,
  },
  type: {
    type: String, // 'General Checkup', etc.
  },
}, {
  timestamps: true,
});

// Performance indexes - optimized for common queries
// Single-field indexes for fast lookups (most common queries)
appointmentSchema.index({ vetId: 1 }); // Fast vet lookup (most common)
appointmentSchema.index({ ownerId: 1 }); // Fast owner lookup (most common)
appointmentSchema.index({ petId: 1 }); // Fast pet lookup
// Compound indexes for filtered queries - ordered for optimal query planning
appointmentSchema.index({ vetId: 1, date: 1 }); // Fast vet appointments by date (for date range queries)
appointmentSchema.index({ ownerId: 1, date: 1 }); // Fast owner appointments by date (for date range queries)
appointmentSchema.index({ vetId: 1, date: 1, time: 1 }); // Fast vet appointments by date/time (compound)
appointmentSchema.index({ ownerId: 1, date: 1, time: 1 }); // Fast owner appointments by date/time (compound)
appointmentSchema.index({ date: 1, time: 1 }); // Fast date/time sorting (for date range queries without vetId/ownerId)
appointmentSchema.index({ petId: 1, date: -1 }); // Fast pet appointments, newest first
appointmentSchema.index({ status: 1, date: 1 }); // Fast status filtering with date
appointmentSchema.index({ createdAt: -1 }); // Fast sorting by creation date

module.exports = mongoose.model('Appointment', appointmentSchema);
