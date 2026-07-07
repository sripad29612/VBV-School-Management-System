const mongoose = require('mongoose');

const teacherAttendanceSchema = new mongoose.Schema({
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  session: {
    type: String,
    enum: ['Morning', 'Afternoon'],
    required: true
  },
  status: {
    type: String,
    enum: ['Present', 'Late', 'Leave', 'Absent'],
    default: 'Present'
  },
  time: {
    type: String,
    required: true
  }
}, { timestamps: true });

// A teacher can only have one attendance log per session per day
teacherAttendanceSchema.index({ teacher: 1, date: 1, session: 1 }, { unique: true });

module.exports = mongoose.model('TeacherAttendance', teacherAttendanceSchema);
