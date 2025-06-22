const express = require('express');
const router = express.Router();
const Student = require('../models/student');
const Question = require('../models/question');
const StudentAnswer = require('../models/student_answer');
const ModelAnswer = require('../models/modelAnswer');
const Exam = require('../models/exam');
const Result = require('../models/result');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/id_photos/';
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'id-photo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Images only (jpeg, jpg, png, gif)');
    }
  }
}).single('idPhoto');

router.post('/register', (req, res) => {
  upload(req, res, async (err) => {
    try {
      if (err) {
        return res.status(400).json({ message: err });
      }

      const { fullName, email, password, nationalId, section, department, academicYear } = req.body;

      // Validate required fields
      if (!fullName || !email || !password || !nationalId || !section || !department || !academicYear) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      // Check if email already exists
      let student = await Student.findOne({ email });
      if (student) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      // Check if national ID already exists
      student = await Student.findOne({ nationalId });
      if (student) {
        return res.status(400).json({ message: 'National ID already registered' });
      }

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({ message: 'ID photo is required' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create new student with file path
      const newStudent = new Student({
        fullName,
        email,
        password: hashedPassword,
        nationalId,
        section,
        department,
        academicYear,
        idPhoto: req.file.path // Store the file path in the database
      });

      await newStudent.save();
      res.status(201).json({ 
        message: 'Student registered successfully',
        student: {
          _id: newStudent._id,
          fullName: newStudent.fullName,
          email: newStudent.email
        }
      });

    } catch (err) {
      console.error('Registration error:', err);
      // If there was an error, delete the uploaded file
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ message: 'Server error during registration' });
    }
  });
});


// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your_jwt_secret', {
    expiresIn: '30d',
  });
};

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login Attempt:', { email });

    // Find student by email
    const student = await Student.findOne({ email });
    if (!student) {
      console.log('No student found with email:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      console.log('Password mismatch for student:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: student._id },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '30d' }
    );

    console.log('Login successful for:', email);
    res.json({
      _id: student._id,
      fullName: student.fullName,
      email: student.email,
      nationalId: student.nationalId,
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get student by national ID
router.get('/students/national-id/:nationalId', async (req, res) => {
  try {
    const student = await Student.findOne({ nationalId: req.params.nationalId });
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (err) {
    console.error('Error fetching student by national ID:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get student by MongoDB _id
router.get('/students/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid student ID format' });
    }
    
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    
    res.json(student);
  } catch (err) {
    console.error('Error fetching student by ID:', err);
    res.status(500).json({ error: 'Server error' });
  }
});



router.get('/byExam/:examId', async (req, res) => {
  const { examId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(examId)) {
    return res.status(400).json({ message: 'Invalid exam ID format' });
  }

  try {
    const questions = await Question.find({ examId }).sort({ number: 1 }); 
    if (!questions.length) {
      return res.status(404).json({ message: 'No questions found for this exam' });
    }
    res.json(questions);
  } catch (err) {
    console.error('Error fetching questions by exam:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/student-answers/:examId/:studentNationalId', async (req, res) => {
  const { examId, studentNationalId } = req.params;
  try {
    const studentAnswer = await StudentAnswer.findOne({ examId, studentNationalId });
    if (!studentAnswer) return res.status(404).json({ error: 'Answers not found' });
    res.json(studentAnswer);
  } catch (err) {
    console.error('Error fetching student answers:', err);
    res.status(500).json({ error: 'Failed to fetch student answers' });
  }
});

router.post('/student-answers', async (req, res) => {
  console.log('Received student answers request:', {
    body: req.body,
    headers: req.headers
  });

  const { studentNationalId, examId, answers } = req.body;
  
  try {
    // Validate required fields
    if (!studentNationalId) {
      throw new Error('studentNationalId is required');
    }

    if (!examId) {
      throw new Error('examId is required');
    }

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      throw new Error('answers must be a non-empty array');
    }

    // Verify student exists
    const student = await Student.findOne({ nationalId: studentNationalId });
    if (!student) {
      throw new Error('Student not found');
    }

    // Get exam details
    const exam = await Exam.findById(examId);
    if (!exam) {
      throw new Error('Exam not found');
    }

    // Get all questions for this exam
    const questions = await Question.find({ examId });
    if (questions.length === 0) {
      throw new Error('No questions found for this exam');
    }

    // Calculate marks per question (equal distribution of totalMarks)
    const marksPerQuestion = exam.totalMarks / questions.length;
    let totalScore = 0;
    const gradedAnswers = [];

    // Get all model answers for these questions
    console.log('Fetching model answers for questions:', questions.map(q => q._id));
    const modelAnswers = await ModelAnswer.find({
      questionId: { $in: questions.map(q => q._id) }
    }).lean(); // Use lean() for better performance
    
    console.log('Found model answers:', JSON.stringify(modelAnswers, null, 2));

    // Create a map of questionId to model answer
    const modelAnswerMap = new Map();
    modelAnswers.forEach(ma => {
      // Important: Convert both IDs to strings for consistent comparison
      const qid = ma.questionId.toString();
      modelAnswerMap.set(qid, ma.answer);
    });
    
    console.log('Model answer map size:', modelAnswerMap.size);
    console.log('Model answer map entries:');
    modelAnswerMap.forEach((value, key) => {
      console.log(`  ${key}:`, value);
    });

    // Grade each answer
    console.log('Starting answer grading...');
    console.log('Marks per question:', marksPerQuestion);
    
    for (const answer of answers) {
      console.log('\n--- Grading Answer ---');
      console.log('Answer data:', JSON.stringify(answer, null, 2));
      
      // Find the question in the questions array
      const question = questions.find(q => q._id.toString() === answer.questionId.toString());
      if (!question) {
        console.log('❌ Question not found for answer:', answer.questionId);
        continue;
      }

      console.log(`\n--- Grading Question ${question.number} (${question._id}) ---`);
      console.log('Question text:', question.question);
      console.log('Question type:', question.type);
      
      // Get the model answer for this question
      const modelAnswer = await ModelAnswer.findOne({ questionId: question._id });
      console.log('Model answer from DB:', JSON.stringify(modelAnswer, null, 2));
      
      let isCorrect = false;
      let marksAwarded = 0;
      let correctAnswer = '';
      let studentAnswer = answer.answer || '';

      // Handle different question types
      if (question.type === 'mcq' && modelAnswer?.answer) {
        // For MCQ, compare with correctOption from model answer
        correctAnswer = modelAnswer.answer.correctOption || '';
        isCorrect = studentAnswer.toLowerCase() === correctAnswer.toString().toLowerCase();
        console.log(`MCQ Comparison - Student: ${studentAnswer}, Correct: ${correctAnswer}, Match: ${isCorrect}`);
      } 
      else if (question.type === 'trueFalse' && modelAnswer?.answer) {
        // For True/False, compare with trueFalseAnswer from model answer
        correctAnswer = modelAnswer.answer.trueFalseAnswer || '';
        isCorrect = studentAnswer.toString().toLowerCase() === correctAnswer.toString().toLowerCase();
        console.log(`True/False Comparison - Student: ${studentAnswer}, Correct: ${correctAnswer}, Match: ${isCorrect}`);
      }
      else if (question.type === 'written' && modelAnswer?.answer) {
        // For written answers, compare with modelAnswer
        correctAnswer = modelAnswer.answer.modelAnswer || '';
        isCorrect = studentAnswer.toString().trim().toLowerCase() === correctAnswer.toString().trim().toLowerCase();
        console.log(`Written Answer Comparison - Student: ${studentAnswer}, Correct: ${correctAnswer}, Match: ${isCorrect}`);
      } else {
        console.log('⚠️ No valid model answer found for question:', question._id);
      }
      
      marksAwarded = isCorrect ? marksPerQuestion : 0;
      totalScore += marksAwarded;
      
      // Prepare clean answer for result storage
      let displayCorrectAnswer = '';
      if (modelAnswer?.answer) {
        if (question.type === 'mcq') {
          displayCorrectAnswer = modelAnswer.answer.correctOption || '';
        } else if (question.type === 'trueFalse') {
          displayCorrectAnswer = modelAnswer.answer.trueFalseAnswer || '';
        } else if (question.type === 'written') {
          displayCorrectAnswer = modelAnswer.answer.modelAnswer || '';
        }
      }
      
      console.log('Answer comparison:', {
        questionId: question._id,
        questionType: question.type,
        studentAnswer: studentAnswer,
        correctAnswer: displayCorrectAnswer,
        isCorrect,
        marksAwarded,
        maxMarks: marksPerQuestion
      });

      gradedAnswers.push({
        questionId: question._id,
        questionNumber: question.number,
        questionType: question.type,
        studentAnswer: studentAnswer,
        correctAnswer: displayCorrectAnswer,
        isCorrect,
        marksAwarded,
        maxMarks: marksPerQuestion
      });
    }

    // Calculate percentage and final grade if auto-correction is enabled
    let result = null;
    if (exam.autoCorrection) {
      console.log('Calculating results...');
      console.log('Total score:', totalScore);
      console.log('Max score:', exam.totalMarks);
      
      const percentage = (totalScore / exam.totalMarks) * 100;
      console.log('Percentage:', percentage);
      
      // Calculate final grade based on percentage
      let finalGrade = 'F';
      if (percentage >= 90) finalGrade = 'A+';
      else if (percentage >= 85) finalGrade = 'A';
      else if (percentage >= 80) finalGrade = 'B+';
      else if (percentage >= 75) finalGrade = 'B';
      else if (percentage >= 70) finalGrade = 'C+';
      else if (percentage >= 65) finalGrade = 'C';
      else if (percentage >= 60) finalGrade = 'D+';
      else if (percentage >= 50) finalGrade = 'D';

      // Save the result
      result = await Result.create({
        examId,
        studentNationalId,
        totalScore,
        maxScore: exam.totalMarks,
        percentage,
        finalGrade,
        gradedAnswers,
        gradedAt: new Date(),
        isAutoGraded: true
      });
    }

    // Save the student's answers
    const savedAnswers = await StudentAnswer.create({
      examId,
      studentNationalId,
      answers: answers.map(ans => ({
        questionId: ans.questionId,
        answer: ans.answer
      }))
    });

    console.log('Saved student answers:', savedAnswers);
    
    const response = {
      message: 'Answers submitted successfully',
      autoGraded: exam.autoCorrection,
      debug: {
        totalScore,
        maxScore: exam.totalMarks,
        percentage: exam.autoCorrection ? (totalScore / exam.totalMarks * 100).toFixed(2) + '%' : 'N/A',
        answersGraded: gradedAnswers.length,
        totalQuestions: questions.length
      }
    };

    if (exam.autoCorrection && result) {
      response.result = {
        totalScore: result.totalScore,
        maxScore: result.maxScore,
        percentage: result.percentage.toFixed(2) + '%',
        finalGrade: result.finalGrade,
        gradedAnswers: result.gradedAnswers
      };
    }

    res.status(201).json(response);
  } catch (err) {
    console.error('Error in /student-answers:', {
      error: err.message,
      stack: err.stack,
      studentNationalId,
      examId,
      answersCount: answers?.length || 0
    });
    
    res.status(500).json({ 
      error: 'Failed to submit answers',
      message: err.message
    });
  }
});



// Check if questions exist for an exam
// Debug route to check exam and model answers
router.get('/debug/exam/:examId', async (req, res) => {
  try {
    const { examId } = req.params;
    
    // Get exam details
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }
    
    // Get all questions for this exam
    const questions = await Question.find({ examId });
    
    // Get all model answers
    const modelAnswers = await ModelAnswer.find({
      questionId: { $in: questions.map(q => q._id) }
    });
    
    // Format the response
    const response = {
      exam: {
        _id: exam._id,
        subject: exam.subject,
        totalMarks: exam.totalMarks,
        autoCorrection: exam.autoCorrection,
        questionCount: questions.length
      },
      questions: questions.map(q => ({
        _id: q._id,
        number: q.number,
        type: q.type,
        question: q.question,
        hasModelAnswer: modelAnswers.some(ma => ma.questionId.equals(q._id))
      })),
      modelAnswers: modelAnswers.map(ma => ({
        questionId: ma.questionId,
        answer: ma.answer,
        answerType: typeof ma.answer
      }))
    };
    
    res.json(response);
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: 'Debug error', details: error.message });
  }
});

router.get('/check-questions/:examId', async (req, res) => {
  // Check if mongoose is connected
  if (mongoose.connection.readyState !== 1) {
    console.error('MongoDB not connected. State:', mongoose.connection.readyState);
    return res.status(500).json({ 
      success: false, 
      error: 'Database not connected',
      dbState: mongoose.STATES[mongoose.connection.readyState]
    });
  }
  
  // Verify Question model exists
  if (!mongoose.models.Question) {
    console.error('Question model not found in mongoose. Models:', Object.keys(mongoose.models));
    return res.status(500).json({ 
      success: false, 
      error: 'Question model not found',
      availableModels: Object.keys(mongoose.models)
    });
  }
  try {
    console.log('Check questions request received');
    console.log('Method:', req.method);
    console.log('URL:', req.originalUrl);
    console.log('Params:', req.params);
    console.log('Query:', req.query);
    console.log('Headers:', req.headers);
    console.log('Mongoose models:', Object.keys(mongoose.models));
    console.log('Mongoose connection state:', mongoose.STATES[mongoose.connection.readyState]);

    const { examId } = req.params;
    console.log('Exam ID from params:', examId);
    
    if (!mongoose.Types.ObjectId.isValid(examId)) {
      console.error('Invalid exam ID format:', examId);
      return res.status(400).json({ error: 'Invalid exam ID format' });
    }
    
    console.log('Querying questions for exam:', examId);
    const count = await Question.countDocuments({ examId: new mongoose.Types.ObjectId(examId) });
    
    console.log('Found questions count:', count);
    res.json({ 
      success: true,
      hasQuestions: count > 0, 
      count,
      examId,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error checking questions:', {
      message: err.message,
      stack: err.stack,
      name: err.name,
      ...(err.code && { code: err.code }),
      ...(err.keyPattern && { keyPattern: err.keyPattern }),
      ...(err.keyValue && { keyValue: err.keyValue })
    });
    res.status(500).json({ 
      success: false,
      error: 'Error checking questions',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Get questions for an exam
router.get('/exams-questions/:examId', async (req, res) => {
  try {
    const { examId } = req.params;
    
    // Validate examId
    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({ error: 'Invalid exam ID format' });
    }

    // Find questions for the exam
    const questions = await Question.find({ examId: new mongoose.Types.ObjectId(examId) })
      .sort({ number: 1 });

    if (!questions || questions.length === 0) {
      return res.status(404).json({ error: 'No questions found for this exam' });
    }

    // Format the response
    const formattedQuestions = questions.map(q => ({
      _id: q._id,
      examId: q.examId,
      number: q.number,
      examDuration: q.examDuration,
      type: q.type,
      question: q.question,
      choices: q.choices || [],
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



module.exports = router;
