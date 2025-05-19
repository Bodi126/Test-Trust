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
    examDuration: '',
    totalMarks: '',
    questionCount: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setExamData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (Object.values(examData).every(val => val !== '')) {
      navigate('/AddExam2', { state: { examData } });
    } else {
      alert('Please fill all fields');
    }
  };

  const handleBack = () => {
    navigate('/dashboard'); // Navigate back to dashboard
  };

  return (
    <div className="add-exam-container">
      <div className="exam-header">
        <h1>Hey Again! Time For A New Exam</h1>
        <p className="subtitle">Let's get started with some basic information</p>
      </div>

      <form onSubmit={handleSubmit} className="exam-form">
        <div className="form-grid">
          {/* Department Field */}
          <div className="form-group">
            <label>Department</label>
            <select 
              name="department" 
              value={examData.department} 
              onChange={handleChange}
              required
            >
              <option value="">Select Department</option>
              <option value="cs">Computer Science</option>
              <option value="eng">Engineering</option>
              <option value="med">Medicine</option>
              <option value="bus">Business</option>
            </select>
          </div>

          {/* Year Field */}
          <div className="form-group">
            <label>Year</label>
            <select 
              name="year" 
              value={examData.year} 
              onChange={handleChange}
              required
            >
              <option value="">Select Year</option>
              <option value="1">First Year</option>
              <option value="2">Second Year</option>
              <option value="3">Third Year</option>
              <option value="4">Fourth Year</option>
            </select>
          </div>

          {/* Subject Field */}
          <div className="form-group">
            <label>Subject</label>
            <input
              type="text"
              name="subject"
              placeholder="Enter subject name"
              value={examData.subject}
              onChange={handleChange}
              required
            />
          </div>

          {/* Student Count Field */}
          <div className="form-group">
            <label>No. Of Students</label>
            <input
              type="number"
              name="studentCount"
              min="1"
              placeholder="Enter number of students"
              value={examData.studentCount}
              onChange={handleChange}
              required
            />
          </div>

          {/* Exam Date Field */}
          <div className="form-group">
            <label>Exam Date</label>
            <input
              type="date"
              name="examDate"
              value={examData.examDate}
              onChange={handleChange}
              required
            />
          </div>

          {/* Exam Duration Field */}
          <div className="form-group">
            <label>Exam Duration (minutes)</label>
            <input
              type="number"
              name="examDuration"
              min="1"
              placeholder="Enter duration in minutes"
              value={examData.examDuration}
              onChange={handleChange}
              required
            />
          </div>

          {/* Total Marks Field */}
          <div className="form-group">
            <label>Total Mark</label>
            <input
              type="number"
              name="totalMarks"
              min="1"
              placeholder="Enter total marks"
              value={examData.totalMarks}
              onChange={handleChange}
              required
            />
          </div>

          {/* Question Count Field */}
          <div className="form-group">
            <label>No. Of Exam Questions</label>
            <input
              type="number"
              name="questionCount"
              min="1"
              placeholder="Enter number of questions"
              value={examData.questionCount}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            className="back-button"
            onClick={handleBack}
          >
            ← Back to Dashboard
          </button>
          <button type="submit" className="next-button" onClick={handleSubmit}>
            Continue to Questions →
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddExam1;