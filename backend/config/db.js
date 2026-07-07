const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/vbv_school_db');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    try {
      await conn.connection.db.collection('feeinstallmentplans').dropIndex('className_1_academicYear_1');
      console.log('Successfully dropped old unique index from MongoDB.');
    } catch (e) {
      // Index might not exist or already dropped, ignore
    }
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    console.warn('Continuing without database connection. API routes that require MongoDB will fail until a valid MONGO_URI is configured.');
  }
};

module.exports = connectDB;
