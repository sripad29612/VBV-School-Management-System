const Class = require('../models/Class');
const Snapshot = require('../models/Snapshot');
const { ClassSettings } = require('../models/Snapshot');
const { generateClassroomSnapshot } = require('../utils/watermark');

/**
 * Triggers simulated camera snapshots for all classes with active cameras.
 * Called automatically every 5 minutes or on demand.
 */
const triggerAllClassroomsSnapshots = async (req, res) => {
  // Only execute during school hours: 8 AM to 4 PM
  const now = new Date();
  const currentHour = now.getHours();
  
  if (currentHour < 8 || currentHour >= 16) {
    if (res) {
      return res.status(400).json({
        message: 'Camera capture aborted: Snapshots are only active during school hours (08:00 AM - 04:00 PM).'
      });
    }
    console.log('Skipping periodic classroom camera captures: outside school hours.');
    return;
  }

  try {
    const classes = await Class.find();
    const createdSnapshots = [];

    for (const cls of classes) {
      // Check if camera is enabled by teacher
      const settings = await ClassSettings.findOne({ class: cls._id });
      const isEnabled = settings ? settings.snapshotEnabled : true;

      if (!isEnabled) continue;

      const timestamp = new Date();
      const filename = `snapshot-${cls.name.replace(/\s+/g, '_')}-${timestamp.getTime()}.jpg`;
      
      // Generate watermarked classroom image
      const relativePath = await generateClassroomSnapshot(cls.name, filename);

      // Create snapshot record, set expiration to +48 hours
      const expiresAt = new Date(timestamp.getTime() + 48 * 60 * 60 * 1000);
      const snapshot = await Snapshot.create({
        class: cls._id,
        imageUrl: relativePath,
        timestamp,
        watermarkText: 'VIDYA BHARATHI VIDYAPEETH - AUTOMATIC CAPTURE',
        expiresAt
      });

      createdSnapshots.push(snapshot);
    }

    if (res) {
      return res.status(201).json({
        message: 'Classroom snapshots updated successfully',
        count: createdSnapshots.length,
        snapshots: createdSnapshots
      });
    }
    console.log(`Periodic automated classroom snapshots generated: ${createdSnapshots.length} classes.`);
  } catch (error) {
    console.error('automated snapshot generation error:', error);
    if (res) {
      return res.status(500).json({ message: error.message });
    }
  }
};

module.exports = {
  triggerAllClassroomsSnapshots
};
