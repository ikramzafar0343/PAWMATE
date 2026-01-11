const mongoose = require('mongoose');

const medicineSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    default: '',
  },
  recommendedBy: {
    type: String,
    enum: ['Vet', 'AI', 'Both'],
    default: 'Vet',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Medicine', medicineSchema);

