const express = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const DailyCompletion = require('../models/DailyCompletion');
const Task = require('../models/Task');

const router = express.Router();

// @route   GET /api/daily-completion/stats
// @desc    Get daily completion statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    // Get all daily completion records for the user
    const completionRecords = await DailyCompletion.find({ userId: req.userId });
    
    // Calculate daily completion rate
    const totalDays = completionRecords.length;
    const fullyCompletedDays = completionRecords.filter(record => record.isFullyCompleted).length;
    const completionRate = totalDays > 0 ? (fullyCompletedDays / totalDays) * 100 : 0;
    
    // Calculate average tasks completed per day
    const totalTasksCompleted = completionRecords.reduce((sum, record) => sum + record.tasksCompleted, 0);
    const averageTasksCompleted = totalDays > 0 ? totalTasksCompleted / totalDays : 0;
    
    // Get completion records for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentRecords = await DailyCompletion.find({
      userId: req.userId,
      date: { $gte: sevenDaysAgo }
    }).sort({ date: 1 });
    
    // Format data for chart display
    const chartData = recentRecords.map(record => ({
      date: record.date.toISOString().split('T')[0],
      tasksCompleted: record.tasksCompleted,
      tasksSelected: record.tasksSelected,
      completionPercentage: record.tasksSelected > 0 
        ? Math.round((record.tasksCompleted / record.tasksSelected) * 100) 
        : 0
    }));
    
    res.json({
      totalDays,
      fullyCompletedDays,
      completionRate: Math.round(completionRate),
      averageTasksCompleted: Math.round(averageTasksCompleted * 10) / 10, // Round to 1 decimal place
      chartData
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/daily-completion/update
// @desc    Update daily completion record for today
// @access  Private
router.post('/update', auth, async (req, res) => {
  try {
    // Get today's date (without time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get all tasks selected for today
    const todayTasks = await Task.find({
      userId: req.userId,
      isSelectedForToday: true
    });
    
    const tasksSelected = todayTasks.length;
    const tasksCompleted = todayTasks.filter(task => task.status === 'done').length;
    const isFullyCompleted = tasksSelected > 0 && tasksSelected === tasksCompleted;
    
    // Find or create a daily completion record for today
    let completionRecord = await DailyCompletion.findOne({
      userId: req.userId,
      date: today
    });
    
    if (completionRecord) {
      // Update existing record
      completionRecord.tasksSelected = tasksSelected;
      completionRecord.tasksCompleted = tasksCompleted;
      completionRecord.isFullyCompleted = isFullyCompleted;
    } else {
      // Create new record
      completionRecord = new DailyCompletion({
        userId: req.userId,
        date: today,
        tasksSelected,
        tasksCompleted,
        isFullyCompleted
      });
    }
    
    await completionRecord.save();
    
    res.json(completionRecord);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
