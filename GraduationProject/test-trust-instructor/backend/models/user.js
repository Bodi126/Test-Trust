const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  idNumber: { type: Number, unique: true },
  position: String,
  email: { type: String, unique: true },
  password: String,
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorCode: { type: Number, default: null },
  twoFactorExpires: { type: Date, default: null },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  resetPasswordOtp: String,
  resetOtpExpires: Date
});

const jwt = require('jsonwebtoken');

userSchema.methods.generateAuthToken = function (user) {
  // If user is provided as parameter (for verify-2fa), use that, otherwise use 'this'
  const userData = user || this;
  
  const payload = {
    _id: userData._id,
    email: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName,
    position: userData.position,
    idNumber: userData.idNumber,
    twoFactorEnabled: userData.twoFactorEnabled
  };
  
  console.log('[AUTH] Generating token for user:', userData.email);
  const token = jwt.sign(payload, process.env.JWT_SECRET || 'default_jwt_secret', { expiresIn: '1h' });
  return token;
};

module.exports = mongoose.model('User', userSchema, 'instructor');
