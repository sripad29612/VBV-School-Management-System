const mongoose = require('mongoose');

const installmentItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true // e.g. "Term 1"
  },
  amount: {
    type: Number,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  gracePeriod: {
    type: Number,
    default: 0 // days
  },
  lateFee: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  breakdown: {
    admission: { type: Number, default: 0 },
    tuition: { type: Number, default: 0 },
    books: { type: Number, default: 0 },
    hostel: { type: Number, default: 0 },
    transport: { type: Number, default: 0 },
    uniform: { type: Number, default: 0 },
    exam: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  }
});

const feeInstallmentPlanSchema = new mongoose.Schema({
  className: {
    type: String,
    required: true // e.g. "Class VI"
  },
  academicYear: {
    type: String,
    required: true,
    default: '2026-27'
  },
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Draft', 'Published', 'Archived'],
    default: 'Draft',
    required: true
  },
  mode: {
    type: String,
    enum: ['A', 'B'],
    default: 'A',
    required: true
  },
  publishedAt: {
    type: Date
  },
  archivedAt: {
    type: Date
  },
  installments: [installmentItemSchema]
}, { timestamps: true });

feeInstallmentPlanSchema.index({ className: 1, academicYear: 1 });

module.exports = mongoose.model('FeeInstallmentPlan', feeInstallmentPlanSchema);
