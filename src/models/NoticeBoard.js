const mongoose = require('mongoose');

const noticeBoardSchema = new mongoose.Schema({
  societyId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "SocietyAdmin"
  },
  sender: {
    type: String,
    require: true,
  },
  subject: {
    type: String,
    require: true
  },
  description: {
    type: String,
    require: true
  },
  date: {
    type: Date,
    required: true,
  },
  status: {
    type: Boolean,
    default: false,
  }
}, { timestamps: true });

module.exports = mongoose.model('NoticeBoard', noticeBoardSchema);