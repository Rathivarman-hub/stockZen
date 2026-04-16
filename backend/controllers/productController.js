const Inventory = require('../models/Inventory');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { broadcastStats } = require('../controllers/statsController');

// @desc    Get all products
// @route   GET /api/products
// @access  Private
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
// @access  Private/Admin
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

    // Emit real-time event
    req.io.emit('product_added', product);
    const notification = await Notification.create({
      message: `✅ '${product.name}' added to inventory by ${req.user.name}`,
      type: 'success',
    });
    req.io.emit('notification', notification);

    // Persist audit log
    await AuditLog.create({
      action: 'PRODUCT_CREATED',
      productName: product.name,
      productId: product._id,
      performedBy: req.user.name,
      details: `Created with qty: ${product.quantity}, price: ₹${product.price}, category: ${product.category}`,
      newQty: product.quantity,
    });

    broadcastStats(req.io);
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update stock amount atomically
// @route   PUT /api/products/:id/stock
// @access  Private/Admin
const updateStock = async (req, res) => {
  try {
    const { changeAmount } = req.body;
    const { id } = req.params;

    if (changeAmount === undefined || typeof changeAmount !== 'number') {
      return res.status(400).json({ message: 'Valid changeAmount is required' });
    }

    const previousProduct = await Inventory.findById(id);
    const previousQty = previousProduct ? previousProduct.quantity : 0;

    const updatedProduct = await Inventory.updateStock(id, changeAmount);

    req.io.emit('stock_updated', updatedProduct);

    let type = 'success';
    let message = `✅ Stock updated for '${updatedProduct.name}' by ${req.user.name}`;
    if (updatedProduct.quantity === 0) {
      type = 'error';
      message = `❌ '${updatedProduct.name}' is now out of stock`;
    } else if (updatedProduct.quantity < 5) {
      type = 'warning';
      message = `⚠️ '${updatedProduct.name}' is running low (${updatedProduct.quantity} left)`;
    }

    const notification = await Notification.create({ message, type });
    req.io.emit('notification', notification);

    // Persist audit log
    const action = changeAmount < 0 ? 'STOCK_OUT' : 'STOCK_IN';
    const detailPrefix = changeAmount < 0 ? '📦 OUTGOING: Product removed from warehouse' : '📥 INCOMING: Stock replenishment';
    
    await AuditLog.create({
      action,
      productName: updatedProduct.name,
      productId: updatedProduct._id,
      performedBy: req.user.name,
      details: `${detailPrefix} - ${Math.abs(changeAmount)} unit(s) ${changeAmount > 0 ? 'added' : 'taken out'}`,
      changeAmount,
      previousQty,
      newQty: updatedProduct.quantity,
    });

    // Specifically broadcast stock_out for the live feed
    if (action === 'STOCK_OUT') {
      req.io.emit('stock_out_event', {
        id: Date.now(),
        name: updatedProduct.name,
        qty: Math.abs(changeAmount),
        time: new Date(),
        performedBy: req.user.name
      });
    }

    broadcastStats(req.io);
    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Inventory.findByIdAndDelete(req.params.id);

    if (product) {
      req.io.emit('product_deleted', req.params.id);

      const notification = await Notification.create({
        message: `🗑️ '${product.name}' was deleted by ${req.user.name}`,
        type: 'warning',
      });
      req.io.emit('notification', notification);

      // Persist audit log
      await AuditLog.create({
        action: 'PRODUCT_DELETED',
        productName: product.name,
        productId: product._id,
        performedBy: req.user.name,
        details: `Product deleted. Last known qty: ${product.quantity}`,
        previousQty: product.quantity,
      });

      broadcastStats(req.io);
      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update product details
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  try {
    const { name, quantity, price, category, description, barcode } = req.body;
    const { id } = req.params;

    const product = await Inventory.findById(id);

    if (product) {
      const previousQty = product.quantity;
      product.name        = name        || product.name;
      product.quantity    = quantity    !== undefined ? quantity    : product.quantity;
      product.price       = price       !== undefined ? price       : product.price;
      product.category    = category    || product.category;
      product.description = description !== undefined ? description : product.description;
      product.barcode     = barcode     !== undefined ? barcode     : product.barcode;

      const updatedProduct = await product.save();

      req.io.emit('product_updated', updatedProduct);

      const notification = await Notification.create({
        message: `🔄 '${updatedProduct.name}' was updated by ${req.user.name}`,
        type: 'info',
      });
      req.io.emit('notification', notification);

      // Persist audit log
      await AuditLog.create({
        action: 'PRODUCT_UPDATED',
        productName: updatedProduct.name,
        productId: updatedProduct._id,
        performedBy: req.user.name,
        details: `Details updated: price=₹${updatedProduct.price}, category=${updatedProduct.category}`,
        previousQty,
        newQty: updatedProduct.quantity,
      });

      broadcastStats(req.io);
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Bulk import products from CSV
// @route   POST /api/products/bulk
// @access  Private/Admin
const bulkImport = async (req, res) => {
  try {
    const { products } = req.body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: 'No valid products data provided' });
    }

    const results = { created: 0, skipped: 0, errors: [] };

    for (const p of products) {
      try {
        if (!p.name || !p.name.trim()) {
          results.errors.push('Row skipped: missing product name');
          continue;
        }
        const existing = await Inventory.findOne({ name: p.name.trim() });
        if (existing) {
          results.skipped++;
          continue;
        }
        await Inventory.create({
          name:        p.name.trim(),
          quantity:    parseInt(p.quantity)    || 0,
          price:       parseFloat(p.price)     || 0,
          category:    p.category              || 'General',
          description: p.description           || '',
          barcode:     p.barcode               || '',
          createdBy:   req.user.name,
        });
        results.created++;
      } catch (err) {
        results.errors.push(`${p.name}: ${err.message}`);
      }
    }

    // Persist audit log for bulk action
    await AuditLog.create({
      action: 'BULK_IMPORT',
      performedBy: req.user.name,
      details: `Bulk CSV import: ${results.created} created, ${results.skipped} skipped, ${results.errors.length} errors`,
    });

    // Broadcast
    req.io.emit('bulk_import', { count: results.created });
    const notification = await Notification.create({
      message: `📦 Bulk import by ${req.user.name}: ${results.created} products added`,
      type: 'success',
    });
    req.io.emit('notification', notification);
    broadcastStats(req.io);

    res.status(201).json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get product by barcode
// @route   GET /api/products/barcode/:barcode
// @access  Private
const getProductByBarcode = async (req, res) => {
  try {
    const product = await Inventory.findOne({ barcode: req.params.barcode });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProducts,
  addProduct,
  updateStock,
  updateProduct,
  deleteProduct,
  bulkImport,
  getProductByBarcode
};
