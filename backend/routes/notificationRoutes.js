const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, markAllAsRead, clearReadNotifications } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getNotifications).delete(protect, clearReadNotifications);
router.route('/read-all').put(protect, markAllAsRead);
router.route('/:id/read').put(protect, markAsRead);

module.exports = router;
