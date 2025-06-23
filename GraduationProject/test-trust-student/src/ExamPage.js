import React, { useState, useEffect, useRef } from 'react';
import './ExamPage.css';
import { FaFlag, FaCalculator, FaPalette, FaExpand, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import axios from 'axios';
import io from 'socket.io-client';
import socket from './socket';

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
  const [hasJoinedExam, setHasJoinedExam] = useState(false); // Flag to prevent multiple joins
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

    // Debug: Check socket connection status BEFORE answer selection
    const socket = require('./socket').default;
    console.log('=== ANSWER SELECTION START ===');
    console.log('Answer selection - Socket connected:', socket.connected, 'Socket ID:', socket.id);
    console.log('Question ID:', questionId, 'Choice Index:', choiceIndex);

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

    console.log('Setting answer for question:', questionId, 'Answer:', answerValue);

    // Send activity update when answering
    const nationalId = localStorage.getItem('nationalId') || student?.nationalId;
    const examId = examData?._id || localStorage.getItem('examId');
    
    if (socket.connected && examId && nationalId) {
      console.log('Sending activity update for answer selection');
      socket.emit('student_activity', nationalId, examId);
    } else {
      console.log('Cannot send activity update - missing data:', {
        socketConnected: socket.connected,
        examId: examId,
        nationalId: nationalId
      });
    }

    // Check socket connection status AFTER answer selection
    console.log('Answer selection - Socket connected AFTER:', socket.connected, 'Socket ID:', socket.id);
    console.log('=== ANSWER SELECTION END ===');

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
    
    // Debug: Check socket connection status
    const socket = require('./socket').default;
    console.log('Written answer - Socket connected:', socket.connected, 'Socket ID:', socket.id);
    console.log('Setting written answer for question:', questionId, 'Answer:', e.target.value);
    
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
      console.log('Current answers state:', answers);
      console.log('Questions count:', questions.length);
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

      // Check socket connection before submission
      const socket = require('./socket').default;
      console.log('Submit - Socket connected:', socket.connected, 'Socket ID:', socket.id);

      const payload = {
        studentNationalId: nationalId, 
        examId: examData._id,
        answers: questions.map(q => ({
          questionId: q._id,
          answer: answers[q._id]?.answerText ?? answers[q._id]?.selected ?? ''
        })).filter(a => a.answer !== '') // Only include answered questions
      };

      console.log('Submitting answers with payload:', JSON.stringify(payload, null, 2));
      console.log('Number of answered questions:', payload.answers.length);
      
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
          
          // Clear saved answers since exam is completed
          localStorage.removeItem('savedAnswers');
          localStorage.removeItem('examShutdownTime');
          
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

  // Manual student join function for debugging
  const manualStudentJoin = () => {
    const socket = require('./socket').default;
    const nationalId = localStorage.getItem('nationalId') || student?.nationalId;
    const examId = examData?._id || localStorage.getItem('examId');
    
    console.log('=== MANUAL STUDENT JOIN ===');
    console.log('Socket connected:', socket.connected);
    console.log('Socket ID:', socket.id);
    console.log('National ID:', nationalId);
    console.log('Exam ID:', examId);
    console.log('Has already joined:', hasJoinedExam);
    
    if (hasJoinedExam) {
      console.log('Student already joined, resetting join flag for manual rejoin');
      setHasJoinedExam(false);
    }
    
    if (socket.connected && nationalId && examId) {
      console.log('Emitting manual student_join');
      socket.emit('student_join', nationalId, examId);
      setHasJoinedExam(true);
    } else {
      console.log('Cannot join - missing data:', {
        socketConnected: socket.connected,
        nationalId: nationalId,
        examId: examId
      });
    }
  };

  // Effects
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get student ID from localStorage (stored as 'studentId' during login)
        const studentId = localStorage.getItem('studentId');
        const nationalId = localStorage.getItem('nationalId');
        const examDataString = localStorage.getItem('examData');
        const examData = examDataString ? JSON.parse(examDataString) : null;
        
        if (!examData || !examData._id) {
          throw new Error('Exam data not found');
        }

        setExamData(examData);

        // Emit student_join for WebSocket tracking
        if (!hasJoinedExam) {
          if (nationalId) {
            console.log('Emitting student_join with nationalId:', nationalId, 'for exam:', examData._id);
            // Ensure socket is connected before emitting
            if (socket.connected) {
              socket.emit('student_join', nationalId, examData._id);
              setHasJoinedExam(true);
            } else {
              console.log('Socket not connected, waiting for connection...');
              socket.on('connect', () => {
                console.log('Socket connected, now emitting student_join');
                socket.emit('student_join', nationalId, examData._id);
                setHasJoinedExam(true);
              });
            }
          } else if (studentId) {
            console.log('Emitting student_join with studentId:', studentId, 'for exam:', examData._id);
            // Ensure socket is connected before emitting
            if (socket.connected) {
              socket.emit('student_join', studentId, examData._id);
              setHasJoinedExam(true);
            } else {
              console.log('Socket not connected, waiting for connection...');
              socket.on('connect', () => {
                console.log('Socket connected, now emitting student_join');
                socket.emit('student_join', studentId, examData._id);
                setHasJoinedExam(true);
              });
            }
          }
        } else {
          console.log('Student already joined exam, skipping join event');
        }

        // Check for saved answers (in case of restart after shutdown)
        const savedAnswers = localStorage.getItem('savedAnswers');
        if (savedAnswers) {
          try {
            const parsedAnswers = JSON.parse(savedAnswers);
            setAnswers(parsedAnswers);
            console.log('Restored saved answers from shutdown:', parsedAnswers);
            
            // Show notification about restored answers
            alert('Your previous answers have been restored. Continue where you left off.');
          } catch (error) {
            console.error('Error restoring saved answers:', error);
          }
        }

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

  // Socket.IO event listeners for remote control
  useEffect(() => {
    // Use the existing socket connection from socket.js
    const socket = require('./socket').default;
    
    // Debug socket connection
    console.log('Socket connection status:', socket.connected ? 'Connected' : 'Disconnected');
    console.log('Socket ID:', socket.id);
    
    // Test if we can emit events
    socket.emit('test_message', 'ExamPage component loaded');
    
    // Listen for test response
    socket.on('test_response', (message) => {
      console.log('Test response received:', message);
    });
    
    // Listen for exam start signal
    socket.on('start_exam', (examData) => {
      console.log('Received start_exam signal:', examData);
      if (examData && examData._id) {
        // Check if this is a power-on restart
        const isPowerOnRestart = examData.action === 'power_on_restart';
        
        if (isPowerOnRestart) {
          console.log('Power-on restart detected, restoring saved answers...');
          
          // Restore saved answers if available
          const savedAnswers = localStorage.getItem('savedAnswers');
          if (savedAnswers) {
            try {
              const parsedAnswers = JSON.parse(savedAnswers);
              setAnswers(parsedAnswers);
              console.log('Restored saved answers for power-on restart:', parsedAnswers);
            } catch (error) {
              console.error('Error restoring saved answers for power-on restart:', error);
            }
          }
          
          // Show notification for restart
          alert('Your exam has been restarted. Continue where you left off.');
        } else {
          // Regular exam start - clear any previous saved answers
          localStorage.removeItem('savedAnswers');
          localStorage.removeItem('examShutdownTime');
          console.log('Regular exam start - cleared previous saved answers');
        }
        
        // Store exam data and redirect to exam page
        localStorage.setItem('examId', examData._id);
        localStorage.setItem('examData', JSON.stringify(examData));
        
        // If we're not already on the exam page, navigate to it
        if (window.location.pathname !== '/ExamPage') {
          window.location.href = '/ExamPage';
        } else {
          // If we're already on the exam page, reload to get the new exam data
          window.location.reload();
        }
      }
    });

    // Listen for exam end signal (shutdown)
    socket.on('exam_end', (data) => {
      console.log('Received exam_end signal:', data);
      console.log('Current exam ID from localStorage:', localStorage.getItem('examId'));
      console.log('Data exam ID type:', typeof data.examId);
      console.log('LocalStorage exam ID type:', typeof localStorage.getItem('examId'));
      console.log('Exam IDs match?', data.examId === localStorage.getItem('examId'));
      
      // Get current exam ID from localStorage
      const currentExamId = localStorage.getItem('examId');
      
      // Only respond if this event is for the current exam
      if (data && data.examId && data.examId === currentExamId) {
        console.log('Exam end event matches current exam, processing shutdown...');
        
        // Save current answers before redirecting
        const currentAnswers = answers;
        console.log('Saving current answers before shutdown:', currentAnswers);
        
        if (Object.keys(currentAnswers).length > 0) {
          localStorage.setItem('savedAnswers', JSON.stringify(currentAnswers));
          localStorage.setItem('examShutdownTime', new Date().toISOString());
          console.log('Answers saved to localStorage');
        }
        
        // Show immediate notification
        alert('Your exam has been terminated by the instructor. You will be redirected to the dashboard.');
        
        // Clean up WebSocket connection before redirect
        console.log('Cleaning up WebSocket connection before redirect...');
        const socket = require('./socket').default;
        
        // Emit manual disconnect event to notify instructor
        const nationalId = localStorage.getItem('nationalId');
        const examId = localStorage.getItem('examId');
        if (nationalId && examId) {
          console.log('Emitting manual student_disconnect event...');
          socket.emit('student_disconnect', nationalId, examId);
        }
        
        socket.disconnect();
        
        // Clear exam data from localStorage
        localStorage.removeItem('examId');
        localStorage.removeItem('examData');
        
        // Redirect immediately to dashboard
        console.log('Redirecting to dashboard...');
        window.location.href = '/';
      } else {
        console.log('Exam end event received but not for current exam:', data.examId, 'vs', currentExamId);
      }
    });

    // Listen for exam failed signal
    socket.on('exam_failed', (data) => {
      console.log('Received exam_failed signal:', data);
      
      // Get current exam ID from localStorage
      const currentExamId = localStorage.getItem('examId');
      
      // Only respond if this event is for the current exam
      if (data && data.examId && data.examId === currentExamId) {
        console.log('Exam failed event matches current exam, processing failure...');
        
        // Clear saved answers since exam is failed
        localStorage.removeItem('savedAnswers');
        localStorage.removeItem('examShutdownTime');
        
        alert('Your exam has been marked as failed due to power-on window expiration. You will be redirected to the dashboard.');
        
        // Clean up WebSocket connection before redirect
        console.log('Cleaning up WebSocket connection before redirect (exam failed)...');
        const socket = require('./socket').default;
        
        // Emit manual disconnect event to notify instructor
        const nationalId = localStorage.getItem('nationalId');
        const examId = localStorage.getItem('examId');
        if (nationalId && examId) {
          console.log('Emitting manual student_disconnect event (exam failed)...');
          socket.emit('student_disconnect', nationalId, examId);
        }
        
        socket.disconnect();
        
        // Clear exam data from localStorage
        localStorage.removeItem('examId');
        localStorage.removeItem('examData');
        
        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      } else {
        console.log('Exam failed event received but not for current exam:', data.examId, 'vs', currentExamId);
      }
    });
    
    // Listen for remote shutdown signal (legacy)
    socket.on('remote_shutdown', (data) => {
      console.log('Received remote shutdown signal:', data);
      alert('Your exam session has been terminated by the instructor. You will be redirected to the main page.');
      
      // Clean up WebSocket connection before redirect
      console.log('Cleaning up WebSocket connection before redirect (remote shutdown)...');
      const socket = require('./socket').default;
      
      // Emit manual disconnect event to notify instructor
      const nationalId = localStorage.getItem('nationalId');
      const examId = localStorage.getItem('examId');
      if (nationalId && examId) {
        console.log('Emitting manual student_disconnect event (remote shutdown)...');
        socket.emit('student_disconnect', nationalId, examId);
      }
      
      socket.disconnect();
      
      // Clear exam data from localStorage
      localStorage.removeItem('examId');
      localStorage.removeItem('examData');
      
      // Auto-submit answers if possible
      if (Object.keys(answers).length > 0) {
        submitAnswers();
      } else {
        // Redirect to main page
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      }
    });

    // Listen for remote power-on signal (legacy)
    socket.on('remote_poweron', (data) => {
      console.log('Received remote power-on signal:', data);
      alert('The instructor has requested you to reconnect to the exam. Please refresh the page.');
      
      // Optionally auto-refresh the page
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    });

    return () => {
      socket.off('start_exam');
      socket.off('exam_end');
      socket.off('exam_failed');
      socket.off('remote_shutdown');
      socket.off('remote_poweron');
      socket.off('test_response');
      // Do NOT emit student_disconnect on unmount!
      // Debug: Log when ExamPage is unmounting, cleaning up WebSocket...
      console.log('ExamPage component unmounting, cleaning up WebSocket...');
    };
  }, [answers]);

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

  // Socket connection monitoring
  useEffect(() => {
    const socket = require('./socket').default;
    
    // Check connection status every 5 seconds
    const connectionCheck = setInterval(() => {
      console.log('Socket connection check - Connected:', socket.connected, 'ID:', socket.id);
      
      // If disconnected, try to reconnect
      if (!socket.connected) {
        console.log('Socket disconnected, attempting to reconnect...');
        socket.connect();
        
        // Re-emit student_join after reconnection
        const nationalId = localStorage.getItem('nationalId');
        const examId = localStorage.getItem('examId');
        if (nationalId && examId) {
          console.log('Re-emitting student_join after reconnection...');
          socket.emit('student_join', nationalId, examId);
        }
      }
    }, 5000);
    
    return () => {
      clearInterval(connectionCheck);
    };
  }, []);

  // Add periodic activity update
  useEffect(() => {
    const activityInterval = setInterval(() => {
      const socket = require('./socket').default;
      const nationalId = localStorage.getItem('nationalId') || student?.nationalId;
      const examId = examData?._id || localStorage.getItem('examId');
      
      if (socket.connected && examId && nationalId) {
        console.log('Sending periodic activity update');
        socket.emit('student_activity', nationalId, examId);
      } else {
        console.log('Cannot send periodic activity update - missing data:', {
          socketConnected: socket.connected,
          examId: examId,
          nationalId: nationalId
        });
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(activityInterval);
  }, [examData, student]);

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
          
          {/* Socket connection status */}
          <div className="socket-status" style={{ 
            padding: '5px 10px', 
            borderRadius: '4px', 
            fontSize: '12px',
            backgroundColor: require('./socket').default.connected ? '#4CAF50' : '#f44336',
            color: 'white',
            marginRight: '10px'
          }}>
            {require('./socket').default.connected ? '🟢 Connected' : '🔴 Disconnected'}
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
            {/* Debug button for manual student join */}
            <button 
              className="tool-btn debug-btn"
              onClick={manualStudentJoin}
              title="Debug: Manual Student Join"
              style={{ backgroundColor: '#ff6b6b', color: 'white' }}
            >
              🔧
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