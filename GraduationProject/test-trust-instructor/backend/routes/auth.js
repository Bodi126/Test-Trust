// routes/auth.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Exam = require('../models/exam');
const ModelAnswer = require('../models/modelAnswer');
const Question = require('../models/question');
const stu_answer = require('../models/student_answer');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const auth = require('../middleware/auth');

// Create a transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false // Only for testing, remove in production
  }
});

// Email configuration
const FROM_EMAIL = process.env.FROM_EMAIL;

/**
 * Sends a login notification email to the user
 * @param {string} email - User's email address
 * @returns {Promise<boolean>} - True if email was sent successfully
 */
async function sendLoginNotification(email) {
  try {
    const mailOptions = {
      from: `"TestTrust" <${FROM_EMAIL}>`,
      to: email,
      subject: 'New Login Detected',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Login Detected</h2>
          <p>We noticed a new login to your TestTrust instructor account.</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <p>If this was you, you can safely ignore this email.</p>
          <p>If you didn't log in, please secure your account immediately by changing your password.</p>
          <p>Best regards,<br>TestTrust Team</p>
        </div>
      `,
      text: `New login detected for your TestTrust instructor account at ${new Date().toLocaleString()}.\n\nIf this wasn't you, please secure your account immediately.`
    };

    await transporter.sendMail(mailOptions);
    console.log(`[EMAIL] Login notification sent to ${email}`);
    return true;
  } catch (error) {
    console.error('[EMAIL] Failed to send login notification:', error);
    return false;
  }
}

