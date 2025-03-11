const mongoose = require('mongoose');

const ReflectionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
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
