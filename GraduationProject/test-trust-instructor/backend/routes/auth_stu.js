const express = require('express');
const router = express.Router();
const Student = require('../models/student');
const Question = require('../models/question');
const mongoose = require('mongoose');


router.post('/register', async (req, res) => {
  try {
    const { fullName, nationalId, section, department, academicYear, idPhoto, fingerprintData } = req.body;

    const existingStudent = await Student.findOne({ nationalId });
    if (existingStudent) {
      return res.status(400).json({ message: 'Student already exists' });
    }

    const newStudent = new Student({
      fullName,
      nationalId,
      section,
      department,
      academicYear,
      idPhoto,
      fingerprintData
    });

    await newStudent.save();
    res.status(201).json({ message: 'Student registered successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/login', async (req, res) => {
  try {
    const { fullName, nationalId } = req.body;
    console.log('Login Attempt:', { fullName, nationalId });

     const student = await Student.findOne({ fullName: { $regex: `^${fullName.trim().replace(/\s+/g, '\\s+')}$`, $options: 'i' }});


    if (!student) {
      return res.status(404).json({ message: "User doesn't exist" });
    }

    if (student.nationalId !== nationalId) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('Student found:', student);
    res.status(200).json({ message: 'Login successful', student });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


router.get('/students/:nationalId', async (req, res) => {
  try {
    const student = await Student.findOne({ nationalId: req.params.nationalId });
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (err) {
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

// route: POST /api/student-answers
router.post('/student-answers', async (req, res) => {
  const { studentNationalId, examId, answers } = req.body;

  try {
    await StudentAnswer.create({ studentNationalId, examId, answers });
    res.status(201).json({ message: 'Answers submitted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Error saving answers' });
  }
});


router.get('/exams-questions/:examId', async (req, res) => {
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
