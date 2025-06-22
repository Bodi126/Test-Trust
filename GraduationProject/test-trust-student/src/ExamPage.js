import React, { useState, useEffect, useRef } from 'react';
import './ExamPage.css';
import { FaFlag, FaCalculator, FaPalette, FaExpand, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import axios from 'axios';

const ExamPage = () => {
  // State declarations
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(3600);
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [student, setStudent] = useState(null);
  const [examData, setExamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const whiteboardRef = useRef(null);
  
  const currentQuestion = questions[currentQuestionIndex];

  // Function Definitions
  const toggleFlagQuestion = (questionId) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (choiceIndex) => {
  const questionId = currentQuestion._id;
  let answerValue;
  let selectedValue;

  switch(currentQuestion.type) {
    case 'trueFalse':
      answerValue = choiceIndex === 0 ? 'True' : 'False';
      selectedValue = choiceIndex;
      break;

    case 'mcq':
      answerValue = currentQuestion.choices[choiceIndex];
      selectedValue = choiceIndex;
      break;

    default:
      answerValue = '';
      selectedValue = '';
  }

  setAnswers(prev => ({
    ...prev,
    [questionId]: {
      selected: selectedValue,
      answerText: answerValue, 
      timestamp: new Date().toISOString()
    }
  }));
};

  const handleWrittenAnswer = (e) => {
    const questionId = currentQuestion._id;
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        selected: e.target.value,
        answerText: e.target.value,
        timestamp: new Date().toISOString()
      }
    }));
  };

  const submitAnswers = async () => {
    try {
      console.log('Submit button clicked');
      setSubmissionStatus('submitting');
      
      // Debug: Log all localStorage items
      console.log('All localStorage items:', { ...localStorage });
      
      const nationalId = localStorage.getItem('nationalId');
      console.log('Retrieved nationalId from localStorage:', nationalId);
      
      if (!nationalId) {
        const error = new Error('Student national ID not found in localStorage');
        console.error(error.message, { localStorage: { ...localStorage } });
        alert('Error: Student ID not found. Please log in again.');
        setSubmissionStatus('error');
        return;
      }

      if (!examData?._id) {
        console.error('Exam ID is missing');
        alert('Error: Exam data is missing. Please refresh the page and try again.');
        setSubmissionStatus('error');
        return;
      }

      const payload = {
        studentNationalId: nationalId, 
        examId: examData._id,
        answers: questions.map(q => ({
          questionId: q._id,
          answer: answers[q._id]?.answerText ?? answers[q._id]?.selected ?? ''
        })).filter(a => a.answer !== '') // Only include answered questions
      };

      console.log('Submitting answers with payload:', JSON.stringify(payload, null, 2));
      
      try {
        console.log('Sending request to server with payload:', JSON.stringify(payload, null, 2));
        
        const response = await axios.post('http://localhost:5000/api/auth_stu/student-answers', payload, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          timeout: 10000 // 10 second timeout
        });
        
        console.log('Server response:', {
          status: response.status,
          statusText: response.statusText,
          data: response.data
        });
        
        if (response.status === 200 || response.status === 201) {
          setSubmissionStatus('success');
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
        } else {
          throw new Error(`Unexpected status code: ${response.status}`);
        }
      } catch (error) {
        const errorDetails = {
          name: error.name,
          message: error.message,
          stack: error.stack,
          response: error.response ? {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data
          } : 'No response',
          request: error.request ? 'Request was made but no response received' : 'No request was made'
        };
        
        console.error('Error details:', JSON.stringify(errorDetails, null, 2));
        
        // More user-friendly error message
        let errorMessage = 'Error submitting answers. ';
        if (error.response) {
          // Server responded with an error
          errorMessage += `Server responded with status ${error.response.status}: `;
          errorMessage += error.response.data?.error || error.response.data?.message || 'Unknown server error';
        } else if (error.request) {
          // Request was made but no response received
          errorMessage += 'No response received from server. Please check your internet connection.';
        } else {
          // Something else happened
          errorMessage += error.message || 'Unknown error occurred';
        }
        
        alert(errorMessage);
        setSubmissionStatus('error');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      alert('An unexpected error occurred. Please check the console for details.');
      setSubmissionStatus('error');
    }
  };

  const handleAutoSubmit = () => {
    submitAnswers();
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Effects
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get student ID from localStorage (stored as 'studentId' during login)
        const studentId = localStorage.getItem('studentId');
        const examDataString = localStorage.getItem('examData');
        const examData = examDataString ? JSON.parse(examDataString) : null;
        
        if (!examData || !examData._id) {
          throw new Error('Exam data not found');
        }

        setExamData(examData);

        if (studentId) {
          console.log('Fetching student data for studentId:', studentId);
          try {
            // First get the student's data using their student ID
            const studentRes = await axios.get(`http://localhost:5000/api/auth_stu/students/${studentId}`);
            console.log('Full student data response:', JSON.stringify(studentRes.data, null, 2));
            
            if (!studentRes.data) {
              throw new Error('No student data returned from server');
            }
            
            const studentData = studentRes.data;
            
            // Log the national ID specifically
            console.log('National ID from response:', studentData.nationalId);
            
            if (!studentData.nationalId) {
              console.warn('No nationalId found in student data');
              // Try to get national ID from localStorage as fallback
              const storedNationalId = localStorage.getItem('nationalId');
              if (storedNationalId) {
                console.log('Using nationalId from localStorage:', storedNationalId);
                studentData.nationalId = storedNationalId;
              }
            }
            
            // Store the national ID in localStorage for future use
            if (studentData.nationalId) {
              localStorage.setItem('nationalId', studentData.nationalId);
            }
            
            // Set the student data in state
            setStudent({
              fullName: studentData.fullName || localStorage.getItem('studentName') || 'Unknown Student',
              nationalId: studentData.nationalId || 'N/A',
              ...studentData
            });
            
            console.log('Student state after update:', {
              fullName: studentData.fullName,
              nationalId: studentData.nationalId
            });
          } catch (error) {
            console.error('Error fetching student data:', {
              message: error.message,
              response: error.response?.data,
              status: error.response?.status
            });
            
            // Try to use any previously stored data
            const storedNationalId = localStorage.getItem('nationalId');
            console.log('Using fallback nationalId from localStorage:', storedNationalId);
            
            setStudent({ 
              fullName: localStorage.getItem('studentName') || 'Unknown Student', 
              nationalId: localStorage.getItem('nationalId')|| 'N/A'
            });
          }
        }

        const questionsRes = await axios.get(`http://localhost:5000/api/auth_stu/exams-questions/${examData._id}`);
        const transformedQuestions = questionsRes.data.map(q => ({
          ...q,
          choices: q.type === 'mcq' ? q.choices || [] : []
        }));

        setQuestions(transformedQuestions);
        
        if (examData.examDuration) {
          setTimeLeft(examData.examDuration * 60);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement !== null);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      clearInterval(timer);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!showExitWarning) {
        e.preventDefault();
        e.returnValue = '';
        setShowExitWarning(true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [showExitWarning]);

  useEffect(() => {
    if (whiteboardRef.current && showWhiteboard) {
      const canvas = whiteboardRef.current;
      const ctx = canvas.getContext('2d');
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#000000';
      
      let isDrawing = false;
      let lastX = 0;
      let lastY = 0;
      
      const startDrawing = (e) => {
        const rect = canvas.getBoundingClientRect();
        lastX = e.clientX - rect.left;
        lastY = e.clientY - rect.top;
        isDrawing = true;
      };
      
      const draw = (e) => {
        if (!isDrawing) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
        
        lastX = x;
        lastY = y;
      };
      
      const stopDrawing = () => {
        isDrawing = false;
      };
      
      canvas.addEventListener('mousedown', startDrawing);
      canvas.addEventListener('mousemove', draw);
      canvas.addEventListener('mouseup', stopDrawing);
      canvas.addEventListener('mouseout', stopDrawing);
      
      return () => {
        canvas.removeEventListener('mousedown', startDrawing);
        canvas.removeEventListener('mousemove', draw);
        canvas.removeEventListener('mouseup', stopDrawing);
        canvas.removeEventListener('mouseout', stopDrawing);
      };
    }
  }, [showWhiteboard]);

  // Render
  if (loading) {
    return <div className="loading">Loading exam questions...</div>;
  }

  if (!questions.length) {
    return <div className="no-questions">No questions available for this exam.</div>;
  }

  if (submissionStatus === 'success') {
    return (
      <div className="submission-success">
        <h2>Exam Submitted Successfully!</h2>
        <p>Your answers have been recorded.</p>
        <p>You will be redirected shortly...</p>
      </div>
    );
  }

  return (
    <div className="exam-page-container">
      {/* Exit Warning Modal */}
      {showExitWarning && (
        <div className="modal-overlay">
          <div className="warning-modal">
            <h3>⚠️ Exam in Progress</h3>
            <p>Leaving this page will submit your exam automatically.</p>
            <div className="modal-buttons">
              <button 
                className="modal-btn cancel-btn"
                onClick={() => setShowExitWarning(false)}
              >
                Stay on Page
              </button>
              <button 
                className="modal-btn confirm-btn"
                onClick={handleAutoSubmit}
                disabled={submissionStatus === 'submitting'}
              >
                {submissionStatus === 'submitting' ? 'Submitting...' : 'Submit & Exit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submission Confirmation Modal */}
      {showConfirmation && (
        <div className="modal-overlay">
          <div className="confirmation-modal">
            <h3>Submit Your Exam?</h3>
            <p>Are you sure you want to submit your exam? You won't be able to make changes after submission.</p>
            
            <div className="selected-answers-summary">
              <h4>Your Answers:</h4>
              <ul>
                {questions.map((q, index) => (
                  <li key={q._id}>
                    Q{index + 1}: {answers[q._id]?.answerText 
                      ? (q.type === 'written' 
                          ? answers[q._id].answerText.substring(0, 50) + (answers[q._id].answerText.length > 50 ? '...' : '')
                          : answers[q._id].answerText)
                      : 'Not answered'}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="modal-buttons">
              <button 
                className="modal-btn cancel-btn"
                onClick={() => setShowConfirmation(false)}
              >
                Review Answers
              </button>
              <button 
                className="modal-btn confirm-btn"
                onClick={submitAnswers}
                disabled={submissionStatus === 'submitting'}
              >
                {submissionStatus === 'submitting' ? 'Submitting...' : 'Confirm Submission'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="exam-header">
        <div className="exam-title">
          <h2>{examData?.name || 'Exam'}</h2>
          <div className="student-info">
            <span>ID: {student?.nationalId}</span>
            <span>Name: {student?.fullName}</span>
          </div>
        </div>
        
        <div className="header-controls">
          <div className={`timer ${timeLeft < 300 ? 'urgent' : ''}`}>
            ⏱️ {formatTime(timeLeft)}
          </div>
          
          <div className="tool-buttons">
            <button 
              className="tool-btn"
              onClick={() => setShowCalculator(!showCalculator)}
              title="Calculator"
            >
              <FaCalculator />
            </button>
            <button 
              className="tool-btn"
              onClick={() => setShowWhiteboard(!showWhiteboard)}
              title="Whiteboard"
            >
              <FaPalette />
            </button>
            <button 
              className="tool-btn"
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              <FaExpand />
            </button>
          </div>
          
          <button 
            className="submit-btn"
            onClick={() => setShowConfirmation(true)}
            disabled={submissionStatus === 'submitting'}
          >
            {submissionStatus === 'submitting' ? 'Submitting...' : 'Submit Exam'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="exam-content">
        {/* Questions Navigation Sidebar */}
        <div className="questions-nav">
          <h3>Questions</h3>
          <div className="question-buttons">
            {questions.map((q, index) => (
              <button
                key={q._id}
                className={`question-btn ${
                  answers[q._id] ? 'answered' : ''
                } ${
                  flaggedQuestions.has(q._id) ? 'flagged' : ''
                } ${
                  currentQuestionIndex === index ? 'active' : ''
                }`}
                onClick={() => setCurrentQuestionIndex(index)}
              >
                {index + 1}
              </button>
            ))}
          </div>
          
          <div className="progress-indicator">
            <div 
              className="progress-bar"
              style={{
                width: `${(Object.keys(answers).length / questions.length) * 100}%`
              }}
            ></div>
            <span>
              {Object.keys(answers).length}/{questions.length} answered
            </span>
          </div>
        </div>

        {/* Question Display Area */}
        <div className="question-area">
          {/* Tools Panel */}
          {(showCalculator || showWhiteboard) && (
            <div className="tools-panel">
              {showCalculator && (
                <div className="calculator">
                  <div className="calculator-display">0</div>
                  <div className="calculator-buttons">
                    {['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+'].map((btn) => (
                      <button key={btn} className="calc-btn">{btn}</button>
                    ))}
                  </div>
                </div>
              )}
              
              {showWhiteboard && (
                <div className="whiteboard">
                  <canvas 
                    width="300" 
                    height="200"
                    ref={whiteboardRef}
                  />
                  <div className="whiteboard-controls">
                    <button 
                      className="wb-btn clear-btn"
                      onClick={() => {
                        const canvas = whiteboardRef.current;
                        const ctx = canvas.getContext('2d');
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                      }}
                    >
                      Clear
                    </button>
                    <input 
                      type="color" 
                      className="color-picker" 
                      onChange={(e) => {
                        const ctx = whiteboardRef.current.getContext('2d');
                        ctx.strokeStyle = e.target.value;
                      }} 
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Question Content */}
          <div className="question-content">
            <div className="question-meta">
              <span className="question-number">Question {currentQuestion.number || currentQuestionIndex + 1}</span>
              <button 
                className={`flag-btn ${flaggedQuestions.has(currentQuestion._id) ? 'flagged' : ''}`}
                onClick={() => toggleFlagQuestion(currentQuestion._id)}
              >
                <FaFlag /> {flaggedQuestions.has(currentQuestion._id) ? 'Flagged' : 'Flag'}
              </button>
            </div>

            <div className="question-text">
              {currentQuestion.question}
            </div>

            {/* Current Selection Display */}
            {answers[currentQuestion._id] && (
              <div className="current-selection">
                <strong>Your answer:</strong> {answers[currentQuestion._id].answerText}
              </div>
            )}

           {/* Answer Section */}
<div className="answer-section">
  {currentQuestion.type === 'mcq' && currentQuestion.choices.map((choice, index) => (
    <div 
      key={index}
      className={`answer-option ${
        answers[currentQuestion._id]?.selected === index ? 'selected' : ''
      }`}
      onClick={() => handleAnswerSelect(index)}
    >
      <div className="option-letter">
        {String.fromCharCode(65 + index)}.
      </div>
      <div className="option-text">
        {choice}
      </div>
    </div>
  ))}

  {currentQuestion.type === 'trueFalse' && (
    <div className="true-false-options">
      {['True', 'False'].map((option, index) => (
        <div 
          key={index}
          className={`answer-option ${
            answers[currentQuestion._id]?.selected === index ? 'selected' : ''
          }`}
          onClick={() => handleAnswerSelect(index)}
        >
          <div className="option-letter">
            {String.fromCharCode(65 + index)}.
          </div>
          <div className="option-text">
            {option}
          </div>
        </div>
      ))}
    </div>
  )}

  {currentQuestion.type === 'written' && (
    <textarea
      className="written-answer"
      value={answers[currentQuestion._id]?.answerText || ''}
      onChange={handleWrittenAnswer}
      rows="5"
      placeholder="Type your answer here..."
    />
  )}
</div>

            {/* Navigation Buttons */}
            <div className="navigation-buttons">
              <button 
                className={`nav-btn prev-btn ${currentQuestionIndex === 0 ? 'disabled' : ''}`}
                onClick={goToPreviousQuestion}
                disabled={currentQuestionIndex === 0}
                title="Previous Question (← Arrow Key)"
              >
                <FaChevronLeft />
                Previous
              </button>
              
              <div className="question-counter">
                {currentQuestionIndex + 1} of {questions.length}
              </div>
              
              <button 
                className={`nav-btn next-btn ${currentQuestionIndex === questions.length - 1 ? 'disabled' : ''}`}
                onClick={currentQuestionIndex === questions.length - 1 
                  ? () => setShowConfirmation(true) 
                  : goToNextQuestion}
                title={currentQuestionIndex === questions.length - 1 ? "Submit Exam" : "Next Question (→ Arrow Key)"}
              >
                {currentQuestionIndex === questions.length - 1 ? 'Submit' : 'Next'}
                {currentQuestionIndex === questions.length - 1 ? null : <FaChevronRight />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamPage;