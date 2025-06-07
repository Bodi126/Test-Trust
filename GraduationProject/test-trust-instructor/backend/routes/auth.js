// routes/auth.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/user');
const Exam = require('../models/exam');
const Question = require('../models/question');
const ModelAnswer = require('../models/modelAnswer');

const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Only allow setting twoFactorCode and twoFactorExpires in /send-2fa-code and /verify-2fa endpoints
router.post('/signup', async (req, res) => {
  try {
    const { email, ...rest } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Prevent twoFactorCode and twoFactorExpires from being set on signup
    const filteredRest = { ...rest };
    delete filteredRest.twoFactorCode;
    delete filteredRest.twoFactorExpires;

    const newUser = new User({ email, ...filteredRest });
    await newUser.save();
    console.log('New user created:', newUser);

    res.status(201).json({ message: 'Account created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Signup error', error: err });
  }
});

// LOGIN endpoint with 2FA check
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`[LOGIN] Attempt for email: ${email}`);

    const user = await User.findOne({ email });
    if (!user) {
      console.log(`[LOGIN] Failed: User not found for email: ${email}`);
      return res.status(401).json({ message: 'User not found. Please check your email.' });
    }
    if (user.password !== password) {
      console.log(`[LOGIN] Failed: Password mismatch for email: ${email}`);
      return res.status(401).json({ message: 'Incorrect password. Please try again.' });
    }

    if (user.twoFactorEnabled) {
      // 2FA required: generate and log code to console
      const code = Math.floor(100000 + Math.random() * 900000); // Keep as number
      const expiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes from now
      
      // Save the code and expiry to the user
      user.twoFactorCode = code;
      user.twoFactorExpires = expiresAt;
      await user.save();
      
      // Log the code to console for testing
      console.log('\n=== 2FA CODE (for testing only) ===');
      console.log(`Code for ${email}: ${code}`);
      console.log(`Expires at: ${expiresAt}`);
      console.log('==================================\n');
      
      // Return minimal user info (no sensitive data)
      const userResponse = {
        email: user.email,
        twoFactorEnabled: true
      };
      
      return res.status(200).json({ 
        require2FA: true, 
        message: '2FA required. Check server logs for the code.',
        user: userResponse
      });
    }

    // If 2FA is not enabled, log in directly
    const token = user.generateAuthToken();
    console.log(`[LOGIN] Success for email: ${email}`);
    
    // Return the full user object with token for non-2FA login
    const userResponse = {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      position: user.position,
      idNumber: user.idNumber,
      twoFactorEnabled: user.twoFactorEnabled
    };
    
    res.status(200).json({ 
      message: 'Login successful', 
      token, 
      user: userResponse 
    });
  } catch (err) {
    console.error('[LOGIN] Error:', err);
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
      questionCount: Number(req.body.questionCount),
      createdBy: req.body.createdBy // Set the creator
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
  console.log('[2FA] /send-2fa-code called with email:', email);

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log('[2FA] User not found for email:', email);
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('[2FA] User found:', user.email);

    // Generate a 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes from now

    user.twoFactorCode = code;
    user.twoFactorExpires = expiresAt;
    await user.save();
    console.log('[2FA] Code and expiry saved to user:', code, expiresAt);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your 2FA Code',
      text: `Your 2FA code is: ${code}. It will expire in 10 minutes.`
    });
    console.log('[2FA] Email sent to:', email);

    res.status(200).json({ message: '2FA code sent successfully' });
  } catch (err) {
    console.error('[2FA] Error sending 2FA code:', err);
    res.status(500).send('Internal server error');
  }
});

// [REMOVED DUPLICATE /two-factor ENDPOINT] - Use /toggle-2fa in instructors.js instead

