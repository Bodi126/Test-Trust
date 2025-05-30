// routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Exam = require('../models/exam');

router.post('/signup', async (req, res) => {
  try {
    const { email } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const newUser = new User(req.body);
    await newUser.save();
    console.log('New user created:', newUser);

    res.status(201).json({ message: 'Account created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Signup error', error: err });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.status(200).json({ message: 'Login successful', user });
  } catch (err) {
    res.status(500).json({ message: 'Login error', error: err });
  }
});


router.post('/AddExam1', async (req, res) => {
  try {
    const { examTime, examDate, subject } = req.body;

    // Check for existing exam with same time AND date (more realistic check)
    const existingExam = await Exam.findOne({ 
      examDate: new Date(examDate),
      examTime 
    });
    
    if (existingExam) {
      return res.status(400).json({ 
        message: 'An exam already exists at this date and time' 
      });
    }

    // Check for existing exam with same subject AND date
    const existingSubjectExam = await Exam.findOne({ 
      subject,
      examDate: new Date(examDate) 
    });
    
    if (existingSubjectExam) {
      return res.status(400).json({ 
        message: 'An exam for this subject already exists on this date' 
      });
    }

    // Create new exam with proper type conversion
    const newExam = new Exam({
      ...req.body,
      examDate: new Date(req.body.examDate),
      studentCount: Number(req.body.studentCount),
      examDuration: Number(req.body.examDuration),
      totalMarks: Number(req.body.totalMarks),
      questionCount: Number(req.body.questionCount)
    });

    await newExam.save();
    res.status(201).json({ 
      message: 'Exam created successfully',
      examId: newExam._id // Return the exam ID for future reference
    });

  } catch (err) {
    console.error('Exam creation error:', err);
    res.status(500).json({ 
      message: 'Exam creation failed',
      error: err.message // Send only the error message for security
    });
  }
});

module.exports = router;
