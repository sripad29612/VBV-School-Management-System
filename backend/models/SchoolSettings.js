const mongoose = require('mongoose');

const schoolSettingsSchema = new mongoose.Schema({
  academicYear: { type: String, default: '2026-27' },
  schoolName: { type: String, default: 'Vidya Bharathi Vidyapeeth' },
  schoolMotto: { type: String, default: 'विद्या ददाति विनयम' },
  udiseCode: { type: String, default: '36161101901' },
  affiliationNumber: { type: String, default: '3630042' },
  schoolBoard: { type: String, default: 'State Board' },
  schoolAddress: { type: String, default: 'Village: Palsi, Mandal: Kubeer, District: Nirmal, Telangana - 504103' },
  schoolPhone: { type: String, default: '+91 99483 70709' },
  schoolEmail: { type: String, default: 'info@vbvschool.edu.in' },
  schoolWebsite: { type: String, default: 'www.vbvschool.edu.in' },
  principalName: { type: String, default: 'Not Assigned' },
  principalSignature: { type: String, default: '' },
  schoolSeal: { type: String, default: '' },
  reportCardFooter: { type: String, default: 'Designed by Vidya Bharathi Vidyapeeth' },
  receiptFooter: { type: String, default: 'Thank you for your payment. Keep this receipt for future reference.' },
  workingDays: { type: [String], default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] },
  schoolTimings: { type: String, default: '08:30 AM - 04:00 PM' },
  sessionStart: { type: Date, default: () => new Date('2026-06-12') },
  sessionEnd: { type: Date, default: () => new Date('2027-04-20') },
}, { timestamps: true });

module.exports = mongoose.model('SchoolSettings', schoolSettingsSchema);
