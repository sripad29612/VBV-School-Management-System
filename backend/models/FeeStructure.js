const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema({
  academicYear: {
    type: String,
    required: true,
    default: "2026-27"
  },
  className: {
    type: String,
    required: true // e.g., "Class VI", "Nursery"
  },
  heads: {
    admission: { type: Number, default: 0 },
    tuition: { type: Number, default: 0 },
    books: { type: Number, default: 0 },
    hostel: { type: Number, default: 0 },
    transport: { type: Number, default: 0 },
    uniform: { type: Number, default: 0 },
    exam: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  }
}, { timestamps: true });

feeStructureSchema.index({ academicYear: 1, className: 1 }, { unique: true });

module.exports = mongoose.model('FeeStructure', feeStructureSchema);
