const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: ['PRODUCT_CREATED', 'PRODUCT_UPDATED', 'PRODUCT_DELETED', 'STOCK_IN', 'STOCK_OUT', 'BULK_IMPORT'],
    },
    productName: { type: String, default: 'N/A' },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
    performedBy: { type: String, required: true, default: 'System' },
    details: { type: String },
    changeAmount: { type: Number },
    previousQty: { type: Number },
    newQty: { type: Number },
  },
  { timestamps: true }
);

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
module.exports = AuditLog;
