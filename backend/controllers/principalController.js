const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Parent = require('../models/Parent');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Fee = require('../models/Fee');
const Result = require('../models/Result');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Timetable = require('../models/Timetable');
const Notification = require('../models/Notification');
const Calendar = require('../models/Calendar');
const Snapshot = require('../models/Snapshot');
const SubstituteAssignment = require('../models/SubstituteAssignment');
const TeacherAttendance = require('../models/TeacherAttendance');
const DailyReport = require('../models/DailyReport');
const Homework = require('../models/Homework');
const AuditLog = require('../models/AuditLog');
const mongoose = require('mongoose');
const ExamSchedule = require('../models/ExamSchedule');
const { generateExamTimetablePDF } = require('../utils/pdfGenerator');
const { ClassSettings } = Snapshot;
const path = require('path');
const fs = require('fs');

// Principal Main Dashboard Analytics
const getPrincipalDashboard = async (req, res) => {
  try {
    // 1. Core aggregates
    const totalStudents = await Student.countDocuments({ status: 'Approved' });
    const totalTeachers = await Teacher.countDocuments();
    const totalClasses = await Class.countDocuments();

    // Today's attendance percentage
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const totalAttendanceToday = await Attendance.countDocuments({
      date: { $gte: startOfDay, $lte: endOfDay }
    });
    const presentToday = await Attendance.countDocuments({
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['Present', 'Late'] }
    });
    const todayAttendancePct = totalAttendanceToday > 0 ? (presentToday / totalAttendanceToday) * 100 : 0;

    // Fee structure totals
    const feeRecords = await Fee.find();
    let totalFeeCollected = 0;
    let totalFeePending = 0;
    feeRecords.forEach(f => {
      totalFeeCollected += f.paidAmount;
      totalFeePending += f.balanceAmount;
    });

    // Upcoming Events (next 5)
    const upcomingEvents = await Calendar.find({ startDate: { $gte: new Date() } })
      .sort({ startDate: 1 })
      .limit(5);

    // 2. Teacher attendance stats (from MongoDB)
    const teachersList = await Teacher.find();
    let present = 0;
    let late = 0;
    let leave = 0;
    let absent = 0;
    const teacherStatuses = {};

    for (const teacher of teachersList) {
      // Check leave first
      const hasApprovedLeave = teacher.leaves && teacher.leaves.some(l => 
        l.status === 'Approved' && 
        startOfDay >= new Date(l.fromDate) && 
        startOfDay <= new Date(l.toDate)
      );

      if (hasApprovedLeave) {
        teacherStatuses[teacher.name] = 'Leave';
        leave++;
      } else {
        const attRecord = await TeacherAttendance.findOne({
          teacher: teacher._id,
          date: { $gte: startOfDay, $lte: endOfDay }
        });

        if (attRecord) {
          if (attRecord.status === 'Present') {
            teacherStatuses[teacher.name] = 'Present';
            present++;
          } else if (attRecord.status === 'Late') {
            teacherStatuses[teacher.name] = 'Late';
            late++;
          } else if (attRecord.status === 'Leave') {
            teacherStatuses[teacher.name] = 'Leave';
            leave++;
          } else {
            teacherStatuses[teacher.name] = 'Absent';
            absent++;
          }
        } else {
          teacherStatuses[teacher.name] = 'Absent';
          absent++;
        }
      }
    }

    // Teacher Attendance % calculation
    const teacherAttendancePct = totalTeachers > 0 ? Math.round(((present + late) / totalTeachers) * 100) : 0;

    // 3. Dynamic counts for Principal Review
    const pendingReports = await DailyReport.countDocuments({ status: { $in: ['Submitted', 'Reviewed'] } });
    
    // Sum all pending homework submissions
    const homeworkRecords = await Homework.find();
    let pendingHomework = 0;
    homeworkRecords.forEach(hw => {
      if (hw.submissions) {
        pendingHomework += hw.submissions.filter(s => s.status === 'Pending').length;
      }
    });

    const pendingResults = await Result.countDocuments({ published: false });

    // 4. Analytical Data (for charts rendering in app)
    const classes = await Class.find().populate('classTeacher', 'name');
    const studentStrength = [];
    const classPerformance = [];
    const attendanceByClass = [];

    for (const cls of classes) {
      const count = await Student.countDocuments({ class: cls._id, status: 'Approved' });
      studentStrength.push({ className: cls.name, count });

      // Class average marks from published results
      const classResults = await Result.find({ class: cls._id, published: true });
      const avgPct = classResults.length > 0
        ? classResults.reduce((acc, curr) => acc + curr.percentage, 0) / classResults.length
        : 0;
      classPerformance.push({ className: cls.name, avgPercentage: parseFloat(avgPct.toFixed(1)) });

      // Class attendance percentage (last 30 days)
      const classTotal = await Attendance.countDocuments({ class: cls._id });
      const classPresent = await Attendance.countDocuments({ class: cls._id, status: { $in: ['Present', 'Late'] } });
      const classAttPct = classTotal > 0 ? (classPresent / classTotal) * 100 : 0;
      attendanceByClass.push({ className: cls.name, attendancePct: parseFloat(classAttPct.toFixed(1)) });
    }

    // Exam counts for principal dashboard
    const upcomingExamsCount = await ExamSchedule.countDocuments({ status: 'Published' });
    const publishedTimetablesCount = await ExamSchedule.countDocuments({ status: 'Published' });
    
    // Count invigilator slots matching principal duties
    const allExams = await ExamSchedule.find({ status: 'Published' });
    let examDutyAssignedCount = 0;
    allExams.forEach(ex => {
      if (ex.subjects) {
        ex.subjects.forEach(s => {
          if (s.invigilator) examDutyAssignedCount++;
        });
      }
    });
    
    const completedExamsCount = await ExamSchedule.countDocuments({ status: 'Completed' });

    res.json({
      classes,
      summary: {
        totalStudents,
        totalTeachers,
        totalClasses,
        todayAttendancePct,
        teacherAttendancePct,
        totalFeeCollected,
        totalFeePending,
        upcomingEventsCount: upcomingEvents.length,
        pendingReports,
        pendingHomework,
        pendingResults,
        upcomingExamsCount,
        publishedTimetablesCount,
        examDutyAssignedCount,
        completedExamsCount
      },
      charts: {
        studentStrength,
        classPerformance,
        attendanceByClass,
        feesBreakdown: {
          collected: totalFeeCollected,
          pending: totalFeePending
        }
      },
      upcomingEvents,
      teacherStats: {
        present,
        late,
        leave,
        absent,
        teacherStatuses
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CRUD Operations: Manage Students (Create)
const addStudent = async (req, res) => {
  const { name, rollNumber, admissionNumber, classId, dob, bloodGroup, emergencyContact, parentPhone, fatherName, motherName, address } = req.body;

  if (!name || !rollNumber || !admissionNumber || !classId || !dob || !bloodGroup || !emergencyContact || !parentPhone || !fatherName || !motherName) {
    return res.status(400).json({ message: 'All student details and parent details are required' });
  }

  let createdParentUser = null;
  let createdParent = null;
  let createdStudentUser = null;
  let createdStudent = null;
  let parentUpdated = false;
  let createdFee = null;

  try {
    // 1. Check if user already exists
    let studentUser = await User.findOne({ rollNumber });
    if (studentUser) {
      return res.status(400).json({ message: 'Student with this roll number already exists' });
    }

    // 2. Find or Create parent user
    let parentUser = await User.findOne({ phone: parentPhone, role: 'parent' });
    let parent;

    if (!parentUser) {
      parentUser = await User.create({
        phone: parentPhone,
        password: 'VBV@321', // Default password
        role: 'parent'
      });
      createdParentUser = parentUser;

      parent = await Parent.create({
        user: parentUser._id,
        fatherName,
        motherName,
        phone: parentPhone,
        address: address || 'Palsi, Kubeer, Nirmal',
        children: []
      });
      createdParent = parent;
    } else {
      parent = await Parent.findOne({ user: parentUser._id });
    }

    // 3. Create Student User
    studentUser = await User.create({
      rollNumber,
      password: 'VBV@123', // Default password
      role: 'student'
    });
    createdStudentUser = studentUser;

    const student = await Student.create({
      user: studentUser._id,
      name,
      rollNumber,
      admissionNumber,
      class: classId,
      parent: parent._id,
      dob: new Date(dob),
      bloodGroup,
      emergencyContact,
      photo: ''
    });
    createdStudent = student;

    // 4. Connect student to parent children array
    parent.children.push(student._id);
    await parent.save();
    parentUpdated = true;

    // 5. Initialize clean Fee schedule for new student
    createdFee = await Fee.create({
      student: student._id,
      totalAmount: 18000, // Standard fee
      paidAmount: 0,
      balanceAmount: 18000,
      dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // due in 60 days
    });

    res.status(201).json({ message: 'Student and Parent enrolled successfully', student });
  } catch (error) {
    try {
      if (createdFee) {
        await Fee.deleteOne({ _id: createdFee._id });
      }
      if (parentUpdated && createdStudent && parent) {
        await Parent.updateOne({ _id: parent._id }, { $pull: { children: createdStudent._id } });
      }
      if (createdStudent) {
        await Student.deleteOne({ _id: createdStudent._id });
      }
      if (createdStudentUser) {
        await User.deleteOne({ _id: createdStudentUser._id });
      }
      if (createdParent) {
        await Parent.deleteOne({ _id: createdParent._id });
      }
      if (createdParentUser) {
        await User.deleteOne({ _id: createdParentUser._id });
      }
    } catch (cleanupError) {
      console.error('Error during principal addStudent rollback:', cleanupError);
    }
    res.status(500).json({ message: error.message });
  }
};

// CRUD Operations: Manage Teachers (Create)
const addTeacher = async (req, res) => {
  const { name, teacherId, email, phone, qualification, subjectIds, assignedClassId } = req.body;

  if (!name || !teacherId || !email || !phone || !qualification) {
    return res.status(400).json({ message: 'Teacher basic information is required' });
  }

  let createdTeacherUser = null;
  let createdTeacher = null;
  let classUpdated = false;

  try {
    let teacherUser = await User.findOne({ teacherId });
    if (teacherUser) {
      return res.status(400).json({ message: 'Teacher with this Teacher ID already exists' });
    }

    // Create User login credentials
    teacherUser = await User.create({
      teacherId,
      password: 'VBV$3210', // Default password
      role: 'teacher'
    });
    createdTeacherUser = teacherUser;

    const teacher = await Teacher.create({
      user: teacherUser._id,
      name,
      teacherId,
      email,
      phone,
      qualification,
      subjects: subjectIds || [],
      assignedClass: assignedClassId || null
    });
    createdTeacher = teacher;

    // Update Class with assigned Class Teacher
    if (assignedClassId) {
      await Class.findByIdAndUpdate(assignedClassId, { classTeacher: teacherUser._id });
      classUpdated = true;
    }

    res.status(201).json({ message: 'Teacher registered successfully', teacher });
  } catch (error) {
    try {
      if (classUpdated && assignedClassId) {
        await Class.findByIdAndUpdate(assignedClassId, { $unset: { classTeacher: "" } });
      }
      if (createdTeacher) {
        await Teacher.deleteOne({ _id: createdTeacher._id });
      }
      if (createdTeacherUser) {
        await User.deleteOne({ _id: createdTeacherUser._id });
      }
    } catch (cleanupError) {
      console.error('Error during principal addTeacher rollback:', cleanupError);
    }
    res.status(500).json({ message: error.message });
  }
};

// Publish exam results for classes
const publishResults = async (req, res) => {
  const { classId, examType } = req.body;
  if (!classId || !examType) {
    return res.status(400).json({ message: 'Please specify classId and examType.' });
  }

  try {
    const updated = await Result.updateMany(
      { class: classId, examType },
      { published: true }
    );

    // Notify parents and students
    const classObj = await Class.findById(classId);
    await Notification.create({
      title: 'Exam Results Published',
      message: `${examType} examination results have been published for Class ${classObj.name}. Report cards are available to view and download.`,
      recipientRole: 'all',
      class: classId,
      type: 'Exam',
      sender: req.user._id
    });

    res.json({ message: `Successfully published ${updated.modifiedCount} student result(s).` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Broadcast Notifications
const broadcastNotification = async (req, res) => {
  const { title, message, recipientRoles, classId, type } = req.body;

  if (!title || !message) {
    return res.status(400).json({ message: 'Title and Message are required' });
  }

  try {
    const createdNotifications = [];
    const roles = Array.isArray(recipientRoles) ? recipientRoles : [req.body.recipientRole || 'all'];

    if (roles.includes('all') || roles.includes('all-school')) {
      const notification = await Notification.create({
        title,
        message,
        recipientRole: 'all',
        class: null,
        type: type || 'Announcement',
        sender: req.user._id
      });
      createdNotifications.push(notification);
    } else {
      for (const role of roles) {
        if (role === 'class') {
          if (classId) {
            // Target students of specific class
            const sNotif = await Notification.create({
              title,
              message,
              recipientRole: 'student',
              class: classId,
              type: type || 'Announcement',
              sender: req.user._id
            });
            createdNotifications.push(sNotif);

            // Target parents of specific class
            const pNotif = await Notification.create({
              title,
              message,
              recipientRole: 'parent',
              class: classId,
              type: type || 'Announcement',
              sender: req.user._id
            });
            createdNotifications.push(pNotif);
          }
        } else if (['student', 'parent', 'teacher'].includes(role)) {
          const notification = await Notification.create({
            title,
            message,
            recipientRole: role,
            class: null,
            type: type || 'Announcement',
            sender: req.user._id
          });
          createdNotifications.push(notification);
        }
      }
    }

    res.status(201).json(createdNotifications[0] || { message: 'Notifications broadcast successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Monitor Snapshots across all classrooms
const monitorSnapshots = async (req, res) => {
  try {
    const classes = await Class.find().populate('classTeacher', 'username');
    const statusLogs = [];

    for (const cls of classes) {
      const settings = await ClassSettings.findOne({ class: cls._id });
      const enabled = settings ? settings.snapshotEnabled : true;

      const latestSnapshot = await Snapshot.findOne({ class: cls._id }).sort({ timestamp: -1 });

      statusLogs.push({
        classId: cls._id,
        className: cls.name,
        section: cls.section,
        teacher: cls.classTeacher ? cls.classTeacher.username : 'Not Assigned',
        cameraActive: enabled,
        lastCapturedAt: latestSnapshot ? latestSnapshot.timestamp : null,
        latestThumbnail: latestSnapshot ? latestSnapshot.imageUrl : ''
      });
    }

    res.json(statusLogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Backup Database
const backupDatabase = async (req, res) => {
  try {
    const backupDir = path.join(__dirname, '..', 'public', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const backupFile = `backup-${Date.now()}.json`;
    const outputPath = path.join(backupDir, backupFile);

    // Compile schemas into a singular dump
    const students = await Student.find();
    const teachers = await Teacher.find();
    const users = await User.find().select('-password');
    const classes = await Class.find();
    const timetables = await Timetable.find();

    const dataDump = {
      backupTimestamp: new Date(),
      usersCount: users.length,
      studentsCount: students.length,
      teachersCount: teachers.length,
      classesCount: classes.length,
      timetablesCount: timetables.length,
      data: {
        users,
        students,
        teachers,
        classes,
        timetables
      }
    };

    fs.writeFileSync(outputPath, JSON.stringify(dataDump, null, 2));

    res.json({
      message: 'Database backup generated successfully',
      fileUrl: `/backups/${backupFile}`,
      details: {
        users: users.length,
        students: students.length,
        teachers: teachers.length
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Leaves management
const getLeaves = async (req, res) => {
  try {
    const teachers = await Teacher.find()
      .select('name assignedClass leaves')
      .populate('assignedClass');
      
    const allLeaves = [];
    teachers.forEach(t => {
      if (t.leaves) {
        t.leaves.forEach(l => {
          allLeaves.push({
            id: l._id,
            teacherId: t._id,
            teacherName: t.name,
            className: t.assignedClass ? `${t.assignedClass.name} ${t.assignedClass.section}` : 'Not Assigned',
            leaveType: 'Casual Leave',
            reason: l.reason,
            fromDate: l.fromDate ? l.fromDate.toISOString().split('T')[0] : '',
            toDate: l.toDate ? l.toDate.toISOString().split('T')[0] : '',
            status: l.status
          });
        });
      }
    });
    res.json(allLeaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateLeaveStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!status) {
    return res.status(400).json({ message: 'Provide status.' });
  }

  try {
    const teacher = await Teacher.findOne({ 'leaves._id': id });
    if (!teacher) {
      return res.status(404).json({ message: 'Leave request not found.' });
    }

    const leave = teacher.leaves.id(id);
    leave.status = status;
    await teacher.save();

    // If approved, log in TeacherAttendance
    if (status === 'Approved') {
      const start = new Date(leave.fromDate);
      const end = new Date(leave.toDate);
      const loop = new Date(start);
      while (loop <= end) {
        const dateCopy = new Date(loop);
        dateCopy.setHours(0, 0, 0, 0);
        for (const session of ['Morning', 'Afternoon']) {
          await TeacherAttendance.findOneAndUpdate(
            { teacher: teacher._id, date: dateCopy, session },
            { time: '09:00:00', status: 'Leave', date: dateCopy },
            { upsert: true }
          );
        }
        loop.setDate(loop.getDate() + 1);
      }
    }

    res.json({ message: 'Leave status updated successfully.', leaves: teacher.leaves });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Substitute Cover management
const createSubstituteCover = async (req, res) => {
  const { originalTeacherName, substituteTeacherName, className, startDate, endDate } = req.body;
  if (!originalTeacherName || !substituteTeacherName || !className || !startDate || !endDate) {
    return res.status(400).json({ message: 'All coverage details are required.' });
  }

  try {
    const origTeacher = await Teacher.findOne({ name: originalTeacherName });
    const subTeacher = await Teacher.findOne({ name: substituteTeacherName });
    const cls = await Class.findOne({ name: className.split(' ')[0] });

    if (!origTeacher || !subTeacher) {
      return res.status(404).json({ message: 'Original or Substitute teacher not found.' });
    }

    const targetClass = cls ? cls._id : (origTeacher.assignedClass || subTeacher.assignedClass);
    if (!targetClass) {
      return res.status(400).json({ message: 'Target class could not be resolved.' });
    }

    const assignment = await SubstituteAssignment.create({
      originalTeacher: origTeacher._id,
      substituteTeacher: subTeacher._id,
      class: targetClass,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: 'Active'
    });

    res.status(201).json({ message: 'Substitute coverage scheduled successfully.', assignment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSubstitutes = async (req, res) => {
  try {
    const list = await SubstituteAssignment.find()
      .populate('originalTeacher', 'name')
      .populate('substituteTeacher', 'name')
      .populate('class', 'name section');
    
    const formatted = list.map(item => ({
      id: item._id,
      originalTeacher: item.originalTeacher?.name || 'N/A',
      substituteTeacher: item.substituteTeacher?.name || 'N/A',
      assignedClass: item.class ? `${item.class.name} ${item.class.section}` : 'N/A',
      startDate: item.startDate.toISOString().split('T')[0],
      endDate: item.endDate.toISOString().split('T')[0],
      status: item.status
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Time parsing helper
const parseTimeToMinutes = (timeStr) => {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3];

  if (ampm) {
    if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
    if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
  }
  return hours * 60 + minutes;
};

const timesOverlap = (startA, endA, startB, endB) => {
  const aStart = parseTimeToMinutes(startA);
  const aEnd = parseTimeToMinutes(endA);
  const bStart = parseTimeToMinutes(startB);
  const bEnd = parseTimeToMinutes(endB);
  return (aStart < bEnd && bStart < aEnd);
};

// Save Timetable
const saveTimetable = async (req, res) => {
  const { 
    classId, 
    teacherId, 
    subjectId, 
    room, 
    startTime, 
    endTime, 
    days, 
    academicYear, 
    periodId 
  } = req.body;

  if (!classId || !teacherId || !subjectId || !startTime || !endTime || !days || !Array.isArray(days)) {
    return res.status(400).json({ message: 'Missing required parameters.' });
  }

  // 1. Conflict Validation
  try {
    for (const dayName of days) {
      const allDayTimetables = await Timetable.find({ day: dayName });
      for (const tt of allDayTimetables) {
        for (const p of tt.periods) {
          // Skip if it's the exact period we are updating
          if (periodId && p._id.toString() === periodId) continue;

          // Check overlap
          if (timesOverlap(startTime, endTime, p.startTime, p.endTime)) {
            // A. Teacher Conflict
            if (p.teacher && p.teacher.toString() === teacherId.toString()) {
              return res.status(400).json({ message: 'Teacher already has another period during this time.' });
            }

            // B. Class Conflict
            if (tt.class.toString() === classId.toString()) {
              return res.status(400).json({ message: 'Class already has another subject scheduled during this time.' });
            }

            // C. Room Conflict
            if (room && p.room && p.room.trim().toLowerCase() === room.trim().toLowerCase()) {
              return res.status(400).json({ message: `Room ${room} is already booked during this time.` });
            }
          }
        }
      }
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  // 2. Perform Save (using session transaction if supported)
  const session = await mongoose.startSession();
  let useTransaction = true;

  try {
    session.startTransaction();

    // A. Pull old period if editing
    if (periodId) {
      await Timetable.updateMany(
        { class: classId },
        { $pull: { periods: { _id: periodId } } },
        { session }
      );
    }

    // B. Push/Insert new periods for each selected day
    for (const dayName of days) {
      let timetable = await Timetable.findOne({ class: classId, day: dayName }).session(session);
      if (!timetable) {
        timetable = new Timetable({
          class: classId,
          day: dayName,
          academicYear: academicYear || '2026-27',
          periods: []
        });
      }

      if (academicYear) {
        timetable.academicYear = academicYear;
      }

      timetable.periods.push({
        subject: subjectId,
        teacher: teacherId,
        startTime,
        endTime,
        room: room || ''
      });

      // Sort periods by startTime
      timetable.periods.sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));

      await timetable.save({ session });
    }

    await AuditLog.create([{
      action: periodId ? 'EDIT_TIMETABLE' : 'CREATE_TIMETABLE',
      details: periodId ? 'Principal edited timetable' : 'Principal created timetable',
      user: req.user.username || req.user.phone || 'Principal',
      role: 'principal',
      entity: 'Timetable',
      entityId: classId
    }], { session });

    await session.commitTransaction();
    session.endSession();

    const { syncClassSubjects } = require('../utils/classSubjectSync');
    await syncClassSubjects(classId);

    return res.status(201).json({ message: 'Timetable slot(s) saved successfully.' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    // Fallback if replica set error
    if (error.message.includes('replica set') || error.message.includes('transaction')) {
      useTransaction = false;
    } else {
      return res.status(500).json({ message: error.message });
    }
  }

  // Transaction Fallback: Non-transactional fallback
  if (!useTransaction) {
    try {
      if (periodId) {
        await Timetable.updateMany(
          { class: classId },
          { $pull: { periods: { _id: periodId } } }
        );
      }

      for (const dayName of days) {
        let timetable = await Timetable.findOne({ class: classId, day: dayName });
        if (!timetable) {
          timetable = new Timetable({
            class: classId,
            day: dayName,
            academicYear: academicYear || '2026-27',
            periods: []
          });
        }

        if (academicYear) {
          timetable.academicYear = academicYear;
        }

        timetable.periods.push({
          subject: subjectId,
          teacher: teacherId,
          startTime,
          endTime,
          room: room || ''
        });

        // Sort periods
        timetable.periods.sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));

        await timetable.save();
      }

      await AuditLog.create({
        action: periodId ? 'EDIT_TIMETABLE' : 'CREATE_TIMETABLE',
        details: periodId ? 'Principal edited timetable' : 'Principal created timetable',
        user: req.user.username || req.user.phone || 'Principal',
        role: 'principal',
        entity: 'Timetable',
        entityId: classId
      });

      const { syncClassSubjects } = require('../utils/classSubjectSync');
      await syncClassSubjects(classId);

      return res.status(201).json({ message: 'Timetable slot(s) saved successfully.' });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
};

const getStudents = async (req, res) => {
  try {
    const students = await Student.find({ status: 'Approved' }).populate('class').populate('parent');
    const formatted = students.map(s => ({
      _id: s._id,
      name: s.name,
      rollNumber: s.rollNumber || 'PENDING',
      admissionNumber: s.admissionNumber || 'PENDING',
      dob: s.dob ? new Date(s.dob).toISOString().split('T')[0] : 'N/A',
      bloodGroup: s.bloodGroup || 'N/A',
      emergencyContact: s.emergencyContact || 'N/A',
      attendancePct: 92,
      homeworkPct: 85,
      marksPct: 78,
      behaviour: 'Good',
      performance: 'High',
      parentName: s.parent ? s.parent.motherName || s.parent.fatherName || 'N/A' : 'N/A',
      parentPhone: s.parent ? s.parent.phone : 'N/A',
      fatherName: s.parent ? s.parent.fatherName : 'N/A',
      motherName: s.parent ? s.parent.motherName : 'N/A'
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving students', error: error.message });
  }
};

const getTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find()
      .populate('assignedClass')
      .populate('assignedClasses')
      .populate('subjects');
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving teachers', error: error.message });
  }
};

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ type: 'Announcement' }).sort({ createdAt: -1 });
    res.json(notifications);
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

const createCalendarEvent = async (req, res) => {
  const { title, description, type, startDate, endDate } = req.body;
  if (!title || !startDate) {
    return res.status(400).json({ message: 'Title and Start Date are required' });
  }
  try {
    const event = await Calendar.create({
      title,
      description,
      type: type || 'Event',
      startDate: new Date(startDate),
      endDate: new Date(endDate || startDate)
    });
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteCalendarEvent = async (req, res) => {
  try {
    await Calendar.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTimetableByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const timetables = await Timetable.find({ class: classId })
      .populate('periods.subject')
      .populate('periods.teacher'); // teacher profile reference

    const formattedSchedule = {
      'Monday': [],
      'Tuesday': [],
      'Wednesday': [],
      'Thursday': [],
      'Friday': [],
      'Saturday': []
    };

    timetables.forEach(t => {
      if (formattedSchedule[t.day]) {
        formattedSchedule[t.day] = t.periods.map(p => {
          const subjectName = p.subject ? p.subject.name : 'Unknown';
          const teacherName = p.teacher ? p.teacher.name : 'Unknown';
          const teacherId = p.teacher ? p.teacher._id.toString() : '';
          const subjectId = p.subject ? p.subject._id.toString() : '';
          
          return {
            id: p._id.toString(),
            time: `${p.startTime} - ${p.endTime}`,
            startTime: p.startTime,
            endTime: p.endTime,
            subject: subjectName,
            subjectId: subjectId,
            teacher: teacherName,
            teacherId: teacherId,
            room: p.room || 'N/A'
          };
        });

        // Sort by start time
        formattedSchedule[t.day].sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));
      }
    });

    res.json(formattedSchedule);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Timetable Period
const deleteTimetablePeriod = async (req, res) => {
  const { classId, day, periodId } = req.params;
  try {
    await Timetable.updateOne(
      { class: classId, day: day },
      { $pull: { periods: { _id: periodId } } }
    );

    await AuditLog.create({
      action: 'DELETE_TIMETABLE',
      details: 'Principal deleted timetable period',
      user: req.user.username || req.user.phone || 'Principal',
      role: 'principal',
      entity: 'Timetable',
      entityId: classId
    });

    res.json({ message: 'Period deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Fetch Unique Rooms from Database
const getRooms = async (req, res) => {
  try {
    const timetables = await Timetable.find();
    const rooms = new Set();
    timetables.forEach(t => {
      t.periods.forEach(p => {
        if (p.room) {
          rooms.add(p.room);
        }
      });
    });
    res.json(Array.from(rooms).sort());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Fetch all subjects
const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ name: 1 });
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Copy Timetable Day or Academic Year
const copyTimetable = async (req, res) => {
  const { 
    sourceClassId, 
    targetClassId, 
    sourceDay, 
    targetDay, 
    sourceYear, 
    targetYear 
  } = req.body;

  if (!sourceClassId || !sourceDay || !targetDay) {
    return res.status(400).json({ message: 'Missing parameters for copying.' });
  }

  try {
    const query = { class: sourceClassId, day: sourceDay };
    if (sourceYear) {
      query.academicYear = sourceYear;
    }
    const sourceTimetable = await Timetable.findOne(query);

    if (!sourceTimetable || sourceTimetable.periods.length === 0) {
      return res.status(404).json({ message: `No periods found for source day ${sourceDay}.` });
    }

    const targetClass = targetClassId || sourceClassId;
    const targetYearVal = targetYear || sourceYear || '2026-27';

    let targetTimetable = await Timetable.findOne({ class: targetClass, day: targetDay });
    if (!targetTimetable) {
      targetTimetable = new Timetable({
        class: targetClass,
        day: targetDay,
        academicYear: targetYearVal,
        periods: []
      });
    }

    targetTimetable.academicYear = targetYearVal;
    
    // Copy periods
    targetTimetable.periods = sourceTimetable.periods.map(p => ({
      subject: p.subject,
      teacher: p.teacher,
      startTime: p.startTime,
      endTime: p.endTime,
      room: p.room || ''
    }));

    // Sort periods
    targetTimetable.periods.sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));

    await targetTimetable.save();

    await AuditLog.create({
      action: 'COPY_TIMETABLE',
      details: `Principal copied timetable from ${sourceDay} to ${targetDay}`,
      user: req.user.username || req.user.phone || 'Principal',
      role: 'principal',
      entity: 'Timetable',
      entityId: targetClass
    });

    res.json({ message: 'Timetable copied successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Duplicate Academic Year for all classes, weekdays, and periods
const duplicateAcademicYear = async (req, res) => {
  const { sourceYear, targetYear } = req.body;
  if (!sourceYear || !targetYear) {
    return res.status(400).json({ message: 'Source and Target years are required.' });
  }

  try {
    const sourceTimetables = await Timetable.find({ academicYear: sourceYear });
    if (sourceTimetables.length === 0) {
      return res.status(404).json({ message: `No timetable data found for Academic Year ${sourceYear}.` });
    }

    for (const st of sourceTimetables) {
      let tt = await Timetable.findOne({ class: st.class, day: st.day });
      if (!tt) {
        tt = new Timetable({
          class: st.class,
          day: st.day,
          periods: []
        });
      }
      tt.academicYear = targetYear;
      tt.periods = st.periods.map(p => ({
        subject: p.subject,
        teacher: p.teacher,
        startTime: p.startTime,
        endTime: p.endTime,
        room: p.room || ''
      }));

      // Sort
      tt.periods.sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));

      await tt.save();
    }

    await AuditLog.create({
      action: 'DUPLICATE_YEAR_TIMETABLE',
      details: `Principal duplicated timetable from ${sourceYear} to ${targetYear}`,
      user: req.user.username || req.user.phone || 'Principal',
      role: 'principal',
      entity: 'Timetable'
    });

    res.json({ message: `Timetable duplicated to Academic Year ${targetYear} successfully.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateClassTeacher = async (req, res) => {
  const { id } = req.params;
  const { classTeacherId } = req.body;

  try {
    const cls = await Class.findById(id);
    if (!cls) {
      return res.status(404).json({ message: 'Class not found.' });
    }

    const previousTeacherId = cls.classTeacher;

    cls.classTeacher = classTeacherId || null;
    await cls.save();

    if (previousTeacherId) {
      await Teacher.findByIdAndUpdate(previousTeacherId, { $unset: { assignedClass: "" } });
    }

    if (classTeacherId) {
      await Teacher.findByIdAndUpdate(classTeacherId, { assignedClass: id });
    }

    res.json({ message: 'Class Teacher assigned successfully.', class: cls });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateTeacherAssignment = async (req, res) => {
  const { id } = req.params;
  const { subject, classTeacherOf, assignedClasses } = req.body;

  try {
    const teacher = await Teacher.findById(id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found.' });
    }

    if (subject) {
      let subjectObj = await Subject.findOne({ name: new RegExp('^' + subject + '$', 'i') });
      if (!subjectObj) {
        const code = subject.toUpperCase().substring(0, 3) + Math.floor(100 + Math.random() * 900);
        subjectObj = await Subject.create({ name: subject, code });
      }
      
      if (!teacher.subjects.includes(subjectObj._id)) {
        teacher.subjects = [subjectObj._id];
      }
    }

    const oldClassId = teacher.assignedClass;
    
    if (classTeacherOf) {
      teacher.assignedClass = classTeacherOf;
      await Class.findByIdAndUpdate(classTeacherOf, { classTeacher: teacher._id });
    } else {
      teacher.assignedClass = undefined;
    }

    if (oldClassId && oldClassId.toString() !== classTeacherOf) {
      const oldClass = await Class.findById(oldClassId);
      if (oldClass && oldClass.classTeacher && oldClass.classTeacher.toString() === teacher._id.toString()) {
        oldClass.classTeacher = undefined;
        await oldClass.save();
      }
    }

    if (assignedClasses && Array.isArray(assignedClasses)) {
      teacher.assignedClasses = assignedClasses;
    }

    await teacher.save();

    // 14. Teacher Assignment Synchronization
    if (assignedClasses && assignedClasses.length > 0 && teacher.subjects && teacher.subjects.length > 0) {
      await Timetable.updateMany(
        { 
          class: { $in: assignedClasses },
          'periods.subject': { $in: teacher.subjects }
        },
        { 
          $set: { 'periods.$[elem].teacher': teacher._id }
        },
        { 
          arrayFilters: [{ 'elem.subject': { $in: teacher.subjects } }] 
        }
      );
    }

    // Sync class subjects for affected classes
    const { syncClassSubjects } = require('../utils/classSubjectSync');
    const classesToSync = new Set();
    if (classTeacherOf) classesToSync.add(classTeacherOf.toString());
    if (oldClassId) classesToSync.add(oldClassId.toString());
    if (assignedClasses && Array.isArray(assignedClasses)) {
      assignedClasses.forEach(c => classesToSync.add(c.toString()));
    }
    for (const cid of classesToSync) {
      await syncClassSubjects(cid);
    }

    res.json({ message: 'Teacher assignments updated and synchronized across all portals successfully.', teacher });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getClasses = async (req, res) => {
  try {
    const classes = await Class.find().populate('classTeacher', 'name').populate('subjects');
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPrincipalReports = async (req, res) => {
  const { type } = req.query;

  try {
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
      const list = await Student.find().populate('class');
      return res.json(list);
    } else if (type === 'fees') {
      const list = await Fee.find().populate({
        path: 'student',
        populate: [
          { path: 'class' },
          { path: 'parent' }
        ]
      });
      return res.json(list);
    } else if (type === 'attendance') {
      const list = await Attendance.find().populate('student').populate('class');
      return res.json(list);
    } else {
      return res.status(400).json({ message: 'Invalid report type' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
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
  getPrincipalReports
};

// ================= PRINCIPAL EXAMS EXTENSION CRUD =================

const getExams = async (req, res) => {
  try {
    const exams = await ExamSchedule.find()
      .populate('classes', 'name section')
      .populate('subjects.subject')
      .populate('subjects.invigilator', 'name')
      .sort({ createdAt: -1 });
    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createExamSchedule = async (req, res) => {
  console.log('[DEBUG BACKEND] Route hit: POST /api/principal/exams');
  console.log('[DEBUG BACKEND] Controller entered: createExamSchedule');
  console.log('[DEBUG BACKEND] Payload:', JSON.stringify(req.body, null, 2));

  const { examName, academicYear, classes, subjects, instructions, status } = req.body;

  if (!examName || !classes || !subjects || !Array.isArray(subjects)) {
    console.log('[DEBUG BACKEND] Validation failed: Missing required fields');
    return res.status(400).json({ message: 'Exam name, target classes, and subjects schedule are required.' });
  }

  // 1. Validate dates and start/end times
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  for (const subj of subjects) {
    if (!subj.subject || !subj.date || !subj.startTime || !subj.endTime || !subj.maxMarks) {
      console.log('[DEBUG BACKEND] Validation failed: Missing subject schedule fields', subj);
      return res.status(400).json({ message: 'All subjects schedule entries must have subject, date, start time, end time, and max marks.' });
    }
    if (!timeRegex.test(subj.startTime) || !timeRegex.test(subj.endTime)) {
      console.log('[DEBUG BACKEND] Validation failed: Invalid time format', subj.startTime, subj.endTime);
      return res.status(400).json({ message: 'Invalid time format. Time must be in HH:MM (24-hour) format.' });
    }
    const [startH, startM] = subj.startTime.split(':').map(Number);
    const [endH, endM] = subj.endTime.split(':').map(Number);
    const startVal = startH * 60 + startM;
    const endVal = endH * 60 + endM;

    if (endVal <= startVal) {
      console.log('[DEBUG BACKEND] Validation failed: End time is before or equal to start time', subj);
      return res.status(400).json({ message: `Invalid timings. End time must occur after start time.` });
    }
  }

  try {
    // 2. Validate duplicate exam name within active year
    console.log('[DEBUG BACKEND] MongoDB query: Find duplicate exam name');
    const existingExam = await ExamSchedule.findOne({ examName, academicYear });
    if (existingExam) {
      console.log('[DEBUG BACKEND] Validation failed: Duplicate exam name found in DB');
      return res.status(400).json({ message: `An exam schedule with name '${examName}' already exists for academic year ${academicYear}.` });
    }

    // 3. Clash Detection & Duplicate Timetable validations
    // No student in a class should have overlapping exams
    for (const classId of classes) {
      console.log('[DEBUG BACKEND] MongoDB query: Find active class schedules for class', classId);
      const activeClassSchedules = await ExamSchedule.find({
        classes: classId,
        academicYear,
        status: { $ne: 'Completed' }
      }).populate('subjects.subject');

      const targetClassObj = await Class.findById(classId);
      const className = targetClassObj ? targetClassObj.name : 'Target Class';

      for (const newSubj of subjects) {
        const newDate = new Date(newSubj.date).toDateString();
        const [nsH, nsM] = newSubj.startTime.split(':').map(Number);
        const [neH, neM] = newSubj.endTime.split(':').map(Number);
        const newStart = nsH * 60 + nsM;
        const newEnd = neH * 60 + neM;

        // Check against itself (duplicate subjects check in same slot)
        const sameSlotSelf = subjects.filter(s => 
          new Date(s.date).toDateString() === newDate && 
          String(s.subject?._id || s.subject) === String(newSubj.subject?._id || newSubj.subject) && 
          s !== newSubj
        );
        if (sameSlotSelf.length > 0) {
          console.log('[DEBUG BACKEND] Validation failed: Duplicate subjects in same slot in payload');
          return res.status(400).json({ message: `Cannot schedule the same subject multiple times on the same date.` });
        }

        // Check time clashes within new schedule
        const newSelfClash = subjects.filter(s => {
          if (s === newSubj) return false;
          if (new Date(s.date).toDateString() !== newDate) return false;
          const [sH, sM] = s.startTime.split(':').map(Number);
          const [eH, eM] = s.endTime.split(':').map(Number);
          const sVal = sH * 60 + sM;
          const eVal = eH * 60 + eM;
          return sVal < newEnd && newStart < eVal;
        });
        if (newSelfClash.length > 0) {
          console.log('[DEBUG BACKEND] Validation failed: Overlapping times in payload');
          return res.status(400).json({ message: `Time conflict detected: Multiple exams are scheduled at overlapping times in the same class.` });
        }

        // Check against database schedules
        for (const dbSchedule of activeClassSchedules) {
          for (const dbSubj of dbSchedule.subjects) {
            if (new Date(dbSubj.date).toDateString() !== newDate) continue;
            
            // Check same class time clashes
            const [dsH, dsM] = dbSubj.startTime.split(':').map(Number);
            const [deH, deM] = dbSubj.endTime.split(':').map(Number);
            const dbStart = dsH * 60 + dsM;
            const dbEnd = deH * 60 + deM;

            if (dbStart < newEnd && newStart < dbEnd) {
              const clashSubj = dbSubj.subject ? dbSubj.subject.name : 'another subject';
              console.log('[DEBUG BACKEND] Validation failed: Overlap with DB schedule');
              return res.status(400).json({ message: `Clash detected for ${className}: Already scheduled for '${clashSubj}' exam at ${dbSubj.startTime}-${dbSubj.endTime} on this date.` });
            }
          }
        }
      }
    }

    console.log('[DEBUG BACKEND] MongoDB save: Creating ExamSchedule document...');
    const exam = await ExamSchedule.create({
      examName, academicYear, classes, subjects, instructions, status
    });
    console.log('[DEBUG BACKEND] MongoDB save result: Success!', exam._id);

    await AuditLog.create({
      action: 'Created Exam Schedule',
      details: `Created Exam Schedule: ${examName}`,
      user: req.user.username || 'Principal',
      role: 'principal',
      entity: 'ExamSchedule',
      entityId: exam._id.toString()
    });

    console.log('[DEBUG BACKEND] Response sent: 201 Created');
    res.status(201).json(exam);
  } catch (error) {
    console.log('[DEBUG BACKEND] MongoDB save error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

const updateExamSchedule = async (req, res) => {
  const { id } = req.params;
  const { examName, academicYear, classes, subjects, instructions, status } = req.body;

  try {
    const exam = await ExamSchedule.findById(id);
    if (!exam) return res.status(404).json({ message: 'Exam schedule not found.' });

    const beforeState = exam.toObject();

    if (examName && examName !== exam.examName) {
      const existingExam = await ExamSchedule.findOne({ examName, academicYear });
      if (existingExam) {
        return res.status(400).json({ message: `An exam schedule with name '${examName}' already exists for academic year ${academicYear}.` });
      }
    }

    // Timings validation & overlap checks
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    const targetClasses = classes || exam.classes;
    const targetYear = academicYear || exam.academicYear;
    const targetSubjects = subjects || exam.subjects;

    if (targetSubjects && Array.isArray(targetSubjects)) {
      for (const subj of targetSubjects) {
        if (!subj.subject || !subj.date || !subj.startTime || !subj.endTime || !subj.maxMarks) {
          return res.status(400).json({ message: 'All subjects schedule entries must have subject, date, start time, end time, and max marks.' });
        }
        if (!timeRegex.test(subj.startTime) || !timeRegex.test(subj.endTime)) {
          return res.status(400).json({ message: 'Invalid time format. Time must be in HH:MM (24-hour) format.' });
        }
        const [startH, startM] = subj.startTime.split(':').map(Number);
        const [endH, endM] = subj.endTime.split(':').map(Number);
        const startVal = startH * 60 + startM;
        const endVal = endH * 60 + endM;
        if (endVal <= startVal) {
          return res.status(400).json({ message: `Invalid timings. End time must occur after start time.` });
        }
      }

      // Check overlap for every target class
      for (const classId of targetClasses) {
        const activeClassSchedules = await ExamSchedule.find({
          _id: { $ne: id },
          classes: classId,
          academicYear: targetYear,
          status: { $ne: 'Completed' }
        }).populate('subjects.subject');

        const targetClassObj = await Class.findById(classId);
        const className = targetClassObj ? targetClassObj.name : 'Target Class';

        for (const newSubj of targetSubjects) {
          const newDate = new Date(newSubj.date).toDateString();
          const [nsH, nsM] = newSubj.startTime.split(':').map(Number);
          const [neH, neM] = newSubj.endTime.split(':').map(Number);
          const newStart = nsH * 60 + nsM;
          const newEnd = neH * 60 + neM;

          // Check against itself (duplicate subjects check in same slot)
          const sameSlotSelf = targetSubjects.filter(s => 
            new Date(s.date).toDateString() === newDate && 
            String(s.subject?._id || s.subject) === String(newSubj.subject?._id || newSubj.subject) && 
            s !== newSubj
          );
          if (sameSlotSelf.length > 0) {
            return res.status(400).json({ message: `Cannot schedule the same subject multiple times on the same date.` });
          }

          // Check time clashes within payload
          const newSelfClash = targetSubjects.filter(s => {
            if (s === newSubj) return false;
            if (new Date(s.date).toDateString() !== newDate) return false;
            const [sH, sM] = s.startTime.split(':').map(Number);
            const [eH, eM] = s.endTime.split(':').map(Number);
            const sVal = sH * 60 + sM;
            const eVal = eH * 60 + eM;
            return sVal < newEnd && newStart < eVal;
          });
          if (newSelfClash.length > 0) {
            return res.status(400).json({ message: `Time conflict detected: Multiple exams are scheduled at overlapping times in the same class.` });
          }

          // Check against database schedules
          for (const dbSchedule of activeClassSchedules) {
            for (const dbSubj of dbSchedule.subjects) {
              if (new Date(dbSubj.date).toDateString() !== newDate) continue;
              
              const [dsH, dsM] = dbSubj.startTime.split(':').map(Number);
              const [deH, deM] = dbSubj.endTime.split(':').map(Number);
              const dbStart = dsH * 60 + dsM;
              const dbEnd = deH * 60 + deM;

              if (dbStart < newEnd && newStart < dbEnd) {
                const clashSubj = dbSubj.subject ? dbSubj.subject.name : 'another subject';
                return res.status(400).json({ message: `Clash detected for ${className}: Already scheduled for '${clashSubj}' exam at ${dbSubj.startTime}-${dbSubj.endTime} on this date.` });
              }
            }
          }
        }
      }
    }

    Object.assign(exam, req.body);
    await exam.save();

    await AuditLog.create({
      action: 'Updated Exam Schedule',
      details: `Updated Exam Schedule: ${exam.examName}`,
      user: req.user.username || 'Principal',
      role: 'principal',
      entity: 'ExamSchedule',
      entityId: id,
      before: beforeState,
      after: exam.toObject()
    });

    res.json(exam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteExamSchedule = async (req, res) => {
  const { id } = req.params;
  try {
    const exam = await ExamSchedule.findById(id);
    if (!exam) return res.status(404).json({ message: 'Exam schedule not found.' });

    const beforeState = exam.toObject();
    await ExamSchedule.findByIdAndDelete(id);

    await AuditLog.create({
      action: 'Deleted Exam Schedule',
      details: `Deleted Exam Schedule: ${exam.examName}`,
      user: req.user.username || 'Principal',
      role: 'principal',
      entity: 'ExamSchedule',
      entityId: id,
      before: beforeState,
      after: null
    });

    res.json({ message: 'Exam schedule deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const publishExamSchedule = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'Draft' | 'Published' | 'Completed'

  try {
    const exam = await ExamSchedule.findById(id).populate('subjects.subject');
    if (!exam) return res.status(404).json({ message: 'Exam schedule not found.' });

    const beforeState = exam.toObject();
    exam.status = status || 'Published';
    await exam.save();

    await AuditLog.create({
      action: 'Published Exam Schedule',
      details: `Set status to ${exam.status} for: ${exam.examName}`,
      user: req.user.username || 'Principal',
      role: 'principal',
      entity: 'ExamSchedule',
      entityId: id,
      before: beforeState,
      after: exam.toObject()
    });

    if (exam.status === 'Published') {
      // Trigger notifications for Parents & Teachers
      await Notification.create({
        title: 'New Exam Timetable Published',
        message: `The schedule for '${exam.examName}' has been published. Check portal to view timetable.`,
        recipientRole: 'parent',
        type: 'Exam',
        sender: req.user._id
      });

      // Invigilator duty alerts
      for (const subj of exam.subjects) {
        if (subj.invigilator) {
          await Notification.create({
            title: 'Invigilation Duty Assigned',
            message: `You have been assigned duty for '${subj.subject?.name || 'Subject'}' exam on ${new Date(subj.date).toLocaleDateString()} at ${subj.startTime} - ${subj.endTime}.`,
            recipientRole: 'teacher',
            type: 'Exam',
            sender: req.user._id
          });
        }
      }
    }

    res.json(exam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const copyPreviousExamSchedule = async (req, res) => {
  const { id } = req.params;
  const { targetYear } = req.body;
  try {
    const source = await ExamSchedule.findById(id);
    if (!source) return res.status(404).json({ message: 'Source exam schedule not found.' });

    const clone = await ExamSchedule.create({
      examName: `${source.examName} (Copy)`,
      academicYear: targetYear || '2026-27',
      classes: source.classes,
      subjects: source.subjects.map(s => ({
        subject: s.subject,
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        maxMarks: s.maxMarks,
        invigilator: null
      })),
      instructions: source.instructions,
      status: 'Draft'
    });

    await AuditLog.create({
      action: 'Copied Exam Schedule',
      details: `Copied Exam Schedule from ${source.academicYear} to ${targetYear}`,
      user: req.user.username || 'Principal',
      role: 'principal',
      entity: 'ExamSchedule',
      entityId: clone._id.toString()
    });

    res.status(201).json(clone);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const duplicateExamSchedule = async (req, res) => {
  const { id } = req.params;
  try {
    const source = await ExamSchedule.findById(id);
    if (!source) return res.status(404).json({ message: 'Source schedule not found.' });

    const clone = await ExamSchedule.create({
      examName: `${source.examName} (Duplicate)`,
      academicYear: source.academicYear,
      classes: source.classes,
      subjects: source.subjects.map(s => ({
        subject: s.subject,
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        maxMarks: s.maxMarks,
        invigilator: s.invigilator
      })),
      instructions: source.instructions,
      status: 'Draft'
    });

    await AuditLog.create({
      action: 'Duplicated Exam Schedule',
      details: `Duplicated Exam Schedule: ${source.examName}`,
      user: req.user.username || 'Principal',
      role: 'principal',
      entity: 'ExamSchedule',
      entityId: clone._id.toString()
    });

    res.status(201).json(clone);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getExamSchedulePDF = async (req, res) => {
  const { id } = req.params;
  try {
    const exam = await ExamSchedule.findById(id)
      .populate('subjects.subject')
      .populate('subjects.invigilator', 'name');
    if (!exam) return res.status(404).json({ message: 'Exam schedule not found.' });

    let targetClass = 'All Assigned Classes';
    if (exam.classes && exam.classes.length > 0) {
      const firstClass = await Class.findById(exam.classes[0]);
      if (firstClass) {
        targetClass = firstClass.name;
        if (exam.classes.length > 1) {
          targetClass += ` & ${exam.classes.length - 1} more`;
        }
      }
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Exam_Timetable_${exam.examName.replace(/\s+/g, '_')}.pdf`);

    generateExamTimetablePDF(res, exam, targetClass);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
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
};
