const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const FinancialLedger = require('../models/FinancialLedger');
const Fee = require('../models/Fee');
const Teacher = require('../models/Teacher');
const { calculateDynamicLedger } = require('../utils/feeLedgerCalculator');

async function runReconciliation() {
  console.log('Connecting to database...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB Connected.');

  // 1. Calculations from FinancialLedger
  console.log('\n--- Auditing Financial Ledger ---');
  const ledgers = await FinancialLedger.find({ isCancelled: false });
  let totalIncome = 0;
  let totalExpense = 0;
  let ledgerIncomeCount = 0;
  let ledgerExpenseCount = 0;

  ledgers.forEach(t => {
    if (t.transactionType === 'Income') {
      totalIncome += t.amount;
      ledgerIncomeCount++;
    } else if (t.transactionType === 'Expense') {
      totalExpense += t.amount;
      ledgerExpenseCount++;
    }
  });

  const netIncome = totalIncome - totalExpense;
  console.log(`Total Income (Ledger): ₹${totalIncome.toLocaleString()} (${ledgerIncomeCount} txns)`);
  console.log(`Total Expenses (Ledger): ₹${totalExpense.toLocaleString()} (${ledgerExpenseCount} txns)`);
  console.log(`Net Income (Ledger): ₹${netIncome.toLocaleString()}`);

  // 2. Calculations from Student Fee Ledgers
  console.log('\n--- Auditing Student Fee Ledgers ---');
  const fees = await Fee.find();
  let totalFeeBalance = 0;
  let totalFeeExpected = 0;
  let totalFeePaid = 0;
  let receiptPaymentsSum = 0;
  let totalReceiptCount = 0;
  let receiptNumbers = new Set();
  let duplicateReceipts = [];

  fees.forEach(fDoc => {
    const f = calculateDynamicLedger(fDoc);
    totalFeeBalance += f.balanceAmount;
    totalFeeExpected += f.totalAmount;
    totalFeePaid += f.paidAmount;

    if (f.payments) {
      f.payments.forEach(p => {
        receiptPaymentsSum += p.amount;
        totalReceiptCount++;
        if (p.receiptNumber) {
          if (receiptNumbers.has(p.receiptNumber)) {
            duplicateReceipts.push(p.receiptNumber);
          }
          receiptNumbers.add(p.receiptNumber);
        }
      });
    }
  });

  console.log(`Expected Revenue (Fee.totalAmount): ₹${totalFeeExpected.toLocaleString()}`);
  console.log(`Outstanding Amount (Fee.balanceAmount): ₹${totalFeeBalance.toLocaleString()}`);
  console.log(`Total Paid (Fee.paidAmount): ₹${totalFeePaid.toLocaleString()}`);
  console.log(`Sum of payments in Fee ledgers: ₹${receiptPaymentsSum.toLocaleString()} (${totalReceiptCount} receipts)`);

  // 3. Receipt to Income Ledger Reconciliation
  console.log('\n--- Auditing Receipts to Ledger Income Reconciliation ---');
  let matchedCount = 0;
  let unmatchedReceipts = [];
  
  for (const fDoc of fees) {
    const f = calculateDynamicLedger(fDoc);
    if (f.payments) {
      for (const p of f.payments) {
        if (p.receiptNumber) {
          const ledgerEntry = await FinancialLedger.findOne({
            receiptNumber: p.receiptNumber,
            isCancelled: false
          });
          if (ledgerEntry) {
            matchedCount++;
          } else {
            unmatchedReceipts.push({
              receiptNumber: p.receiptNumber,
              amount: p.amount,
              student: fDoc.student
            });
          }
        }
      }
    }
  }

  console.log(`Successfully matched receipts to FinancialLedger Income entries: ${matchedCount} / ${totalReceiptCount}`);
  if (unmatchedReceipts.length > 0) {
    console.log(`[WARNING] Unmatched/Orphan receipts found: ${unmatchedReceipts.length}`);
    unmatchedReceipts.forEach(r => {
      console.log(`  - Receipt: ${r.receiptNumber}, Amount: ₹${r.amount}, Student ID: ${r.student}`);
    });
  } else {
    console.log('✅ No orphan receipts. Every active payment has a matching FinancialLedger Income entry.');
  }

  // 4. Duplicate checks
  console.log('\n--- Duplicate Integrity Audit ---');
  // Check ledger duplicates by referenceId
  const allLedgerTxns = await FinancialLedger.find();
  let refIds = new Set();
  let duplicateRefs = [];
  allLedgerTxns.forEach(t => {
    if (t.referenceId && t.referenceId.trim() !== '') {
      if (refIds.has(t.referenceId)) {
        duplicateRefs.push({ refId: t.referenceId, id: t._id, type: t.transactionType });
      }
      refIds.add(t.referenceId);
    }
  });

  if (duplicateReceipts.length > 0) {
    console.log(`[WARNING] Duplicate receipt numbers found: ${duplicateReceipts.join(', ')}`);
  } else {
    console.log('✅ No duplicate receipt numbers.');
  }

  if (duplicateRefs.length > 0) {
    console.log(`[WARNING] Duplicate ledger referenceIds found:`);
    duplicateRefs.forEach(d => {
      console.log(`  - RefId: ${d.refId}, Type: ${d.type}, Entry ID: ${d.id}`);
    });
  } else {
    console.log('✅ No duplicate referenceId ledger transactions.');
  }

  // Check duplicate teacher salaries
  const teachers = await Teacher.find();
  let duplicateSalaries = [];
  teachers.forEach(t => {
    const months = new Set();
    (t.salaryPayments || []).forEach(p => {
      if (p.salaryMonth) {
        if (months.has(p.salaryMonth)) {
          duplicateSalaries.push({ teacher: t.name, month: p.salaryMonth });
        }
        months.add(p.salaryMonth);
      }
    });
  });

  if (duplicateSalaries.length > 0) {
    console.log(`[WARNING] Duplicate salary records found:`);
    duplicateSalaries.forEach(d => {
      console.log(`  - Teacher: ${d.teacher}, Month: ${d.month}`);
    });
  } else {
    console.log('✅ No duplicate teacher salary records.');
  }

  // 5. Date boundaries check
  console.log('\n--- Date Boundaries Check ---');
  const todayStart = new Date();
  todayStart.setHours(0,0,0,0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const todayIncomeTxns = await FinancialLedger.find({
    transactionType: 'Income',
    isCancelled: false,
    createdAt: { $gte: todayStart, $lt: todayEnd }
  });
  console.log(`Today's Ledger Income: ₹${todayIncomeTxns.reduce((sum, t) => sum + t.amount, 0).toLocaleString()} (${todayIncomeTxns.length} txns)`);

  console.log('\n--- Final Reconciliation Check ---');
  let errors = [];
  if (Math.abs(totalIncome - receiptPaymentsSum) > 0.01) {
    errors.push(`Ledger Income (₹${totalIncome}) does not match receipt payment sum (₹${receiptPaymentsSum})`);
  }
  if (duplicateReceipts.length > 0) {
    errors.push('Found duplicate receipt numbers');
  }
  if (duplicateRefs.length > 0) {
    errors.push('Found duplicate reference ID entries in FinancialLedger');
  }
  if (unmatchedReceipts.length > 0) {
    errors.push('Found orphan receipts with no ledger entries');
  }

  if (errors.length > 0) {
    console.log('❌ RECONCILIATION FAILED WITH ERRORS:');
    errors.forEach(e => console.log(`  - ${e}`));
  } else {
    console.log('✅ FINANCIAL RECONCILIATION SUCCESSFUL. ALL INTEGRITY CHECKS PASSED.');
  }

  await mongoose.disconnect();
  console.log('\nDisconnected from database.');
}

runReconciliation().catch(err => {
  console.error(err);
  process.exit(1);
});
