const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  idNumber: { type: String, unique: true },
  position: String,
  email: { 
    type: String, 
    unique: true,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Don't return password in queries by default
  },
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorCode: { type: Number, default: null },
  twoFactorExpires: { type: Date, default: null },
  loginNotificationsEnabled: { type: Boolean, default: true },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  resetPasswordOtp: String,
  resetOtpExpires: Date,
  examCount: { type: Number, default: 0 },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Generate salt
    const salt = await bcrypt.genSalt(10);
    // Hash password with salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare entered password with hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Check if password was changed after token was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Generate password reset token
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

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
    twoFactorEnabled: userData.twoFactorEnabled,
    loginNotificationsEnabled: userData.loginNotificationsEnabled,
    examCount: userData.examCount || 0
  };
  
  console.log('[AUTH] Generating token for user:', userData.email);
  const token = jwt.sign(payload, process.env.JWT_SECRET || 'default_jwt_secret', { expiresIn: '1h' });
  return token;
};

module.exports = mongoose.model('User', userSchema, 'instructor');
