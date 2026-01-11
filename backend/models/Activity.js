const mongoose = require('mongoose');

const activitySchema = mongoose.Schema({
  type: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    default: 'blue',
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  metadata: {
    type: Map,
    of: String,
    default: {},
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Activity', activitySchema);
