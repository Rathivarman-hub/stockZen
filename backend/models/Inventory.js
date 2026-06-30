const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      unique: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be less than 0'],
      default: 0,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be less than 0'],
      default: 0,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      default: 'General',
    },
    description: {
      type: String,
      trim: true,
    },
    barcode: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['In Stock', 'Low Stock', 'Out of Stock'],
      default: 'In Stock',
    },
    createdBy: {
      type: String,
      required: [true, 'Adding user is required'],
      default: 'System',
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to automatically update status based on quantity
inventorySchema.pre('save', function (next) {
  if (this.quantity === 0) {
    this.status = 'Out of Stock';
  } else if (this.quantity < 5) {
    this.status = 'Low Stock';
  } else {
    this.status = 'In Stock';
  }
  next();
});

// Reusable model method for atomic updates
inventorySchema.statics.updateStock = async function (id, changeAmount) {
  const product = await this.findById(id);
  
  if (!product) {
    throw new Error('Product not found');
  }
  
  if (product.quantity + changeAmount < 0) {
    throw new Error('Cannot oversell: Insufficient stock');
  }

  // Use findOneAndUpdate for atomic operation to prevent race conditions
  const updatedProduct = await this.findOneAndUpdate(
    { _id: id, quantity: { $gte: -changeAmount } }, // Conditionally match to ensure stock doesn't go below 0 during concurrent updates
    { 
      $inc: { quantity: changeAmount }
    },
    { new: true, runValidators: true }
  );
  
  if (!updatedProduct) {
     throw new Error('Update failed due to concurrent modification or insufficient stock');
  }
  
  // Update status based on new quantity manually since findOneAndUpdate skips pre('save')
  let newStatus = 'In Stock';
  if (updatedProduct.quantity === 0) {
    newStatus = 'Out of Stock';
  } else if (updatedProduct.quantity < 5) {
    newStatus = 'Low Stock';
  }
  
  updatedProduct.status = newStatus;
  await updatedProduct.save();

  return updatedProduct;
};

const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory;
