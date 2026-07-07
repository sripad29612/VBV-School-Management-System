const Enquiry = require('../models/Enquiry');

// @desc    Submit a new admission enquiry
// @route   POST /api/enquiries/submit
// @access  Public
const submitEnquiry = async (req, res) => {
  try {
    const { studentName, parentName, mobileNumber, email, admissionClass, locality } = req.body;

    if (!studentName || !parentName || !mobileNumber || !admissionClass || !locality) {
      return res.status(400).json({ message: 'Please provide all required fields (Student Name, Parent Name, Mobile Number, Class, Locality)' });
    }

    const enquiry = await Enquiry.create({
      studentName,
      parentName,
      mobileNumber,
      email,
      admissionClass,
      locality
    });

    res.status(201).json({
      success: true,
      message: 'Enquiry submitted successfully',
      data: enquiry
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all enquiries
// @route   GET /api/enquiries
// @access  Private/Admin
const getEnquiries = async (req, res) => {
  try {
    const enquiries = await Enquiry.find({}).sort({ createdAt: -1 });
    res.json(enquiries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  submitEnquiry,
  getEnquiries
};
