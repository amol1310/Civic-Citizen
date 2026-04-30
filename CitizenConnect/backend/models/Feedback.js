const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  complaintId: { type: String, required: true },
  rating: { type: Number, required: true },
  comment: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Feedback', feedbackSchema);
