const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  paymentId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  amount: {
    currency: {
      type: String,
      required: true,
      default: 'EUR'
    },
    value: {
      type: String,
      required: true
    }
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['created', 'pending', 'paid', 'canceled', 'expired', 'failed'],
    default: 'created'
  },
  plan: {
    type: String,
    required: true,
    enum: ['monthly', 'yearly']
  },
  months: {
    type: Number,
    required: true
  },
  orderId: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: Object,
    default: {}
  }
});

// Update the updatedAt field on save
TransactionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Transaction', TransactionSchema);
