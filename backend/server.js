require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { triggerAllClassroomsSnapshots } = require('./controllers/snapshotController');

// Import routes
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const parentRoutes = require('./routes/parentRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const principalRoutes = require('./routes/principalRoutes');
const adminRoutes = require('./routes/adminRoutes');
const chatRoutes = require('./routes/chatRoutes');
const snapshotRoutes = require('./routes/snapshotRoutes');
const enquiryRoutes = require('./routes/enquiryRoutes');
const dailyReportRoutes = require('./routes/dailyReportRoutes');

// Connect to Database
db().then(async () => {
  const initializeAdmin = require('./services/initializeAdmin');
  await initializeAdmin();
  const initializeSubjects = require('./services/initializeSubjects');
  await initializeSubjects();
});

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Set up public static asset directory
// Allows serving the school logo, homework attachments, and snapshots
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
app.use(express.static(publicDir));

// Connect routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/parent', parentRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/principal', principalRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/snapshots', snapshotRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/daily-reports', dailyReportRoutes);

// Simple verification endpoint
app.get('/', (req, res) => {
  res.json({ message: 'VIDYA BHARATHI VIDYAPEETH School Management API is Running!' });
});

// Classroom Snapshots automated intervals: Every 5 minutes
// For demo purposes, check every 5 minutes and capture if within hours
setInterval(() => {
  // Silent capture call
  triggerAllClassroomsSnapshots().catch(err => console.error('Automated snapshot capture error:', err));
}, 5 * 60 * 1000);

// Error Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
