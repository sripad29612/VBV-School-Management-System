const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  mobile: {
    type: String,
    required: true,
    trim: true
  },
  alternateMobile: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  dob: {
    type: Date,
    required: true
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: true
  },
  aadhaar: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  licenceNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  licenceCategory: {
    type: String,
    trim: true
  },
  licenceIssueDate: {
    type: Date
  },
  licenceExpiryDate: {
    type: Date,
    required: true
  },
  experience: {
    type: Number,
    default: 0
  },
  emergencyContact: {
    type: String,
    required: true,
    trim: true
  },
  photo: {
    type: String,
    default: ''
  },
  aadhaarDoc: {
    type: String,
    default: ''
  },
  licenceDoc: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Driver', driverSchema);
