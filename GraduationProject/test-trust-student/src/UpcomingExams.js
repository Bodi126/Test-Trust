import React, { useState, useEffect } from 'react';
import socket from './socket';
import axios from 'axios';

const UpcomingExams = () => {
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const fetchExam = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/auth/alltoday_exams');
      console.log("Received exam data:", response.data);

      if (response.data && response.data.length > 0) {
        setExam(response.data[0]); 
      }
    } catch (error) {
      console.error('Failed to load the exam.', error);
    } finally {
      setLoading(false);
    }
  };

  fetchExam();

  socket.on('start_exam', () => {
    console.log('✅ Exam started!');
    window.location.href = '/PracticeTests'; 
  });

  return () => {
    socket.off('start_exam');
  };
}, []);


  if (loading) return <p>Loading...</p>;

  return (
    <div className="upcoming-exam">
      {exam ? (
        <>
          <h2>📝Ongoing Exam</h2>
          <p><strong>Subject:</strong> {exam.subject}</p>
          <p><strong>Number of questions :</strong> {exam.questionCount}</p>
          <p><strong>Wating to Start...</strong></p>
        </>
      ) : (
        <h2>🚫There is no Exams for Today</h2>
      )}
    </div>
  );
};

export default UpcomingExams;
