const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
    department: {
        type: String,
        required: true,
    },
    year: {
        type: String,
        required: true,
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    studentCount: {
        type: Number,
        required: true,
        min: 1
    },
    examDate: {
        type: Date,
        required: true
    },
    examTime: {
        type: String,
        required: true
    },
    examDuration: {
        type: Number, // Changed from String to Number
        required: true,
        min: 1
    },
    totalMarks: {
        type: Number,
        required: true,
        min: 1
    },
    questionCount: {
        type: Number,
        required: true,
        min: 1
    },
    autoCorrection: {
        type: Boolean,
        default: false
    },
    archiveExam: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: String,
        required: true
    }
}, { timestamps: true }); // Adds createdAt and updatedAt

module.exports = mongoose.model('Exam', examSchema, 'exams');