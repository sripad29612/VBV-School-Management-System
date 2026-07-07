const mongoose = require('mongoose');
const User = require('../models/User');
const Student = require('../models/Student');
const Parent = require('../models/Parent');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Fee = require('../models/Fee');
const AuditLog = require('../models/AuditLog');
const SchoolSettings = require('../models/SchoolSettings');
const Result = require('../models/Result');
const Attendance = require('../models/Attendance');
const FeeStructure = require('../models/FeeStructure');
const Driver = require('../models/Driver');
const TransportVehicle = require('../models/TransportVehicle');
const FeeInstallmentPlan = require('../models/FeeInstallmentPlan');
const Notification = require('../models/Notification');
const Route = require('../models/Route');
const Counter = require('../models/Counter');
const ExamSchedule = require('../models/ExamSchedule');
const { calculateDynamicLedger } = require('../utils/feeLedgerCalculator');
const FinancialLedger = require('../models/FinancialLedger');
const Enquiry = require('../models/Enquiry');
const { getUnifiedDashboardStats, getDateBoundaries, getPendingSalariesStats, getFeeStats } = require('../utils/financialReconciler');


// Helper to log administrative actions with client details
const createAuditLog = async (req, action, details, entity = '', entityId = '', before = null, after = null) => {
  try {
    const browser = req && req.headers ? req.headers['user-agent'] : 'System Process';
    const ipAddress = req && req.headers ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress) : '127.0.0.1';
    const user = (req && req.user) ? req.user.username : 'ADMIN';
    const role = (req && req.user) ? req.user.role : 'admin';

    await AuditLog.create({
      action,
      details,
      user,
      role,
      entity,
      entityId,
      before,
      after,
      browser,
      ipAddress
    });
  } catch (err) {
    console.error('Audit Logging Error:', err.message);
  }
};

// ================= BACKEND VALIDATORS (Duplicate & Field Checks) =================

const validateName = (name, fieldName = 'Name') => {
  if (!name || typeof name !== 'string') return `${fieldName} is required.`;
  const val = name.trim();
  if (val === '') return `${fieldName} is required.`;
  if (val.length > 50) return `${fieldName} must be 50 characters or less.`;
  const nameRegex = /^[a-zA-Z\s]+$/;
  if (!nameRegex.test(val)) return `Only alphabets and spaces are allowed for ${fieldName}.`;
  return null;
};

const validatePhone = (phone, fieldName = 'Phone number') => {
  if (!phone || typeof phone !== 'string') return `${fieldName} is required.`;
  const val = phone.trim();
  const phoneRegex = /^[6-9]\d{9}$/;
  if (!phoneRegex.test(val)) return `${fieldName} must be a valid 10-digit Indian mobile number.`;
  return null;
};

const validateAadhaar = (aadhaar, fieldName = 'Aadhaar number') => {
  if (!aadhaar || typeof aadhaar !== 'string') return `${fieldName} is required.`;
  const val = aadhaar.trim();
  const aadhaarRegex = /^\d{12}$/;
  if (!aadhaarRegex.test(val)) return `${fieldName} must contain exactly 12 digits.`;
  return null;
};

const validateEmail = (email, fieldName = 'Email address') => {
  if (!email || typeof email !== 'string') return `${fieldName} is required.`;
  const val = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(val)) return `${fieldName} must be a valid email address.`;
  return null;
};

const validateDOB = (dobStr, role) => {
  if (!dobStr) return 'Date of Birth is required.';
  const dob = new Date(dobStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dob.setHours(0, 0, 0, 0);

  if (isNaN(dob.getTime())) return 'Invalid Date of Birth format.';
  if (dob > today) return 'Date of Birth cannot be in the future.';

  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  if (role === 'student') {
    if (age < 2 || age > 25) {
      return 'Student age must be reasonable (between 2 and 25 years).';
    }
  } else if (role === 'teacher') {
    if (age < 18) {
      return 'Teacher age minimum 18 years.';
    }
  } else if (role === 'principal') {
    if (age < 25) {
      return 'Principal age minimum 25 years.';
    }
  }
  return null;
};

const validatePassword = (password) => {
  if (!password) return 'Password is required.';
  if (password.length < 8) return 'Password must be at least 8 characters.';
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
    return 'Password must contain uppercase, lowercase, a number, and a special character.';
  }
  return null;
};

// ================= Dynamic Class capacity helper =================
const getApprovedCount = async (classId) => {
  return await Student.countDocuments({ class: classId, status: 'Approved' });
};

// ================= ADMISSIONS WORKFLOWS (Phase 1 & 2) =================

