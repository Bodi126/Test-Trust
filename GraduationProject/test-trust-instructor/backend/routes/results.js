const express = require('express');
const router = express.Router();
const Result = require('../models/result');
const Exam = require('../models/exam');
const Question = require('../models/question');
const Student = require('../models/student');

// Get all results with student information for dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const { year, department, subject, instructor } = req.query;
    
    // Build filter conditions
    let examFilter = {};
    if (year && year !== 'All') examFilter.year = year;
    if (department && department !== 'All') examFilter.department = department;
    if (subject && subject !== 'All') examFilter.subject = subject;
    if (instructor) examFilter.createdBy = instructor; // Filter by instructor

    // Get exams that match the filter
    const exams = await Exam.find(examFilter).select('_id subject department year');
    const examIds = exams.map(exam => exam._id);

    // Get all results for these exams with student information
    const results = await Result.find({ exam: { $in: examIds } })
      .populate('exam', 'subject department year')
      .sort({ createdAt: -1 });

    // Get student information for all results
    const studentIds = [...new Set(results.map(r => r.student))];
    const students = await Student.find({ nationalId: { $in: studentIds } })
      .select('fullName nationalId department academicYear');

    // Create a map for quick student lookup
    const studentMap = students.reduce((acc, student) => {
      acc[student.nationalId] = student;
      return acc;
    }, {});

    // Combine results with student information
    const enrichedResults = results.map(result => {
      const student = studentMap[result.student];
      return {
        id: result._id,
        name: student ? student.fullName : 'Unknown Student',
        avatar: student ? student.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'UN',
        year: result.exam?.year || 'N/A',
        department: result.exam?.department || student?.department || 'N/A',
        subject: result.exam?.subject || 'N/A',
        score: Math.round(result.percentage),
        grade: result.finalGrade,
        status: result.percentage >= 60 ? 'Passed' : 'Failed',
        totalScore: result.totalScore,
        maxScore: result.maxScore,
        percentage: result.percentage,
        gradedAt: result.gradedAt,
        isAutoGraded: result.isAutoGraded
      };
    });

    // Calculate summary statistics
    const totalResults = enrichedResults.length;
    const passedResults = enrichedResults.filter(r => r.status === 'Passed').length;
    const averageScore = totalResults > 0 ? 
      Math.round(enrichedResults.reduce((sum, r) => sum + r.score, 0) / totalResults) : 0;

    // Calculate grade distribution
    const gradeDistribution = enrichedResults.reduce((acc, result) => {
      const grade = result.grade;
      acc[grade] = (acc[grade] || 0) + 1;
      return acc;
    }, {});

    // Get unique values for filters
    const years = [...new Set(enrichedResults.map(r => r.year))].filter(y => y !== 'N/A');
    const departments = [...new Set(enrichedResults.map(r => r.department))].filter(d => d !== 'N/A');
    const subjects = [...new Set(enrichedResults.map(r => r.subject))].filter(s => s !== 'N/A');

    res.json({
      results: enrichedResults,
      summary: {
        totalResults,
        passedResults,
        failedResults: totalResults - passedResults,
        passRate: totalResults > 0 ? Math.round((passedResults / totalResults) * 100) : 0,
        averageScore,
        gradeDistribution
      },
      filters: {
        years: ['All', ...years],
        departments: ['All', ...departments],
        subjects: ['All', ...subjects]
      }
    });
  } catch (err) {
    console.error('Error fetching dashboard results:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard results' });
  }
});

