const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const authRoutes = require('./routes/auth');
const authStuRoutes = require('./routes/auth_stu');
const resultsRoutes = require('./routes/results');
const instructorsRoutes = require('./routes/instructors');
const path = require('path');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD', 'CONNECT', 'TRACE', ]
    }
});

// Make io globally available for API routes
global.io = io;

// Store connected students
const connectedStudents = {};
global.connectedStudents = connectedStudents;

// Socket.IO event handlers
io.on('connection', (socket) => {
    console.log("✅ User connected:", socket.id);

    socket.on('student_join', (studentId, examId) => {
        if (studentId) {
            // Check if student is already connected (reconnection)
            if (connectedStudents[studentId]) {
                console.log(`Student ${studentId} reconnecting, updating socket ID from ${connectedStudents[studentId].socketId} to ${socket.id}`);
                connectedStudents[studentId].socketId = socket.id;
                connectedStudents[studentId].timestamp = new Date().toISOString();
            } else {
                // New student connection
                connectedStudents[studentId] = {
                    socketId: socket.id,
                    examId: examId || null,
                    timestamp: new Date().toISOString()
                };
                console.log(`Student ${studentId} connected with socket ${socket.id}${examId ? ` for exam ${examId}` : ''}`);
            }
            
            // Emit student connected event for real-time updates
            io.emit('student_connected', {
                studentId,
                socketId: socket.id,
                examId: examId || null,
                timestamp: new Date().toISOString()
            });
            
            console.log(`Total connected students: ${Object.keys(connectedStudents).length}`);
            console.log(`Connected students: ${Object.keys(connectedStudents).join(', ')}`);
        }
    });

    socket.on('start_exam', (examData) => {
        console.log('🚀 Exam started:', examData);
        io.emit('start_exam', examData); // Broadcast to all connected clients
    });

    socket.on('end_exam_for_student', (studentId) => {
        const socketId = connectedStudents[studentId];
        if (socketId) {
            io.to(socketId).emit('end_exam');
            console.log(`⛔ Ended exam for student ${studentId}`);
        }
    });

    socket.on('test_message', (message) => {
        console.log('📨 Test message received:', message);
        socket.emit('test_response', 'Message received by server!');
    });

    socket.on('student_disconnect', (studentId, examId) => {
        console.log(`🔄 Manual disconnect request from student ${studentId} for exam ${examId}`);
        
        if (studentId && connectedStudents[studentId]) {
            const studentData = connectedStudents[studentId];
            delete connectedStudents[studentId];
            console.log(`Student ${studentId} manually disconnected`);
            
            // Emit student disconnected event for real-time updates
            io.emit('student_disconnected', {
                studentId: studentId,
                socketId: socket.id,
                examId: examId || studentData.examId,
                timestamp: new Date().toISOString(),
                reason: 'manual_disconnect'
            });
        }
    });

    socket.on('disconnect', () => {
        console.log("❌ User disconnected:", socket.id);
        
        // Find the disconnected student
        const disconnectedStudentId = Object.keys(connectedStudents).find(
            studentId => connectedStudents[studentId].socketId === socket.id
        );
        
        if (disconnectedStudentId) {
            // Add a delay to allow for reconnection
            setTimeout(() => {
                // Check if student has reconnected in the meantime
                const studentData = connectedStudents[disconnectedStudentId];
                if (studentData && studentData.socketId === socket.id) {
                    // Student hasn't reconnected, remove them
                    delete connectedStudents[disconnectedStudentId];
                    console.log(`Student ${disconnectedStudentId} disconnected after delay`);
                    
                    // Emit student disconnected event for real-time updates
                    io.emit('student_disconnected', {
                        studentId: disconnectedStudentId,
                        socketId: socket.id,
                        examId: studentData.examId,
                        timestamp: new Date().toISOString()
                    });
                } else {
                    console.log(`Student ${disconnectedStudentId} reconnected, not removing`);
                }
            }, 3000); // 3 second delay
        }
    });
});

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

console.log('- /api/instructors');
app.use('/api/instructors', instructorsRoutes);

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

// Background process to check for expired shutdown records
setInterval(() => {
  const shutdownRecords = global.shutdownRecords || {};
  const now = new Date();
  
  Object.entries(shutdownRecords).forEach(([studentId, record]) => {
    const shutdownTime = new Date(record.shutdownTime);
    const tenMinutesAfter = new Date(shutdownTime.getTime() + 10 * 60 * 1000);
    
    if (now >= tenMinutesAfter && !record.powerOnExpired) {
      // Mark as failed
      record.powerOnExpired = true;
      record.failed = true;
      record.failedReason = 'Power-on window expired';
      global.shutdownRecords[studentId] = record;
      
      console.log(`Student ${studentId} marked as failed due to power-on window expiration`);
      
      // Emit exam_failed event
      if (global.io) {
        global.io.emit('exam_failed', {
          studentId,
          examId: record.examId,
          timestamp: new Date().toISOString(),
          reason: 'Power-on window expired - Exam failed',
          grade: 'F'
        });
      }
    }
  });
}, 30000); // Check every 30 seconds

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Socket.IO is ready for connections');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});
