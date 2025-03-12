const mongoose = require('mongoose');

// Define a schema for a question-answer pair
const QuestionAnswerSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  answer: {
    type: String,
    default: ''
  }
}, { _id: false }); // Don't create _id for this subdocument

const ReflectionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Content field is now optional and can be generated from questionAnswers
  content: {
    type: String,
    required: false
  },
  // Add structured content as an array of question-answer pairs
  questionAnswers: {
    type: [QuestionAnswerSchema],
    default: []
  },
  // Flag to indicate if this is a structured reflection
  isStructured: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    enum: ['daily', 'weekly'],
    default: 'daily'
  },
  aiAnalysis: {
    type: String
  },
  aiSuggestions: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Reflection', ReflectionSchema);
