const mongoose = require('mongoose');

const reportSchema = mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  reportsCount: {
    type: Number,
    default: 1,
  },
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium',
  },
  status: {
    type: String,
    enum: ['pending', 'resolved'],
    default: 'pending',
  },
  image: {
    type: String,
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'targetType',
  },
  targetType: {
    type: String,
    enum: ['Listing', 'User', 'Pet'],
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Report', reportSchema);
