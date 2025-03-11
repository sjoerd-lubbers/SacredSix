const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const SharedProject = require('../models/SharedProject');
const nodemailer = require('nodemailer');

// Create a transporter for sending emails
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Share a project with someone by email
router.post('/share', auth, async (req, res) => {
  try {
    const { projectId, recipientEmail, role, message } = req.body;
    
    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }
    
    if (!recipientEmail) {
      return res.status(400).json({ message: 'Recipient email is required' });
    }
    
    // Validate role
    const validRoles = ['viewer', 'editor', 'admin'];
    const selectedRole = validRoles.includes(role) ? role : 'viewer'; // Default to viewer if invalid
    
    // Check if the project exists and belongs to the user
    const project = await Project.findOne({
      _id: projectId,
      ownerId: req.userId
    });
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found or you do not have permission to share it' });
    }
    
    // Check if the recipient is already a user
    const recipientUser = await User.findOne({ email: recipientEmail });
    
    // Check if the project is already shared with this email
    const existingShare = await SharedProject.findOne({
      projectId,
      recipientEmail
    });
    
    let sharedProject;
    
    if (existingShare) {
      // If the share exists but was rejected or revoked, we can reuse it
      if (existingShare.status === 'rejected' || existingShare.status === 'revoked') {
        existingShare.status = 'pending';
        existingShare.role = selectedRole;
        existingShare.message = message || '';
        existingShare.updatedAt = Date.now();
        // Update recipientId in case the user has registered since the last share
        if (recipientUser && !existingShare.recipientId) {
          existingShare.recipientId = recipientUser._id;
        }
        sharedProject = existingShare;
        await sharedProject.save();
      } else {
        // If the share exists and is not rejected or revoked, return an error
        return res.status(400).json({ message: 'This project is already shared with this email' });
      }
    } else {
      // Create a new shared project
      sharedProject = new SharedProject({
        projectId,
        ownerId: req.userId,
        recipientEmail,
        recipientId: recipientUser ? recipientUser._id : null,
        role: selectedRole,
        message: message || '',
        status: 'pending'
      });
      
      await sharedProject.save();
    }
    
    // Get user info
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the recipient has an account (for email content)
    const hasAccount = sharedProject.recipientId !== null;
    
    // Prepare email content
    const emailContent = `
      <h2>Sacred Six Productivity - Shared Project</h2>
      <p>${user.name} has shared a project with you: <strong>${project.name}</strong></p>
      ${message ? `<p>Message: "${message}"</p>` : ''}
      <p>Project description: ${project.description || 'No description'}</p>
      ${hasAccount 
        ? `<p>Log in to your Sacred Six account to accept or reject this shared project.</p>` 
        : `<p>You don't have a Sacred Six account yet. <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/register">Sign up</a> to access this shared project.</p>`
      }
    `;
    
    // Send the email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      subject: `${user.name} shared a Sacred Six project with you: ${project.name}`,
      html: emailContent,
    });
    
    res.json({ 
      success: true, 
      message: `Project shared successfully with ${recipientEmail}`
    });
  } catch (error) {
    console.error('Error sharing project:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get projects shared with the current user
router.get('/shared-with-me', auth, async (req, res) => {
  try {
    // Get user info
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find shared projects where the recipient is the current user
    const sharedProjects = await SharedProject.find({
      $or: [
        { recipientId: req.userId },
        { recipientEmail: user.email }
      ]
    })
    .populate('projectId', 'name description tags isArchived')
    .populate('ownerId', 'name email');
    
    res.json(sharedProjects);
  } catch (error) {
    console.error('Error getting shared projects:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get projects shared by the current user
router.get('/shared-by-me', auth, async (req, res) => {
  try {
    // Find shared projects where the owner is the current user
    const sharedProjects = await SharedProject.find({
      ownerId: req.userId
    })
    .populate('projectId', 'name description tags isArchived')
    .populate('recipientId', 'name email');
    
    res.json(sharedProjects);
  } catch (error) {
    console.error('Error getting shared projects:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Accept a shared project
router.put('/accept/:sharedProjectId', auth, async (req, res) => {
  try {
    const { sharedProjectId } = req.params;
    
    // Get user info
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Find the shared project
    const sharedProject = await SharedProject.findOne({
      _id: sharedProjectId,
      $or: [
        { recipientId: req.userId },
        { recipientEmail: user.email }
      ],
      status: 'pending'
    });
    
    if (!sharedProject) {
      return res.status(404).json({ message: 'Shared project not found or already processed' });
    }
    
    // Update the shared project status
    sharedProject.status = 'accepted';
    sharedProject.recipientId = req.userId;
    await sharedProject.save();
    
    // Get the original project
    const originalProject = await Project.findById(sharedProject.projectId);
    
    if (!originalProject) {
      return res.status(404).json({ message: 'Original project not found' });
    }
    
    // Instead of creating a copy, add the user as a collaborator to the original project
    // Check if user is already a collaborator
    const isAlreadyCollaborator = originalProject.collaborators.some(
      collab => collab.userId.toString() === req.userId.toString()
    );
    
    if (!isAlreadyCollaborator) {
      // Add user as a collaborator with the role specified in the share invitation
      originalProject.collaborators.push({
        userId: req.userId,
        role: sharedProject.role || 'viewer', // Use the role from the shared project, default to viewer
        addedAt: new Date()
      });
      
      await originalProject.save();
    }
    
    // Populate user details before returning
    await originalProject.populate('ownerId', 'name email');
    await originalProject.populate('collaborators.userId', 'name email');
    
    res.json({ 
      success: true, 
      message: 'Project accepted successfully',
      project: originalProject
    });
  } catch (error) {
    console.error('Error accepting shared project:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reject a shared project
router.put('/reject/:sharedProjectId', auth, async (req, res) => {
  try {
    const { sharedProjectId } = req.params;
    
    // Get user info
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Find the shared project
    const sharedProject = await SharedProject.findOne({
      _id: sharedProjectId,
      $or: [
        { recipientId: req.userId },
        { recipientEmail: user.email }
      ],
      status: 'pending'
    });
    
    if (!sharedProject) {
      return res.status(404).json({ message: 'Shared project not found or already processed' });
    }
    
    // Update the shared project status
    sharedProject.status = 'rejected';
    sharedProject.recipientId = req.userId;
    await sharedProject.save();
    
    res.json({ 
      success: true, 
      message: 'Project rejected successfully'
    });
  } catch (error) {
    console.error('Error rejecting shared project:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove a collaborator from a project
router.delete('/collaborator/:projectId/:userId', auth, async (req, res) => {
  try {
    const { projectId, userId } = req.params;
    
    // Check if the project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if the user is the owner or an admin collaborator
    const isOwner = project.ownerId.toString() === req.userId.toString();
    const isAdmin = project.collaborators.some(
      collab => collab.userId.toString() === req.userId.toString() && collab.role === 'admin'
    );
    
    // Only the project owner or admin collaborators can remove collaborators
    if (!isOwner && !isAdmin) {
      return res.status(401).json({ message: 'Not authorized to remove collaborators from this project' });
    }
    
    // Check if the user is trying to remove the owner
    if (project.ownerId.toString() === userId) {
      return res.status(400).json({ message: 'Cannot remove the project owner' });
    }
    
    // Get the user being removed to find their email
    const userToRemove = await User.findById(userId);
    if (!userToRemove) {
      return res.status(404).json({ message: 'User to remove not found' });
    }
    
    // Remove the collaborator from the project
    project.collaborators = project.collaborators.filter(
      collab => collab.userId.toString() !== userId
    );
    
    await project.save();
    
    // Also update the SharedProject collection to mark any shares as 'revoked'
    // This distinguishes between user-rejected invitations and admin-revoked access
    await SharedProject.updateMany(
      {
        projectId: projectId,
        recipientEmail: userToRemove.email,
        status: { $in: ['pending', 'accepted'] }
      },
      {
        $set: { status: 'revoked' }
      }
    );
    
    res.json({ 
      success: true, 
      message: 'Collaborator removed successfully'
    });
  } catch (error) {
    console.error('Error removing collaborator:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