// Get all results for an exam
router.get('/exam/:examId', async (req, res) => {
  try {
    const { examId } = req.params;
    
    const results = await Result.find({ exam: examId })
      .sort({ percentage: -1 })
      .populate('exam', 'subject department year')
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
    const results = await Result.find({ exam: examId });
    
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
      student: studentId,
      exam: examId
    })
    .populate('exam', 'subject department year')
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

// Get results for a specific instructor
router.get('/instructor/:instructorEmail', async (req, res) => {
  try {
    const { instructorEmail } = req.params;
    const { year, department, subject } = req.query;
    
    console.log('=== INSTRUCTOR RESULTS REQUEST ===');
    console.log('Instructor Email:', instructorEmail);
    console.log('Filters:', { year, department, subject });
    
    // Build filter conditions
    let examFilter = { createdBy: instructorEmail };
    if (year && year !== 'All') examFilter.year = year;
    if (department && department !== 'All') examFilter.department = department;
    if (subject && subject !== 'All') examFilter.subject = subject;

    console.log('Exam filter:', examFilter);

    // Get exams created by this instructor
    const exams = await Exam.find(examFilter).select('_id subject department year');
    console.log('Found exams:', exams.length);
    console.log('Exam details:', exams.map(e => ({ id: e._id, subject: e.subject, department: e.department, year: e.year })));
    
    const examIds = exams.map(exam => exam._id);

    if (examIds.length === 0) {
      console.log('No exams found for instructor');
      return res.json({
        results: [],
        summary: {
          totalResults: 0,
          passedResults: 0,
          failedResults: 0,
          passRate: 0,
          averageScore: 0,
          gradeDistribution: {}
        },
        filters: {
          years: ['All'],
          departments: ['All'],
          subjects: ['All']
        }
      });
    }

    // Get all results for these exams
    const results = await Result.find({ exam: { $in: examIds } })
      .populate('exam', 'subject department year')
      .sort({ createdAt: -1 });

    console.log('Found results:', results.length);
    console.log('Result details:', results.map(r => ({ 
      id: r._id, 
      exam: r.exam?._id, 
      subject: r.exam?.subject, 
      student: r.student,
      percentage: r.percentage,
      createdAt: r.createdAt 
    })));

    // Get student information
    const studentIds = [...new Set(results.map(r => r.student))];
    const students = await Student.find({ nationalId: { $in: studentIds } })
      .select('fullName nationalId department academicYear');

    const studentMap = students.reduce((acc, student) => {
      acc[student.nationalId] = student;
      return acc;
    }, {});

    // Enrich results with student information
    const enrichedResults = results.map(result => {
      const student = studentMap[result.student];
      return {
        id: result._id,
        name: student ? student.fullName : 'Unknown Student',
        avatar: student ? student.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'UN',
        year: result.exam?.year || 'N/A',
        department: result.exam?.department || student?.department || 'N/A',
        subject: result.exam?.subject || 'N/A',
        score: Math.round(result.percentage),
        grade: result.finalGrade,
        status: result.percentage >= 60 ? 'Passed' : 'Failed',
        totalScore: result.totalScore,
        maxScore: result.maxScore,
        percentage: result.percentage,
        gradedAt: result.gradedAt,
        isAutoGraded: result.isAutoGraded
      };
    });

    console.log('Enriched results count:', enrichedResults.length);
    console.log('Enriched results:', enrichedResults.map(r => ({ 
      name: r.name, 
      subject: r.subject, 
      year: r.year, 
      score: r.score,
      grade: r.grade 
    })));

    // Calculate statistics
    const totalResults = enrichedResults.length;
    const passedResults = enrichedResults.filter(r => r.status === 'Passed').length;
    const averageScore = totalResults > 0 ? 
      Math.round(enrichedResults.reduce((sum, r) => sum + r.score, 0) / totalResults) : 0;

    const gradeDistribution = enrichedResults.reduce((acc, result) => {
      const grade = result.grade;
      acc[grade] = (acc[grade] || 0) + 1;
      return acc;
    }, {});

    // Get filter options
    const years = [...new Set(enrichedResults.map(r => r.year))].filter(y => y !== 'N/A');
    const departments = [...new Set(enrichedResults.map(r => r.department))].filter(d => d !== 'N/A');
    const subjects = [...new Set(enrichedResults.map(r => r.subject))].filter(s => s !== 'N/A');

    console.log('Final response:', {
      totalResults,
      passedResults,
      averageScore,
      years,
      departments,
      subjects
    });

    res.json({
      results: enrichedResults,
      summary: {
        totalResults,
        passedResults,
        failedResults: totalResults - passedResults,
        passRate: totalResults > 0 ? Math.round((passedResults / totalResults) * 100) : 0,
        averageScore,
        gradeDistribution
      },
      filters: {
        years: ['All', ...years],
        departments: ['All', ...departments],
        subjects: ['All', ...subjects]
      }
    });
  } catch (err) {
    console.error('Error fetching instructor results:', err);
    res.status(500).json({ error: 'Failed to fetch instructor results' });
  }
});

// DEBUG: List all results for a given student
router.get('/debug/all-results/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const results = await Result.find({ student: studentId })
      .populate('exam', 'subject department year');
    res.json({
      count: results.length,
      results: results.map(r => ({
        resultId: r._id,
        examId: r.exam?._id,
        subject: r.exam?.subject,
        year: r.exam?.year,
        department: r.exam?.department,
        score: r.percentage,
        createdAt: r.createdAt
      }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch results', details: err.message });
  }
});

module.exports = router;
