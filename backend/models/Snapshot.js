const mongoose = require('mongoose');

const snapshotSchema = new mongoose.Schema({
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  watermarkText: {
    type: String,
    default: 'VIDYA BHARATHI VIDYAPEETH'
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // MongoDB TTL index to automatically delete expired snapshot documents
  }
}, { timestamps: true });

module.exports = mongoose.model('Snapshot', snapshotSchema);
const classSettingsSchema = new mongoose.Schema({
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
    unique: true
  },
  snapshotEnabled: {
    type: Boolean,
    default: true
  }
});
module.exports.ClassSettings = mongoose.model('ClassSettings', classSettingsSchema);
