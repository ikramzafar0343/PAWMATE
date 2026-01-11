const express = require('express');
const router = express.Router();
const {
  getReports,
  createReport,
  resolveReport,
} = require('../controllers/reportController');
const { protect, admin } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /reports:
 *   get:
 *     summary: Get all reports (Admin only)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of reports
 *   post:
 *     summary: Create a report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Report'
 *     responses:
 *       201:
 *         description: Report created
 */
router.route('/').get(protect, admin, getReports).post(protect, createReport);

/**
 * @swagger
 * /reports/{id}/resolve:
 *   put:
 *     summary: Resolve a report (Admin only)
 *     tags: [Reports]
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
 *         description: Report resolved
 */
router.route('/:id/resolve').put(protect, admin, resolveReport);

module.exports = router;
