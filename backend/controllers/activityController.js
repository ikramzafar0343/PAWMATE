const asyncHandler = require('express-async-handler');
const Activity = require('../models/Activity');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Report = require('../models/Report');
const Listing = require('../models/Listing');

const getActivities = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.type) {
    query.type = req.query.type;
  }
  const activities = await Activity.find(query).sort({ createdAt: -1 }).limit(50);
  res.json(activities);
});

const createActivity = asyncHandler(async (req, res) => {
  const { type, text, color, metadata } = req.body;
  if (!type || !text) {
    res.status(400);
    throw new Error('Type and text are required');
  }
  const activity = await Activity.create({
    type,
    text,
    color: color || 'blue',
    userId: req.user.id,
    metadata: metadata || {},
  });
  res.status(201).json(activity);
});

// Aggregated activity feed from core collections
const getActivityFeed = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10) || 10, 1), 50);
  const days = Math.min(Math.max(parseInt(req.query.days || '7', 10) || 7, 1), 31);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const [users, appts, reports, listings] = await Promise.all([
    User.find({ createdAt: { $gte: since } }).select('name role createdAt').sort({ createdAt: -1 }).limit(limit).lean(),
    Appointment.find({ createdAt: { $gte: since } }).select('petId date time status createdAt').sort({ createdAt: -1 }).limit(limit).lean(),
    Report.find({ createdAt: { $gte: since } }).select('title status createdAt').sort({ createdAt: -1 }).limit(limit).lean(),
    Listing.find({ createdAt: { $gte: since } }).select('name status createdAt').sort({ createdAt: -1 }).limit(limit).lean(),
  ]);
  const formatTime = (d) => {
    try { return new Date(d).toLocaleDateString(); } catch { return ''; }
  };
  const feed = [
    ...users.map(u => ({
      type: 'user',
      text: `New ${u.role === 'vet' ? 'veterinarian' : 'user'} registration: ${u.name || 'User'}`,
      color: 'blue',
      time: formatTime(u.createdAt)
    })),
    ...appts.map(a => ({
      type: 'default',
      text: `Appointment ${a.status || 'Scheduled'} • ${a.date || ''} ${a.time || ''}`,
      color: a.status === 'Cancelled' ? 'red' : (a.status === 'Completed' ? 'green' : 'blue'),
      time: formatTime(a.createdAt)
    })),
    ...reports.map(r => ({
      type: 'report',
      text: `Content reported: ${r.title || 'Item'}`,
      color: r.status === 'resolved' ? 'green' : 'red',
      time: formatTime(r.createdAt)
    })),
    ...listings.map(l => ({
      type: 'market',
      text: `Marketplace listing ${l.status || 'pending'}: ${l.name || 'Item'}`,
      color: l.status === 'pending' ? 'orange' : 'green',
      time: formatTime(l.createdAt)
    })),
  ]
  .sort((a, b) => new Date(b.time) - new Date(a.time))
  .slice(0, limit);
  res.json(feed);
});

module.exports = {
  getActivities,
  createActivity,
  getActivityFeed,
};
