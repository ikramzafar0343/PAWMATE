const express = require('express');
const router = express.Router();
const {
  getMedicalRecords,
  createMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord,
} = require('../controllers/medicalRecordController');
const { protect, vet } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /medical-records/{petId}:
 *   get:
 *     summary: Get medical records for a pet
 *     tags: [Medical Records]
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
 *         description: List of medical records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MedicalRecord'
 */
router.route('/:petId').get(protect, getMedicalRecords);

/**
 * @swagger
 * /medical-records:
 *   post:
 *     summary: Create a medical record
 *     tags: [Medical Records]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MedicalRecord'
 *     responses:
 *       201:
 *         description: Medical record created
 */
router.route('/').post(protect, createMedicalRecord);

/**
 * @swagger
 * /medical-records/{id}:
 *   put:
 *     summary: Update a medical record
 *     tags: [Medical Records]
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
 *             $ref: '#/components/schemas/MedicalRecord'
 *     responses:
 *       200:
 *         description: Medical record updated
 *   delete:
 *     summary: Delete a medical record
 *     tags: [Medical Records]
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
 *         description: Medical record deleted
 */
router.route('/:id').put(protect, updateMedicalRecord).delete(protect, deleteMedicalRecord);

module.exports = router;
