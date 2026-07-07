const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const Parent = require('../models/Parent');
const Teacher = require('../models/Teacher');

// Generate JWT token helper
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'vbv_super_secret_key_9948370709_9948369209', {
    expiresIn: '30d'
  });
};

// @desc    Auth Student & get token
// @route   POST /api/auth/login/student
// @access  Public
const loginStudent = async (req, res) => {
  const { rollNumber, password } = req.body;

  if (!rollNumber || !password) {
    return res.status(400).json({ message: 'Please provide roll number and password' });
  }

  try {
    const user = await User.findOne({ rollNumber, role: 'student' });
    if (!user) {
      return res.status(404).json({ message: 'Student account not found. Please contact the school administration.' });
    }
    if (await user.comparePassword(password)) {
      // Find full student details
      const student = await Student.findOne({ user: user._id }).populate('class');
      res.json({
        _id: user._id,
        rollNumber: user.rollNumber,
        role: user.role,
        token: generateToken(user._id),
        details: student
      });
    } else {
      res.status(401).json({ message: 'Invalid Roll Number or Password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth Parent & get token
// @route   POST /api/auth/login/parent
// @access  Public
const loginParent = async (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ message: 'Please provide mobile number and password' });
  }

  try {
    const user = await User.findOne({ phone, role: 'parent' });
    if (!user) {
      return res.status(404).json({ message: 'Parent account not found.' });
    }
    if (await user.comparePassword(password)) {
      // Find full parent details
      const parent = await Parent.findOne({ user: user._id }).populate({
        path: 'children',
        populate: { path: 'class' }
      });
      res.json({
        _id: user._id,
        phone: user.phone,
        role: user.role,
        token: generateToken(user._id),
        details: parent
      });
    } else {
      res.status(401).json({ message: 'Invalid Phone Number or Password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth Teacher & get token
// @route   POST /api/auth/login/teacher
// @access  Public
const loginTeacher = async (req, res) => {
  const { teacherId, password } = req.body;

  if (!teacherId || !password) {
    return res.status(400).json({ message: 'Please provide Teacher ID and password' });
  }

  try {
    const user = await User.findOne({ teacherId, role: 'teacher' });
    if (!user) {
      return res.status(404).json({ message: 'Teacher account not found. Please contact the Administrator.' });
    }
    if (await user.comparePassword(password)) {
      // Find full teacher details
      const teacher = await Teacher.findOne({ user: user._id }).populate('assignedClass');
      res.json({
        _id: user._id,
        teacherId: user.teacherId,
        role: user.role,
        token: generateToken(user._id),
        details: teacher
      });
    } else {
      res.status(401).json({ message: 'Invalid Teacher ID or Password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth Principal & get token
// @route   POST /api/auth/login/principal
// @access  Public
const loginPrincipal = async (req, res) => {
  const { username, password } = req.body;
  const mongoose = require('mongoose');

  console.log(`[AUTH-FLOW] Starting Principal login for username: "${username}"`);
  
  const dbName = mongoose.connection.db ? mongoose.connection.db.databaseName : 'unknown';
  console.log(`[AUTH-FLOW] Step 1: Connected to MongoDB database: "${dbName}"`);

  if (!username || !password) {
    console.log('[AUTH-FLOW] Error: Missing username or password');
    return res.status(400).json({ message: 'Please provide username and password' });
  }

  try {
    const Principal = require('../models/Principal');
    
    console.log(`[AUTH-FLOW] Step 2: Querying Principal collection for employeeId: "${username}" or email: "${username.toLowerCase()}"`);
    const principalObj = await Principal.findOne({
      $or: [
        { employeeId: username },
        { email: username.toLowerCase() }
      ],
      isDeleted: { $ne: true }
    });

    if (principalObj) {
      console.log(`[AUTH-FLOW] Step 3: Principal document found. ID: ${principalObj._id}, status: "${principalObj.status}", userField: ${principalObj.user}`);
      
      if (principalObj.status === 'Pending Approval') {
        console.log('[AUTH-FLOW] Login rejected: Account is awaiting Administrator approval.');
        return res.status(403).json({ message: 'Your account is awaiting Administrator approval.' });
      }
      if (principalObj.status === 'Rejected') {
        console.log('[AUTH-FLOW] Login rejected: Account has been rejected.');
        return res.status(403).json({ message: 'Your Principal account has been rejected. Please contact the Administrator.' });
      }
      if (principalObj.status === 'Suspended') {
        console.log('[AUTH-FLOW] Login rejected: Account is suspended.');
        return res.status(403).json({ message: 'Your account has been suspended.' });
      }

      if (principalObj.status === 'Approved') {
        if (!principalObj.user) {
          console.log('[AUTH-FLOW] Failure: Principal is approved but has no associated user account ID.');
          return res.status(401).json({ message: 'Principal account is approved but lacks an associated User document' });
        }
        
        console.log(`[AUTH-FLOW] Step 4: Querying User collection by ID: ${principalObj.user}`);
        const user = await User.findById(principalObj.user);
        if (!user) {
          console.log('[AUTH-FLOW] Failure: Associated User document not found in database.');
          return res.status(401).json({ message: 'Associated principal User account not found in database' });
        }

        console.log(`[AUTH-FLOW] Step 5: Comparing entered password with stored hash: "${user.password}"`);
        const isMatch = await user.comparePassword(password);
        console.log(`[AUTH-FLOW] bcrypt.compare() returned: ${isMatch}`);

        if (isMatch) {
          console.log('[AUTH-FLOW] Step 6: Generating JWT token.');
          const token = generateToken(user._id);
          if (token) {
            console.log('[AUTH-FLOW] Login successful! JWT generation succeeded.');
            return res.json({
              _id: user._id,
              username: user.username,
              role: user.role,
              token: token
            });
          } else {
            console.log('[AUTH-FLOW] Error: JWT generation returned empty token.');
            return res.status(500).json({ message: 'JWT generation failed' });
          }
        } else {
          console.log('[AUTH-FLOW] Failure: Password verification failed.');
          return res.status(401).json({ message: 'Password verification failed. Incorrect password.' });
        }
      }
      
      console.log(`[AUTH-FLOW] Failure: Principal status is "${principalObj.status}"`);
      return res.status(401).json({ message: `Principal account status is ${principalObj.status}` });
    }

    console.log(`[AUTH-FLOW] Step 7: Principal document NOT found. Searching User collection directly for username: "${username.toUpperCase()}" with role "principal"`);
    const user = await User.findOne({ username: username.toUpperCase(), role: 'principal' });
    if (!user) {
      console.log('[AUTH-FLOW] Failure: Principal User account not found by username.');
      return res.status(404).json({ message: 'Principal account has not been created or matching Principal ID does not exist.' });
    }

    console.log(`[AUTH-FLOW] Step 8: User document found by username. ID: ${user._id}. Comparing entered password with stored hash: "${user.password}"`);
    const isMatch = await user.comparePassword(password);
    console.log(`[AUTH-FLOW] bcrypt.compare() returned: ${isMatch}`);

    if (isMatch) {
      console.log('[AUTH-FLOW] Step 9: Generating JWT token.');
      const token = generateToken(user._id);
      if (token) {
        console.log('[AUTH-FLOW] Login successful! JWT generation succeeded.');
        return res.json({
          _id: user._id,
          username: user.username,
          role: user.role,
          token: token
        });
      } else {
        console.log('[AUTH-FLOW] Error: JWT generation returned empty token.');
        return res.status(500).json({ message: 'JWT generation failed' });
      }
    } else {
      console.log('[AUTH-FLOW] Failure: Password verification failed.');
      return res.status(401).json({ message: 'Password verification failed. Incorrect password.' });
    }
  } catch (error) {
    console.error('[AUTH-FLOW] Exception caught:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth Admin & get token
// @route   POST /api/auth/login/admin
// @access  Public
const loginAdmin = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Please provide username and password' });
  }

  try {
    // 1. Check if the credential belongs to any non-admin role
    const anyUser = await User.findOne({
      $or: [
        { username: username.toLowerCase() },
        { username: username.toUpperCase() },
        { rollNumber: username.toUpperCase() },
        { teacherId: username.toUpperCase() },
        { phone: username }
      ]
    });

    if (anyUser && anyUser.role !== 'admin') {
      return res.status(403).json({ message: 'Access Denied. Administrator Account Required.' });
    }

    // 2. Auth Admin
    const user = await User.findOne({ username: username.toLowerCase(), role: 'admin' });
    if (user && (await user.comparePassword(password))) {
      res.json({
        _id: user._id,
        username: user.username,
        role: user.role,
        token: generateToken(user._id),
        details: {
          name: 'Ramanujam Acharya',
          employeeId: 'ADM001',
          designation: 'Chief Administrator'
        }
      });
    } else {
      res.status(401).json({ message: 'Invalid Admin Credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  loginStudent,
  loginParent,
  loginTeacher,
  loginPrincipal,
  loginAdmin
};
