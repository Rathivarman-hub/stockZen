const express = require('express');
const router = express.Router();
const { processMessage } = require('../controllers/chatbotController');
const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/chatbot
// @access  Private
router.post('/', protect, processMessage);

module.exports = router;
