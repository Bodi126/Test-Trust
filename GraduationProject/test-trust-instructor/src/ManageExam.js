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
                <div className="exam-meta">{exam.date || exam.examDate || 'N/A'}</div>
                <div className="exam-meta">{exam.students || exam.studentCount || 0} students</div>
                <div className="exam-actions">
                  <button 
                    className="exam-action-btn view"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedExam(expandedExam === exam.id ? null : exam.id);
                    }}
                  >
                    <FiEye />
                  </button>
                  <button 
                    className="exam-action-btn edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingExam(editingExam === exam.id ? null : exam.id);
                    }}
                  >
                    <FiEdit />
                  </button>
                  <button 
                    className="exam-action-btn delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(exam.id);
                    }}
                  >
                    <FiTrash2 />
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
                          <span className="details-item-value">{exam.subject}</span>
                        </div>
                        <div className="details-item">
                          <span className="details-item-label">Year:</span>
                          <span className="details-item-value">{exam.year}</span>
                        </div>
                        <div className="details-item">
                          <span className="details-item-label">Exam Date:</span>
                          <span className="details-item-value">{exam.date}</span>
                        </div>
                        <div className="details-item">
                          <span className="details-item-label">Department:</span>
                          <span className="details-item-value">{exam.department}</span>
                        </div>
                      </div>
                      <div className="details-section">
                        <h4>Exam Specifications</h4>
                        <div className="details-item">
                          <span className="details-item-label">Duration:</span>
                          <span className="details-item-value">{exams.examDuration?.examDuration || 'N/A'}</span>
                        </div>
                        <div className="details-item">
                          <span className="details-item-label">Total Marks:</span>
                          <span className="details-item-value">{exam.totalMarks?.totalMarks || 'N/A'}</span>
                        </div>
                        <div className="details-item">
                          <span className="details-item-label">Doctor:</span>
                          <span className="details-item-value">{exam.doctor}</span>
                        </div>
                        <div className="details-item">
                          <span className="details-item-label">Students:</span>
                          <span className="details-item-value">{exam.students}</span>
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
  const [editedExam, setEditedExam] = useState({...exam});
  const [newQuestion, setNewQuestion] = useState({
    type: 'MCQ',
    question: '',
    options: ['', '', '', ''],
    answer: ''
  });

  const handleQuestionChange = (questionId, field, value) => {
    setEditedExam(prev => ({
      ...prev,
      questionsList: prev.questionsList.map(q => 
        q.id === questionId ? { ...q, [field]: value } : q
      )
    }));
  };

  const handleAddQuestion = () => {
    const newId = Math.max(...editedExam.questionsList.map(q => q.id), 0) + 1;
    setEditedExam(prev => ({
      ...prev,
      questionsList: [...prev.questionsList, { ...newQuestion, id: newId }],
      questions: prev.questions + 1
    }));
    setNewQuestion({
      type: 'MCQ',
      question: '',
      options: ['', '', '', ''],
      answer: ''
    });
  };

  const handleDeleteQuestion = (id) => {
    setEditedExam(prev => ({
      ...prev,
      questionsList: prev.questionsList.filter(q => q.id !== id),
      questions: prev.questions - 1
    }));
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
              <option value="Engineering">Engineering</option>
              <option value="Medicine">Medicine</option>
              <option value="Science">Science</option>
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
              value={editedExam.date}
              onChange={(e) => setEditedExam({...editedExam, date: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Duration</label>
            <input
              type="text"
              value={editedExam.details.duration}
              onChange={(e) => setEditedExam({
                ...editedExam,
                details: {...editedExam.details, duration: e.target.value}
              })}
            />
          </div>
          <div className="form-group">
            <label>Total Marks</label>
            <input
              type="number"
              value={editedExam.details.totalMarks}
              onChange={(e) => setEditedExam({
                ...editedExam,
                details: {...editedExam.details, totalMarks: e.target.value}
              })}
            />
          </div>
          <div className="form-group">
            <label>Number of Students</label>
            <input
              type="number"
              value={editedExam.students}
              onChange={(e) => setEditedExam({
                ...editedExam,
                students: parseInt(e.target.value) || 0
              })}
            />
          </div>
          <div className="form-group">
            <label>Doctor/Instructor</label>
            <input
              type="text"
              value={editedExam.doctor}
              onChange={(e) => setEditedExam({
                ...editedExam,
                doctor: e.target.value
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
          {editedExam.questionsList.map(question => (
            <div key={question.id} className="question-card">
              <div className="question-header">
                <div className="question-number">Q{question.id}</div>
                <div className="question-type">
                  <select
                    value={question.type}
                    onChange={(e) => handleQuestionChange(question.id, 'type', e.target.value)}
                  >
                    <option value="MCQ">Multiple Choice</option>
                    <option value="TrueFalse">True/False</option>
                    <option value="Written">Written</option>
                    <option value="Matching">Matching</option>
                  </select>
                </div>
                <button 
                  className="delete-question-btn"
                  onClick={() => handleDeleteQuestion(question.id)}
                >
                  <FiTrash2 />
                </button>
              </div>
              
              <div className="question-content">
                <input
                  type="text"
                  placeholder="Question text"
                  value={question.question}
                  onChange={(e) => handleQuestionChange(question.id, 'question', e.target.value)}
                />
                
                {question.type === 'MCQ' && (
                  <div className="mcq-options">
                    {question.options.map((option, idx) => (
                      <div key={idx} className="option-row">
                        <input
                          type="radio"
                          name={`answer-${question.id}`}
                          checked={question.answer === option}
                          onChange={() => handleQuestionChange(question.id, 'answer', option)}
                        />
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...question.options];
                            newOptions[idx] = e.target.value;
                            handleQuestionChange(question.id, 'options', newOptions);
                          }}
                          placeholder={`Option ${idx + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                )}
                
                {question.type === 'TrueFalse' && (
                  <div className="truefalse-options">
                    <div className="truefalse-option">
                      <input
                        type="radio"
                        name={`answer-${question.id}`}
                        checked={question.answer === 'True'}
                        onChange={() => handleQuestionChange(question.id, 'answer', 'True')}
                      />
                      <span>True</span>
                    </div>
                    <div className="truefalse-option">
                      <input
                        type="radio"
                        name={`answer-${question.id}`}
                        checked={question.answer === 'False'}
                        onChange={() => handleQuestionChange(question.id, 'answer', 'False')}
                      />
                      <span>False</span>
                    </div>
                  </div>
                )}
                
                {question.type === 'Written' && (
                  <textarea
                    placeholder="Model answer for written question"
                    value={question.answer}
                    onChange={(e) => handleQuestionChange(question.id, 'answer', e.target.value)}
                  />
                )}
                
                {question.type === 'Matching' && (
                  <div className="matching-options">
                    <div className="matching-pairs">
                      {question.options && question.options.map((pair, idx) => (
                        <div key={idx} className="matching-row">
                          <input
                            type="text"
                            value={pair.left}
                            onChange={(e) => {
                              const newOptions = [...question.options];
                              newOptions[idx].left = e.target.value;
                              handleQuestionChange(question.id, 'options', newOptions);
                            }}
                            placeholder="Left item"
                          />
                          <span>→</span>
                          <input
                            type="text"
                            value={pair.right}
                            onChange={(e) => {
                              const newOptions = [...question.options];
                              newOptions[idx].right = e.target.value;
                              handleQuestionChange(question.id, 'options', newOptions);
                            }}
                            placeholder="Right match"
                          />
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