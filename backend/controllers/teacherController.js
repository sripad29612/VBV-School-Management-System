const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Homework = require('../models/Homework');
const StudyMaterial = require('../models/StudyMaterial');
const Result = require('../models/Result');
const Notification = require('../models/Notification');
const Timetable = require('../models/Timetable');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const { ClassSettings } = require('../models/Snapshot');
const TeacherAttendance = require('../models/TeacherAttendance');
const SubstituteAssignment = require('../models/SubstituteAssignment');
const DailyReport = require('../models/DailyReport');
const Message = require('../models/Message');
const ExamSchedule = require('../models/ExamSchedule');
const Calendar = require('../models/Calendar');

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

// Get Teacher Dashboard info
const getTeacherDashboard = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ user: req.user._id })
      .populate({
        path: 'assignedClass',
        populate: { path: 'subjects' }
      })
      .populate('subjects');
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found' });
    }

    // 1. Check statistics for their assigned class
    let studentCount = 0;
    let attendanceToday = 0;

    if (teacher.assignedClass) {
      studentCount = await Student.countDocuments({ class: teacher.assignedClass._id });
      
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const presentCount = await Attendance.countDocuments({
        class: teacher.assignedClass._id,
        date: { $gte: startOfDay, $lte: endOfDay },
        status: { $in: ['Present', 'Late'] }
      });
      attendanceToday = studentCount > 0 ? (presentCount / studentCount) * 100 : 0;
    }

    // 2. Fetch today's schedule for this teacher
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const activeDay = days[new Date().getDay()] === 'Sunday' ? 'Monday' : days[new Date().getDay()];

    const timetables = await Timetable.find({
      'periods.teacher': teacher._id,
      day: activeDay
    }).populate('class').populate('periods.subject');

    const schedules = [];
    timetables.forEach(t => {
      if (t.periods && Array.isArray(t.periods)) {
        t.periods.forEach(p => {
          if (p.teacher && p.teacher.toString() === teacher._id.toString()) {
            schedules.push({
              classId: t.class ? t.class._id : '',
              class: t.class ? t.class.name : 'Unknown',
              section: t.class ? t.class.section : '',
              subject: p.subject ? p.subject.name : 'Unknown',
              startTime: p.startTime,
              endTime: p.endTime,
              room: p.room || 'N/A'
            });
          }
        });
      }
    });

    // Sort schedules chronologically
    schedules.sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));

    // 3. Recent homework posted
    const recentHomework = await Homework.find({ teacher: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('class')
      .populate('subject');

    // 4. Fetch active substitute coverage for today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const activeSub = await SubstituteAssignment.findOne({
      substituteTeacher: teacher._id,
      startDate: { $lte: todayStart },
      endDate: { $gte: todayStart },
      status: 'Active'
    }).populate('originalTeacher', 'name').populate('class', 'name section');

    let activeSubCover = null;
    if (activeSub) {
      activeSubCover = {
        id: activeSub._id,
        originalTeacher: activeSub.originalTeacher?.name || 'Mrs. Anitha Rao',
        assignedClass: activeSub.class ? `${activeSub.class.name} ${activeSub.class.section}` : 'Class VI - A',
        startDate: activeSub.startDate.toISOString().split('T')[0],
        endDate: activeSub.endDate.toISOString().split('T')[0]
      };
    }

    // 5. Fetch self attendance logs for today
    const selfAttLogs = await TeacherAttendance.find({
      teacher: teacher._id,
      date: { $gte: todayStart, $lt: todayEnd }
    });

    const selfAttendance = selfAttLogs.map(log => ({
      session: log.session,
      time: log.time,
      status: log.status
    }));

    // 6. Dynamic Pending Tasks
    const pendingTasks = [];
    if (teacher.assignedClass) {
      // Check if attendance exists for today
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      const todayAttendance = await Attendance.findOne({
        class: teacher.assignedClass._id,
        date: { $gte: startOfToday, $lte: endOfToday }
      });
      if (!todayAttendance) {
        pendingTasks.push({
          id: 'attendance',
          title: "Morning Attendance",
          subtitle: `${teacher.assignedClass.name} register pending`,
          type: "Attendance Pending",
          screen: 'attendance',
          color: '#EF4444'
        });
      }

      // Check if homework posted today
      const todayHomework = await Homework.findOne({
        class: teacher.assignedClass._id,
        createdAt: { $gte: startOfToday, $lte: endOfToday }
      });
      if (!todayHomework) {
        pendingTasks.push({
          id: 'homework',
          title: "Today's Homework",
          subtitle: `Assign homework to ${teacher.assignedClass.name}`,
          type: "Homework Pending",
          screen: 'homework',
          color: '#F97316'
        });
      }

      // Check if daily teaching report submitted today
      const todayDateStr = new Date().toISOString().split('T')[0];
      const todayReport = await DailyReport.findOne({
        className: `${teacher.assignedClass.name} - ${teacher.assignedClass.section}`,
        date: todayDateStr,
        teacherName: teacher.name
      });
      if (!todayReport) {
        pendingTasks.push({
          id: 'report',
          title: "Daily Teaching Report",
          subtitle: `Submit report for ${teacher.assignedClass.name}`,
          type: "Lesson Report Pending",
          screen: 'daily-report',
          color: '#3B82F6'
        });
      }

      // Check if results exist
      const quarterlyResultsExist = await Result.findOne({
        class: teacher.assignedClass._id
      });
      if (!quarterlyResultsExist) {
        pendingTasks.push({
          id: 'marks',
          title: "Unit Test & Exam Marks",
          subtitle: `Upload marks sheet for ${teacher.assignedClass.name}`,
          type: "Marks Pending",
          screen: 'marks',
          color: '#8B5CF6'
        });
      }
    }

    // 7. Dynamic Student Alerts
    const studentAlerts = [];
    if (teacher.assignedClass) {
      const students = await Student.find({ class: teacher.assignedClass._id });
      const studentIds = students.map(s => s._id);

      // Low Attendance alert (overall < 75%)
      for (const student of students) {
        const totalSessions = await Attendance.countDocuments({
          class: teacher.assignedClass._id,
          'records.student': student._id
        });
        if (totalSessions > 0) {
          const presentSessions = await Attendance.countDocuments({
            class: teacher.assignedClass._id,
            records: {
              $elemMatch: {
                student: student._id,
                status: { $in: ['Present', 'Late'] }
              }
            }
          });
          const pct = (presentSessions / totalSessions) * 100;
          if (pct < 75) {
            studentAlerts.push({
              id: `alert_att_${student._id}`,
              name: student.name,
              alertType: "Low Attendance",
              desc: `Attendance: ${Math.round(pct)}% (Threshold: 75%)`,
              color: '#EF4444',
              detail: `Present ${presentSessions}/${totalSessions} sessions.`
            });
          }
        }
      }

      // Homework Missing alert (Past due date and status is Pending)
      const now = new Date();
      const missedHw = await Homework.find({
        class: teacher.assignedClass._id,
        dueDate: { $lt: now }
      }).populate('subject');

      for (const hw of missedHw) {
        for (const sub of hw.submissions) {
          if (sub.status === 'Pending') {
            const studentObj = students.find(s => s._id.toString() === sub.student.toString());
            if (studentObj) {
              studentAlerts.push({
                id: `alert_hw_${hw._id}_${sub.student}`,
                name: studentObj.name,
                alertType: "Homework Missing",
                desc: `${hw.title} (${hw.subject?.name || 'Subject'})`,
                color: '#F97316',
                detail: `Due: ${hw.dueDate.toISOString().split('T')[0]}`
              });
            }
          }
        }
      }

      // Low Marks alert (Scored < 50% in any Result)
      const results = await Result.find({
        class: teacher.assignedClass._id,
        percentage: { $lt: 50 }
      });
      for (const r of results) {
        const studentObj = students.find(s => s._id.toString() === r.student.toString());
        if (studentObj) {
          studentAlerts.push({
            id: `alert_marks_${r._id}`,
            name: studentObj.name,
            alertType: "Low Marks",
            desc: `Scored ${r.percentage}% in ${r.examType}`,
            color: '#EF4444',
            detail: `Grade: ${r.grade}`
          });
        }
      }
    }

    // 8. Dynamic Recent Parent Messages (only parents linked to students taught by this teacher)
    const recentMessages = [];
    if (teacher.assignedClass) {
      const students = await Student.find({ class: teacher.assignedClass._id }).populate('parent');
      const parentUserIds = students
        .map(s => s.parent && s.parent.user)
        .filter(Boolean)
        .map(uid => uid.toString());

      if (parentUserIds.length > 0) {
        const messages = await Message.find({
          $or: [
            { sender: req.user._id, receiver: { $in: parentUserIds } },
            { receiver: req.user._id, sender: { $in: parentUserIds } }
          ]
        }).sort({ createdAt: -1 }).populate('sender', 'name role').populate('receiver', 'name role');

        const chatPartners = new Set();
        for (const msg of messages) {
          const partnerId = msg.sender._id.toString() === req.user._id.toString()
            ? msg.receiver._id.toString()
            : msg.sender._id.toString();

          if (!chatPartners.has(partnerId)) {
            chatPartners.add(partnerId);

            const studentWithParent = students.find(s => s.parent && s.parent.user && s.parent.user.toString() === partnerId);
            const parentName = studentWithParent
              ? `${studentWithParent.parent.fatherName || studentWithParent.parent.motherName || 'Parent'}`
              : 'Parent';

            recentMessages.push({
              id: msg._id.toString(),
              parent: `${parentName} (${studentWithParent?.name}'s Guardian)`,
              msg: msg.message,
              time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              unread: !msg.read && msg.receiver._id.toString() === req.user._id.toString()
            });

            if (recentMessages.length >= 5) break;
          }
        }
      }
    }

    // 9. Recent Announcements from MongoDB
    const noticesList = await Notification.find({
      $or: [
        { recipientRole: 'all' },
        { recipientRole: 'teacher', teacher: { $exists: false } },
        { recipientRole: 'teacher', teacher: teacher._id },
        ...(teacher.assignedClass ? [{ class: teacher.assignedClass._id }] : [])
      ]
    }).sort({ createdAt: -1 }).limit(5);

    const notices = noticesList.map(item => ({
      id: item._id.toString(),
      title: item.title,
      date: new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      type: item.type,
      color: item.type === 'Exam' ? '#3B82F6' : (item.type === 'Meeting' ? '#8B5CF6' : '#10B981')
    }));

    // 10. Student Performance Summary
    const topPerformers = [];
    const needingSupport = [];
    if (teacher.assignedClass) {
      const results = await Result.find({ class: teacher.assignedClass._id })
        .populate('student', 'name')
        .sort({ percentage: -1 });

      if (results.length > 0) {
        const studentMap = {};
        for (const r of results) {
          if (r.student) {
            const sid = r.student._id.toString();
            if (!studentMap[sid]) {
              studentMap[sid] = {
                name: r.student.name,
                totalPct: 0,
                count: 0
              };
            }
            studentMap[sid].totalPct += r.percentage;
            studentMap[sid].count += 1;
          }
        }

        const studentAverages = Object.keys(studentMap).map(sid => ({
          name: studentMap[sid].name,
          avgPct: Math.round(studentMap[sid].totalPct / studentMap[sid].count)
        }));

        studentAverages.sort((a, b) => b.avgPct - a.avgPct);

        studentAverages.slice(0, 3).forEach(item => {
          if (item.avgPct >= 75) {
            topPerformers.push(`${item.name} - ${item.avgPct}%`);
          }
        });

        studentAverages
          .filter(item => item.avgPct < 60)
          .sort((a, b) => a.avgPct - b.avgPct)
          .slice(0, 3)
          .forEach(item => {
            needingSupport.push(`${item.name} - ${item.avgPct}%`);
          });
      }
    }

    // 11. Subject Chapter-wise Performance & Monthly Attendance Trend
    const mathChapterData = [];
    if (teacher.assignedClass) {
      const results = await Result.find({ class: teacher.assignedClass._id });
      const subjectMap = {};
      for (const resObj of results) {
        for (const subMark of resObj.marks) {
          const subId = subMark.subject.toString();
          if (!subjectMap[subId]) {
            subjectMap[subId] = { total: 0, count: 0 };
          }
          subjectMap[subId].total += (subMark.marksObtained / subMark.maxMarks) * 100;
          subjectMap[subId].count += 1;
        }
      }

      for (const subId of Object.keys(subjectMap)) {
        const subObj = await Subject.findById(subId);
        if (subObj) {
          mathChapterData.push({
            label: subObj.name,
            value: Math.round(subjectMap[subId].total / subjectMap[subId].count)
          });
        }
      }
    }

    const monthlyTrendData = [];
    if (teacher.assignedClass) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const today = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
        const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

        const totalSessions = await Attendance.countDocuments({
          class: teacher.assignedClass._id,
          date: { $gte: startOfMonth, $lte: endOfMonth }
        });

        if (totalSessions > 0) {
          const presentSessions = await Attendance.countDocuments({
            class: teacher.assignedClass._id,
            date: { $gte: startOfMonth, $lte: endOfMonth },
            records: {
              $elemMatch: {
                status: { $in: ['Present', 'Late'] }
              }
            }
          });
          const rate = Math.round((presentSessions / totalSessions) * 100);
          monthlyTrendData.push({
            label: monthNames[d.getMonth()],
            value: rate
          });
        } else {
          monthlyTrendData.push({
            label: monthNames[d.getMonth()],
            value: 0
          });
        }
      }
    }

    res.json({
      name: teacher.name,
      teacherId: teacher.teacherId,
      qualification: teacher.qualification,
      assignedClass: teacher.assignedClass ? `${teacher.assignedClass.name} - ${teacher.assignedClass.section}` : 'None',
      assignedClassId: teacher.assignedClass ? teacher.assignedClass._id : null,
      subjects: teacher.subjects || [],
      studentCount,
      attendanceTodayPct: attendanceToday,
      schedules,
      recentHomework,
      activeSubCover,
      selfAttendance,
      leaveRequests: teacher.leaves || [],
      pendingTasks,
      studentAlerts,
      recentMessages,
      notices,
      performanceSummary: {
        topPerformers,
        needingSupport
      },
      mathChapterData,
      monthlyTrendData
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get List of Students in Class
const getClassStudents = async (req, res) => {
  const { classId } = req.params;
  try {
    const students = await Student.find({ class: classId }).sort({ rollNumber: 1 });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark Attendance
const markAttendance = async (req, res) => {
  const { classId, date, records } = req.body; // records: [{ studentId, status }]

  if (!classId || !date || !records || !Array.isArray(records)) {
    return res.status(400).json({ message: 'Missing parameters. Provide classId, date, and student attendance records.' });
  }

  try {
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const savedRecords = [];
    for (const record of records) {
      const query = { student: record.studentId, date: attendanceDate };
      const update = {
        class: classId,
        status: record.status,
        markedBy: req.user._id
      };
      
      const att = await Attendance.findOneAndUpdate(query, update, {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      });
      savedRecords.push(att);
    }

    res.status(201).json({ message: 'Attendance marked successfully', count: savedRecords.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Upload Homework
const uploadHomework = async (req, res) => {
  const { classId, subjectId, title, description, dueDate } = req.body;
  const attachmentUrl = req.file ? `/uploads/homework/${req.file.filename}` : '';

  if (!classId || !subjectId || !title || !description || !dueDate) {
    return res.status(400).json({ message: 'All homework fields are required' });
  }

  try {
    const homework = await Homework.create({
      class: classId,
      subject: subjectId,
      teacher: req.user._id,
      title,
      description,
      attachmentUrl,
      dueDate: new Date(dueDate)
    });

    // Create submissions list for all class students
    const students = await Student.find({ class: classId });
    homework.submissions = students.map(s => ({
      student: s._id,
      status: 'Pending'
    }));
    await homework.save();

    // Broadcast a notification
    const classObj = await Class.findById(classId);
    const subObj = await Subject.findById(subjectId);
    await Notification.create({
      title: 'New Homework Uploaded',
      message: `A new homework "${title}" for ${subObj.name} has been posted. Due date: ${new Date(dueDate).toLocaleDateString('en-GB')}`,
      recipientRole: 'student',
      class: classId,
      type: 'Homework',
      sender: req.user._id
    });

    res.status(201).json(homework);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Upload Study Material
const uploadStudyMaterial = async (req, res) => {
  const { classId, subjectId, title, description, fileType } = req.body;
  const fileUrl = req.file ? `/uploads/materials/${req.file.filename}` : '';

  if (!classId || !subjectId || !title || !fileUrl) {
    return res.status(400).json({ message: 'Title, Class, Subject, and File attachment are required' });
  }

  try {
    const material = await StudyMaterial.create({
      class: classId,
      subject: subjectId,
      teacher: req.user._id,
      title,
      description,
      fileUrl,
      fileType
    });

    res.status(201).json(material);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Upload Student Marks
const uploadMarks = async (req, res) => {
  const { studentId, classId, examType, marks } = req.body; // marks: [{ subjectId, marksObtained, maxMarks }]

  if (!studentId || !classId || !examType || !marks || !Array.isArray(marks)) {
    return res.status(400).json({ message: 'Missing parameters. Provide studentId, classId, examType, and marks array.' });
  }

  try {
    // Calculate total, percentage, grade
    let totalMarks = 0;
    let totalMaxMarks = 0;
    const formattedMarks = marks.map(m => {
      totalMarks += Number(m.marksObtained);
      totalMaxMarks += Number(m.maxMarks || 100);
      return {
        subject: m.subjectId,
        marksObtained: Number(m.marksObtained),
        maxMarks: Number(m.maxMarks || 100)
      };
    });

    const percentage = totalMaxMarks > 0 ? (totalMarks / totalMaxMarks) * 100 : 0;
    
    // Simple grading system
    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B';
    else if (percentage >= 60) grade = 'C';
    else if (percentage >= 50) grade = 'D';
    else if (percentage >= 35) grade = 'E';

    // Check if result already exists
    const query = { student: studentId, examType };
    const update = {
      class: classId,
      marks: formattedMarks,
      totalMarks,
      percentage,
      grade,
      published: true
    };

    const savedResult = await Result.findOneAndUpdate(query, update, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    });

    // Recalculate class ranks for this examType
    const allClassResults = await Result.find({ class: classId, examType }).sort({ percentage: -1 });
    for (let index = 0; index < allClassResults.length; index++) {
      allClassResults[index].rank = index + 1;
      await allClassResults[index].save();
    }

    res.status(201).json({ message: 'Marks uploaded successfully', result: savedResult });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Enable or disable snapshot capture
const enableDisableSnapshots = async (req, res) => {
  const { classId, enabled } = req.body;
  if (!classId || enabled === undefined) {
    return res.status(400).json({ message: 'Provide classId and enabled state.' });
  }

  try {
    const settings = await ClassSettings.findOneAndUpdate(
      { class: classId },
      { snapshotEnabled: enabled },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ message: `Snapshot capture successfully ${enabled ? 'enabled' : 'disabled'}`, settings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Fetch Student Reports (grades and attendance statistics)
const getStudentReports = async (req, res) => {
  const { classId } = req.params;
  try {
    const students = await Student.find({ class: classId });
    const reports = [];

    for (const student of students) {
      // Attendance percentage
      const totalDays = await Attendance.countDocuments({ class: classId, 'records.student': student._id });
      const presentDays = await Attendance.countDocuments({
        class: classId,
        records: {
          $elemMatch: {
            student: student._id,
            status: { $in: ['Present', 'Late'] }
          }
        }
      });
      const attendancePct = totalDays > 0 ? (presentDays / totalDays) * 100 : null;

      // Homework completion percentage
      const totalHw = await Homework.countDocuments({ class: classId });
      const submittedHw = await Homework.countDocuments({
        class: classId,
        submissions: {
          $elemMatch: {
            student: student._id,
            status: { $in: ['Submitted', 'Late'] }
          }
        }
      });
      const homeworkPct = totalHw > 0 ? (submittedHw / totalHw) * 100 : null;

      // Latest Exam results
      const latestResult = await Result.findOne({ student: student._id }).sort({ createdAt: -1 });

      reports.push({
        _id: student._id,
        name: student.name,
        rollNumber: student.rollNumber,
        attendancePct,
        homeworkPct,
        latestExam: latestResult ? latestResult.examType : 'N/A',
        latestPercentage: latestResult ? latestResult.percentage : null,
        latestGrade: latestResult ? latestResult.grade : 'N/A'
      });
    }

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark Self Attendance
const markSelfAttendance = async (req, res) => {
  const { session, time, status } = req.body;
  if (!session || !time || !status) {
    return res.status(400).json({ message: 'Provide session, time, and status.' });
  }

  try {
    const teacher = await Teacher.findOne({ user: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found.' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const att = await TeacherAttendance.findOneAndUpdate(
      { teacher: teacher._id, date: today, session },
      { time, status, date: today },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ message: 'Self attendance marked successfully.', attendance: att });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Self Attendance logs for today
const getSelfAttendance = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ user: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found.' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const logs = await TeacherAttendance.find({
      teacher: teacher._id,
      date: { $gte: today, $lt: tomorrow }
    });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Apply for leave
const applyLeave = async (req, res) => {
  const { fromDate, toDate, reason } = req.body;
  if (!fromDate || !toDate || !reason) {
    return res.status(400).json({ message: 'Provide fromDate, toDate, and reason.' });
  }

  try {
    const teacher = await Teacher.findOne({ user: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found.' });
    }

    teacher.leaves.push({
      fromDate: new Date(fromDate),
      toDate: new Date(toDate),
      reason,
      status: 'Pending'
    });

    await teacher.save();
    res.status(201).json({ message: 'Leave request submitted successfully.', leaves: teacher.leaves });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get self leave requests
const getLeaveRequests = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ user: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found.' });
    }
    res.json(teacher.leaves || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const postAnnouncement = async (req, res) => {
  const { title, message, type, recipientRole } = req.body;
  if (!title || !message || !type) {
    return res.status(400).json({ message: 'Provide title, message, and type.' });
  }
  try {
    const teacher = await Teacher.findOne({ user: req.user._id });
    const notification = await Notification.create({
      title,
      message,
      type,
      recipientRole: recipientRole || 'all',
      class: teacher ? teacher.assignedClass : null,
      sender: req.user._id
    });
    res.status(201).json({ message: 'Announcement posted successfully.', notification });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAnnouncements = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ user: req.user._id });
    if (!teacher) return res.status(404).json({ message: 'Teacher profile not found.' });

    const query = {
      $or: [
        { recipientRole: 'all' },
        { recipientRole: 'teacher', teacher: { $exists: false } }
      ]
    };
    if (teacher) {
      query.$or.push({ recipientRole: 'teacher', teacher: teacher._id });
      if (teacher.assignedClass) {
        query.$or.push({ class: teacher.assignedClass });
      }
    }
    const list = await Notification.find(query).sort({ createdAt: -1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTeacherExamDuties = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ user: req.user._id });
    if (!teacher) return res.status(404).json({ message: 'Teacher profile not found.' });

    const exams = await ExamSchedule.find({
      status: 'Published',
      'subjects.invigilator': teacher._id
    })
    .populate('classes', 'name section')
    .populate('subjects.subject')
    .sort({ 'subjects.date': 1 });

    const duties = exams.map(ex => {
      const mySubjects = ex.subjects.filter(s => s.invigilator && s.invigilator.toString() === teacher._id.toString());
      return {
        _id: ex._id,
        examName: ex.examName,
        academicYear: ex.academicYear,
        classes: ex.classes,
        instructions: ex.instructions,
        subjects: mySubjects
      };
    });

    res.json(duties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTeacherSalaryHistory = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ user: req.user._id });
    if (!teacher) return res.status(404).json({ message: 'Teacher profile not found.' });

    const sortedPayments = (teacher.salaryPayments || []).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    res.json(sortedPayments);
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
};
