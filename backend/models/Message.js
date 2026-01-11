const mongoose = require('mongoose');

const messageSchema = mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  participants: {
    type: [mongoose.Schema.Types.ObjectId],
    index: true,
    default: [],
  },
  conversationId: {
    type: String,
    index: true,
    default: '',
  },
  content: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'prescription'],
    default: 'text',
  },
  fileUrl: {
    type: String,
    default: '',
  },
  fileSize: {
    type: String,
    default: '',
  },
  base64: {
    type: String,
    default: '',
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    default: null,
  },
  read: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Performance indexes - optimized for message queries
// Compound indexes for the $or query pattern (sender/receiver lookups)
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 }); // Fast conversation lookup, newest first
messageSchema.index({ receiver: 1, sender: 1, createdAt: -1 }); // Fast reverse conversation lookup
messageSchema.index({ sender: 1, createdAt: -1 }); // Fast sender messages, newest first
messageSchema.index({ receiver: 1, createdAt: -1 }); // Fast receiver messages, newest first
messageSchema.index({ createdAt: -1 }); // Fast sorting by creation date
messageSchema.index({ read: 1, receiver: 1 }); // Fast unread messages lookup
messageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
