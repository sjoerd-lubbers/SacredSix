const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');

const router = express.Router();

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private
router.post(
  '/',
  [
    auth,
    body('name', 'Task name is required').not().isEmpty(),
    body('projectId', 'Project ID is required').not().isEmpty()
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const {
        projectId,
        name,
        description,
        priority,
        status,
        estimatedTime,
        dueDate
      } = req.body;

      // Check if project exists and user has access to it
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      // Check if user is owner or collaborator
      const isOwner = project.ownerId.toString() === req.userId.toString();
      const isCollaborator = project.collaborators.some(
        collab => collab.userId.toString() === req.userId.toString() && 
                 ['editor', 'admin'].includes(collab.role)
      );
      
      if (!isOwner && !isCollaborator) {
        return res.status(401).json({ message: 'Not authorized to create tasks in this project' });
      }

      // Create new task
      const task = new Task({
        projectId,
        userId: req.userId,
        name,
        description,
        priority: priority || 'medium',
        status: status || 'todo',
        estimatedTime: estimatedTime || 0,
        dueDate: dueDate || null
      });

      // Save task to database
      await task.save();

      res.status(201).json(task);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   GET /api/tasks
// @desc    Get all tasks for current user (including from shared projects)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // First, get all projects the user has access to (owned or shared)
    const projects = await Project.find({
      $or: [
        { ownerId: req.userId },
        { 'collaborators.userId': req.userId }
      ]
    });
    
    const projectIds = projects.map(project => project._id);
    
    // Then get all tasks from those projects
    const tasks = await Task.find({
      $or: [
        { userId: req.userId }, // Tasks created by the user
        { projectId: { $in: projectIds } } // Tasks from projects the user has access to
      ]
    }).sort({ createdAt: -1 });
    
    res.json(tasks);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/tasks/project/:projectId
// @desc    Get all tasks for a specific project
// @access  Private
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    // Check if project exists and user has access to it
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if user is owner or collaborator
    const isOwner = project.ownerId.toString() === req.userId.toString();
    const isCollaborator = project.collaborators.some(
      collab => collab.userId.toString() === req.userId.toString()
    );
    
    if (!isOwner && !isCollaborator) {
      return res.status(401).json({ message: 'Not authorized to view tasks in this project' });
    }

    // Get all tasks for this project
    // Note: We're getting all tasks for the project, not just the user's tasks
    const tasks = await Task.find({ 
      projectId: req.params.projectId
    }).sort({ createdAt: -1 });
    
    res.json(tasks);
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   GET /api/tasks/today
// @desc    Get tasks selected for today (including from shared projects)
// @access  Private
router.get('/today', auth, async (req, res) => {
  try {
    // Get all projects the user has access to (owned or shared)
    const projects = await Project.find({
      $or: [
        { ownerId: req.userId },
        { 'collaborators.userId': req.userId }
      ]
    });
    
    const projectIds = projects.map(project => project._id);
    
    // Get all tasks selected for today from user's own tasks and shared projects
    const tasks = await Task.find({
      isSelectedForToday: true,
      $or: [
        { userId: req.userId }, // Tasks created by the user
        { projectId: { $in: projectIds } } // Tasks from projects the user has access to
      ]
    }).sort({ priority: 1 });
    
    res.json(tasks);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/tasks/:id
// @desc    Get task by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    // Check if task exists
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Get the project to check permissions
    const project = await Project.findById(task.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is owner or collaborator
    const isOwner = project.ownerId.toString() === req.userId.toString();
    const isCollaborator = project.collaborators.some(
      collab => collab.userId.toString() === req.userId.toString()
    );

    if (!isOwner && !isCollaborator) {
      return res.status(401).json({ message: 'Not authorized to view this task' });
    }

    res.json(task);
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update a task
// @access  Private
router.put(
  '/:id',
  [
    auth,
    body('name', 'Task name is required').not().isEmpty()
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const {
        name,
        description,
        priority,
        status,
        estimatedTime,
        dueDate,
        isSelectedForToday,
        isRecurring,
        recurringDays
      } = req.body;

      // Find task by ID
      let task = await Task.findById(req.params.id);

      // Check if task exists
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }

      // Store the previous status for notification
      const previousStatus = task.status;

      // Get the project to check permissions
      const project = await Project.findById(task.projectId).populate('ownerId', 'name email');
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      // Populate collaborators
      await project.populate('collaborators.userId', 'name email');

      // Check if user is owner or collaborator with edit permissions
      const isOwner = project.ownerId._id.toString() === req.userId.toString();
      const isEditor = project.collaborators.some(
        collab => collab.userId._id.toString() === req.userId.toString() && 
                 ['editor', 'admin'].includes(collab.role)
      );

      // Only the task creator, project owner, or collaborators with edit permissions can update tasks
      const isTaskCreator = task.userId.toString() === req.userId.toString();
      
      if (!isTaskCreator && !isOwner && !isEditor) {
        return res.status(401).json({ message: 'Not authorized to update this task' });
      }

      // Get the user who is updating the task
      const updatedBy = await User.findById(req.userId);
      if (!updatedBy) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Update task
      task.name = name;
      if (description !== undefined) task.description = description;
      if (priority !== undefined) task.priority = priority;
      if (status !== undefined) task.status = status;
      if (estimatedTime !== undefined) task.estimatedTime = estimatedTime;
      if (dueDate !== undefined) task.dueDate = dueDate;
      if (isSelectedForToday !== undefined) task.isSelectedForToday = isSelectedForToday;
      if (isRecurring !== undefined) task.isRecurring = isRecurring;
      if (recurringDays !== undefined) task.recurringDays = recurringDays;

      // Save updated task
      await task.save();

      // Log task status changes
      if (status !== undefined && status !== previousStatus) {
        console.log('Task status changed:', {
          taskId: task._id,
          taskName: task.name,
          previousStatus,
          newStatus: status,
          updatedBy: updatedBy.name,
          projectId: project._id,
          projectName: project.name
        });
      }

      res.json(task);
    } catch (error) {
      console.error(error.message);
      if (error.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Task not found' });
      }
      res.status(500).send('Server error');
    }
  }
);

// @route   PUT /api/tasks/today/select
// @desc    Select tasks for today (including from shared projects)
// @access  Private
router.put('/today/select', auth, async (req, res) => {
  try {
    const { taskIds } = req.body;

    if (!Array.isArray(taskIds) || taskIds.length > 6) {
      return res.status(400).json({ 
        message: 'Invalid task selection. You can select up to 6 tasks for today.' 
      });
    }

    // First, unselect all tasks for today
    await Task.updateMany(
      { userId: req.userId, isSelectedForToday: true },
      { isSelectedForToday: false }
    );

    // For each task ID, check if the user has access to it
    if (taskIds.length > 0) {
      // Get all tasks
      const tasksToSelect = await Task.find({ _id: { $in: taskIds } });
      
      // For each task, check if the user has access to the project
      for (const task of tasksToSelect) {
        const project = await Project.findById(task.projectId);
        
        if (!project) continue;
        
        // Check if user is owner or collaborator
        const isOwner = project.ownerId.toString() === req.userId.toString();
        const isCollaborator = project.collaborators.some(
          collab => collab.userId.toString() === req.userId.toString()
        );
        
        if (isOwner || isCollaborator || task.userId.toString() === req.userId.toString()) {
          // User has access to this task, mark it as selected for today
          task.isSelectedForToday = true;
          await task.save();
        }
      }
    }

    // Get the updated today's tasks - now include tasks from shared projects
    const todayTasks = await Task.find({
      isSelectedForToday: true,
      $or: [
        { userId: req.userId }, // Tasks created by the user
        { 
          projectId: { 
            $in: await Project.find({
              'collaborators.userId': req.userId
            }).distinct('_id')
          } 
        } // Tasks from projects shared with the user
      ]
    }).sort({ priority: 1 });

    res.json(todayTasks);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/tasks/:id/logs
// @desc    Add a log entry to a task
// @access  Private
router.post(
  '/:id/logs',
  [
    auth,
    body('content', 'Log content is required').not().isEmpty()
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { content } = req.body;

      // Find task by ID
      let task = await Task.findById(req.params.id);

      // Check if task exists
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }

      // Get the project to check permissions
      const project = await Project.findById(task.projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      // Check if user is owner or collaborator with edit permissions
      const isOwner = project.ownerId.toString() === req.userId.toString();
      const isEditor = project.collaborators.some(
        collab => collab.userId.toString() === req.userId.toString() && 
                 ['editor', 'admin'].includes(collab.role)
      );

      // Only the task creator, project owner, or collaborators with edit permissions can add logs
      const isTaskCreator = task.userId.toString() === req.userId.toString();
      
      if (!isTaskCreator && !isOwner && !isEditor) {
        return res.status(401).json({ message: 'Not authorized to add logs to this task' });
      }

      // Get the user who is adding the log
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Create new log entry
      const logEntry = {
        content,
        userId: req.userId,
        userName: user.name,
        createdAt: new Date()
      };

      // Add log entry to task
      task.logs = task.logs || [];
      task.logs.push(logEntry);

      // Save updated task
      await task.save();

      res.json(task);
    } catch (error) {
      console.error(error.message);
      if (error.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Task not found' });
      }
      res.status(500).send('Server error');
    }
  }
);

// @route   GET /api/tasks/:id/logs
// @desc    Get all logs for a task
// @access  Private
router.get('/:id/logs', auth, async (req, res) => {
  try {
    // Find task by ID
    const task = await Task.findById(req.params.id);

    // Check if task exists
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Get the project to check permissions
    const project = await Project.findById(task.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is owner or collaborator
    const isOwner = project.ownerId.toString() === req.userId.toString();
    const isCollaborator = project.collaborators.some(
      collab => collab.userId.toString() === req.userId.toString()
    );

    if (!isOwner && !isCollaborator) {
      return res.status(401).json({ message: 'Not authorized to view logs for this task' });
    }

    // Return logs sorted by creation date (newest first)
    const logs = task.logs || [];
    res.json(logs.sort((a, b) => b.createdAt - a.createdAt));
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/tasks/:id/logs/:logId
// @desc    Delete a log entry from a task
// @access  Private
router.delete('/:id/logs/:logId', auth, async (req, res) => {
  try {
    // Find task by ID
    const task = await Task.findById(req.params.id);

    // Check if task exists
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Get the project to check permissions
    const project = await Project.findById(task.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Find the log entry
    const logIndex = task.logs.findIndex(log => log._id.toString() === req.params.logId);
    
    if (logIndex === -1) {
      return res.status(404).json({ message: 'Log entry not found' });
    }
    
    // Check if the user is the creator of the log
    const isLogCreator = task.logs[logIndex].userId.toString() === req.userId.toString();
    
    // Check if user is project owner or admin
    const isOwner = project.ownerId.toString() === req.userId.toString();
    const isAdmin = project.collaborators.some(
      collab => collab.userId.toString() === req.userId.toString() && collab.role === 'admin'
    );

    // Only allow deletion if the user is the log creator, project owner, or admin
    if (!isLogCreator && !isOwner && !isAdmin) {
      return res.status(401).json({ message: 'Not authorized to delete this log entry' });
    }

    // Remove the log entry
    task.logs.splice(logIndex, 1);
    await task.save();

    res.json({ message: 'Log entry removed' });
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Task or log entry not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   GET /api/tasks/stats/sparkline
// @desc    Get task creation and completion data for sparklines
// @access  Private
router.get('/stats/sparkline', auth, async (req, res) => {
  try {
    // Get the last 30 days of data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Get all tasks for the user (including from shared projects)
    const projects = await Project.find({
      $or: [
        { ownerId: req.userId },
        { 'collaborators.userId': req.userId }
      ],
      isArchived: false // Exclude archived projects
    });
    
    const projectIds = projects.map(project => project._id);
    
    // Get all tasks created by the user or in projects the user has access to
    const tasks = await Task.find({
      $or: [
        { userId: req.userId }, // Tasks created by the user
        { projectId: { $in: projectIds } } // Tasks from projects the user has access to
      ],
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    // Group tasks by creation date
    const creationData = {};
    const completionData = {};
    
    // Initialize data for the last 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      creationData[dateString] = 0;
      completionData[dateString] = 0;
    }
    
    // Count tasks created per day
    tasks.forEach(task => {
      const dateString = task.createdAt.toISOString().split('T')[0];
      if (creationData[dateString] !== undefined) {
        creationData[dateString]++;
      }
    });
    
    // Count tasks completed per day
    // We'll use the updatedAt field for tasks with status 'done'
    const completedTasks = await Task.find({
      $or: [
        { userId: req.userId }, // Tasks created by the user
        { projectId: { $in: projectIds } } // Tasks from projects the user has access to
      ],
      status: 'done',
      updatedAt: { $gte: thirtyDaysAgo }
    });
    
    completedTasks.forEach(task => {
      const dateString = task.updatedAt.toISOString().split('T')[0];
      if (completionData[dateString] !== undefined) {
        completionData[dateString]++;
      }
    });
    
    // Convert to arrays for sparklines
    const creationSparkline = Object.keys(creationData)
      .sort()
      .map(date => ({ date, count: creationData[date] }));
    
    const completionSparkline = Object.keys(completionData)
      .sort()
      .map(date => ({ date, count: completionData[date] }));
    
    res.json({
      creationSparkline,
      completionSparkline
    });
  } catch (error) {
    console.error('Error fetching sparkline data:', error);
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    // Find task by ID
    const task = await Task.findById(req.params.id);

    // Check if task exists
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Get the project to check permissions
    const project = await Project.findById(task.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is owner or admin collaborator
    const isOwner = project.ownerId.toString() === req.userId.toString();
    const isAdmin = project.collaborators.some(
      collab => collab.userId.toString() === req.userId.toString() && collab.role === 'admin'
    );

    // Only the task creator, project owner, or admin collaborators can delete tasks
    const isTaskCreator = task.userId.toString() === req.userId.toString();
    
    if (!isTaskCreator && !isOwner && !isAdmin) {
      return res.status(401).json({ message: 'Not authorized to delete this task' });
    }

    // Delete task
    await task.deleteOne();

    res.json({ message: 'Task removed' });
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router;
