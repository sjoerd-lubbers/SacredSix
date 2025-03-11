const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Reflection = require('../models/Reflection');

// @route   GET /api/reflections
// @desc    Get all reflections for a user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const reflections = await Reflection.find({ userId: req.userId })
      .sort({ createdAt: -1 });
    
    res.json(reflections);
  } catch (error) {
    console.error('Error fetching reflections:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reflections/:id
// @desc    Get a specific reflection
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const reflection = await Reflection.findOne({ 
      _id: req.params.id,
      userId: req.userId 
    });
    
    if (!reflection) {
      return res.status(404).json({ message: 'Reflection not found' });
    }
    
    res.json(reflection);
  } catch (error) {
    console.error('Error fetching reflection:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/reflections
// @desc    Create a new reflection
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { content, type } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }
    
    const newReflection = new Reflection({
      userId: req.userId,
      content,
      type: type || 'daily'
    });
    
    const savedReflection = await newReflection.save();
    res.status(201).json(savedReflection);
  } catch (error) {
    console.error('Error creating reflection:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/reflections/:id
// @desc    Update a reflection
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { content, type } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }
    
    const reflection = await Reflection.findOne({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!reflection) {
      return res.status(404).json({ message: 'Reflection not found' });
    }
    
    reflection.content = content;
    if (type) reflection.type = type;
    
    const updatedReflection = await reflection.save();
    res.json(updatedReflection);
  } catch (error) {
    console.error('Error updating reflection:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/reflections/:id
// @desc    Delete a reflection
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const reflection = await Reflection.findOne({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!reflection) {
      return res.status(404).json({ message: 'Reflection not found' });
    }
    
    await reflection.deleteOne();
    res.json({ message: 'Reflection deleted' });
  } catch (error) {
    console.error('Error deleting reflection:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reflections/type/:type
// @desc    Get reflections by type (daily or weekly)
// @access  Private
router.get('/type/:type', auth, async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!['daily', 'weekly'].includes(type)) {
      return res.status(400).json({ message: 'Invalid reflection type' });
    }
    
    const reflections = await Reflection.find({
      userId: req.userId,
      type
    }).sort({ createdAt: -1 });
    
    res.json(reflections);
  } catch (error) {
    console.error('Error fetching reflections by type:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
