import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './AddExam2.css';

const questionTypes = [
  { value: 'mcq', label: 'Multiple Choice', icon: '☑️' },
  { value: 'trueFalse', label: 'True/False', icon: '🔘' },
  { value: 'written', label: 'Written Answer', icon: '✍️' },
  { value: 'match', label: 'Matching', icon: '⇄' }
];

const AddExam2 = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const examData = location.state?.examData || {};
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [questionType, setQuestionType] = useState('');
  const [autoCorrect, setAutoCorrect] = useState(false);
  const [answer, setAnswer] = useState({});
  const [questions, setQuestions] = useState([]);
  const [questionText, setQuestionText] = useState('');
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setQuestionText('');
    setAnswer({});
  }, [questionType, currentQuestion]);

  const handleQuestionTypeChange = (type) => {
    setQuestionType(type);
    setExpanded(true);
  };

  const handleAutoCorrectChange = (e) => {
    setAutoCorrect(e.target.checked);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newQuestion = {
      number: currentQuestion,
      type: questionType,
      question: questionText,
      autoCorrect,
      answer
    };
    
    setQuestions([...questions, newQuestion]);
    
    if (currentQuestion < examData.questionCount) {
      setCurrentQuestion(currentQuestion + 1);
      setExpanded(false);
      setQuestionType('');
    } else {
      navigate('/exam-review', { state: { examData, questions: [...questions, newQuestion] } });
    }
  };

  const handleBack = () => {
    if (currentQuestion === 1) {
      navigate('/AddExam1', { state: { examData } }); // Change this route if your AddExam1 route is different
    } else {
      setCurrentQuestion(currentQuestion - 1);
      const prevQuestion = questions[questions.length - 1];
      setQuestionType(prevQuestion.type);
      setQuestionText(prevQuestion.question);
      setAutoCorrect(prevQuestion.autoCorrect);
      setAnswer(prevQuestion.answer);
      setQuestions(questions.slice(0, -1));
      setExpanded(true);
    }
  };

  const handleAnswerChange = (e) => {
    const { name, value } = e.target;
    setAnswer(prev => ({ ...prev, [name]: value }));
  };

  const handleMatchChange = (pair, type, value) => {
    setAnswer(prev => ({
      ...prev,
      [`${type}${pair}`]: value
    }));
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
            />
            {['A', 'B', 'C', 'D'].map(option => (
              <div key={option} className="mcq-option">
                <span className="option-letter">{option})</span>
                <input
                  type="text"
                  value={answer[`option${option}`] || ''}
                  onChange={(e) => handleAnswerChange({
                    target: { name: `option${option}`, value: e.target.value }
                  })}
                  placeholder={`Option ${option}`}
                  className="mcq-option-input"
                />
              </div>
            ))}
          </div>
        ) : questionType === 'match' ? (
          <div className="match-pairs-container">
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Enter matching instructions"
              rows={1}
              className="question-textarea match-instructions"
            />
            <div className="match-columns">
              <div className="match-column">
                <h4>Items</h4>
                {[1, 2, 3, 4].map(pair => (
                  <input
                    key={`item${pair}`}
                    type="text"
                    placeholder={`Item ${pair}`}
                    value={answer[`item${pair}`] || ''}
                    onChange={(e) => handleMatchChange(pair, 'item', e.target.value)}
                    className="match-item-input"
                  />
                ))}
              </div>
              <div className="match-column">
                <h4>Matches</h4>
                {[1, 2, 3, 4].map(pair => (
                  <input
                    key={`match${pair}`}
                    type="text"
                    placeholder={`Match ${pair}`}
                    value={answer[`match${pair}`] || ''}
                    onChange={(e) => handleMatchChange(pair, 'match', e.target.value)}
                    className="match-item-input"
                  />
                ))}
              </div>
            </div>
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
    if (!autoCorrect) return null;

    switch (questionType) {
      case 'mcq':
        return (
          <div className="answer-section">
            <label>Correct Answer</label>
            <div className="options-grid">
              {['A', 'B', 'C', 'D'].map(option => (
                <label key={option} className="option-radio">
                  <input
                    type="radio"
                    name="correctOption"
                    value={option}
                    checked={answer.correctOption === option}
                    onChange={handleAnswerChange}
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
            <label>Correct Answer</label>
            <div className="options-row">
              <label className="option-radio">
                <input
                  type="radio"
                  name="trueFalseAnswer"
                  value="true"
                  checked={answer.trueFalseAnswer === 'true'}
                  onChange={handleAnswerChange}
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
            <label>Model Answer</label>
            <textarea
              name="modelAnswer"
              value={answer.modelAnswer || ''}
              onChange={handleAnswerChange}
              placeholder="Enter the expected answer"
              rows={4}
              className="model-answer"
            />
          </div>
        );

      case 'match':
        return (
          <div className="answer-section">
            <label>Correct Matches</label>
            <div className="match-pairs">
              {[1, 2, 3, 4].map(pair => (
                <div key={pair} className="match-pair-row">
                  <span className="match-pair-label">Pair {pair}:</span>
                  <select
                    value={answer[`correctMatch${pair}`] || ''}
                    onChange={(e) => handleAnswerChange({
                      target: { name: `correctMatch${pair}`, value: e.target.value }
                    })}
                    className="match-pair-select"
                  >
                    <option value="">Select match</option>
                    {[1, 2, 3, 4].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

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
            >
              Back
            </button>
            <button
              type="submit"
              className="nav-button next"
              disabled={!questionType || !questionText}
              onClick={handleSubmit}
            >
              {currentQuestion < examData.questionCount ? 'Next' : 'Finish'}
            </button>

            <button 
              className="dashboard-button"
              onClick={() => navigate('/dashboard')}
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
            
            <div className="answer-panel">
              <div className="auto-correct-toggle">
                <label>Enable auto-correction?</label>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    id="autoCorrect"
                    checked={autoCorrect}
                    onChange={handleAutoCorrectChange}
                  />
                  <label htmlFor="autoCorrect" className="switch" />
                </div>
              </div>

              {renderAnswerInput()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddExam2;