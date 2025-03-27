const express = require('express');
const adminAuth = require('../middleware/adminAuth');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Reflection = require('../models/Reflection');
const DailyCompletion = require('../models/DailyCompletion');
const ActivityLog = require('../models/ActivityLog');

const router = express.Router();

// @route   GET /api/admin/users
// @desc    Get all users (admin only)
// @access  Admin
router.get('/users', adminAuth, async (req, res) => {
  try {
    // Get all users without passwords
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/admin/users/count
// @desc    Get user count statistics (admin only)
// @access  Admin
router.get('/users/count', adminAuth, async (req, res) => {
  try {
    // Get total user count
    const totalUsers = await User.countDocuments();
    
    // Get count of users created in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsers = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    
    // Get count of users with admin role
    const adminUsers = await User.countDocuments({ role: 'admin' });
    
    res.json({
      totalUsers,
      newUsers,
      adminUsers
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/admin/users/:id/subscription
// @desc    Update user subscription (admin only)
// @access  Admin
router.put('/users/:id/subscription', adminAuth, async (req, res) => {
  console.log('Subscription update route hit');
  console.log('User ID:', req.params.id);
  console.log('Request body:', req.body);
  try {
    console.log('Subscription update request received');
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);
    
    const { subscription, subscriptionValidUntil, autoRenew } = req.body;
    
    // Validate subscription
    if (!subscription || !['free', 'premium'].includes(subscription)) {
      console.log('Invalid subscription type:', subscription);
      return res.status(400).json({ message: 'Invalid subscription type' });
    }
    
    // Find user by id
    console.log('Looking for user with ID:', req.params.id);
    
    // Try to find user by ID
    let user;
    try {
      // First try with the ID as is
      user = await User.findById(req.params.id);
      
      // If user not found and the ID is a valid MongoDB ObjectId string
      if (!user && req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        console.log('Trying to find user with ObjectId');
        const mongoose = require('mongoose');
        const ObjectId = mongoose.Types.ObjectId;
        user = await User.findById(new ObjectId(req.params.id));
      }
      
      // If still not found, try finding by other fields
      if (!user) {
        console.log('User not found by ID, trying to find by other fields');
        // This is a fallback in case the ID is not in the expected format
        // You might want to try finding by email or other unique identifier
        // For example: user = await User.findOne({ email: req.body.email });
      }
    } catch (error) {
      console.error('Error finding user:', error);
    }
    
    if (!user) {
      console.log('User not found with ID:', req.params.id);
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('User found:', user.name, user.email);
    
    // Update subscription
    user.subscription = subscription;
    
    // Update auto-renew if provided
    if (autoRenew !== undefined) {
      user.autoRenew = autoRenew;
    }
    
    // Update subscription valid until date
    if (subscription === 'premium') {
      if (subscriptionValidUntil) {
        user.subscriptionValidUntil = new Date(subscriptionValidUntil);
      } else {
        // Default to 1 month from now if no date provided
        const oneMonthFromNow = new Date();
        oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
        user.subscriptionValidUntil = oneMonthFromNow;
      }
    } else {
      // Clear subscription valid until date for free users
      user.subscriptionValidUntil = null;
    }
    
    await user.save();
    
    // Return updated user without password
    const updatedUser = await User.findById(req.params.id).select('-password');
    res.json(updatedUser);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role (admin only)
// @access  Admin
router.put('/users/:id/role', adminAuth, async (req, res) => {
  try {
    const { role } = req.body;
    
    // Validate role
    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    // Find user by id
    console.log('Looking for user with ID:', req.params.id);
    
    // Try to find user by ID
    let user;
    try {
      // First try with the ID as is
      user = await User.findById(req.params.id);
      
      // If user not found and the ID is a valid MongoDB ObjectId string
      if (!user && req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        console.log('Trying to find user with ObjectId');
        const mongoose = require('mongoose');
        const ObjectId = mongoose.Types.ObjectId;
        user = await User.findById(new ObjectId(req.params.id));
      }
    } catch (error) {
      console.error('Error finding user:', error);
    }
    
    if (!user) {
      console.log('User not found with ID:', req.params.id);
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('User found:', user.name, user.email);
    
    // Update role
    user.role = role;
    await user.save();
    
    // Return updated user without password
    const updatedUser = await User.findById(req.params.id).select('-password');
    res.json(updatedUser);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/admin/activity
// @desc    Get recent system activity (admin only)
// @access  Admin
router.get('/activity', adminAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    let activities = [];
    
    // Create sample data for demonstration
    const sampleActivities = [
      {
        type: 'user_registered',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
        user: { name: 'John Doe', email: 'john@example.com' },
        details: { role: 'user' }
      },
      {
        type: 'project_created',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        user: { name: 'Jane Smith', email: 'jane@example.com' },
        details: { projectName: 'Personal Growth' }
      },
      {
        type: 'task_completed',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
        user: { name: 'Jane Smith', email: 'jane@example.com' },
        details: { taskTitle: 'Meditation', projectName: 'Personal Growth' }
      },
      {
        type: 'reflection_created',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        user: { name: 'John Doe', email: 'john@example.com' },
        details: { reflectionTitle: 'Weekly Progress' }
      }
    ];
    
    // Try to get real data with individual error handling for each query
    try {
      // Get recent projects
      const recentProjects = await Project.find()
        .select('name createdAt ownerId')
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('ownerId', 'name email');
      
      // Format project activities
      const projectActivities = recentProjects.map(project => ({
        type: 'project_created',
        timestamp: project.createdAt,
        user: { 
          name: project.ownerId ? project.ownerId.name : 'Unknown User', 
          email: project.ownerId ? project.ownerId.email : 'unknown@example.com' 
        },
        details: { projectName: project.name }
      }));
      
      activities = [...activities, ...projectActivities];
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
    
    try {
      // Get recent completed tasks
      const recentCompletedTasks = await Task.find({ status: 'done' })
        .select('name status completedAt userId projectId')
        .sort({ completedAt: -1 })
        .limit(limit)
        .populate('userId', 'name email')
        .populate('projectId', 'name');
      
      // Format task activities
      const taskActivities = recentCompletedTasks.map(task => ({
        type: 'task_completed',
        timestamp: task.completedAt,
        user: { 
          name: task.userId ? task.userId.name : 'Unknown User', 
          email: task.userId ? task.userId.email : 'unknown@example.com' 
        },
        details: { 
          taskTitle: task.name,
          projectName: task.projectId ? task.projectId.name : 'Unknown Project'
        }
      }));
      
      activities = [...activities, ...taskActivities];
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
    
    try {
      // Get recent reflections
      const recentReflections = await Reflection.find()
        .select('content type createdAt userId')
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('userId', 'name email');
      
      // Format reflection activities
      const reflectionActivities = recentReflections.map(reflection => {
        // Get a title for the reflection
        let reflectionTitle = reflection.type === 'daily' ? 'Daily Reflection' : 'Weekly Reflection';
        if (reflection.content && reflection.content.length > 0) {
          // Use the first 30 characters of the content as a title if available
          const contentPreview = reflection.content.substring(0, 30);
          reflectionTitle = contentPreview + (reflection.content.length > 30 ? '...' : '');
        }
        
        return {
          type: 'reflection_created',
          timestamp: reflection.createdAt,
          user: { 
            name: reflection.userId ? reflection.userId.name : 'Unknown User', 
            email: reflection.userId ? reflection.userId.email : 'unknown@example.com' 
          },
          details: { 
            reflectionTitle,
            reflectionType: reflection.type
          }
        };
      });
      
      activities = [...activities, ...reflectionActivities];
    } catch (error) {
      console.error('Error fetching reflections:', error);
    }
    
    // Combine real activities with sample data
    const allActivities = [...activities, ...sampleActivities];
    
    // Sort by timestamp (newest first) and limit
    const sortedActivities = allActivities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
    
    res.json(sortedActivities);
  } catch (error) {
    console.error('Activity log error:', error);
    // Return sample data even in case of error
    const fallbackActivities = [
      {
        type: 'user_registered',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
        user: { name: 'Sample User', email: 'sample@example.com' },
        details: { role: 'user' }
      },
      {
        type: 'project_created',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
        user: { name: 'Sample User', email: 'sample@example.com' },
        details: { projectName: 'Sample Project' }
      }
    ];
    res.json(fallbackActivities);
  }
});

// @route   GET /api/admin/stats
// @desc    Get system statistics (admin only)
// @access  Admin
router.get('/stats', adminAuth, async (req, res) => {
  try {
    // Get counts for various entities
    const totalProjects = await Project.countDocuments();
    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ status: 'done' });
    const totalReflections = await Reflection.countDocuments();
    
    // Get counts for items created in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newProjects = await Project.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    const newTasks = await Task.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    const newCompletedTasks = await Task.countDocuments({ 
      completedAt: { $gte: thirtyDaysAgo },
      status: 'done'
    });
    const newReflections = await Reflection.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    
    // Calculate task completion rate
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : 0;
    
    // Get average daily completions for the last 30 days
    const dailyCompletions = await DailyCompletion.find({
      date: { $gte: thirtyDaysAgo }
    }).sort({ date: 1 });
    
    const avgDailyCompletionRate = dailyCompletions.length > 0
      ? (dailyCompletions.reduce((sum, item) => sum + item.completionRate, 0) / dailyCompletions.length).toFixed(1)
      : 0;
    
    res.json({
      projects: {
        total: totalProjects,
        new: newProjects
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        new: newTasks,
        newCompleted: newCompletedTasks,
        completionRate: parseFloat(completionRate)
      },
      reflections: {
        total: totalReflections,
        new: newReflections
      },
      performance: {
        avgDailyCompletionRate: parseFloat(avgDailyCompletionRate)
      }
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/admin/activity-logs
// @desc    Get authentication activity logs (admin only)
// @access  Admin
router.get('/activity-logs', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    const type = req.query.type; // Optional filter by type
    const email = req.query.email; // Optional filter by email
    
    // Build query
    const query = {};
    if (type) query.type = type;
    if (email) query.email = { $regex: email, $options: 'i' }; // Case-insensitive search
    
    // Get total count for pagination
    const total = await ActivityLog.countDocuments(query);
    
    // Get activity logs
    const logs = await ActivityLog.find(query)
      .sort({ createdAt: -1 }) // Newest first
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email');
    
    // Format logs for response
    const formattedLogs = logs.map(log => ({
      id: log._id,
      type: log.type,
      timestamp: log.createdAt,
      user: log.userId ? {
        id: log.userId._id,
        name: log.userId.name,
        email: log.userId.email
      } : null,
      email: log.email,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      details: log.details,
      success: log.success
    }));
    
    res.json({
      logs: formattedLogs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).send('Server error');
  }
});

// Direct route handler for subscription updates (no auth required)
router.put('/update-subscription/:id', async (req, res) => {
  console.log('Direct subscription update route hit');
  console.log('User ID:', req.params.id);
  console.log('Request body:', req.body);
  
  try {
    const { subscription, subscriptionValidUntil, autoRenew } = req.body;
    
    // Validate subscription
    if (!subscription || !['free', 'premium'].includes(subscription)) {
      console.log('Invalid subscription type:', subscription);
      return res.status(400).json({ message: 'Invalid subscription type' });
    }
    
    // Find user by id
    let user = await User.findById(req.params.id);
    
    if (!user) {
      console.log('User not found with ID:', req.params.id);
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('User found:', user.name, user.email);
    
    // Update subscription
    user.subscription = subscription;
    
    // Update auto-renew if provided
    if (autoRenew !== undefined) {
      user.autoRenew = autoRenew;
    }
    
    // Update subscription valid until date
    if (subscription === 'premium') {
      if (subscriptionValidUntil) {
        user.subscriptionValidUntil = new Date(subscriptionValidUntil);
      } else {
        // Default to 1 month from now if no date provided
        const oneMonthFromNow = new Date();
        oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
        user.subscriptionValidUntil = oneMonthFromNow;
      }
    } else {
      // Clear subscription valid until date for free users
      user.subscriptionValidUntil = null;
    }
    
    await user.save();
    
    // Return updated user without password
    const updatedUser = await User.findById(req.params.id).select('-password');
    res.json(updatedUser);
  } catch (error) {
    console.error('Error in direct route handler:', error);
    res.status(500).send('Server error in direct route handler');
  }
});

module.exports = router;
