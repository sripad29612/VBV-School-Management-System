const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Submitted', 'Late'],
    default: 'Pending'
  },
  submittedAt: {
    type: Date
  },
  remarks: {
    type: String,
    default: ''
  }
});

const homeworkSchema = new mongoose.Schema({
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  attachmentUrl: {
    type: String,
    default: ''
  },
  dueDate: {
    type: Date,
    required: true
  },
  submissions: [submissionSchema]
}, { timestamps: true });

module.exports = mongoose.model('Homework', homeworkSchema);
