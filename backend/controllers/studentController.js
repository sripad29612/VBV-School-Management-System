const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Timetable = require('../models/Timetable');
const Homework = require('../models/Homework');
const StudyMaterial = require('../models/StudyMaterial');
const Result = require('../models/Result');
const Fee = require('../models/Fee');
const Notification = require('../models/Notification');
const QRCode = require('qrcode');
const ExamSchedule = require('../models/ExamSchedule');
const Calendar = require('../models/Calendar');
const { generateReportCardPDF, generateFeeReceiptPDF, generateExamTimetablePDF } = require('../utils/pdfGenerator');
const { calculateDynamicLedger } = require('../utils/feeLedgerCalculator');

// Get Student profile linked to user ID
const getStudentProfile = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id })
      .populate('class')
      .populate({ path: 'parent', select: '-children' });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Dashboard overview metrics
const getStudentDashboard = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id }).populate('class');
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // 1. Calculate Attendance Percentage
    const totalDays = await Attendance.countDocuments({ student: student._id });
    const presentDays = await Attendance.countDocuments({ student: student._id, status: { $in: ['Present', 'Late'] } });
    const attendancePct = totalDays > 0 ? (presentDays / totalDays) * 100 : 100;

    // 2. Fetch Today's Timetable
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayDay = days[new Date().getDay()];
    // Fallback to Monday if weekend
    const activeDay = todayDay === 'Sunday' ? 'Monday' : todayDay;
    const timetable = await Timetable.findOne({ class: student.class, day: activeDay }).populate('periods.subject').populate('periods.teacher');

    // 3. Fetch Homework & Assignments (last 5)
    const homework = await Homework.find({ class: student.class })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('subject');

    // 4. Fetch Recent Notifications
    const notifications = await Notification.find({
      $or: [
        { recipientRole: 'all' },
        { recipientRole: 'student' },
        { class: student.class }
      ]
    }).sort({ createdAt: -1 }).limit(10);

    res.json({
      attendancePct,
      todayTimetable: timetable ? timetable.periods : [],
      recentHomework: homework,
      recentNotifications: notifications,
      studentName: student.name,
      rollNumber: student.rollNumber,
      className: student.class.name
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Full Timetable
const getStudentTimetable = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    const timetable = await Timetable.find({ class: student.class }).populate('periods.subject').populate('periods.teacher');
    res.json(timetable);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Homework Tracker
const getStudentHomework = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    const homework = await Homework.find({ class: student.class })
      .sort({ dueDate: 1 })
      .populate('subject')
      .populate('teacher', 'username');
    res.json(homework);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Study Materials
const getStudentStudyMaterials = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    const materials = await StudyMaterial.find({ class: student.class })
      .sort({ createdAt: -1 })
      .populate('subject')
      .populate('teacher', 'username');
    res.json(materials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Exam Results
const getStudentResults = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    const results = await Result.find({ student: student._id, published: true })
      .populate('marks.subject')
      .populate('class');
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Detailed Attendance History
const getStudentAttendance = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    const attendance = await Attendance.find({ student: student._id }).sort({ date: -1 });
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Digital ID QR Generation
const getDigitalID = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id }).populate('class');
    if (!student) {
      return res.status(404).json({ message: 'Student details not found' });
    }

    const idCardData = {
      name: student.name,
      rollNumber: student.rollNumber,
      admissionNumber: student.admissionNumber,
      class: student.class.name,
      section: student.class.section,
      bloodGroup: student.bloodGroup,
      emergencyContact: student.emergencyContact
    };

    // Generate QR Code as Base64 string
    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(idCardData));

    res.json({
      ...idCardData,
      photo: student.photo,
      logoUrl: '/logo.jpg',
      schoolName: 'VIDYA BHARATHI VIDYAPEETH',
      address: 'Palsi, Kubeer, Nirmal',
      qrCode: qrCodeCodeDataUrl = qrCodeDataUrl
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Download Report Card PDF
const downloadReportCard = async (req, res) => {
  try {
    const { resultId } = req.params;
    const student = await Student.findOne({ user: req.user._id });
    const result = await Result.findOne({ _id: resultId, student: student._id })
      .populate('marks.subject')
      .populate('class');

    if (!result) {
      return res.status(404).json({ message: 'Report card not found or not published' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Report_Card_${student.rollNumber}.pdf`);

    generateReportCardPDF(res, result, student, result.class.name);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Fetch student fees and print PDF receipt
const getStudentFees = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    const fee = await Fee.findOne({ student: student._id });
    res.json(calculateDynamicLedger(fee));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const downloadFeeReceipt = async (req, res) => {
  try {
    const { receiptNumber } = req.params;
    const student = await Student.findOne({ user: req.user._id }).populate('class');
    const fee = await Fee.findOne({ student: student._id });

    if (!fee) {
      return res.status(404).json({ message: 'Fee record not found' });
    }

    const payment = fee.payments.find(p => p.receiptNumber === receiptNumber);
    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found for this receipt number' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Fee_Receipt_${receiptNumber}.pdf`);

    generateFeeReceiptPDF(res, fee, payment, student, student.class.name);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getStudentExams = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student profile not found.' });

    const exams = await ExamSchedule.find({ classes: student.class, status: 'Published' })
      .populate('subjects.subject')
      .populate('subjects.invigilator', 'name')
      .sort({ 'subjects.date': 1 });
    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getStudentExamSchedulePDF = async (req, res) => {
  const { id } = req.params;
  try {
    const student = await Student.findOne({ user: req.user._id }).populate('class');
    if (!student) return res.status(404).json({ message: 'Student profile not found.' });

    const exam = await ExamSchedule.findOne({ _id: id, classes: student.class, status: 'Published' })
      .populate('subjects.subject')
      .populate('subjects.invigilator', 'name');
    if (!exam) return res.status(404).json({ message: 'Exam schedule not found or not published for your class.' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Exam_Timetable_${exam.examName.replace(/\s+/g, '_')}.pdf`);

    generateExamTimetablePDF(res, exam, student.class.name);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCalendarEvents = async (req, res) => {
  try {
    const list = await Calendar.find().sort({ startDate: 1 });
    const formatted = list.map(ev => {
      const obj = ev.toObject();
      let color = '#8B5CF6'; // Default purple
      if (ev.type === 'Holiday') color = '#F5A623';
      else if (ev.type === 'Exam') color = '#EF4444';
      else if (ev.type === 'Event') color = '#3B82F6';
      else if (ev.type === 'Meeting') color = '#10B981';
      else if (ev.type === 'Competition') color = '#EC4899';
      
      const date = ev.startDate ? ev.startDate.toISOString().split('T')[0] : '';
      return {
        ...obj,
        date,
        color
      };
    });
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getStudentProfile,
  getStudentDashboard,
  getStudentTimetable,
  getStudentHomework,
  getStudentStudyMaterials,
  getStudentResults,
  getStudentAttendance,
  getDigitalID,
  downloadReportCard,
  getStudentFees,
  downloadFeeReceipt,
  getStudentExams,
  getStudentExamSchedulePDF,
  getCalendarEvents
};
