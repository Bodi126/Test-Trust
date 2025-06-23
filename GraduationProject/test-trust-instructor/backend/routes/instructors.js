const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Student = require('../models/student');
const Exam = require('../models/exam');
const Result = require('../models/result');

router.post('/toggle-2fa', async (req, res) => {
  try {
    const { email, enabled } = req.body;
    const instructor = await User.findOneAndUpdate(
      { email },
      { twoFactorEnabled: enabled },
      { new: true }
    );
    if (!instructor) {
      return res.status(404).json({ message: 'Instructor not found' });
    }
    res.json({ success: true, twoFactorEnabled: instructor.twoFactorEnabled });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Get all students with their connection status
router.get('/students/status', async (req, res) => {
  try {
    const { examId } = req.query;
    
    if (!examId) {
      return res.status(400).json({ error: 'Exam ID is required' });
    }

    // Get the exam to find enrolled students
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    // Get all students (in a real system, you'd filter by enrolled students)
    const students = await Student.find({}).select('fullName nationalId department academicYear');
    
    // Get connected students from global Socket.IO tracking
    const connectedStudents = global.connectedStudents || {};
    const connectedStudentIds = Object.keys(connectedStudents);
    
    // Map students with their connection status
    const studentsWithStatus = students.map(student => {
      const isConnected = connectedStudentIds.includes(student.nationalId);
      const socketId = connectedStudents[student.nationalId];
      
      return {
        id: student._id,
        studentId: student.nationalId,
        name: student.fullName,
        department: student.department,
        academicYear: student.academicYear,
        pcName: `PC-${student.nationalId.slice(-4)}`, // Generate PC name from student ID
        status: isConnected ? 'online' : 'offline',
        socketId: socketId || null,
        lastActive: isConnected ? new Date().toISOString() : null,
        shutdownTime: null,
        canPowerOn: false,
        powerOnExpired: false
      };
    });

    res.json({
      exam: {
        id: exam._id,
        subject: exam.subject,
        department: exam.department,
        year: exam.year
      },
      students: studentsWithStatus,
      stats: {
        total: studentsWithStatus.length,
        online: studentsWithStatus.filter(s => s.status === 'online').length,
        offline: studentsWithStatus.filter(s => s.status === 'offline').length
      }
    });
  } catch (error) {
    console.error('Error fetching student status:', error);
    res.status(500).json({ error: 'Failed to fetch student status' });
  }
});

// Remote shutdown student PC (disconnect student)
router.post('/students/:studentId/shutdown', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { examId } = req.body;
    
    if (!examId) {
      return res.status(400).json({ error: 'Exam ID is required' });
    }

    // Get connected students
    const connectedStudents = global.connectedStudents || {};
    const socketId = connectedStudents[studentId];
    
    if (!socketId) {
      return res.status(404).json({ error: 'Student not connected' });
    }

    // Get Socket.IO instance
    const io = global.io;
    if (!io) {
      return res.status(500).json({ error: 'Socket.IO not available' });
    }

    // Emit exam_end signal to all students in the exam (more reliable than specific socket)
    console.log(`Emitting exam_end to all students for exam ${examId}`);
    console.log(`Student ID: ${studentId}, Exam ID: ${examId}`);
    io.emit('exam_end', {
      examId,
      studentId,
      timestamp: new Date().toISOString(),
      reason: 'Instructor initiated shutdown',
      action: 'shutdown'
    });
    console.log('exam_end event emitted successfully to all students');

    // Remove student from connected list
    delete connectedStudents[studentId];
    global.connectedStudents = connectedStudents;

    // Store shutdown record (in a real system, you'd save this to database)
    const shutdownRecord = {
      studentId,
      examId,
      shutdownTime: new Date().toISOString(),
      initiatedBy: req.body.instructorId || 'instructor',
      canPowerOn: true,
      powerOnExpired: false
    };

    // Store in memory (in production, use Redis or database)
    if (!global.shutdownRecords) global.shutdownRecords = {};
    global.shutdownRecords[studentId] = shutdownRecord;

    res.json({
      success: true,
      message: `Student ${studentId} has been disconnected`,
      shutdownRecord
    });
  } catch (error) {
    console.error('Error shutting down student PC:', error);
    res.status(500).json({ error: 'Failed to shutdown student PC' });
  }
});

// Remote power on student PC (reconnect student)
router.post('/students/:studentId/poweron', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { examId } = req.body;
    
    if (!examId) {
      return res.status(400).json({ error: 'Exam ID is required' });
    }

    // Check if student was previously shut down
    const shutdownRecords = global.shutdownRecords || {};
    const shutdownRecord = shutdownRecords[studentId];
    
    if (!shutdownRecord) {
      return res.status(404).json({ error: 'No shutdown record found for this student' });
    }

    // Check if power-on window has expired (10 minutes)
    const shutdownTime = new Date(shutdownRecord.shutdownTime);
    const tenMinutesAfter = new Date(shutdownTime.getTime() + 10 * 60 * 1000);
    const now = new Date();
    
    if (now >= tenMinutesAfter) {
      shutdownRecord.powerOnExpired = true;
      global.shutdownRecords[studentId] = shutdownRecord;
      
      return res.status(400).json({ 
        error: 'Power-on window has expired',
        shutdownRecord 
      });
    }

    // Fetch exam data to send with start_exam event (like dashboard start exam button)
    console.log(`Fetching exam data for examId: ${examId}`);
    const exam = await Exam.findById(examId);
    
    if (!exam) {
      console.log(`Exam not found for examId: ${examId}`);
      return res.status(404).json({ error: 'Exam not found' });
    }
    
    console.log(`Exam found: ${exam.subject} (${exam._id})`);

    // Emit start_exam signal with exam data (same as dashboard start exam button)
    const io = global.io;
    if (io) {
      console.log(`Emitting start_exam for power-on to student ${studentId} for exam ${examId}`);
      io.emit('start_exam', {
        _id: exam._id,
        subject: exam.subject,
        department: exam.department,
        year: exam.year,
        duration: exam.duration,
        startTime: exam.startTime,
        endTime: exam.endTime,
        autoCorrection: exam.autoCorrection,
        timestamp: new Date().toISOString(),
        message: 'Exam restarted - Continue where you left off',
        action: 'power_on_restart',
        shutdownRecord: {
          shutdownTime: shutdownRecord.shutdownTime,
          timeRemaining: Math.floor((tenMinutesAfter - now) / 1000)
        }
      });
      console.log('start_exam event emitted successfully for power-on');
    }

    // Remove shutdown record
    delete shutdownRecords[studentId];
    global.shutdownRecords = shutdownRecords;

    res.json({
      success: true,
      message: `Power-on signal sent to student ${studentId}`,
      timeRemaining: Math.floor((tenMinutesAfter - now) / 1000)
    });
  } catch (error) {
    console.error('Error powering on student PC:', error);
    res.status(500).json({ error: 'Failed to power on student PC' });
  }
});

