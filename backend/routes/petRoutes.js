const express = require('express');
const router = express.Router();
const {
  getPets,
  getPetById,
  createPet,
  updatePet,
  deletePet,
  getBreedingMatches,
} = require('../controllers/petController');
const { protect } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /pets/matches:
 *   get:
 *     summary: Get breeding matches for pets
 *     tags: [Pets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of potential breeding matches
 */
router.route('/matches').get(protect, getBreedingMatches);

/**
 * @swagger
 * /pets:
 *   get:
 *     summary: Get all pets
 *     tags: [Pets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pets
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Pet'
 *   post:
 *     summary: Create a new pet
 *     tags: [Pets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Pet'
 *     responses:
 *       201:
 *         description: Pet created
 */
router.route('/').get(protect, getPets).post(protect, createPet);

/**
 * @swagger
 * /pets/{id}:
 *   get:
 *     summary: Get pet by ID
 *     tags: [Pets]
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
 *         description: Pet details
 *   put:
 *     summary: Update pet details
 *     tags: [Pets]
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
 *             $ref: '#/components/schemas/Pet'
 *     responses:
 *       200:
 *         description: Pet updated
 *   delete:
 *     summary: Delete pet
 *     tags: [Pets]
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
 *         description: Pet deleted
 */
router.route('/:id').get(protect, getPetById).put(protect, updatePet).delete(protect, deletePet);

module.exports = router;
