const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Reflection = require('../models/Reflection');
const DailyCompletion = require('../models/DailyCompletion');

/**
 * @route   GET /api/data-export
 * @desc    Export all user data
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch all user data
    const user = await User.findById(userId).select('-password');
    const projects = await Project.find({ ownerId: userId });
    const tasks = await Task.find({ userId });
    const reflections = await Reflection.find({ userId });
    const dailyCompletions = await DailyCompletion.find({ userId });

    // Create export object
    const exportData = {
      user,
      projects,
      tasks,
      reflections,
      dailyCompletions,
      exportDate: new Date(),
      version: '1.0'
    };

    res.json(exportData);
  } catch (err) {
    console.error('Error exporting data:', err);
    res.status(500).json({ message: 'Server error during data export' });
  }
});

/**
 * @route   POST /api/data-export/import
 * @desc    Import user data
 * @access  Private
 */
router.post('/import', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const importData = req.body;

    // Validate import data
    if (!importData || !importData.version || !importData.projects || !importData.tasks) {
      return res.status(400).json({ message: 'Invalid import data format' });
    }

    // Import projects without transactions
    // First, delete existing projects owned by the user
    await Project.deleteMany({ ownerId: userId });
    
    // Then insert the imported projects with the current user as owner
    const projectsToInsert = importData.projects.map(project => ({
      ...project,
      _id: undefined, // Let MongoDB generate new IDs
      ownerId: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    const insertedProjects = await Project.insertMany(projectsToInsert);
    
    // Create a mapping of old project IDs to new project IDs
    const projectIdMap = {};
    importData.projects.forEach((oldProject, index) => {
      projectIdMap[oldProject._id] = insertedProjects[index]._id;
    });

    // Import tasks with updated project references
    await Task.deleteMany({ userId });
    
    const tasksToInsert = importData.tasks.map(task => ({
      ...task,
      _id: undefined,
      userId,
      projectId: task.projectId ? projectIdMap[task.projectId] : null,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    await Task.insertMany(tasksToInsert);

    // Import reflections
    if (importData.reflections) {
      await Reflection.deleteMany({ userId });
      
      const reflectionsToInsert = importData.reflections.map(reflection => ({
        ...reflection,
        _id: undefined,
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      
      await Reflection.insertMany(reflectionsToInsert);
    }

    // Import daily completions
    if (importData.dailyCompletions) {
      await DailyCompletion.deleteMany({ userId });
      
      const dailyCompletionsToInsert = importData.dailyCompletions.map(completion => ({
        ...completion,
        _id: undefined,
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      
      await DailyCompletion.insertMany(dailyCompletionsToInsert);
    }

    res.json({ 
      message: 'Data imported successfully',
      stats: {
        projects: insertedProjects.length,
        tasks: tasksToInsert.length,
        reflections: importData.reflections ? importData.reflections.length : 0,
        dailyCompletions: importData.dailyCompletions ? importData.dailyCompletions.length : 0
      }
    });
  } catch (err) {
    console.error('Error importing data:', err);
    res.status(500).json({ message: 'Server error during data import' });
  }
});

module.exports = router;
