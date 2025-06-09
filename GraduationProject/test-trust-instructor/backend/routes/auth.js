// routes/auth.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/user');
const ModelAnswer = require('../models/modelAnswer');
const Exam = require('../models/exam');
const Question = require('../models/question');


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
    if (user.password !== trimmedPassword) {
      console.log(`[LOGIN] Failed: Password mismatch for email: ${email}`);
      console.log(`[DEBUG] Expected: ${user.password}, Got: ${trimmedPassword}`);
      return res.status(401).json({ message: 'Invalid email or password.' });
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
    
    // Debug: Log database connection state
    console.log('Mongoose connection state:', mongoose.connection.readyState);
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    
    // Process each saved question to prepare model answers
    savedQuestions.forEach((savedQ, idx) => {
      const questionData = questions[idx];
      const shouldSave = questionData.autoCorrect && 
                       questionData.answer !== undefined && 
                       questionData.answer !== null;
      
      console.log('Processing question for model answer:', {
        questionId: savedQ._id,
        autoCorrect: questionData.autoCorrect,
        hasAnswer: questionData.answer !== undefined && questionData.answer !== null,
        shouldSave: shouldSave
      });
      
      if (shouldSave) {
        modelAnswersToSave.push({
          questionId: savedQ._id,
          answer: questionData.answer
        });
      }
    });
    
    let savedModelAnswers = [];
    if (modelAnswersToSave.length > 0) {
      console.log('Attempting to save model answers:', JSON.stringify(modelAnswersToSave, null, 2));
      
      try {
        // First, delete any existing model answers for these questions to prevent duplicates
        const questionIds = modelAnswersToSave.map(ma => ma.questionId);
        await ModelAnswer.deleteMany({ questionId: { $in: questionIds } });
        
        // Save new model answers
        savedModelAnswers = await ModelAnswer.insertMany(modelAnswersToSave, { ordered: false });
        console.log('Successfully saved model answers:', savedModelAnswers);
      } catch (error) {
        console.error('Error saving model answers:', error);
        if (error.writeErrors) {
          console.error('Detailed write errors:', error.writeErrors);
        }
        throw error; // Re-throw to be caught by the outer try-catch
      }
    } else {
      console.log('No model answers to save');
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
    res.status(500).json({ message: 'Failed to fetch model answers', error: err.message });
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
    const examExists = await Exam.findById(examId);
    if (!examExists) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    // Create and save question
    const question = new Question({
      ...questionData,
      examId,
      number: parseInt(questionData.number) || 1
    });

    await question.save();

    // Update exam's question count
    await Exam.findByIdAndUpdate(examId, {
      $inc: { questionCount: 1 }
    });

    res.status(201).json(question);
  } catch (err) {
    console.error('Error creating question:', err);
    res.status(500).json({ error: 'Failed to create question' });
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