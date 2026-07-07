const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Fee = require('../models/Fee');
const { calculateDynamicLedger } = require('../utils/feeLedgerCalculator');

async function runCleanup() {
  console.log('Connecting to database...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected.');

  const studentId = '6a4792789ec9a151bd4c3e74';
  const fee = await Fee.findOne({ student: studentId });

  if (fee) {
    console.log(`Original fee payments count: ${fee.payments.length}`);
    const originalPaid = fee.paidAmount;
    
    // Filter out the failed test receipts
    fee.payments = fee.payments.filter(p => p.receiptNumber !== 'RCPT-2026-000006' && p.receiptNumber !== 'RCPT-2026-000007');
    
    // Recalculate
    const updated = calculateDynamicLedger(fee);
    fee.totalAmount = updated.totalAmount;
    fee.paidAmount = updated.paidAmount;
    fee.balanceAmount = updated.balanceAmount;

    await fee.save();
    console.log(`Updated fee payments count: ${fee.payments.length}`);
    console.log(`Fee paidAmount restored from ₹${originalPaid} to ₹${fee.paidAmount}`);
  } else {
    console.log('Fee ledger not found for student.');
  }

  await mongoose.disconnect();
  console.log('Done.');
}

runCleanup().catch(console.error);
