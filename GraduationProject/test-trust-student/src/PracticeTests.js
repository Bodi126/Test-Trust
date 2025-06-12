import React, { useState, useEffect } from 'react';
import socket from './socket';
import axios from 'axios';

const PracticeTests = () => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [examStarted, setExamStarted] = useState(false);
  const [student, setStudent] = useState(null);

  useEffect(() => {
    const fetchStudentData = async () => {
      const nationalId = localStorage.getItem('nationalId');
      if (nationalId) {
        try {
          const res = await axios.get(`http://localhost:5000/api/students/${nationalId}`);
          setStudent(res.data);
          socket.emit('student_join', res.data._id);
        } catch (err) {
          console.error('Student fetch error:', err);
        }
      }
    };

    fetchStudentData();

    // Listen for start_exam signal
    socket.on('start_exam', async () => {
  try {
    const examId = localStorage.getItem('examId');
    const res = await axios.get(`http://localhost:5000/api/byExam${examId}`);
    console.log('✅ Questions fetched:', res.data);
    setQuestions(res.data);
    setExamStarted(true);
  } catch (err) {
    console.error('Error fetching questions:', err);
  }
});

    return () => {
      socket.off('start_exam');
    };
  }, []);

  const handleAnswerChange = (e) => {
    setAnswers({
      ...answers,
      [questions[currentIndex]._id]: e.target.value
    });
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      submitAnswers();
    }
  };

  const submitAnswers = async () => {
    try {
      const payload = {
        nationalId: student?.nationalId,
        examId: questions[0]?.examId,
        answers: Object.entries(answers).map(([questionId, answer]) => ({
          questionId,
          answer
        }))
      };
      await axios.post('http://localhost:5000/api/student_answer', payload);
      alert('تم إرسال الإجابات بنجاح ✅');
      setExamStarted(false);
    } catch (err) {
      console.error('Error submitting answers:', err);
      alert('حدث خطأ أثناء إرسال الإجابات');
    }
  };

  const renderQuestion = (q) => {
    switch (q.type) {
      case 'mcq':
        return (
          <>
            <p>{q.question}</p>
            <input type="text" placeholder="أدخل الإجابة (مثلاً: A أو B)" value={answers[q._id] || ''} onChange={handleAnswerChange} />
          </>
        );
      case 'trueFalse':
        return (
          <>
            <p>{q.question}</p>
            <select value={answers[q._id] || ''} onChange={handleAnswerChange}>
              <option value="">اختر</option>
              <option value="true">True</option>
              <option value="false">False</option>
            </select>
          </>
        );
      case 'written':
        return (
          <>
            <p>{q.question}</p>
            <textarea value={answers[q._id] || ''} onChange={handleAnswerChange} rows="4" />
          </>
        );
      default:
        return null;
    }
  };

  if (!examStarted) return <div style={{ textAlign: 'center', marginTop: '100px' }}>Wating for the Exam....</div>;

  return (
    <div className="exam-container" style={{ padding: '2rem' }}>
      <h2>السؤال رقم {currentIndex + 1} من {questions.length}</h2>
      <div className="question-box">
        {renderQuestion(questions[currentIndex])}
      </div>
      <button onClick={handleNext} style={{ marginTop: '20px' }}>
        {currentIndex + 1 === questions.length ? 'Submit' : 'Next'}
      </button>
    </div>
  );
};

export default PracticeTests;
