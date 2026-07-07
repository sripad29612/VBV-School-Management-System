const mongoose = require('mongoose');

const DailyReportSchema = new mongoose.Schema({
  className: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  chapter: {
    type: String,
    required: true
  },
  topicCovered: {
    type: String,
    required: true
  },
  learningObjectives: {
    type: String
  },
  teachingMethod: {
    type: String
  },
  activities: {
    type: String
  },
  homeworkGiven: {
    type: String
  },
  studentsPresent: {
    type: Number,
    default: 0
  },
  completionStatus: {
    type: String,
    enum: ['Completed', 'In Progress', 'Delayed'],
    default: 'Completed'
  },
  notes: {
    type: String
  },
  teacherName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Draft', 'Submitted', 'Reviewed', 'Approved', 'Rejected', 'Returned'],
    default: 'Submitted'
  },
  submissionTime: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DailyReport', DailyReportSchema);
