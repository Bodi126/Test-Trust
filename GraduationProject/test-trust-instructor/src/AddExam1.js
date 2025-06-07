import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AddExam1.css';
import axios from 'axios';

const validate = (values) => {
  const errors = {};
  if (!values.department?.trim()) errors.department = 'Department is required';
  if (!values.year?.trim()) errors.year = 'Year is required';
  if (!values.subject?.trim()) errors.subject = 'Subject is required';
  if (!values.studentCount) errors.studentCount = 'Student Count is required';
  if (!values.examDate) errors.examDate = 'Exam Date is required';
  if (!values.examTime) errors.examTime = 'Exam Time is required';
  if (!values.examDuration) errors.examDuration = 'Exam Duration is required';
  if (!values.totalMarks) errors.totalMarks = 'Total Marks is required';
  if (!values.questionCount) errors.questionCount = 'Question Count is required';
  return errors;
};

const AddExam1 = () => {
  const [values, setValues] = useState({
    department: '',
    year: '',
    subject: '',
    studentCount: '',
    examDate: '',
    examTime: '',
    examDuration: '',
    totalMarks: '',
    questionCount: '',
    autoCorrection: false,
    archiveExam: false
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    setValues(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');
    
    const validationErrors = validate(values);
    setErrors(validationErrors);
    
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const userEmail = localStorage.getItem('userEmail');
      if (!userEmail) {
        setSubmitError('User email not found. Please log in again.');
        setIsSubmitting(false);
        return;
      }
      const examData = {
        department: values.department.trim(),
        year: values.year.trim(),
        subject: values.subject.trim().toLowerCase(),
        studentCount: Number(values.studentCount),
        examDate: values.examDate,
        examTime: values.examTime,
        examDuration: Number(values.examDuration),
        totalMarks: Number(values.totalMarks),
        questionCount: Number(values.questionCount),
        autoCorrection: values.autoCorrection,
        archiveExam: values.archiveExam,
        status: 'draft',
        createdAt: new Date().toISOString(),
        createdBy: userEmail // Set the creator from localStorage
      };

      const response = await axios.post('http://localhost:5000/auth/AddExam1', examData);
      
      navigate('/AddExam2', { 
        state: { 
          examData: {
            ...examData,
            _id: response.data.examId
          }
        } 
      });
    } catch (error) {
      console.error('Error creating exam:', error);
      setSubmitError(
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Failed to create exam. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => navigate('/dashboard');

  return (
    <div className="add-exam-container">
      <div className="exam-header">
        <h1>Hey Again! Time For A New Exam</h1>
        <p className="subtitle">Let's get started with some basic information</p>
      </div>

      {submitError && (
        <div className="alert alert-error">
          <strong>Error:</strong> {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="exam-form">
        <div className="form-grid">
          <div className="form-group">
            <label>Department</label>
            <select 
              name="department" 
              value={values.department} 
              onChange={handleChange} 
              className={errors.department ? 'error-input' : ''}
            >
              <option value="">Select Department</option>
              <option value="cs">Computer Science</option>
              <option value="eng">Engineering</option>
              <option value="med">Medicine</option>
              <option value="bus">Business</option>
            </select>
            {errors.department && <span className="error">{errors.department}</span>}
          </div>

          <div className="form-group">
            <label>Year</label>
            <select 
              name="year" 
              value={values.year} 
              onChange={handleChange} 
              className={errors.year ? 'error-input' : ''}
            >
              <option value="">Select Year</option>
              <option value="1">First Year</option>
              <option value="2">Second Year</option>
              <option value="3">Third Year</option>
              <option value="4">Fourth Year</option>
            </select>
            {errors.year && <span className="error">{errors.year}</span>}
          </div>

          <div className="form-group">
            <label>Subject</label>
            <input 
              type="text" 
              name="subject" 
              placeholder="Enter subject name"
              value={values.subject} 
              onChange={handleChange} 
              className={errors.subject ? 'error-input' : ''}
            />
            {errors.subject && <span className="error">{errors.subject}</span>}
          </div>

          <div className="form-group">
            <label>No. Of Students</label>
            <input 
              type="number" 
              name="studentCount" 
              min="1" 
              placeholder="Enter number of students" 
              value={values.studentCount} 
              onChange={handleChange} 
              className={errors.studentCount ? 'error-input' : ''}
            />
            {errors.studentCount && <span className="error">{errors.studentCount}</span>}
          </div>

          <div className="form-group">
            <label>Exam Date</label>
            <input 
              type="date" 
              name="examDate" 
              value={values.examDate} 
              onChange={handleChange} 
              className={errors.examDate ? 'error-input' : ''}
              min={new Date().toISOString().split('T')[0]}
            />
            {errors.examDate && <span className="error">{errors.examDate}</span>}
          </div>

          <div className="form-group">
            <label>Exam Time</label>
            <input 
              type="time" 
              name="examTime" 
              value={values.examTime} 
              onChange={handleChange} 
              className={errors.examTime ? 'error-input' : ''}
            />
            {errors.examTime && <span className="error">{errors.examTime}</span>}
          </div>

          <div className="form-group">
            <label>Exam Duration (minutes)</label>
            <input 
              type="number" 
              name="examDuration" 
              min="1" 
              placeholder="Enter duration in minutes" 
              value={values.examDuration} 
              onChange={handleChange} 
              className={errors.examDuration ? 'error-input' : ''}
            />
            {errors.examDuration && <span className="error">{errors.examDuration}</span>}
          </div>

          <div className="form-group">
            <label>Total Mark</label>
            <input 
              type="number" 
              name="totalMarks" 
              min="1" 
              placeholder="Enter total marks" 
              value={values.totalMarks} 
              onChange={handleChange} 
              className={errors.totalMarks ? 'error-input' : ''}
            />
            {errors.totalMarks && <span className="error">{errors.totalMarks}</span>}
          </div>

          <div className="form-group">
            <label>No. Of Exam Questions</label>
            <input 
              type="number" 
              name="questionCount" 
              min="1" 
              placeholder="Enter number of questions" 
              value={values.questionCount} 
              onChange={handleChange} 
              className={errors.questionCount ? 'error-input' : ''}
            />
            {errors.questionCount && <span className="error">{errors.questionCount}</span>}
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-container">
              <input 
                type="checkbox" 
                name="autoCorrection" 
                checked={values.autoCorrection} 
                onChange={handleCheckboxChange} 
              />
              <span className="checkmark"></span>
              <span className="checkbox-label">
                Auto Correction
                <span className="tooltip">We'll correct the exam automatically (total marks will be distributed evenly)</span>
              </span>
            </label>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-container">
              <input 
                type="checkbox" 
                name="archiveExam" 
                checked={values.archiveExam} 
                onChange={handleCheckboxChange} 
              />
              <span className="checkmark"></span>
              <span className="checkbox-label">
                Archive Exam
                <span className="tooltip">Archive exams help students practice without penalties and contribute to our community</span>
              </span>
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="back-button" onClick={handleBack}>
            ← Back to Dashboard
          </button>
          <button 
            type="submit" 
            className="next-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner"></span> Creating Exam...
              </>
            ) : 'Continue to Questions →'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddExam1;