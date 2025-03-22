const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Goal = require('../models/Goal');
const Task = require('../models/Task');
const mongoose = require('mongoose');

// Helper function to determine goal status based on linked tasks
const determineGoalStatus = async (goalId) => {
  const linkedTasks = await Task.find({ goalId });
  
  if (linkedTasks.length === 0) {
    return 'not_started';
  }
  
  const completedTasks = linkedTasks.filter(task => task.status === 'done');
  const inProgressTasks = linkedTasks.filter(task => task.status === 'in_progress');
  
  if (completedTasks.length === linkedTasks.length) {
    return 'completed';
  } else if (inProgressTasks.length > 0 || completedTasks.length > 0) {
    return 'in_progress';
  } else {
    return 'not_started';
  }
};

// Create a new goal
router.post('/', auth, async (req, res) => {
  try {
    const { projectId, name, description, status, targetDate, progress } = req.body;

    // Create a new goal
    const goal = new Goal({
      projectId,
      name,
      description,
      status: status || 'not_started',
      targetDate,
      progress: progress || 0,
    });

    await goal.save();
    res.status(201).json(goal);
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all goals for a project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const goals = await Goal.find({ projectId: req.params.projectId });
    
    // For each goal, calculate progress based on linked tasks and update status
    const goalsWithUpdates = await Promise.all(goals.map(async (goal) => {
      const linkedTasks = await Task.find({ goalId: goal._id });
      const completedTasks = linkedTasks.filter(task => task.status === 'done');
      
      // Calculate progress
      const progress = linkedTasks.length > 0 
        ? Math.round((completedTasks.length / linkedTasks.length) * 100) 
        : 0;
      
      // Determine status
      const status = await determineGoalStatus(goal._id);
      
      // Update goal progress and status in database if they have changed
      if (progress !== goal.progress || status !== goal.status) {
        goal.progress = progress;
        goal.status = status;
        await goal.save();
      }
      
      return goal;
    }));
    
    res.json(goalsWithUpdates);
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific goal
router.get('/:id', auth, async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    // Calculate progress based on linked tasks
    const linkedTasks = await Task.find({ goalId: goal._id });
    const completedTasks = linkedTasks.filter(task => task.status === 'done');
    
    const progress = linkedTasks.length > 0 
      ? Math.round((completedTasks.length / linkedTasks.length) * 100) 
      : 0;
    
    // Determine status
    const status = await determineGoalStatus(goal._id);
    
    // Update goal progress and status in database if they have changed
    if (progress !== goal.progress || status !== goal.status) {
      goal.progress = progress;
      goal.status = status;
      await goal.save();
    }
    
    res.json(goal);
  } catch (error) {
    console.error('Error fetching goal:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a goal
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, status, targetDate, progress } = req.body;
    
    // Find the goal
    const goal = await Goal.findById(req.params.id);
    
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    // Update goal fields
    if (name !== undefined) goal.name = name;
    if (description !== undefined) goal.description = description;
    if (status !== undefined) goal.status = status;
    if (targetDate !== undefined) goal.targetDate = targetDate;
    if (progress !== undefined) goal.progress = progress;
    
    // If status is not explicitly provided, determine it from linked tasks
    if (status === undefined) {
      goal.status = await determineGoalStatus(goal._id);
    }
    
    // If progress is not explicitly provided, calculate it from linked tasks
    if (progress === undefined) {
      const linkedTasks = await Task.find({ goalId: goal._id });
      const completedTasks = linkedTasks.filter(task => task.status === 'done');
      
      goal.progress = linkedTasks.length > 0 
        ? Math.round((completedTasks.length / linkedTasks.length) * 100) 
        : 0;
    }
    
    await goal.save();
    res.json(goal);
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a goal
router.delete('/:id', auth, async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    // Remove goal reference from all linked tasks
    await Task.updateMany(
      { goalId: goal._id },
      { $set: { goalId: null } }
    );
    
    await goal.remove();
    res.json({ message: 'Goal deleted' });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get tasks linked to a goal
router.get('/:id/tasks', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ goalId: req.params.id });
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching goal tasks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update goal status when a task status changes
router.post('/:id/update-status', auth, async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    // Determine status from linked tasks
    const status = await determineGoalStatus(goal._id);
    
    // Calculate progress
    const linkedTasks = await Task.find({ goalId: goal._id });
    const completedTasks = linkedTasks.filter(task => task.status === 'done');
    
    const progress = linkedTasks.length > 0 
      ? Math.round((completedTasks.length / linkedTasks.length) * 100) 
      : 0;
    
    // Update goal
    goal.status = status;
    goal.progress = progress;
    await goal.save();
    
    res.json(goal);
  } catch (error) {
    console.error('Error updating goal status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
