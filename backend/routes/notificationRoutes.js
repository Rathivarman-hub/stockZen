const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, clearReadNotifications } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getNotifications).delete(protect, clearReadNotifications);
router.route('/:id/read').put(protect, markAsRead);

module.exports = router;
