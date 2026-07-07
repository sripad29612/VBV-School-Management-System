require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Fee = require('./models/Fee');
const Student = require('./models/Student');
const Class = require('./models/Class');
const FeeInstallmentPlan = require('./models/FeeInstallmentPlan');
const { calculateDynamicLedger } = require('./utils/feeLedgerCalculator');

const migrateFees = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();

    console.log('Fetching all student fee ledgers...');
    const fees = await Fee.find().populate({
      path: 'student',
      populate: { path: 'class' }
    });

    console.log(`Found ${fees.length} ledgers to process.`);

    let updatedCount = 0;

    for (const fee of fees) {
      if (!fee.student || !fee.student.class) {
        console.log(`Skipping ledger ${fee._id} - student or class not populated.`);
        continue;
      }

      const className = fee.student.class.name;
      const academicYear = fee.academicYear;

      console.log(`Processing ledger for student ${fee.student.name} (${className}, ${academicYear})...`);

      // Find installment plan template if needed
      const template = await FeeInstallmentPlan.findOne({
        className,
        academicYear
      });

      let ledgerModified = false;

      for (const inst of fee.installments) {
        // If breakdown expected is missing or empty, copy it
        const hasBreakdown = inst.breakdown && Object.values(inst.breakdown).some(v => v > 0);
        if (!hasBreakdown && template) {
          const tempInst = template.installments.find(ti => ti.name === inst.name);
          if (tempInst && tempInst.breakdown) {
            inst.breakdown = {
              admission: Number(tempInst.breakdown.admission) || 0,
              tuition: Number(tempInst.breakdown.tuition) || 0,
              books: Number(tempInst.breakdown.books) || 0,
              hostel: Number(tempInst.breakdown.hostel) || 0,
              transport: Number(tempInst.breakdown.transport) || 0,
              uniform: Number(tempInst.breakdown.uniform) || 0,
              exam: Number(tempInst.breakdown.exam) || 0,
              other: Number(tempInst.breakdown.other) || 0
            };
            ledgerModified = true;
            console.log(`Copied expected breakdown for installment ${inst.name}`);
          }
        }
      }

      // Recalculate dynamic totals and save back to database
      const updatedLedger = calculateDynamicLedger(fee);
      
      // Update DB totals for consistency
      if (Math.abs(fee.totalAmount - updatedLedger.totalAmount) > 0.01 || 
          Math.abs(fee.paidAmount - updatedLedger.paidAmount) > 0.01 || 
          Math.abs(fee.balanceAmount - updatedLedger.balanceAmount) > 0.01 || 
          ledgerModified) {
        fee.totalAmount = updatedLedger.totalAmount;
        fee.paidAmount = updatedLedger.paidAmount;
        fee.balanceAmount = updatedLedger.balanceAmount;
        
        await fee.save();
        updatedCount++;
        console.log(`Updated ledger totals for ${fee.student.name}: totalAmount=${fee.totalAmount}, paidAmount=${fee.paidAmount}, balanceAmount=${fee.balanceAmount}`);
      }
    }

    console.log(`Migration completed successfully. Updated ${updatedCount} out of ${fees.length} records.`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

migrateFees();
