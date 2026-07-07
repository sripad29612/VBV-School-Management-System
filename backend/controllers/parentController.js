const Parent = require('../models/Parent');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Homework = require('../models/Homework');
const Result = require('../models/Result');
const Fee = require('../models/Fee');
const Notification = require('../models/Notification');
const Snapshot = require('../models/Snapshot');
const Calendar = require('../models/Calendar');
const { ClassSettings } = require('../models/Snapshot');
const ExamSchedule = require('../models/ExamSchedule');
const { generateReportCardPDF, generateFeeReceiptPDF, generateExamTimetablePDF } = require('../utils/pdfGenerator');
const Timetable = require('../models/Timetable');
const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const { calculateDynamicLedger } = require('../utils/feeLedgerCalculator');

// Helper to verify if student is indeed a child of the authenticated parent
const verifyParentChildRelation = async (parentUserId, studentId) => {
  const parent = await Parent.findOne({ user: parentUserId });
  if (!parent) return false;
  return parent.children.includes(studentId);
};

// Get Parent Profile & Children
const getParentDashboard = async (req, res) => {
  try {
    const parent = await Parent.findOne({ user: req.user._id }).populate({
      path: 'children',
      populate: { path: 'class' }
    });

    if (!parent) {
      return res.status(404).json({ message: 'Parent profile not found' });
    }

    // Compile recent alerts and children dashboard snippets
    const childrenSummaries = [];

    for (const child of parent.children) {
      // Attendance Pct
      const totalDays = await Attendance.countDocuments({ student: child._id });
      const presentDays = await Attendance.countDocuments({ student: child._id, status: { $in: ['Present', 'Late'] } });
      const attendancePct = totalDays > 0 ? (presentDays / totalDays) * 100 : 100;

      // Pending Homework (due in future or unsubmitted)
      const pendingHomework = await Homework.countDocuments({
        class: child.class._id,
        dueDate: { $gte: new Date() }
      });

      // Find class teacher name dynamically:
      const cls = await Class.findById(child.class._id).populate('classTeacher');
      const classTeacherName = cls && cls.classTeacher ? cls.classTeacher.name : 'Class Teacher';

      // Fees Summary
      const feeDoc = await Fee.findOne({ student: child._id });
      const fee = calculateDynamicLedger(feeDoc);

      childrenSummaries.push({
        _id: child._id,
        name: child.name,
        rollNumber: child.rollNumber,
        class: child.class.name,
        section: child.class.section,
        attendancePct,
        pendingHomework,
        feePending: fee ? fee.balanceAmount : 0,
        photo: child.photo,
        transport: child.transport || { route: '', vehicleNumber: '', pickupPoint: '', fee: 0 },
        classTeacherName
      });
    }

    const childrenClassIds = parent ? parent.children.map(c => c.class?._id || c.class).filter(Boolean) : [];

    // General notifications
    const notifications = await Notification.find({
      $or: [
        { recipientRole: 'all' },
        { recipientRole: 'parent' },
        { class: { $in: childrenClassIds } }
      ]
    }).sort({ createdAt: -1 }).limit(10);

    res.json({
      fatherName: parent.fatherName,
      motherName: parent.motherName,
      phone: parent.phone,
      address: parent.address,
      children: childrenSummaries,
      notifications
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Classroom Snapshots for a child
// Parents can only view their child's classroom
const getClassroomSnapshots = async (req, res) => {
  const { studentId } = req.params;

  try {
    // 1. Verify parent-child relationship
    const isRelated = await verifyParentChildRelation(req.user._id, studentId);
    if (!isRelated) {
      return res.status(403).json({ message: 'Access denied: student is not registered under this parent' });
    }

    // 2. Fetch student details to get their class ID
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // 3. Check if snapshot is enabled for the class
    const settings = await ClassSettings.findOne({ class: student.class });
    const isEnabled = settings ? settings.snapshotEnabled : true;

    if (!isEnabled) {
      return res.json({
        enabled: false,
        message: 'Camera capture has been temporarily disabled for this classroom by the teacher.',
        snapshots: []
      });
    }

    // 4. Retrieve snapshots within the last 48 hours for this class
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const snapshots = await Snapshot.find({
      class: student.class,
      timestamp: { $gte: fortyEightHoursAgo }
    }).sort({ timestamp: -1 });

    res.json({
      enabled: true,
      latestImage: snapshots.length > 0 ? snapshots[0].imageUrl : '',
      latestTimestamp: snapshots.length > 0 ? snapshots[0].timestamp : null,
      timeline: snapshots
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Attendance for a specific child
const getChildAttendance = async (req, res) => {
  const { studentId } = req.params;
  try {
    const isRelated = await verifyParentChildRelation(req.user._id, studentId);
    if (!isRelated) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const attendance = await Attendance.find({ student: studentId }).sort({ date: -1 });
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Homework for a specific child
const getChildHomework = async (req, res) => {
  const { studentId } = req.params;
  try {
    const isRelated = await verifyParentChildRelation(req.user._id, studentId);
    if (!isRelated) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const student = await Student.findById(studentId);
    const homework = await Homework.find({ class: student.class })
      .sort({ dueDate: 1 })
      .populate('subject')
      .populate('teacher', 'username');
    res.json(homework);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Exam Results for a specific child
const getChildResults = async (req, res) => {
  const { studentId } = req.params;
  try {
    const isRelated = await verifyParentChildRelation(req.user._id, studentId);
    if (!isRelated) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const results = await Result.find({ student: studentId, published: true })
      .populate('marks.subject')
      .populate('class');
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Fees for a specific child
const getChildFees = async (req, res) => {
  const { studentId } = req.params;
  try {
    const isRelated = await verifyParentChildRelation(req.user._id, studentId);
    if (!isRelated) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const fee = await Fee.findOne({ student: studentId });
    res.json(calculateDynamicLedger(fee));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Download Child Report Card PDF
const downloadChildReportCard = async (req, res) => {
  const { studentId, resultId } = req.params;
  try {
    const isRelated = await verifyParentChildRelation(req.user._id, studentId);
    if (!isRelated) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const student = await Student.findById(studentId);
    const result = await Result.findOne({ _id: resultId, student: studentId })
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

// Download Child Fee Receipt PDF
const downloadChildFeeReceipt = async (req, res) => {
  const { studentId, receiptNumber } = req.params;
  try {
    const isRelated = await verifyParentChildRelation(req.user._id, studentId);
    if (!isRelated) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const student = await Student.findById(studentId);
    const fee = await Fee.findOne({ student: studentId });

    if (!fee) {
      return res.status(404).json({ message: 'Fee record not found' });
    }

    const payment = fee.payments.find(p => p.receiptNumber === receiptNumber);
    if (!payment) {
      return res.status(404).json({ message: 'Receipt not found' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Fee_Receipt_${receiptNumber}.pdf`);

    generateFeeReceiptPDF(res, fee, payment, student, student.class.name);
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

const getChildTeachers = async (req, res) => {
  const { studentId } = req.params;
  try {
    const isRelated = await verifyParentChildRelation(req.user._id, studentId);
    if (!isRelated) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const cls = await Class.findById(student.class).populate('classTeacher');
    const timetable = await Timetable.find({ class: student.class });
    
    const teacherIds = new Set();
    if (cls && cls.classTeacher) {
      teacherIds.add(cls.classTeacher._id.toString());
    }
    
    for (const t of timetable) {
      for (const p of t.periods) {
        if (p.teacher) {
          teacherIds.add(p.teacher.toString());
        }
      }
    }

    const teachersList = await Teacher.find({
      $or: [
        { _id: { $in: Array.from(teacherIds) } },
        { user: { $in: Array.from(teacherIds) } }
      ]
    }).populate('assignedClass');

    const formatted = teachersList.map(t => ({
      name: t.name,
      role: t.assignedClass && t.assignedClass._id.toString() === student.class.toString()
        ? `Class Teacher & ${t.qualification || 'Subject Instructor'}`
        : `${t.qualification || 'Subject'} Instructor`,
      isOnline: true,
      phone: t.phone || '+919876543201',
      unread: false
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getChildTimetable = async (req, res) => {
  const { studentId } = req.params;
  try {
    const isRelated = await verifyParentChildRelation(req.user._id, studentId);
    if (!isRelated) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const timetable = await Timetable.find({ class: student.class }).populate('periods.subject').populate('periods.teacher');
    res.json(timetable);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getChildTransport = async (req, res) => {
  const { studentId } = req.params;
  try {
    const isRelated = await verifyParentChildRelation(req.user._id, studentId);
    if (!isRelated) {
      return res.status(403).json({ message: 'Access denied. Student is not registered as your child.' });
    }

    const student = await Student.findById(studentId).populate({
      path: 'transport.vehicle',
      populate: { path: 'driver' }
    });
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    res.json(student.transport);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getChildExams = async (req, res) => {
  const { studentId } = req.params;
  try {
    const isRelated = await verifyParentChildRelation(req.user._id, studentId);
    if (!isRelated) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    const exams = await ExamSchedule.find({ classes: student.class, status: 'Published' })
      .populate('subjects.subject')
      .populate('subjects.invigilator', 'name')
      .sort({ 'subjects.date': 1 });

    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getChildExamSchedulePDF = async (req, res) => {
  const { studentId, examId } = req.params;
  try {
    const isRelated = await verifyParentChildRelation(req.user._id, studentId);
    if (!isRelated) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const student = await Student.findById(studentId).populate('class');
    if (!student) return res.status(404).json({ message: 'Student not found.' });

    const exam = await ExamSchedule.findOne({ _id: examId, classes: student.class, status: 'Published' })
      .populate('subjects.subject')
      .populate('subjects.invigilator', 'name');
    if (!exam) {
      return res.status(404).json({ message: 'Exam schedule not found or not published.' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Exam_Timetable_${exam.examName.replace(/\s+/g, '_')}.pdf`);

    generateExamTimetablePDF(res, exam, student.class.name);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getParentDashboard,
  getClassroomSnapshots,
  getChildAttendance,
  getChildHomework,
  getChildResults,
  getChildFees,
  downloadChildReportCard,
  downloadChildFeeReceipt,
  getCalendarEvents,
  getChildTeachers,
  getChildTimetable,
  getChildTransport,
  getChildExams,
  getChildExamSchedulePDF
};
