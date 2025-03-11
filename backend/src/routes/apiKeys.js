const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const ApiKey = require('../models/ApiKey');
const Project = require('../models/Project');
const Task = require('../models/Task');

const router = express.Router();

// Middleware to authenticate with API key
const apiKeyAuth = async (req, res, next) => {
  const apiKey = req.header('X-API-Key');
  
  if (!apiKey) {
    return res.status(401).json({ message: 'No API key provided' });
  }
  
  try {
    // Find the API key in the database
    const keyDoc = await ApiKey.findOne({ key: apiKey, isActive: true });
    
    if (!keyDoc) {
      return res.status(401).json({ message: 'Invalid or inactive API key' });
    }
    
    // Update last used timestamp
    await keyDoc.updateLastUsed();
    
    // Add API key info to request
    req.apiKey = keyDoc;
    req.userId = keyDoc.userId;
    req.projectId = keyDoc.projectId;
    
    next();
  } catch (error) {
    console.error('API key authentication error:', error);
    res.status(500).send('Server error');
  }
};

// @route   POST /api/api-keys
// @desc    Create a new API key
// @access  Private
router.post(
  '/',
  [
    auth,
    body('name', 'Name is required').not().isEmpty(),
    body('projectId', 'Project ID is required').not().isEmpty()
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, projectId } = req.body;

      // Verify the project exists and user has access to it
      const project = await Project.findOne({
        _id: projectId,
        $or: [
          { ownerId: req.userId },
          { 'collaborators.userId': req.userId }
        ]
      });

      if (!project) {
        return res.status(404).json({ message: 'Project not found or not authorized' });
      }

      // Generate a new API key
      const key = ApiKey.generateKey();

      // Create new API key
      const apiKey = new ApiKey({
        userId: req.userId,
        name,
        key,
        projectId
      });

      // Save API key to database
      await apiKey.save();

      res.status(201).json({
        _id: apiKey._id,
        name: apiKey.name,
        key: apiKey.key, // Only return the key once when created
        projectId: apiKey.projectId,
        projectName: project.name, // Include the project name
        createdAt: apiKey.createdAt,
        isActive: apiKey.isActive
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   GET /api/api-keys
// @desc    Get all API keys for current user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const apiKeys = await ApiKey.find({ userId: req.userId })
      .select('-key') // Don't return the actual key for security
      .populate('projectId', 'name');
    
    res.json(apiKeys);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/api-keys/:id/deactivate
// @desc    Deactivate an API key
// @access  Private
router.put('/:id/deactivate', auth, async (req, res) => {
  try {
    // Find API key by ID and verify ownership
    let apiKey = await ApiKey.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!apiKey) {
      return res.status(404).json({ message: 'API key not found or not authorized' });
    }

    // Deactivate the API key
    apiKey.isActive = false;
    await apiKey.save();

    res.json({ message: 'API key deactivated' });
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'API key not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/api-keys/:id
// @desc    Delete an API key
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    // Find API key by ID and verify ownership
    const apiKey = await ApiKey.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!apiKey) {
      return res.status(404).json({ message: 'API key not found or not authorized' });
    }

    // Delete the API key
    await apiKey.deleteOne();

    res.json({ message: 'API key removed' });
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'API key not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   GET /api/api-keys/tasks
// @desc    Get tasks for a project using API key authentication
// @access  Public (with API key)
router.get('/tasks', apiKeyAuth, async (req, res) => {
  try {
    // Get tasks for the project associated with the API key
    const tasks = await Task.find({
      projectId: req.projectId,
      status: { $ne: 'done' } // Only return incomplete tasks
    }).sort({ priority: 1, dueDate: 1 });

    res.json(tasks);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/api-keys/today-tasks
// @desc    Get today's tasks for a project using API key authentication
// @access  Public (with API key)
router.get('/today-tasks', apiKeyAuth, async (req, res) => {
  try {
    // Get today's tasks for the project associated with the API key
    const tasks = await Task.find({
      projectId: req.projectId,
      isSelectedForToday: true,
      status: { $ne: 'done' } // Only return incomplete tasks
    }).sort({ priority: 1 });

    res.json(tasks);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});
// Export the router
module.exports = router;

// Export the apiKeyAuth middleware separately
module.exports.apiKeyAuth = apiKeyAuth;
