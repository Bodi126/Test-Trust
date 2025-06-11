const mongoose = require('mongoose');
const studentAnswerSchema = new mongoose.Schema({
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  studentNationalId: {
    type: String,
    required: true
  },
  answers: [
    {
      questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question'
      },
      answer: mongoose.Schema.Types.Mixed // String or Boolean
    }
  ],
}, { timestamps: true });

module.exports = mongoose.model('StudentAnswer', studentAnswerSchema, 'student_answer');
