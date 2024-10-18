const UPI = require("../models/UPI");


// Add UPI ID for a society
exports.addUPI = async (req, res) => {
  const { upiId, societyId } = req.body;

  if (!upiId || !societyId) {
    return res.status(400).json({ message: 'UPI ID and Society ID are required' });
  }

  try {
    
    const newUPI = new UPI({ upiId, societyId });
    await newUPI.save();
    
    return res.status(201).json({ message: 'UPI ID added successfully', newUPI });
  } catch (error) {
    console.error('Error adding UPI ID: ', error);
    return res.status(500).json({ message: 'Server error' });
  }
};