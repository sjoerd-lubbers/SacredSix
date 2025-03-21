const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Feedback = require('../models/Feedback');

/**
 * @route   POST /api/feedback
 * @desc    Submit user feedback
 * @access  Private
 */
router.post('/', auth, async (req, res) => {
  try {
    const { type, message, page, timestamp } = req.body;
    
    // Create new feedback
    const feedback = new Feedback({
      userId: req.user._id,
      type,
      message: message || '',
      page,
      timestamp: timestamp || new Date()
    });
    
    await feedback.save();
    
    res.status(201).json({ success: true, message: 'Feedback submitted successfully' });
  } catch (err) {
    console.error('Error submitting feedback:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   GET /api/feedback
 * @desc    Get all feedback (admin only)
 * @access  Private/Admin
 */
router.get('/', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const feedback = await Feedback.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(feedback);
  } catch (err) {
    console.error('Error fetching feedback:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
