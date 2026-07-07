const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

/**
 * Generates academic report card PDF and pipes it to response
 */
function generateReportCardPDF(res, result, student, className) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  // Pipe to response
  doc.pipe(res);

  // Logo setup
  const logoPath = path.join(__dirname, '..', 'public', 'logo.jpg');
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 50, 45, { width: 75 });
  }

  // Header Details
  doc.fillColor('#0B5ED7')
     .font('Helvetica-Bold')
     .fontSize(22)
     .text('VIDYA BHARATHI VIDYAPEETH', 140, 50);

  doc.fillColor('#F57C00')
     .font('Helvetica')
     .fontSize(10)
     .text('Village: Palsi, Mandal: Kubeer, District: Nirmal', 140, 75)
     .text('Contact: 9948370709, 9948369209', 140, 90);

  // Draw separator line
  doc.strokeColor('#cccccc')
     .lineWidth(1)
     .moveTo(50, 135)
     .lineTo(545, 135)
     .stroke();

  // Report Title
  doc.fillColor('#333333')
     .font('Helvetica-Bold')
     .fontSize(16)
     .text(`REPORT CARD - ${result.examType.toUpperCase()}`, 50, 150, { align: 'center' });

  // Student Information Box
  doc.roundedRect(50, 180, 495, 80, 5).stroke();

  doc.font('Helvetica-Bold').fontSize(10).fillColor('#0B5ED7').text('Student Name:', 65, 195);
  doc.font('Helvetica').fillColor('#333333').text(student.name, 150, 195);

  doc.font('Helvetica-Bold').fillColor('#0B5ED7').text('Roll Number:', 65, 215);
  doc.font('Helvetica').fillColor('#333333').text(student.rollNumber, 150, 215);

  doc.font('Helvetica-Bold').fillColor('#0B5ED7').text('Class & Sec:', 65, 235);
  doc.font('Helvetica').fillColor('#333333').text(`${className} - A`, 150, 235);

  doc.font('Helvetica-Bold').fillColor('#0B5ED7').text('Admission No:', 300, 195);
  doc.font('Helvetica').fillColor('#333333').text(student.admissionNumber, 390, 195);

  doc.font('Helvetica-Bold').fillColor('#0B5ED7').text('Blood Group:', 300, 215);
  doc.font('Helvetica').fillColor('#333333').text(student.bloodGroup, 390, 215);

  doc.font('Helvetica-Bold').fillColor('#0B5ED7').text('Date of Birth:', 300, 235);
  const dobFormatted = new Date(student.dob).toLocaleDateString('en-GB');
  doc.font('Helvetica').fillColor('#333333').text(dobFormatted, 390, 235);

  // Subject Marks Table Header
  const tableTop = 280;
  doc.fillColor('#0B5ED7')
     .rect(50, tableTop, 495, 25)
     .fill();

  doc.fillColor('#ffffff')
     .font('Helvetica-Bold')
     .fontSize(10)
     .text('Subject', 70, tableTop + 7)
     .text('Max Marks', 230, tableTop + 7)
     .text('Marks Obtained', 350, tableTop + 7)
     .text('Grade', 470, tableTop + 7);

  let currentY = tableTop + 25;

  // Table Body Rows
  doc.fillColor('#333333').font('Helvetica');
  result.marks.forEach((m, index) => {
    // Alternating rows background
    if (index % 2 === 1) {
      doc.fillColor('#f9f9f9')
         .rect(50, currentY, 495, 22)
         .fill();
    }

    doc.fillColor('#333333')
       .text(m.subject.name, 70, currentY + 6)
       .text(m.maxMarks.toString(), 230, currentY + 6)
       .text(m.marksObtained.toString(), 350, currentY + 6);

    // Calculate subject grade
    let subGrade = 'F';
    const percent = (m.marksObtained / m.maxMarks) * 100;
    if (percent >= 90) subGrade = 'A+';
    else if (percent >= 80) subGrade = 'A';
    else if (percent >= 70) subGrade = 'B';
    else if (percent >= 60) subGrade = 'C';
    else if (percent >= 50) subGrade = 'D';
    else if (percent >= 35) subGrade = 'E';

    doc.text(subGrade, 470, currentY + 6);
    currentY += 22;
  });

  // Draw table outline
  doc.strokeColor('#cccccc')
     .rect(50, tableTop, 495, currentY - tableTop)
     .stroke();

  // Summary box
  const summaryTop = currentY + 20;
  doc.roundedRect(50, summaryTop, 495, 75, 5).stroke();

  doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333')
     .text(`Total Marks: ${result.totalMarks}`, 65, summaryTop + 15)
     .text(`Percentage: ${result.percentage.toFixed(2)}%`, 65, summaryTop + 35)
     .text(`Final Grade: ${result.grade}`, 65, summaryTop + 55);

  doc.text(`Rank in Class: ${result.rank || 'N/A'}`, 300, summaryTop + 15)
     .text(`Teacher Remarks: ${result.remarks || 'Satisfactory'}`, 300, summaryTop + 35);

  // Signatures
  const sigTop = summaryTop + 110;
  doc.strokeColor('#333333').lineWidth(1)
     .moveTo(70, sigTop).lineTo(180, sigTop).stroke()
     .moveTo(370, sigTop).lineTo(480, sigTop).stroke();

  doc.fontSize(9)
     .text('Class Teacher Signature', 70, sigTop + 5)
     .text('Principal Signature', 370, sigTop + 5);

  // Footer
  doc.fillColor('#888888')
     .fontSize(8)
     .text('VIDYA BHARATHI VIDYAPEETH - Empowering Minds, Securing Futures', 50, sigTop + 50, { align: 'center' });

  doc.end();
}

