const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true,
    validate: {
      validator: function (v) {
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
  choices: {
    type: [String],
    default: undefined,
    validate: {
      validator: function (value) {
        if (this.type === 'mcq') {
          return Array.isArray(value) && value.length >= 2;
        }
        return true;
      },
      message: props => `MCQ questions must have at least 2 choices`
    }
  },
  autoCorrect: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

questionSchema.pre('save', function (next) {
  if (this.type === 'trueFalse' && (!this.choices || this.choices.length === 0)) {
    this.choices = ['True', 'False'];
  } else if (this.type !== 'mcq') {
    this.choices = undefined; // remove choices for written
  }
  next();
});

module.exports = mongoose.model('Question', questionSchema, 'questions');