// Get shutdown records for an exam
router.get('/students/shutdown-records/:examId', async (req, res) => {
  try {
    const { examId } = req.params;
    const shutdownRecords = global.shutdownRecords || {};
    
    // Filter records for this exam
    const examRecords = Object.entries(shutdownRecords)
      .filter(([studentId, record]) => record.examId === examId)
      .map(([studentId, record]) => ({
        studentId,
        ...record
      }));

    res.json({
      examId,
      records: examRecords,
      total: examRecords.length
    });
  } catch (error) {
    console.error('Error fetching shutdown records:', error);
    res.status(500).json({ error: 'Failed to fetch shutdown records' });
  }
});

// Get real-time student activity
router.get('/students/activity/:examId', async (req, res) => {
  try {
    const { examId } = req.params;
    const connectedStudents = global.connectedStudents || {};
    
    // Get student details for connected students
    const connectedStudentIds = Object.keys(connectedStudents);
    const students = await Student.find({ 
      nationalId: { $in: connectedStudentIds } 
    }).select('fullName nationalId department academicYear');
    
    const activityData = students.map(student => ({
      studentId: student.nationalId,
      name: student.fullName,
      department: student.department,
      academicYear: student.academicYear,
      socketId: connectedStudents[student.nationalId],
      connectedAt: new Date().toISOString(), // In real system, track actual connection time
      lastActivity: new Date().toISOString()
    }));

    res.json({
      examId,
      activeStudents: activityData,
      totalConnected: activityData.length
    });
  } catch (error) {
    console.error('Error fetching student activity:', error);
    res.status(500).json({ error: 'Failed to fetch student activity' });
  }
});

