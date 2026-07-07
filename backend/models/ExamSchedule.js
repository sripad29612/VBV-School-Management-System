const mongoose = require('mongoose');

const subjectExamSchema = new mongoose.Schema({
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true // e.g. "09:00"
  },
  endTime: {
    type: String,
    required: true // e.g. "12:00"
  },
  maxMarks: {
    type: Number,
    required: true
  },
  invigilator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    default: null
  },
  session: {
    type: String,
    enum: ['Morning', 'Afternoon'],
    default: 'Morning'
  },
  dayNumber: {
    type: Number,
    default: 1
  }
});

const examScheduleSchema = new mongoose.Schema({
  examName: {
    type: String,
    required: true,
    trim: true
  },
  academicYear: {
    type: String,
    required: true,
    default: '2026-27'
  },
  classes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  }],
  subjects: [subjectExamSchema],
  instructions: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Draft', 'Published', 'Completed'],
    default: 'Draft'
  }
}, { timestamps: true });

module.exports = mongoose.model('ExamSchedule', examScheduleSchema);
