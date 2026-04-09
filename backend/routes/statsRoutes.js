const express = require('express');
const router = express.Router();
const { getStats } = require('../controllers/statsController');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/stats
// @desc    Get real-time global statistics
// @access  Private
router.get('/', protect, getStats);

module.exports = router;
