const calculateDynamicLedger = (feeDoc) => {
  if (!feeDoc) return null;

  // Convert to plain object if it is a Mongoose document
  const fee = feeDoc.toObject ? feeDoc.toObject() : JSON.parse(JSON.stringify(feeDoc));

  const categories = ['admission', 'tuition', 'books', 'hostel', 'transport', 'uniform', 'exam', 'other'];
  const today = new Date();

  // 1. Tracks remaining paid amounts per category to distribute chronologically
  const remainingPaid = {};
  categories.forEach(cat => {
    remainingPaid[cat] = (fee.breakdown && fee.breakdown[cat] && fee.breakdown[cat].paid) || 0;
  });

  let totalActiveLateFee = 0;
  let totalDiscount = 0;

  // 2. Chronological allocation of category payments to installments
  const calculatedInstallments = (fee.installments || []).map(inst => {
    const instBreakdownPaid = {};
    let instPaidAmount = 0;

    const instDiscount = inst.discount || 0;
    totalDiscount += instDiscount;

    const baseTarget = Math.max(0, inst.amount - instDiscount);

    // Overdue check
    const dueDate = new Date(inst.dueDate);
    const dueLimit = new Date(dueDate);
    dueLimit.setDate(dueLimit.getDate() + (inst.gracePeriod || 0));
    const isOverdue = today > dueLimit;

    // 1. Calculate base paid amount (excluding late fee from 'other')
    let basePaidAmount = 0;
    categories.forEach(cat => {
      const expected = (inst.breakdown && inst.breakdown[cat]) || 0;
      let adjustedExpected = expected;
      if (cat === 'tuition') {
        adjustedExpected = Math.max(0, expected - instDiscount);
      }
      const allocated = Math.min(adjustedExpected, remainingPaid[cat]);
      basePaidAmount += allocated;
    });

    // 2. Late Fee logic
    let activeLateFee = 0;
    if (basePaidAmount < baseTarget && isOverdue) {
      activeLateFee = inst.lateFee || 0;
    } else if (basePaidAmount > baseTarget) {
      activeLateFee = basePaidAmount - baseTarget;
    }
    totalActiveLateFee += activeLateFee;

    // 3. Actual chronological allocation mapping
    categories.forEach(cat => {
      const expected = (inst.breakdown && inst.breakdown[cat]) || 0;
      let adjustedExpected = expected;
      if (cat === 'tuition') {
        adjustedExpected = Math.max(0, expected - instDiscount);
      }
      if (cat === 'other') {
        adjustedExpected = expected + activeLateFee;
      }
      const allocated = Math.min(adjustedExpected, remainingPaid[cat]);
      instBreakdownPaid[cat] = allocated;
      instPaidAmount += allocated;
      remainingPaid[cat] -= allocated;
    });

    const totalTarget = baseTarget + activeLateFee;
    const remainingAmount = Math.max(0, totalTarget - instPaidAmount);

    // Calculate Status
    let status = 'Upcoming';
    if (remainingAmount <= 0.01) {
      status = 'Paid';
    } else if (isOverdue) {
      status = 'Overdue';
    } else if (today > dueDate) {
      status = 'Pending';
    } else if (instPaidAmount > 0) {
      status = 'Partially Paid';
    } else {
      status = 'Upcoming';
    }

    // Determine completion percentage
    const percentage = totalTarget > 0 ? Math.round((instPaidAmount / totalTarget) * 100) : 100;

    // Determine paidDate dynamically (latest transaction date from global payments)
    let paidDate = undefined;
    if (status === 'Paid') {
      if (fee.payments && fee.payments.length > 0) {
        const dates = fee.payments.map(p => new Date(p.date).getTime());
        paidDate = new Date(Math.max(...dates));
      } else {
        paidDate = inst.dueDate;
      }
    }

    return {
      ...inst,
      paidAmount: instPaidAmount,
      remainingAmount,
      status,
      percentage,
      paidDate,
      breakdownPaid: instBreakdownPaid
    };
  });

  // 3. Construct dynamic category breakdown for the overall ledger
  const dynamicBreakdown = {};
  categories.forEach(cat => {
    let total = (fee.breakdown && fee.breakdown[cat] && fee.breakdown[cat].total) || 0;
    const paid = (fee.breakdown && fee.breakdown[cat] && fee.breakdown[cat].paid) || 0;

    // Adjust category totals for active late fees and discounts
    if (cat === 'other') {
      total += totalActiveLateFee;
    }
    if (cat === 'tuition') {
      total = Math.max(0, total - totalDiscount);
    }

    const remaining = Math.max(0, total - paid);
    let status = 'Unpaid';
    if (paid >= total - 0.01) {
      status = 'Paid';
    } else if (paid > 0) {
      status = 'Partially Paid';
    }

    dynamicBreakdown[cat] = {
      total,
      paid,
      remaining,
      status
    };
  });

  // 4. Recalculate dynamic ledger totals
  const totalAmount = categories.reduce((sum, cat) => sum + dynamicBreakdown[cat].total, 0);
  const paidAmount = categories.reduce((sum, cat) => sum + dynamicBreakdown[cat].paid, 0);
  const balanceAmount = Math.max(0, totalAmount - paidAmount);

  // Return unified calculated ledger object
  return {
    ...fee,
    installments: calculatedInstallments,
    breakdown: dynamicBreakdown,
    totalAmount,
    paidAmount,
    balanceAmount
  };
};

module.exports = {
  calculateDynamicLedger
};
