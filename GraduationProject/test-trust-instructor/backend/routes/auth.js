// routes/auth.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/user');
const ModelAnswer = require('../models/modelAnswer');
const Exam = require('../models/exam');
const Question = require('../models/question');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

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

    // Trim and normalize email for case-insensitive search
    const normalizedEmail = email.trim().toLowerCase();
    
    // Find user with case-insensitive email search
    const user = await User.findOne({ email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') } });
    
    if (!user) {
      console.log(`[LOGIN] Failed: User not found for email: ${email}`);
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    
    // Trim and compare passwords
    const trimmedPassword = password.trim();
    const storedPassword = user.password || '';
    
    // Debug logs to help with troubleshooting
    console.log(`[AUTH] Password comparison for: ${email}`);
    console.log(`[AUTH] Stored password length: ${storedPassword.length}, Input password length: ${trimmedPassword.length}`);
    
    if (storedPassword !== trimmedPassword) {
      console.log(`[AUTH] Failed: Password mismatch for email: ${email}`);
      return res.status(401).json({ 
        message: 'Invalid email or password.',
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
    
    // Send login notification (fire and forget)
    sendLoginNotification(user.email)
      .then(sent => {
        if (!sent) console.error(`[LOGIN] Failed to send notification to ${user.email}`);
      })
      .catch(err => console.error('[LOGIN] Notification error:', err));
    
    // Return the full user object with token for non-2FA login
    const userResponse = {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      position: user.position,
      idNumber: user.idNumber,
      twoFactorEnabled: user.twoFactorEnabled
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

// 2FA: Send verification code
router.post('/send-2fa-code', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find user by email (case-insensitive)
    const user = await User.findOne({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') } 
    });

    if (!user) {
      // Don't reveal if user exists for security
      return res.json({ message: 'If your email exists, you will receive a verification code' });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000);
    const expiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes

    // Save code and expiry to user
    user.twoFactorCode = code;
    user.twoFactorExpires = expiresAt;
    await user.save();

    // Send email with code
    try {
      const mailOptions = {
        from: `"TestTrust" <${FROM_EMAIL}>`,
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
      console.error('Error sending 2FA email:', emailError);
      return res.status(500).json({ message: 'Failed to send verification code' });
    }

    res.json({ 
      message: 'Verification code sent to your email',
      // For testing only - remove in production
      testCode: process.env.NODE_ENV === 'development' ? code : undefined
    });
  } catch (error) {
    console.error('2FA send code error:', error);
    res.status(500).json({ message: 'Failed to process 2FA request' });
  }
});

// 2FA: Verify code
router.post('/verify-2fa', async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ 
        valid: false, 
        message: 'Email and verification code are required' 
      });
    }

    // Find user by email (case-insensitive) and code
    console.log('Verifying 2FA code:', { email, code, type: typeof code });
    
    const user = await User.findOne({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') },
      $or: [
        { twoFactorCode: code },
        { twoFactorCode: parseInt(code, 10) }
      ],
      twoFactorExpires: { $gt: new Date() }
    }).select('+twoFactorCode +twoFactorExpires');
    
    console.log('User found for 2FA:', user ? 'Yes' : 'No');

    if (!user) {
      console.log('No user found with matching code or code expired');
      return res.status(401).json({ 
        success: false,
        valid: false, 
        message: 'Invalid or expired verification code' 
      });
    }

    // Clear the used code
    user.twoFactorCode = undefined;
    user.twoFactorExpires = undefined;
    user.lastLogin = new Date();
    await user.save();

    // Generate auth token with 2FA claim
    const token = user.generateAuthToken();
    
    // Send login notification (fire and forget)
    sendLoginNotification(user.email)
      .then(sent => {
        if (!sent) console.error(`[2FA] Failed to send notification to ${user.email}`);
      })
      .catch(err => console.error('[2FA] Notification error:', err));
    
    // Set HTTP-only cookie with the token
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      sameSite: 'strict',
      path: '/'
    });
    
    // Return complete user data (excluding sensitive fields)
    const userResponse = {
      _id: user._id,
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      position: user.position || '',
      idNumber: user.idNumber || '',
      twoFactorEnabled: user.twoFactorEnabled || false,
      lastLogin: user.lastLogin,
      role: user.role || 'instructor'
    };

    console.log(`User ${user.email} successfully completed 2FA verification`);

    res.status(200).json({
      success: true,
      valid: true,
      message: 'Verification successful',
      token: token,
      user: userResponse
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({ 
      valid: false, 
      message: 'Failed to verify code' 
    });
  }
});

// Toggle 2FA for user
router.post('/toggle-2fa', async (req, res) => {
  try {
    const { email, enabled } = req.body;
    
    if (email === undefined || enabled === undefined) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and enabled status are required' 
      });
    }

    // Find user by email (case-insensitive)
    const user = await User.findOne({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') } 
    });

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Update 2FA status
    user.twoFactorEnabled = enabled;
    
    // If disabling 2FA, clear any existing codes
    if (!enabled) {
      user.twoFactorCode = undefined;
      user.twoFactorExpires = undefined;
    }
    
    await user.save();

    // Return updated user data (without sensitive info)
    const userResponse = {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      position: user.position,
      idNumber: user.idNumber,
      twoFactorEnabled: user.twoFactorEnabled
    };

    res.json({ 
      success: true,
      message: `Two-factor authentication ${enabled ? 'enabled' : 'disabled'} successfully`,
      user: userResponse
    });
  } catch (error) {
    console.error('Toggle 2FA error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update two-factor authentication',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Generate random OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send login notification email
async function sendLoginNotification(email) {
  try {
    console.log(`[LOGIN NOTIFICATION] Preparing notification for: ${email}`);
    
    if (!email) {
      console.error('[LOGIN NOTIFICATION] No email provided');
      return false;
    }
    
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const formattedTime = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });

    const mailOptions = {
      from: `"TestTrust Security" <${process.env.FROM_EMAIL || FROM_EMAIL}>`,
      to: email,
      subject: 'New Login Detected on Your Account',
      text: `
        New Login Alert
        ---------------
        
        A successful login was detected on your TestTrust account.
        
        Date: ${formattedDate}
        Time: ${formattedTime}
        
        If this was you, you can safely ignore this email.
        If you did not perform this login, please secure your account immediately.
        
        Best regards,
        TestTrust Security Team
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 10px;">
            New Login Detected
          </h2>
          
          <p>Hello,</p>
          
          <p>A successful login was detected on your TestTrust account.</p>
          
          <div style="background: #f8f9fa; border-left: 4px solid #3498db; padding: 15px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${formattedTime}</p>
          </div>
          
          <p>If this was you, you can safely ignore this email.</p>
          
          <p style="color: #e74c3c; font-weight: bold;">
            If you did not perform this login, please secure your account immediately by changing your password.
          </p>
          
          <p>Best regards,<br>
          <strong>TestTrust Security Team</strong></p>
          
          <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; color: #7f8c8d; font-size: 12px;">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      `
    };

    console.log(`[LOGIN NOTIFICATION] Sending to: ${email}`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`[LOGIN NOTIFICATION] Sent to ${email} (${info.messageId})`);
    return true;
  } catch (error) {
    console.error('[LOGIN NOTIFICATION] Error:', error.message);
    return false;
  }
}

