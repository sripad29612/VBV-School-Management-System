const User = require('../models/User');

const initializeAdmin = async () => {
  if (process.env.AUTO_CREATE_ADMIN === 'false') {
    console.log('AUTO_CREATE_ADMIN is set to false. Skipping default Admin initialization.');
    return;
  }

  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      return;
    }

    await User.create({
      username: 'admin@vbv.edu',
      password: 'VBV@admin2026',
      role: 'admin'
    });
    console.log('Default Administrator account initialized successfully (admin@vbv.edu / VBV@admin2026).');
  } catch (err) {
    console.error('Error during default Admin initialization:', err.message);
  }
};

module.exports = initializeAdmin;
