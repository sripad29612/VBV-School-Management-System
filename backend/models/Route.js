const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  routeName: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  startPoint: {
    type: String,
    required: true,
    trim: true
  },
  stops: {
    type: [String],
    default: []
  },
  endPoint: {
    type: String,
    required: true,
    trim: true
  },
  pickupTime: {
    type: String,
    required: true
  },
  dropTime: {
    type: String,
    required: true
  },
  monthlyFee: {
    type: Number,
    required: true,
    min: 0
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TransportVehicle',
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Route', routeSchema);
