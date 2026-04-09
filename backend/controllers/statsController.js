const Inventory = require('../models/Inventory');
const Notification = require('../models/Notification');

let activeUsersCount = 0;

// Export setter for socket.io to update active connections
const setActiveUsers = (count) => {
  activeUsersCount = count;
};

// Calculate all stats dynamically
const calculateStats = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalProducts, lowStockItems, ordersToday, stockUpdatesToday] = await Promise.all([
      Inventory.countDocuments({}),
      Inventory.countDocuments({ quantity: { $lt: 5, $gt: 0 } }),
      // Orders: notifications related to decreasing stock (or hitting 0)
      Notification.countDocuments({
        createdAt: { $gte: today },
        $or: [
          { message: { $regex: 'decreased', $options: 'i' } },
          { message: { $regex: 'out of stock', $options: 'i' } }
        ]
      }),
      // Updates: all inventory interactions today
      Notification.countDocuments({
        createdAt: { $gte: today }
      })
    ]);

    return {
      activeUsers: activeUsersCount,
      totalProducts,
      lowStockItems,
      ordersProcessedToday: ordersToday,
      liveStockUpdates: stockUpdatesToday
    };
  } catch (error) {
    console.error('Failed to calculate stats', error);
    return null;
  }
};

// Route handler
const getStats = async (req, res) => {
  const stats = await calculateStats();
  if (stats) {
    res.json(stats);
  } else {
    res.status(500).json({ message: 'Error calculating stats' });
  }
};

// Broadcaster utility for real-time pushing
const broadcastStats = async (io) => {
  if (!io) return;
  const stats = await calculateStats();
  if (stats) {
    // Only broadcast to authenticated users who are in the 'auth_users' room
    io.to('auth_users').emit('stats:update', stats);
  }
};

module.exports = {
  getStats,
  setActiveUsers,
  broadcastStats
};
