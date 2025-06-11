const express = require('express');
const router = express.Router();
const Exam = require('../models/exam');
const Question = require('../models/question');

// Combined dashboard endpoint
router.get('/dashboard', async (req, res) => {
    try {
        const now = new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get all data in parallel
        const [
            upcomingCount, 
            ongoingCount, 
            completedCount,
            upcomingExams,
            totalExams,
            todaysExams
        ] = await Promise.all([
            // Status counts
            Exam.countDocuments({ examDate: { $gt: now } }),
            Exam.countDocuments({ 
                examDate: { $lte: now },
                endDate: { $gte: now }
            }),
            Exam.countDocuments({ endDate: { $lt: now } }),
            
            // Upcoming exams
            Exam.find({ examDate: { $gt: now } })
                .sort({ examDate: 1 })
                .limit(5),
                
            // Total exams
            Exam.countDocuments({}),
            
            // Today's exams
            Exam.find({
                examDate: {
                    $gte: today,
                    $lt: tomorrow
                }
            }).sort({ examTime: 1 })
        ]);

        // Get unique students count (placeholder - adjust based on your schema)
        const activeStudents = await Exam.distinct('students');

        res.json({
            status: [
                { status: 'Upcoming', count: upcomingCount },
                { status: 'Ongoing', count: ongoingCount },
                { status: 'Completed', count: completedCount }
            ],
            upcomingExams,
            stats: {
                totalExams,
                activeStudents: activeStudents.length
            },
            todaysEvents: todaysExams.map(exam => ({
                time: exam.examTime,
                name: `${exam.subject} Exam`,
                details: `${exam.department} - Year ${exam.year}`
            }))
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single exam by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const exam = await Exam.findById(id);
        
        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }
        
        res.json(exam);
    } catch (error) {
        console.error('Error fetching exam:', error);
        res.status(500).json({ message: 'Error fetching exam', error: error.message });
    }
});

// Delete an exam
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // First verify the exam exists
        const exam = await Exam.findById(id);
        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        // Delete the exam
        await Exam.findByIdAndDelete(id);
        
        // Delete related questions if they exist
        await Question.deleteMany({ examId: id });
        
        res.json({ message: 'Exam deleted successfully' });
    } catch (error) {
        console.error('Error deleting exam:', error);
        res.status(500).json({ message: 'Error deleting exam', error: error.message });
    }
});

module.exports = router;
