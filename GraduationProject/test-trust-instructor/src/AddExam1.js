import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AddExam1.css';

const AddExam1 = () => {
  const navigate = useNavigate();
  const [examData, setExamData] = useState({
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setExamData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setExamData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const requiredFields = ['department', 'year', 'subject', 'studentCount', 
                          'examDate', 'examTime', 'examDuration', 'totalMarks', 'questionCount'];
    const isValid = requiredFields.every(field => examData[field] !== '');
    
    if (isValid) {
      navigate('/AddExam2', { state: { examData } });
    } else {
      alert('Please fill all required fields');
    }
  };

  const handleBack = () => navigate('/dashboard');

  return (
    <div className="add-exam-container">
      <div className="exam-header">
        <h1>Hey Again! Time For A New Exam</h1>
        <p className="subtitle">Let's get started with some basic information</p>
      </div>

      <form onSubmit={handleSubmit} className="exam-form">
        <div className="form-grid">
          <div className="form-group">
            <label>Department</label>
            <select name="department" value={examData.department} onChange={handleChange} required>
              <option value="">Select Department</option>
              <option value="cs">Computer Science</option>
              <option value="eng">Engineering</option>
              <option value="med">Medicine</option>
              <option value="bus">Business</option>
            </select>
          </div>

          <div className="form-group">
            <label>Year</label>
            <select name="year" value={examData.year} onChange={handleChange} required>
              <option value="">Select Year</option>
              <option value="1">First Year</option>
              <option value="2">Second Year</option>
              <option value="3">Third Year</option>
              <option value="4">Fourth Year</option>
            </select>
          </div>

          <div className="form-group">
            <label>Subject</label>
            <input type="text" name="subject" placeholder="Enter subject name"
              value={examData.subject} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>No. Of Students</label>
            <input type="number" name="studentCount" min="1" 
              placeholder="Enter number of students" value={examData.studentCount} 
              onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Exam Date</label>
            <input type="date" name="examDate" value={examData.examDate} 
              onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Exam Time</label>
            <input type="time" name="examTime" value={examData.examTime} 
              onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Exam Duration (minutes)</label>
            <input type="number" name="examDuration" min="1" 
              placeholder="Enter duration in minutes" value={examData.examDuration} 
              onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Total Mark</label>
            <input type="number" name="totalMarks" min="1" 
              placeholder="Enter total marks" value={examData.totalMarks} 
              onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>No. Of Exam Questions</label>
            <input type="number" name="questionCount" min="1" 
              placeholder="Enter number of questions" value={examData.questionCount} 
              onChange={handleChange} required />
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-container">
              <input type="checkbox" name="autoCorrection" 
                checked={examData.autoCorrection} onChange={handleCheckboxChange} />
              <span className="checkmark"></span>
              <span className="checkbox-label">
                Auto Correction
                <span className="tooltip">We'll correct the exam automatically (total marks will be distributed evenly)</span>
              </span>
            </label>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-container">
              <input type="checkbox" name="archiveExam" 
                checked={examData.archiveExam} onChange={handleCheckboxChange} />
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
          <button type="submit" className="next-button">
            Continue to Questions →
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddExam1;