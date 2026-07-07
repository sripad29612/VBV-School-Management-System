require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Fee = require('../models/Fee');
const Student = require('../models/Student');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { calculateDynamicLedger } = require('../utils/feeLedgerCalculator');

const runFeeReminders = async () => {
  try {
    console.log('Connecting to database for fee reminders...');
    await connectDB();

    const today = new Date();
    
    // Tomorrow dates
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStart = new Date(tomorrow.setHours(0, 0, 0, 0));
    const tomorrowEnd = new Date(tomorrow.setHours(23, 59, 59, 999));

    // Find all admin users to get a default sender ID
    const defaultAdmin = await User.findOne({ role: 'admin' });
    const senderId = defaultAdmin ? defaultAdmin._id : null;

    if (!senderId) {
      console.error('No admin user found to send notifications. Exiting.');
      await mongoose.connection.close();
      process.exit(1);
    }

    const fees = await Fee.find().populate({
      path: 'student',
      populate: { path: 'class' }
    });

    console.log(`Scanning ${fees.length} fee ledgers...`);

    let notificationsCount = 0;

    for (const fee of fees) {
      if (!fee.student) continue;
      
      const student = fee.student;
      const calculatedFee = calculateDynamicLedger(fee);
      let ledgerUpdated = false;

      for (const inst of calculatedFee.installments) {
        if (inst.status === 'Paid') continue;

        const dueDate = new Date(inst.dueDate);
        const dueLimit = new Date(dueDate);
        dueLimit.setDate(dueLimit.getDate() + (inst.gracePeriod || 0));

        // 1. Check Due Tomorrow
        if (dueDate >= tomorrowStart && dueDate <= tomorrowEnd) {
          // Send notification if not already sent
          const msg = `Installment ${inst.name} of ₹${(inst.amount + (inst.status === 'Overdue' ? (inst.lateFee || 0) : 0) - (inst.discount || 0)).toLocaleString()} is due tomorrow (${dueDate.toLocaleDateString('en-GB')}).`;
          const exists = await Notification.findOne({
            title: 'Installment Due Tomorrow',
            message: msg,
            recipientRole: 'parent',
            class: student.class?._id || student.class
          });

          if (!exists) {
            await Notification.create({
              title: 'Installment Due Tomorrow',
              message: msg,
              recipientRole: 'parent',
              class: student.class?._id || student.class,
              type: 'Fee',
              sender: senderId
            });
            await Notification.create({
              title: 'Installment Due Tomorrow',
              message: msg,
              recipientRole: 'student',
              class: student.class?._id || student.class,
              type: 'Fee',
              sender: senderId
            });
            console.log(`Sent Due Tomorrow notification for student: ${student.name}, installment: ${inst.name}`);
            notificationsCount += 2;
          }
        }

        // 2. Check Overdue
        if (today > dueLimit) {
          const msg = `Installment ${inst.name} of ₹${(inst.amount + (inst.lateFee || 0) - (inst.discount || 0)).toLocaleString()} is Overdue. Due Date was ${dueDate.toLocaleDateString('en-GB')}.`;
          const exists = await Notification.findOne({
            title: 'Installment Overdue',
            message: msg,
            recipientRole: 'parent',
            class: student.class?._id || student.class
          });

          if (!exists) {
            await Notification.create({
              title: 'Installment Overdue',
              message: msg,
              recipientRole: 'parent',
              class: student.class?._id || student.class,
              type: 'Fee',
              sender: senderId
            });
            await Notification.create({
              title: 'Installment Overdue',
              message: msg,
              class: student.class?._id || student.class,
              recipientRole: 'student',
              type: 'Fee',
              sender: senderId
            });
            console.log(`Sent Overdue notification for student: ${student.name}, installment: ${inst.name}`);
            notificationsCount += 2;
          }
        }
      }

      // Check if ledger overall totalAmount changed (e.g. late fee active status changed)
      if (Math.abs(fee.totalAmount - calculatedFee.totalAmount) > 0.01) {
        fee.totalAmount = calculatedFee.totalAmount;
        fee.balanceAmount = calculatedFee.balanceAmount;
        await fee.save();
        console.log(`Updated ledger totals for student: ${student.name}`);
      }
    }

    console.log(`Completed reminder checks. Total notifications created: ${notificationsCount}`);
    await mongoose.connection.close();
    console.log('Database connection closed. Exiting.');
    process.exit(0);
  } catch (error) {
    console.error('Error running fee reminders job:', error);
    try {
      await mongoose.connection.close();
    } catch (e) {}
    process.exit(1);
  }
};

runFeeReminders();
