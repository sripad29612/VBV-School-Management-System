const DailyReport = require('../models/DailyReport');

// Fetch all teaching reports
const getReports = async (req, res) => {
  try {
    let query = {};
    // If the request is from a teacher, only return their reports
    if (req.user && req.user.role === 'teacher') {
      query.teacherName = req.user.name || 'Teacher';
    }
    const reports = await DailyReport.find(query).sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create / Submit a report
const createReport = async (req, res) => {
  try {
    const { 
      _id, className, subject, date, chapter, topicCovered, 
      learningObjectives, teachingMethod, activities, homeworkGiven, 
      studentsPresent, completionStatus, notes 
    } = req.body;

    const teacherName = req.user.name || 'Teacher';

    // Remove if existing draft
    if (_id && _id.startsWith('rep_draft_')) {
      await DailyReport.findByIdAndDelete(_id);
    }

    let report;
    if (_id && !_id.startsWith('rep_draft_')) {
      // Update existing report
      report = await DailyReport.findByIdAndUpdate(_id, {
        className, subject, date, chapter, topicCovered,
        learningObjectives, teachingMethod, activities, homeworkGiven,
        studentsPresent, completionStatus, notes,
        teacherName,
        status: 'Submitted',
        submissionTime: new Date().toLocaleString()
      }, { new: true });
    } else {
      // Create new report
      report = await DailyReport.create({
        className, subject, date, chapter, topicCovered,
        learningObjectives, teachingMethod, activities, homeworkGiven,
        studentsPresent, completionStatus, notes,
        teacherName,
        status: 'Submitted',
        submissionTime: new Date().toLocaleString()
      });
    }

    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Save a report as draft
const saveDraft = async (req, res) => {
  try {
    const { 
      _id, className, subject, date, chapter, topicCovered, 
      learningObjectives, teachingMethod, activities, homeworkGiven, 
      studentsPresent, completionStatus, notes 
    } = req.body;

    const teacherName = req.user.name || 'Teacher';
    let report;

    if (_id) {
      report = await DailyReport.findByIdAndUpdate(_id, {
        className, subject, date, chapter, topicCovered,
        learningObjectives, teachingMethod, activities, homeworkGiven,
        studentsPresent, completionStatus, notes,
        teacherName,
        status: 'Draft',
        submissionTime: new Date().toLocaleString()
      }, { new: true });
    }

    if (!report) {
      report = await DailyReport.create({
        className, subject, date, chapter, topicCovered,
        learningObjectives, teachingMethod, activities, homeworkGiven,
        studentsPresent, completionStatus, notes,
        teacherName,
        status: 'Draft',
        submissionTime: new Date().toLocaleString()
      });
    }

    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update status of a report (Approve / Reject / Return)
const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body; // Approved, Rejected, Returned

    const updateFields = { status };
    if (notes) {
      updateFields.notes = notes;
    }

    const report = await DailyReport.findByIdAndUpdate(id, updateFields, { new: true });
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getReports,
  createReport,
  saveDraft,
  updateReportStatus
};
