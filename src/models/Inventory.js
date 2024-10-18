const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    societyId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'SocietyAdmin'
    },
    name: {
      type: String,
      required: true
    },
    quantity: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Inventory', inventorySchema);