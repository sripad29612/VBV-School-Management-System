const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true // e.g., "Nursery", "LKG", "Class VI"
  },
  section: {
    type: String,
    required: true,
    default: 'A'
  },
  maxCapacity: {
    type: Number,
    required: true,
    default: 40
  },
  classTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  },
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  feeStructure: {
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

// Ensure unique combination of class name and section
classSchema.index({ name: 1, section: 1 }, { unique: true });

module.exports = mongoose.model('Class', classSchema);
