const asyncHandler = require('express-async-handler');
const Medicine = require('../models/Medicine');

// @desc    Get all medicines
// @route   GET /api/medicines
// @access  Public (or Private if needed)
const getMedicines = asyncHandler(async (req, res) => {
  const query = { isActive: true };
  
  if (req.query.category) {
    query.category = req.query.category;
  }
  
  if (req.query.recommendedBy) {
    query.recommendedBy = req.query.recommendedBy;
  }

  const medicines = await Medicine.find(query).sort({ name: 1 });
  res.status(200).json(medicines);
});

// @desc    Get medicine by ID
// @route   GET /api/medicines/:id
// @access  Public
const getMedicineById = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findById(req.params.id);

  if (!medicine) {
    res.status(404);
    throw new Error('Medicine not found');
  }

  res.status(200).json(medicine);
});

// @desc    Create medicine
// @route   POST /api/medicines
// @access  Private (Admin/Vet)
const createMedicine = asyncHandler(async (req, res) => {
  const { name, category, description, price, image, recommendedBy } = req.body;

  if (!name || !category || !description || !price) {
    res.status(400);
    throw new Error('Please add all required fields');
  }

  const medicine = await Medicine.create({
    name,
    category,
    description,
    price,
    image: image || '',
    recommendedBy: recommendedBy || 'Vet',
    isActive: true
  });

  res.status(201).json(medicine);
});

// @desc    Update medicine
// @route   PUT /api/medicines/:id
// @access  Private (Admin/Vet)
const updateMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findById(req.params.id);

  if (!medicine) {
    res.status(404);
    throw new Error('Medicine not found');
  }

  const updated = await Medicine.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  res.status(200).json(updated);
});

// @desc    Delete medicine
// @route   DELETE /api/medicines/:id
// @access  Private (Admin)
const deleteMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findById(req.params.id);

  if (!medicine) {
    res.status(404);
    throw new Error('Medicine not found');
  }

  // Soft delete
  medicine.isActive = false;
  await medicine.save();

  res.status(200).json({ id: req.params.id });
});

module.exports = {
  getMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
};

