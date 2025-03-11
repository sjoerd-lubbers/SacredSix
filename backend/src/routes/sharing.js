const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const SharedList = require('../models/SharedList');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');

// Create a transporter for sending emails
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Share a list of tasks with someone by email
router.post('/share', auth, async (req, res) => {
  try {
    const { taskIds, recipientEmail, message } = req.body;
    
    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ message: 'No tasks selected for sharing' });
    }
    
    if (!recipientEmail) {
      return res.status(400).json({ message: 'Recipient email is required' });
    }
    
    // Check if all tasks exist and belong to the user
    const tasks = await Task.find({
      _id: { $in: taskIds },
    }).populate('projectId');
    
    if (tasks.length !== taskIds.length) {
      return res.status(404).json({ message: 'Some tasks were not found' });
    }
    
    // Create a unique sharing ID
    const shareId = uuidv4();
    
    // Create a new shared list
    const sharedList = new SharedList({
      shareId,
      userId: req.user.id,
      taskIds,
      recipientEmail,
      message: message || '',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires in 7 days
    });
    
    await sharedList.save();
    
    // Generate the sharing URL
    const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/shared/${shareId}`;
    
    // Prepare email content
    const emailContent = `
      <h2>Sacred Six Productivity - Shared Tasks</h2>
      <p>${req.user.name} has shared a list of tasks with you.</p>
      ${message ? `<p>Message: "${message}"</p>` : ''}
      <p>Click the link below to view the shared tasks:</p>
      <a href="${shareUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">View Shared Tasks</a>
      <p>This link will expire in 7 days.</p>
      <p>Tasks shared:</p>
      <ul>
        ${tasks.map(task => `<li>${task.name} (Project: ${task.projectId?.name || 'No Project'})</li>`).join('')}
      </ul>
    `;
    
    // Send the email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      subject: `${req.user.name} shared Sacred Six tasks with you`,
      html: emailContent,
    });
    
    res.json({ 
      success: true, 
      message: `Tasks shared successfully with ${recipientEmail}`,
      shareUrl
    });
  } catch (error) {
    console.error('Error sharing tasks:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all shared lists for the current user
router.get('/shared-by-me', auth, async (req, res) => {
  try {
    const sharedLists = await SharedList.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    
    // Get task details for each shared list
    const sharedListsWithDetails = await Promise.all(
      sharedLists.map(async (list) => {
        const tasks = await Task.find({ _id: { $in: list.taskIds } })
          .populate('projectId', 'name');
        
        return {
          ...list.toObject(),
          tasks: tasks.map(task => ({
            _id: task._id,
            name: task.name,
            projectName: task.projectId?.name || 'No Project',
            status: task.status
          }))
        };
      })
    );
    
    res.json(sharedListsWithDetails);
  } catch (error) {
    console.error('Error getting shared lists:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a shared list by its share ID (public route)
router.get('/:shareId', async (req, res) => {
  try {
    const { shareId } = req.params;
    
    const sharedList = await SharedList.findOne({ shareId });
    
    if (!sharedList) {
      return res.status(404).json({ message: 'Shared list not found or has expired' });
    }
    
    // Check if the shared list has expired
    if (new Date() > sharedList.expiresAt) {
      return res.status(410).json({ message: 'This shared list has expired' });
    }
    
    // Get the tasks and their project details
    const tasks = await Task.find({ _id: { $in: sharedList.taskIds } })
      .populate('projectId', 'name');
    
    // Get the user who shared the list
    const user = await User.findById(sharedList.userId, 'name email');
    
    res.json({
      sharedBy: {
        name: user.name,
        email: user.email
      },
      message: sharedList.message,
      createdAt: sharedList.createdAt,
      expiresAt: sharedList.expiresAt,
      tasks: tasks.map(task => ({
        _id: task._id,
        name: task.name,
        description: task.description,
        status: task.status,
        priority: task.priority,
        projectName: task.projectId?.name || 'No Project',
        dueDate: task.dueDate
      }))
    });
  } catch (error) {
    console.error('Error getting shared list:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
