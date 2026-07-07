const mongoose = require('mongoose');

const financialLedgerSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  transactionType: {
    type: String,
    enum: ['Income', 'Expense'],
    required: true
  },
  category: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMode: {
    type: String,
    required: true
  },
  receiptNumber: {
    type: String,
    default: ''
  },
  voucherNumber: {
    type: String,
    default: ''
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent'
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  },
  academicYear: {
    type: String,
    required: true,
    default: '2026-27'
  },
  description: {
    type: String,
    default: ''
  },
  referenceId: {
    type: String,
    default: ''
  },
  createdBy: {
    type: String,
    required: true,
    default: 'SYSTEM'
  },
  remarks: {
    type: String,
    default: ''
  },
  isCancelled: {
    type: Boolean,
    default: false,
    required: true
  },
  cancelReason: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('FinancialLedger', financialLedgerSchema);
