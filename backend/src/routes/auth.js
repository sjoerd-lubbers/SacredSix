const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  '/register',
  [
    body('name', 'Name is required').not().isEmpty(),
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password must be at least 6 characters').isLength({ min: 6 })
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      // Check if user already exists
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Create new user
      user = new User({
        name,
        email,
        password
      });

      // Save user to database
      await user.save();

      // Log the registration activity
      const activityLog = new ActivityLog({
        type: 'register',
        userId: user._id,
        email: user.email,
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        details: `User registered: ${user.email}`,
        success: true
      });
      await activityLog.save();

      // Create JWT token
      const payload = {
        userId: user.id
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '7d' },
        (err, token) => {
          if (err) throw err;
          res.json({
            token,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              subscription: user.subscription,
              subscriptionValidUntil: user.subscriptionValidUntil,
              mission: user.mission,
              missionLastValidated: user.missionLastValidated,
              values: user.values,
              valuesLastValidated: user.valuesLastValidated,
              alignment: user.alignment
            }
          });
        }
      );
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
  '/login',
  [
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password is required').exists()
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Check if user exists
      const user = await User.findOne({ email });
      if (!user) {
        // Log failed login attempt
        const activityLog = new ActivityLog({
          type: 'login_failed',
          email: email,
          ipAddress: req.ip || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown',
          details: `Failed login attempt: User not found (${email})`,
          success: false
        });
        await activityLog.save();
        
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        // Log failed login attempt
        const activityLog = new ActivityLog({
          type: 'login_failed',
          userId: user._id,
          email: user.email,
          ipAddress: req.ip || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown',
          details: `Failed login attempt: Invalid password for ${user.email}`,
          success: false
        });
        await activityLog.save();
        
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Log successful login
      const activityLog = new ActivityLog({
        type: 'login',
        userId: user._id,
        email: user.email,
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        details: `User logged in: ${user.email}`,
        success: true
      });
      await activityLog.save();

      // Create JWT token
      const payload = {
        userId: user.id
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '7d' },
        (err, token) => {
          if (err) throw err;
          res.json({
            token,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              subscription: user.subscription,
              subscriptionValidUntil: user.subscriptionValidUntil,
              mission: user.mission,
              missionLastValidated: user.missionLastValidated,
              values: user.values,
              valuesLastValidated: user.valuesLastValidated,
              alignment: user.alignment
            }
          });
        }
      );
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   GET /api/auth/user
// @desc    Get current user
// @access  Private
router.get('/user', auth, async (req, res) => {
  try {
    // Get user without password
    const user = await User.findById(req.userId).select('-password');
    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile (name only, email cannot be changed)
// @access  Private
router.put(
  '/profile',
  [
    auth,
    body('name', 'Name is required').not().isEmpty()
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name } = req.body;

    try {
      // Find user
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Update name only (email cannot be changed)
      user.name = name;

      // Save user
      await user.save();

      // Log the profile update
      const activityLog = new ActivityLog({
        type: 'profile_update',
        userId: user._id,
        email: user.email,
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        details: `User updated profile: ${user.email}`,
        success: true
      });
      await activityLog.save();

      // Return updated user without password
      const updatedUser = await User.findById(req.userId).select('-password');
      res.json(updatedUser);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   PUT /api/auth/mission
// @desc    Update user's mission statement
// @access  Private
router.put(
  '/mission',
  [
    auth,
    body('mission').optional().isString()
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { mission } = req.body;

    try {
      // Find user
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Update mission
      if (mission !== undefined) user.mission = mission;

      // Save user
      await user.save();

      // Return updated user without password
      const updatedUser = await User.findById(req.userId).select('-password');
      res.json(updatedUser);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   PUT /api/auth/values
// @desc    Update user's core values
// @access  Private
router.put(
  '/values',
  [
    auth,
    body('values').optional().isArray()
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { values } = req.body;

    try {
      // Find user
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Update values
      if (values !== undefined) user.values = values;

      // Save user
      await user.save();

      // Return updated user without password
      const updatedUser = await User.findById(req.userId).select('-password');
      res.json(updatedUser);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   PUT /api/auth/validate-mission
// @desc    Validate user's mission statement (mark as still valid)
// @access  Private
router.put(
  '/validate-mission',
  [
    auth,
    body('missionLastValidated').optional().isISO8601()
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { missionLastValidated } = req.body;

    try {
      // Find user
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Update mission validation date
      if (missionLastValidated) {
        user.missionLastValidated = new Date(missionLastValidated);
      } else {
        user.missionLastValidated = new Date();
      }

      // Save user
      await user.save();

      // Return updated user without password
      const updatedUser = await User.findById(req.userId).select('-password');
      res.json(updatedUser);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   PUT /api/auth/validate-values
// @desc    Validate user's core values (mark as still valid)
// @access  Private
router.put(
  '/validate-values',
  [
    auth,
    body('valuesLastValidated').optional().isISO8601()
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { valuesLastValidated } = req.body;

    try {
      // Find user
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Update values validation date
      if (valuesLastValidated) {
        user.valuesLastValidated = new Date(valuesLastValidated);
      } else {
        user.valuesLastValidated = new Date();
      }

      // Save user
      await user.save();

      // Return updated user without password
      const updatedUser = await User.findById(req.userId).select('-password');
      res.json(updatedUser);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   PUT /api/auth/subscription
// @desc    Update user's subscription status
// @access  Private
router.put(
  '/subscription',
  [
    auth,
    body('subscription').isIn(['free', 'premium']),
    body('subscriptionValidUntil').optional().isISO8601(),
    body('autoRenew').optional().isBoolean()
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { subscription, subscriptionValidUntil, autoRenew } = req.body;

    try {
      // Find user
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Update subscription information
      user.subscription = subscription;
      
      // Update auto-renew if provided
      if (autoRenew !== undefined) {
        user.autoRenew = autoRenew;
      }
      
      if (subscriptionValidUntil) {
        user.subscriptionValidUntil = new Date(subscriptionValidUntil);
      } else if (subscription === 'premium') {
        // If upgrading to premium without a specific date, set to 1 month from now
        const oneMonthFromNow = new Date();
        oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
        user.subscriptionValidUntil = oneMonthFromNow;
      } else {
        // If downgrading to free, clear the valid until date
        user.subscriptionValidUntil = null;
      }

      // Save user
      await user.save();

      // Log the subscription update
      const activityLog = new ActivityLog({
        type: 'subscription_update',
        userId: user._id,
        email: user.email,
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        details: `User updated subscription to ${subscription}${autoRenew !== undefined ? `, auto-renew: ${autoRenew}` : ''}`,
        success: true
      });
      await activityLog.save();

      // Return updated user without password
      const updatedUser = await User.findById(req.userId).select('-password');
      res.json(updatedUser);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   PUT /api/auth/sacred-six
// @desc    Update user's Sacred Six elements (mission, values, alignment)
// @access  Private
router.put(
  '/sacred-six',
  [
    auth,
    body('mission').optional().isString(),
    body('values').optional().isArray(),
    body('alignment').optional().isString()
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { mission, values, alignment } = req.body;

    try {
      // Find user
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Update Sacred Six elements
      if (mission !== undefined) user.mission = mission;
      if (values !== undefined) user.values = values;
      if (alignment !== undefined) user.alignment = alignment;

      // Save user
      await user.save();

      // Return updated user without password
      const updatedUser = await User.findById(req.userId).select('-password');
      res.json(updatedUser);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;
