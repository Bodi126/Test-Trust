const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
    department: String,
    year: String,
    subject: String,
    studentCount: Number,
    examDate: Date,
    examTime: {String, unique: true},
    examDuration: String,
    totalMarks: Number,
    questionCount: Number,
    autoCorrection: Boolean,
    archiveExam: Boolean,
})

module.exports = mongoose.model('Exam', examSchema, 'exam');