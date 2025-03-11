const mongoose = require('mongoose');
const crypto = require('crypto');

const ApiKeySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  key: {
    type: String,
    required: true,
    unique: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastUsed: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

// Static method to generate a new API key
ApiKeySchema.statics.generateKey = function() {
  return crypto.randomBytes(32).toString('hex');
};

// Method to update the lastUsed timestamp
ApiKeySchema.methods.updateLastUsed = async function() {
  this.lastUsed = Date.now();
  return this.save();
};

module.exports = mongoose.model('ApiKey', ApiKeySchema);
