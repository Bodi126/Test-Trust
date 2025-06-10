import React from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

const ExamControl = () => {
  const handleStartExam = () => {
    socket.emit('start_exam', {
      examId: 'EXAM123',
      title: 'Math Exam'
    });
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
