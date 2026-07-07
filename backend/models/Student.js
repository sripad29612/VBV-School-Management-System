const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  rollNumber: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  admissionNumber: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent'
  },
  dob: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female'],
    default: 'Male',
    required: true
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: true
  },
  religion: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    default: ''
  },
  photo: {
    type: String,
    default: ''
  },
  emergencyContact: {
    type: String,
    required: true
  },
  aadhaar: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Hold', 'Approved', 'Rejected', 'Transferred', 'Alumni', 'Left School', 'Archived'],
    default: 'Pending'
  },
  archiveReason: {
    type: String,
    default: ''
  },
  archiveRemarks: {
    type: String,
    default: ''
  },
  customFees: {
    admission: { type: Number, default: 0 },
    tuition: { type: Number, default: 0 },
    books: { type: Number, default: 0 },
    hostel: { type: Number, default: 0 },
    transport: { type: Number, default: 0 },
    uniform: { type: Number, default: 0 },
    exam: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },
  transport: {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TransportVehicle',
      default: null
    },
    route: { type: String, default: '' },
    pickupPoint: { type: String, default: '' },
    dropPoint: { type: String, default: '' },
    pickupTime: { type: String, default: '' },
    dropTime: { type: String, default: '' },
    fee: { type: Number, default: 0 }
  },
  library: {
    cardNumber: { type: String, default: '' },
    booksBorrowed: [{
      title: String,
      borrowDate: { type: Date, default: Date.now },
      returnDate: Date,
      status: { type: String, enum: ['Issued', 'Returned'], default: 'Issued' }
    }]
  },
  leaves: [{
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
