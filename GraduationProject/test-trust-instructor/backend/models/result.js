const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  // Support both old and new field names for compatibility
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam'
  },
  student: {
    type: String,
    required: true
  },
  studentNationalId: {
    type: String
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

// Pre-save hook to normalize field names
resultSchema.pre('save', function(next) {
  // Ensure we have the correct field names
  if (this.examId && !this.exam) {
    this.exam = this.examId;
  }
  if (this.studentNationalId && !this.student) {
    this.student = this.studentNationalId;
  }
  
  // Remove old field names to avoid confusion
  if (this.examId) delete this.examId;
  if (this.studentNationalId) delete this.studentNationalId;
  
  next();
});

// Pre-validate hook to ensure required fields
resultSchema.pre('validate', function(next) {
  if (!this.exam) {
    return next(new Error('exam field is required'));
  }
  if (!this.student) {
    return next(new Error('student field is required'));
  }
  next();
});

// Add unique compound index for exam and student
resultSchema.index({ exam: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Result', resultSchema, 'results');
