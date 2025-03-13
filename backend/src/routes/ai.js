const express = require('express');
const OpenAI = require('openai');
const auth = require('../middleware/auth');
const Task = require('../models/Task');
const Project = require('../models/Project');
const Reflection = require('../models/Reflection');

const router = express.Router();

// Initialize OpenAI with custom configuration
const openaiConfig = {
  apiKey: process.env.OPENAI_API_KEY,
};

// Add custom base URL if provided
if (process.env.OPENAI_API_URL) {
  openaiConfig.baseURL = process.env.OPENAI_API_URL;
}

// Add organization if provided
if (process.env.OPENAI_ORGANIZATION) {
  openaiConfig.organization = process.env.OPENAI_ORGANIZATION;
}

const openai = new OpenAI(openaiConfig);

// Get the model from environment or use default
const AI_MODEL = process.env.OPENAI_MODEL || 'gpt-4';

// @route   POST /api/ai/recommend-tasks
// @desc    Get AI-recommended tasks for today
// @access  Private
router.post('/recommend-tasks', auth, async (req, res) => {
  try {
    // Get all projects the user has access to (owned or shared)
    const projects = await Project.find({
      $or: [
        { ownerId: req.userId },
        { 'collaborators.userId': req.userId }
      ]
    });
    
    const projectIds = projects.map(project => project._id);
    
    // Get all incomplete tasks from user's own tasks and shared projects
    // Filter for Sacred Six projects only (and exclude archived projects)
    const sacredSixProjects = projects.filter(project => 
      !project.isArchived && // Exclude archived projects
      project.tags && project.tags.some(tag => 
        tag.toLowerCase().includes('sacred') && tag.toLowerCase().includes('six')
      )
    );
    
    // If no Sacred Six projects found, use all active (non-archived) projects
    const activeProjects = projects.filter(project => !project.isArchived);
    const projectsToUse = sacredSixProjects.length > 0 ? sacredSixProjects : activeProjects;
    const projectIdsToUse = projectsToUse.map(project => project._id);
    
    console.log('AI using projects:', projectsToUse.map(p => p.name));
    
    // Get incomplete tasks from Sacred Six projects only
    const incompleteTasks = await Task.find({
      status: { $ne: 'done' },
      projectId: { $in: projectIdsToUse } // Only tasks from Sacred Six projects
    }).populate('projectId', 'name');
    
    console.log('Incomplete tasks for AI:', incompleteTasks.map(t => ({ 
      name: t.name, 
      project: t.projectId ? t.projectId.name : 'No project' 
    })));

    if (incompleteTasks.length === 0) {
      return res.status(404).json({ message: 'No incomplete tasks found' });
    }

    // Format tasks for OpenAI
    const tasksFormatted = incompleteTasks.map(task => ({
      id: task._id.toString(),
      name: task.name,
      description: task.description || 'No description',
      project: task.projectId ? task.projectId.name : 'No project',
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : 'No due date',
      estimatedTime: task.estimatedTime || 0,
      isRecurring: task.isRecurring || false,
      recurringDays: task.recurringDays || []
    }));

    // Get current date and day of week
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDayOfWeek = daysOfWeek[today.getDay()];
    
    // Add information about which recurring tasks are scheduled for today
    const tasksFormattedWithToday = tasksFormatted.map(task => ({
      ...task,
      isScheduledForToday: task.isRecurring && 
        (task.recurringDays.length === 0 || task.recurringDays.includes(currentDayOfWeek))
    }));

    // Create prompt for OpenAI
    const prompt = `
      You are an AI productivity assistant for the Sacred Six methodology, which focuses on selecting the 6 most important tasks to complete each day.
      
      Today is ${todayStr} and the current day of the week is ${currentDayOfWeek}.
      
      Here are the user's incomplete tasks:
      ${JSON.stringify(tasksFormatted, null, 2)}
      
      Based on priority, due dates, recurring status, and estimated time, select exactly 6 tasks that the user should focus on today.
      Consider the following criteria:
      1. High priority tasks should generally be selected first
      2. Tasks with closer due dates should be prioritized
      3. Recurring tasks that are scheduled for today should be prioritized
      4. Try to select a balanced mix of quick wins and important tasks
      5. If possible, group related tasks from the same project
      
      Return ONLY a JSON array of the 6 selected task IDs, with no additional text or explanation.
      Format: ["id1", "id2", "id3", "id4", "id5", "id6"]
    `;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: "You are a productivity AI assistant that helps users prioritize tasks." },
        { role: "user", content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 500
    });

    // Parse the response
    let recommendedTaskIds;
    try {
      const responseText = completion.choices[0].message.content.trim();
      recommendedTaskIds = JSON.parse(responseText);
      
      // Validate that we got exactly 6 task IDs or fewer if there aren't enough tasks
      const maxTasks = Math.min(6, incompleteTasks.length);
      if (!Array.isArray(recommendedTaskIds) || recommendedTaskIds.length > maxTasks) {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      return res.status(500).json({ message: 'Failed to process AI recommendations' });
    }

    // Get the recommended tasks (including from shared projects)
    const recommendedTasks = await Task.find({
      _id: { $in: recommendedTaskIds }
    }).populate('projectId', 'name');
    
    console.log('Recommended tasks:', recommendedTasks.map(t => t.name));

    // Transform the tasks to include project name directly
    const transformedTasks = recommendedTasks.map(task => {
      const taskObj = task.toObject();
      return {
        ...taskObj,
        projectName: taskObj.projectId ? taskObj.projectId.name : "No Project"
      };
    });

    res.json({
      recommendedTasks: transformedTasks,
      aiReasoning: completion.choices[0].message.content
    });
  } catch (error) {
    console.error('AI recommendation error:', error);
    res.status(500).json({ message: 'Server error during AI processing' });
  }
});

