const express = require('express');
const router = express.Router();
const {
  getListings,
  getListingById,
  createListing,
  updateListingStatus,
  deleteListing,
} = require('../controllers/listingController');
const { protect, admin } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /listings:
 *   get:
 *     summary: Get all listings
 *     tags: [Listings]
 *     responses:
 *       200:
 *         description: List of listings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Listing'
 *   post:
 *     summary: Create a new listing
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Listing'
 *     responses:
 *       201:
 *         description: Listing created
 */
router.route('/').get(getListings).post(protect, createListing);

/**
 * @swagger
 * /listings/{id}:
 *   get:
 *     summary: Get listing by ID
 *     tags: [Listings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Listing details
 *   delete:
 *     summary: Delete listing
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Listing deleted
 */
router.route('/:id').get(getListingById).delete(protect, deleteListing);

/**
 * @swagger
 * /listings/{id}/status:
 *   put:
 *     summary: Update listing status (Admin only)
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, pending, closed]
 *     responses:
 *       200:
 *         description: Status updated
 */
router.route('/:id/status').put(protect, admin, updateListingStatus);

module.exports = router;
