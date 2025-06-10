import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import './AddExam2.css';

const questionTypes = [
  { value: 'mcq', label: 'Multiple Choice', icon: '☑️' },
  { value: 'trueFalse', label: 'True/False', icon: '🔘' },
  { value: 'written', label: 'Written Answer', icon: '✍️' },
];

const AddExam2 = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { examData } = location.state || {};
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [questionType, setQuestionType] = useState('');
  const [answer, setAnswer] = useState({});
  const [questions, setQuestions] = useState([]);
  const [questionText, setQuestionText] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [examReady, setIsexamReady] = useState(false);


  const autoCorrection = examData?.autoCorrection || false;

  useEffect(() => {
    if (!examData) {
      navigate('/AddExam1');
      return;
    }
    setQuestionText('');
    setAnswer({});
  }, [questionType, currentQuestion, examData, navigate]);

  const handleQuestionTypeChange = (type) => {
    setQuestionType(type);
    setExpanded(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!questionText) {
      alert('Please enter the question text');
      setIsSubmitting(false);
      return;
    }

    if (autoCorrection && questionType === 'mcq' && !answer.correctOption) {
      alert('Please select the correct answer');
      setIsSubmitting(false);
      return;
    }

    if (autoCorrection && questionType === 'trueFalse' && !answer.trueFalseAnswer) {
      alert('Please select the correct answer');
      setIsSubmitting(false);
      return;
    }

    const newQuestion = {
      number: currentQuestion,
      type: questionType,
      question: questionText,
      autoCorrect: autoCorrection,
      answer: answer || {}
    };

    const allQuestions = [...questions, newQuestion];
    
    if (currentQuestion < examData.questionCount) {
      setQuestions(allQuestions);
      setCurrentQuestion(currentQuestion + 1);
      setExpanded(false);
      setQuestionType('');
      setIsSubmitting(false);
      return;
    }

    // Final submission
    try {
      const payload = {
        examId: examData._id,
        questions: allQuestions.map(q => ({
          ...q,
          number: parseInt(q.number),
          answer: q.answer || {}
        }))
      };

      const response = await axios.post(
        'http://localhost:5000/api/auth/add-questions-and-answers', 
        payload
      );

      console.log('Questions saved successfully:', response.data);
      navigate('/dashboard', { state: { examReady: true }});
    } catch (err) {
      console.error('Error saving questions:', err);
      alert(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to save questions. Please check console for details.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (currentQuestion === 1) {
      navigate('/AddExam1', { state: { examData } });
    } else {
      setCurrentQuestion(currentQuestion - 1);
      const prevQuestion = questions[questions.length - 1];
      setQuestionType(prevQuestion.type);
      setQuestionText(prevQuestion.question);
      setAnswer(prevQuestion.answer || {});
      setQuestions(questions.slice(0, -1));
      setExpanded(true);
    }
  };

  const handleAnswerChange = (e) => {
    const { name, value } = e.target;
    setAnswer(prev => ({ ...prev, [name]: value }));
  };

  const renderQuestionInput = () => {
    const typeConfig = questionTypes.find(t => t.value === questionType);
    
    return (
      <div className={`question-input-container ${questionType}`}>
        <div className="question-header">
          <span className="question-number">Q{currentQuestion}</span>
          <span className="question-type-badge">
            {typeConfig?.icon} {typeConfig?.label}
          </span>
        </div>
        
        {questionType === 'mcq' ? (
          <div className="mcq-options-container">
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Enter the question stem (e.g., What is 2+2?)"
              rows={2}
              className="question-textarea mcq-stem"
              required
            />
            {['A', 'B', 'C', 'D'].map(option => (
              <div key={option} className="mcq-option">
                <span className="option-letter">{option})</span>
                <input
                  type="text"
                  name={`option${option}`}
                  value={answer[`option${option}`] || ''}
                  onChange={handleAnswerChange}
                  placeholder={`Option ${option}`}
                  className="mcq-option-input"
                  required
                />
              </div>
            ))}
          </div>
        ) : (
          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder={
              questionType === 'trueFalse' ? "Enter statement (e.g., The Earth is round)" :
              questionType === 'written' ? "Enter question requiring written answer" :
              "Enter your question"
            }
            rows={questionType === 'trueFalse' ? 2 : 4}
            className={`question-textarea ${questionType}`}
            required
          />
        )}
      </div>
    );
  };

  const renderAnswerInput = () => {
    if (!autoCorrection) return null;

    switch (questionType) {
      case 'mcq':
        return (
          <div className="answer-section">
            <h3>Correct Answer</h3>
            <div className="options-grid">
              {['A', 'B', 'C', 'D'].map(option => (
                <label key={option} className="option-radio">
                  <input
                    type="radio"
                    name="correctOption"
                    value={option}
                    checked={answer.correctOption === option}
                    onChange={handleAnswerChange}
                    required={autoCorrection}
                  />
                  <span className="radio-custom"></span>
                  Option {option}
                </label>
              ))}
            </div>
          </div>
        );

      case 'trueFalse':
        return (
          <div className="answer-section">
            <h3>Correct Answer</h3>
            <div className="options-row">
              <label className="option-radio">
                <input
                  type="radio"
                  name="trueFalseAnswer"
                  value="true"
                  checked={answer.trueFalseAnswer === 'true'}
                  onChange={handleAnswerChange}
                  required={autoCorrection}
                />
                <span className="radio-custom"></span>
                True
              </label>
              <label className="option-radio">
                <input
                  type="radio"
                  name="trueFalseAnswer"
                  value="false"
                  checked={answer.trueFalseAnswer === 'false'}
                  onChange={handleAnswerChange}
                  required={autoCorrection}
                />
                <span className="radio-custom"></span>
                False
              </label>
            </div>
          </div>
        );

      case 'written':
        return (
          <div className="answer-section">
            <h3>Model Answer</h3>
            <textarea
              name="modelAnswer"
              value={answer.modelAnswer || ''}
              onChange={handleAnswerChange}
              placeholder="Enter the expected answer"
              rows={4}
              className="model-answer"
              required={autoCorrection}
            />
          </div>
        );

      default:
        return null;
    }
  };

  if (!examData) {
    return null; // Or redirect to AddExam1
  }

  return (
    <div className="exam-creator-container">
      <div className="progress-display">
        <div className="progress-text">
          Question <span>{currentQuestion}</span> of {examData.questionCount}
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${((currentQuestion - 1) / examData.questionCount) * 100}%` }}
          />
        </div>
      </div>

      <div className="creator-main-content">
        <div className={`type-selector-panel ${expanded ? 'has-selection' : ''}`}>
          <div className="panel-header">
            <h3>Select Question Type</h3>
            <p>Choose the type of question you want to add</p>
          </div>
          <div className="type-grid">
            {questionTypes.map(type => (
              <button
                key={type.value}
                type="button"
                className={`type-card ${questionType === type.value ? 'active' : ''}`}
                onClick={() => handleQuestionTypeChange(type.value)}
              >
                <span className="card-icon">{type.icon}</span>
                <span className="card-label">{type.label}</span>
              </button>
            ))}
          </div>

          <div className="bottom-nav-buttons">
            <button
              type="button"
              className="nav-button back"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              Back
            </button>
            <button
              type="submit"
              className="nav-button next"
              disabled={!questionType || !questionText || isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? 'Saving...' : 
               currentQuestion < examData.questionCount ? 'Next' : 'Finish'}
            </button>

            <button 
              className="dashboard-button"
              onClick={() => navigate('/dashboard')}
              disabled={isSubmitting}
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {expanded && (
          <div className="question-answer-panel">
            <div className="question-panel">
              {renderQuestionInput()}
            </div>
            
            {autoCorrection && (
              <div className="answer-panel">
                <div className="auto-correct-info">
                  <p>Auto-correction is enabled. Marks will be distributed evenly.</p>
                </div>
                {renderAnswerInput()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddExam2;