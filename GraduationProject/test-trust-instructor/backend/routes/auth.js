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
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.status(200).json({ message: 'Login successful', user });
  } catch (err) {
    res.status(500).json({ message: 'Login error', error: err });
  }
});



router.post('/AddExam1', async (req, res) => {
  try {
    const { examTime, examDate, subject, department, year, examDuration } = req.body;

    // Validate required fields
    if (!examTime || !examDate || !subject || !department || !year || !examDuration) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate exam date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inputDate = new Date(examDate);
    inputDate.setHours(0, 0, 0, 0);

    if (inputDate < today) {
      return res.status(400).json({ message: 'Exam date cannot be in the past' });
    }

    // Check for time slot conflicts within the same department
    const existingExams = await Exam.find({ 
      department,
      examDate: inputDate 
    });

    // Calculate new exam start and end times
    const newExamStart = new Date(`${examDate}T${examTime}`);
    const newExamEnd = new Date(newExamStart.getTime() + examDuration * 60000);

    // Check for time conflicts within same department
    for (const exam of existingExams) {
      const existingStart = new Date(`${exam.examDate.toISOString().split('T')[0]}T${exam.examTime}`);
      const existingEnd = new Date(existingStart.getTime() + exam.examDuration * 60000);

      if (newExamStart < existingEnd && newExamEnd > existingStart) {
        return res.status(400).json({ 
          message: 'Time conflict with another exam in ${department} department' 
        });
      }
    }

    // Check if same subject exists for same department/year/date combination
    const existingSubjectExam = await Exam.findOne({ 
      subject: { $regex: new RegExp(`^${subject}$`, 'i') },
      department,
      year,
      examDate: inputDate 
    });

    if (existingSubjectExam) {
      return res.status(400).json({ 
        message: '${subject} exam already exists for ${department} (Year ${year}) on this date' 
      });
    }

    // Create and save the new exam
    const newExam = new Exam({
      ...req.body,
      examDate: inputDate,
      studentCount: Number(req.body.studentCount),
      examDuration: Number(req.body.examDuration),
      totalMarks: Number(req.body.totalMarks),
      questionCount: Number(req.body.questionCount)
    });

    await newExam.save();

    res.status(201).json({ 
      message: 'Exam created successfully',
      examId: newExam._id 
    });

  } catch (err) {
    console.error('Exam creation error:', err);
    res.status(500).json({ 
      message: 'Exam creation failed',
      error: err.message 
    });
  }
});

module.exports = router;
