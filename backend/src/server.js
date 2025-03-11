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

// Import utilities
const { initSchedulers } = require('./utils/scheduler');

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

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
