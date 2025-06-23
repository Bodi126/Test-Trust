import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import socket from './socket';
import axios from 'axios';
import './PracticeTests.css';

const PracticeTests = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [todayExams, setTodayExams] = useState([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [loadingTests, setLoadingTests] = useState(true);
  const [tests, setTests] = useState([]);
  const navigate = useNavigate();

  const subjects = [
    { id: 'math', name: 'Mathematics', icon: '🧮', progress: 65 },
    { id: 'science', name: 'Science', icon: '🔬', progress: 42 },
    { id: 'literature', name: 'Literature', icon: '📚', progress: 78 },
    { id: 'history', name: 'History', icon: '🏛️', progress: 53 },
    { id: 'coding', name: 'Computer Science', icon: '💻', progress: 89 },
  ];

  useEffect(() => {
    // Fetch today's exams
    const fetchTodayExams = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/auth/alltoday_exams');
        const exams = response.data.exams || response.data;
        setTodayExams(Array.isArray(exams) ? exams : []);
      } catch (error) {
        console.error('Failed to load today exams:', error);
        setTodayExams([]);
      } finally {
        setLoadingExams(false);
      }
    };

    // Fetch practice tests
    const fetchPracticeTests = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/auth/practice-tests');
        setTests(response.data || []);
      } catch (error) {
        console.error('Failed to load practice tests:', error);
        setTests([]);
      } finally {
        setLoadingTests(false);
      }
    };

    fetchTodayExams();
    fetchPracticeTests();

    // Socket setup
    const nationalId = localStorage.getItem('nationalId');
    const studentId = localStorage.getItem('studentId');
    const examId = localStorage.getItem('examId');
    if (nationalId) {
      socket.emit('student_join', nationalId, examId);
    } else if (studentId) {
      // Fallback to studentId if nationalId is not available
      socket.emit('student_join', studentId, examId);
    }

    socket.on('start_exam', (examData) => {
      if (examData) {
        localStorage.setItem('examId', examData._id);
        localStorage.setItem('examData', JSON.stringify(examData));
        navigate('/ExamPage'); // Navigate to the exam page
      }
    });

    return () => {
      socket.off('start_exam');
    };
  }, [navigate]);

  // Combine practice tests and today's exams for the 'all' tab
  const getAllTests = () => {
    const combinedTests = [...tests];
    
    todayExams.forEach(exam => {
      combinedTests.push({
        id: exam._id,
        title: exam.subject + ' Exam',
        subject: exam.subject.toLowerCase(),
        questions: exam.questionCount,
        duration: exam.duration,
        difficulty: 'Medium', // Default difficulty for exams
        rating: '4.5', // Default rating for exams
        taken: exam.participants || 0,
        badge: 'Live',
        isExam: true // Flag to identify exams
      });
    });

    return combinedTests;
  };

  const filteredTests = () => {
    if (activeTab === 'all') {
      const allTests = getAllTests();
      return selectedSubject 
        ? allTests.filter(test => test.subject === selectedSubject)
        : allTests;
    } else {
      // For other tabs, only show practice tests
      return selectedSubject 
        ? tests.filter(test => test.subject === selectedSubject)
        : tests;
    }
  };

  const startExam = (examId, isExam = false) => {
    localStorage.setItem('examId', examId);
    navigate(isExam ? '/ExamPage' : `/practice-test/${examId}`);
  };

  return (
    <div className="practice-tests">
      <div className="practice-header">
        <h1>Practice Tests</h1>
        <p>Sharpen your skills with our interactive practice exams</p>
      </div>

      <div className="practice-container">
        <div className="subject-selector">
          <h2>Subjects</h2>
          <div className="subject-cards">
            {subjects.map(subject => (
              <div 
                key={subject.id}
                className={`subject-card ${selectedSubject === subject.id ? 'active' : ''}`}
                onClick={() => setSelectedSubject(
                  selectedSubject === subject.id ? null : subject.id
                )}
              >
                <div className="subject-icon">{subject.icon}</div>
                <h3>{subject.name}</h3>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${subject.progress}%` }}
                  ></div>
                </div>
                <span className="progress-text">{subject.progress}% Mastery</span>
              </div>
            ))}
          </div>
        </div>

        <div className="test-browser">
          <div className="test-filters">
            <div className="filter-tabs">
              <button 
                className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                All Tests
              </button>
              <button 
                className={`tab-btn ${activeTab === 'recent' ? 'active' : ''}`}
                onClick={() => setActiveTab('recent')}
              >
                Recently Taken
              </button>
              <button 
                className={`tab-btn ${activeTab === 'recommended' ? 'active' : ''}`}
                onClick={() => setActiveTab('recommended')}
              >
                Recommended
              </button>
            </div>
            <div className="search-box">
              <input type="text" placeholder="Search tests..." />
              <button>🔍</button>
            </div>
          </div>

          {loadingTests ? (
            <div className="loading-tests">Loading practice tests...</div>
          ) : (
            <div className="test-grid">
              {filteredTests().map(test => (
                <div key={test.id} className="test-card">
                  {test.badge && <div className="test-badge">{test.badge}</div>}
                  <div className="test-header">
                    <h3>{test.title}</h3>
                    <span className={`difficulty ${test.difficulty ? test.difficulty.toLowerCase() : 'medium'}`}>
                      {test.difficulty || 'Medium'}
                    </span>
                  </div>
                  <div className="test-meta">
                    <span>📝 {test.questions} questions</span>
                    <span>⏱️ {test.duration} mins</span>
                    {test.rating && <span>⭐ {test.rating}</span>}
                    <span>👥 {test.taken || 0} students</span>
                  </div>
                  <div className="test-actions">
                  <p className='writing'>Waiting....</p>
                    {!test.isExam && (
                      <button className="preview-btn">
                        Quick Preview
                      </button>
                    )}
                  </div>
                  {test.lastAttempt && (
                    <div className="last-attempt">
                      Last attempted: {test.lastAttempt}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="motivation-section">
        <h2>Keep Going!</h2>
        <p>You've completed 12 practice tests this month. Aim for 20 to earn the Gold Scholar badge!</p>
        <div className="progress-tracker">
          <div className="progress-fill" style={{ width: '60%' }}></div>
          <span>12/20 tests</span>
        </div>
      </div>
    </div>
  );
};

export default PracticeTests;