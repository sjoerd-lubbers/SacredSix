const Task = require('../models/Task');
const DailyCompletion = require('../models/DailyCompletion');
const mongoose = require('mongoose');

/**
 * Schedule a function to run at a specific time each day
 * @param {Function} fn - The function to run
 * @param {number} hour - The hour to run the function (0-23)
 * @param {number} minute - The minute to run the function (0-59)
 * @returns {NodeJS.Timeout} - The interval ID
 */
const scheduleDaily = (fn, hour, minute) => {
  const now = new Date();
  let scheduledTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hour,
    minute,
    0
  );
  
  // If the scheduled time has already passed today, schedule for tomorrow
  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }
  
  // Calculate the delay until the scheduled time
  const delay = scheduledTime.getTime() - now.getTime();
  
  // Schedule the first execution
  const timeout = setTimeout(() => {
    fn();
    
    // Then schedule it to run every 24 hours
    setInterval(fn, 24 * 60 * 60 * 1000);
  }, delay);
  
  return timeout;
};

/**
 * Reset recurring tasks that were completed yesterday
 */
const resetRecurringTasks = async () => {
  try {
    console.log('Resetting recurring tasks...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get the current day of the week
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = daysOfWeek[today.getDay()];
    
    // Find all recurring tasks that were completed before today
    const tasks = await Task.find({
      isRecurring: true,
      status: 'done',
      lastCompletedDate: { $lt: today }
    });
    
    console.log(`Found ${tasks.length} recurring tasks to reset`);
    
    // Reset tasks that should recur today based on recurringDays
    for (const task of tasks) {
      // If recurringDays is empty or includes the current day, reset the task
      if (task.recurringDays.length === 0 || task.recurringDays.includes(currentDay)) {
        task.status = 'todo';
        task.completedAt = null;
        await task.save();
        console.log(`Reset task: ${task.name}`);
      }
    }
    
    console.log('Recurring tasks reset complete');
  } catch (error) {
    console.error('Error resetting recurring tasks:', error);
  }
};

/**
 * Update daily completion records for all users
 */
const updateDailyCompletionRecords = async () => {
  try {
    console.log('Updating daily completion records...');
    
    // Get yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    // Get all users with tasks selected for yesterday
    const tasks = await Task.find({ isSelectedForToday: true });
    
    // Group tasks by user
    const userTasks = {};
    tasks.forEach(task => {
      const userId = task.userId.toString();
      if (!userTasks[userId]) {
        userTasks[userId] = [];
      }
      userTasks[userId].push(task);
    });
    
    // Update or create daily completion records for each user
    for (const userId in userTasks) {
      const userTaskList = userTasks[userId];
      const tasksSelected = userTaskList.length;
      const tasksCompleted = userTaskList.filter(task => task.status === 'done').length;
      const isFullyCompleted = tasksSelected > 0 && tasksSelected === tasksCompleted;
      
      // Find or create a daily completion record for yesterday
      let completionRecord = await DailyCompletion.findOne({
        userId: mongoose.Types.ObjectId(userId),
        date: yesterday
      });
      
      if (completionRecord) {
        // Update existing record
        completionRecord.tasksSelected = tasksSelected;
        completionRecord.tasksCompleted = tasksCompleted;
        completionRecord.isFullyCompleted = isFullyCompleted;
      } else {
        // Create new record
        completionRecord = new DailyCompletion({
          userId: mongoose.Types.ObjectId(userId),
          date: yesterday,
          tasksSelected,
          tasksCompleted,
          isFullyCompleted
        });
      }
      
      await completionRecord.save();
      console.log(`Updated daily completion record for user ${userId}: ${tasksCompleted}/${tasksSelected} tasks completed`);
    }
    
    console.log('Daily completion records update complete');
  } catch (error) {
    console.error('Error updating daily completion records:', error);
  }
};

/**
 * Initialize all schedulers
 */
const initSchedulers = () => {
  console.log('Initializing schedulers...');
  
  // Schedule the reset of recurring tasks at midnight (00:00)
  scheduleDaily(resetRecurringTasks, 0, 0);
  
  // Schedule the update of daily completion records at 00:05
  scheduleDaily(updateDailyCompletionRecords, 0, 5);
  
  console.log('Schedulers initialized');
};

module.exports = {
  initSchedulers,
  scheduleDaily,
  resetRecurringTasks,
  updateDailyCompletionRecords
};