// @route   POST /api/ai/analyze-reflection
// @desc    Analyze user reflection and provide insights
// @access  Private
router.post('/analyze-reflection', auth, async (req, res) => {
  try {
    const { content, type, reflectionId, questionAnswers } = req.body;

    // We need either content, reflectionId, or questionAnswers
    if (!content && !reflectionId && !questionAnswers) {
      return res.status(400).json({ message: 'Either reflection content, reflectionId, or questionAnswers is required' });
    }

    let reflectionContent = content;
    let reflectionType = type || 'daily';
    let reflection;

    // If reflectionId is provided, find the reflection
    if (reflectionId) {
      reflection = await Reflection.findOne({
        _id: reflectionId,
        userId: req.userId
      });

      if (!reflection) {
        return res.status(404).json({ message: 'Reflection not found' });
      }

      reflectionType = reflection.type;
      
      // Generate content if not available
      if (!reflection.content && reflection.questionAnswers && reflection.questionAnswers.length > 0) {
        reflectionContent = createContentFromQuestionAnswers(reflection.questionAnswers);
      } else {
        reflectionContent = reflection.content || '';
      }
    } 
    // If questionAnswers are provided but no content, generate content
    else if (questionAnswers && !content) {
      // Helper function from reflections.js
      reflectionContent = createContentFromQuestionAnswers(questionAnswers);
    }

    // Get previous reflections for context
    const previousReflections = await Reflection.find({
      userId: req.userId,
      type: reflectionType
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('content aiAnalysis');

    // Create prompt for OpenAI
    const prompt = `
      You are an AI productivity coach specializing in analyzing reflections and providing insights.
      
      The user has submitted a ${reflectionType} reflection:
      "${reflectionContent}"
      
      ${previousReflections.length > 0 ? `
      Here are their previous reflections for context:
      ${previousReflections.map(r => `- "${r.content}"`).join('\n')}
      ` : ''}
      
      Please analyze this reflection and provide:
      1. A thoughtful analysis of their productivity patterns, challenges, and strengths
      2. Three specific, actionable suggestions to improve their productivity
      3. One encouraging observation about their progress or approach
      
      Format your response as a JSON object with the following structure:
      {
        "analysis": "Your detailed analysis here...",
        "suggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"],
        "encouragement": "Your encouraging observation here..."
      }
    `;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: "You are a productivity coach AI that analyzes reflections and provides insights." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    // Parse the response
    let aiResponse;
    try {
      const responseText = completion.choices[0].message.content.trim();
      console.log('Raw AI response:', responseText);
      
      // Try to clean up the response before parsing
      const cleanedResponse = responseText
        // Replace any control characters that might cause JSON parsing issues
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
        // Try to extract just the JSON part if there's any text around it
        .replace(/^[^{]*({.*})[^}]*$/s, '$1');
      
      console.log('Cleaned AI response:', cleanedResponse);
      
      try {
        aiResponse = JSON.parse(cleanedResponse);
      } catch (innerError) {
        console.error('Error parsing cleaned response, trying fallback:', innerError);
        // Fallback to a simple regex extraction of the JSON
        const jsonMatch = responseText.match(/{[\s\S]*}/);
        if (jsonMatch) {
          aiResponse = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Could not extract valid JSON from response');
        }
      }
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      console.error('Raw response:', completion.choices[0].message.content);
      
      // Create a fallback response
      aiResponse = {
        analysis: "I couldn't analyze this reflection properly. Please try again or modify your reflection.",
        suggestions: [
          "Try to be more specific in your reflection",
          "Consider focusing on concrete examples",
          "Break down complex thoughts into simpler statements"
        ],
        encouragement: "Keep reflecting regularly - it's a valuable practice for growth!"
      };
    }

    // If we have a reflection from reflectionId, update it
    if (reflection) {
      reflection.aiAnalysis = aiResponse.analysis;
      reflection.aiSuggestions = aiResponse.suggestions;
      await reflection.save();
    } 
    // Otherwise, find or create a reflection based on content
    else if (reflectionContent) {
      // Find the existing reflection by content
      const existingReflection = await Reflection.findOne({
        userId: req.userId,
        content: reflectionContent
      });
      
      if (existingReflection) {
        // Update the existing reflection
        existingReflection.aiAnalysis = aiResponse.analysis;
        existingReflection.aiSuggestions = aiResponse.suggestions;
        reflection = await existingReflection.save();
        
        console.log('Updated existing reflection with AI analysis');
      } else {
        // Create a new reflection if not found
        let reflectionData = {
          userId: req.userId,
          content: reflectionContent,
          type: reflectionType,
          aiAnalysis: aiResponse.analysis,
          aiSuggestions: aiResponse.suggestions
        };
        
        // If questionAnswers were provided, include them
        if (questionAnswers) {
          reflectionData.questionAnswers = questionAnswers;
          reflectionData.isStructured = true;
        } else {
          // Extract questionAnswers from content
          reflectionData.questionAnswers = extractQuestionAnswersFromContent(reflectionType, reflectionContent);
          reflectionData.isStructured = reflectionContent.startsWith('### ');
        }
        
        reflection = new Reflection(reflectionData);
        await reflection.save();
        console.log('Created new reflection with AI analysis');
      }
    }

    res.json({
      reflection,
      analysis: aiResponse
    });
  } catch (error) {
    console.error('AI reflection analysis error:', error);
    res.status(500).json({ message: 'Server error during AI processing' });
  }
});

// Define the questions for each reflection type (duplicated from reflections.js)
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

// Helper function to get questions based on type (duplicated from reflections.js)
const getQuestionsForType = (type) => {
  return type === 'daily' ? DAILY_QUESTIONS : WEEKLY_QUESTIONS;
};

// Helper function to create content from question-answer pairs (duplicated from reflections.js)
const createContentFromQuestionAnswers = (questionAnswers) => {
  return questionAnswers.map(qa => `### ${qa.question}\n${qa.answer || ""}`).join('\n\n');
};

// Helper function to extract question-answer pairs from content (duplicated from reflections.js)
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

// @route   POST /api/ai/suggest-tasks
// @desc    Get AI-suggested tasks based on a title and description
// @access  Private
router.post('/suggest-tasks', auth, async (req, res) => {
  try {
    const { title, description, currentTasks, projectId } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    // Get project information if provided
    let projectInfo = '';
    let projectName = '';
    if (projectId) {
      const project = await Project.findOne({ _id: projectId });
      if (project) {
        projectInfo = `This is for a project called "${project.name}".`;
        projectName = project.name;
      }
    }

    // Format current tasks if provided
    let currentTasksInfo = '';
    if (currentTasks && Array.isArray(currentTasks) && currentTasks.length > 0) {
      currentTasksInfo = `
        The user already has the following tasks:
        ${currentTasks.map((task, index) => `${index + 1}. ${task}`).join('\n')}
      `;
    }

    // Create prompt for OpenAI
    const prompt = `
      You are an AI task suggestion assistant that helps users brainstorm tasks for their projects.
      
      The user wants suggestions for tasks related to:
      Title: ${title}
      ${description ? `Description: ${description}` : ''}
      ${projectInfo}
      ${currentTasksInfo}
      
      Please suggest 5-10 specific, actionable tasks that would help the user accomplish their goal.
      For each task, provide:
      1. A clear, concise task name
      2. A brief description of what the task involves
      3. An estimated time to complete (in hours)
      4. A suggested priority (high, medium, or low)
      
      IMPORTANT: Your response must be a valid JSON array that can be parsed with JSON.parse().
      Do not include any text before or after the JSON array.
      Do not use markdown code blocks.
      Your entire response should be just the JSON array.
      
      Format your response as a JSON array with the following structure:
      [
        {
          "name": "Task name",
          "description": "Task description",
          "estimatedTime": 2,
          "priority": "high"
        },
        ...
      ]
    `;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { 
          role: "system", 
          content: "You are a helpful AI assistant that suggests tasks for projects. Always respond with valid JSON in the exact format requested. Do not include any explanatory text, markdown formatting, or code blocks around the JSON. Your entire response must be parseable as JSON." 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    // Parse the response
    let suggestedTasks;
    const responseText = completion.choices[0].message.content.trim();
    
    try {
      // First, try direct JSON parsing
      try {
        suggestedTasks = JSON.parse(responseText);
      } catch (parseError) {
        // If direct parsing fails, try to extract JSON from the text
        console.log('Direct JSON parsing failed, attempting to extract JSON from text');
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          suggestedTasks = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Could not extract JSON from response');
        }
      }
      
      // Validate the parsed result
      if (!Array.isArray(suggestedTasks)) {
        throw new Error('Response is not an array');
      }
      
      // Ensure each item has the required properties
      suggestedTasks = suggestedTasks.map(task => ({
        name: task.name || 'Unnamed Task',
        description: task.description || 'No description provided',
        estimatedTime: typeof task.estimatedTime === 'number' ? task.estimatedTime : 1,
        priority: ['high', 'medium', 'low'].includes(task.priority) ? task.priority : 'medium'
      }));
      
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      console.error('Raw response:', responseText);
      
      // Create fallback tasks if parsing fails
      suggestedTasks = [
        {
          name: "Review project requirements",
          description: "Go through all project requirements to ensure nothing is missed",
          estimatedTime: 1,
          priority: "high"
        },
        {
          name: "Create task breakdown",
          description: "Break down the project into smaller, manageable tasks",
          estimatedTime: 1.5,
          priority: "high"
        },
        {
          name: "Set up project timeline",
          description: "Create a timeline with milestones and deadlines",
          estimatedTime: 1,
          priority: "medium"
        },
        {
          name: "Identify potential risks",
          description: "Identify and document potential risks and mitigation strategies",
          estimatedTime: 0.5,
          priority: "medium"
        },
        {
          name: "Allocate resources",
          description: "Determine what resources are needed for each task",
          estimatedTime: 0.5,
          priority: "low"
        }
      ];
    }

    // Add project information to each suggested task
    const suggestedTasksWithProject = suggestedTasks.map(task => ({
      ...task,
      projectId: projectId || null,
      projectName: projectName || "No Project"
    }));

    res.json({
      suggestedTasks: suggestedTasksWithProject,
      rawResponse: responseText
    });
  } catch (error) {
    console.error('AI task suggestion error:', error);
    res.status(500).json({ message: 'Server error during AI processing' });
  }
});

module.exports = router;
