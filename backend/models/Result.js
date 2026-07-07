const mongoose = require('mongoose');

const subjectMarkSchema = new mongoose.Schema({
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  marksObtained: {
    type: Number,
    required: true,
    min: 0
  },
  maxMarks: {
    type: Number,
    required: true,
    default: 100
  }
});

const resultSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  examType: {
    type: String,
    required: true,
    enum: ['Quarterly', 'Half-Yearly', 'Annual']
  },
  marks: [subjectMarkSchema],
  totalMarks: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    required: true
  },
  grade: {
    type: String,
    required: true
  },
  rank: {
    type: Number
  },
  remarks: {
    type: String,
    default: 'Keep it up!'
  },
  published: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Prevent duplicate results for the same exam type for a student
resultSchema.index({ student: 1, examType: 1 }, { unique: true });

module.exports = mongoose.model('Result', resultSchema);
