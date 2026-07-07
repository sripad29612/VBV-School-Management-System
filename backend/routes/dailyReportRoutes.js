const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
  getReports, 
  createReport, 
  saveDraft, 
  updateReportStatus 
} = require('../controllers/dailyReportController');

// All teaching report routes are protected by JWT auth
router.use(protect);

router.get('/', getReports);
router.post('/', createReport);
router.post('/draft', saveDraft);
router.put('/:id/status', updateReportStatus);

module.exports = router;
