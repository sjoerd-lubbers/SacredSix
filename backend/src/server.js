const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const aiRoutes = require('./routes/ai');
const reflectionRoutes = require('./routes/reflections');
const sharingRoutes = require('./routes/sharing');
const projectSharingRoutes = require('./routes/projectSharing');
const apiKeyRoutes = require('./routes/apiKeys');
const dailyCompletionRoutes = require('./routes/dailyCompletion');
const dataExportRoutes = require('./routes/dataExport');
const adminRoutes = require('./routes/admin');
const feedbackRoutes = require('./routes/feedback');

// Import utilities
const { initSchedulers } = require('./utils/scheduler');

// Initialize express app
const app = express();

// Middleware
const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    // Check if the origin is allowed
    const allowedOrigins = [
      'https://sacred6.ams8.nl',
      'http://localhost:3000'
    ];
    
    // If CORS_ORIGIN is set in environment variables, add it to allowed origins
    if (process.env.CORS_ORIGIN) {
      const corsOrigins = process.env.CORS_ORIGIN.split(',');
      allowedOrigins.push(...corsOrigins);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Add a middleware to log all requests for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - Origin: ${req.headers.origin}`);
  next();
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reflections', reflectionRoutes);
app.use('/api/sharing', sharingRoutes);
app.use('/api/project-sharing', projectSharingRoutes);
app.use('/api/api-keys', apiKeyRoutes);
app.use('/api/daily-completion', dailyCompletionRoutes);
app.use('/api/data-export', dataExportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/feedback', feedbackRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Sacred Six Productivity API is running');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Initialize schedulers after server starts
  initSchedulers();
});
