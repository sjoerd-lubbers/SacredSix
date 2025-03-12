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

// Define the questions for each reflection type
const DAILY_QUESTIONS = [
  "Wat ging vandaag goed?",
  "Wat had ik beter kunnen doen?",
  "Welke taak gaf me de meeste energie?"
];

const WEEKLY_QUESTIONS = [
  "Welke successen heb ik deze week geboekt?",
  "Wat heb ik geleerd?",
  "Welke drie prioriteiten stel ik voor de volgende week?"
];

// Helper function to get questions based on type
const getQuestionsForType = (type) => {
  return type === 'daily' ? DAILY_QUESTIONS : WEEKLY_QUESTIONS;
};

// Helper function to create content from question-answer pairs
const createContentFromQuestionAnswers = (questionAnswers) => {
  return questionAnswers.map(qa => `### ${qa.question}\n${qa.answer || ""}`).join('\n\n');
};

// Helper function to extract question-answer pairs from content
const extractQuestionAnswersFromContent = (type, content) => {
  const questions = getQuestionsForType(type);
  const questionAnswers = [];
  
  if (!content.startsWith('### ')) {
    // For legacy reflections, just put all content in the first question
    questionAnswers.push({
      question: questions[0],
      answer: content
    });
    
    // Add empty answers for the rest of the questions
    for (let i = 1; i < questions.length; i++) {
      questionAnswers.push({
        question: questions[i],
        answer: ''
      });
    }
    
    return questionAnswers;
  }
  
  // Extract answers for each question
  for (const question of questions) {
    const regex = new RegExp(`### ${question.replace(/\?/g, '\\?')}\\n([\\s\\S]*?)(?=\\n###|$)`);
    const match = content.match(regex);
    
    questionAnswers.push({
      question,
      answer: match ? match[1].trim() : ''
    });
  }
  
  return questionAnswers;
};

// @route   POST /api/reflections
// @desc    Create a new reflection
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { content, type, questionAnswers } = req.body;
    
    // Now we primarily need questionAnswers
    if (!questionAnswers && !content) {
      return res.status(400).json({ message: 'QuestionAnswers is required' });
    }
    
    const reflectionType = type || 'daily';
    let reflectionQuestionAnswers = questionAnswers || [];
    let isStructured = true;
    
    // If we have content but no questionAnswers, extract questionAnswers from content (for backward compatibility)
    if (content && !questionAnswers) {
      reflectionQuestionAnswers = extractQuestionAnswersFromContent(reflectionType, content);
      isStructured = content.startsWith('### ');
    }
    
    // If questionAnswers is empty, generate default questions for the type
    if (reflectionQuestionAnswers.length === 0) {
      const questions = getQuestionsForType(reflectionType);
      reflectionQuestionAnswers = questions.map(question => ({
        question,
        answer: ''
      }));
    }
    
    // Create the new reflection without content - it will be generated when needed
    const newReflection = new Reflection({
      userId: req.userId,
      questionAnswers: reflectionQuestionAnswers,
      isStructured,
      type: reflectionType
    });
    
    // Only set content if explicitly provided (for backward compatibility)
    if (content) {
      newReflection.content = content;
    }
    
    const savedReflection = await newReflection.save();
    
    // Generate content for the response if not already set
    if (!savedReflection.content) {
      savedReflection.content = createContentFromQuestionAnswers(savedReflection.questionAnswers);
    }
    
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
    const { content, type, questionAnswers } = req.body;
    
    // Now we primarily need questionAnswers
    if (!questionAnswers && !content) {
      return res.status(400).json({ message: 'QuestionAnswers is required' });
    }
    
    const reflection = await Reflection.findOne({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!reflection) {
      return res.status(404).json({ message: 'Reflection not found' });
    }
    
    // Update type if provided
    if (type) reflection.type = type;
    
    // Update questionAnswers if provided
    if (questionAnswers) {
      reflection.questionAnswers = questionAnswers;
      reflection.isStructured = true;
      
      // Clear content so it will be regenerated when needed
      reflection.content = undefined;
    } 
    // If only content is provided (backward compatibility)
    else if (content) {
      reflection.content = content;
      reflection.questionAnswers = extractQuestionAnswersFromContent(reflection.type, content);
      reflection.isStructured = content.startsWith('### ');
    }
    
    const updatedReflection = await reflection.save();
    
    // Generate content for the response if not already set
    if (!updatedReflection.content) {
      updatedReflection.content = createContentFromQuestionAnswers(updatedReflection.questionAnswers);
    }
    
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
