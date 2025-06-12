const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Exam = require('../models/exam');
const Question = require('../models/question');
const User = require('../models/user');

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
        console.log('Starting exam deletion for ID:', req.params.id);
        const { id } = req.params;
        
        // First verify the exam exists and get the creator's ID
        console.log('Looking up exam with ID:', id);
        const exam = await Exam.findById(id);
        if (!exam) {
            console.log('Exam not found with ID:', id);
            return res.status(404).json({ message: 'Exam not found' });
        }

        console.log('Found exam. Created by user ID:', exam.createdBy);
        
        // Delete the exam
        console.log('Deleting exam...');
        await Exam.findByIdAndDelete(id);
        
        // Delete related questions if they exist
        console.log('Deleting related questions...');
        await Question.deleteMany({ examId: id });
        
        // Decrement the user's exam count
        if (exam.createdBy) {
            console.log('Attempting to decrement exam count for user with email:', exam.createdBy);
            const updatedUser = await User.findOneAndUpdate(
                { email: exam.createdBy },
                { $inc: { examCount: -1 } },
                { new: true }
            );
            
            if (!updatedUser) {
                console.error('User not found with email:', exam.createdBy);
            } else {
                console.log('Successfully updated user exam count. New count:', updatedUser.examCount);
            }
        } else {
            console.log('No createdBy field found on exam. Cannot update user exam count.');
        }
        
        console.log('Exam deletion completed successfully');
        res.json({ 
            message: 'Exam deleted successfully',
            examId: id
        });
    } catch (error) {
        console.error('Error deleting exam:', error);
        res.status(500).json({ 
            message: 'Error deleting exam', 
            error: error.message 
        });
    }
});

module.exports = router;
