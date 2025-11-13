const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  passwordHash: String,
  google: { tokens: Object }, // store google tokens if user connects calendar
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