// Signup route
router.post('/signup', async (req, res) => {
  try {
    console.log('Signup request received');
    
    // Validate required fields
    const { firstName, lastName, idNumber, position, email, password } = req.body;
    
    if (!firstName || !lastName || !idNumber || !position || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'All fields are required',
        requiredFields: ['firstName', 'lastName', 'idNumber', 'position', 'email', 'password']
      });
    }

    // Check if user already exists (case-insensitive email check)
    const existingUser = await User.findOne({ 
      $or: [
        { email: { $regex: new RegExp(`^${email}$`, 'i') } },
        { idNumber: idNumber.toString().trim() }
      ]
    });

    if (existingUser) {
      const field = existingUser.email.toLowerCase() === email.toLowerCase() ? 'Email' : 'ID Number';
      console.log(`Signup failed: ${field} already exists`);
      return res.status(400).json({ 
        success: false,
        message: `${field} already exists`,
        code: field.toUpperCase().replace(' ', '_') + '_EXISTS'
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Create new user (password will be hashed by the pre-save hook)
    const newUser = new User({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      idNumber: idNumber.toString().trim(),
      position: position.trim(),
      email: email.trim().toLowerCase(),
      password: password, // Will be hashed by pre-save hook
      twoFactorEnabled: false
    });

    await newUser.save();
    
    // Don't send back the password, even though it's hashed
    newUser.password = undefined;
    
    console.log('New user created successfully:', { 
      email: newUser.email,
      id: newUser._id 
    });

    res.status(201).json({ 
      success: true,
      message: 'Account created successfully',
      user: {
        id: newUser._id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName
      }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error creating account',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// LOGIN endpoint with 2FA check
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }
    
    console.log(`[LOGIN] Attempt for email: ${email}`);

    // Trim and normalize email for case-insensitive search
    const normalizedEmail = email.trim().toLowerCase();
    
    // Find user and explicitly select the password field
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    
    // Check if user exists and password is correct
    if (!user) {
      console.log(`[LOGIN] User not found for email: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Verify password
    const isPasswordValid = await user.matchPassword(password);
    
    if (!isPasswordValid) {
      console.log(`[LOGIN] Invalid password for email: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Debug logs to help with troubleshooting
    console.log(`[AUTH] Password comparison for: ${email}`);
    console.log(`[AUTH] Stored password hash length: ${user.password ? user.password.length : 0}`);
    
    // Verify password using bcrypt (handled by matchPassword method)
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      console.log(`[AUTH] Failed: Password mismatch for email: ${email}`);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    if (user.twoFactorEnabled) {
      // 2FA required: generate code and send via email
      const code = Math.floor(100000 + Math.random() * 900000);
      const expiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes
      
      // Save the code and expiry to the user
      user.twoFactorCode = code;
      user.twoFactorExpires = expiresAt;
      await user.save();
      
      // Send email with the code
      try {
        const mailOptions = {
          from: `"TestTrust" <${process.env.FROM_EMAIL || 'noreply@testtrust.com'}>`,
          to: user.email,
          subject: 'Your Two-Factor Authentication Code',
          text: `Your verification code is: ${code}\n\nThis code is valid for 10 minutes.`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Two-Factor Authentication</h2>
              <p>Your verification code is:</p>
              <div style="background: #f4f4f4; padding: 20px; margin: 20px 0; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px;">
                ${code}
              </div>
              <p>This code is valid for 10 minutes.</p>
              <p>If you didn't request this, please secure your account immediately.</p>
              <p>Best regards,<br>TestTrust Team</p>
            </div>
          `
        };

        await transporter.sendMail(mailOptions);
        console.log(`2FA code sent to ${user.email}`);
      } catch (emailError) {
        console.error('Failed to send 2FA email:', emailError);
        return res.status(500).json({ 
          message: 'Failed to send verification code',
          code: 'EMAIL_SEND_ERROR'
        });
      }
      
      // Return minimal user info (no sensitive data)
      const userResponse = {
        email: user.email,
        twoFactorEnabled: true
      };
      
      return res.status(200).json({ 
        success: true,
        require2FA: true, 
        message: '2FA required. Check your email for the verification code.',
        user: userResponse,
        email: user.email
      });
    }

    // If 2FA is not enabled, log in directly
    const token = user.generateAuthToken();
    console.log(`[LOGIN] Success for email: ${email}`);
    
    // Debug log the user object with all relevant fields
    console.log('[LOGIN] User object before notification check:', {
      email: user.email,
      loginNotificationsEnabled: user.loginNotificationsEnabled,
      twoFactorEnabled: user.twoFactorEnabled,
      _id: user._id,
      timestamp: new Date().toISOString()
    });

    // Explicitly check if login notifications are enabled for this user
    // Default to true only if the field is undefined (for backward compatibility)
    const shouldSendNotification = user.loginNotificationsEnabled === undefined ? true : user.loginNotificationsEnabled;
    
    console.log(`[LOGIN] Login notifications ${shouldSendNotification ? 'ENABLED' : 'DISABLED'} for ${user.email}`);
    
    if (shouldSendNotification) {
      console.log(`[LOGIN] Sending login notification to ${user.email}`);
      
      // Send login notification (fire and forget)
      sendLoginNotification(user.email)
        .then(sent => {
          if (sent) {
            console.log(`[LOGIN] Successfully sent notification to ${user.email}`);
          } else {
            console.error(`[LOGIN] Failed to send notification to ${user.email}`);
          }
        })
        .catch(err => {
          console.error('[LOGIN] Notification error:', err);
        });
    } else {
      console.log(`[LOGIN] NOT sending notification to ${user.email} - notifications are disabled in user settings`);
    }
    
    // Return the full user object with token for non-2FA login
    const userResponse = {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      position: user.position,
      idNumber: user.idNumber,
      twoFactorEnabled: user.twoFactorEnabled,
      loginNotificationsEnabled: user.loginNotificationsEnabled
    };
    
    res.status(200).json({ 
      message: 'Login successful', 
      token: token, 
      user: userResponse 
    });
  } catch (err) {
    console.error('[LOGIN] Error:', err);
    res.status(500).json({ message: 'Login error', error: err });
  }
});

// Get current user data
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      position: user.position,
      idNumber: user.idNumber,
      examCount: user.examCount || 0,
      twoFactorEnabled: user.twoFactorEnabled || false,
      loginNotificationsEnabled: user.loginNotificationsEnabled !== undefined ? user.loginNotificationsEnabled : true
    });
  } catch (error) {
    console.error('Error getting user data:', error);
    res.status(500).json({ message: 'Error retrieving user data' });
  }
});

// Forgot password route
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: 'Email is required' 
      });
    }

    // Find user by email (case-insensitive)
    const user = await User.findOne({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') } 
    });

    if (!user) {
      // Don't reveal if user exists for security
      return res.json({ 
        success: true,
        message: 'If your email exists, you will receive a password reset link' 
      });
    }

    // Use the model method to create a password reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    try {
      // Send email with reset link
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
      
      const mailOptions = {
        from: `"TestTrust" <${FROM_EMAIL}>`,
        to: user.email,
        subject: 'Password Reset Request',
        text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n` +
          `Please click on the following link, or paste this into your browser to complete the process:\n\n` +
          `${resetUrl}\n\n` +
          `This link will expire in 10 minutes.\n\n` +
          `If you did not request this, please ignore this email and your password will remain unchanged.\n`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset Request</h2>
            <p>You are receiving this because you (or someone else) have requested the reset of the password for your account.</p>
            <p>Please click the button below to complete the process:</p>
            <div style="margin: 25px 0;">
              <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
                Reset Password
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all;">${resetUrl}</p>
            <p><strong>This link will expire in 10 minutes.</strong></p>
            <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      
      res.json({ 
        success: true, 
        message: 'Password reset link sent to email' 
      });
    } catch (err) {
      // If email sending fails, clear the reset token
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      
      console.error('Error sending password reset email:', err);
      return res.status(500).json({
        success: false,
        message: 'There was an error sending the password reset email. Please try again later.'
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error processing password reset request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Reset password with token
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ 
        success: false,
        message: 'Password is required' 
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Hash token to compare with stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user by token and check expiration
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'Password reset token is invalid or has expired' 
      });
    }

    try {
      // Update password (will be hashed by pre-save hook)
      user.password = password;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      user.passwordChangedAt = Date.now() - 1000; // Ensure the token is still valid
      await user.save();

      // Send confirmation email
      const mailOptions = {
        from: `"TestTrust" <${FROM_EMAIL}>`,
        to: user.email,
        subject: 'Password Updated',
        text: `Hello,\n\n` +
          `This is a confirmation that the password for your account ${user.email} has just been changed.\n`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Updated</h2>
            <p>Hello,</p>
            <p>This is a confirmation that the password for your account <strong>${user.email}</strong> has just been changed.</p>
            <p>If you did not make this change, please contact support immediately.</p>
            <p>Best regards,<br>TestTrust Team</p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      
      res.json({ 
        success: true, 
        message: 'Password has been reset successfully' 
      });
    } catch (saveError) {
      console.error('Error saving new password:', saveError);
      return res.status(500).json({
        success: false,
        message: 'Error saving new password. Please try the password reset process again.'
      });
    }
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error resetting password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Add questions route
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

    // Prepare questions for insertion with correctAnswer based on type
    const questionsToSave = questions.map(q => {
      const { answer, ...rest } = q;
      const questionData = {
        ...rest,
        examId: new mongoose.Types.ObjectId(examId),
        number: parseInt(q.number),
        autoCorrect: true // Set autoCorrect based on exam's autoCorrection flag
      };

      // Set correctAnswer based on question type
      if (rest.type === 'mcq') {
        questionData.correctAnswer = answer.correctOption;
      } else if (rest.type === 'trueFalse') {
        questionData.correctAnswer = answer.trueFalseAnswer === 'True';
      } else if (rest.type === 'written') {
        questionData.modelAnswer = answer.modelAnswer;
      }

      return questionData;
    });

    // Debug: Log input data
    console.log('Starting to process questions:', {
      examId,
      questionCount: questions?.length || 0,
      firstQuestion: questions?.[0]
    });

    // Validate questions array
    if (!Array.isArray(questions) || questions.length === 0) {
      console.error('No questions provided or invalid format');
      return res.status(400).json({ message: 'Questions array is required' });
    }

    // Insert questions
    let savedQuestions;
    try {
      console.log('Attempting to save', questionsToSave.length, 'questions');
      savedQuestions = await Question.insertMany(questionsToSave);
      console.log('Successfully saved', savedQuestions.length, 'questions');
    } catch (error) {
      console.error('Error saving questions:', error);
      if (error.writeErrors) {
        console.error('Detailed write errors:', error.writeErrors);
      }
      throw new Error(`Failed to save questions: ${error.message}`);
    }

    // Prepare and insert model answers if autoCorrect is enabled
    const modelAnswersToSave = [];
    
    // Debug: Log database connection state
    console.log('Mongoose connection state:', mongoose.connection.readyState);
    
    // Process each saved question to prepare model answers
    savedQuestions.forEach((savedQ, idx) => {
      const questionData = questions[idx];
      if (!questionData) {
        console.error('Question data missing for index:', idx);
        return;
      }
      
      const shouldSave = questionData.autoCorrect && 
                       questionData.answer !== undefined && 
                       questionData.answer !== null;
      
      console.log('Processing question for model answer:', {
        questionId: savedQ._id,
        questionNumber: questionData.number,
        autoCorrect: questionData.autoCorrect,
        hasAnswer: questionData.answer !== undefined && questionData.answer !== null,
        shouldSave: shouldSave
      });
  
      if (shouldSave) {
        modelAnswersToSave.push({
          questionId: savedQ._id,
          answer: questionData.answer,
          examId: new mongoose.Types.ObjectId(examId)
        });
      }
    });
    
    let savedModelAnswers = [];
    if (modelAnswersToSave.length > 0) {
      console.log('Attempting to save', modelAnswersToSave.length, 'model answers');
      
      try {
        // First, delete any existing model answers for these questions to prevent duplicates
        const questionIds = modelAnswersToSave.map(ma => ma.questionId);
        console.log('Deleting existing model answers for question IDs:', questionIds);
        await ModelAnswer.deleteMany({ questionId: { $in: questionIds } });
        
        // Save new model answers
        savedModelAnswers = await ModelAnswer.insertMany(modelAnswersToSave, { ordered: false });
        console.log('Successfully saved', savedModelAnswers.length, 'model answers');
      } catch (error) {
        console.error('Error saving model answers:', error);
        if (error.writeErrors) {
          console.error('Detailed write errors:', error.writeErrors);
        }
        // Don't fail the entire operation if model answers fail
        console.warn('Continuing without model answers due to error');
      }
    } else {
      console.log('No model answers to save');
    }

    // Update exam with question count
    try {
      await Exam.findByIdAndUpdate(examId, {
        $set: { questionCount: savedQuestions.length }
      });
      console.log('Updated exam with question count:', savedQuestions.length);
    } catch (error) {
      console.error('Error updating exam question count:', error);
      // Non-critical error, continue
    }

    res.status(201).json({
      message: 'Questions and model answers saved successfully',
      questions: savedQuestions,
      modelAnswers: savedModelAnswers
    });
  } catch (err) {
    console.error('Error in /add-questions-and-answers:', {
      error: err.message,
      stack: err.stack,
      requestBody: req.body
    });
    res.status(500).json({
      message: 'Failed to save questions and model answers',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Add new exam
router.post('/AddExam1', auth, async (req, res) => {
  try {
    const examData = req.body;
    
    // Validate required fields
    const requiredFields = ['department', 'year', 'subject', 'studentCount', 
                          'examDate', 'examTime', 'examDuration',
                          'totalMarks', 'questionCount'];
    
    const missingFields = requiredFields.filter(field => !examData[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: 'Missing required fields',
        fields: missingFields
      });
    }

    // Create exam
    const exam = new Exam({
      ...examData,
      status: 'draft',
      createdAt: new Date(),
      createdBy: req.user.email,
      userId: req.user._id
    });

    const savedExam = await exam.save();
    
    // Update user's exam count
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { examCount: 1 }
    });

    res.status(201).json({ 
      message: 'Exam created successfully',
      examId: savedExam._id
    });
  } catch (err) {
    console.error('Error creating exam:', err);
    res.status(500).json({ 
      message: 'Error creating exam',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
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

// Get all exams (for ManageStudents page)
router.get('/exams', async (req, res) => {
  try {
    const { instructor } = req.query;
    
    let query = {};
    if (instructor) {
      query.createdBy = instructor;
    }
    
    const exams = await Exam.find(query)
      .select('subject department year examDate examTime createdBy questionCount')
      .sort({ examDate: -1, examTime: 1 });
    
    res.status(200).json(exams);
  } catch (err) {
    console.error('Error fetching exams:', err);
    res.status(500).json({ message: 'Failed to fetch exams', error: err.message });
  }
});

router.get('/alltoday_exams', async (req, res) => {
  try {
    const now = new Date();
    const localDate = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Cairo' })); 
    const startOfDay = new Date(localDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(localDate.setHours(23, 59, 59, 999));

    const exams = await Exam.find({
      examDate: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      archiveExam: false
    });

    res.status(200).json({ exams });
  } catch (err) {
    console.error("Error fetching today's exams:", err);
    res.status(500).json({ error: 'Failed to fetch today\'s exams' });
  }
});


// Get model answers for multiple questions
router.get('/model-answers/batch', async (req, res) => {
  try {
    const { questionIds } = req.query;
    if (!questionIds || !Array.isArray(questionIds)) {
      return res.status(400).json({ message: 'Question IDs array is required' });
    }

    const modelAnswers = await ModelAnswer.find({
      questionId: { $in: questionIds }
    });

    // Convert to a map for easier lookup
    const modelAnswerMap = modelAnswers.reduce((acc, ma) => {
      acc[ma.questionId] = ma.answer;
      return acc;
    }, {});

    res.status(200).json(modelAnswerMap);
  } catch (err) {
    console.error('Error fetching model answers:', err);
    res.status(500).json({ 
      message: 'Failed to fetch model answers', 
      error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
});

// Get questions for a specific exam
router.get('/exam-questions/:examId', async (req, res) => {
  try {
    const { examId } = req.params;
    
    // Validate examId
    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({ error: 'Invalid exam ID format' });
    }

    // Find questions with their model answers
    const questions = await Question.aggregate([
      { $match: { examId: new mongoose.Types.ObjectId(examId) } },
      { $sort: { number: 1 } },
      {
        $lookup: {
          from: 'questions',
          localField: '_id',
          foreignField: 'questionId',
          as: 'modelAnswer'
        }
      },
      {
        $addFields: {
          modelAnswer: { $arrayElemAt: ['$modelAnswer', 0] }
        }
      }
    ]);

    if (!questions || questions.length === 0) {
      return res.status(404).json({ error: 'No questions found for this exam' });
    }

    // Format the response
    const formattedQuestions = questions.map(q => ({
      _id: q._id,
      examId: q.examId,
      number: q.number,
      type: q.type,
      question: q.question,
      autoCorrect: q.autoCorrect,
      answer: q.answer,
      modelAnswer: q.modelAnswer?.answer,
      marks: q.marks || 1
    }));

    res.json(formattedQuestions);
  } catch (err) {
    console.error('Error fetching questions:', err);
    res.status(500).json({ error: 'Server error while fetching questions' });
  }
});

router.post('/questions', async (req, res) => {
  try {
    const { examId, ...questionData } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({ error: 'Invalid exam ID' });
    }

    // Verify exam exists
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    // Create and save the question
    const question = new Question({
      ...questionData,
      examId: new mongoose.Types.ObjectId(examId),
      number: parseInt(questionData.number) || 1
    });
    
    const savedQuestion = await question.save();
    
    // Update exam's question count
    await Exam.findByIdAndUpdate(examId, {
      $inc: { questionCount: 1 }
    });
    
    res.status(201).json(savedQuestion);
  } catch (err) {
    console.error('Error creating question:', err);
    res.status(500).json({ 
      error: 'Server error while creating question',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Update question
router.put('/questions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid question ID' });
    }

    const question = await Question.findByIdAndUpdate(id, updates, { new: true });
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json(question);
  } catch (err) {
    console.error('Error updating question:', err);
    res.status(500).json({ error: 'Failed to update question' });
  }
});

// Delete question
router.delete('/questions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid question ID' });
    }

    const question = await Question.findByIdAndDelete(id);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Update exam's question count
    await Exam.findByIdAndUpdate(question.examId, {
      $inc: { questionCount: -1 }
    });

    res.json({ message: 'Question deleted successfully' });
  } catch (err) {
    console.error('Error deleting question:', err);
    res.status(500).json({ error: 'Failed to delete question' });
  }
});


// Add this API endpoint to your routes
router.get('/exams/date/:date', async (req, res) => {
  try {
    const date = new Date(req.params.date);
    date.setHours(0, 0, 0, 0);
    
    const exams = await Exam.find({
      examDate: date,
      archiveExam: false
    }).sort({ examTime: 1 });

    res.json(exams);
  } catch (err) {
    console.error('Error fetching exams by date:', err);
    res.status(500).json({ error: 'Failed to fetch exams by date' });
  }
});







router.post('/results/submit', async (req, res) => {
  const { studentNationalId, examId, score } = req.body;
  try {
    const result = await Result.create({ studentNationalId, examId, score });
    res.status(201).json({ message: 'Result submitted successfully' });
  } catch (err) {
    console.error('Error submitting result:', err);
    res.status(500).json({ error: 'Failed to submit result' });
  }
});







module.exports = router;
