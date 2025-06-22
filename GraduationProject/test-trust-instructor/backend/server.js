const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const authStuRoutes = require('./routes/auth_stu');
const resultsRoutes = require('./routes/results');
const path = require('path');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/TestTrust', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Debug middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Routes
console.log('Registering routes...');
console.log('- /api/auth');
app.use('/api/auth', authRoutes);

console.log('- /api/auth_stu');
app.use('/api/auth_stu', authStuRoutes);

console.log('- /api/results');
app.use('/api/results', resultsRoutes);

console.log('Routes registered');

// Basic route for testing
app.get('/api', (req, res) => {
  res.json({ message: 'TestTrust API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: process.env.NODE_ENV === 'development' ? err.message : {} });
});

// 404 handler
app.use((req, res) => {
  console.error(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  console.log('Available routes:');
  console.log('- GET /api/auth_stu/check-questions/:examId');
  console.log('- GET /api/auth_stu/exams-questions/:examId');
  res.status(404).json({ 
    message: 'Route not found',
    method: req.method,
    path: req.path
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});
