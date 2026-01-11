const express = require('express');
const router = express.Router();
const {
  getMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
} = require('../controllers/medicineController');
const { protect, admin } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /medicines:
 *   get:
 *     summary: Get all medicines
 *     tags: [Medicines]
 *     responses:
 *       200:
 *         description: List of medicines
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Medicine'
 *   post:
 *     summary: Create a new medicine (Admin only)
 *     tags: [Medicines]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Medicine'
 *     responses:
 *       201:
 *         description: Medicine created
 */
router.route('/').get(getMedicines).post(protect, admin, createMedicine);

/**
 * @swagger
 * /medicines/{id}:
 *   get:
 *     summary: Get medicine by ID
 *     tags: [Medicines]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Medicine details
 *   put:
 *     summary: Update medicine (Admin only)
 *     tags: [Medicines]
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
 *             $ref: '#/components/schemas/Medicine'
 *     responses:
 *       200:
 *         description: Medicine updated
 *   delete:
 *     summary: Delete medicine (Admin only)
 *     tags: [Medicines]
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
 *         description: Medicine deleted
 */
router.route('/:id').get(getMedicineById).put(protect, admin, updateMedicine).delete(protect, admin, deleteMedicine);

module.exports = router;

