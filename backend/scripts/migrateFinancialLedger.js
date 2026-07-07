require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Fee = require('../models/Fee');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Counter = require('../models/Counter');
const FinancialLedger = require('../models/FinancialLedger');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/vbv_school_db';

const migrate = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('Database connected successfully!');

    // 1. Migrate historic fee payments (Income)
    console.log('Migrating historic student fee payments...');
    const fees = await Fee.find().populate('student');
    let incomeCount = 0;

    for (const fee of fees) {
      if (!fee.student) continue;

      const student = fee.student;
      const classId = student.class;
      const parentId = student.parent;

      for (const payment of fee.payments) {
        if (!payment.receiptNumber) continue;

        // Check if transaction already exists in FinancialLedger
        const exists = await FinancialLedger.findOne({ receiptNumber: payment.receiptNumber });
        if (exists) {
          console.log(`Payment with receipt ${payment.receiptNumber} already exists in FinancialLedger. Skipping...`);
          continue;
        }

        // Determine category
        let categoryName = payment.category || 'Tuition Fee';

        const txnId = payment.transactionId || `TXN-MIG-INC-${payment._id.toString()}`;

        await FinancialLedger.create({
          transactionId: txnId,
          transactionType: 'Income',
          category: categoryName,
          amount: payment.amount,
          paymentMode: payment.paymentMethod || 'Cash',
          receiptNumber: payment.receiptNumber,
          student: student._id,
          parent: parentId,
          class: classId,
          academicYear: fee.academicYear || '2026-27',
          description: `Migrated Fee: ${categoryName} for student ${student.name} (${student.rollNumber || 'PENDING'})`,
          referenceId: payment._id.toString(),
          createdBy: payment.collectedBy || 'SYSTEM',
          remarks: 'Migrated from historic Fee Ledger payments'
        });

        incomeCount++;
      }
    }
    console.log(`Migrated ${incomeCount} fee payments into FinancialLedger.`);

    // 2. Migrate historic teacher salary payments (Expense)
    console.log('Migrating historic teacher salary payments...');
    const teachers = await Teacher.find();
    let expenseCount = 0;
    const currentYear = new Date().getFullYear();

    for (const teacher of teachers) {
      for (const payment of teacher.salaryPayments) {
        // Check if salary payment already migrated
        const exists = await FinancialLedger.findOne({ referenceId: payment._id.toString() });
        if (exists) {
          console.log(`Salary payment to ${teacher.name} for ${payment.salaryMonth} already exists. Skipping...`);
          continue;
        }

        // Voucher number generation (fallback if referenceNumber doesn't hold one)
        let voucherNum = payment.referenceNumber;
        if (!voucherNum || !voucherNum.startsWith('VCHR-SAL-')) {
          const counter = await Counter.findOneAndUpdate(
            { _id: `voucher-salary-${currentYear}` },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
          );
          voucherNum = `VCHR-SAL-${currentYear}-${String(counter.seq).padStart(6, '0')}`;
          
          // Back-save generated voucher number to teacher's record
          payment.referenceNumber = voucherNum;
        }

        const txnId = `TXN-MIG-EXP-${payment._id.toString()}`;

        await FinancialLedger.create({
          transactionId: txnId,
          transactionType: 'Expense',
          category: 'Teacher Salary',
          amount: payment.amount,
          paymentMode: payment.paymentMethod || 'Bank Transfer',
          voucherNumber: voucherNum,
          teacher: teacher._id,
          academicYear: '2026-27',
          description: `Migrated Salary payment to ${teacher.name} for ${payment.salaryMonth}`,
          referenceId: payment._id.toString(),
          createdBy: payment.paidBy || 'SYSTEM',
          remarks: 'Migrated from historic Teacher salary payments'
        });

        expenseCount++;
      }
      
      // Save changes to teachers if we modified reference numbers
      await teacher.save();
    }
    console.log(`Migrated ${expenseCount} salary payments into FinancialLedger.`);

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
};

migrate();
