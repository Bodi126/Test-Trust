const mongoose = require('mongoose');

const modelAnswerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  answer: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('ModelAnswer', modelAnswerSchema);
