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
    const { examTime, subject } = req.body;

    const existingExamTime = await Exam.findOne({ examTime });
    if (existingExamTime) {
      return res.status(400).json({ message: 'Exam already exists for this time' });
    }
    const existingExamSubject = await Exam.findOne({ subject });
    if (existingExamSubject) {
      return res.status(400).json({ message: 'Exam already exists for this subject' });
    }

    const newExam = new Exam(req.body);
    await newExam.save();
    console.log('New exam created:', newExam);

    res.status(201).json({ message: 'Exam created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Exam creation error', error: err });
  }
});

module.exports = router;