// Send OTP email using Nodemailer
const sendOTPEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: `"TestTrust" <${FROM_EMAIL}>`,
      to: email,
      subject: 'Your Password Reset OTP',
      text: `Your OTP for password reset is: ${otp}\n\nThis OTP is valid for 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>You requested to reset your password. Here is your verification code:</p>
          <div style="background: #f4f4f4; padding: 20px; margin: 20px 0; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px;">
            ${otp}
          </div>
          <p>This OTP is valid for 10 minutes. If you didn't request this, please ignore this email.</p>
          <p>Best regards,<br>TestTrust Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent to:', email);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error.message);
    return false;
  }
}

// Forgot password - Send OTP
router.post('/forgot-password', async (req, res) => {
  console.log('Forgot password request received:', req.body);
  
  try {
    const { email } = req.body;
    
    if (!email) {
      console.log('No email provided in request');
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
      console.log('No user found with email:', email);
      // For security, don't reveal if email exists or not
      return res.json({ 
        success: true, // Still return success to prevent email enumeration
        message: 'If your email exists in our system, you will receive an OTP' 
      });
    }

    console.log('User found, generating OTP for:', user.email);

    // Generate OTP and set expiry (10 minutes from now)
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP and expiry to user
    user.resetPasswordOtp = otp;
    user.resetOtpExpires = otpExpiry;
    await user.save();
    
    console.log('OTP generated and saved for user:', user.email);

    try {
      // Log OTP to console for testing
      console.log('\n======================================');
      console.log('TESTING - OTP for', user.email, ':', otp);
      console.log('This OTP is valid for 10 minutes');
      console.log('======================================\n');
      
      // Try to send email, but don't fail if it doesn't work
      try {
        console.log('Attempting to send OTP email to:', user.email);
        const emailSent = await sendOTPEmail(user.email, otp);
        if (emailSent) {
          console.log('OTP email sent successfully to:', user.email);
        }
      } catch (emailError) {
        console.error('Email sending failed (but continuing anyway):', emailError.message);
        // Continue even if email sending fails
      }

      res.json({ 
        success: true,
        message: 'Please check your email for the OTP (also check console for testing)',
        otp: otp // Send OTP in response for testing (remove in production)
      });
    } catch (error) {
      console.error('Error in OTP process:', error);
      throw error; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    console.error('Forgot password error:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to process forgot password request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Verify OTP
router.post('/verify-reset-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    // Find user by email (case-insensitive)
    const user = await User.findOne({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') },
      resetPasswordOtp: otp,
      resetOtpExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Generate a reset token (valid for 1 hour)
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    user.resetPasswordOtp = undefined;
    user.resetOtpExpires = undefined;
    await user.save();

    res.json({ 
      message: 'OTP verified successfully',
      token: resetToken
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Failed to verify OTP' });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    
    if (!email || !token || !newPassword) {
      return res.status(400).json({ message: 'Email, token, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Find user by email and valid token
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${email}$`, 'i') },
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Update password and clear reset token
    user.password = newPassword.trim();
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
});


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

router.get('/alltoday_exams', async (req, res) => {
try {

  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  const exams = await Exam.find({
    examDate: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  });

  res.status(200).json({ exams });
} catch (err) {
  console.error('Error fetching today\'s exams:', err);
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


module.exports = router;