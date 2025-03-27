const express = require('express');
const { createMollieClient } = require('@mollie/api-client');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const Transaction = require('../models/Transaction');

const router = express.Router();

// Initialize Mollie client
const mollieApiKey = process.env.MOLLIE_API_KEY;
if (!mollieApiKey) {
  console.error('MOLLIE_API_KEY environment variable is required');
  process.exit(1);
}

const mollieClient = createMollieClient({ apiKey: mollieApiKey });

// Constants
const MONTHLY_PRICE = 9.99; // Price in EUR
const YEARLY_PRICE = 99.99; // Price in EUR
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Helper function to get price and description based on plan
const getPlanDetails = (plan) => {
  switch (plan) {
    case 'yearly':
      return {
        price: YEARLY_PRICE,
        description: 'Sacred 6 Premium Subscription - 1 Year',
        months: 12
      };
    case 'monthly':
    default:
      return {
        price: MONTHLY_PRICE,
        description: 'Sacred 6 Premium Subscription - 1 Month',
        months: 1
      };
  }
};

// @route   POST /api/payments/create
// @desc    Create a new payment for premium subscription
// @access  Private
router.post('/create', auth, async (req, res) => {
  try {
    // Get user
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get plan from request body or default to monthly
    const plan = req.body.plan || 'monthly';
    const { price, description, months } = getPlanDetails(plan);
    
    // Create a unique order ID
    const orderId = `order_${user._id}_${Date.now()}`;

    // Create payment options
    const paymentOptions = {
      amount: {
        currency: 'EUR',
        value: price.toFixed(2) // Format as string with 2 decimal places
      },
      description: description,
      redirectUrl: `${FRONTEND_URL}/dashboard/settings?payment=success&id={id}`, // {id} will be replaced by Mollie with the payment ID
      metadata: {
        orderId,
        userId: user._id.toString(),
        userEmail: user.email,
        plan,
        months
      }
    };
    
    // Add webhook URL if MOLLIE_WEBHOOK_URL is defined in environment variables
    const webhookUrl = process.env.MOLLIE_WEBHOOK_URL;
    if (webhookUrl) {
      paymentOptions.webhookUrl = `${webhookUrl}/api/payments/webhook`;
    }
    
    // Create payment
    const payment = await mollieClient.payments.create(paymentOptions);

    // Create a transaction record
    const transaction = new Transaction({
      paymentId: payment.id,
      userId: user._id,
      userEmail: user.email,
      amount: {
        currency: 'EUR',
        value: price.toFixed(2)
      },
      description: description,
      status: 'created',
      plan: plan,
      months: months,
      orderId: orderId,
      metadata: payment.metadata
    });
    await transaction.save();

    // Log the payment creation attempt
    const activityLog = new ActivityLog({
      type: 'other',
      userId: user._id,
      email: user.email,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      details: `Payment creation initiated for premium subscription`,
      success: true
    });
    await activityLog.save();

    // Return the payment URL where the user should be redirected
    res.json({
      paymentUrl: payment.getCheckoutUrl(),
      paymentId: payment.id
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({ message: 'Error creating payment', error: error.message });
  }
});

// @route   POST /api/payments/webhook
// @desc    Handle Mollie payment webhook
// @access  Public (no auth required)
router.post('/webhook', async (req, res) => {
  try {
    // Verify the payment ID from the request
    const paymentId = req.body.id;
    if (!paymentId) {
      return res.status(400).json({ message: 'Payment ID is required' });
    }

    // Get payment details from Mollie
    const payment = await mollieClient.payments.get(paymentId);
    
    // Extract user ID from metadata
    const userId = payment.metadata?.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in payment metadata' });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found with ID:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    // Find or create transaction record
    let transaction = await Transaction.findOne({ paymentId: paymentId });
    
    if (!transaction) {
      // If transaction doesn't exist, create it
      const plan = payment.metadata?.plan || 'monthly';
      const months = payment.metadata?.months ? parseInt(payment.metadata.months) : 1;
      const orderId = payment.metadata?.orderId || `order_${userId}_${Date.now()}`;
      
      transaction = new Transaction({
        paymentId: paymentId,
        userId: userId,
        userEmail: user.email,
        amount: payment.amount,
        description: payment.description,
        status: payment.status,
        plan: plan,
        months: months,
        orderId: orderId,
        metadata: payment.metadata
      });
    } else {
      // Update existing transaction
      transaction.status = payment.status;
      transaction.updatedAt = Date.now();
    }
    
    // Save transaction
    await transaction.save();

    // Check payment status
    if (payment.isPaid()) {
      // Payment was successful, update user subscription
      user.subscription = 'premium';
      
      // Get the number of months from metadata or default to 1
      const months = payment.metadata?.months ? parseInt(payment.metadata.months) : 1;
      const plan = payment.metadata?.plan || 'monthly';
      
      // Set subscription valid until date based on the plan
      const validUntil = new Date();
      validUntil.setMonth(validUntil.getMonth() + months);
      user.subscriptionValidUntil = validUntil;
      
      // Auto-renew has been removed
      
      // Save user
      await user.save();

      // Log the successful payment
      const activityLog = new ActivityLog({
        type: 'subscription_update',
        userId: user._id,
        email: user.email,
        details: `Payment successful, subscription upgraded to premium (${plan} plan)`,
        success: true
      });
      await activityLog.save();
    } else if (payment.isCanceled() || payment.isExpired() || payment.isFailed()) {
      // Log the failed payment
      const activityLog = new ActivityLog({
        type: 'subscription_update',
        userId: user._id,
        email: user.email,
        details: `Payment ${payment.status}, subscription not upgraded`,
        success: false
      });
      await activityLog.save();
    }

    // Return 200 to acknowledge the webhook
    res.status(200).send('Webhook received');
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ message: 'Error processing webhook', error: error.message });
  }
});

// @route   GET /api/payments/status/:paymentId
// @desc    Check payment status
// @access  Private
router.get('/status/:paymentId', auth, async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    // Get payment details from Mollie
    const payment = await mollieClient.payments.get(paymentId);
    
    // Return payment status
    res.json({
      status: payment.status,
      isPaid: payment.isPaid(),
      isCanceled: payment.isCanceled(),
      isExpired: payment.isExpired(),
      isFailed: payment.isFailed()
    });
  } catch (error) {
    console.error('Payment status check error:', error);
    res.status(500).json({ message: 'Error checking payment status', error: error.message });
  }
});

// @route   GET /api/payments/transactions
// @desc    Get all transactions (admin only)
// @access  Admin
router.get('/transactions', adminAuth, async (req, res) => {
  try {
    // Get query parameters for pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Get total count for pagination
    const total = await Transaction.countDocuments();
    
    // Get transactions with pagination
    const transactions = await Transaction.find()
      .sort({ createdAt: -1 }) // Sort by newest first
      .skip(skip)
      .limit(limit);
    
    // Return transactions with pagination info
    res.json({
      transactions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Error fetching transactions', error: error.message });
  }
});

// @route   GET /api/payments/transactions/:userId
// @desc    Get transactions for a specific user (admin only)
// @access  Admin
router.get('/transactions/:userId', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get transactions for the user
    const transactions = await Transaction.find({ userId })
      .sort({ createdAt: -1 }); // Sort by newest first
    
    // Return transactions
    res.json({ transactions });
  } catch (error) {
    console.error('Error fetching user transactions:', error);
    res.status(500).json({ message: 'Error fetching user transactions', error: error.message });
  }
});

module.exports = router;
