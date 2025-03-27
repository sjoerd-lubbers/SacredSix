const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['login', 'login_failed', 'register', 'logout', 'password_reset', 'subscription_update', 'other'],
    default: 'other'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // Not required because some logs might be from anonymous users
  },
  email: {
    type: String,
    trim: true
    // Not required because some logs might not have an email
  },
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  details: {
    type: String,
    trim: true
  },
  success: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
