const mongoose = require('mongoose');

const transportVehicleSchema = new mongoose.Schema({
  vehicleNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  registrationNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  vehicleType: {
    type: String,
    required: true,
    trim: true
  },
  capacity: {
    type: Number,
    required: true
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true
  },
  attendant: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['Active', 'Maintenance', 'Inactive'],
    default: 'Active'
  },
  insuranceExpiry: {
    type: Date,
    required: true
  },
  fitnessCertificateExpiry: {
    type: Date,
    required: true
  },
  pollutionCertificateExpiry: {
    type: Date,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('TransportVehicle', transportVehicleSchema);
