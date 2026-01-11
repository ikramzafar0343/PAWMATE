const asyncHandler = require('express-async-handler');
const Report = require('../models/Report');

// @desc    Get all reports
// @route   GET /api/reports
// @access  Private/Admin
const getReports = asyncHandler(async (req, res) => {
  let query = {};
  
  // Filter by status if provided
  if (req.query.status) {
    query.status = req.query.status;
  }
  
  const reports = await Report.find(query).sort({ createdAt: -1 });
  res.json(reports);
});

// @desc    Create report
// @route   POST /api/reports
// @access  Private
const createReport = asyncHandler(async (req, res) => {
  const report = await Report.create(req.body);
  res.status(201).json(report);
});

// @desc    Resolve report
// @route   PUT /api/reports/:id/resolve
// @access  Private/Admin
const resolveReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id);

  if (report) {
    report.status = 'resolved';
    const updatedReport = await report.save();
    res.json(updatedReport);
  } else {
    res.status(404);
    throw new Error('Report not found');
  }
});

module.exports = {
  getReports,
  createReport,
  resolveReport,
};
