const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  studentNationalId: {
    type: String,
    required: true
  },
  totalScore: {
    type: Number,
    required: true,
    min: 0
  },
  maxScore: {
    type: Number,
    required: true,
    min: 0
  },
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  gradedAnswers: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    },
    studentAnswer: mongoose.Schema.Types.Mixed,
    isCorrect: Boolean,
    marksAwarded: Number,
    maxMarks: Number
  }],
  gradedAt: {
    type: Date,
    default: Date.now
  },
  isAutoGraded: {
    type: Boolean,
    default: false
  },
  instructorNotes: {
    type: String,
    default: ''
  },
  finalGrade: {
    type: String,
    enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F'],
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Result', resultSchema, 'results');
