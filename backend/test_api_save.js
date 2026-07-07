const mongoose = require('mongoose');
const { createOrUpdateInstallmentPlan } = require('./controllers/adminController');
const Class = require('./models/Class');
const FeeInstallmentPlan = require('./models/FeeInstallmentPlan');

const testSave = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/vbv_school_db');
    console.log('Connected to MongoDB.');

    const cls = await Class.findOne();
    if (!cls) {
      console.log('No class found.');
      await mongoose.connection.close();
      return;
    }

    await FeeInstallmentPlan.deleteOne({ className: cls.name, academicYear: '2026-27' });

    const totalAmount = Object.values(cls.feeStructure.toObject()).reduce((a, b) => Number(a) + Number(b), 0);
    const termAmount = Math.round(totalAmount / 3);

    const req = {
      body: {
        className: cls.name,
        academicYear: '2026-27',
        totalAmount,
        status: 'Published',
        mode: 'A',
        installments: [
          { name: 'Term 1', amount: termAmount, dueDate: '2026-09-01' },
          { name: 'Term 2', amount: termAmount, dueDate: '2026-12-01' },
          { name: 'Term 3', amount: totalAmount - (termAmount * 2), dueDate: '2027-03-01' }
        ]
      }
    };

    const res = {
      status: (code) => {
        console.log('Status code:', code);
        return res;
      },
      json: (data) => {
        console.log('Response JSON:', JSON.stringify(data, null, 2));
      }
    };

    await createOrUpdateInstallmentPlan(req, res);

    // Fetch from database
    const saved = await FeeInstallmentPlan.findOne({ className: cls.name });
    console.log('Document from DB status:', saved.status);

    // Clean up
    await FeeInstallmentPlan.deleteOne({ _id: saved._id });
    await mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err.message);
  }
};

testSave();
