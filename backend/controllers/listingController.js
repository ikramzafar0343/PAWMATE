const asyncHandler = require('express-async-handler');
const Listing = require('../models/Listing');

// @desc    Get all listings with pagination and filtering
// @route   GET /api/listings
// @access  Public
const getListings = asyncHandler(async (req, res) => {
  // Pagination parameters
  const page = Math.max(parseInt(req.query.page || '1', 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit || '12', 10) || 12, 50); // Default 12, max 50
  const skip = (page - 1) * limit;

  // Filtering parameters
  const filter = {};
  if (req.query.status) {
    filter.status = req.query.status;
  } else {
    // Default to active listings only for public access
    filter.status = 'active';
  }
  if (req.query.type) {
    filter.type = req.query.type;
  }
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { breed: { $regex: req.query.search, $options: 'i' } },
      { location: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  const queryStartTime = Date.now();
  
  // Get total count and listings in parallel for better performance
  const [total, listingsData] = await Promise.all([
    Listing.countDocuments(filter).maxTimeMS(5000),
    Listing.find(filter)
      .select('-description') // Exclude description from list view for smaller payload
      .lean()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .maxTimeMS(5000)
  ]);
  
  // Manual population is faster than .populate() for large datasets
  const sellerIds = [...new Set(listingsData.map(l => l.sellerId).filter(Boolean))];
  let sellersMap = new Map();
  
  if (sellerIds.length > 0) {
    const User = require('../models/User');
    const sellers = await User.find({ _id: { $in: sellerIds } })
      .select('name image profileImage avatar rating fullName email')
      .lean()
      .maxTimeMS(5000);
    sellersMap = new Map(sellers.map(s => [String(s._id), s]));
  }
  
  // Attach seller data
  const listings = listingsData.map(listing => ({
    ...listing,
    sellerId: listing.sellerId ? (sellersMap.get(String(listing.sellerId)) || listing.sellerId) : null
  }));
  
  const queryDuration = Date.now() - queryStartTime;
  console.log(`[Performance] getListings DB query: ${queryDuration}ms`);
  
  if (queryDuration > 2000) {
    console.warn(`[Performance] getListings query took ${queryDuration}ms - consider checking indexes`);
  }

  res.json({
    listings,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasMore: skip + limit < total
    }
  });
});

// @desc    Get listing by ID
// @route   GET /api/listings/:id
// @access  Public
const getListingById = asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.id)
    .populate('sellerId', 'name image profileImage avatar rating fullName email')
    .lean();
  if (listing) {
    res.json(listing);
  } else {
    res.status(404);
    throw new Error('Listing not found');
  }
});

// @desc    Create listing
// @route   POST /api/listings
// @access  Private
const createListing = asyncHandler(async (req, res) => {
  const { name, breed, age, price, location, type, gender, image, description, category } = req.body;

  if (!name || !age || !price || !location || !type || !image || !description) {
    res.status(400);
    throw new Error('Please add all required fields: name, age, price, location, type, image, description');
  }

  const listing = await Listing.create({
    name,
    breed,
    age,
    price,
    location,
    type,
    gender,
    image,
    description,
    category,
    sellerId: req.user._id || req.user.id,
    status: 'active' // Auto-approve all listings for now
  });
  res.status(201).json(listing);
});

// @desc    Update listing status
// @route   PUT /api/listings/:id/status
// @access  Private/Admin
const updateListingStatus = asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.id);

  if (listing) {
    listing.status = req.body.status || listing.status;
    const updatedListing = await listing.save();
    res.json(updatedListing);
  } else {
    res.status(404);
    throw new Error('Listing not found');
  }
});

// @desc    Delete listing
// @route   DELETE /api/listings/:id
// @access  Private
const deleteListing = asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.id);

  if (listing) {
    if (listing.sellerId.toString() !== req.user.id && req.user.role !== 'admin') {
      res.status(401);
      throw new Error('Not authorized');
    }
    await listing.deleteOne();
    res.json({ message: 'Listing removed' });
  } else {
    res.status(404);
    throw new Error('Listing not found');
  }
});

module.exports = {
  getListings,
  getListingById,
  createListing,
  updateListingStatus,
  deleteListing,
};
