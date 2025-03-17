const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');

const router = express.Router();

// @route   POST /api/projects
// @desc    Create a new project
// @access  Private
router.post(
  '/',
  [
    auth,
    body('name', 'Project name is required').not().isEmpty()
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, description, tags, isSacred } = req.body;

      // If trying to create a sacred project, check if user already has 6 sacred projects
      if (isSacred) {
        const sacredProjectsCount = await Project.countDocuments({
          ownerId: req.userId,
          isSacred: true,
          isArchived: false
        });

        if (sacredProjectsCount >= 6) {
          return res.status(400).json({ 
            message: 'Maximum of 6 sacred projects allowed. Please unmark an existing project as sacred first.' 
          });
        }
      }

      // Get the highest sortOrder to place new project at the end
      const highestSortProject = await Project.findOne({ 
        $or: [
          { ownerId: req.userId },
          { 'collaborators.userId': req.userId }
        ]
      })
        .sort({ sortOrder: -1 })
        .limit(1);
      
      const nextSortOrder = highestSortProject ? highestSortProject.sortOrder + 1 : 0;

      // Create new project
      const project = new Project({
        ownerId: req.userId,
        collaborators: [], // Initially no collaborators
        name,
        description,
        tags: tags || [],
        isSacred: isSacred || false,
        sortOrder: nextSortOrder
      });

      // Save project to database
      await project.save();

      res.status(201).json(project);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   GET /api/projects
// @desc    Get all projects for current user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // By default, only return non-archived projects
    const showArchived = req.query.showArchived === 'true';
    
    const query = { 
      $or: [
        { ownerId: req.userId },
        { 'collaborators.userId': req.userId }
      ],
      ...(showArchived ? {} : { isArchived: false })
    };
    
    const projects = await Project.find(query)
      .populate('ownerId', 'name email')
      .populate('collaborators.userId', 'name email')
      .sort({ sortOrder: 1 });
    
    res.json(projects);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/projects/archived
// @desc    Get all archived projects for current user
// @access  Private
router.get('/archived', auth, async (req, res) => {
  try {
    const projects = await Project.find({ 
      $or: [
        { ownerId: req.userId },
        { 'collaborators.userId': req.userId }
      ],
      isArchived: true 
    })
      .populate('ownerId', 'name email')
      .populate('collaborators.userId', 'name email')
      .sort({ sortOrder: 1 });
    
    res.json(projects);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/projects/owned
// @desc    Get all projects owned by current user
// @access  Private
router.get('/owned', auth, async (req, res) => {
  try {
    const showArchived = req.query.showArchived === 'true';
    
    const query = { 
      ownerId: req.userId,
      ...(showArchived ? {} : { isArchived: false })
    };
    
    const projects = await Project.find(query)
      .populate('ownerId', 'name email')
      .populate('collaborators.userId', 'name email')
      .sort({ sortOrder: 1 });
    
    res.json(projects);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/projects/shared
// @desc    Get all projects shared with current user
// @access  Private
router.get('/shared', auth, async (req, res) => {
  try {
    const showArchived = req.query.showArchived === 'true';
    
    const query = { 
      'collaborators.userId': req.userId,
      ...(showArchived ? {} : { isArchived: false })
    };
    
    const projects = await Project.find(query)
      .populate('ownerId', 'name email')
      .populate('collaborators.userId', 'name email')
      .sort({ sortOrder: 1 });
    
    res.json(projects);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/projects/reorder
// @desc    Update the order of projects
// @access  Private
router.put('/reorder', auth, async (req, res) => {
  try {
    const { projectIds } = req.body;

    if (!Array.isArray(projectIds)) {
      return res.status(400).json({ message: 'Project IDs must be an array' });
    }

    // Verify all projects exist and user has access to them
    const projects = await Project.find({
      _id: { $in: projectIds },
      $or: [
        { ownerId: req.userId },
        { 'collaborators.userId': req.userId }
      ]
    });

    if (projects.length !== projectIds.length) {
      return res.status(400).json({ 
        message: 'One or more projects not found or not authorized' 
      });
    }

    // Update sort order for each project
    const updateOperations = projectIds.map((id, index) => ({
      updateOne: {
        filter: { 
          _id: id,
          $or: [
            { ownerId: req.userId },
            { 'collaborators.userId': req.userId }
          ]
        },
        update: { $set: { sortOrder: index } }
      }
    }));

    await Project.bulkWrite(updateOperations);

    // Get the updated projects
    const updatedProjects = await Project.find({
      _id: { $in: projectIds }
    })
      .populate('ownerId', 'name email')
      .populate('collaborators.userId', 'name email')
      .sort({ sortOrder: 1 });

    res.json(updatedProjects);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/projects/:id
// @desc    Get project by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('ownerId', 'name email')
      .populate('collaborators.userId', 'name email');

    // Check if project exists
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user has access to the project
    const isOwner = project.ownerId._id.toString() === req.userId.toString();
    const isCollaborator = project.collaborators.some(
      collab => collab.userId._id.toString() === req.userId.toString()
    );

    if (!isOwner && !isCollaborator) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    res.json(project);
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/projects/:id
// @desc    Update a project
// @access  Private
router.put(
  '/:id',
  [
    auth,
    body('name', 'Project name is required').not().isEmpty()
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, description, tags, isArchived, isSacred, collaborators } = req.body;

      // Find project by ID
      let project = await Project.findById(req.params.id);

      // Check if project exists
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      // Check if user is the owner of the project
      if (project.ownerId.toString() !== req.userId.toString()) {
        // Check if user is a collaborator with admin role
        const userCollaborator = project.collaborators.find(
          collab => collab.userId.toString() === req.userId.toString() && collab.role === 'admin'
        );
        
        if (!userCollaborator) {
          return res.status(401).json({ message: 'Not authorized to update this project' });
        }
      }

      // If trying to mark a project as sacred, check if user already has 6 sacred projects
      if (isSacred && !project.isSacred) {
        const sacredProjectsCount = await Project.countDocuments({
          ownerId: req.userId,
          isSacred: true,
          isArchived: false
        });

        if (sacredProjectsCount >= 6) {
          return res.status(400).json({ 
            message: 'Maximum of 6 sacred projects allowed. Please unmark an existing project as sacred first.' 
          });
        }
      }

      // Update project
      project.name = name;
      if (description !== undefined) project.description = description;
      if (tags !== undefined) project.tags = tags;
      if (isArchived !== undefined) project.isArchived = isArchived;
      if (isSacred !== undefined) project.isSacred = isSacred;
      
      // Only the owner can update collaborators
      if (collaborators !== undefined && project.ownerId.toString() === req.userId.toString()) {
        project.collaborators = collaborators;
      }

      // Save updated project
      await project.save();
      
      // Populate user details before returning
      await project.populate('ownerId', 'name email');
      await project.populate('collaborators.userId', 'name email');

      res.json(project);
    } catch (error) {
      console.error(error.message);
      if (error.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Project not found' });
      }
      res.status(500).send('Server error');
    }
  }
);

// @route   PUT /api/projects/:id/recurring-settings
// @desc    Update recurring task settings for a project
// @access  Private
router.put('/:id/recurring-settings', auth, async (req, res) => {
  try {
    const { defaultTasksRecurring, defaultRecurringDays } = req.body;

    // Find project by ID
    let project = await Project.findById(req.params.id);

    // Check if project exists
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is the owner of the project or has admin rights
    const isOwner = project.ownerId.toString() === req.userId.toString();
    const isAdminCollaborator = project.collaborators.some(
      collab => collab.userId.toString() === req.userId.toString() && collab.role === 'admin'
    );

    if (!isOwner && !isAdminCollaborator) {
      return res.status(401).json({ message: 'Not authorized to update recurring settings' });
    }

    // Update recurring settings
    if (defaultTasksRecurring !== undefined) {
      project.defaultTasksRecurring = defaultTasksRecurring;
    }
    
    if (defaultRecurringDays !== undefined) {
      // Validate recurring days
      const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const filteredDays = defaultRecurringDays.filter(day => validDays.includes(day));
      project.defaultRecurringDays = filteredDays;
    }

    // Save updated project
    await project.save();
    
    // Populate user details before returning
    await project.populate('ownerId', 'name email');
    await project.populate('collaborators.userId', 'name email');

    res.json(project);
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/projects/:id/archive
// @desc    Archive or unarchive a project
// @access  Private
router.put('/:id/archive', auth, async (req, res) => {
  try {
    const { isArchived } = req.body;

    // Find project by ID
    let project = await Project.findById(req.params.id);

    // Check if project exists
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is the owner of the project
    if (project.ownerId.toString() !== req.userId.toString()) {
      // Check if user is a collaborator with admin role
      const userCollaborator = project.collaborators.find(
        collab => collab.userId.toString() === req.userId.toString() && collab.role === 'admin'
      );
      
      if (!userCollaborator) {
        return res.status(401).json({ message: 'Not authorized to archive/unarchive this project' });
      }
    }

    // Update archive status
    project.isArchived = isArchived === undefined ? true : isArchived;

    // Save updated project
    await project.save();
    
    // Populate user details before returning
    await project.populate('ownerId', 'name email');
    await project.populate('collaborators.userId', 'name email');

    res.json(project);
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/projects/:id
// @desc    Delete a project
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    // Find project by ID
    const project = await Project.findById(req.params.id);

    // Check if project exists
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is the owner of the project
    if (project.ownerId.toString() !== req.userId.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this project' });
    }

    // Delete project
    await project.deleteOne();

    // Delete all tasks associated with this project
    await Task.deleteMany({ projectId: req.params.id });

    res.json({ message: 'Project removed' });
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/projects/:id/collaborators
// @desc    Add or update a collaborator to a project
// @access  Private (owner only)
router.put('/:id/collaborators', auth, async (req, res) => {
  try {
    const { email, role } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    if (!['viewer', 'editor', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Role must be viewer, editor, or admin' });
    }
    
    // Find project by ID
    const project = await Project.findById(req.params.id);
    
    // Check if project exists
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if user is the owner of the project
    if (project.ownerId.toString() !== req.userId.toString()) {
      return res.status(401).json({ message: 'Only the project owner can add collaborators' });
    }
    
    // Find the user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found with that email' });
    }
    
    // Check if user is already a collaborator
    const existingCollaboratorIndex = project.collaborators.findIndex(
      collab => collab.userId.toString() === user._id.toString()
    );
    
    if (existingCollaboratorIndex !== -1) {
      // Update existing collaborator's role
      project.collaborators[existingCollaboratorIndex].role = role;
    } else {
      // Add new collaborator
      project.collaborators.push({
        userId: user._id,
        role,
        addedAt: new Date()
      });
    }
    
    // Save updated project
    await project.save();
    
    // Populate user details before returning
    await project.populate('ownerId', 'name email');
    await project.populate('collaborators.userId', 'name email');
    
    res.json(project);
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/projects/:id/collaborators/:userId
// @desc    Remove a collaborator from a project
// @access  Private (owner only)
router.delete('/:id/collaborators/:userId', auth, async (req, res) => {
  try {
    // Find project by ID
    const project = await Project.findById(req.params.id);
    
    // Check if project exists
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if user is the owner of the project
    if (project.ownerId.toString() !== req.userId.toString()) {
      return res.status(401).json({ message: 'Only the project owner can remove collaborators' });
    }
    
    // Check if collaborator exists
    const collaboratorIndex = project.collaborators.findIndex(
      collab => collab.userId.toString() === req.params.userId
    );
    
    if (collaboratorIndex === -1) {
      return res.status(404).json({ message: 'Collaborator not found' });
    }
    
    // Remove collaborator
    project.collaborators.splice(collaboratorIndex, 1);
    
    // Save updated project
    await project.save();
    
    // Populate user details before returning
    await project.populate('ownerId', 'name email');
    await project.populate('collaborators.userId', 'name email');
    
    res.json(project);
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router;
