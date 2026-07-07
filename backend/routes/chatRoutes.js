const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  sendMessage,
  getMessages,
  getChatContacts
} = require('../controllers/chatController');

// All chat routes are protected
router.use(protect);

router.post('/send', sendMessage);
router.get('/history/:contactId', getMessages);
router.get('/contacts', getChatContacts);

module.exports = router;
