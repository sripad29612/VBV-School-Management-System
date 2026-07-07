const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getPrincipalDashboard,
  addStudent,
  addTeacher,
  publishResults,
  broadcastNotification,
  monitorSnapshots,
  backupDatabase,
  getLeaves,
  updateLeaveStatus,
  createSubstituteCover,
  getSubstitutes,
  saveTimetable,
  deleteTimetablePeriod,
  getRooms,
  getSubjects,
  copyTimetable,
  duplicateAcademicYear,
  getStudents,
  getTeachers,
  getNotifications,
  getCalendarEvents,
  createCalendarEvent,
  deleteCalendarEvent,
  getTimetableByClass,
  updateClassTeacher,
  updateTeacherAssignment,
  getClasses,
  getPrincipalReports,
  getExams,
  createExamSchedule,
  updateExamSchedule,
  deleteExamSchedule,
  publishExamSchedule,
  copyPreviousExamSchedule,
  duplicateExamSchedule,
  getExamSchedulePDF
} = require('../controllers/principalController');

// All principal routes are protected and restricted to 'principal' role
router.use(protect);
router.use(authorize('principal'));

router.get('/dashboard', getPrincipalDashboard);
router.post('/student', addStudent);
router.post('/teacher', addTeacher);
router.post('/results/publish', publishResults);
router.post('/notification', broadcastNotification);
router.get('/snapshots/monitor', monitorSnapshots);
router.post('/system/backup', backupDatabase);

// New Routes
router.get('/leaves', getLeaves);
router.post('/leave/:id/approve', updateLeaveStatus);
router.post('/substitute', createSubstituteCover);
router.get('/substitutes', getSubstitutes);
router.post('/timetable', saveTimetable);
router.get('/timetable/:classId', getTimetableByClass);
router.delete('/timetable/:classId/:day/:periodId', deleteTimetablePeriod);
router.get('/rooms', getRooms);
router.get('/subjects', getSubjects);
router.post('/timetable/copy', copyTimetable);
router.post('/timetable/duplicate-year', duplicateAcademicYear);
router.put('/class/:id', updateClassTeacher);
router.put('/teacher/:id/assignment', updateTeacherAssignment);
router.get('/classes', getClasses);
router.get('/reports', getPrincipalReports);

// Database listing and calendar CRUD endpoints
router.get('/students', getStudents);
router.get('/teachers', getTeachers);
router.get('/notifications', getNotifications);
router.get('/calendar', getCalendarEvents);
router.post('/calendar', createCalendarEvent);
router.delete('/calendar/:id', deleteCalendarEvent);

// Exam Timetable Endpoints
router.get('/exams', getExams);
router.post('/exams', createExamSchedule);
router.put('/exams/:id', updateExamSchedule);
router.delete('/exams/:id', deleteExamSchedule);
router.post('/exams/:id/publish', publishExamSchedule);
router.post('/exams/:id/copy-previous', copyPreviousExamSchedule);
router.post('/exams/:id/duplicate', duplicateExamSchedule);
router.get('/exams/:id/pdf', getExamSchedulePDF);

module.exports = router;
