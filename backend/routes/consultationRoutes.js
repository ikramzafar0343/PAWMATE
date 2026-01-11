const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getActiveConsultations, completeConsultation } = require('../controllers/appointmentController');

/**
 * @swagger
 * /consultations/active:
 *   get:
 *     summary: Get active consultations
 *     tags: [Consultations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active consultations
 */
router.get('/active', protect, getActiveConsultations);

/**
 * @swagger
 * /consultations/{id}/complete:
 *   put:
 *     summary: Complete a consultation
 *     tags: [Consultations]
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
 *         description: Consultation completed
 */
router.put('/:id/complete', protect, completeConsultation);

module.exports = router;