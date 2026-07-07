const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Annual Day', 'Sports Day', 'Independence Day', 'Yoga Day', 'Science Fair', 'Class Activities']
  },
  images: [{
    type: String, // URLs of images
    required: true
  }],
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Gallery', gallerySchema);
