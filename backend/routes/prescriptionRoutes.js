const express = require('express');
const router = express.Router();
const {
  getPrescriptions,
  getPrescriptionById,
  createPrescription,
  updatePrescription,
  deletePrescription,
  getActivePrescription,
  approvePrescription,
  getPendingPrescriptions,
} = require('../controllers/prescriptionController');
const { protect, vet } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /prescriptions:
 *   get:
 *     summary: Get all prescriptions
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of prescriptions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Prescription'
 *   post:
 *     summary: Create a prescription (Vet only)
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Prescription'
 *     responses:
 *       201:
 *         description: Prescription created
 */
router.route('/').get(protect, getPrescriptions).post(protect, vet, createPrescription);

/**
 * @swagger
 * /prescriptions/pending:
 *   get:
 *     summary: Get pending prescriptions (Vet only)
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending prescriptions
 */
router.route('/pending').get(protect, vet, getPendingPrescriptions);

/**
 * @swagger
 * /prescriptions/pet/{petId}/active:
 *   get:
 *     summary: Get active prescription for a pet
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: petId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Active prescription
 */
router.route('/pet/:petId/active').get(protect, getActivePrescription);

/**
 * @swagger
 * /prescriptions/{id}/approve:
 *   put:
 *     summary: Approve a prescription (Vet only)
 *     tags: [Prescriptions]
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
 *         description: Prescription approved
 */
router.route('/:id/approve').put(protect, vet, approvePrescription);

/**
 * @swagger
 * /prescriptions/{id}:
 *   get:
 *     summary: Get prescription by ID
 *     tags: [Prescriptions]
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
 *         description: Prescription details
 *   put:
 *     summary: Update prescription
 *     tags: [Prescriptions]
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
 *             $ref: '#/components/schemas/Prescription'
 *     responses:
 *       200:
 *         description: Prescription updated
 *   delete:
 *     summary: Delete prescription
 *     tags: [Prescriptions]
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
 *         description: Prescription deleted
 */
router.route('/:id').get(protect, getPrescriptionById).put(protect, updatePrescription).delete(protect, deletePrescription);

module.exports = router;

