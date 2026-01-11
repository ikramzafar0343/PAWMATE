const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  let query = {};
  
  // Filter by role if provided
  if (req.query.role) {
    query.role = req.query.role;
  }
  
  // Filter by status if provided
  if (req.query.status) {
    query.status = req.query.status;
  }
  
  const users = await User.find(query).select('-password');
  res.json(users);
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private
const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update current user profile
// @route   PUT /api/users/me
// @access  Private
const updateCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (user) {
    // Check if email is being updated and already exists
    if (req.body.email && req.body.email !== user.email) {
      const userExists = await User.findOne({ email: req.body.email });
      if (userExists) {
        res.status(400);
        throw new Error('Email already in use');
      }
    }

    // Basic fields
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
    user.address = req.body.address !== undefined ? req.body.address : user.address;
    user.city = req.body.city !== undefined ? req.body.city : user.city;
    user.zipCode = req.body.zipCode !== undefined ? req.body.zipCode : user.zipCode;
    user.image = req.body.image !== undefined ? req.body.image : user.image;

    // Vet-specific fields
    if (user.role === 'vet') {
      user.specialization = req.body.specialization !== undefined ? req.body.specialization : user.specialization;
      user.clinicName = req.body.clinicName !== undefined ? req.body.clinicName : user.clinicName;
      user.experience = req.body.experience !== undefined ? req.body.experience : user.experience;
      user.availability = req.body.availability !== undefined ? req.body.availability : user.availability;
      
      // Update consultation fees if provided
      if (req.body.consultationFees) {
        user.consultationFees = {
          ...user.consultationFees,
          ...req.body.consultationFees
        };
      }
    }

    try {
      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
        image: updatedUser.image,
        specialization: updatedUser.specialization,
        clinicName: updatedUser.clinicName,
        experience: updatedUser.experience,
        availability: updatedUser.availability,
        phone: updatedUser.phone,
        address: updatedUser.address,
        city: updatedUser.city,
        zipCode: updatedUser.zipCode,
        consultationFees: updatedUser.consultationFees
      });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(400);
      throw new Error(error.message || 'Invalid user data');
    }
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    if (user.role === 'admin') {
      if (req.body.status && req.body.status !== user.status) {
        res.status(400);
        throw new Error('Cannot change admin status');
      }
      if (req.body.role && req.body.role !== 'admin') {
        res.status(400);
        throw new Error('Cannot change admin role');
      }
    }
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.role = req.body.role || user.role;
    user.status = req.body.status || user.status;
    
    // Vet-specific fields
    if (user.role === 'vet' || req.body.role === 'vet') {
      user.specialization = req.body.specialization !== undefined ? req.body.specialization : user.specialization;
      user.clinicName = req.body.clinicName !== undefined ? req.body.clinicName : user.clinicName;
      user.experience = req.body.experience !== undefined ? req.body.experience : user.experience;
      user.availability = req.body.availability !== undefined ? req.body.availability : user.availability;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      status: updatedUser.status,
      specialization: updatedUser.specialization,
      clinicName: updatedUser.clinicName,
      experience: updatedUser.experience,
      availability: updatedUser.availability,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    if (user.role === 'admin') {
      res.status(400);
      throw new Error('Cannot delete admin user');
    }
    await user.deleteOne();
    res.json({ message: 'User removed' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

module.exports = {
  getUsers,
  getUserById,
  getCurrentUser,
  updateCurrentUser,
  updateUser,
  deleteUser,
};
