const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  idNumber: { type: Number, unique: true },
  position: String,
  email: { type: String, unique: true },
  password: String
});

module.exports = mongoose.model('User', userSchema, 'instructor');
