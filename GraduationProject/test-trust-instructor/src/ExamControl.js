import React from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

const socket = io('http://localhost:5000');

const ExamControl = () => {
  const handleStartExam = async () => {
    try {
      // Get the active exam ID from localStorage or state
      const examId = localStorage.getItem('activeExamId');
      
      if (!examId) {
        alert('No exam selected');
        return;
      }
      
      // Fetch the complete exam data
      const response = await axios.get(`http://localhost:5000/api/auth/exams/${examId}`);
      const examData = response.data;
      
      // Emit the complete exam data
      socket.emit('start_exam', examData);
    } catch (error) {
      console.error('Error starting exam:', error);
      alert('Failed to start exam. Please try again.');
    }
  };

  const handleEndExam = () => {
    socket.emit('end_exam_for_student', 'studentId123');
  };

  return (
    <div>
      <button onClick={handleStartExam}>Start Exam</button>
      <button onClick={handleEndExam}>End Exam for Student</button>
    </div>
  );
};

export default ExamControl;
