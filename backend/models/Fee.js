const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'UPI', 'Cheque', 'Online', 'Bank Transfer'],
    required: true
  },
  receiptNumber: {
    type: String,
    required: true
  },
  transactionId: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    default: 'Tuition'
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
  },
  collectedBy: {
    type: String,
    default: 'ADMIN'
  },
  remarks: {
    type: String,
    default: ''
  }
});

const feeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    unique: true
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
  paidAmount: {
    type: Number,
    required: true,
    default: 0
  },
  balanceAmount: {
    type: Number,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  breakdown: {
    admission: {
      total: { type: Number, default: 0 },
      paid: { type: Number, default: 0 }
    },
    tuition: {
      total: { type: Number, default: 0 },
      paid: { type: Number, default: 0 }
    },
    books: {
      total: { type: Number, default: 0 },
      paid: { type: Number, default: 0 }
    },
    hostel: {
      total: { type: Number, default: 0 },
      paid: { type: Number, default: 0 }
    },
    transport: {
      total: { type: Number, default: 0 },
      paid: { type: Number, default: 0 }
    },
    uniform: {
      total: { type: Number, default: 0 },
      paid: { type: Number, default: 0 }
    },
    exam: {
      total: { type: Number, default: 0 },
      paid: { type: Number, default: 0 }
    },
    other: {
      total: { type: Number, default: 0 },
      paid: { type: Number, default: 0 }
    }
  },
  reminderCount: {
    type: Number,
    default: 0
  },
  lastReminderDate: {
    type: Date
  },
  installments: [{
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    gracePeriod: { type: Number, default: 0 },
    lateFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Upcoming', 'Pending', 'Partially Paid', 'Paid', 'Overdue'],
      default: 'Upcoming'
    },
    paidAmount: { type: Number, default: 0 },
    remainingAmount: { type: Number, default: 0 },
    paidDate: { type: Date },
    receiptNumber: { type: String },
    internalNotes: { type: String, default: '' },
    breakdown: {
      admission: { type: Number, default: 0 },
      tuition: { type: Number, default: 0 },
      books: { type: Number, default: 0 },
      hostel: { type: Number, default: 0 },
      transport: { type: Number, default: 0 },
      uniform: { type: Number, default: 0 },
      exam: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    },
    payments: [{
      amount: { type: Number, required: true },
      date: { type: Date, default: Date.now },
      paymentMethod: { type: String, required: true },
      receiptNumber: { type: String, required: true },
      remarks: { type: String, default: '' }
    }]
  }],
  payments: [paymentSchema]
}, { timestamps: true });

module.exports = mongoose.model('Fee', feeSchema);
