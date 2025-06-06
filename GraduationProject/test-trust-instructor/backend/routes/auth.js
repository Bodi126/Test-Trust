// routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Exam = require('../models/exam');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

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

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

router.post('/send-2fa-code', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate a 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes from now

    user.twoFactorCode = code;
    user.twoFactorExpires = expiresAt;
    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your 2FA Code',
      text: `Your 2FA code is: ${code}. It will expire in 10 minutes.`
    });

    res.status(200).json({ message: '2FA code sent successfully' });
  } catch (err) {
    console.error('Error sending 2FA code:', err);
    res.status(500).send('Internal server error');
  }
});

router.post('/two-factor', async (req, res) => {
  try {
    const { email, enabled } = req.body;
    const user = await User.findOneAndUpdate(
      { email },
      { twoFactorEnabled: enabled },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ success: true, twoFactorEnabled: user.twoFactorEnabled });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

router.post('/verify-2fa', async (req, res) => {
  const { email, code } = req.body;

  try {
    const user = await User.findOne({
      email,
      twoFactorCode: code,
      twoFactorExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ valid: false, message: 'Invalid or expired 2FA code' });
    }

    // Clear the 2FA code after successful verification
    user.twoFactorCode = undefined;
    user.twoFactorExpires = undefined;
    await user.save();

    const token = user.generateAuthToken(user);
    res.json({
      valid: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        position: user.position,
        idNumber: user.idNumber,
        twoFactorEnabled: user.twoFactorEnabled // Add this line
      }
    });
  } catch (error) {
    console.error('Error verifying 2FA code:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


module.exports = router;
