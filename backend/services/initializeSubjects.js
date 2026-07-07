const Class = require('../models/Class');
const { syncClassSubjects } = require('../utils/classSubjectSync');

/**
 * Initializes/synchronizes the subjects array for all classes on server startup.
 */
const initializeSubjects = async () => {
  try {
    const classes = await Class.find();
    console.log(`Starting startup Class-Subject synchronization for ${classes.length} classes...`);
    for (const cls of classes) {
      await syncClassSubjects(cls._id);
    }
    console.log('Class-Subject synchronization completed successfully.');
  } catch (err) {
    console.error('Error during Class-Subject synchronization on startup:', err.message);
  }
};

module.exports = initializeSubjects;
