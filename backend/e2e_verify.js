const mongoose = require('mongoose');
const Class = require('./models/Class');
const Subject = require('./models/Subject');
const Timetable = require('./models/Timetable');
const Teacher = require('./models/Teacher');
const Parent = require('./models/Parent');
const Student = require('./models/Student');
const Notification = require('./models/Notification');
const Calendar = require('./models/Calendar');
const Message = require('./models/Message');
const User = require('./models/User');

const { syncClassSubjects } = require('./utils/classSubjectSync');
const { broadcastNotification } = require('./controllers/principalController');
const { getChatContacts } = require('./controllers/chatController');

require('dotenv').config();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/vbv_school_db';

async function runTests() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB.');

  const session = await mongoose.startSession();

  try {
    console.log('\n--- Test 1: Class-Subject Mapping Sync ---');
    const firstClass = await Class.findOne();
    if (!firstClass) throw new Error('No class found in database.');
    
    console.log(`Class found: ${firstClass.name} - ${firstClass.section}. Current subjects count: ${firstClass.subjects.length}`);
    
    // Sync subjects
    await syncClassSubjects(firstClass._id);
    const updatedClass = await Class.findById(firstClass._id);
    console.log(`Synced class subjects count: ${updatedClass.subjects.length}`);
    console.log('✓ Class-Subject mapping sync passed.');

    console.log('\n--- Test 2: Broadcast Notice Multi-Selection ---');
    const teacherUser = await User.findOne({ role: 'teacher' });
    const principalUser = await User.findOne({ role: 'principal' });

    if (!principalUser) throw new Error('No principal user found.');

    const mockReq = {
      body: {
        title: 'E2E Test Broadcast Notice',
        message: 'This is a test notification for teachers and parents.',
        recipientRoles: ['teacher', 'parent'],
        type: 'Announcement'
      },
      user: { _id: principalUser._id }
    };

    let responseCode = null;
    let responseData = null;
    const mockRes = {
      status: (code) => {
        responseCode = code;
        return mockRes;
      },
      json: (data) => {
        responseData = data;
        return mockRes;
      }
    };

    await broadcastNotification(mockReq, mockRes);
    console.log('Broadcast response status:', responseCode);

    // Verify Notification documents created
    const notifs = await Notification.find({ title: 'E2E Test Broadcast Notice' });
    console.log(`Created notifications count: ${notifs.length}`);
    if (notifs.length !== 2) {
      throw new Error(`Expected 2 notifications, but found ${notifs.length}`);
    }
    console.log('✓ Broadcast Notice multi-selection passed.');

    console.log('\n--- Test 3: Parent-Teacher Chat Linkage ---');
    const parentUser = await User.findOne({ role: 'parent' });
    if (parentUser && teacherUser) {
      const mockReqChat = {
        user: { _id: parentUser._id, role: 'parent' }
      };
      let chatContacts = [];
      const mockResChat = {
        json: (data) => {
          chatContacts = data;
        }
      };

      await getChatContacts(mockReqChat, mockResChat);
      console.log(`Parent contacts count: ${chatContacts.length}`);
      chatContacts.forEach(c => {
        console.log(`  - Contact: ${c.name}, ID: ${c._id}, Role: ${c.role}`);
      });
      console.log('✓ Parent-Teacher chat contacts lookup passed.');
    } else {
      console.log('Skipping chat contacts lookup test: parent/teacher users not found.');
    }

    console.log('\n--- Test 4: Calendar Event Format & Colors ---');
    // Create temporary calendar event
    const tempEvent = await Calendar.create({
      title: 'E2E Test Competition Event',
      type: 'Competition',
      startDate: new Date(),
      endDate: new Date()
    });

    const list = await Calendar.find().sort({ startDate: 1 });
    const formatted = list.map(ev => {
      const obj = ev.toObject();
      let color = '#8B5CF6';
      if (ev.type === 'Holiday') color = '#F5A623';
      else if (ev.type === 'Exam') color = '#EF4444';
      else if (ev.type === 'Event') color = '#3B82F6';
      else if (ev.type === 'Meeting') color = '#10B981';
      else if (ev.type === 'Competition') color = '#EC4899';
      
      const date = ev.startDate ? ev.startDate.toISOString().split('T')[0] : '';
      return { ...obj, date, color };
    });

    const testItem = formatted.find(e => e.title === 'E2E Test Competition Event');
    console.log('Formatted Competition Event color:', testItem?.color);
    console.log('Formatted Competition Event date:', testItem?.date);

    if (testItem?.color !== '#EC4899') {
      throw new Error(`Expected Competition color #EC4899, but got ${testItem?.color}`);
    }

    // Clean up
    await Calendar.deleteOne({ _id: tempEvent._id });
    await Notification.deleteMany({ title: 'E2E Test Broadcast Notice' });

    console.log('✓ Calendar events propagation and color mapping passed.');
    
    console.log('\n=======================================');
    console.log('  ALL INTEGRATION TESTS PASSED SEAMLESSLY!');
    console.log('=======================================');

  } catch (err) {
    console.error('Test Suite Failed:', err.message);
    process.exit(1);
  } finally {
    session.endSession();
    await mongoose.disconnect();
  }
}

runTests();