/**
 * Generates Fee Payment Receipt PDF and pipes it to response
 */
function generateFeeReceiptPDF(res, fee, payment, student, className) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  // Pipe to response
  doc.pipe(res);

  // Logo setup
  const logoPath = path.join(__dirname, '..', 'public', 'logo.jpg');
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 50, 45, { width: 75 });
  }

  // Header Details
  doc.fillColor('#0B5ED7')
     .font('Helvetica-Bold')
     .fontSize(22)
     .text('VIDYA BHARATHI VIDYAPEETH', 140, 50);

  doc.fillColor('#F57C00')
     .font('Helvetica')
     .fontSize(10)
     .text('Village: Palsi, Mandal: Kubeer, District: Nirmal', 140, 75)
     .text('Contact: 9948370709, 9948369209', 140, 90);

  // Draw separator line
  doc.strokeColor('#cccccc')
     .lineWidth(1)
     .moveTo(50, 135)
     .lineTo(545, 135)
     .stroke();

  // Receipt Title
  doc.fillColor('#333333')
     .font('Helvetica-Bold')
     .fontSize(16)
     .text('FEE PAYMENT RECEIPT', 50, 150, { align: 'center' });

  // Transaction details
  doc.roundedRect(50, 180, 495, 120, 5).stroke();

  doc.font('Helvetica-Bold').fontSize(10).fillColor('#0B5ED7').text('Receipt Number:', 65, 195);
  doc.font('Helvetica').fillColor('#333333').text(payment.receiptNumber, 160, 195);

  doc.font('Helvetica-Bold').fillColor('#0B5ED7').text('Payment Date:', 65, 215);
  doc.font('Helvetica').fillColor('#333333').text(new Date(payment.date).toLocaleDateString('en-GB'), 160, 215);

  doc.font('Helvetica-Bold').fillColor('#0B5ED7').text('Student Name:', 65, 235);
  doc.font('Helvetica').fillColor('#333333').text(student.name, 160, 235);

  doc.font('Helvetica-Bold').fillColor('#0B5ED7').text('Class / Sec:', 65, 255);
  doc.font('Helvetica').fillColor('#333333').text(`${className} - A`, 160, 255);

  doc.font('Helvetica-Bold').fillColor('#0B5ED7').text('Payment Method:', 300, 195);
  doc.font('Helvetica').fillColor('#333333').text(payment.paymentMethod, 410, 195);

  doc.font('Helvetica-Bold').fillColor('#0B5ED7').text('Roll Number:', 300, 215);
  doc.font('Helvetica').fillColor('#333333').text(student.rollNumber, 410, 215);

  doc.font('Helvetica-Bold').fillColor('#0B5ED7').text('Admission No:', 300, 235);
  doc.font('Helvetica').fillColor('#333333').text(student.admissionNumber, 410, 235);

  // Fee Particulars Table
  const tableTop = 320;
  doc.fillColor('#0B5ED7')
     .rect(50, tableTop, 495, 25)
     .fill();

  doc.fillColor('#ffffff')
     .font('Helvetica-Bold')
     .fontSize(10)
     .text('Fee Category', 70, tableTop + 7)
     .text('Overall Category Fee', 250, tableTop + 7)
     .text('Amount Paid in this Receipt', 400, tableTop + 7);

  doc.fillColor('#333333').font('Helvetica');
  const categories = ['admission', 'tuition', 'books', 'hostel', 'transport', 'uniform', 'exam', 'other'];
  let currentY = tableTop + 35;

  categories.forEach(cat => {
    const paidInPayment = (payment.breakdown && payment.breakdown[cat]) || 0;
    const catTotal = (fee.breakdown && fee.breakdown[cat] && fee.breakdown[cat].total) || 0;

    let catLabel = cat.charAt(0).toUpperCase() + cat.slice(1);
    if (catLabel === 'Exam') catLabel = 'Examination';

    doc.text(`${catLabel} Fee`, 70, currentY)
       .text(`Rs. ${catTotal.toFixed(2)}`, 250, currentY)
       .text(`Rs. ${paidInPayment.toFixed(2)}`, 400, currentY);

    currentY += 20;
  });

  doc.strokeColor('#cccccc')
     .rect(50, tableTop, 495, currentY - tableTop)
     .stroke();

  // Balances summary box
  const summaryTop = currentY + 15;
  doc.roundedRect(50, summaryTop, 495, 75, 5).stroke();

  doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333')
     .text(`Total Amount Due: Rs. ${fee.totalAmount.toFixed(2)}`, 65, summaryTop + 15)
     .text(`Total Paid So Far: Rs. ${fee.paidAmount.toFixed(2)}`, 65, summaryTop + 35)
     .text(`Pending Balance: Rs. ${fee.balanceAmount.toFixed(2)}`, 65, summaryTop + 55);

  const dueStr = new Date(fee.dueDate).toLocaleDateString('en-GB');
  doc.text(`Balance Due Date: ${dueStr}`, 300, summaryTop + 15)
     .fillColor('#D32F2F')
     .text(fee.balanceAmount === 0 ? 'STATUS: FULLY PAID' : 'STATUS: PENDING BALANCE', 300, summaryTop + 35);

  // Terms and signatures
  const noteTop = summaryTop + 95;
  doc.fontSize(8).fillColor('#888888')
     .text('Notes: 1. Fee once paid is non-refundable. 2. Keep this receipt safe for academic checkups.', 50, noteTop);

  const sigTop = noteTop + 55;
  doc.strokeColor('#333333').lineWidth(1)
     .moveTo(370, sigTop).lineTo(480, sigTop).stroke();

  doc.fontSize(9).fillColor('#333333')
     .text('Receiver Signature', 370, sigTop + 5);

  // Footer
  doc.fillColor('#888888')
     .fontSize(8)
     .text('Thank you for your association with VIDYA BHARATHI VIDYAPEETH', 50, sigTop + 35, { align: 'center' });

  doc.end();
}

