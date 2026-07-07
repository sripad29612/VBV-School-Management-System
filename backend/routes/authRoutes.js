const express = require('express');
const router = express.Router();
const {
  loginStudent,
  loginParent,
  loginTeacher,
  loginPrincipal,
  loginAdmin
} = require('../controllers/authController');

router.post('/login/student', loginStudent);
router.post('/login/parent', loginParent);
router.post('/login/teacher', loginTeacher);
router.post('/login/principal', loginPrincipal);
router.post('/login/admin', loginAdmin);

module.exports = router;
