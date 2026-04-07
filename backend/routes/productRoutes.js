const express = require('express');
const router = express.Router();
const {
  getProducts,
  addProduct,
  updateStock,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').get(protect, getProducts).post(protect, admin, addProduct);
router.route('/:id/stock').put(protect, admin, updateStock);
router.route('/:id').put(protect, admin, updateProduct).delete(protect, admin, deleteProduct);

module.exports = router;