// Bulk operations
router.post('/students/bulk-shutdown', async (req, res) => {
  try {
    const { studentIds, examId } = req.body;
    
    if (!examId || !studentIds || !Array.isArray(studentIds)) {
      return res.status(400).json({ error: 'Exam ID and student IDs array are required' });
    }

    const connectedStudents = global.connectedStudents || {};
    const io = global.io;
    const results = [];

    for (const studentId of studentIds) {
      const socketId = connectedStudents[studentId];
      
      if (socketId && io) {
        // Emit exam_end signal
        io.emit('exam_end', {
          examId,
          studentId,
          timestamp: new Date().toISOString(),
          reason: 'Bulk shutdown initiated by instructor',
          action: 'shutdown'
        });

        // Remove from connected list
        delete connectedStudents[studentId];
        
        // Store shutdown record
        if (!global.shutdownRecords) global.shutdownRecords = {};
        global.shutdownRecords[studentId] = {
          studentId,
          examId,
          shutdownTime: new Date().toISOString(),
          initiatedBy: 'instructor',
          canPowerOn: true,
          powerOnExpired: false
        };

        results.push({ studentId, status: 'shutdown', success: true });
      } else {
        results.push({ studentId, status: 'not_connected', success: false });
      }
    }

    global.connectedStudents = connectedStudents;

    res.json({
      success: true,
      message: `Bulk shutdown completed for ${studentIds.length} students`,
      results
    });
  } catch (error) {
    console.error('Error in bulk shutdown:', error);
    res.status(500).json({ error: 'Failed to perform bulk shutdown' });
  }
});

// Emit real-time student status updates
router.post('/students/status-update', async (req, res) => {
  try {
    const { examId, studentId, status, action } = req.body;
    
    if (!examId) {
      return res.status(400).json({ error: 'Exam ID is required' });
    }

    const io = global.io;
    if (!io) {
      return res.status(500).json({ error: 'Socket.IO not available' });
    }

    // Emit real-time status update to all connected instructors
    io.emit('student_status_update', {
      examId,
      studentId,
      status,
      action,
      timestamp: new Date().toISOString()
    });

    console.log(`Emitted student status update: ${studentId} - ${status} - ${action}`);

    res.json({
      success: true,
      message: 'Status update emitted successfully'
    });
  } catch (error) {
    console.error('Error emitting status update:', error);
    res.status(500).json({ error: 'Failed to emit status update' });
  }
});

// Get connected students count for an exam
router.get('/students/connected-count/:examId', async (req, res) => {
  try {
    const { examId } = req.params;
    
    // Get the exam to find student count
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    // Get connected students from global Socket.IO tracking
    const connectedStudents = global.connectedStudents || {};
    const connectedCount = Object.keys(connectedStudents).length;
    
    res.json({
      examId,
      totalStudents: exam.studentCount,
      connectedStudents: connectedCount,
      offlineStudents: exam.studentCount - connectedCount,
      totalPCs: 30 // Hardcoded as requested
    });
  } catch (error) {
    console.error('Error fetching connected students count:', error);
    res.status(500).json({ error: 'Failed to fetch connected students count' });
  }
});

module.exports = router;