/**
 * Helper to format 24-hour time string to 12-hour format with AM/PM
 */
function formatTime12Hour(timeStr, session) {
  if (!timeStr) {
    return session === 'Afternoon' ? '01:30 PM' : '09:00 AM';
  }
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1].trim();
  if (isNaN(hours)) return timeStr;
  
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const hoursStr = String(hours).padStart(2, '0');
  return `${hoursStr}:${minutes} ${ampm}`;
}

/**
 * Generates Exam Timetable PDF and pipes it to response
 */
function generateExamTimetablePDF(res, examSchedule, className) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  doc.pipe(res);

  // Logo setup
  const logoPath = path.join(__dirname, '..', 'public', 'logo.jpg');
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 50, 45, { width: 75 });
  }

  // Header Details
  doc.fillColor('#0B5ED7')
     .font('Helvetica-Bold')
     .fontSize(22)
     .text('VIDYA BHARATHI VIDYAPEETH', 140, 50);

  doc.fillColor('#F57C00')
     .font('Helvetica')
     .fontSize(10)
     .text('Village: Palsi, Mandal: Kubeer, District: Nirmal', 140, 75)
     .text('Contact: 9948370709, 9948369209', 140, 90);

  doc.strokeColor('#cccccc')
     .lineWidth(1)
     .moveTo(50, 135)
     .lineTo(545, 135)
     .stroke();

  // Title
  doc.fillColor('#333333')
     .font('Helvetica-Bold')
     .fontSize(16)
     .text(`EXAM TIMETABLE - ${examSchedule.examName.toUpperCase()}`, 50, 150, { align: 'center' });

  // Details box
  doc.roundedRect(50, 180, 495, 75, 5).stroke();

  doc.font('Helvetica-Bold').fontSize(10).fillColor('#0B5ED7').text('Academic Year:', 65, 195);
  doc.font('Helvetica').fillColor('#333333').text(examSchedule.academicYear, 160, 195);

  doc.font('Helvetica-Bold').fillColor('#0B5ED7').text('Target Class:', 65, 215);
  doc.font('Helvetica').fillColor('#333333').text(className, 160, 215);

  doc.font('Helvetica-Bold').fillColor('#0B5ED7').text('Instructions:', 65, 235);
  doc.font('Helvetica').fillColor('#333333').text(examSchedule.instructions || 'Follow exam guidelines.', 160, 235, { width: 360 });

  // Table header
  const tableTop = 275;
  doc.fillColor('#0B5ED7')
     .rect(50, tableTop, 495, 25)
     .fill();

  doc.fillColor('#ffffff')
     .font('Helvetica-Bold')
     .fontSize(9)
     .text('Subject', 70, tableTop + 8)
     .text('Date', 200, tableTop + 8)
     .text('Time Slot', 300, tableTop + 8)
     .text('Max Marks', 400, tableTop + 8)
     .text('Invigilator', 470, tableTop + 8);

  let currentY = tableTop + 25;
  doc.fillColor('#333333').font('Helvetica').fontSize(9);

  examSchedule.subjects.forEach((m, index) => {
    if (index % 2 === 1) {
      doc.fillColor('#f9f9f9')
         .rect(50, currentY, 495, 22)
         .fill();
    }

    const dateStr = new Date(m.date).toLocaleDateString('en-GB');
    const timeStr = `${formatTime12Hour(m.startTime, m.session)} - ${formatTime12Hour(m.endTime, m.session)}`;
    const subjName = m.subject?.name || 'Subject';
    const invigilatorName = m.invigilator?.name || 'Assigned';

    doc.fillColor('#333333')
       .text(subjName, 70, currentY + 6)
       .text(dateStr, 200, currentY + 6)
       .text(timeStr, 300, currentY + 6)
       .text(m.maxMarks.toString(), 400, currentY + 6)
       .text(invigilatorName, 470, currentY + 6);

    currentY += 22;
  });

  const sigTop = Math.min(750, currentY + 40);
  doc.strokeColor('#333333').lineWidth(1)
     .moveTo(370, sigTop).lineTo(480, sigTop).stroke();

  doc.fontSize(9).fillColor('#333333')
     .text('Principal Desk Signature', 370, sigTop + 5);

  doc.end();
}

module.exports = {
  generateReportCardPDF,
  generateFeeReceiptPDF,
  generateExamTimetablePDF
};
