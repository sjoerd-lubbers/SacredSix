const mongoose = require('mongoose');

const SharedListSchema = new mongoose.Schema({
  shareId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  taskIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  recipientEmail: {
    type: String,
    required: true
  },
  message: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  }
});

module.exports = mongoose.model('SharedList', SharedListSchema);
