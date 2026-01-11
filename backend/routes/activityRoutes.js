const express = require('express');
const router = express.Router();
const { getActivities, createActivity, getActivityFeed } = require('../controllers/activityController');
const { protect, admin } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /activities:
 *   get:
 *     summary: Get all activities (Admin only)
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of activities
 *   post:
 *     summary: Create an activity
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Activity'
 *     responses:
 *       201:
 *         description: Activity created
 */
router.route('/').get(protect, admin, getActivities).post(protect, createActivity);

/**
 * @swagger
 * /activities/feed:
 *   get:
 *     summary: Get activity feed (Admin only)
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Activity feed
 */
router.route('/feed').get(protect, admin, getActivityFeed);

module.exports = router;
