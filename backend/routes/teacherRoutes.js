const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getTeacherDashboard,
  getClassStudents,
  markAttendance,
  uploadHomework,
  uploadStudyMaterial,
  uploadMarks,
  enableDisableSnapshots,
  getStudentReports,
  markSelfAttendance,
  getSelfAttendance,
  applyLeave,
  getLeaveRequests,
  postAnnouncement,
  getAnnouncements,
  getTeacherExamDuties,
  getTeacherSalaryHistory,
  getCalendarEvents
} = require('../controllers/teacherController');

// Multer Storage Configuration for uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = 'public/uploads';
    if (file.fieldname === 'homeworkFile') {
      uploadPath = 'public/uploads/homework';
    } else if (file.fieldname === 'materialFile') {
      uploadPath = 'public/uploads/materials';
    }
    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage: storage });

// All teacher routes are protected and restricted to 'teacher' role
router.use(protect);
router.use(authorize('teacher'));

router.get('/dashboard', getTeacherDashboard);
router.get('/class/:classId/students', getClassStudents);
router.post('/attendance', markAttendance);

// Self attendance
router.post('/self-attendance', markSelfAttendance);
router.get('/self-attendance', getSelfAttendance);

// Leaves
router.post('/leave', applyLeave);
router.get('/leaves', getLeaveRequests);

// Support homework uploads with files
router.post('/homework', upload.single('homeworkFile'), uploadHomework);

// Support material uploads with files
router.post('/study-material', upload.single('materialFile'), uploadStudyMaterial);

router.post('/marks', uploadMarks);
router.post('/snapshots/toggle', enableDisableSnapshots);
router.get('/class/:classId/reports', getStudentReports);

// Announcements
router.post('/announcement', postAnnouncement);
router.get('/announcements', getAnnouncements);

// Exam Duties
router.get('/exams/duties', getTeacherExamDuties);

// Salary History
router.get('/salary-history', getTeacherSalaryHistory);

// Calendar
router.get('/calendar', getCalendarEvents);

module.exports = router;
