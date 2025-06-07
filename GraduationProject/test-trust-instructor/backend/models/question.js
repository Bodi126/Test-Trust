const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true,
    validate: {
      validator: function(v) {
        return mongoose.Types.ObjectId.isValid(v);
      },
      message: props => `${props.value} is not a valid exam ID!`
    }
  },
  number: {
    type: Number,
    required: true,
    min: 1
  },
  type: {
    type: String,
    enum: ['mcq', 'trueFalse', 'written'],
    required: true
  },
  question: {
    type: String,
    required: true,
    trim: true
  },
  autoCorrect: {
    type: Boolean,
    default: false
  },
  answer: {
    type: mongoose.Schema.Types.Mixed
  }
}, { timestamps: true });

module.exports = mongoose.model('Question', questionSchema);