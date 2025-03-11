const mongoose = require('mongoose');

const DailyCompletionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  tasksSelected: {
    type: Number,
    default: 0
  },
  tasksCompleted: {
    type: Number,
    default: 0
  },
  isFullyCompleted: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create a compound index on userId and date to ensure uniqueness
DailyCompletionSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyCompletion', DailyCompletionSchema);
