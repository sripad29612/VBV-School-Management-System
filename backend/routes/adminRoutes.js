const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  addStudent,
  approveStudent,
  updateStudent,
  archiveStudent,
  restoreStudent,
  permanentlyDeleteStudent,
  addTeacher,
  updateTeacher,
  softDeleteTeacher,
  getFeeStructures,
  createFeeStructure,
  cloneFeeStructure,
  collectFee,
  getClasses,
  createClass,
  updateClass,
  deleteClass,
  getStudentFullProfile,
  promoteStudents,
  globalSearch,
  getReports,
  getSchoolSettings,
  updateSchoolSettings,
  getAuditLogs,
  getDashboardStats,
  getDashboardDetail,
  holdStudent,
  rejectStudent,
  remindDefaulter,
  uploadPhoto,
  addAuditLogDirect,
  payTeacherSalary,
  getPrincipals,
  createPrincipal,
  updatePrincipal,
  approvePrincipal,
  rejectPrincipal,
  suspendPrincipal,
  resetPrincipalPassword,
  deletePrincipal,
  getDrivers,
  addDriver,
  updateDriver,
  deleteDriver,
  getVehicles,
  addVehicle,
  updateVehicle,
  deleteVehicle,
  assignStudentTransport,
  getInstallmentPlans,
  createOrUpdateInstallmentPlan,
  deleteInstallmentPlan,
  publishInstallmentPlan,
  archiveInstallmentPlan,
  updateStudentInstallmentDueDate,
  overrideStudentInstallmentLateFee,
  addStudentInstallmentNote,
  getRoutes,
  addRoute,
  updateRoute,
  deleteRoute,
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense
} = require('../controllers/adminController');

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../public/uploads/profiles');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `profile-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });

const driverUploadDir = path.join(__dirname, '../public/uploads/drivers');
if (!fs.existsSync(driverUploadDir)) {
  fs.mkdirSync(driverUploadDir, { recursive: true });
}

const driverStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, driverUploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `driver-${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const uploadDriverDocs = multer({ storage: driverStorage });

// All admin routes require token authentication and restricting to role 'admin'
router.use(protect);
router.use(authorize('admin'));

// Dashboard Stats & Lazy loading Details
router.get('/dashboard-stats', getDashboardStats);
router.get('/dashboard-detail', getDashboardDetail);

// Student Management Endpoints
router.post('/student', addStudent);
router.post('/student/:id/approve', approveStudent);
router.post('/student/:id/hold', holdStudent);
router.post('/student/:id/reject', rejectStudent);
router.put('/student/:id', updateStudent);
router.delete('/student/:id', archiveStudent);
router.post('/student/:id/restore', restoreStudent);
router.delete('/student/:id/permanent', permanentlyDeleteStudent);
router.get('/student/:id/profile', getStudentFullProfile);
router.post('/promote', promoteStudents);

// Teacher Management Endpoints
router.post('/teacher', addTeacher);
router.put('/teacher/:id', updateTeacher);
router.delete('/teacher/:id', softDeleteTeacher);
router.post('/teacher/:id/pay-salary', payTeacherSalary);

// Expense Management Endpoints
router.get('/expenses', getExpenses);
router.post('/expenses', createExpense);
router.put('/expenses/:id', updateExpense);
router.delete('/expenses/:id', deleteExpense);


// Photo Upload
router.post('/upload-photo', upload.single('photo'), uploadPhoto);

// Classes Configurations
router.get('/classes', getClasses);
router.post('/classes', createClass);
router.put('/classes/:id', updateClass);
router.delete('/classes/:id', deleteClass);

// Fees Configuration & Collections
router.get('/fee-structures', getFeeStructures);
router.post('/fee-structures', createFeeStructure);
router.post('/fees/clone', cloneFeeStructure);
router.post('/fees/collect', collectFee);
router.post('/fees/:id/remind', remindDefaulter);

// Settings Configuration
router.get('/settings', getSchoolSettings);
router.post('/settings', updateSchoolSettings);

// Audit Logging
router.get('/audit-logs', getAuditLogs);
router.post('/audit-logs/direct', addAuditLogDirect);

// Global Search
router.get('/search', globalSearch);

// Report Exports
router.get('/reports', getReports);

// Principal Management
router.get('/principals', getPrincipals);
router.post('/principals', createPrincipal);
router.put('/principals/:id', updatePrincipal);
router.delete('/principals/:id', deletePrincipal);
router.post('/principals/:id/approve', approvePrincipal);
router.post('/principals/:id/reject', rejectPrincipal);
router.post('/principals/:id/suspend', suspendPrincipal);
router.post('/principals/:id/reset-password', resetPrincipalPassword);

// Driver Management Endpoints
router.get('/drivers', getDrivers);
router.post('/drivers', uploadDriverDocs.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'licenceDoc', maxCount: 1 },
  { name: 'aadhaarDoc', maxCount: 1 }
]), addDriver);
router.put('/drivers/:id', uploadDriverDocs.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'licenceDoc', maxCount: 1 },
  { name: 'aadhaarDoc', maxCount: 1 }
]), updateDriver);
router.delete('/drivers/:id', deleteDriver);

// Vehicle Management Endpoints
router.get('/vehicles', getVehicles);
router.post('/vehicles', addVehicle);
router.put('/vehicles/:id', updateVehicle);
router.delete('/vehicles/:id', deleteVehicle);

// Student Transport Mapping
router.post('/students/:studentId/transport', assignStudentTransport);

// Route Management Endpoints
router.get('/routes', getRoutes);
router.post('/routes', addRoute);
router.put('/routes/:id', updateRoute);
router.delete('/routes/:id', deleteRoute);

// Installment Plan templates
router.get('/installment-plans', getInstallmentPlans);
router.post('/installment-plans', createOrUpdateInstallmentPlan);
router.delete('/installment-plans/:id', deleteInstallmentPlan);
router.post('/installment-plans/:id/publish', publishInstallmentPlan);
router.post('/installment-plans/:id/archive', archiveInstallmentPlan);

// Student-specific fee ledger routes
router.put('/fees/student/:studentId/installment/:installmentId/due-date', updateStudentInstallmentDueDate);
router.put('/fees/student/:studentId/installment/:installmentId/late-fee-override', overrideStudentInstallmentLateFee);
router.put('/fees/student/:studentId/installment/:installmentId/note', addStudentInstallmentNote);

module.exports = router;
