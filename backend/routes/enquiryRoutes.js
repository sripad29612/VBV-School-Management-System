const express = require('express');
const router = express.Router();
const { submitEnquiry, getEnquiries } = require('../controllers/enquiryController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/submit', submitEnquiry);
router.get('/', protect, authorize('admin'), getEnquiries);

module.exports = router;