router.post('/verify-2fa', async (req, res) => {
  const { email, code } = req.body;
  
  console.log('\n[2FA VERIFY] =======================');
  console.log(`[2FA VERIFY] Attempt for email: ${email}`);
  console.log(`[2FA VERIFY] Code received (type: ${typeof code}):`, code);

  if (!email || code === undefined || code === '') {
    console.log('[2FA VERIFY] Missing email or code');
    return res.status(400).json({ valid: false, message: 'Email and code are required' });
  }

  try {
    // Convert code to number and validate
    const codeNum = Number(code);
    if (isNaN(codeNum) || codeNum < 100000 || codeNum > 999999) {
      console.log('[2FA VERIFY] Invalid code format');
      return res.status(400).json({ valid: false, message: 'Invalid code format. Must be a 6-digit number.' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`[2FA VERIFY] User not found for email: ${email}`);
      return res.status(400).json({ valid: false, message: 'User not found' });
    }

    // Debug logging
    console.log(`[2FA VERIFY] User found: ${user.email}`);
    console.log(`[2FA VERIFY] Expected code (type: ${typeof user.twoFactorCode}):`, user.twoFactorCode);
    console.log(`[2FA VERIFY] Code expires at: ${user.twoFactorExpires}`);
    console.log(`[2FA VERIFY] Current time: ${new Date()}`);
    
    // Check if code exists
    if (user.twoFactorCode === null || user.twoFactorCode === undefined) {
      console.log('[2FA VERIFY] No 2FA code found for user');
      return res.status(400).json({ valid: false, message: 'No 2FA code found. Please request a new code.' });
    }
    
    // Check if code matches (strict number comparison)
    if (user.twoFactorCode !== codeNum) {
      console.log(`[2FA VERIFY] Code does not match. Expected: ${user.twoFactorCode}, Got: ${codeNum}`);
      return res.status(400).json({ 
        valid: false, 
        message: 'Invalid code. Please try again.',
        details: {
          expectedType: typeof user.twoFactorCode,
          receivedType: typeof codeNum,
          receivedValue: code
        }
      });
    }
    
    // Check if code is expired
    if (new Date() > user.twoFactorExpires) {
      console.log('[2FA VERIFY] Code has expired');
      return res.status(400).json({ valid: false, message: 'Code has expired. Please request a new one.' });
    }

    // Clear the 2FA code after successful verification
    user.twoFactorCode = undefined;
    user.twoFactorExpires = undefined;
    await user.save();

    console.log('[2FA VERIFY] Code verified successfully');
    
    // Generate token with user data
    const token = user.generateAuthToken(user);
    
    // Prepare user response
    const userResponse = {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      position: user.position,
      idNumber: user.idNumber,
      twoFactorEnabled: user.twoFactorEnabled
    };
    
    console.log(`[2FA VERIFY] Successfully authenticated user: ${user.email}`);
    console.log('==================================\n');
    
    res.json({
      valid: true,
      token,
      user: userResponse
    });
    
  } catch (error) {
    console.error('\n[2FA VERIFY] Error:', error);
    res.status(500).json({ 
      valid: false, 
      message: 'Internal server error', 
      error: error.message 
    });
  }
});


// Save questions for an exam
router.post('/add-questions', async (req, res) => {
  try {
    const { examId, questions } = req.body;
    if (!examId || !Array.isArray(questions)) {
      return res.status(400).json({ message: 'examId and questions array are required' });
    }
    // Attach examId to each question
    const questionsWithExamId = questions.map(q => ({ ...q, examId }));
    // Insert questions
    const savedQuestions = await Question.insertMany(questionsWithExamId);
    res.status(201).json({ message: 'Questions saved successfully', questions: savedQuestions });
  } catch (err) {
    console.error('Error saving questions:', err);
    res.status(500).json({ message: 'Failed to save questions', error: err.message });
  }
});

// Add questions and model answers for an exam (auto-correct)
router.post('/add-questions-and-answers', async (req, res) => {
  try {
    const { examId, questions } = req.body;

    // Validate examId format
    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({ message: 'Invalid exam ID format' });
    }

    // Verify exam exists
    const examExists = await Exam.findById(examId);
    if (!examExists) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Prepare questions for insertion (remove answer field)
    const questionsToSave = questions.map(q => {
      const { answer, ...rest } = q;
      return {
        ...rest,
        examId: new mongoose.Types.ObjectId(examId),
        number: parseInt(q.number),
      };
    });

    // Insert questions
    const savedQuestions = await Question.insertMany(questionsToSave);

    // Prepare and insert model answers if autoCorrect is enabled
    const modelAnswersToSave = [];
    savedQuestions.forEach((savedQ, idx) => {
      // If the original question had autoCorrect true and an answer, save it in ModelAnswer
      if (questions[idx].autoCorrect && questions[idx].answer !== undefined && questions[idx].answer !== null) {
        modelAnswersToSave.push({
          questionId: savedQ._id,
          answer: questions[idx].answer
        });
      }
    });
    let savedModelAnswers = [];
    if (modelAnswersToSave.length > 0) {
      savedModelAnswers = await ModelAnswer.insertMany(modelAnswersToSave);
    }

    res.status(201).json({
      message: 'Questions and model answers saved successfully',
      questions: savedQuestions,
      modelAnswers: savedModelAnswers
    });
  } catch (err) {
    console.error('Error saving questions and model answers:', err);
    res.status(500).json({
      message: 'Failed to save questions and model answers',
      error: err.message
    });
  }
});

// Get exams for a specific user
router.get('/my-exams', async (req, res) => {
  try {
    const user = req.query.user;
    if (!user) {
      return res.status(400).json({ message: 'User identifier is required' });
    }
    const exams = await Exam.find({ createdBy: user });
    res.status(200).json({ exams });
  } catch (err) {
    console.error('Error fetching user exams:', err);
    res.status(500).json({ message: 'Failed to fetch exams', error: err.message });
  }
});

module.exports = router;
