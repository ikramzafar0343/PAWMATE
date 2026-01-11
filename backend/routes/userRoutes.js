const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  getCurrentUser,
  updateCurrentUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Pet = require('../models/Pet');
const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');
const Prescription = require('../models/Prescription');

/**
 * @swagger
 * /users/vets:
 *   get:
 *     summary: Get all active veterinarians
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of veterinarians
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
// Get vets (accessible without auth for pet owners to browse)
router.route('/vets').get(async (req, res, next) => {
  try {
    const vets = await User.find({ role: 'vet', status: 'active' })
      .select('-password')
      .lean() // Use lean() for read-only queries (faster)
      .sort({ name: 1 }); // Sort alphabetically
    res.json(vets);
  } catch (error) {
    next(error);
  }
});

// All other routes require authentication
router.use(protect);

// Current user routes (accessible to all authenticated users)
router.route('/me').get(getCurrentUser).put(updateCurrentUser);

// Admin-only routes
router.use(admin);

router.route('/').get(getUsers);

// Admin stats - MUST be before /:id route to avoid route conflicts
router.get('/stats', async (req, res, next) => {
  try {
    const [totalUsers, activeVets, totalPets, totalAppointments, totalRecords, activePrescriptions] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: 'vet', status: 'active' }),
      Pet.countDocuments({}),
      Appointment.countDocuments({}),
      MedicalRecord.countDocuments({}),
      Prescription.countDocuments({ status: 'active' }),
    ]);
    res.json({
      totalUsers,
      activeVets,
      totalPets,
      totalAppointments,
      totalRecords,
      activePrescriptions,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
});

// Admin daily stats - users registrations by role for the last N days
router.get('/stats/daily', async (req, res, next) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days || '7', 10) || 7, 1), 31);
    const end = new Date();
    const start = new Date(end.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
    start.setHours(0, 0, 0, 0);
    const pipeline = [
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          owners: { $sum: { $cond: [ { $eq: ["$role", "pet-owner"] }, 1, 0 ] } },
          vets: { $sum: { $cond: [ { $eq: ["$role", "vet"] }, 1, 0 ] } },
          total: { $sum: 1 }
        } 
      },
      { $sort: { _id: 1 } }
    ];
    const grouped = await User.aggregate(pipeline).allowDiskUse(true);
    // Fill missing days with zeros
    const byDate = new Map(grouped.map(g => [g._id, g]));
    const out = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
      const ds = d.toISOString().split('T')[0];
      const row = byDate.get(ds) || { owners: 0, vets: 0, total: 0 };
      out.push({ date: ds, owners: row.owners || 0, vets: row.vets || 0, total: row.total || 0 });
    }
    res.json({ days, start: start.toISOString(), end: end.toISOString(), series: out });
  } catch (error) {
    console.error('Error fetching daily stats:', error);
    res.status(500).json({ message: 'Error fetching daily stats', error: error.message });
  }
});

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID (Admin only)
 *     tags: [Users]
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
 *         description: User details
 *   put:
 *     summary: Update user (Admin only)
 *     tags: [Users]
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
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: User updated
 *   delete:
 *     summary: Delete user (Admin only)
 *     tags: [Users]
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
 *         description: User deleted
 */
router.route('/:id')
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser);

module.exports = router;
