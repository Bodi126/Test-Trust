import React, { useState, useRef } from 'react';
import './SignupPage.css';
import Logo from './images/Logo.jpg';
import { useNavigate } from 'react-router-dom';
// import Logo from './path-to-your-logo.svg';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    nationalId: '',
    section: '',
    department: '',
    academicYear: '',
    idPhoto: null
  });

  const [errors, setErrors] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fullName.trim() || formData.fullName.split(' ').length < 4) {
      newErrors.fullName = 'Please enter your full name (up to fourth name)';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.nationalId.trim()) {
      newErrors.nationalId = 'National ID is required';
    }
    
    if (!formData.section.trim()) {
      newErrors.section = 'Section is required';
    }
    
    if (!formData.department) {
      newErrors.department = 'Please select a department';
    }
    
    if (!formData.academicYear) {
      newErrors.academicYear = 'Please select academic year';
    }
    
    if (!formData.idPhoto) {
      newErrors.idPhoto = 'ID photo is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        idPhoto: file
      }));
      setErrors(prev => ({ ...prev, idPhoto: null }));

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const navigate = useNavigate(); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        const formDataToSend = new FormData();
        formDataToSend.append('fullName', formData.fullName);
        formDataToSend.append('email', formData.email);
        formDataToSend.append('password', formData.password);
        formDataToSend.append('nationalId', formData.nationalId);
        formDataToSend.append('section', formData.section);
        formDataToSend.append('department', formData.department);
        formDataToSend.append('academicYear', formData.academicYear);
        if (formData.idPhoto) {
          formDataToSend.append('idPhoto', formData.idPhoto);
        }

        const res = await fetch('http://localhost:5000/api/auth_stu/register', {
          method: 'POST',
          body: formDataToSend
        });

        const data = await res.json();
        if (res.ok) {
          alert('Student registered successfully! Please login with your credentials.');
          navigate('/login'); 
        } else {
          alert(data.message || 'Registration failed');
        }

      } catch (error) {
        console.error('Registration error:', error);
        alert('Failed to register. Please try again.');
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="signup-container">
    
      
      <div className="signup-content">
        <h1 className="signup-title">Student Registration</h1>
        
        <div className="signup-form-container">
          {/* First Column - Form with Validation */}
          <div className="form-section">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="fullName">Full Name</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name (up to fourth name)"
                  className={errors.fullName ? 'error' : ''}
                />
                {errors.fullName && <span className="error-message">{errors.fullName}</span>}
                <small className="hint">Please include up to your fourth name if applicable</small>
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password (min 6 characters)"
                  className={errors.password ? 'error' : ''}
                />
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className={errors.confirmPassword ? 'error' : ''}
                />
                {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="nationalId">National ID</label>
                <input
                  type="text"
                  id="nationalId"
                  name="nationalId"
                  value={formData.nationalId}
                  onChange={handleChange}
                  placeholder="Enter your national ID"
                  className={errors.nationalId ? 'error' : ''}
                />
                {errors.nationalId && <span className="error-message">{errors.nationalId}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="department">Department</label>
                <select
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className={errors.department ? 'error' : ''}
                >
                  <option value="">Select Department</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                </select>
                {errors.department && <span className="error-message">{errors.department}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="section">Section</label>
                <input
                  type="text"
                  id="section"
                  name="section"
                  value={formData.section}
                  onChange={handleChange}
                  placeholder="Enter your section"
                  className={errors.section ? 'error' : ''}
                />
                {errors.section && <span className="error-message">{errors.section}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="academicYear">Academic Year</label>
                <select
                  id="academicYear"
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleChange}
                  className={errors.academicYear ? 'error' : ''}
                >
                  <option value="">Select Academic Year</option>
                  <option value="1">First Year</option>
                  <option value="2">Second Year</option>
                  <option value="3">Third Year</option>
                  <option value="4">Fourth Year</option>
                  <option value="5">Fifth Year</option>
                </select>
                {errors.academicYear && <span className="error-message">{errors.academicYear}</span>}
              </div>

              <div className="form-group">
                <label>ID Photo</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className={`upload-btn ${errors.idPhoto ? 'error-btn' : ''}`}
                  onClick={triggerFileInput}
                >
                  {formData.idPhoto ? 'Change Photo' : 'Upload ID Photo'}
                </button>
                {errors.idPhoto && <span className="error-message">{errors.idPhoto}</span>}
                {formData.idPhoto && (
                  <small className="file-info">{formData.idPhoto.name}</small>
                )}
              </div>
            </form>
          </div>

          {/* Second Column - ID Photo Preview */}
          <div className="preview-section">
            <h3>ID Photo Preview</h3>
            <div className="image-preview-container">
              {previewImage ? (
                <img src={previewImage} alt="ID Preview" className="preview-image" />
              ) : (
                <div className="placeholder">
                  <i className="fas fa-id-card"></i>
                  <p>Your ID photo will appear here</p>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="submit-section">
            <button 
              type="submit" 
              className="submit-btn" 
              onClick={handleSubmit}
            >
              Complete Registration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;