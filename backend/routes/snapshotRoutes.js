const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { triggerAllClassroomsSnapshots } = require('../controllers/snapshotController');

// Allow manually triggering snapshots for testing/demonstration, restricted to Principal/Teacher
router.post('/trigger', protect, authorize('principal', 'teacher'), triggerAllClassroomsSnapshots);

module.exports = router;
