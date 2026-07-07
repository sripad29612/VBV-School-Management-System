const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  recipientRole: {
    type: String,
    enum: ['all', 'student', 'parent', 'teacher', 'principal'],
    required: true,
    default: 'all'
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class' // Optional filter for specific classroom targets
  },
  type: {
    type: String,
    enum: ['Homework', 'Exam', 'Holiday', 'Fee', 'Announcement', 'Meeting', 'Alert'],
    required: true,
    default: 'Announcement'
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent'
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
