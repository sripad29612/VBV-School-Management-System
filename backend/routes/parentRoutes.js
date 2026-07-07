const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
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
} = require('../controllers/parentController');

// All parent routes are protected and restricted to 'parent' role
router.use(protect);
router.use(authorize('parent'));

router.get('/dashboard', getParentDashboard);
router.get('/calendar', getCalendarEvents);
router.get('/child/:studentId/snapshots', getClassroomSnapshots);
router.get('/child/:studentId/attendance', getChildAttendance);
router.get('/child/:studentId/homework', getChildHomework);
router.get('/child/:studentId/results', getChildResults);
router.get('/child/:studentId/fees', getChildFees);
router.get('/child/:studentId/teachers', getChildTeachers);
router.get('/child/:studentId/timetable', getChildTimetable);
router.get('/child/:studentId/transport', getChildTransport);
router.get('/child/:studentId/exams', getChildExams);
router.get('/child/:studentId/exams/:examId/pdf', getChildExamSchedulePDF);

router.get('/child/:studentId/results/:resultId/download', downloadChildReportCard);
router.get('/child/:studentId/fees/receipt/:receiptNumber/download', downloadChildFeeReceipt);

module.exports = router;
