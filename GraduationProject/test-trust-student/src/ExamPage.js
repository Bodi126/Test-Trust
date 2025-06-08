import React, { useState, useEffect, useRef } from 'react';
import './ExamPage.css';
import { FaFlag, FaCalculator, FaPalette, FaExpand, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const ExamPage = () => {
  // Sample questions array (replace with actual data)
  const questions = [
    {
      id: 1,
      text: "What is the primary purpose of a database index?",
      choices: [
        "To reduce disk space usage",
        "To speed up data retrieval operations",
        "To improve data security",
        "To facilitate data backup processes"
      ]
    },
    {
      id: 2,
      text: "Which SQL command is used to remove a table from the database?",
      choices: [
        "DELETE TABLE",
        "REMOVE TABLE",
        "DROP TABLE",
        "ERASE TABLE"
      ]
    },
    {
      id: 3,
      text: "In a relational database, what is a foreign key?",
      choices: [
        "A key that uniquely identifies each record in a table",
        "A key used for encrypting sensitive data",
        "A field that links to the primary key in another table",
        "A special key used for administrative access"
      ]
    },
    {
      id: 4,
      text: "What does ACID stand for in database transactions?",
      choices: [
        "Atomicity, Consistency, Isolation, Durability",
        "Availability, Consistency, Integrity, Durability",
        "Atomicity, Concurrency, Isolation, Durability",
        "Access, Concurrency, Integrity, Durability"
      ]
    }
  ];

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(3600);
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const whiteboardRef = useRef(null);
  
  const currentQuestion = questions[currentQuestionIndex];

  // Navigation functions
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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle navigation if no modal is open and no input is focused
      if (!showExitWarning && !document.activeElement.matches('input, textarea, button')) {
        if (e.key === 'ArrowLeft' && currentQuestionIndex > 0) {
          e.preventDefault();
          goToPreviousQuestion();
        } else if (e.key === 'ArrowRight' && currentQuestionIndex < questions.length - 1) {
          e.preventDefault();
          goToNextQuestion();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestionIndex, showExitWarning]);

  // Format time helper
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Auto-submit handler
  const handleAutoSubmit = () => {
    console.log("Submitting exam...", answers);
    // Actual submission logic would go here
    window.removeEventListener('beforeunload', handleBeforeUnload);
    window.close(); // Or navigate to results page
  };

  // Flag toggle function
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

  // Answer selection handler
  const handleAnswerSelect = (optionIndex) => {
    const questionId = questions[currentQuestionIndex].id;
    
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        selected: optionIndex,
        // Add other answer data if needed
      }
    }));
  };

  // Timer and fullscreen effects
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
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

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleBeforeUnload = (e) => {
    if (!showExitWarning) {
      e.preventDefault();
      e.returnValue = '';
      setShowExitWarning(true);
    }
  };

  useEffect(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [showExitWarning]);

  // Whiteboard drawing functionality
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
              >
                Submit & Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="exam-header">
        <div className="exam-title">
          <h2>Database Systems Final Exam</h2>
          <div className="student-info">
            <span>ID: 2023001</span>
            <span>Section: A</span>
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
            onClick={() => setShowExitWarning(true)}
          >
            Submit Exam
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
                key={q.id}
                className={`question-btn ${
                  answers[q.id] ? 'answered' : ''
                } ${
                  flaggedQuestions.has(q.id) ? 'flagged' : ''
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
              <span className="question-number">Question {currentQuestionIndex + 1}</span>
              <button 
                className={`flag-btn ${flaggedQuestions.has(currentQuestion.id) ? 'flagged' : ''}`}
                onClick={() => toggleFlagQuestion(currentQuestion.id)}
              >
                <FaFlag /> {flaggedQuestions.has(currentQuestion.id) ? 'Flagged' : 'Flag'}
              </button>
            </div>

            <div className="question-text">
              {currentQuestion.text}
            </div>

            {/* Answer Section */}
            <div className="answer-section">
              {currentQuestion.choices.map((choice, index) => (
                <div 
                  key={index} 
                  className={`answer-option ${
                    answers[currentQuestion.id]?.selected === index ? 'selected' : ''
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
                onClick={goToNextQuestion}
                disabled={currentQuestionIndex === questions.length - 1}
                title="Next Question (→ Arrow Key)"
              >
                Next
                <FaChevronRight />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamPage;