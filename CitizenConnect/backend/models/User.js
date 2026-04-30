const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobile: { type: String, required: true, unique: true },
  role: { type: String, default: 'citizen' },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
