import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTrash2, FiEdit, FiSave, FiX, FiEye, FiArrowLeft } from 'react-icons/fi';
import { FaSearch, FaFilter } from 'react-icons/fa';
import './ManageExam.css';
import { useNavigate } from 'react-router-dom';

const subjectIcons = {
  'Mathematics': '∫',
  'Physics': 'Φ',
  'Chemistry': '⚗',
  'Biology': '🧬',
  'Engineering': '⚙',
  'Medicine': '⚕',
  'Science': '🔬',
  'Default': '📝'
};

const ManageExam = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Format date for display with consistent formatting
  const formatDate = (dateString, includeTime = false) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      weekday: 'long'
    };
    
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
      options.hour12 = true;
    }
    
    return date.toLocaleDateString('en-US', options);
  };


  React.useEffect(() => {
    const fetchExams = async () => {
      try {
        const userEmail = localStorage.getItem('userEmail');
        if (!userEmail) {
          setError('User not logged in.');
          setLoading(false);
          return;
        }
        const response = await fetch(`http://localhost:5000/auth/my-exams?user=${encodeURIComponent(userEmail)}`);
        const data = await response.json();
        if (response.ok) {
          setExams(data.exams || []);
        } else {
          setError(data.message || 'Failed to fetch exams');
        }
      } catch (err) {
        setError('Error fetching exams');
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);


  const [expandedExam, setExpandedExam] = useState(null);
  const [editingExam, setEditingExam] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    department: '',
    year: '',
    subject: ''
  });

  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         exam.doctor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilters = 
      (filters.department === '' || exam.department === filters.department) &&
      (filters.year === '' || exam.year === filters.year) &&
      (filters.subject === '' || exam.subject.includes(filters.subject));
    return matchesSearch && matchesFilters;
  });

  const handleDelete = (id) => {
    setExams(exams.filter(exam => exam.id !== id));
    if (expandedExam === id) setExpandedExam(null);
    if (editingExam === id) setEditingExam(null);
  };

  const handleSave = (updatedExam) => {
    setExams(exams.map(exam => exam.id === updatedExam.id ? updatedExam : exam));
    setEditingExam(null);
  };

  const getSubjectIcon = (subject) => {
    return subjectIcons[subject] || subjectIcons['Default'];
  };

    const navigate = useNavigate();
  return (
    <div className="manage-exams-container">
      


    <div className="page-header">
     <h1 className="page-title">Exam Management</h1>   
    <button 
        className="back-to-dashboard-btn"
        onClick={() => navigate('/dashboard')} // Change this to your actual dashboard route
    >
        <FiArrowLeft className="btn-icon" />
        <span>Back to Dashboard</span>
    </button>
    
    </div>
      
      
      {/* Search and Filter Bar */}
      <div className="search-filter-bar">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search exams by subject or doctor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-dropdown">
          <FaFilter className="filter-icon" />
          <select
            value={filters.department}
            onChange={(e) => setFilters({...filters, department: e.target.value})}
          >
            <option value="">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Medicine">Medicine</option>
            <option value="Science">Science</option>
            <option value="Computer Science">Computer Science</option>
          </select>
        </div>
      </div>

      {/* Exams List */}
      <div className="exams-list-container">
        <div className="exams-list-header">
          <div>Subject</div>
          <div>Date</div>
          <div>Students</div>
          <div>Actions</div>
        </div>
        <div className="exams-list">
          {filteredExams.map(exam => (
            <React.Fragment key={exam.id || exam._id}>
              <div className="exam-card" onClick={() => setExpandedExam(expandedExam === exam.id ? null : exam.id)}>
                <div className="exam-subject">
                  <div className="exam-subject-icon">
                    {getSubjectIcon(exam.subject)}
                  </div>
                  <div>
                    <div>{exam.subject}</div>
                    <div className="exam-meta">
                      <span><strong>Dept:</strong> {exam.department || 'N/A'}</span>
                      <span><strong>Questions:</strong> {exam.questions || exam.questionCount || 0}</span>
                    </div>
                  </div>
                </div>
                <div className="exam-meta">
                  {formatDate(exam.date || exam.examDate)}
                  {exam.examTime && ` • ${exam.examTime}`}
                </div>
                <div className="exam-meta">{exam.students || exam.studentCount || 0} students</div>
                <div className="exam-actions">
                  <button 
                    className="exam-action-btn view"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedExam(expandedExam === exam.id ? null : exam.id);
                    }}
                  >
                    <FiEye/>
                  </button>
                  <button 
                    className="exam-action-btn edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingExam(editingExam === exam.id ? null : exam.id);
                    }}
                  >
                    <FiEdit/>
                  </button>
                  <button 
                    className="exam-action-btn delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(exam.id);
                    }}
                  >
                    <FiTrash2/>
                  </button>
                </div>
              </div>

              {/* Exam Details Section */}
              <AnimatePresence>
                {expandedExam === exam.id && (
                  <motion.div
                    className="exam-details"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <div className="details-grid">
                      <div className="details-section">
                        <h4>Exam Information</h4>
                        <div className="details-item">
                          <span className="details-item-label">Subject:</span>
                          <span className="details-item-value">{exam.subject || 'N/A'}</span>
                        </div>
                        <div className="details-item">
                          <span className="details-item-label">Year:</span>
                          <span className="details-item-value">{exam.year || 'N/A'}</span>
                        </div>
                        <div className="details-item">
                          <span className="details-item-label">Exam Date:</span>
                          <span className="details-item-value">{formatDate(exam.examDate)}</span>
                        </div>
                        <div className="details-item">
                          <span className="details-item-label">Exam Time:</span>
                          <span className="details-item-value">
                            {exam.examTime ? (() => {
                              try {
                                // Assuming examTime is in format 'HH:mm' (24-hour format)
                                const [hours, minutes] = exam.examTime.split(':');
                                const date = new Date();
                                date.setHours(parseInt(hours, 10));
                                date.setMinutes(parseInt(minutes, 10));
                                return date.toLocaleTimeString('en-US', { 
                                  hour: 'numeric', 
                                  minute: '2-digit',
                                  hour12: true 
                                });
                              } catch (e) {
                                return 'N/A';
                              }
                            })() : 'N/A'}
                          </span>
                        </div>
                        <div className="details-item">
                          <span className="details-item-label">Department:</span>
                          <span className="details-item-value">{exam.department || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="details-section">
                        <h4>Exam Specifications</h4>
                        <div className="details-item">
                          <span className="details-item-label">Duration:</span>
                          <span className="details-item-value">
                            {exam.examDuration ? `${exam.examDuration} minutes` : 'N/A'}
                          </span>
                        </div>
                        <div className="details-item">
                          <span className="details-item-label">Total Marks:</span>
                          <span className="details-item-value">{exam.totalMarks || 'N/A'}</span>
                        </div>
                        <div className="details-item">
                          <span className="details-item-label">Questions:</span>
                          <span className="details-item-value">{exam.questionCount || 'N/A'}</span>
                        </div>
                        <div className="details-item">
                          <span className="details-item-label">Students:</span>
                          <span className="details-item-value">{exam.studentCount || 'N/A'}</span>
                        </div>
                        <div className="details-item">
                          <span className="details-item-label">Auto Correction:</span>
                          <span className="details-item-value">
                            {exam.autoCorrection ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      </div>
                      <div className="details-section">
                        <h4>Instructions</h4>
                        <p>{exam.instructions?.instructions || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="exam-full-actions">
                      <button 
                        className="cancel-btn"
                        onClick={() => setExpandedExam(null)}
                      >
                        <FiX /> Close
                      </button>
                      <button 
                        className="save-btn"
                        onClick={() => setEditingExam(exam.id)}
                      >
                        <FiEdit /> Edit Exam
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Edit Exam Section */}
              <AnimatePresence>
                {editingExam === exam.id && (
                  <EditExamForm 
                    exam={exam} 
                    onSave={handleSave} 
                    onCancel={() => setEditingExam(null)}
                    getSubjectIcon={getSubjectIcon}
                  />
                )}
              </AnimatePresence>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

// Edit Exam Form Component
const EditExamForm = ({ exam, onSave, onCancel, getSubjectIcon }) => {
  const [editedExam, setEditedExam] = useState({
    ...exam,
    department: exam.department || '', // Make sure department is included
    details: {
      duration: exam.details?.duration || exam.examDuration || 60,
      totalMarks: exam.details?.totalMarks || exam.totalMarks || 100,
      ...exam.details
    },
    examDate: exam.examDate ? new Date(exam.examDate).toISOString().split('T')[0] : '',
    examTime: exam.examTime || '',
    examDuration: exam.examDuration || 60,
    questionsList: [],
    questions: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newQuestion, setNewQuestion] = useState({
    type: 'mcq',
    question: '',
    options: ['', '', '', ''],
    answer: '',
    autoCorrect: false
  });

  // Fetch questions and their model answers for this exam
  React.useEffect(() => {
    const fetchQuestionsAndAnswers = async () => {
      try {
        console.log('Fetching questions for exam ID:', exam._id);
        if (!exam._id) {
          throw new Error('No exam ID provided');
        }

        // 1. First, fetch all questions for the exam with their model answers
        const questionsResponse = await fetch(`http://localhost:5000/auth/exam-questions/${exam._id}`);
        
        if (!questionsResponse.ok) {
          const errorText = await questionsResponse.text();
          console.error('Error response:', errorText);
          throw new Error(`HTTP error! status: ${questionsResponse.status}`);
        }
        
        const questionsArray = await questionsResponse.json();
        console.log('Questions data received:', questionsArray);

        if (!Array.isArray(questionsArray)) {
          throw new Error('Invalid questions data received from server');
        }

        // Process each question and its model answer
        const processedQuestions = await Promise.all(questionsArray.map(async (question) => {
          // Convert question type to match the frontend format
          const frontendQuestionType = question.type === 'mcq' ? 'MCQ' : 
                                      question.type === 'trueFalse' ? 'TrueFalse' :
                                      question.type === 'written' ? 'Written' : 'MCQ';
          
          // Initialize answer and options
          let answer = '';
          let options = [];
          let modelAnswer = null;

          // Fetch model answer for this question if it exists
          try {
            const modelAnswerResponse = await fetch(`http://localhost:5000/auth/model-answers/question/${question._id}`);
            if (modelAnswerResponse.ok) {
              modelAnswer = await modelAnswerResponse.json();
              console.log('Model answer for question', question._id, ':', modelAnswer);
            }
          } catch (error) {
            console.error('Error fetching model answer for question', question._id, ':', error);
          }
          
          // Process the answer based on question type
          if (modelAnswer?.answer) {
            if (question.type === 'mcq') {
              // For MCQ, answer is the correct option from the options array
              answer = modelAnswer.answer.correctOption || '';
              options = Array.isArray(modelAnswer.answer.options) ? 
                        [...modelAnswer.answer.options] : 
                        (Array.isArray(question.options) ? [...question.options] : []);
              console.log('MCQ answer data:', { answer, options });
            } else if (question.type === 'trueFalse') {
              // For True/False, answer is 'True' or 'False'
              answer = modelAnswer.answer.correctOption === true ? 'True' : 'False';
              console.log('True/False answer:', answer);
            } else if (question.type === 'written') {
              // For Written, answer is the modelAnswer text
              answer = modelAnswer.answer.modelAnswer || '';
              console.log('Written answer:', answer);
            }
          } else {
            console.log('No model answer found for question:', question._id);
            // Fallback to question's own options if no model answer
            if (question.type === 'mcq' && Array.isArray(question.options)) {
              options = [...question.options];
            }
          }
          
          // If no options from modelAnswer, use the ones from question
          if (!options.length && question.type === 'mcq' && Array.isArray(question.options)) {
            options = [...question.options];
          }
          
          // Prepare the question object with all necessary fields
          const processedQuestion = {
            ...question,
            _id: question._id,
            type: frontendQuestionType,
            question: question.question || 'No question text',
            options: options,
            answer: answer,  // The actual answer value for the UI
            modelAnswer: modelAnswer,  // The full model answer object
            number: parseInt(question.number) || 1,
            autoCorrect: question.autoCorrect || false
          };
          
          console.log('Processed question:', {
            id: processedQuestion._id,
            type: processedQuestion.type,
            answer: processedQuestion.answer,
            hasModelAnswer: !!processedQuestion.modelAnswer,
            options: processedQuestion.options
          });
          
          return processedQuestion;
        }));

        console.log('Processed questions:', processedQuestions);
        
        setEditedExam(prev => ({
          ...prev,
          questionsList: processedQuestions,
          questions: processedQuestions.length,
          type: exam.type || 'MCQ' // Ensure exam type is set
        }));

      } catch (err) {
        console.error('Error in fetchQuestionsAndAnswers:', err);
        setError(`Error: ${err.message}. Please check the console for more details.`);
      } finally {
        setLoading(false);
      }
    };

    if (exam?._id) {
      fetchQuestionsAndAnswers();
    } else {
      console.error('No valid exam ID found');
      setError('No exam ID provided');
      setLoading(false);
    }
  }, [exam?._id]);

  const handleQuestionChange = async (questionId, field, value) => {
    try {
      setLoading(true);
      
      // Update local state first for immediate UI update
      setEditedExam(prev => ({
        ...prev,
        questionsList: prev.questionsList.map(q => {
          if (q._id === questionId) {
            const updatedQuestion = { ...q, [field]: value };
            
            // If we're changing the answer, update the modelAnswer structure based on question type
            if (field === 'answer') {
              let answerObj = q.modelAnswer?.answer || {};
              
              if (q.type === 'mcq') {
                answerObj = {
                  ...answerObj,
                  correctOption: value,
                  options: q.options || []
                };
              } else if (q.type === 'trueFalse') {
                answerObj = {
                  ...answerObj,
                  correctOption: value === 'True'
                };
              } else if (q.type === 'written') {
                answerObj = {
                  ...answerObj,
                  modelAnswer: value
                };
              }
              
              updatedQuestion.modelAnswer = {
                ...(q.modelAnswer || {}),
                answer: answerObj,
                questionId: q._id  // Ensure questionId is set
              };
            }
            
            return updatedQuestion;
          }
          return q;
        })
      }));
      
      // Then update the backend
      const question = editedExam.questionsList.find(q => q._id === questionId);
      if (!question) return;
      
      // For answer changes, update the model answer in the backend
      if (field === 'answer') {
        const response = await fetch(`http://localhost:5000/auth/model-answers/question/${questionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answer: value })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update answer');
        }
      } else {
        // For other fields, update the question
        const response = await fetch(`http://localhost:5000/auth/questions/${questionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [field]: value })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update question');
        }
      }
    } catch (err) {
      console.error('Error updating question:', err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async () => {
    try {
      // Convert frontend question type to backend format
      const backendQuestionType = newQuestion.type.toLowerCase() === 'truefalse' ? 'trueFalse' : 
                                 newQuestion.type.toLowerCase() === 'written' ? 'written' : 'mcq';
      
      // First create the question
      const response = await fetch('http://localhost:5000/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newQuestion,
          examId: exam._id,
          type: backendQuestionType,
          number: (editedExam.questionsList?.length || 0) + 1
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to add question');
      }

      const createdQuestion = data.question;
      
      // Then create the corresponding model answer
      if (createdQuestion.answer) {
        const modelAnswerResponse = await fetch('http://localhost:5000/api/model-answers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            questionId: createdQuestion._id,
            answer: createdQuestion.answer
          })
        });

        if (!modelAnswerResponse.ok) {
          const errorData = await modelAnswerResponse.json();
          console.error('Failed to create model answer:', errorData.message);
        }
      }

      // Update local state with the new question and its model answer
      setEditedExam(prev => ({
        ...prev,
        questionsList: [
          ...(prev.questionsList || []), 
          {
            ...createdQuestion,
            modelAnswer: createdQuestion.answer || '',
            answer: createdQuestion.answer || '',
            options: createdQuestion.options || [],
            type: createdQuestion.type === 'mcq' ? 'MCQ' : 
                 createdQuestion.type === 'trueFalse' ? 'TrueFalse' :
                 createdQuestion.type === 'written' ? 'Written' : 'MCQ'
          }
        ],
        questions: (prev.questions || 0) + 1
      }));
      
      // Reset the form
      setNewQuestion({
        type: 'MCQ',
        question: '',
        options: ['', '', '', ''],
        answer: '',
        autoCorrect: false
      });

    } catch (err) {
      setError(`Error adding question: ${err.message}`);
      console.error('Error:', err);
    }
  };

  const handleDeleteQuestion = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/questions/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setEditedExam(prev => ({
          ...prev,
          questionsList: prev.questionsList.filter(q => q._id !== id),
          questions: Math.max((prev.questions || 1) - 1, 0)
        }));
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to delete question');
      }
    } catch (err) {
      setError('Error deleting question');
      console.error('Error:', err);
    }
  };

  return (
    <motion.div
      className="edit-exam-form"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="edit-exam-header">
        <h3>
          <div className="exam-subject-icon">
            {getSubjectIcon(editedExam.subject)}
          </div>
          Edit Exam: {editedExam.subject}
        </h3>
      </div>
      
      <div className="form-section">
        <h4>Basic Information</h4>
        <div className="form-grid">
          <div className="form-group">
            <label>Subject</label>
            <input
              type="text"
              value={editedExam.subject}
              onChange={(e) => setEditedExam({...editedExam, subject: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Department</label>
            <select
              value={editedExam.department}
              onChange={(e) => setEditedExam({...editedExam, department: e.target.value})}
            >
              <option value="">Select Department</option>
              <option value="cs">Computer Science</option>
              <option value="eng">Engineering</option>
              <option value="med">Medicine</option>
              <option value="bus">Business</option>
            </select>
          </div>
          <div className="form-group">
            <label>Year</label>
            <input
              type="text"
              value={editedExam.year}
              onChange={(e) => setEditedExam({...editedExam, year: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Exam Date</label>
            <input
              type="date"
              value={editedExam.examDate ? new Date(editedExam.examDate).toISOString().split('T')[0] : ''}
              onChange={(e) => setEditedExam({
                ...editedExam,
                examDate: e.target.value
              })}
            />
          </div>
          <div className="form-group">
            <label>Exam Time</label>
            <input
              type="time"
              value={editedExam.examTime || ''}
              onChange={(e) => setEditedExam({
                ...editedExam,
                examTime: e.target.value
              })}
            />
          </div>
          <div className="form-group">
            <label>Duration (minutes)</label>
            <input
              type="number"
              value={editedExam.examDuration || ''}
              onChange={(e) => setEditedExam({
                ...editedExam,
                examDuration: parseInt(e.target.value) || 0
              })}
            />
          </div>
          <div className="form-group">
            <label>Total Marks</label>
            <input
              type="number"
              value={editedExam.totalMarks || ''}
              onChange={(e) => setEditedExam({
                ...editedExam,
                totalMarks: parseInt(e.target.value) || 0
              })}
            />
          </div>
          <div className="form-group">
            <label>Number of Students</label>
            <input
              type="number"
              value={editedExam.studentCount || ''}
              onChange={(e) => setEditedExam({
                ...editedExam,
                studentCount: parseInt(e.target.value) || 0
              })}
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h4>Instructions</h4>
        <div className="form-group">
          <textarea
            value={editedExam.details.instructions}
            onChange={(e) => setEditedExam({
              ...editedExam,
              details: {...editedExam.details, instructions: e.target.value}
            })}
          />
        </div>
      </div>

      <div className="form-section">
        <h4>Questions ({editedExam.questionsList.length})</h4>
        <div className="questions-list">
          {editedExam.questionsList.map((question, index) => (
            <div key={question._id || index} className="question-card">
              <div className="question-header">
                <div className="question-number">Q{index + 1}</div>
                <div className="question-type">
                  <select
                    value={question.type}
                    onChange={(e) => handleQuestionChange(question._id, 'type', e.target.value)}
                  >
                    <option value="MCQ">Multiple Choice</option>
                    <option value="TrueFalse">True/False</option>
                    <option value="Written">Written</option>
                    <option value="Matching">Matching</option>
                  </select>
                </div>
                <button 
                  className="delete-question-btn"
                  onClick={() => handleDeleteQuestion(question._id)}
                >
                  <FiTrash2 />
                </button>
              </div>
              
              <div className="question-content">
                <div className="question-text-container">
                  <input
                    type="text"
                    className="question-text-input"
                    placeholder="Enter question text..."
                    value={question.question || ''}
                    onChange={(e) => handleQuestionChange(question._id, 'question', e.target.value)}
                  />
                </div>
                
                {/* Question Type Specific Rendering */}
                {question.type === 'MCQ' && (
                  <div className="mcq-options">
                    <h5>Options (select the correct one):</h5>
                    {[...(question.options || []), ''].map((option, idx) => {
                      // For existing options, use the option value, for new ones use empty string
                      const optionValue = option || '';
                      return (
                        <div key={idx} className="option-row">
                          <label className="option-container">
                            <input
                              type="radio"
                              name={`answer-${question._id}`}
                              checked={question.answer === optionValue}
                              onChange={() => handleQuestionChange(question._id, 'answer', optionValue)}
                              className="option-radio"
                            />
                            <span className="checkmark"></span>
                          </label>
                          <input
                            type="text"
                            className="option-input"
                            value={optionValue}
                            onChange={(e) => {
                              const newOptions = [...(question.options || [])];
                              const newValue = e.target.value;
                              
                              if (idx >= newOptions.length) {
                                newOptions.push(newValue);
                              } else {
                                newOptions[idx] = newValue;
                              }
                              
                              // Update options
                              const filteredOptions = newOptions.filter(opt => opt && opt.trim() !== '');
                              handleQuestionChange(question._id, 'options', filteredOptions);
                              
                              // If the edited option was the answer, update the answer
                              if (question.answer === optionValue) {
                                handleQuestionChange(question._id, 'answer', newValue);
                              } else if (question.answer && !filteredOptions.includes(question.answer)) {
                                // If current answer is not in options anymore, clear it
                                handleQuestionChange(question._id, 'answer', '');
                              }
                            }}
                            placeholder={`Option ${idx + 1}`}
                          />
                          {idx < (question.options?.length || 0) && (
                            <button 
                              className="remove-option-btn"
                              onClick={(e) => {
                                e.preventDefault();
                                const newOptions = [...(question.options || [])];
                                newOptions.splice(idx, 1);
                                handleQuestionChange(question._id, 'options', newOptions);
                                // If the removed option was the answer, clear the answer
                                if (question.answer === optionValue) {
                                  handleQuestionChange(question._id, 'answer', '');
                                }
                              }}
                            >
                              ×
                            </button>
                          )}
                        </div>
                      );
                    })}
                    {question.answer && question.answer.trim() !== '' && (
                      <div className="model-answer-display">
                        <strong>Correct Answer:</strong> {question.answer}
                      </div>
                    )}
                  </div>
                )}
                
                {question.type === 'TrueFalse' && (
                  <div className="truefalse-options">
                    <h5>Select the correct answer:</h5>
                    <div className="truefalse-option">
                      <label className="option-container">
                        <input
                          type="radio"
                          name={`answer-${question._id}`}
                          checked={question.answer === 'True'}
                          onChange={() => handleQuestionChange(question._id, 'answer', 'True')}
                          className="option-radio"
                        />
                        <span className="checkmark"></span>
                        <span className="option-label">True</span>
                      </label>
                    </div>
                    <div className="truefalse-option">
                      <label className="option-container">
                        <input
                          type="radio"
                          name={`answer-${question._id}`}
                          checked={question.answer === 'False'}
                          onChange={() => handleQuestionChange(question._id, 'answer', 'False')}
                          className="option-radio"
                        />
                        <span className="checkmark"></span>
                        <span className="option-label">False</span>
                      </label>
                    </div>
                    {question.answer && (
                      <div className="model-answer-display" style={{ marginTop: '10px', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                        <strong>Correct Answer:</strong> {question.answer}
                      </div>
                    )}
                  </div>
                )}
                
                {question.type === 'Written' && (
                  <div className="written-answer">
                    <h5>Model Answer:</h5>
                    <textarea
                      className="written-answer-textarea"
                      placeholder="Enter the model answer for this question..."
                      value={question.answer || ''}
                      onChange={(e) => handleQuestionChange(question._id, 'answer', e.target.value)}
                      rows={4}
                    />
                    {question.answer && question.answer.trim() !== '' && (
                      <div className="model-answer-display" style={{ marginTop: '10px' }}>
                        <strong>Current Answer:</strong>
                        <div style={{ marginTop: '5px', whiteSpace: 'pre-wrap' }}>{question.answer}</div>
                      </div>
                    )}
                  </div>
                )}
                
                {question.type === 'Matching' && (
                  <div className="matching-options">
                    <h5>Match the following items:</h5>
                    <div className="matching-pairs">
                      {[...(question.options || []), { left: '', right: '' }].map((pair, idx) => (
                        <div key={idx} className="matching-row">
                          <input
                            type="text"
                            className="matching-input"
                            value={pair.left || ''}
                            onChange={(e) => {
                              const newOptions = [...(question.options || [])];
                              if (idx >= newOptions.length) {
                                newOptions.push({ ...pair, left: e.target.value });
                              } else {
                                newOptions[idx] = { ...newOptions[idx], left: e.target.value };
                              }
                              handleQuestionChange(question._id, 'options', newOptions.filter(p => p.left.trim() !== '' || p.right.trim() !== ''));
                            }}
                            placeholder={`Item ${idx + 1}`}
                          />
                          <span className="matching-arrow">→</span>
                          <input
                            type="text"
                            className="matching-input"
                            value={pair.right || ''}
                            onChange={(e) => {
                              const newOptions = [...(question.options || [])];
                              if (idx >= newOptions.length) {
                                newOptions.push({ ...pair, right: e.target.value });
                              } else {
                                newOptions[idx] = { ...newOptions[idx], right: e.target.value };
                              }
                              handleQuestionChange(question._id, 'options', newOptions.filter(p => p.left.trim() !== '' || p.right.trim() !== ''));
                            }}
                            placeholder={`Matches with...`}
                          />
                          {idx < (question.options?.length || 0) && (
                            <button 
                              className="remove-pair-btn"
                              onClick={(e) => {
                                e.preventDefault();
                                const newOptions = [...(question.options || [])];
                                newOptions.splice(idx, 1);
                                handleQuestionChange(question._id, 'options', newOptions);
                              }}
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="add-question-form">
          <h5>Add New Question</h5>
          <div className="new-question-controls">
            <select
              value={newQuestion.type}
              onChange={(e) => setNewQuestion({...newQuestion, type: e.target.value})}
            >
              <option value="MCQ">Multiple Choice</option>
              <option value="TrueFalse">True/False</option>
              <option value="Written">Written</option>
              <option value="Matching">Matching</option>
            </select>
            <input
              type="text"
              placeholder="Question text"
              value={newQuestion.question}
              onChange={(e) => setNewQuestion({...newQuestion, question: e.target.value})}
            />
            <button onClick={handleAddQuestion}>
              <FiSave /> Add Question
            </button>
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button className="cancel-btn" onClick={onCancel}>
          <FiX /> Cancel
        </button>
        <button className="save-btn" onClick={() => onSave(editedExam)}>
          <FiSave /> Save Changes
        </button>
      </div>
    </motion.div>
  );
};

export default ManageExam;