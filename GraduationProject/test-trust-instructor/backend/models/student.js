const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  fullName: { type: String},
  nationalId: { type: String,unique: true },
  section: { type: String},
  department: { type: String},
  academicYear: { type: String },
  idPhoto: { type: String }, 
  fingerprintData: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema, 'student');
