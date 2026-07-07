const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
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
} = require('../controllers/studentController');

// All student routes are protected and restricted to 'student' role
router.use(protect);
router.use(authorize('student'));

router.get('/profile', getStudentProfile);
router.get('/dashboard', getStudentDashboard);
router.get('/timetable', getStudentTimetable);
router.get('/homework', getStudentHomework);
router.get('/study-materials', getStudentStudyMaterials);
router.get('/results', getStudentResults);
router.get('/attendance', getStudentAttendance);
router.get('/digital-id', getDigitalID);
router.get('/fees', getStudentFees);
router.get('/exams', getStudentExams);
router.get('/calendar', getCalendarEvents);
router.get('/exams/:id/pdf', getStudentExamSchedulePDF);

router.get('/results/:resultId/download', downloadReportCard);
router.get('/fees/receipt/:receiptNumber/download', downloadFeeReceipt);

module.exports = router;
