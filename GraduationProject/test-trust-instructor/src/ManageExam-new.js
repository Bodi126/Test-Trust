import React, { useState, useEffect } from 'react';
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
  const [expandedExam, setExpandedExam] = useState(null);
  const [editingExam, setEditingExam] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    department: '',
    year: '',
    subject: ''
  });
  const navigate = useNavigate();

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

  // Fetch exams on component mount
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const userEmail = localStorage.getItem('userEmail');
        if (!userEmail) {
          setError('User not logged in.');
          setLoading(false);
          return;
        }
        const response = await fetch(`http://localhost:5000/api/auth/my-exams?user=${encodeURIComponent(userEmail)}`);
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

  // Filter exams based on search and filters
  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.subject?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         exam.doctor?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilters = 
      (filters.department === '' || exam.department === filters.department) &&
      (filters.year === '' || exam.year === filters.year) &&
      (filters.subject === '' || exam.subject?.includes(filters.subject));
    return matchesSearch && matchesFilters;
  });

  const handleDelete = async (examId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/auth/exams/${examId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setExams(exams.filter(exam => exam._id !== examId));
        if (expandedExam === examId) setExpandedExam(null);
        if (editingExam === examId) setEditingExam(null);
      } else {
        const error = await response.json();
        console.error('Failed to delete exam:', error.message);
      }
    } catch (error) {
      console.error('Error deleting exam:', error);
    }
  };

  const handleSave = async (updatedExam) => {
    try {
      const response = await fetch(`http://localhost:5000/api/auth/exams/${updatedExam._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updatedExam)
      });

      if (response.ok) {
        const data = await response.json();
        setExams(exams.map(exam => exam._id === data._id ? data : exam));
        setEditingExam(null);
      } else {
        const error = await response.json();
        console.error('Failed to update exam:', error.message);
      }
    } catch (error) {
      console.error('Error updating exam:', error);
    }
  };

  const getSubjectIcon = (subject) => {
    return subjectIcons[subject] || subjectIcons['Default'];
  };

  // Edit Exam Form Component
  const EditExamForm = ({ exam, onSave, onCancel }) => {
    const [editedExam, setEditedExam] = useState({
      ...exam,
      department: exam.department || '',
      details: {
        duration: (exam.details && exam.details.duration) || 60,
        totalMarks: (exam.details && exam.details.totalMarks) || 100,
        instructions: (exam.details && exam.details.instructions) || ''
      },
      questionsList: exam.questionsList || []
    });

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setEditedExam(prev => ({
        ...prev,
        [name]: value
      }));
    };

    const handleDetailsChange = (e) => {
      const { name, value } = e.target;
      setEditedExam(prev => ({
        ...prev,
        details: {
          ...prev.details,
          [name]: value
        }
      }));
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      onSave(editedExam);
    };

    return (
      <motion.div
        className="edit-exam-form-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <form onSubmit={handleSubmit} className="edit-exam-form">
          <div className="form-header">
            <h2>Edit Exam</h2>
            <button type="button" className="close-btn" onClick={onCancel}>
              <FiX />
            </button>
          </div>
          
          <div className="form-group">
            <label>Subject</label>
            <input
              type="text"
              name="subject"
              value={editedExam.subject || ''}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Department</label>
              <select
                name="department"
                value={editedExam.department || ''}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Department</option>
                <option value="cs">Computer Science</option>
                <option value="eng">Engineering</option>
                <option value="med">Medicine</option>
                <option value="bus">Business</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Duration (minutes)</label>
              <input
                type="number"
                name="duration"
                value={editedExam.details.duration || 60}
                onChange={handleDetailsChange}
                min="1"
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Instructions</label>
            <textarea
              name="instructions"
              value={editedExam.details.instructions || ''}
              onChange={handleDetailsChange}
              rows="3"
            />
          </div>
          
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onCancel}>
              <FiX /> Cancel
            </button>
            <button type="submit" className="save-btn">
              <FiSave /> Save Changes
            </button>
          </div>
        </form>
      </motion.div>
    );
  };

  return (
    <div className="manage-exams-container">
      <div className="page-header">
        <h1 className="page-title">Exam Management</h1>
        <button 
          className="back-to-dashboard-btn"
          onClick={() => navigate('/dashboard')}
        >
          <FiArrowLeft className="btn-icon" />
          <span>Back to Dashboard</span>
        </button>
      </div>
      
      <div className="search-filter-container">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search exams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-dropdown">
          <FaFilter className="filter-icon" />
          <select
            value={filters.department}
            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
          >
            <option value="">All Departments</option>
            <option value="cs">Computer Science</option>
            <option value="eng">Engineering</option>
            <option value="med">Medicine</option>
            <option value="bus">Business</option>
          </select>
        </div>
      </div>

      <div className="exams-list">
        {loading ? (
          <div className="loading">Loading exams...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : filteredExams.length === 0 ? (
          <div className="no-results">No exams found</div>
        ) : (
          <AnimatePresence>
            {filteredExams.map((exam) => (
              <motion.div
                key={exam._id}
                className="exam-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div 
                  className="exam-card-content"
                  onClick={() => setExpandedExam(expandedExam === exam._id ? null : exam._id)}
                >
                  <div className="exam-subject">
                    <div className="exam-subject-icon">
                      {getSubjectIcon(exam.subject)}
                    </div>
                    <div>
                      <div className="exam-title">{exam.subject || 'Untitled Exam'}</div>
                      <div className="exam-meta">
                        <span><strong>Dept:</strong> {exam.department || 'N/A'}</span>
                        <span><strong>Questions:</strong> {exam.questions || exam.questionCount || 0}</span>
                      </div>
                    </div>
                  </div>
                  <div className="exam-date">
                    {formatDate(exam.date || exam.examDate)}
                    {exam.examTime && ` • ${exam.examTime}`}
                  </div>
                  <div className="exam-stats">
                    <span className="students-count">
                      {exam.students || exam.studentCount || 0} students
                    </span>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedExam === exam._id && (
                    <motion.div
                      className="exam-actions"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <button 
                        type="button"
                        className="action-btn view-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('View exam:', exam._id);
                        }}
                      >
                        <FiEye className="btn-icon" /> View
                      </button>
                      <button 
                        type="button"
                        className="action-btn edit-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingExam(editingExam === exam._id ? null : exam._id);
                        }}
                      >
                        <FiEdit className="btn-icon" /> Edit
                      </button>
                      <button 
                        type="button"
                        className="action-btn delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Are you sure you want to delete this exam?')) {
                            handleDelete(exam._id);
                          }
                        }}
                      >
                        <FiTrash2 className="btn-icon" /> Delete
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {editingExam === exam._id && (
                  <EditExamForm
                    exam={exam}
                    onSave={handleSave}
                    onCancel={() => setEditingExam(null)}
                  />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default ManageExam;
