const mongoose = require('mongoose');

const upiSchema = new mongoose.Schema({
  upiId: {
    type: String,
    required: true,
    unique: true,
  },
  societyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society', // Reference to the Society model
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const UPI = mongoose.model('UPI', upiSchema);
module.exports = UPI;