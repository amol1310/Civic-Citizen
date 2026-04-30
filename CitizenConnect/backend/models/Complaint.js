const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  type: String,
  from: String,
  to: String,
  updated_by: String,
  timestamp: { type: Date, default: Date.now }
});

const complaintSchema = new mongoose.Schema({
  id: { type: String, unique: true }, // Legacy ID support
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  issue_type: String,
  description: String,
  location: {
    lat: Number,
    lng: Number,
    address: String
  },
  image_urls: [String],
  status: { 
    type: String, 
    enum: ['Submitted', 'Assigned', 'In Progress', 'Resolved'],
    default: 'Submitted' 
  },
  priority: { 
    type: String, 
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium' 
  },
  assignedTo: String,
  history: [historySchema],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Complaint', complaintSchema);
