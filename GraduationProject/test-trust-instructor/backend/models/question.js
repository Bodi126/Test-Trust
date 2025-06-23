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
  marks: {
    type: Number,
    required: true,
    default: 1,
    min: 0
  },
  autoCorrect: {
    type: Boolean,
    default: true
  },
  correctAnswer: {
    type: mongoose.Schema.Types.Mixed, // Can be string or boolean
    required: function() { return this.autoCorrect && this.type !== 'written'; }
  },
  modelAnswer: {
    type: String,
    required: function() { return this.type === 'written'; }
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
