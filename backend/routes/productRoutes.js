const express = require('express');
const router = express.Router();
const {
  getProducts,
  addProduct,
  updateStock,
  updateProduct,
  deleteProduct,
  bulkImport,
  getProductByBarcode,
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');

// Must come before /:id routes to avoid conflict
router.route('/bulk').post(protect, admin, bulkImport);
router.route('/barcode/:barcode').get(protect, getProductByBarcode);

// Core CRUD
router.route('/').get(protect, getProducts).post(protect, admin, addProduct);
router.route('/:id').put(protect, admin, updateProduct).delete(protect, admin, deleteProduct);

// Stock update — support both PUT /stock and PATCH /quantity so nothing breaks
router.route('/:id/stock').put(protect, admin, updateStock);
router.route('/:id/quantity').patch(protect, admin, updateStock);

module.exports = router;
