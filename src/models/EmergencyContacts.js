const mongoose = require('mongoose');

const emergencyContactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  profession: { type: String },
  phoneNumber: { type: String, required: true },
  serviceType: { type: String, required: true },
  societyId: { type: mongoose.Schema.Types.ObjectId, ref: 'SocietyAdmin', required: true }
});

module.exports = mongoose.model('EmergencyContact', emergencyContactSchema);