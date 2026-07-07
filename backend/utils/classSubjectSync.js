const Class = require('../models/Class');
const Timetable = require('../models/Timetable');
const Teacher = require('../models/Teacher');

/**
 * Synchronizes the subjects field of a Class document based on current Timetable slots and Teacher assignments.
 * @param {string|ObjectId} classId 
 * @param {ClientSession} [session] 
 */
const syncClassSubjects = async (classId, session = null) => {
  try {
    const subjectsSet = new Set();

    // 1. Get subjects from Timetable for this class
    const timetables = await Timetable.find({ class: classId }).session(session);
    timetables.forEach(t => {
      if (t.periods) {
        t.periods.forEach(p => {
          if (p.subject) {
            subjectsSet.add(p.subject.toString());
          }
        });
      }
    });

    // 2. Get subjects from Teacher assignments for this class
    const teachers = await Teacher.find({
      $or: [
        { assignedClass: classId },
        { assignedClasses: classId }
      ]
    }).session(session);
    
    teachers.forEach(t => {
      if (t.subjects) {
        t.subjects.forEach(subId => {
          subjectsSet.add(subId.toString());
        });
      }
    });

    // 3. Update the Class subjects array
    await Class.findByIdAndUpdate(
      classId,
      { $set: { subjects: Array.from(subjectsSet) } },
      { session }
    );
  } catch (err) {
    console.error(`Failed to sync subjects for class ${classId}:`, err.message);
  }
};

module.exports = { syncClassSubjects };
