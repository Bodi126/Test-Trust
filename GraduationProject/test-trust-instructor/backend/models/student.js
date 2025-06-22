const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  password: { 
    type: String, 
    required: true,
    minlength: [6, 'Password must be at least 6 characters long']
  },
  nationalId: { 
    type: String,
    required: true,
    unique: true 
  },
  section: { 
    type: String,
    required: true 
  },
  department: { 
    type: String,
    required: true 
  },
  academicYear: { 
    type: String,
    required: true 
  },
  idPhoto: { 
    type: String,
    required: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema, 'student');
