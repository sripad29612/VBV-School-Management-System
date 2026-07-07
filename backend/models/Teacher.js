const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  teacherId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  aadhaar: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  dob: {
    type: Date,
    required: true
  },
  qualification: {
    type: String,
    required: true,
    trim: true
  },
  photo: {
    type: String,
    default: ''
  },
  salaryType: {
    type: String,
    enum: ['Monthly', 'Daily Wage', 'Contract'],
    default: 'Monthly',
    required: true
  },
  basicSalary: {
    type: Number,
    default: 0
  },
  allowance: {
    type: Number,
    default: 0
  },
  totalSalary: {
    type: Number,
    default: 0
  },
  salaryPayments: [
    {
      amount: { type: Number, required: true },
      date: { type: Date, default: Date.now },
      paymentMethod: { type: String, required: true },
      referenceNumber: { type: String, default: '' },
      remarks: { type: String, default: '' },
      paidBy: { type: String, default: 'ADMIN' },
      salaryMonth: { type: String, required: true }
    }
  ],
  address: {
    type: String,
    default: ''
  },
  joiningDate: {
    type: Date,
    default: Date.now
  },
  department: {
    type: String,
    default: 'Academics'
  },
  experience: {
    type: String,
    default: '3 years'
  },
  designation: {
    type: String,
    default: 'TGT Teacher'
  },
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  assignedClass: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  },
  assignedClasses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  }],
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  leaves: [{
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Teacher', teacherSchema);
