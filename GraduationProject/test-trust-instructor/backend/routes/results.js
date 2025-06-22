const express = require('express');
const router = express.Router();
const Result = require('../models/result');
const Exam = require('../models/exam');
const Question = require('../models/question');

// Get all results for an exam
router.get('/exam/:examId', async (req, res) => {
  try {
    const { examId } = req.params;
    
    const results = await Result.find({ examId })
      .sort({ percentage: -1 })
      .populate('examId', 'subject department year')
      .populate('gradedAnswers.questionId', 'question type marks');

    res.json({
      results,
      totalStudents: results.length,
      averageScore: results.reduce((sum, r) => sum + r.percentage, 0) / results.length || 0,
      highestScore: results[0]?.percentage || 0,
      lowestScore: results[results.length - 1]?.percentage || 0
    });
  } catch (err) {
    console.error('Error fetching exam results:', err);
    res.status(500).json({ error: 'Failed to fetch exam results' });
  }
});

// Get detailed analysis for an exam
router.get('/analysis/:examId', async (req, res) => {
  try {
    const { examId } = req.params;
    
    // Get exam details
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    // Get all results
    const results = await Result.find({ examId });
    
    // Get all questions
    const questions = await Question.find({ examId });

    // Calculate statistics
    const gradeDistribution = results.reduce((acc, result) => {
      const grade = calculateGrade(result.percentage);
      acc[grade] = (acc[grade] || 0) + 1;
      return acc;
    }, {});

    // Calculate question performance
    const questionAnalysis = questions.map(q => {
      const totalAttempts = results.filter(r => 
        r.gradedAnswers.some(ga => ga.questionId.equals(q._id))
      ).length;

      const correctAttempts = results.filter(r => 
        r.gradedAnswers.some(ga => 
          ga.questionId.equals(q._id) && ga.isCorrect === true
        )
      ).length;

      return {
        questionId: q._id,
        question: q.question,
        type: q.type,
        marks: q.marks,
        correctPercentage: totalAttempts > 0 ? (correctAttempts / totalAttempts * 100) : 0,
        commonWrongAnswer: getCommonWrongAnswer(results, q._id)
      };
    });

    res.json({
      exam,
      gradeDistribution,
      questionAnalysis,
      totalStudents: results.length
    });
  } catch (err) {
    console.error('Error fetching exam analysis:', err);
    res.status(500).json({ error: 'Failed to fetch exam analysis' });
  }
});

// Helper function to calculate grade
function calculateGrade(percentage) {
  if (percentage >= 90) return 'A+';
  if (percentage >= 85) return 'A';
  if (percentage >= 80) return 'B+';
  if (percentage >= 75) return 'B';
  if (percentage >= 70) return 'C+';
  if (percentage >= 65) return 'C';
  if (percentage >= 60) return 'D+';
  if (percentage >= 55) return 'D';
  return 'F';
}

// Helper function to get common wrong answer
function getCommonWrongAnswer(results, questionId) {
  const wrongAnswers = results
    .flatMap(r => r.gradedAnswers)
    .filter(ga => ga.questionId.equals(questionId) && !ga.isCorrect)
    .map(ga => ga.studentAnswer);

  if (wrongAnswers.length === 0) return null;

  const counts = wrongAnswers.reduce((acc, answer) => {
    acc[answer] = (acc[answer] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .reduce((a, b) => a[1] > b[1] ? a : b)[0];
}

// Get results for a specific student
router.get('/student/:studentId/:examId', async (req, res) => {
  try {
    const { studentId, examId } = req.params;
    const result = await Result.findOne({
      studentNationalId: studentId,
      examId: examId
    })
    .populate('examId', 'subject department year')
    .populate('gradedAnswers.questionId', 'question type marks');

    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }

    res.json(result);
  } catch (err) {
    console.error('Error fetching student result:', err);
    res.status(500).json({ error: 'Failed to fetch student result' });
  }
});

module.exports = router;
