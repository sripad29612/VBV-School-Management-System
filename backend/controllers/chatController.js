const Message = require('../models/Message');
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Parent = require('../models/Parent');

// Send Message
const sendMessage = async (req, res) => {
  const { receiverId, message } = req.body;

  console.log('[DEBUG BACKEND] Route hit: POST /api/chat/send');
  console.log('[DEBUG BACKEND] Controller entered: sendMessage');
  console.log('[DEBUG BACKEND] Sender ID:', req.user._id, 'Receiver ID:', receiverId, 'Message:', message);

  if (!receiverId || !message) {
    console.log('[DEBUG BACKEND] Validation failed: Missing receiverId or message');
    return res.status(400).json({ message: 'Receiver and message content are required' });
  }

  try {
    const newMessage = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      message
    });
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Messages logs
const getMessages = async (req, res) => {
  const { contactId } = req.params;
  
  console.log('[DEBUG BACKEND] Route hit: GET /api/chat/history/' + contactId);
  console.log('[DEBUG BACKEND] Controller entered: getMessages');
  console.log('[DEBUG BACKEND] User ID:', req.user._id, 'Contact ID:', contactId);

  try {
    console.log('[DEBUG BACKEND] MongoDB query: Find messages between users');
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: contactId },
        { sender: contactId, receiver: req.user._id }
      ]
    }).sort({ createdAt: 1 });

    // Mark as read
    await Message.updateMany(
      { sender: contactId, receiver: req.user._id, read: false },
      { read: true }
    );

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Retrieve contact lists based on roles
const getChatContacts = async (req, res) => {
  console.log('[DEBUG BACKEND] Route hit: GET /api/chat/contacts');
  console.log('[DEBUG BACKEND] Controller entered: getChatContacts');
  console.log('[DEBUG BACKEND] User ID:', req.user._id, 'Role:', req.user.role);

  try {
    const contacts = [];
    const role = req.user.role;

    if (role === 'parent') {
      // Parents can chat with their children's teachers
      const parent = await Parent.findOne({ user: req.user._id }).populate({
        path: 'children',
        populate: {
          path: 'class',
          populate: { path: 'classTeacher' }
        }
      });

      if (parent) {
        const addedIds = new Set();
        for (const child of parent.children) {
          if (child.class && child.class.classTeacher) {
            const teacherUser = child.class.classTeacher;
            if (!addedIds.has(teacherUser._id.toString())) {
              addedIds.add(teacherUser._id.toString());
              // Get full teacher name
              const teacherProfile = await Teacher.findOne({ user: teacherUser._id });
              contacts.push({
                _id: teacherUser._id,
                name: teacherProfile ? `${teacherProfile.name} (${child.class.name} Teacher)` : 'Class Teacher',
                role: 'teacher'
              });
            }
          }
        }
      }
    } else if (role === 'teacher') {
      // Teachers can chat with parents of their students, and the principal
      const teacher = await Teacher.findOne({ user: req.user._id });
      if (teacher) {
        const classesTaught = [];
        if (teacher.assignedClass) {
          classesTaught.push(teacher.assignedClass);
        }
        if (teacher.assignedClasses && Array.isArray(teacher.assignedClasses)) {
          teacher.assignedClasses.forEach(c => {
            if (!classesTaught.map(id => id.toString()).includes(c.toString())) {
              classesTaught.push(c);
            }
          });
        }

        const students = await Student.find({ class: { $in: classesTaught } }).populate({
          path: 'parent',
          populate: { path: 'user' }
        });

        const addedIds = new Set();
        students.forEach(s => {
          if (s.parent && s.parent.user) {
            const parentUser = s.parent.user;
            if (!addedIds.has(parentUser._id.toString())) {
              addedIds.add(parentUser._id.toString());
              contacts.push({
                _id: parentUser._id,
                name: `${s.parent.fatherName} / ${s.parent.motherName} (Parent of ${s.name})`,
                role: 'parent'
              });
            }
          }
        });
      }

      // Add Principal
      const principalUser = await User.findOne({ role: 'principal' });
      if (principalUser) {
        contacts.push({
          _id: principalUser._id,
          name: 'Principal VIDYABHARATHI',
          role: 'principal'
        });
      }
    } else if (role === 'principal') {
      // Principal can chat with all teachers
      const teachers = await Teacher.find().populate('user');
      teachers.forEach(t => {
        if (t.user) {
          contacts.push({
            _id: t.user._id,
            name: `${t.name} (${t.qualification})`,
            role: 'teacher'
          });
        }
      });
    }

    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  getChatContacts
};
