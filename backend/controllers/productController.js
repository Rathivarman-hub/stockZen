const Inventory = require('../models/Inventory');
const Notification = require('../models/Notification');
const { broadcastStats } = require('../controllers/statsController');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const products = await Inventory.find({}).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a product
// @route   POST /api/products
// @access  Private
const addProduct = async (req, res) => {
  try {
    const { name, quantity, price, category, description, barcode } = req.body;

    const productExists = await Inventory.findOne({ name });
    if (productExists) {
      return res.status(400).json({ message: 'Product already exists' });
    }

    const product = await Inventory.create({
      name,
      quantity,
      price,
      category,
      description,
      barcode,
      createdBy: req.user.name,
    });

    // Emit real-time event to all connected clients
    req.io.emit('product_added', product);
    const notification = await Notification.create({
      message: `✅ Stock updated for '${product.name}' (New)`,
      type: 'success'
    });
    req.io.emit('notification', notification);
    
    // Broadcast updated stats
    broadcastStats(req.io);

    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update stock amount atomically
// @route   PUT /api/products/:id/stock
// @access  Private
const updateStock = async (req, res) => {
  try {
    const { changeAmount } = req.body; // e.g., -1 for sale, +5 for restock
    const { id } = req.params;

    if (changeAmount === undefined || typeof changeAmount !== 'number') {
       return res.status(400).json({ message: 'Valid changeAmount is required' });
    }

    // Call reusable model method for atomic update
    const updatedProduct = await Inventory.updateStock(id, changeAmount);

    // Emit real-time event
    req.io.emit('stock_updated', updatedProduct);
    
    // Create notifications based on stock levels
    let type = 'success';
    let message = `✅ Stock updated for '${updatedProduct.name}'`;
    
    if (updatedProduct.quantity === 0) {
      type = 'error';
      message = `❌ Product '${updatedProduct.name}' is out of stock`;
    } else if (updatedProduct.quantity < 5) {
      type = 'warning';
      message = `⚠️ Product '${updatedProduct.name}' is running low`;
    }
    
    const notification = await Notification.create({ message, type });
    req.io.emit('notification', notification);
    
    // Optional: Also emit a multi-user activity alert if you want to notify others specifically
    const userNotification = await Notification.create({
      message: `👤 Inventory updated by another user (${req.user.name})`,
      type: 'info'
    });
    req.io.emit('notification', userNotification);
    
    // Broadcast updated stats
    broadcastStats(req.io);

    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private
const deleteProduct = async (req, res) => {
  try {
    const product = await Inventory.findByIdAndDelete(req.params.id);

    if (product) {
      // Emit real-time event
      req.io.emit('product_deleted', req.params.id);
      
      const notification = await Notification.create({
        message: `🗑️ Product '${product.name}' was deleted by ${req.user.name}`,
        type: 'warning'
      });
      req.io.emit('notification', notification);
      
      // Broadcast updated stats
      broadcastStats(req.io);
      
      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a product details
// @route   PUT /api/products/:id
// @access  Private
const updateProduct = async (req, res) => {
  try {
    const { name, quantity, price, category, description, barcode } = req.body;
    const { id } = req.params;

    const product = await Inventory.findById(id);

    if (product) {
      product.name = name || product.name;
      product.quantity = quantity !== undefined ? quantity : product.quantity;
      product.price = price !== undefined ? price : product.price;
      product.category = category || product.category;
      product.description = description || product.description;
      product.barcode = barcode !== undefined ? barcode : product.barcode;

      const updatedProduct = await product.save();

      // Emit real-time event
      req.io.emit('product_updated', updatedProduct);
      
      const notification = await Notification.create({
        message: `🔄 Product '${updatedProduct.name}' was updated by ${req.user.name}`,
        type: 'info'
      });
      req.io.emit('notification', notification);
      
      // Broadcast updated stats
      broadcastStats(req.io);

      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getProducts,
  addProduct,
  updateStock,
  updateProduct,
  deleteProduct,
};
