const mongoose = require('mongoose');
const FinancialLedger = require('../models/FinancialLedger');
const Fee = require('../models/Fee');
const Teacher = require('../models/Teacher');
const { calculateDynamicLedger } = require('./feeLedgerCalculator');

/**
 * Returns clean start/end date boundaries for today, current month, current year
 */
const getDateBoundaries = (selectedMonth = null) => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  // Today boundaries
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  // Month boundaries (current or selected)
  const targetMonth = selectedMonth !== null ? Number(selectedMonth) : currentMonth;
  const monthStart = new Date(currentYear, targetMonth, 1);
  const monthEnd = new Date(currentYear, targetMonth + 1, 1);

  // Year boundaries
  const yearStart = new Date(currentYear, 0, 1);
  const yearEnd = new Date(currentYear + 1, 0, 1);

  return {
    todayStart,
    todayEnd,
    monthStart,
    monthEnd,
    yearStart,
    yearEnd,
    currentMonth,
    currentYear
  };
};

/**
 * Calculates student fee statistics dynamically using calculateDynamicLedger
 */
const getFeeStats = async () => {
  const fees = await Fee.find().populate({
    path: 'student',
    populate: { path: 'class' }
  });

  let expectedRevenue = 0;
  let outstandingAmount = 0;
  let fullyPaidCount = 0;
  let pendingCount = 0;

  fees.forEach(fDoc => {
    const ledger = calculateDynamicLedger(fDoc);
    expectedRevenue += ledger.totalAmount;
    outstandingAmount += ledger.balanceAmount;

    if (ledger.balanceAmount <= 0.01 && ledger.paidAmount > 0) {
      fullyPaidCount++;
    } else {
      pendingCount++;
    }
  });

  return {
    expectedRevenue,
    outstandingAmount, // Outstanding Amount = Pending Fee Collection
    pendingFeeCollection: outstandingAmount,
    fullyPaidCount,
    pendingCount
  };
};

/**
 * Calculates teacher pending salaries for the current month cycle
 */
const getPendingSalariesStats = async () => {
  const today = new Date();
  const currentMonthName = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const teachers = await Teacher.find();
  let pendingSalaries = 0;

  teachers.forEach(t => {
    const monthPayments = (t.salaryPayments || []).filter(p => p.salaryMonth === currentMonthName);
    const alreadyPaid = monthPayments.reduce((sum, p) => sum + p.amount, 0);
    pendingSalaries += Math.max(0, t.totalSalary - alreadyPaid);
  });

  return pendingSalaries;
};

/**
 * Main function to retrieve general financial dashboard statistics
 */
const getUnifiedDashboardStats = async () => {
  const bounds = getDateBoundaries();
  
  // 1. Live calculations from Financial Ledger
  const txns = await FinancialLedger.find({ isCancelled: false });
  
  let todayIncome = 0;
  let todayExpense = 0;
  let monthlyIncome = 0;
  let monthlyExpense = 0;
  let yearlyIncome = 0;
  let yearlyExpense = 0;
  let totalIncome = 0;
  let totalExpense = 0;

  txns.forEach(t => {
    const tDate = new Date(t.createdAt);
    const isToday = tDate >= bounds.todayStart && tDate < bounds.todayEnd;
    const isThisMonth = tDate >= bounds.monthStart && tDate < bounds.monthEnd;
    const isThisYear = tDate >= bounds.yearStart && tDate < bounds.yearEnd;

    if (t.transactionType === 'Income') {
      totalIncome += t.amount;
      if (isToday) todayIncome += t.amount;
      if (isThisMonth) monthlyIncome += t.amount;
      if (isThisYear) yearlyIncome += t.amount;
    } else if (t.transactionType === 'Expense') {
      totalExpense += t.amount;
      if (isToday) todayExpense += t.amount;
      if (isThisMonth) monthlyExpense += t.amount;
      if (isThisYear) yearlyExpense += t.amount;
    }
  });

  // 2. Student fee collections statistics
  const feeStats = await getFeeStats();

  // 3. Teacher salary statistics
  const pendingSalaries = await getPendingSalariesStats();

  return {
    todayIncome,
    todayExpense,
    todayNetCollection: todayIncome - todayExpense,
    monthlyIncome,
    monthlyExpense,
    monthlyNetIncome: monthlyIncome - monthlyExpense,
    yearlyIncome,
    yearlyExpense,
    yearlyNetIncome: yearlyIncome - yearlyExpense,
    totalIncome,
    totalExpense,
    netIncome: totalIncome - totalExpense,
    
    // Fee properties
    ...feeStats,
    
    // Salaries
    pendingSalaries,
    
    // Legacy support keys
    todayCollection: todayIncome,
    monthlyCollection: monthlyIncome,
    totalCollection: totalIncome,
    pendingFees: feeStats.outstandingAmount,
    totalExpected: feeStats.expectedRevenue
  };
};

module.exports = {
  getDateBoundaries,
  getFeeStats,
  getPendingSalariesStats,
  getUnifiedDashboardStats
};
