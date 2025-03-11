const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['todo', 'in_progress', 'done'],
    default: 'todo'
  },
  estimatedTime: {
    type: Number, // in minutes
    default: 0
  },
  dueDate: {
    type: Date
  },
  isSelectedForToday: {
    type: Boolean,
    default: false
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringDays: {
    type: [String],
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    default: []
  },
  lastCompletedDate: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
TaskSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // If status is changed to 'done', set completedAt and lastCompletedDate
  if (this.isModified('status') && this.status === 'done') {
    const now = new Date();
    this.completedAt = now;
    
    // For recurring tasks, store the last completed date
    if (this.isRecurring) {
      this.lastCompletedDate = now;
    }
  }
  
  next();
});

module.exports = mongoose.model('Task', TaskSchema);