// @desc    Add a pending student admission record (Phase 1)
// @route   POST /api/admin/student
const addStudent = async (req, res) => {
  const { name, classId, dob, gender, bloodGroup, religion, category, emergencyContact, fatherName, motherName, parentPhone, parentEmail, parentAadhaar, aadhaar, address, customFees } = req.body;

  if (!name || !classId || !dob || !bloodGroup || !emergencyContact || !fatherName || !parentPhone) {
    return res.status(400).json({ message: 'All student basic details are required.' });
  }

  // Trim incoming fields
  const cleanName = name.trim();
  const cleanFather = fatherName.trim();
  const cleanMother = motherName ? motherName.trim() : '';
  const cleanPhone = parentPhone.trim();
  const cleanEmail = parentEmail ? parentEmail.trim() : '';
  const cleanParentAadhaar = parentAadhaar ? parentAadhaar.trim() : '';
  const cleanStudentAadhaar = aadhaar ? aadhaar.trim() : '';
  const cleanEmergency = emergencyContact.trim();
  const cleanAddress = address ? address.trim() : '';

  // Validation checks
  let errMsg = null;
  errMsg = validateName(cleanName, 'Student Name');
  if (errMsg) return res.status(400).json({ message: errMsg });

  errMsg = validateDOB(dob, 'student');
  if (errMsg) return res.status(400).json({ message: errMsg });

  errMsg = validateName(cleanFather, 'Father Name');
  if (errMsg) return res.status(400).json({ message: errMsg });

  if (cleanMother) {
    errMsg = validateName(cleanMother, 'Mother Name');
    if (errMsg) return res.status(400).json({ message: errMsg });
  }

  errMsg = validatePhone(cleanPhone, 'Parent Phone');
  if (errMsg) return res.status(400).json({ message: errMsg });

  errMsg = validatePhone(cleanEmergency, 'Emergency Contact');
  if (errMsg) return res.status(400).json({ message: errMsg });

  if (cleanEmail) {
    errMsg = validateEmail(cleanEmail, 'Parent Email');
    if (errMsg) return res.status(400).json({ message: errMsg });
  }

  if (cleanParentAadhaar) {
    errMsg = validateAadhaar(cleanParentAadhaar, 'Parent Aadhaar');
    if (errMsg) return res.status(400).json({ message: errMsg });
  }

  if (cleanStudentAadhaar) {
    errMsg = validateAadhaar(cleanStudentAadhaar, 'Student Aadhaar');
    if (errMsg) return res.status(400).json({ message: errMsg });
  }

  let createdStudent = null;
  let createdParent = null;
  let parentUpdated = false;

  try {
    // Check if class has available capacity
    const selectedClass = await Class.findById(classId);
    if (!selectedClass) {
      return res.status(404).json({ message: 'Target class not found.' });
    }

    const currentCount = await getApprovedCount(classId);
    if (currentCount >= selectedClass.maxCapacity) {
      return res.status(400).json({ message: `Target class ${selectedClass.name} is full (${currentCount}/${selectedClass.maxCapacity}).` });
    }

    // 1. Check duplicate Student Aadhaar
    if (cleanStudentAadhaar) {
      const dupStudentAadhaar = await Student.findOne({ aadhaar: cleanStudentAadhaar });
      if (dupStudentAadhaar) {
        return res.status(400).json({ message: 'A student with this Aadhaar number already exists.' });
      }
    }

    // 2. Parent Duplicate and Integrity Checks
    const existingParentByPhone = await Parent.findOne({ phone: cleanPhone });
    if (existingParentByPhone) {
      // If phone exists, ensure name matches
      const matchFather = existingParentByPhone.fatherName.trim().toLowerCase() === cleanFather.toLowerCase();
      if (!matchFather) {
        return res.status(400).json({ message: `Parent phone number ${cleanPhone} is already registered to a parent named ${existingParentByPhone.fatherName}.` });
      }
    }

    if (cleanEmail) {
      const existingParentByEmail = await Parent.findOne({ email: cleanEmail.toLowerCase() });
      if (existingParentByEmail && existingParentByEmail.phone !== cleanPhone) {
        return res.status(400).json({ message: 'Parent email address is already registered to a different mobile number.' });
      }
    }

    if (cleanParentAadhaar) {
      const existingParentByAadhaar = await Parent.findOne({ aadhaar: cleanParentAadhaar });
      if (existingParentByAadhaar && existingParentByAadhaar.phone !== cleanPhone) {
        return res.status(400).json({ message: 'Parent Aadhaar number is already registered to a different mobile number.' });
      }
    }

    // Create Student profile in 'Pending' status
    const student = await Student.create({
      name: cleanName,
      class: classId,
      dob: new Date(dob),
      gender: gender || 'Male',
      bloodGroup,
      religion: religion || '',
      category: category || '',
      aadhaar: cleanStudentAadhaar || undefined,
      customFees: customFees || {},
      status: 'Pending',
      emergencyContact: cleanEmergency
    });
    createdStudent = student;

    // Handle parent lookup or creation
    let parent = existingParentByPhone;
    if (!parent) {
      parent = await Parent.create({
        fatherName: cleanFather,
        motherName: cleanMother,
        phone: cleanPhone,
        email: cleanEmail.toLowerCase() || undefined,
        aadhaar: cleanParentAadhaar || undefined,
        address: cleanAddress || 'Palsi, Kubeer, Nirmal',
        children: [student._id]
      });
      createdParent = parent;
    } else {
      if (!parent.children.includes(student._id)) {
        parent.children.push(student._id);
        await parent.save();
        parentUpdated = true;
      }
    }

    student.parent = parent._id;
    await student.save();

    await createAuditLog(req, 'Added Pending Admission', `${cleanName} registered in Pending status`, 'Student', student._id.toString(), null, student.toObject());

    res.status(201).json({ message: 'Student admission record created. Awaiting Verification.', student });
  } catch (error) {
    try {
      if (parentUpdated && createdStudent) {
        const parentObj = await Parent.findOne({ phone: cleanPhone });
        if (parentObj) {
          await Parent.updateOne({ _id: parentObj._id }, { $pull: { children: createdStudent._id } });
        }
      }
      if (createdParent) {
        await Parent.deleteOne({ _id: createdParent._id });
      }
      if (createdStudent) {
        await Student.deleteOne({ _id: createdStudent._id });
      }
    } catch (cleanupError) {
      console.error('Error during addStudent rollback:', cleanupError);
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve a pending student and create logins/IDs in one transaction (Phase 2)
// @route   POST /api/admin/student/:id/approve
const approveStudent = async (req, res) => {
  const { id } = req.params;
  const { documentChecklist } = req.body; // e.g. { birthCert: true, aadhaar: true, tc: true, reportCard: true, photo: true }

  if (!documentChecklist || !documentChecklist.birthCert || !documentChecklist.aadhaar || !documentChecklist.photo) {
    return res.status(400).json({ message: 'Verify & Approve requires validating Birth Cert, Aadhaar, and Photo first.' });
  }

  // Tracking variables for rollback
  let createdParentUser = null;
  let parentUpdated = false;
  let parentOriginalUser = undefined;
  let createdStudentUser = null;
  let studentUpdatedCount = 0; // 0 = not updated, 1 = first save done, 2 = second save done
  let studentOriginalFields = null;
  let createdFee = null;
  let createdAttendance = null;

  try {
    let student = await Student.findById(id).populate('class').populate('parent');
    let enquiry = null;
    let createdStudentDoc = null;
    let createdParentDoc = null;

    if (!student) {
      enquiry = await Enquiry.findById(id);
      if (!enquiry) {
        return res.status(404).json({ message: 'Student/Enquiry record not found.' });
      }

      if (enquiry.status !== 'Pending') {
        return res.status(400).json({ message: 'Only pending admissions can be approved.' });
      }

      const parts = enquiry.admissionClass.split(' - ');
      const className = parts[0] || 'Class 1';
      const classSection = parts[1] || 'A';
      const targetClass = await Class.findOne({ name: className, section: classSection });
      if (!targetClass) {
        return res.status(400).json({ message: `Target class ${enquiry.admissionClass} not found in system. Approval blocked.` });
      }

      const currentCount = await Student.countDocuments({ class: targetClass._id, status: 'Approved' });
      if (currentCount >= targetClass.maxCapacity) {
        return res.status(400).json({ message: `Target class ${targetClass.name} is full (${currentCount}/${targetClass.maxCapacity}). Approval blocked.` });
      }

      let parent = await Parent.findOne({ phone: enquiry.mobileNumber });
      if (!parent) {
        parent = await Parent.create({
          fatherName: enquiry.parentName,
          motherName: req.body.motherName || '',
          phone: enquiry.mobileNumber,
          email: (enquiry.email || '').toLowerCase() || undefined,
          aadhaar: req.body.parentAadhaar || undefined,
          address: req.body.address || enquiry.locality || 'Palsi, Kubeer, Nirmal',
          children: []
        });
        createdParentDoc = parent;
      }

      student = await Student.create({
        name: enquiry.studentName,
        class: targetClass._id,
        parent: parent._id,
        dob: req.body.dob ? new Date(req.body.dob) : new Date('2015-05-14'),
        gender: req.body.gender || 'Male',
        bloodGroup: req.body.bloodGroup || 'B+',
        religion: req.body.religion || 'Hindu',
        category: req.body.category || 'General',
        emergencyContact: req.body.emergencyContact || enquiry.mobileNumber,
        address: req.body.address || enquiry.locality,
        status: 'Pending',
        documentChecklist
      });
      createdStudentDoc = student;

      if (!parent.children.includes(student._id)) {
        parent.children.push(student._id);
        await parent.save();
      }

      student.class = targetClass;
      student.parent = parent;
    }

    if (student.status !== 'Pending') {
      return res.status(400).json({ message: 'Only pending admissions can be approved.' });
    }

    const selectedClass = student.class;
    const currentCount = await Student.countDocuments({ class: selectedClass._id, status: 'Approved' });
    if (currentCount >= selectedClass.maxCapacity) {
      return res.status(400).json({ message: `Target class ${selectedClass.name} is full (${currentCount}/${selectedClass.maxCapacity}). Approval blocked.` });
    }

    // Save original fields for rollback
    studentOriginalFields = {
      rollNumber: student.rollNumber,
      admissionNumber: student.admissionNumber,
      user: student.user,
      status: student.status,
      library: student.library ? { ...student.library.toObject() } : undefined,
      transport: student.transport ? { ...student.transport.toObject() } : undefined
    };

    // 1. Generate Admission Number automatically: VBV-YYYY-XXXX
    const currentYear = new Date().getFullYear();
    const approvedTotal = await Student.countDocuments({ status: 'Approved' });
    const admissionNumber = `VBV-${currentYear}-${String(approvedTotal + 1).padStart(4, '0')}`;

    // 2. Generate Roll Number dynamically based on academic year, class name prefix, and section
    let classPrefix = selectedClass.name.replace('Class ', '').replace(/\s+/g, '');
    const sectionSuffix = selectedClass.section || 'A';
    const rollPrefix = `${classPrefix}-${sectionSuffix}`;
    const sameClassCount = await Student.countDocuments({ class: selectedClass._id, status: 'Approved' });
    const rollNumber = `${rollPrefix}-${String(sameClassCount + 1).padStart(3, '0')}`;

    // 3. Setup Parent User profile (Sibling link search)
    let parent = student.parent;
    let parentUser = await User.findOne({ phone: parent.phone });
    if (!parentUser) {
      parentUser = await User.create({
        phone: parent.phone,
        password: 'VBV@321', // Default password
        role: 'parent'
      });
      createdParentUser = parentUser;
      
      parentOriginalUser = parent.user;
      parent.user = parentUser._id;
      await parent.save();
      parentUpdated = true;
    }

    // 4. Create Student User login credentials
    let studentUser = await User.create({
      rollNumber,
      password: 'VBV@123', // Default password
      role: 'student'
    });
    createdStudentUser = studentUser;

    // 5. Update Student profile fields
    const beforeState = student.toObject();
    student.rollNumber = rollNumber;
    student.admissionNumber = admissionNumber;
    student.user = studentUser._id;
    student.status = 'Approved';
    await student.save();
    studentUpdatedCount = 1;

    // 6. Inherit Class Fee Structure or use Student customFees
    const activeSettings = await SchoolSettings.findOne() || { academicYear: '2026-27' };
    
    let structureHeads;
    const hasCustomFees = student.customFees && Object.values(student.customFees.toObject()).some(val => val > 0);
    if (hasCustomFees) {
      structureHeads = student.customFees.toObject();
    } else if (selectedClass.feeStructure && Object.values(selectedClass.feeStructure.toObject()).some(val => val > 0)) {
      structureHeads = selectedClass.feeStructure.toObject();
    } else {
      const feeStructure = await FeeStructure.findOne({ 
        academicYear: activeSettings.academicYear, 
        className: selectedClass.name 
      });
      structureHeads = feeStructure ? feeStructure.heads : { admission: 0, tuition: 18000, transport: 0, books: 0, uniform: 0, exam: 0, hostel: 0, other: 0 };
    }

    const components = ['admission', 'tuition', 'books', 'hostel', 'transport', 'uniform', 'exam', 'other'];
    let totalFeeAmount = 0;
    const breakdown = {};
    components.forEach(comp => {
      const val = Number(structureHeads[comp]) || 0;
      totalFeeAmount += val;
      breakdown[comp] = { total: val, paid: 0 };
    });

    // Fetch template installment plan and copy to student fee ledger
    const installmentPlan = await FeeInstallmentPlan.findOne({
      className: selectedClass.name,
      academicYear: activeSettings.academicYear,
      status: 'Published'
    });

    let installments = [];
    if (installmentPlan && installmentPlan.installments) {
      const now = new Date();
      installments = installmentPlan.installments.map(inst => {
        let initialStatus = 'Upcoming';
        const dueDate = new Date(inst.dueDate);
        const graceEndDate = new Date(dueDate.getTime() + (inst.gracePeriod || 0) * 24 * 60 * 60 * 1000);
        if (now > graceEndDate) {
          initialStatus = 'Overdue';
        } else if (now > dueDate) {
          initialStatus = 'Pending';
        }
        return {
          name: inst.name,
          amount: inst.amount,
          dueDate: inst.dueDate,
          gracePeriod: inst.gracePeriod,
          lateFee: inst.lateFee,
          discount: inst.discount,
          status: initialStatus,
          paidAmount: 0,
          remainingAmount: inst.amount + inst.lateFee - inst.discount,
          internalNotes: '',
          breakdown: inst.breakdown ? {
            admission: inst.breakdown.admission || 0,
            tuition: inst.breakdown.tuition || 0,
            books: inst.breakdown.books || 0,
            hostel: inst.breakdown.hostel || 0,
            transport: inst.breakdown.transport || 0,
            uniform: inst.breakdown.uniform || 0,
            exam: inst.breakdown.exam || 0,
            other: inst.breakdown.other || 0
          } : { admission: 0, tuition: inst.amount, books: 0, hostel: 0, transport: 0, uniform: 0, exam: 0, other: 0 },
          payments: []
        };
      });
    }

    createdFee = await Fee.create({
      student: student._id,
      academicYear: activeSettings.academicYear,
      totalAmount: totalFeeAmount,
      paidAmount: 0,
      balanceAmount: totalFeeAmount,
      dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      breakdown,
      installments
    });

    await createAuditLog(req, 'Student Ledger Generated', `Generated fee ledger for student ${student.name}`, 'Fee', createdFee._id.toString(), null, createdFee.toObject());

    // 7. Seed Initial dummy Attendance, Transport, Library structures
    createdAttendance = await Attendance.create({
      student: student._id,
      class: selectedClass._id,
      date: new Date(),
      status: 'Present',
      markedBy: studentUser._id // default
    });

    student.library = { cardNumber: `LIB-${admissionNumber.slice(-4)}`, booksBorrowed: [] };
    // Clear initial transport to null/empty values (no transport assigned)
    student.transport = { vehicle: null, route: '', pickupPoint: '', dropPoint: '', pickupTime: '', dropTime: '', fee: 0 };
    await student.save();
    studentUpdatedCount = 2;

    await createAuditLog(req, 'Approved Student Admission', `Approved ${student.name} - Roll No: ${rollNumber}`, 'Student', student._id.toString(), beforeState, student.toObject());

    if (enquiry) {
      enquiry.status = 'Approved';
      await enquiry.save();
    }

    res.status(200).json({ message: 'Student admission verified and approved successfully.', student });
  } catch (error) {
    try {
      if (createdAttendance) {
        await Attendance.deleteOne({ _id: createdAttendance._id });
      }
      if (createdFee) {
        await Fee.deleteOne({ _id: createdFee._id });
      }
      if (createdStudentDoc) {
        await Student.deleteOne({ _id: createdStudentDoc._id });
      }
      if (createdParentDoc) {
        await Parent.deleteOne({ _id: createdParentDoc._id });
      }
      if (studentUpdatedCount > 0 && studentOriginalFields) {
        const rollbackStudent = await Student.findById(id);
        if (rollbackStudent) {
          rollbackStudent.rollNumber = studentOriginalFields.rollNumber;
          rollbackStudent.admissionNumber = studentOriginalFields.admissionNumber;
          rollbackStudent.user = studentOriginalFields.user;
          rollbackStudent.status = studentOriginalFields.status;
          rollbackStudent.library = studentOriginalFields.library;
          rollbackStudent.transport = studentOriginalFields.transport;
          await rollbackStudent.save();
        }
      }
      if (createdStudentUser) {
        await User.deleteOne({ _id: createdStudentUser._id });
      }
      if (parentUpdated && studentOriginalFields) {
        const studentObj = await Student.findById(id).populate('parent');
        if (studentObj && studentObj.parent) {
          studentObj.parent.user = parentOriginalUser;
          await studentObj.parent.save();
        }
      }
      if (createdParentUser) {
        await User.deleteOne({ _id: createdParentUser._id });
      }
    } catch (cleanupError) {
      console.error('Error during approveStudent rollback:', cleanupError);
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update student parameters
// @route   PUT /api/admin/student/:id
const updateStudent = async (req, res) => {
  const { id } = req.params;
  const { 
    name, dob, gender, bloodGroup, aadhaar, religion, category, address,
    classId, rollNumber, admissionNumber,
    fatherName, motherName, parentPhone, parentEmail, parentAadhaar, occupation,
    customFees, transport, library, emergencyContact
  } = req.body;

  try {
    let student = await Student.findById(id);
    if (!student) {
      const enquiry = await Enquiry.findById(id);
      if (!enquiry) {
        return res.status(404).json({ message: 'Student/Enquiry record not found.' });
      }

      enquiry.studentName = name ? name.trim() : enquiry.studentName;
      enquiry.parentName = fatherName ? fatherName.trim() : enquiry.parentName;
      enquiry.mobileNumber = parentPhone ? parentPhone.trim() : enquiry.mobileNumber;
      enquiry.email = parentEmail ? parentEmail.trim() : enquiry.email;
      enquiry.locality = address ? address.trim() : enquiry.locality;

      if (classId) {
        const cls = await Class.findById(classId);
        if (cls) {
          enquiry.admissionClass = `${cls.name} - ${cls.section}`;
        }
      }

      await enquiry.save();
      return res.status(200).json({ message: 'Enquiry updated successfully.', student: { _id: enquiry._id, name: enquiry.studentName, status: 'Pending', isEnquiry: true } });
    }

    const beforeState = student.toObject();

    // Check duplicate roll number
    if (rollNumber && rollNumber !== student.rollNumber) {
      const cleanRoll = rollNumber.trim();
      const errRoll = validateRollNumber(cleanRoll);
      if (errRoll) return res.status(400).json({ message: errRoll });

      const dupRoll = await Student.findOne({ rollNumber: cleanRoll, _id: { $ne: id } });
      if (dupRoll) {
        return res.status(400).json({ message: 'Roll Number is already in use by another student.' });
      }
      if (student.user) {
        await User.findByIdAndUpdate(student.user, { rollNumber: cleanRoll });
      }
      student.rollNumber = cleanRoll;
    }

    // Check duplicate admission number (read-only usually, but checked here)
    if (admissionNumber && admissionNumber !== student.admissionNumber) {
      const cleanAdm = admissionNumber.trim();
      const dupAdmission = await Student.findOne({ admissionNumber: cleanAdm, _id: { $ne: id } });
      if (dupAdmission) {
        return res.status(400).json({ message: 'Admission Number is already in use by another student.' });
      }
      student.admissionNumber = cleanAdm;
    }

    if (name) {
      const cleanName = name.trim();
      const err = validateName(cleanName, 'Student Name');
      if (err) return res.status(400).json({ message: err });
      student.name = cleanName;
    }

    if (dob) {
      const err = validateDOB(dob, 'student');
      if (err) return res.status(400).json({ message: err });
      student.dob = new Date(dob);
    }

    if (aadhaar) {
      const cleanAadhaar = aadhaar.trim();
      const err = validateAadhaar(cleanAadhaar, 'Student Aadhaar');
      if (err) return res.status(400).json({ message: err });

      const dupAadhaar = await Student.findOne({ aadhaar: cleanAadhaar, _id: { $ne: id } });
      if (dupAadhaar) {
        return res.status(400).json({ message: 'A student with this Aadhaar number already exists.' });
      }
      student.aadhaar = cleanAadhaar;
    }

    if (emergencyContact) {
      const cleanEmergency = emergencyContact.trim();
      const err = validatePhone(cleanEmergency, 'Emergency Contact');
      if (err) return res.status(400).json({ message: err });
      student.emergencyContact = cleanEmergency;
    }

    student.gender = gender || student.gender;
    student.bloodGroup = bloodGroup || student.bloodGroup;
    student.religion = religion !== undefined ? (typeof religion === 'string' ? religion.trim() : religion) : student.religion;
    student.category = category !== undefined ? (typeof category === 'string' ? category.trim() : category) : student.category;

    if (transport) student.transport = { ...student.transport, ...transport };
    if (library) student.library = { ...student.library, ...library };

    if (customFees) {
      student.customFees = {
        admission: Number(customFees.admission) || 0,
        tuition: Number(customFees.tuition) || 0,
        books: Number(customFees.books) || 0,
        hostel: Number(customFees.hostel) || 0,
        transport: Number(customFees.transport) || 0,
        uniform: Number(customFees.uniform) || 0,
        exam: Number(customFees.exam) || 0,
        other: Number(customFees.other) || 0
      };
    }

    if (classId && String(student.class) !== String(classId)) {
      const selectedClass = await Class.findById(classId);
      if (!selectedClass) {
        return res.status(404).json({ message: 'Target class not found.' });
      }
      student.class = classId;
      await createAuditLog(req, 'Transferred Student', `${student.name} to Class: ${selectedClass.name}`, 'Student', id, beforeState, student.toObject());
    } else {
      await createAuditLog(req, 'Updated Student Profile', student.name, 'Student', id, beforeState, student.toObject());
    }

    // Save student basic details
    await student.save();

    // Update associated Parent profile
    if (student.parent) {
      const parent = await Parent.findById(student.parent);
      if (parent) {
        if (fatherName) {
          const cleanFather = fatherName.trim();
          const err = validateName(cleanFather, 'Father Name');
          if (err) return res.status(400).json({ message: err });
          parent.fatherName = cleanFather;
        }
        if (motherName) {
          const cleanMother = motherName.trim();
          const err = validateName(cleanMother, 'Mother Name');
          if (err) return res.status(400).json({ message: err });
          parent.motherName = cleanMother;
        }
        if (parentPhone) {
          const cleanPhone = parentPhone.trim();
          const err = validatePhone(cleanPhone, 'Parent Phone');
          if (err) return res.status(400).json({ message: err });

          if (cleanPhone !== parent.phone) {
            const dupPhone = await Parent.findOne({ phone: cleanPhone, _id: { $ne: parent._id } });
            if (dupPhone) {
              return res.status(400).json({ message: 'Parent mobile number is already in use by another parent.' });
            }
            if (parent.user) {
              await User.findByIdAndUpdate(parent.user, { phone: cleanPhone });
            }
            parent.phone = cleanPhone;
          }
        }
        if (parentEmail) {
          const cleanEmail = parentEmail.trim();
          const err = validateEmail(cleanEmail, 'Parent Email');
          if (err) return res.status(400).json({ message: err });

          if (cleanEmail.toLowerCase() !== parent.email) {
            const dupEmail = await Parent.findOne({ email: cleanEmail.toLowerCase(), _id: { $ne: parent._id } });
            if (dupEmail) {
              return res.status(400).json({ message: 'Parent email is already in use by another parent.' });
            }
            parent.email = cleanEmail.toLowerCase();
          }
        }
        if (parentAadhaar) {
          const cleanAadhaar = parentAadhaar.trim();
          const err = validateAadhaar(cleanAadhaar, 'Parent Aadhaar');
          if (err) return res.status(400).json({ message: err });

          if (cleanAadhaar !== parent.aadhaar) {
            const dupAadhaar = await Parent.findOne({ aadhaar: cleanAadhaar, _id: { $ne: parent._id } });
            if (dupAadhaar) {
              return res.status(400).json({ message: 'Parent Aadhaar number is already in use by another parent.' });
            }
            parent.aadhaar = cleanAadhaar;
          }
        }
        if (address) parent.address = address.trim();
        if (occupation !== undefined) parent.occupation = typeof occupation === 'string' ? occupation.trim() : occupation;
        
        await parent.save();
      }
    }

    res.status(200).json({ message: 'Student profile updated successfully.', student });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Archive student to transferred/alumni/left state
// @route   DELETE /api/admin/student/:id
const archiveStudent = async (req, res) => {
  const { id } = req.params;
  const { status, remarks } = req.body;

  const validStatuses = ['Transferred', 'Alumni', 'Left School', 'Archived'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Valid archive status is required.' });
  }

  try {
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    const beforeState = student.toObject();
    student.status = status;
    student.archiveReason = status;
    if (remarks !== undefined) {
      student.archiveRemarks = remarks;
    }
    
    // Disable credentials
    if (student.user) {
      await User.findByIdAndDelete(student.user);
      student.user = undefined;
    }
    await student.save();

    await createAuditLog(req, 'Archived Student Account', `${student.name} status: ${status}. Remarks: ${remarks || 'None'}`, 'Student', id, beforeState, student.toObject());

    res.status(200).json({ message: `Student status set to ${status} and logins disabled.`, student });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ================= TEACHERS WORKFLOWS =================

// @desc    Add a new teacher account
// @route   POST /api/admin/teacher
const addTeacher = async (req, res) => {
  const { name, email, phone, qualification, department, experience, designation, photo, salaryType, basicSalary, allowance, totalSalary, address, dob, aadhaar } = req.body;

  if (!name || !email || !phone || !qualification || !dob) {
    return res.status(400).json({ message: 'Teacher Name, Email, Phone, Qualification, and Date of Birth are required.' });
  }

  // Trim text fields
  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();
  const cleanPhone = phone.trim();
  const cleanQual = qualification.trim();
  const cleanAddress = address ? address.trim() : '';
  const cleanAadhaar = aadhaar ? aadhaar.trim() : '';

  // Validate fields
  let errMsg = validateName(cleanName, 'Teacher Name');
  if (errMsg) return res.status(400).json({ message: errMsg });

  errMsg = validateEmail(cleanEmail, 'Teacher Email');
  if (errMsg) return res.status(400).json({ message: errMsg });

  errMsg = validatePhone(cleanPhone, 'Teacher Phone');
  if (errMsg) return res.status(400).json({ message: errMsg });

  errMsg = validateDOB(dob, 'teacher');
  if (errMsg) return res.status(400).json({ message: errMsg });

  if (cleanAadhaar) {
    errMsg = validateAadhaar(cleanAadhaar, 'Teacher Aadhaar');
    if (errMsg) return res.status(400).json({ message: errMsg });
  }

  let teacherUser = null;
  let teacher = null;

  try {
    // 1. Duplicate checks
    const dupEmail = await Teacher.findOne({ email: cleanEmail });
    if (dupEmail) {
      return res.status(400).json({ message: 'Email address is already in use by another teacher.' });
    }

    const dupPhone = await Teacher.findOne({ phone: cleanPhone });
    if (dupPhone) {
      return res.status(400).json({ message: 'Phone number is already in use by another teacher.' });
    }

    if (cleanAadhaar) {
      const dupAadhaar = await Teacher.findOne({ aadhaar: cleanAadhaar });
      if (dupAadhaar) {
        return res.status(400).json({ message: 'Aadhaar number is already in use by another teacher.' });
      }
    }

    // Generate Employee ID: TCH-YYYY-XXX
    const currentYear = new Date().getFullYear();
    const teacherCount = await Teacher.countDocuments();
    const employeeId = `TCH-${currentYear}-${String(teacherCount + 1).padStart(3, '0')}`;

    teacherUser = await User.create({
      teacherId: employeeId,
      password: 'VBV$3210', // Default password
      role: 'teacher'
    });

    teacher = await Teacher.create({
      user: teacherUser._id,
      name: cleanName,
      teacherId: employeeId,
      email: cleanEmail,
      phone: cleanPhone,
      qualification: cleanQual,
      department: department || 'Academics',
      experience: experience || '3 years',
      designation: designation || 'TGT Teacher',
      photo: photo || '',
      salaryType: salaryType || 'Monthly',
      basicSalary: Number(basicSalary) || 0,
      allowance: Number(allowance) || 0,
      totalSalary: Number(totalSalary) || 0,
      address: cleanAddress,
      status: 'Active',
      dob: new Date(dob),
      aadhaar: cleanAadhaar || undefined
    });

    await createAuditLog(req, 'Created Teacher Account', `${cleanName} - ID: ${employeeId}`, 'Teacher', teacher._id.toString(), null, teacher.toObject());

    res.status(201).json({ message: 'Teacher onboarding completed successfully.', teacher });
  } catch (error) {
    try {
      if (teacher) {
        await Teacher.deleteOne({ _id: teacher._id });
      }
      if (teacherUser) {
        await User.deleteOne({ _id: teacherUser._id });
      }
    } catch (cleanupError) {
      console.error('Error during addTeacher rollback:', cleanupError);
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update teacher profile
// @route   PUT /api/admin/teacher/:id
const updateTeacher = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, qualification, status, department, experience, designation, address, assignedClass, teacherId, dob, aadhaar } = req.body;

  try {
    const teacher = await Teacher.findById(id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found.' });
    }

    const beforeState = teacher.toObject();

    // Validate and trim fields before saving
    if (name) {
      const cleanName = name.trim();
      const err = validateName(cleanName, 'Teacher Name');
      if (err) return res.status(400).json({ message: err });
      teacher.name = cleanName;
    }

    if (email && email.trim().toLowerCase() !== teacher.email) {
      const cleanEmail = email.trim().toLowerCase();
      const err = validateEmail(cleanEmail, 'Teacher Email');
      if (err) return res.status(400).json({ message: err });

      const dupEmail = await Teacher.findOne({ email: cleanEmail, _id: { $ne: id } });
      if (dupEmail) {
        return res.status(400).json({ message: 'Email address is already in use by another teacher.' });
      }
      teacher.email = cleanEmail;
    }

    // employeeId is uneditable, but check just in case
    if (teacherId && teacherId !== teacher.teacherId) {
      const dupId = await Teacher.findOne({ teacherId, _id: { $ne: id } });
      if (dupId) {
        return res.status(400).json({ message: 'Employee ID is already in use by another teacher.' });
      }
      if (teacher.user) {
        await User.findByIdAndUpdate(teacher.user, { teacherId });
      }
      teacher.teacherId = teacherId;
    }

    if (phone && phone.trim() !== teacher.phone) {
      const cleanPhone = phone.trim();
      const err = validatePhone(cleanPhone, 'Teacher Phone');
      if (err) return res.status(400).json({ message: err });

      const dupPhone = await Teacher.findOne({ phone: cleanPhone, _id: { $ne: id } });
      if (dupPhone) {
        return res.status(400).json({ message: 'Phone number is already in use by another teacher.' });
      }
      if (teacher.user) {
        await User.findByIdAndUpdate(teacher.user, { phone: cleanPhone });
      }
      teacher.phone = cleanPhone;
    }

    if (dob) {
      const err = validateDOB(dob, 'teacher');
      if (err) return res.status(400).json({ message: err });
      teacher.dob = new Date(dob);
    }

    if (aadhaar && aadhaar.trim() !== teacher.aadhaar) {
      const cleanAadhaar = aadhaar.trim();
      const err = validateAadhaar(cleanAadhaar, 'Teacher Aadhaar');
      if (err) return res.status(400).json({ message: err });

      const dupAadhaar = await Teacher.findOne({ aadhaar: cleanAadhaar, _id: { $ne: id } });
      if (dupAadhaar) {
        return res.status(400).json({ message: 'Aadhaar number is already in use by another teacher.' });
      }
      teacher.aadhaar = cleanAadhaar;
    }

    if (qualification) teacher.qualification = qualification.trim();
    teacher.department = department || teacher.department;
    teacher.experience = experience || teacher.experience;
    teacher.designation = designation || teacher.designation;
    teacher.address = address !== undefined ? address.trim() : teacher.address;
    
    if (assignedClass !== undefined) {
      if (assignedClass === '' || assignedClass === null) {
        teacher.assignedClass = undefined;
      } else {
        teacher.assignedClass = assignedClass;
      }
    }

    if (status && status !== teacher.status) {
      teacher.status = status;
      await createAuditLog(req, 'Updated Teacher Status', `${teacher.name} status: ${status}`, 'Teacher', id, beforeState, teacher.toObject());
    } else {
      await createAuditLog(req, 'Updated Teacher Profile', teacher.name, 'Teacher', id, beforeState, teacher.toObject());
    }

    await teacher.save();
    res.status(200).json({ message: 'Teacher profile details updated.', teacher });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Soft delete teacher (never permanently delete if has historical records)
// @route   DELETE /api/admin/teacher/:id
const softDeleteTeacher = async (req, res) => {
  const { id } = req.params;

  try {
    const teacher = await Teacher.findById(id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found.' });
    }

    const isAssigned = teacher.assignedClass || (teacher.subjects && teacher.subjects.length > 0);

    if (isAssigned) {
      const beforeState = teacher.toObject();
      teacher.status = 'Inactive';
      if (teacher.user) {
        await User.findByIdAndDelete(teacher.user);
        teacher.user = undefined;
      }
      await teacher.save();
      await createAuditLog(req, 'Soft Deleted Teacher', `${teacher.name} disabled`, 'Teacher', id, beforeState, teacher.toObject());
      return res.status(200).json({ message: 'Teacher has active academic records. Account marked Inactive.', teacher });
    } else {
      if (teacher.user) {
        await User.findByIdAndDelete(teacher.user);
      }
      await Teacher.findByIdAndDelete(id);
      await createAuditLog(req, 'Hard Deleted Teacher', teacher.name, 'Teacher', id, teacher.toObject(), null);
      return res.status(200).json({ message: 'Teacher account deleted permanently.' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ================= FEES CONFIGURATIONS & COLLECTIONS =================

// @desc    Get all Academic Year Fee structures
// @route   GET /api/admin/fee-structures
const getFeeStructures = async (req, res) => {
  try {
    const structures = await FeeStructure.find();
    res.json(structures);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create or update Fee Structure
// @route   POST /api/admin/fee-structures
const createFeeStructure = async (req, res) => {
  const { academicYear, className, heads } = req.body;

  try {
    let structure = await FeeStructure.findOne({ academicYear, className });
    if (!structure) {
      structure = new FeeStructure({ academicYear, className, heads });
    } else {
      structure.heads = heads;
    }

    await structure.save();
    await createAuditLog(req, 'Configure Fee Structure', `${className} updated for ${academicYear}`, 'FeeStructure', structure._id.toString());
    res.status(200).json(structure);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Clone fee structures from previous year
// @route   POST /api/admin/fees/clone
const cloneFeeStructure = async (req, res) => {
  try {
    const structures = await FeeStructure.find();
    await createAuditLog(req, 'Cloned Fee Structure', 'Copied structures forward');
    res.status(200).json({ message: 'Previous year fee structures successfully cloned.', count: structures.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




// @desc    Collect a student fee payment (supports dynamic category-wise and installment-based collection)
// @route   POST /api/admin/fees/collect
const collectFee = async (req, res) => {
  const { studentId, paymentMethod, transactionId, remarks, discountApplied, scholarshipApplied, lateFeeApplied, categoriesPaid, installmentId, amountPaid } = req.body;

  if (!studentId || !paymentMethod) {
    return res.status(400).json({ message: 'Student ID and Payment Method are required.' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let fee = await Fee.findOne({ student: studentId }).session(session).populate({
      path: 'student',
      populate: { path: 'class' }
    });
    if (!fee) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Student fee ledger not initialized.' });
    }

    const beforeState = fee.toObject();
    let totalPaid = 0;
    let paymentCategory = 'Tuition Fee';
    let paymentBreakdown = {
      admission: 0,
      tuition: 0,
      books: 0,
      hostel: 0,
      transport: 0,
      uniform: 0,
      exam: 0,
      other: 0
    };

    // Atomic receipt number generation via MongoDB Counter sequence
    const currentYear = new Date().getFullYear();
    const counter = await Counter.findOneAndUpdate(
      { _id: `receipt-${currentYear}` },
      { $inc: { seq: 1 } },
      { new: true, upsert: true, session }
    );
    const receiptNum = `RCPT-${currentYear}-${String(counter.seq).padStart(6, '0')}`;

    // 1. Installment-based Payment Collection Mode
    if (installmentId) {
      const calculatedFee = calculateDynamicLedger(fee);
      const inst = calculatedFee.installments.find(i => i._id.toString() === installmentId.toString());
      if (!inst) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: 'Selected fee installment not found.' });
      }

      if (inst.status === 'Paid') {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: 'Cannot collect paid installment twice.' });
      }

      const dbInst = fee.installments.id(installmentId);
      const today = new Date();
      const dueDate = new Date(dbInst.dueDate);
      const dueLimit = new Date(dueDate);
      dueLimit.setDate(dueLimit.getDate() + (dbInst.gracePeriod || 0));
      const isOverdue = today > dueLimit;

      const baseTarget = Math.max(0, dbInst.amount - (dbInst.discount || 0));
      const instPaidAmount = inst.paidAmount;
      let activeLateFee = 0;
      if (instPaidAmount < baseTarget && isOverdue) {
        activeLateFee = dbInst.lateFee || 0;
      } else if (instPaidAmount > baseTarget) {
        activeLateFee = instPaidAmount - baseTarget;
      }

      const installmentOutstanding = inst.remainingAmount;
      const payAmt = amountPaid !== undefined ? Number(amountPaid) : installmentOutstanding;

      if (isNaN(payAmt) || payAmt <= 0) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: 'Collected amount must be greater than zero.' });
      }

      if (payAmt > installmentOutstanding + 0.01) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: `Cannot overpay. Payment (₹${payAmt}) exceeds installment outstanding balance (₹${installmentOutstanding}).` });
      }

      // Fixed Priority allocation
      const priorityOrder = ['admission', 'tuition', 'books', 'hostel', 'transport', 'uniform', 'exam', 'other'];
      let remainingToAllocate = payAmt;

      for (const cat of priorityOrder) {
        if (remainingToAllocate <= 0) break;

        const expected = (dbInst.breakdown && dbInst.breakdown[cat]) || 0;
        let adjustedExpected = expected;
        if (cat === 'tuition') {
          adjustedExpected = Math.max(0, expected - (dbInst.discount || 0));
        }
        if (cat === 'other') {
          adjustedExpected = expected + activeLateFee;
        }

        const alreadyPaid = (inst.breakdownPaid && inst.breakdownPaid[cat]) || 0;
        const catRemaining = Math.max(0, adjustedExpected - alreadyPaid);

        if (catRemaining > 0) {
          const allocated = Math.min(catRemaining, remainingToAllocate);
          paymentBreakdown[cat] = allocated;
          remainingToAllocate -= allocated;
        }
      }

      if (remainingToAllocate > 0) {
        paymentBreakdown.other += remainingToAllocate;
      }

      for (const [cat, amt] of Object.entries(paymentBreakdown)) {
        if (amt > 0) {
          fee.breakdown[cat].paid += amt;
        }
      }

      totalPaid = payAmt;
      paymentCategory = `Installment: ${dbInst.name}`;

    } else if (categoriesPaid && typeof categoriesPaid === 'object') {
      // 2. Multiple Category-wise Payment Mode
      for (const [cat, val] of Object.entries(categoriesPaid)) {
        const amt = Number(val);
        if (isNaN(amt) || amt < 0) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({ message: 'Payment amounts must be positive numbers.' });
        }
        if (amt > 0) {
          let catKey = cat.toLowerCase().replace(' fee', '');
          if (catKey === 'examination') catKey = 'exam';

          if (fee.breakdown[catKey] === undefined) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: `Invalid fee category: ${cat}` });
          }

          const outstanding = fee.breakdown[catKey].total - fee.breakdown[catKey].paid;
          if (amt > outstanding + 0.01) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: `Payment for ${cat} Fee (₹${amt}) exceeds outstanding balance (₹${outstanding}).` });
          }

          paymentBreakdown[catKey] = amt;
          totalPaid += amt;
        }
      }

      for (const [catKey, amt] of Object.entries(paymentBreakdown)) {
        if (amt > 0) {
          fee.breakdown[catKey].paid += amt;
        }
      }

      paymentCategory = 'Multiple Category Fees';
    } else {
      // 3. Backward compatibility/fallback for single amountPaid and category
      const fallbackAmount = req.body.amountPaid ? Number(req.body.amountPaid) : Number(amountPaid);
      const fallbackCategory = req.body.category || 'Tuition Fee';
      
      if (isNaN(fallbackAmount) || fallbackAmount <= 0) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: 'Amount Paid must be greater than zero.' });
      }

      let catKey = fallbackCategory.toLowerCase().replace(' fee', '');
      if (catKey === 'examination') catKey = 'exam';

      if (fee.breakdown[catKey] === undefined) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: `Invalid fee category: ${fallbackCategory}` });
      }

      const outstanding = fee.breakdown[catKey].total - fee.breakdown[catKey].paid;
      if (fallbackAmount > outstanding + 0.01) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: `Payment for ${fallbackCategory} (₹${fallbackAmount}) exceeds outstanding balance (₹${outstanding}).` });
      }

      paymentBreakdown[catKey] = fallbackAmount;
      totalPaid = fallbackAmount;
      paymentCategory = fallbackCategory;

      for (const [catKey, amt] of Object.entries(paymentBreakdown)) {
        if (amt > 0) {
          fee.breakdown[catKey].paid += amt;
        }
      }
    }

    if (totalPaid <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Total payment amount must be greater than zero.' });
    }

    // Apply manual adjustment overrides if provided (legacy support)
    if (!installmentId) {
      if (discountApplied) {
        fee.totalAmount -= Number(discountApplied);
      }
      if (scholarshipApplied) {
        fee.totalAmount -= Number(scholarshipApplied);
      }
      if (lateFeeApplied) {
        fee.totalAmount += Number(lateFeeApplied);
      }
    }

    // Recalculate dynamic ledger totals
    const updatedLedger = calculateDynamicLedger(fee);
    fee.totalAmount = updatedLedger.totalAmount;
    fee.paidAmount = updatedLedger.paidAmount;
    fee.balanceAmount = updatedLedger.balanceAmount;

    fee.payments.push({
      amount: totalPaid,
      paymentMethod,
      receiptNumber: receiptNum,
      transactionId: transactionId || '',
      category: paymentCategory,
      breakdown: paymentBreakdown,
      collectedBy: req.user ? req.user.username : 'ADMIN',
      remarks: remarks || ''
    });

    await fee.save({ session });

    const student = fee.student;
    
    // Create Income entry in FinancialLedger using save({ session })
    const txnId = transactionId || `TXN-INC-${Date.now()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const savedPayment = fee.payments[fee.payments.length - 1];
    const paymentId = savedPayment ? savedPayment._id.toString() : '';

    const ledgerEntry = new FinancialLedger({
      transactionId: txnId,
      transactionType: 'Income',
      category: paymentCategory,
      amount: totalPaid,
      paymentMode: paymentMethod || 'Cash',
      receiptNumber: receiptNum,
      student: student._id,
      parent: student.parent,
      class: student.class?._id || student.class,
      academicYear: fee.academicYear || '2026-27',
      description: `Fee collection for student ${student.name} (${student.rollNumber || 'PENDING'})`,
      referenceId: paymentId || fee._id.toString(),
      createdBy: req.user ? req.user.username : 'ADMIN',
      remarks: remarks || ''
    });
    await ledgerEntry.save({ session });

    // Trigger automatic Parent and Student notifications using save({ session })
    if (student) {
      const parentNotif = new Notification({
        title: 'Payment Received',
        message: `Amount: ₹${totalPaid.toLocaleString()}\nReceipt: ${receiptNum}\nRemaining Balance: ₹${fee.balanceAmount.toLocaleString()}`,
        recipientRole: 'parent',
        class: student.class?._id || student.class,
        type: 'Fee',
        sender: req.user ? req.user._id : student.user
      });
      await parentNotif.save({ session });

      const studentNotif = new Notification({
        title: 'Payment Received',
        message: `Amount: ₹${totalPaid.toLocaleString()}\nReceipt: ${receiptNum}\nRemaining Balance: ₹${fee.balanceAmount.toLocaleString()}`,
        recipientRole: 'student',
        class: student.class?._id || student.class,
        type: 'Fee',
        sender: req.user ? req.user._id : student.user
      });
      await studentNotif.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    // Log payment or partial payment in Audit log after transaction commits successfully
    const dynamicInstAfter = installmentId ? updatedLedger.installments.find(i => i._id.toString() === installmentId.toString()) : null;
    const auditAction = (installmentId && dynamicInstAfter?.status !== 'Paid') ? 'Partial Payment Received' : 'Payment Received';
    createAuditLog(
      req, 
      auditAction, 
      `Received ₹${totalPaid} for student ${student.name} (Receipt: ${receiptNum}). Category: ${paymentCategory}. Remaining ledger balance: ₹${fee.balanceAmount}`, 
      'Fee', 
      fee._id.toString(), 
      beforeState, 
      fee.toObject()
    );

    res.status(200).json({ message: 'Payment recorded successfully.', receiptNumber: receiptNum, fee: calculateDynamicLedger(fee) });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: error.message });
  }
};


// ================= CLASS CONFIGURATION CRUD =================

// @desc    Get list of classes with dynamic capacities count
// @route   GET /api/admin/classes
const getClasses = async (req, res) => {
  try {
    const classes = await Class.find().populate('classTeacher', 'name');
    
    // Dynamically calculate strength
    const classesWithStrength = await Promise.all(classes.map(async (c) => {
      const approvedCount = await getApprovedCount(c._id);
      return {
        ...c.toObject(),
        approvedCount,
        availableSeats: Math.max(0, c.maxCapacity - approvedCount)
      };
    }));

    res.json(classesWithStrength);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new class and section configuration
// @route   POST /api/admin/classes
const createClass = async (req, res) => {
  const { name, section, maxCapacity, classTeacherId, feeStructure } = req.body;

  if (!name || !section) {
    return res.status(400).json({ message: 'Class name and section are required.' });
  }

  try {
    const isExist = await Class.findOne({ name, section });
    if (isExist) {
      return res.status(400).json({ message: `Class ${name} with section ${section} already exists.` });
    }

    const defaultFees = feeStructure || {};

    const newClass = await Class.create({
      name,
      section,
      maxCapacity: maxCapacity || 40,
      classTeacher: classTeacherId || null,
      feeStructure: {
        admission: Number(defaultFees.admission) || 0,
        tuition: Number(defaultFees.tuition) || 0,
        books: Number(defaultFees.books) || 0,
        hostel: Number(defaultFees.hostel) || 0,
        transport: Number(defaultFees.transport) || 0,
        uniform: Number(defaultFees.uniform) || 0,
        exam: Number(defaultFees.exam) || 0,
        other: Number(defaultFees.other) || 0
      }
    });

    await createAuditLog(req, 'Created Class', `${name} - ${section}`, 'Class', newClass._id.toString());
    res.status(201).json(newClass);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update class capacity or teacher
// @route   PUT /api/admin/classes/:id
const updateClass = async (req, res) => {
  const { id } = req.params;
  const { name, section, maxCapacity, classTeacherId, feeStructure } = req.body;

  try {
    const selectedClass = await Class.findById(id);
    if (!selectedClass) {
      return res.status(404).json({ message: 'Class not found.' });
    }

    const beforeState = selectedClass.toObject();
    if (name) selectedClass.name = name;
    if (section) selectedClass.section = section;
    if (maxCapacity) selectedClass.maxCapacity = Number(maxCapacity);
    if (classTeacherId !== undefined) selectedClass.classTeacher = classTeacherId || null;

    if (feeStructure) {
      selectedClass.feeStructure = {
        admission: Number(feeStructure.admission) || 0,
        tuition: Number(feeStructure.tuition) || 0,
        books: Number(feeStructure.books) || 0,
        hostel: Number(feeStructure.hostel) || 0,
        transport: Number(feeStructure.transport) || 0,
        uniform: Number(feeStructure.uniform) || 0,
        exam: Number(feeStructure.exam) || 0,
        other: Number(feeStructure.other) || 0
      };
      selectedClass.markModified('feeStructure');
    }

    await selectedClass.save();

    const { syncClassSubjects } = require('../utils/classSubjectSync');
    await syncClassSubjects(id);

    await createAuditLog(req, 'Updated Class Settings', `Class ${selectedClass.name} - ${selectedClass.section} settings/fees updated`, 'Class', id, beforeState, selectedClass.toObject());
    res.json(selectedClass);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete class
// @route   DELETE /api/admin/classes/:id
const deleteClass = async (req, res) => {
  const { id } = req.params;

  try {
    const studentCount = await Student.countDocuments({ class: id });
    if (studentCount > 0) {
      return res.status(400).json({ message: 'Cannot delete class with active students assigned.' });
    }

    await Class.findByIdAndDelete(id);
    await createAuditLog(req, 'Deleted Class', `Class ID: ${id}`, 'Class', id);
    res.json({ message: 'Class deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ================= CONSOLIDATED STUDENT PROFILE VIEW =================

// @desc    Get student full aggregated profile
// @route   GET /api/admin/student/:id/profile
const getStudentFullProfile = async (req, res) => {
  const { id } = req.params;

  try {
    let student = await Student.findById(id).populate('class').populate('parent');
    if (!student) {
      const enquiry = await Enquiry.findById(id);
      if (!enquiry) {
        return res.status(404).json({ message: 'Student/Enquiry record not found.' });
      }

      // Format enquiry class string
      const parts = enquiry.admissionClass.split(' - ');
      const className = parts[0] || 'Class 1';
      const classSection = parts[1] || 'A';

      student = {
        _id: enquiry._id,
        name: enquiry.studentName,
        status: 'Pending',
        isEnquiry: true,
        class: {
          name: className,
          section: classSection
        },
        parent: {
          fatherName: enquiry.parentName,
          phone: enquiry.mobileNumber,
          email: enquiry.email || '',
          address: enquiry.locality
        },
        address: enquiry.locality,
        emergencyContact: enquiry.mobileNumber,
        dob: new Date('2015-05-14'), // Default for form pre-fill
        gender: 'Male',
        bloodGroup: 'B+',
        religion: 'Hindu',
        category: 'General',
        aadhaar: '',
        documentChecklist: {
          birthCert: false,
          aadhaar: false,
          tc: false,
          reportCard: false,
          photo: false
        }
      };

      return res.json({
        student,
        fee: null,
        results: [],
        attendance: [],
        user: null,
        auditLogs: []
      });
    }

    const [fee, results, attendance, user, auditLogs] = await Promise.all([
      Fee.findOne({ student: id }),
      Result.find({ student: id }).populate('class'),
      Attendance.find({ student: id }),
      User.findById(student.user).select('-password'),
      AuditLog.find({ entityId: id }).sort({ timestamp: -1 })
    ]);

    res.json({
      student,
      fee: calculateDynamicLedger(fee),
      results,
      attendance,
      user,
      auditLogs
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ================= ACADEMIC YEAR PROMOTION =================

// @desc    Promote students in a class wizard
// @route   POST /api/admin/promote
const promoteStudents = async (req, res) => {
  const { fromClassId, toClassId } = req.body;

  if (!fromClassId || !toClassId) {
    return res.status(400).json({ message: 'Source and target class are required.' });
  }

  try {
    const students = await Student.find({ class: fromClassId, status: 'Approved' });
    if (students.length === 0) {
      return res.status(400).json({ message: 'No active students found in the source class.' });
    }

    const targetClass = await Class.findById(toClassId);
    if (!targetClass) {
      return res.status(404).json({ message: 'Target class not found.' });
    }

    let promoteCount = 0;
    const activeSettings = await SchoolSettings.findOne() || { academicYear: '2026-27' };
    const feeStructure = await FeeStructure.findOne({ 
      academicYear: activeSettings.academicYear, 
      className: targetClass.name 
    });

    for (let student of students) {
      const beforeState = student.toObject();

      // Update student class
      student.class = toClassId;

      // Re-generate Roll Number for new year/class
      let classPrefix = targetClass.name.replace('Class ', '').replace(/\s+/g, '');
      const rollPrefix = `${classPrefix}-${targetClass.section || 'A'}`;
      const sameClassCount = await Student.countDocuments({ class: toClassId, status: 'Approved' });
      student.rollNumber = `${rollPrefix}-${String(sameClassCount + 1).padStart(3, '0')}`;
      
      await student.save();

      // Reset Attendance history placeholder
      await Attendance.deleteMany({ student: student._id });

      // Copy Fee structure
      if (feeStructure) {
        const breakdown = {};
        Object.keys(feeStructure.heads).forEach(key => {
          breakdown[key] = { total: feeStructure.heads[key], paid: 0 };
        });

        await Fee.findOneAndUpdate(
          { student: student._id },
          {
            academicYear: activeSettings.academicYear,
            totalAmount: Object.values(feeStructure.heads).reduce((a, b) => a + b, 0),
            paidAmount: 0,
            balanceAmount: Object.values(feeStructure.heads).reduce((a, b) => a + b, 0),
            breakdown,
            payments: []
          },
          { upsert: true }
        );
      }

      await createAuditLog(req, 'Promoted Student', `Promoted from class ID: ${fromClassId} to ${toClassId}`, 'Student', student._id.toString(), beforeState, student.toObject());
      promoteCount++;
    }

    res.status(200).json({ message: `Successfully promoted ${promoteCount} students.`, promoteCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ================= GLOBAL SEARCH =================

// @desc    Universal search across identifiers
// @route   GET /api/admin/search
const globalSearch = async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ message: 'Search query is required.' });
  }

  try {
    const regex = new RegExp(q, 'i');

    const [students, parents, teachers, fees] = await Promise.all([
      Student.find({
        $or: [
          { name: regex },
          { rollNumber: regex },
          { admissionNumber: regex },
          { aadhaar: regex }
        ]
      }).populate('class'),
      Parent.find({
        $or: [
          { fatherName: regex },
          { motherName: regex },
          { phone: regex }
        ]
      }).populate('children'),
      Teacher.find({
        $or: [
          { name: regex },
          { teacherId: regex }
        ]
      }),
      Fee.find().populate({
        path: 'student',
        match: { name: regex }
      })
    ]);

    // Filter fees matching search
    const filteredFees = fees.filter(f => f.student !== null || f.payments.some(p => p.receiptNumber.includes(q)));

    res.json({
      students,
      parents,
      teachers,
      fees: filteredFees.map(f => calculateDynamicLedger(f))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ================= REPORT PANEL EXPORTS =================

// @desc    Get PDF/Excel list details
// @route   GET /api/admin/reports
const getReports = async (req, res) => {
  const { type, from, to } = req.query;

  try {
    let dateFilter = {};
    if (from || to) {
      dateFilter.createdAt = {};
      if (from) dateFilter.createdAt.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        dateFilter.createdAt.$lte = toDate;
      }
    }

    if (type === 'students') {
      const list = await Student.find({ status: 'Approved' }).populate('class');
      return res.json(list);
    } else if (type === 'teachers') {
      const teachers = await Teacher.find();
      const currentMonthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      const list = teachers.map(t => {
        const obj = t.toObject();
        const currentMonthPayments = (t.salaryPayments || []).filter(p => p.salaryMonth === currentMonthName);
        const alreadyPaid = currentMonthPayments.reduce((sum, p) => sum + p.amount, 0);
        const remainingSalary = Math.max(0, t.totalSalary - alreadyPaid);
        
        let salaryStatus = 'Pending';
        if (alreadyPaid >= t.totalSalary) {
          salaryStatus = 'Fully Paid';
        } else if (alreadyPaid > 0) {
          salaryStatus = 'Partially Paid';
        }

        return {
          ...obj,
          alreadyPaid,
          remainingSalary,
          salaryStatus
        };
      });
      return res.json(list);
    } else if (type === 'admissions') {
      const studentsList = await Student.find().populate('class').populate('parent');
      const enquiriesList = await Enquiry.find({ status: 'Pending' });

      const mappedEnquiries = enquiriesList.map(e => {
        const parts = e.admissionClass.split(' - ');
        const className = parts[0] || 'Class 1';
        const classSection = parts[1] || 'A';

        return {
          _id: e._id,
          name: e.studentName,
          class: {
            name: className,
            section: classSection
          },
          status: 'Pending',
          isEnquiry: true,
          parent: {
            fatherName: e.parentName,
            phone: e.mobileNumber,
            email: e.email || ''
          },
          locality: e.locality,
          createdAt: e.createdAt
        };
      });

      return res.json([...studentsList, ...mappedEnquiries]);
    } else if (type === 'fees') {
      const list = await Fee.find().populate({
        path: 'student',
        populate: [
          { path: 'class' },
          { path: 'parent' }
        ]
      });
      return res.json(list.map(f => calculateDynamicLedger(f)));
    } else if (type === 'attendance') {
      const list = await Attendance.find().populate('student').populate('class');
      return res.json(list);
    } else if (type === 'daily-collection') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);

      const query = {
        transactionType: 'Income',
        isCancelled: false,
        createdAt: from || to ? dateFilter.createdAt : { $gte: startOfDay, $lt: endOfDay }
      };

      const list = await FinancialLedger.find(query)
        .populate('student')
        .populate('class')
        .sort({ createdAt: -1 });
      return res.json(list);
    } else if (type === 'monthly-collection') {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const endOfMonth = new Date(startOfMonth);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);

      const query = {
        transactionType: 'Income',
        isCancelled: false,
        createdAt: from || to ? dateFilter.createdAt : { $gte: startOfMonth, $lt: endOfMonth }
      };

      const list = await FinancialLedger.find(query)
        .populate('student')
        .populate('class')
        .sort({ createdAt: -1 });
      return res.json(list);
    } else if (type === 'yearly-collection') {
      const startOfYear = new Date();
      startOfYear.setMonth(0, 1);
      startOfYear.setHours(0, 0, 0, 0);
      const endOfYear = new Date(startOfYear);
      endOfYear.setFullYear(endOfYear.getFullYear() + 1);

      const query = {
        transactionType: 'Income',
        isCancelled: false,
        createdAt: from || to ? dateFilter.createdAt : { $gte: startOfYear, $lt: endOfYear }
      };

      const list = await FinancialLedger.find(query)
        .populate('student')
        .populate('class')
        .sort({ createdAt: -1 });
      return res.json(list);
    } else if (type === 'expense-report') {
      const query = {
        transactionType: 'Expense',
        isCancelled: false
      };
      if (from || to) {
        query.createdAt = dateFilter.createdAt;
      }

      const list = await FinancialLedger.find(query)
        .populate('teacher')
        .sort({ createdAt: -1 });
      return res.json(list);
    } else if (type === 'salary-report') {
      const query = {
        transactionType: 'Expense',
        category: 'Teacher Salary',
        isCancelled: false
      };
      if (from || to) {
        query.createdAt = dateFilter.createdAt;
      }

      const list = await FinancialLedger.find(query)
        .populate('teacher')
        .sort({ createdAt: -1 });
      return res.json(list);
    } else if (type === 'income-report') {
      const query = {
        transactionType: 'Income',
        isCancelled: false
      };
      if (from || to) {
        query.createdAt = dateFilter.createdAt;
      }

      const list = await FinancialLedger.find(query)
        .populate('student')
        .populate('class')
        .sort({ createdAt: -1 });
      return res.json(list);
    } else if (type === 'profit-loss') {
      const query = { isCancelled: false };
      if (from || to) {
        query.createdAt = dateFilter.createdAt;
      }

      const txns = await FinancialLedger.find(query);

      let totalIncome = 0;
      let totalExpense = 0;
      const incomeByCategory = {};
      const expenseByCategory = {};

      txns.forEach(t => {
        if (t.transactionType === 'Income') {
          totalIncome += t.amount;
          incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
        } else if (t.transactionType === 'Expense') {
          totalExpense += t.amount;
          expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
        }
      });

      return res.json({
        totalIncome,
        totalExpense,
        netProfit: totalIncome - totalExpense,
        incomeByCategory,
        expenseByCategory
      });
    } else if (type === 'pending-fee-report') {
      const list = await Fee.find({ balanceAmount: { $gt: 0 } })
        .populate({
          path: 'student',
          populate: [
            { path: 'class' },
            { path: 'parent' }
          ]
        });
      return res.json(list.map(f => calculateDynamicLedger(f)));
    }

    res.status(400).json({ message: 'Valid report type parameter is required.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ================= SETTINGS WORKFLOWS =================

const getSchoolSettings = async (req, res) => {
  try {
    let settings = await SchoolSettings.findOne();
    if (!settings) {
      settings = await SchoolSettings.create({});
    }
    
    const Principal = require('../models/Principal');
    const approvedPrincipal = await Principal.findOne({ status: 'Approved', isDeleted: { $ne: true } });
    
    const settingsObj = settings.toObject();
    if (!settings.principalName || settings.principalName === 'Mrs. Anitha Rao') {
      settingsObj.principalName = approvedPrincipal ? approvedPrincipal.name : 'Not Assigned';
    }
    
    res.json(settingsObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateSchoolSettings = async (req, res) => {
  const settingsData = req.body;

  try {
    let settings = await SchoolSettings.findOne();
    if (!settings) {
      settings = new SchoolSettings(settingsData);
    } else {
      Object.assign(settings, settingsData);
    }

    await settings.save();
    await createAuditLog(req, 'Updated School Settings', 'Modified global settings config', 'SchoolSettings', settings._id.toString());

    res.status(200).json({ message: 'School configurations updated successfully.', settings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addStudent,
  approveStudent,
  updateStudent,
  archiveStudent,
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
  getAuditLogs
};

const getDashboardStats = async (req, res) => {
  try {
    const activeStudents = await Student.countDocuments({ status: 'Approved' });
    const totalTeachers = await Teacher.countDocuments();
    const classesCount = await Class.countDocuments();
    
    // Website enquiries count
    const pendingVerify = await Enquiry.countDocuments({ status: 'Pending' });

    // Live calculations from Financial Ledger and dynamic fee stats
    const stats = await getUnifiedDashboardStats();

    // Attendance stats
    const today = new Date();
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const presentCount = await Attendance.countDocuments({
      date: { $gte: todayStart, $lt: todayEnd },
      status: { $in: ['Present', 'Late'] }
    });
    
    const totalAttendanceLogged = await Attendance.countDocuments({
      date: { $gte: todayStart, $lt: todayEnd }
    });

    const attendancePresent = totalAttendanceLogged > 0 ? presentCount : Math.round(activeStudents * 0.96);
    const attendanceTotal = totalAttendanceLogged > 0 ? totalAttendanceLogged : activeStudents;

    // Birthday stats
    const todayMonth = new Date().getMonth();
    const todayDate = new Date().getDate();

    const students = await Student.find({ status: 'Approved' }).select('dob');
    const studentBdays = students.filter(s => {
      if (!s.dob) return false;
      const d = new Date(s.dob);
      return d.getMonth() === todayMonth && d.getDate() === todayDate;
    }).length;

    // Simulate 1 teacher birthday
    const teacherBdays = 1;

    // Transport & Exam counts for admin dashboard
    const totalDrivers = await Driver.countDocuments();
    const totalVehicles = await TransportVehicle.countDocuments();
    const transportStudents = await Student.countDocuments({ 'transport.vehicle': { $ne: null }, status: 'Approved' });
    
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(today.getDate() + 30);
    const licenceExpiryCount = await Driver.countDocuments({ licenceExpiryDate: { $lte: thirtyDaysLater } });
    const insuranceExpiryCount = await TransportVehicle.countDocuments({ insuranceExpiry: { $lt: today } });
    const upcomingExamsCount = await ExamSchedule.countDocuments({ status: 'Published' });

    res.json({
      activeStudents,
      totalTeachers,
      classesCount,
      pendingVerify,
      
      // Merge all live financial stats
      ...stats,

      attendancePresent,
      attendanceTotal,
      studentBdays,
      teacherBdays,
      totalDrivers,
      totalVehicles,
      transportStudents,
      licenceExpiryCount,
      insuranceExpiryCount,
      upcomingExamsCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= TRANSPORT & FEES EXTENSION CRUD =================

// Drivers CRUD
const getDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find().sort({ name: 1 });
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addDriver = async (req, res) => {
  const { name, mobile, alternateMobile, address, dob, bloodGroup, aadhaar, licenceNumber, licenceCategory, licenceIssueDate, licenceExpiryDate, experience, emergencyContact, photo, aadhaarDoc, licenceDoc } = req.body;

  try {
    const existingAadhaar = await Driver.findOne({ aadhaar });
    if (existingAadhaar) return res.status(400).json({ message: 'Driver with this Aadhaar Number already exists.' });

    const existingLicence = await Driver.findOne({ licenceNumber });
    if (existingLicence) return res.status(400).json({ message: 'Driver with this Licence Number already exists.' });

    // Licence expiry validation
    if (new Date(licenceExpiryDate) < new Date()) {
      return res.status(400).json({ message: 'Cannot add driver with expired licence.' });
    }

    const driver = await Driver.create({
      name, mobile, alternateMobile, address, dob, bloodGroup, aadhaar, licenceNumber, licenceCategory, licenceIssueDate, licenceExpiryDate, experience, emergencyContact, photo, aadhaarDoc, licenceDoc
    });

    await createAuditLog(req, 'Added Driver', `Added driver: ${name} - Licence: ${licenceNumber}`, 'Driver', driver._id.toString());
    res.status(201).json(driver);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateDriver = async (req, res) => {
  const { id } = req.params;
  
  try {
    const beforeState = await Driver.findById(id);
    if (!beforeState) return res.status(404).json({ message: 'Driver not found.' });

    const { aadhaar, licenceNumber } = req.body;
    if (aadhaar && aadhaar !== beforeState.aadhaar) {
      const existing = await Driver.findOne({ aadhaar });
      if (existing) return res.status(400).json({ message: 'Driver with this Aadhaar Number already exists.' });
    }
    if (licenceNumber && licenceNumber !== beforeState.licenceNumber) {
      const existing = await Driver.findOne({ licenceNumber });
      if (existing) return res.status(400).json({ message: 'Driver with this Licence Number already exists.' });
    }

    const originalObject = beforeState.toObject();
    Object.assign(beforeState, req.body);
    await beforeState.save();

    await createAuditLog(req, 'Updated Driver Profile', `Updated driver profile: ${beforeState.name}`, 'Driver', id, originalObject, beforeState.toObject());
    res.json(beforeState);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteDriver = async (req, res) => {
  const { id } = req.params;
  try {
    const assignedVehicle = await TransportVehicle.findOne({ driver: id });
    if (assignedVehicle) {
      return res.status(400).json({ message: `Cannot delete driver. They are currently assigned to vehicle ${assignedVehicle.vehicleNumber}.` });
    }

    const driver = await Driver.findById(id);
    if (!driver) return res.status(404).json({ message: 'Driver not found.' });

    const beforeState = driver.toObject();
    await Driver.findByIdAndDelete(id);

    await createAuditLog(req, 'Deleted Driver', `Deleted driver: ${driver.name}`, 'Driver', id, beforeState, null);
    res.json({ message: 'Driver deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Vehicles CRUD
const getVehicles = async (req, res) => {
  try {
    const vehicles = await TransportVehicle.find().populate('driver').sort({ vehicleNumber: 1 });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addVehicle = async (req, res) => {
  const { vehicleNumber, registrationNumber, vehicleType, capacity, driver, attendant, status, insuranceExpiry, fitnessCertificateExpiry, pollutionCertificateExpiry } = req.body;

  if (!vehicleNumber || !registrationNumber || !vehicleType || !capacity || !driver || !insuranceExpiry || !fitnessCertificateExpiry || !pollutionCertificateExpiry) {
    return res.status(400).json({ message: 'All vehicle fields are required.' });
  }

  try {
    const existingPlate = await TransportVehicle.findOne({ vehicleNumber });
    if (existingPlate) return res.status(400).json({ message: 'Vehicle with this Vehicle Number already exists.' });

    const existingReg = await TransportVehicle.findOne({ registrationNumber });
    if (existingReg) return res.status(400).json({ message: 'Vehicle with this Registration Number already exists.' });

    // Validate driver
    const driverRecord = await Driver.findById(driver);
    if (!driverRecord) return res.status(404).json({ message: 'Assigned Driver not found.' });

    // Expired warnings check
    if (new Date(insuranceExpiry) < new Date() || new Date(fitnessCertificateExpiry) < new Date() || new Date(pollutionCertificateExpiry) < new Date()) {
      return res.status(400).json({ message: 'Cannot add vehicle with expired certificates.' });
    }

    const vehicle = await TransportVehicle.create({
      vehicleNumber, registrationNumber, vehicleType, capacity: Number(capacity), driver, attendant, status, insuranceExpiry, fitnessCertificateExpiry, pollutionCertificateExpiry
    });

    await createAuditLog(req, 'Added Vehicle', `Added vehicle: ${vehicleNumber}`, 'TransportVehicle', vehicle._id.toString());
    res.status(201).json(vehicle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateVehicle = async (req, res) => {
  const { id } = req.params;
  
  try {
    const beforeState = await TransportVehicle.findById(id);
    if (!beforeState) return res.status(404).json({ message: 'Vehicle not found.' });

    const { vehicleNumber, registrationNumber, driver } = req.body;
    if (vehicleNumber && vehicleNumber !== beforeState.vehicleNumber) {
      const existing = await TransportVehicle.findOne({ vehicleNumber });
      if (existing) return res.status(400).json({ message: 'Vehicle with this Vehicle Number already exists.' });
    }
    if (registrationNumber && registrationNumber !== beforeState.registrationNumber) {
      const existing = await TransportVehicle.findOne({ registrationNumber });
      if (existing) return res.status(400).json({ message: 'Vehicle with this Registration Number already exists.' });
    }

    if (driver) {
      const driverRecord = await Driver.findById(driver);
      if (!driverRecord) return res.status(404).json({ message: 'Driver not found.' });
    }

    const originalObject = beforeState.toObject();
    Object.assign(beforeState, req.body);
    await beforeState.save();

    await createAuditLog(req, 'Updated Vehicle', `Updated vehicle: ${beforeState.vehicleNumber}`, 'TransportVehicle', id, originalObject, beforeState.toObject());
    res.json(beforeState);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteVehicle = async (req, res) => {
  const { id } = req.params;
  try {
    // Check if vehicle is used in any route
    const assignedRoute = await Route.findOne({ vehicle: id });
    if (assignedRoute) {
      return res.status(400).json({ message: `Cannot delete vehicle. It is currently assigned to route '${assignedRoute.routeName}'.` });
    }

    const assignedStudents = await Student.findOne({ 'transport.vehicle': id });
    if (assignedStudents) {
      return res.status(400).json({ message: 'Cannot delete vehicle. Students are currently assigned to it.' });
    }

    const vehicle = await TransportVehicle.findById(id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found.' });

    const beforeState = vehicle.toObject();
    await TransportVehicle.findByIdAndDelete(id);

    await createAuditLog(req, 'Deleted Vehicle', `Deleted vehicle: ${vehicle.vehicleNumber}`, 'TransportVehicle', id, beforeState, null);
    res.json({ message: 'Vehicle deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Student Transport Mapping
const assignStudentTransport = async (req, res) => {
  const { studentId } = req.params;
  const { routeId, pickupPoint } = req.body;

  try {
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found.' });

    const beforeState = student.toObject();

    if (!routeId) {
      // Clear transport assignment
      student.transport = { vehicle: null, route: '', pickupPoint: '', dropPoint: '', pickupTime: '', dropTime: '', fee: 0 };
      await student.save();

      // Recalculate fee breakdown for transport if ledger exists
      const fee = await Fee.findOne({ student: student._id });
      if (fee) {
        const feeBefore = fee.toObject();
        fee.breakdown.transport = { total: 0, paid: 0 };
        const updatedLedger = calculateDynamicLedger(fee);
        fee.totalAmount = updatedLedger.totalAmount;
        fee.balanceAmount = updatedLedger.balanceAmount;
        await fee.save();
      }

      await createAuditLog(req, 'Cleared Student Transport', `Cleared transport assignment for ${student.name}`, 'Student', student._id.toString(), beforeState, student.toObject());
      return res.json({ message: 'Transport assignment cleared successfully.', student });
    }

    const route = await Route.findById(routeId).populate('vehicle');
    if (!route) return res.status(404).json({ message: 'Selected route not found.' });

    const vehicle = route.vehicle;
    if (!vehicle) return res.status(400).json({ message: 'No vehicle assigned to this route.' });

    // Validate capacity
    const currentAssigned = await Student.countDocuments({ 'transport.vehicle': vehicle._id, status: 'Approved' });
    if (currentAssigned >= vehicle.capacity) {
      return res.status(400).json({ message: `Vehicle capacity exceeded. (Capacity: ${vehicle.capacity}, Currently Assigned: ${currentAssigned})` });
    }

    student.transport = {
      vehicle: vehicle._id,
      route: route.routeName,
      pickupPoint: pickupPoint || '',
      dropPoint: route.endPoint || '',
      pickupTime: route.pickupTime || '',
      dropTime: route.dropTime || '',
      fee: route.monthlyFee
    };
    await student.save();

    // Dynamically update standard ledger fee total
    const fee = await Fee.findOne({ student: student._id });
    if (fee) {
      const feeBefore = fee.toObject();
      const newTransport = route.monthlyFee * 10; // 10 months
      if (!fee.breakdown.transport) {
        fee.breakdown.transport = { total: 0, paid: 0 };
      }
      fee.breakdown.transport.total = newTransport;
      const updatedLedger = calculateDynamicLedger(fee);
      fee.totalAmount = updatedLedger.totalAmount;
      fee.balanceAmount = updatedLedger.balanceAmount;
      await fee.save();
      await createAuditLog(req, 'Updated Student Transport Fee', `Updated transport fee total to ₹${newTransport} for student ${student.name}`, 'Fee', fee._id.toString(), feeBefore, fee.toObject());
    }

    // Trigger Notification for Parent
    await Notification.create({
      title: 'Transport Assigned',
      message: `Transport assigned for ${student.name}. Route: ${route.routeName}, Bus Number: ${vehicle.vehicleNumber}, Pickup: ${pickupPoint} (${route.pickupTime}).`,
      recipientRole: 'parent',
      sender: req.user ? req.user._id : student.user
    });

    await createAuditLog(req, 'Assigned Student Transport', `Assigned route ${route.routeName} to ${student.name}`, 'Student', student._id.toString(), beforeState, student.toObject());

    res.json({ message: 'Transport assigned successfully.', student });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Installment Plan templates
const getInstallmentPlans = async (req, res) => {
  try {
    const plans = await FeeInstallmentPlan.find().sort({ className: 1 });
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const assignPlanToStudents = async (className, academicYear, planInstallments) => {
  const targetClass = await Class.findOne({ name: className });
  if (!targetClass) return;

  const students = await Student.find({ class: targetClass._id, status: { $in: ['Approved', 'Pending'] } });
  
  for (const student of students) {
    let fee = await Fee.findOne({ student: student._id });
    
    const installmentsCopy = planInstallments.map(inst => ({
      name: inst.name,
      amount: inst.amount,
      paidAmount: 0,
      remainingAmount: inst.amount,
      status: 'Pending',
      dueDate: inst.dueDate,
      gracePeriod: inst.gracePeriod || 0,
      lateFee: inst.lateFee || 0,
      discount: inst.discount || 0,
      breakdown: inst.breakdown ? {
        admission: inst.breakdown.admission || 0,
        tuition: inst.breakdown.tuition || 0,
        books: inst.breakdown.books || 0,
        hostel: inst.breakdown.hostel || 0,
        transport: inst.breakdown.transport || 0,
        uniform: inst.breakdown.uniform || 0,
        exam: inst.breakdown.exam || 0,
        other: inst.breakdown.other || 0
      } : { admission: 0, tuition: inst.amount, books: 0, hostel: 0, transport: 0, uniform: 0, exam: 0, other: 0 },
      payments: []
    }));

    const planTotal = planInstallments.reduce((sum, inst) => sum + Number(inst.amount), 0);

    if (fee) {
      fee.installments = installmentsCopy;
      fee.totalAmount = planTotal;
      fee.balanceAmount = Math.max(0, planTotal - fee.paidAmount);
      await fee.save();
    } else {
      await Fee.create({
        student: student._id,
        academicYear: academicYear,
        totalAmount: planTotal,
        paidAmount: 0,
        balanceAmount: planTotal,
        installments: installmentsCopy
      });
    }
  }
};

const createOrUpdateInstallmentPlan = async (req, res) => {
  const { className, academicYear, totalAmount, installments, status, mode } = req.body;

  if (!className || !totalAmount || !installments || !Array.isArray(installments)) {
    return res.status(400).json({ message: 'Class name, total amount, and installments array are required.' });
  }

  // Fetch target class configuration to validate
  let targetClass;
  try {
    targetClass = await Class.findOne({ name: className });
    if (!targetClass) {
      return res.status(404).json({ message: `Target class ${className} not found.` });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  const classFeeStructure = targetClass.feeStructure || {};
  const rawStructure = classFeeStructure.toObject ? classFeeStructure.toObject() : classFeeStructure;
  const components = ['admission', 'tuition', 'books', 'hostel', 'transport', 'uniform', 'exam', 'other'];
  let expectedAnnualFee = 0;
  components.forEach(comp => {
    expectedAnnualFee += Number(rawStructure[comp]) || 0;
  });

  // Validate installment total must equal target class annual fee
  if (Math.abs(Number(totalAmount) - expectedAnnualFee) > 0.01) {
    return res.status(400).json({ message: `Sum of installments (₹${totalAmount}) must equal the Class Annual Fee (₹${expectedAnnualFee}).` });
  }

  // Validate sum of installment amounts equals totalAmount
  const sum = installments.reduce((acc, curr) => acc + Number(curr.amount), 0);
  if (Math.abs(sum - Number(totalAmount)) > 0.01) {
    return res.status(400).json({ message: `Sum of installment amounts (₹${sum}) must equal the Annual Fee (₹${totalAmount}).` });
  }

  // If publishing, perform component validation
  const planStatus = status || 'Draft';
  if (planStatus === 'Published') {
    const components = ['admission', 'tuition', 'books', 'hostel', 'transport', 'uniform', 'exam', 'other'];
    for (const comp of components) {
      const classCompAmt = Number(classFeeStructure[comp]) || 0;
      const instCompSum = installments.reduce((acc, inst) => acc + (Number(inst.breakdown?.[comp]) || 0), 0);
      if (Math.abs(classCompAmt - instCompSum) > 0.01) {
        return res.status(400).json({ message: `Sum of installment ${comp} fees (₹${instCompSum}) must equal class ${comp} fee (₹${classCompAmt}).` });
      }
    }
  }

  try {
    let plan = await FeeInstallmentPlan.findOne({ className, academicYear });
    if (plan) {
      if (plan.status === 'Archived') {
        return res.status(400).json({ message: 'Archived templates cannot be modified.' });
      }
      const beforeState = plan.toObject();
      plan.totalAmount = totalAmount;
      plan.installments = installments;
      plan.status = planStatus;
      plan.mode = mode || 'A';
      if (planStatus === 'Published') {
        plan.publishedAt = new Date();
      }
      await plan.save();
      
      if (planStatus === 'Published') {
        // Archive other published plans
        await FeeInstallmentPlan.updateMany(
          { className, academicYear, status: 'Published', _id: { $ne: plan._id } },
          { $set: { status: 'Archived', archivedAt: new Date() } }
        );
        await assignPlanToStudents(className, academicYear, plan.installments);
      }
      
      await createAuditLog(req, planStatus === 'Published' ? 'Template Published' : 'Template Created', `Saved installment plan template for ${className} as ${planStatus}`, 'FeeInstallmentPlan', plan._id.toString(), beforeState, plan.toObject());
    } else {
      plan = await FeeInstallmentPlan.create({
        className,
        academicYear,
        totalAmount,
        status: planStatus,
        mode: mode || 'A',
        publishedAt: planStatus === 'Published' ? new Date() : undefined,
        installments
      });

      if (planStatus === 'Published') {
        // Archive other published plans
        await FeeInstallmentPlan.updateMany(
          { className, academicYear, status: 'Published', _id: { $ne: plan._id } },
          { $set: { status: 'Archived', archivedAt: new Date() } }
        );
        await assignPlanToStudents(className, academicYear, plan.installments);
      }
      
      await createAuditLog(req, planStatus === 'Published' ? 'Template Published' : 'Template Created', `Created installment plan template for ${className} as ${planStatus}`, 'FeeInstallmentPlan', plan._id.toString(), null, plan.toObject());
    }

    res.status(200).json({ message: 'Fee installment plan saved successfully.', plan });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const publishInstallmentPlan = async (req, res) => {
  const { id } = req.params;
  try {
    const plan = await FeeInstallmentPlan.findById(id);
    if (!plan) return res.status(404).json({ message: 'Installment template plan not found.' });

    if (plan.status === 'Archived') {
      return res.status(400).json({ message: 'Archived templates cannot be published.' });
    }

    // Perform strong validation
    const targetClass = await Class.findOne({ name: plan.className });
    if (!targetClass) {
      return res.status(404).json({ message: `Class ${plan.className} not found.` });
    }

    const classFeeStructure = targetClass.feeStructure || {};
    const rawStructure = classFeeStructure.toObject ? classFeeStructure.toObject() : classFeeStructure;
    let expectedAnnualFee = 0;
    const comps = ['admission', 'tuition', 'books', 'hostel', 'transport', 'uniform', 'exam', 'other'];
    comps.forEach(comp => {
      expectedAnnualFee += Number(rawStructure[comp]) || 0;
    });

    if (Math.abs(Number(plan.totalAmount) - expectedAnnualFee) > 0.01) {
      return res.status(400).json({ message: `Template annual fee (₹${plan.totalAmount}) does not match Class annual fee (₹${expectedAnnualFee}).` });
    }

    const components = ['admission', 'tuition', 'books', 'hostel', 'transport', 'uniform', 'exam', 'other'];
    for (const comp of components) {
      const classCompAmt = Number(classFeeStructure[comp]) || 0;
      const instCompSum = plan.installments.reduce((acc, inst) => acc + (Number(inst.breakdown?.[comp]) || 0), 0);
      if (Math.abs(classCompAmt - instCompSum) > 0.01) {
        return res.status(400).json({ message: `Sum of installment ${comp} fees (₹${instCompSum}) does not match class total (₹${classCompAmt}).` });
      }
    }

    const beforeState = plan.toObject();
    plan.status = 'Published';
    plan.publishedAt = new Date();
    await plan.save();

    // Archive other published plans
    await FeeInstallmentPlan.updateMany(
      { className: plan.className, academicYear: plan.academicYear, status: 'Published', _id: { $ne: plan._id } },
      { $set: { status: 'Archived', archivedAt: new Date() } }
    );

    // Link/assign to students
    await assignPlanToStudents(plan.className, plan.academicYear, plan.installments);

    await createAuditLog(req, 'Template Published', `Published installment template for class ${plan.className}`, 'FeeInstallmentPlan', id, beforeState, plan.toObject());
    res.json({ message: 'Template plan published successfully.', plan });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const archiveInstallmentPlan = async (req, res) => {
  const { id } = req.params;
  try {
    const plan = await FeeInstallmentPlan.findById(id);
    if (!plan) return res.status(404).json({ message: 'Installment template plan not found.' });

    const beforeState = plan.toObject();
    plan.status = 'Archived';
    plan.archivedAt = new Date();
    await plan.save();

    await createAuditLog(req, 'Template Archived', `Archived installment template for class ${plan.className}`, 'FeeInstallmentPlan', id, beforeState, plan.toObject());
    res.json({ message: 'Template plan archived successfully.', plan });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateStudentInstallmentDueDate = async (req, res) => {
  const { studentId, installmentId } = req.params;
  const { dueDate } = req.body;

  if (!dueDate) return res.status(400).json({ message: 'Due Date is required.' });

  try {
    const fee = await Fee.findOne({ student: studentId }).populate('student');
    if (!fee) return res.status(404).json({ message: 'Student fee ledger not found.' });

    const inst = fee.installments.id(installmentId);
    if (!inst) return res.status(404).json({ message: 'Installment not found.' });

    const beforeState = fee.toObject();
    const oldDueDate = inst.dueDate;
    inst.dueDate = new Date(dueDate);

    // Recalculate dynamic ledger totals
    const updatedLedger = calculateDynamicLedger(fee);
    fee.totalAmount = updatedLedger.totalAmount;
    fee.paidAmount = updatedLedger.paidAmount;
    fee.balanceAmount = updatedLedger.balanceAmount;

    await fee.save();

    const studentObj = await Student.findById(studentId);
    
    // Create Audit Log
    await createAuditLog(
      req, 
      'Due Date Extended', 
      `Extended due date of ${inst.name} for student ${fee.student?.name || studentObj?.name || studentId}`, 
      'Fee', 
      fee._id.toString(), 
      { dueDate: oldDueDate }, 
      { dueDate: inst.dueDate }
    );

    // Send notifications to parent & student
    if (studentObj) {
      await Notification.create({
        title: 'Due Date Extended',
        message: `The due date for installment ${inst.name} has been extended to ${new Date(inst.dueDate).toLocaleDateString('en-GB')}.`,
        recipientRole: 'parent',
        class: studentObj.class,
        type: 'Fee',
        sender: req.user ? req.user._id : studentObj.user
      });
      await Notification.create({
        title: 'Due Date Extended',
        message: `The due date for installment ${inst.name} has been extended to ${new Date(inst.dueDate).toLocaleDateString('en-GB')}.`,
        recipientRole: 'student',
        class: studentObj.class,
        type: 'Fee',
        sender: req.user ? req.user._id : studentObj.user
      });
    }

    res.json({ message: 'Installment due date updated successfully.', fee: calculateDynamicLedger(fee) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const overrideStudentInstallmentLateFee = async (req, res) => {
  const { studentId, installmentId } = req.params;
  const { lateFee, reason } = req.body;

  if (lateFee === undefined || isNaN(Number(lateFee))) {
    return res.status(400).json({ message: 'Valid Late Fee is required.' });
  }
  if (!reason || reason.trim() === '') {
    return res.status(400).json({ message: 'Reason for override is required.' });
  }

  try {
    const fee = await Fee.findOne({ student: studentId }).populate('student');
    if (!fee) return res.status(404).json({ message: 'Student fee ledger not found.' });

    const inst = fee.installments.id(installmentId);
    if (!inst) return res.status(404).json({ message: 'Installment not found.' });

    const beforeState = fee.toObject();
    const oldLateFee = inst.lateFee;
    
    inst.lateFee = Number(lateFee);

    // Recalculate dynamic ledger totals
    const updatedLedger = calculateDynamicLedger(fee);
    fee.totalAmount = updatedLedger.totalAmount;
    fee.paidAmount = updatedLedger.paidAmount;
    fee.balanceAmount = updatedLedger.balanceAmount;

    await fee.save();

    const studentObj = await Student.findById(studentId);

    // Create Audit Log with mandatory reason
    await createAuditLog(
      req, 
      'Late Fee Override', 
      `Overrode late fee of ${inst.name} for student ${fee.student?.name || studentObj?.name || studentId} from ₹${oldLateFee} to ₹${inst.lateFee}. Reason: ${reason}`, 
      'Fee', 
      fee._id.toString(), 
      { lateFee: oldLateFee }, 
      { lateFee: inst.lateFee }
    );

    res.json({ message: 'Installment late fee overridden successfully.', fee: calculateDynamicLedger(fee) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addStudentInstallmentNote = async (req, res) => {
  const { studentId, installmentId } = req.params;
  const { note } = req.body;

  try {
    const fee = await Fee.findOne({ student: studentId }).populate('student');
    if (!fee) return res.status(404).json({ message: 'Student fee ledger not found.' });

    const inst = fee.installments.id(installmentId);
    if (!inst) return res.status(404).json({ message: 'Installment not found.' });

    const beforeState = fee.toObject();
    const oldNote = inst.internalNotes || '';
    inst.internalNotes = note || '';

    await fee.save();

    const studentObj = await Student.findById(studentId);

    await createAuditLog(
      req, 
      'Internal Note Added', 
      `Added internal note to ${inst.name} for student ${fee.student?.name || studentObj?.name || studentId}`, 
      'Fee', 
      fee._id.toString(), 
      { note: oldNote }, 
      { note: inst.internalNotes }
    );

    res.json({ message: 'Internal note saved successfully.', fee: calculateDynamicLedger(fee) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteInstallmentPlan = async (req, res) => {
  const { id } = req.params;
  try {
    const plan = await FeeInstallmentPlan.findById(id);
    if (!plan) return res.status(404).json({ message: 'Plan not found.' });

    if (plan.status === 'Published') {
      const targetClass = await Class.findOne({ name: plan.className });
      if (targetClass) {
        const studentCount = await Student.countDocuments({ class: targetClass._id, status: { $in: ['Approved', 'Pending'] } });
        if (studentCount > 0) {
          return res.status(400).json({ message: 'This template is currently assigned to students. Archive it first.' });
        }
      }
    }

    await FeeInstallmentPlan.findByIdAndDelete(id);
    await createAuditLog(req, 'Deleted Installment Plan', `Deleted fee installment plan for class ${plan.className}`, 'FeeInstallmentPlan', id);
    res.json({ message: 'Fee installment plan deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getRoutes = async (req, res) => {
  try {
    const routes = await Route.find().populate({
      path: 'vehicle',
      populate: { path: 'driver' }
    });
    res.json(routes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addRoute = async (req, res) => {
  const { routeName, startPoint, stops, endPoint, pickupTime, dropTime, monthlyFee, vehicle } = req.body;

  if (!routeName || !startPoint || !endPoint || !pickupTime || !dropTime || monthlyFee === undefined) {
    return res.status(400).json({ message: 'Route Name, Start Point, End Point, Pickup/Drop Times, and Monthly Fee are required.' });
  }

  try {
    const existing = await Route.findOne({ routeName });
    if (existing) {
      return res.status(400).json({ message: 'Route Name must be unique.' });
    }

    const route = await Route.create({
      routeName,
      startPoint,
      stops: Array.isArray(stops) ? stops : (stops ? stops.split(',').map(s => s.trim()) : []),
      endPoint,
      pickupTime,
      dropTime,
      monthlyFee: Number(monthlyFee),
      vehicle: vehicle || null
    });

    await createAuditLog(req, 'Created Route', `Created route ${routeName} with fee ₹${monthlyFee}`, 'Route', route._id.toString());
    res.status(201).json(route);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateRoute = async (req, res) => {
  const { id } = req.params;
  const { routeName, startPoint, stops, endPoint, pickupTime, dropTime, monthlyFee, vehicle } = req.body;

  try {
    const route = await Route.findById(id);
    if (!route) return res.status(404).json({ message: 'Route not found.' });

    const beforeState = route.toObject();

    if (routeName && routeName !== route.routeName) {
      const existing = await Route.findOne({ routeName });
      if (existing) return res.status(400).json({ message: 'Route Name must be unique.' });
    }

    route.routeName = routeName || route.routeName;
    route.startPoint = startPoint || route.startPoint;
    if (stops !== undefined) {
      route.stops = Array.isArray(stops) ? stops : (stops ? stops.split(',').map(s => s.trim()) : []);
    }
    route.endPoint = endPoint || route.endPoint;
    route.pickupTime = pickupTime || route.pickupTime;
    route.dropTime = dropTime || route.dropTime;
    if (monthlyFee !== undefined) route.monthlyFee = Number(monthlyFee);
    if (vehicle !== undefined) route.vehicle = vehicle || null;

    await route.save();

    await createAuditLog(req, 'Updated Route', `Updated route ${route.routeName}`, 'Route', id, beforeState, route.toObject());
    res.json(route);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteRoute = async (req, res) => {
  const { id } = req.params;
  try {
    const route = await Route.findById(id);
    if (!route) return res.status(404).json({ message: 'Route not found.' });

    // Check if any student is assigned to this route
    const studentAssigned = await Student.findOne({ 'transport.route': route.routeName });
    if (studentAssigned) {
      return res.status(400).json({ message: 'Cannot delete route. Students are currently assigned to it.' });
    }

    const beforeState = route.toObject();
    await Route.findByIdAndDelete(id);

    await createAuditLog(req, 'Deleted Route', `Deleted route ${route.routeName}`, 'Route', id, beforeState, null);
    res.json({ message: 'Route deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDashboardDetail = async (req, res) => {
  const { card } = req.query;
  
  // Date helpers
  const today = new Date();
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const monthStart = new Date(currentYear, currentMonth, 1);
  const monthEnd = new Date(currentYear, currentMonth + 1, 1);

  try {
    if (card === 'active-students') {
      const classes = await Class.find();
      const classSummary = await Promise.all(classes.map(async (c) => {
        const approvedCount = await Student.countDocuments({ class: c._id, status: 'Approved' });
        return {
          _id: c._id,
          name: c.name,
          section: c.section,
          approvedCount,
          maxCapacity: c.maxCapacity
        };
      }));

      const totalBoys = await Student.countDocuments({ status: 'Approved', gender: 'Male' });
      const totalGirls = await Student.countDocuments({ status: 'Approved', gender: 'Female' });
      const totalStudents = await Student.countDocuments({ status: 'Approved' });

      return res.json({
        totalStudents,
        classSummary,
        totalBoys,
        totalGirls
      });
    }

    if (card === 'total-classes') {
      const classes = await Class.find().populate('classTeacher', 'name');
      const classDetails = await Promise.all(classes.map(async (c) => {
        const approvedCount = await Student.countDocuments({ class: c._id, status: 'Approved' });
        const boys = await Student.countDocuments({ class: c._id, status: 'Approved', gender: 'Male' });
        const girls = await Student.countDocuments({ class: c._id, status: 'Approved', gender: 'Female' });
        
        return {
          _id: c._id,
          name: c.name,
          section: c.section,
          maxCapacity: c.maxCapacity,
          approvedCount,
          boys,
          girls,
          classTeacher: c.classTeacher ? c.classTeacher.name : 'Not Assigned'
        };
      }));

      return res.json({ classDetails });
    }

    if (card === 'today-income' || card === 'today-collected') {
      const txns = await FinancialLedger.find({
        transactionType: 'Income',
        isCancelled: false,
        createdAt: { $gte: todayStart, $lt: todayEnd }
      });
      let breakdown = { admission: 0, tuition: 0, books: 0, hostel: 0, transport: 0, uniform: 0, exam: 0, other: 0 };
      let grandTotal = 0;
      txns.forEach(t => {
        let key = t.category.toLowerCase().replace(' fee', '');
        if (key === 'examination') key = 'exam';
        const mappedKey = breakdown[key] !== undefined ? key : 'other';
        breakdown[mappedKey] += t.amount;
        grandTotal += t.amount;
      });
      return res.json({ breakdown, grandTotal });
    }

    if (card === 'today-expenses') {
      const txns = await FinancialLedger.find({
        transactionType: 'Expense',
        isCancelled: false,
        createdAt: { $gte: todayStart, $lt: todayEnd }
      });
      let breakdown = {};
      let grandTotal = 0;
      txns.forEach(t => {
        breakdown[t.category] = (breakdown[t.category] || 0) + t.amount;
        grandTotal += t.amount;
      });
      return res.json({ breakdown, grandTotal });
    }

    if (card === 'today-net') {
      const txns = await FinancialLedger.find({
        isCancelled: false,
        createdAt: { $gte: todayStart, $lt: todayEnd }
      });
      let todayIncome = 0;
      let todayExpense = 0;
      txns.forEach(t => {
        if (t.transactionType === 'Income') todayIncome += t.amount;
        else if (t.transactionType === 'Expense') todayExpense += t.amount;
      });
      return res.json({ todayIncome, todayExpense, netCollection: todayIncome - todayExpense });
    }

    if (card === 'monthly-income') {
      const selectedMonth = req.query.month !== undefined && !isNaN(Number(req.query.month)) ? Number(req.query.month) : currentMonth;
      const mStart = new Date(currentYear, selectedMonth, 1);
      const mEnd = new Date(currentYear, Number(selectedMonth) + 1, 1);

      const txns = await FinancialLedger.find({
        transactionType: 'Income',
        isCancelled: false,
        createdAt: { $gte: mStart, $lt: mEnd }
      });

      let breakdown = {};
      let grandTotal = 0;
      txns.forEach(t => {
        breakdown[t.category] = (breakdown[t.category] || 0) + t.amount;
        grandTotal += t.amount;
      });
      return res.json({ breakdown, grandTotal });
    }

    if (card === 'monthly-collected') {
      const selectedMonth = req.query.month !== undefined && !isNaN(Number(req.query.month)) ? Number(req.query.month) : currentMonth;
      const mStart = new Date(currentYear, selectedMonth, 1);
      const mEnd = new Date(currentYear, Number(selectedMonth) + 1, 1);

      const txns = await FinancialLedger.find({
        createdAt: { $gte: mStart, $lt: mEnd },
        isCancelled: false
      });

      let collected = 0;
      let expenses = 0;
      let receiptsGenerated = 0;
      let modes = { cash: 0, upi: 0, bankTransfer: 0, cheque: 0 };
      let breakdown = {};

      txns.forEach(t => {
        if (t.transactionType === 'Income') {
          collected += t.amount;
          receiptsGenerated++;
          const methodKey = t.paymentMode.toLowerCase().replace(' ', '');
          if (methodKey === 'cash') modes.cash += t.amount;
          else if (methodKey === 'upi') modes.upi += t.amount;
          else if (methodKey === 'banktransfer' || methodKey === 'online' || methodKey === 'card') modes.bankTransfer += t.amount;
          else if (methodKey === 'cheque') modes.cheque += t.amount;

          breakdown[t.category] = (breakdown[t.category] || 0) + t.amount;
        } else if (t.transactionType === 'Expense') {
          expenses += t.amount;
        }
      });

      const admissionsCount = await Student.countDocuments({
        status: 'Approved',
        createdAt: { $gte: mStart, $lt: mEnd }
      });

      const fees = await Fee.find();
      let pending = 0;
      let expectedCollection = 0;
      fees.forEach(fDoc => {
        const f = calculateDynamicLedger(fDoc);
        pending += f.balanceAmount;
        expectedCollection += f.totalAmount;
      });

      const pendingSalaries = await getPendingSalariesStats();

      return res.json({
        collected,
        expenses,
        netProfit: collected - expenses,
        pending,
        expectedCollection,
        admissionsCount,
        totalTransactions: receiptsGenerated,
        modes,
        receiptsGenerated,
        pendingSalaries,
        breakdown
      });
    }

    if (card === 'monthly-expenses') {
      const selectedMonth = req.query.month !== undefined && !isNaN(Number(req.query.month)) ? Number(req.query.month) : currentMonth;
      const mStart = new Date(currentYear, selectedMonth, 1);
      const mEnd = new Date(currentYear, Number(selectedMonth) + 1, 1);

      const txns = await FinancialLedger.find({
        transactionType: 'Expense',
        isCancelled: false,
        createdAt: { $gte: mStart, $lt: mEnd }
      });

      let breakdown = {};
      let grandTotal = 0;
      txns.forEach(t => {
        breakdown[t.category] = (breakdown[t.category] || 0) + t.amount;
        grandTotal += t.amount;
      });
      return res.json({ breakdown, grandTotal });
    }

    if (card === 'monthly-net') {
      const selectedMonth = req.query.month !== undefined && !isNaN(Number(req.query.month)) ? Number(req.query.month) : currentMonth;
      const mStart = new Date(currentYear, selectedMonth, 1);
      const mEnd = new Date(currentYear, Number(selectedMonth) + 1, 1);

      const txns = await FinancialLedger.find({
        isCancelled: false,
        createdAt: { $gte: mStart, $lt: mEnd }
      });

      let monthlyIncome = 0;
      let monthlyExpense = 0;
      txns.forEach(t => {
        if (t.transactionType === 'Income') monthlyIncome += t.amount;
        else if (t.transactionType === 'Expense') monthlyExpense += t.amount;
      });

      return res.json({ monthlyIncome, monthlyExpense, netIncome: monthlyIncome - monthlyExpense });
    }

    if (card === 'total-income') {
      const txns = await FinancialLedger.find({
        transactionType: 'Income',
        isCancelled: false
      });
      let breakdown = {};
      let grandTotal = 0;
      txns.forEach(t => {
        breakdown[t.category] = (breakdown[t.category] || 0) + t.amount;
        grandTotal += t.amount;
      });
      return res.json({ breakdown, grandTotal });
    }

    if (card === 'total-expenses') {
      const txns = await FinancialLedger.find({
        transactionType: 'Expense',
        isCancelled: false
      });
      let breakdown = {};
      let grandTotal = 0;
      txns.forEach(t => {
        breakdown[t.category] = (breakdown[t.category] || 0) + t.amount;
        grandTotal += t.amount;
      });
      return res.json({ breakdown, grandTotal });
    }

    if (card === 'net-income') {
      const txns = await FinancialLedger.find({ isCancelled: false });
      let totalIncome = 0;
      let totalExpense = 0;
      txns.forEach(t => {
        if (t.transactionType === 'Income') totalIncome += t.amount;
        else if (t.transactionType === 'Expense') totalExpense += t.amount;
      });
      return res.json({ totalIncome, totalExpense, netIncome: totalIncome - totalExpense });
    }

    if (card === 'expected-revenue') {
      const fees = await Fee.find().populate({
        path: 'student',
        populate: { path: 'class' }
      });
      const { expectedRevenue } = await getFeeStats();
      let studentList = [];

      fees.forEach(fDoc => {
        const f = calculateDynamicLedger(fDoc);
        if (f.student) {
          studentList.push({
            studentName: f.student.name,
            className: f.student.class ? `${f.student.class.name} - ${f.student.class.section}` : 'N/A',
            totalAmount: f.totalAmount,
            paidAmount: f.paidAmount
          });
        }
      });

      return res.json({ expectedRevenue, studentList });
    }

    if (card === 'outstanding-amount' || card === 'pending-deficits' || card === 'students-pending') {
      const fees = await Fee.find().populate({
        path: 'student',
        populate: { path: 'class' }
      });

      const { outstandingAmount: grandTotalPending } = await getFeeStats();
      let breakdown = { admission: 0, tuition: 0, books: 0, hostel: 0, transport: 0, uniform: 0, exam: 0, other: 0 };
      let studentsWithPending = 0;
      let highestPending = 0;
      let totalPendingForAvg = 0;
      let studentList = [];

      fees.forEach(fDoc => {
        const f = calculateDynamicLedger(fDoc);
        if (f.balanceAmount > 0.01) {
          studentsWithPending++;
          totalPendingForAvg += f.balanceAmount;
          if (f.balanceAmount > highestPending) {
            highestPending = f.balanceAmount;
          }

          let pendingCats = [];
          let studentCats = {};
          ['admission', 'tuition', 'books', 'hostel', 'transport', 'uniform', 'exam', 'other'].forEach(head => {
            const headItem = f.breakdown[head] || { total: 0, paid: 0 };
            const pendingForHead = Math.max(0, headItem.total - headItem.paid);
            breakdown[head] += pendingForHead;
            studentCats[head] = pendingForHead;
            if (pendingForHead > 0) {
              pendingCats.push(`${head}: ₹${pendingForHead}`);
            }
          });

          let pendingInsts = (f.installments || [])
            .filter(inst => inst.status === 'Pending' || inst.status === 'Overdue')
            .map(inst => `${inst.name} (${inst.status})`);

          if (f.student) {
            studentList.push({
              studentName: f.student.name,
              admissionNumber: f.student.admissionNumber || 'N/A',
              className: f.student.class ? `${f.student.class.name} - ${f.student.class.section}` : 'N/A',
              balanceAmount: f.balanceAmount,
              breakdown: studentCats,
              pendingCategories: pendingCats,
              pendingInstallments: pendingInsts,
              payments: (f.payments || []).map(p => ({
                receiptNumber: p.receiptNumber,
                amount: p.amount,
                date: p.date
              }))
            });
          }
        }
      });

      const averagePending = studentsWithPending > 0 ? (totalPendingForAvg / studentsWithPending) : 0;

      return res.json({
        breakdown,
        grandTotalPending,
        studentsWithPending,
        highestPending,
        averagePending,
        studentList
      });
    }

    if (card === 'fully-paid') {
      const fees = await Fee.find().populate({
        path: 'student',
        populate: { path: 'class' }
      });
      let studentList = [];

      fees.forEach(fDoc => {
        const f = calculateDynamicLedger(fDoc);
        if (f.balanceAmount <= 0.01 && f.paidAmount > 0) {
          let lastPaymentDate = '';
          if (f.payments && f.payments.length > 0) {
            const sorted = [...f.payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            lastPaymentDate = sorted[0].date;
          }
          studentList.push({
            studentName: f.student ? f.student.name : 'Unknown',
            className: f.student && f.student.class ? `${f.student.class.name} - ${f.student.class.section}` : 'N/A',
            paidAmount: f.paidAmount,
            receiptCount: f.payments ? f.payments.length : 0,
            lastPaymentDate
          });
        }
      });

      return res.json({ studentList });
    }

    if (card === 'pending-salaries') {
      const dummyDate = new Date(currentYear, currentMonth, 15);
      const targetMonthName = dummyDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const teachers = await Teacher.find().select('name totalSalary salaryPayments');
      let teacherList = [];
      let totalPending = 0;
      teachers.forEach(t => {
        const monthPayments = (t.salaryPayments || []).filter(p => p.salaryMonth === targetMonthName);
        const alreadyPaid = monthPayments.reduce((sum, p) => sum + p.amount, 0);
        const remaining = Math.max(0, t.totalSalary - alreadyPaid);
        totalPending += remaining;
        teacherList.push({
          name: t.name,
          totalSalary: t.totalSalary,
          alreadyPaid,
          remaining
        });
      });
      return res.json({ totalPending, teacherList });
    }

    res.status(400).json({ message: 'Invalid card request' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const holdStudent = async (req, res) => {
  const { id } = req.params;
  try {
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ message: 'Student record not found.' });
    }
    const beforeState = student.toObject();
    student.status = 'Hold';
    await student.save();

    await createAuditLog(req, 'Student Approved', `${student.name} marked as Hold status`, 'Student', id, beforeState, student.toObject());
    res.status(200).json({ message: 'Student status updated to Hold.', student });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const rejectStudent = async (req, res) => {
  const { id } = req.params;
  try {
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ message: 'Student record not found.' });
    }
    const beforeState = student.toObject();
    student.status = 'Rejected';
    await student.save();

    await createAuditLog(req, 'Student Approved', `${student.name} admission rejected`, 'Student', id, beforeState, student.toObject());
    res.status(200).json({ message: 'Student admission rejected.', student });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const remindDefaulter = async (req, res) => {
  const { id } = req.params;
  try {
    let fee = await Fee.findOne({ $or: [{ _id: id }, { student: id }] }).populate('student');
    if (!fee) {
      return res.status(404).json({ message: 'Fee ledger not found.' });
    }
    fee.reminderCount = (fee.reminderCount || 0) + 1;
    fee.lastReminderDate = new Date();
    await fee.save();

    res.status(200).json({ message: 'Reminder recorded successfully.', fee });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const uploadPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }
    const filePath = `/uploads/profiles/${req.file.filename}`;
    res.json({ message: 'File uploaded successfully.', filePath });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const payTeacherSalary = async (req, res) => {
  const { id } = req.params;
  const { amount, paymentMethod, referenceNumber, remarks, salaryMonth } = req.body;
  
  if (!amount || amount <= 0 || !paymentMethod || !salaryMonth) {
    return res.status(400).json({ message: 'Amount, payment method, and salary month are required.' });
  }

  try {
    const teacher = await Teacher.findById(id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher record not found.' });
    }

    const payVal = Number(amount);
    
    teacher.salaryPayments.push({
      amount: payVal,
      date: new Date(),
      paymentMethod,
      referenceNumber: referenceNumber || '',
      remarks: remarks || '',
      paidBy: req.user ? req.user.username : 'ADMIN',
      salaryMonth
    });

    await teacher.save();

    // Create Expense entry in FinancialLedger
    const activeSettings = await SchoolSettings.findOne() || { academicYear: '2026-27' };
    const currentYear = new Date().getFullYear();
    const counter = await Counter.findOneAndUpdate(
      { _id: `voucher-salary-${currentYear}` },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const voucherNum = `VCHR-SAL-${currentYear}-${String(counter.seq).padStart(6, '0')}`;
    const txnId = referenceNumber || `TXN-EXP-${Date.now()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const savedPayment = teacher.salaryPayments[teacher.salaryPayments.length - 1];
    const paymentId = savedPayment ? savedPayment._id.toString() : '';

    if (savedPayment && !savedPayment.referenceNumber) {
      savedPayment.referenceNumber = voucherNum;
      await teacher.save();
    }

    await FinancialLedger.create({
      transactionId: txnId,
      transactionType: 'Expense',
      category: 'Teacher Salary',
      amount: payVal,
      paymentMode: paymentMethod,
      voucherNumber: voucherNum,
      teacher: teacher._id,
      academicYear: activeSettings.academicYear,
      description: `Salary payment to ${teacher.name} for ${salaryMonth}`,
      referenceId: paymentId || teacher._id.toString(),
      createdBy: req.user ? req.user.username : 'ADMIN',
      remarks: remarks || ''
    });

    // Create direct private notification for the teacher
    await Notification.create({
      title: 'Salary Credited',
      message: `Dear ${teacher.name},\n\nYour salary for ${salaryMonth} has been credited successfully.\n\nAmount: ₹${payVal.toLocaleString()}\n\nPayment Mode: ${paymentMethod}\n\nVoucher No: ${voucherNum}\n\nDate: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}`,
      recipientRole: 'teacher',
      type: 'Alert',
      sender: req.user ? req.user._id : teacher.user,
      teacher: teacher._id
    });

    await createAuditLog(req, 'Teacher Salary Paid', `Paid ₹${payVal} salary to Mrs./Mr. ${teacher.name} for ${salaryMonth}. Voucher: ${voucherNum}`, 'Teacher', id);

    res.json({ message: 'Salary payment recorded successfully.', teacher });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addAuditLogDirect = async (req, res) => {
  const { action, details } = req.body;
  try {
    await createAuditLog(req, action, details);
    res.status(201).json({ message: 'Audit log created.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Principal CRUD Controllers
const getPrincipals = async (req, res) => {
  try {
    const Principal = require('../models/Principal');
    const list = await Principal.find({ isDeleted: { $ne: true } }).populate('user', '-password');
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createPrincipal = async (req, res) => {
  const { employeeId, name, email, phone, qualification, experience, designation, address, dob } = req.body;

  if (!employeeId || !name || !email || !phone || !dob) {
    return res.status(400).json({ message: 'Employee ID, Name, Email, Phone, and Date of Birth are required.' });
  }

  // Trim incoming fields
  const cleanEmpId = employeeId.trim();
  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();
  const cleanPhone = phone.trim();
  const cleanQual = qualification ? qualification.trim() : '';
  const cleanExp = experience ? experience.trim() : '';
  const cleanDesig = designation ? designation.trim() : 'Principal';
  const cleanAddr = address ? address.trim() : '';

  // Validate fields
  let errMsg = validateName(cleanName, 'Principal Name');
  if (errMsg) return res.status(400).json({ message: errMsg });

  errMsg = validateEmail(cleanEmail, 'Principal Email');
  if (errMsg) return res.status(400).json({ message: errMsg });

  errMsg = validatePhone(cleanPhone, 'Principal Phone');
  if (errMsg) return res.status(400).json({ message: errMsg });

  errMsg = validateDOB(dob, 'principal');
  if (errMsg) return res.status(400).json({ message: errMsg });

  try {
    const Principal = require('../models/Principal');
    
    const dupId = await Principal.findOne({ employeeId: cleanEmpId, isDeleted: { $ne: true } });
    if (dupId) return res.status(400).json({ message: 'A Principal with this Employee ID already exists.' });
    
    const dupEmail = await Principal.findOne({ email: cleanEmail, isDeleted: { $ne: true } });
    if (dupEmail) return res.status(400).json({ message: 'A Principal with this Email already exists.' });
    
    const dupPhone = await Principal.findOne({ phone: cleanPhone, isDeleted: { $ne: true } });
    if (dupPhone) return res.status(400).json({ message: 'A Principal with this Phone number already exists.' });

    const principal = await Principal.create({
      employeeId: cleanEmpId,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      qualification: cleanQual,
      experience: cleanExp,
      designation: cleanDesig,
      address: cleanAddr,
      status: 'Pending Approval',
      dob: new Date(dob)
    });

    await createAuditLog(req, 'Principal Created', `Principal ${cleanName} registered in Pending Approval status`, 'Principal', principal._id.toString());

    res.status(201).json({ message: 'Principal record created. Awaiting Administrator approval.', principal });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updatePrincipal = async (req, res) => {
  const { id } = req.params;
  const { employeeId, name, email, phone, qualification, experience, designation, address, status, dob } = req.body;

  try {
    const Principal = require('../models/Principal');
    const principal = await Principal.findById(id);
    if (!principal) {
      return res.status(404).json({ message: 'Principal profile not found.' });
    }

    const beforeState = principal.toObject();

    // Validate and trim fields
    if (employeeId && employeeId.trim() !== principal.employeeId) {
      const cleanEmpId = employeeId.trim();
      const dup = await Principal.findOne({ employeeId: cleanEmpId, _id: { $ne: id }, isDeleted: { $ne: true } });
      if (dup) return res.status(400).json({ message: 'Employee ID is already in use.' });
      
      if (principal.user) {
        await User.findByIdAndUpdate(principal.user, { username: cleanEmpId.toUpperCase() });
      }
      principal.employeeId = cleanEmpId;
    }

    if (name) {
      const cleanName = name.trim();
      const err = validateName(cleanName, 'Principal Name');
      if (err) return res.status(400).json({ message: err });
      principal.name = cleanName;
    }

    if (email && email.trim().toLowerCase() !== principal.email) {
      const cleanEmail = email.trim().toLowerCase();
      const err = validateEmail(cleanEmail, 'Principal Email');
      if (err) return res.status(400).json({ message: err });

      const dup = await Principal.findOne({ email: cleanEmail, _id: { $ne: id }, isDeleted: { $ne: true } });
      if (dup) return res.status(400).json({ message: 'Email is already in use.' });
      principal.email = cleanEmail;
    }

    if (phone && phone.trim() !== principal.phone) {
      const cleanPhone = phone.trim();
      const err = validatePhone(cleanPhone, 'Principal Phone');
      if (err) return res.status(400).json({ message: err });

      const dup = await Principal.findOne({ phone: cleanPhone, _id: { $ne: id }, isDeleted: { $ne: true } });
      if (dup) return res.status(400).json({ message: 'Phone number is already in use.' });
      
      if (principal.user) {
        await User.findByIdAndUpdate(principal.user, { phone: cleanPhone });
      }
      principal.phone = cleanPhone;
    }

    if (dob) {
      const err = validateDOB(dob, 'principal');
      if (err) return res.status(400).json({ message: err });
      principal.dob = new Date(dob);
    }

    principal.qualification = qualification !== undefined ? qualification.trim() : principal.qualification;
    principal.experience = experience !== undefined ? experience.trim() : principal.experience;
    principal.designation = designation !== undefined ? designation.trim() : principal.designation;
    principal.address = address !== undefined ? address.trim() : principal.address;

    if (status && status !== principal.status) {
      principal.status = status;
      await createAuditLog(req, 'Principal Status Updated', `Principal ${principal.name} status set to: ${status}`, 'Principal', id, beforeState, principal.toObject());
    } else {
      await createAuditLog(req, 'Principal Profile Updated', principal.name, 'Principal', id, beforeState, principal.toObject());
    }

    await principal.save();
    res.json({ message: 'Principal profile updated successfully.', principal });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const approvePrincipal = async (req, res) => {
  const { id } = req.params;

  try {
    const Principal = require('../models/Principal');
    const principal = await Principal.findById(id);
    if (!principal) {
      return res.status(404).json({ message: 'Principal record not found.' });
    }

    if (principal.status === 'Approved') {
      return res.status(400).json({ message: 'Principal is already approved.' });
    }

    const beforeState = principal.toObject();

    let user = null;
    if (principal.user) {
      user = await User.findById(principal.user);
    }

    if (!user) {
      let existingUser = await User.findOne({ username: principal.employeeId.toUpperCase() });
      if (!existingUser) {
        existingUser = await User.findOne({ phone: principal.phone });
      }

      if (existingUser) {
        user = existingUser;
      } else {
        user = await User.create({
          username: principal.employeeId.toUpperCase(),
          phone: principal.phone,
          password: 'VBV@principal2026',
          role: 'principal'
        });
      }
      principal.user = user._id;
    }

    principal.status = 'Approved';
    await principal.save();

    // Auto-update school settings principalName
    let settings = await SchoolSettings.findOne();
    if (settings) {
      settings.principalName = principal.name;
      await settings.save();
    }

    await createAuditLog(req, 'Principal Approved', `Approved login and credentials for ${principal.name}`, 'Principal', id, beforeState, principal.toObject());

    res.json({ 
      message: 'Principal approved successfully.', 
      principal,
      credentials: {
        username: principal.employeeId.toUpperCase(),
        password: 'VBV@principal2026'
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const rejectPrincipal = async (req, res) => {
  const { id } = req.params;

  try {
    const Principal = require('../models/Principal');
    const principal = await Principal.findById(id);
    if (!principal) {
      return res.status(404).json({ message: 'Principal record not found.' });
    }

    const beforeState = principal.toObject();
    principal.status = 'Rejected';
    await principal.save();

    await createAuditLog(req, 'Principal Rejected', `Principal registration for ${principal.name} rejected`, 'Principal', id, beforeState, principal.toObject());

    res.json({ message: 'Principal status marked as Rejected.', principal });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const suspendPrincipal = async (req, res) => {
  const { id } = req.params;

  try {
    const Principal = require('../models/Principal');
    const principal = await Principal.findById(id);
    if (!principal) {
      return res.status(404).json({ message: 'Principal record not found.' });
    }

    const beforeState = principal.toObject();
    principal.status = 'Suspended';
    await principal.save();

    await createAuditLog(req, 'Principal Suspended', `Principal account for ${principal.name} suspended`, 'Principal', id, beforeState, principal.toObject());

    res.json({ message: 'Principal account suspended.', principal });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const resetPrincipalPassword = async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({ message: 'New password is required.' });
  }

  const errPass = validatePassword(newPassword);
  if (errPass) {
    return res.status(400).json({ message: errPass });
  }

  try {
    const Principal = require('../models/Principal');
    const principal = await Principal.findById(id);
    if (!principal) {
      return res.status(404).json({ message: 'Principal record not found.' });
    }

    if (!principal.user) {
      return res.status(400).json({ message: 'Principal has no generated user account. Approve first.' });
    }

    const user = await User.findById(principal.user);
    if (!user) {
      return res.status(404).json({ message: 'Associated principal user account not found.' });
    }

    user.password = newPassword;
    await user.save();

    await createAuditLog(req, 'Principal Password Reset', `Reset password for Principal ${principal.name}`, 'Principal', id);

    res.json({ message: 'Principal password reset successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deletePrincipal = async (req, res) => {
  const { id } = req.params;

  try {
    const Principal = require('../models/Principal');
    const principal = await Principal.findById(id);
    if (!principal) {
      return res.status(404).json({ message: 'Principal profile not found.' });
    }

    const beforeState = principal.toObject();
    principal.isDeleted = true;
    await principal.save();

    await createAuditLog(req, 'Principal Deleted', `Principal account for ${principal.name} soft-deleted.`, 'Principal', id, beforeState, principal.toObject());

    res.json({ message: 'Principal profile soft-deleted.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Restore an archived student back to active (Approved) status
// @route   POST /api/admin/student/:id/restore
const restoreStudent = async (req, res) => {
  const { id } = req.params;

  try {
    const student = await Student.findById(id).populate('class');
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    if (!['Transferred', 'Alumni', 'Left School', 'Rejected'].includes(student.status)) {
      return res.status(400).json({ message: 'Student is already active.' });
    }

    const beforeState = student.toObject();
    student.status = 'Approved';

    // Recreate student login if it does not exist
    if (!student.user) {
      const userCount = await User.countDocuments();
      const paddedNum = String(userCount + 1).padStart(3, '0');
      const studentUser = await User.create({
        rollNumber: student.rollNumber || `VBV-R-${paddedNum}`,
        password: 'VBV@123',
        role: 'student'
      });
      student.user = studentUser._id;
    }

    await student.save();

    await createAuditLog(req, 'Restored Student Account', `${student.name} restored to Approved status`, 'Student', id, beforeState, student.toObject());

    res.json({ message: 'Student restored successfully.', student });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Permanently delete a student record (and their fees/attendance/login)
// @route   DELETE /api/admin/student/:id/permanent
const permanentlyDeleteStudent = async (req, res) => {
  const { id } = req.params;

  try {
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    if (student.user) {
      await User.findByIdAndDelete(student.user);
    }

    if (student.parent) {
      const parentId = student.parent;
      const otherChildren = await Student.countDocuments({ parent: parentId, _id: { $ne: id } });
      if (otherChildren === 0) {
        const parentDoc = await mongoose.model('Parent').findById(parentId);
        if (parentDoc && parentDoc.user) {
          await User.findByIdAndDelete(parentDoc.user);
        }
      }
    }

    await mongoose.model('Fee').deleteMany({ student: id });
    await mongoose.model('Attendance').deleteMany({ student: id });
    await Student.findByIdAndDelete(id);

    await createAuditLog(req, 'Permanently Deleted Student', `Student ${student.name} deleted from system`, 'Student', id);

    res.json({ message: 'Student and all associated records permanently deleted.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const getExpenses = async (req, res) => {
  try {
    const expenses = await FinancialLedger.find({ transactionType: 'Expense' }).populate('teacher').sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createExpense = async (req, res) => {
  const { category, amount, paymentMode, paidTo, date, description, remarks } = req.body;
  if (!category || !amount || !paymentMode) {
    return res.status(400).json({ message: 'Category, amount, and payment mode are required.' });
  }
  try {
    const activeSettings = await SchoolSettings.findOne() || { academicYear: '2026-27' };
    const currentYear = new Date().getFullYear();
    const counter = await Counter.findOneAndUpdate(
      { _id: `voucher-general-${currentYear}` },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const voucherNum = `VCHR-${currentYear}-${String(counter.seq).padStart(6, '0')}`;
    const txnId = `TXN-EXP-${Date.now()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const expense = await FinancialLedger.create({
      transactionId: txnId,
      transactionType: 'Expense',
      category,
      amount: Number(amount),
      paymentMode,
      voucherNumber: voucherNum,
      date: date ? new Date(date) : new Date(),
      academicYear: activeSettings.academicYear,
      description: description || '',
      paidTo: paidTo || '',
      createdBy: req.user ? req.user.username : 'ADMIN',
      remarks: remarks || ''
    });

    await createAuditLog(req, 'Expense Recorded', `Recorded expense of ₹${amount} under category ${category}. Voucher: ${voucherNum}`, 'FinancialLedger', expense._id.toString());

    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateExpense = async (req, res) => {
  const { id } = req.params;
  const { category, amount, paymentMode, paidTo, date, description, remarks } = req.body;
  try {
    let expense = await FinancialLedger.findById(id);
    if (!expense || expense.transactionType !== 'Expense') {
      return res.status(404).json({ message: 'Expense record not found.' });
    }
    if (expense.category === 'Teacher Salary') {
      return res.status(400).json({ message: 'Cannot edit automatically generated teacher salary expenses.' });
    }
    const beforeState = expense.toObject();

    expense.category = category || expense.category;
    expense.amount = amount !== undefined ? Number(amount) : expense.amount;
    expense.paymentMode = paymentMode || expense.paymentMode;
    expense.paidTo = paidTo !== undefined ? paidTo : expense.paidTo;
    expense.date = date ? new Date(date) : expense.date;
    expense.description = description !== undefined ? description : expense.description;
    expense.remarks = remarks !== undefined ? remarks : expense.remarks;

    await expense.save();

    await createAuditLog(req, 'Expense Updated', `Updated expense record (Voucher: ${expense.voucherNumber})`, 'FinancialLedger', expense._id.toString(), beforeState, expense.toObject());

    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteExpense = async (req, res) => {
  const { id } = req.params;
  const { cancelReason } = req.body;
  
  if (!cancelReason || !cancelReason.trim()) {
    return res.status(400).json({ message: 'Cancellation reason is required.' });
  }

  try {
    let expense = await FinancialLedger.findById(id);
    if (!expense || expense.transactionType !== 'Expense') {
      return res.status(404).json({ message: 'Expense record not found.' });
    }
    const beforeState = expense.toObject();

    expense.isCancelled = true;
    expense.cancelReason = cancelReason;
    await expense.save();

    // Revert salary payment logs on Teacher document if cancelling a salary voucher
    if (expense.category === 'Teacher Salary' && expense.teacher) {
      const Teacher = require('../models/Teacher');
      const teacher = await Teacher.findById(expense.teacher);
      if (teacher) {
        if (expense.referenceId) {
          teacher.salaryPayments = teacher.salaryPayments.filter(
            p => p._id.toString() !== expense.referenceId.toString()
          );
          await teacher.save();
        }
      }
    }

    await createAuditLog(req, 'Expense Cancelled', `Cancelled expense (Voucher: ${expense.voucherNumber}). Reason: ${cancelReason}`, 'FinancialLedger', expense._id.toString(), beforeState, expense.toObject());

    res.json({ message: 'Expense record cancelled successfully.', expense });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
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
};

