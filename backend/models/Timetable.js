const mongoose = require('mongoose');

const periodSchema = new mongoose.Schema({
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher', // Refers to the teacher profile
    required: true
  },
  room: {
    type: String,
    default: ''
  },
  startTime: {
    type: String,
    required: true // e.g. "09:00 AM"
  },
  endTime: {
    type: String,
    required: true // e.g. "09:45 AM"
  }
});

const timetableSchema = new mongoose.Schema({
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  day: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  },
  academicYear: {
    type: String,
    default: '2026-27'
  },
  periods: [periodSchema]
}, { timestamps: true });

// A class should only have one timetable record per day
timetableSchema.index({ class: 1, day: 1 }, { unique: true });

module.exports = mongoose.model('Timetable', timetableSchema);
