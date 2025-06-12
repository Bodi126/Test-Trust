import React, { useState, useEffect } from 'react';
import socket from './socket';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';



const UpcomingExams = () => {
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();


  useEffect(() => {
    const studentId = localStorage.getItem('studentId');
    if (studentId) {
      socket.emit('student_join', studentId);
      console.log('✅ Sent student ID to server:', studentId);
    } else {
      console.warn('⚠️ No studentId found in localStorage');
    }


    
    const fetchExam = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/auth/alltoday_exams');
        console.log("📦 Received exam data:", response.data);

        const exams = response.data.exams || response.data;

        if (Array.isArray(exams) && exams.length > 0) {
          setExam(exams[0]); 
        } else {
          setExam(null); 
        }
      } catch (error) {
        console.error('❌ Failed to load the exam:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExam();

    socket.on('start_exam', (examData) => {
    console.log('✅ Student received start_exam:', examData);
    navigate('/PracticeTests'); 
  });

    return () => {
      socket.off('start_exam');
    };

 
  }, []);

  if (loading) return <p>⏳ Loading...</p>;


  

  return (
    <div className="upcoming-exam">
      {exam ? (
        <>
          <h2>📝 Ongoing Exam</h2>
          <p><strong>Subject:</strong> {exam.subject}</p>
          <p><strong>Number of questions:</strong> {exam.questionCount}</p>
          <p><strong>Waiting to start...</strong></p>
        </>
      ) : (
        <h2>🚫 There are no exams for today</h2>
      )}
    </div>
  );
};

export default UpcomingExams;
