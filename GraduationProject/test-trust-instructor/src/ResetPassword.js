import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './ResetPassword.css';
import Logo from './images/Logo.jpg';

// Base URL for API requests
const API_BASE_URL = 'http://localhost:5000/api/auth';

function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const email = location.state?.email || '';

  useEffect(() => {
    // Redirect if no email or token is provided
    if (!location.state?.email || !location.state?.token) {
      navigate('/forgot-password');
    }
  }, [location.state, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear any previous errors
    setError('');
    
    // Validate password
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await axios.post(`${API_BASE_URL}/reset-password`, {
        email: location.state.email,
        token: location.state.token,
        newPassword: password
      });
      
      // If we get here, password was reset successfully
      alert('Your password has been reset successfully!');
      navigate('/login', { state: { passwordReset: true } });
    } catch (error) {
      console.error('Error resetting password:', error);
      const errorMessage = error.response?.data?.message || 'Failed to reset password. Please try again.';
      setError(errorMessage);
      
      // If token is invalid or expired, redirect back to forgot password
      if (error.response?.status === 400) {
        setTimeout(() => {
          navigate('/forgot-password');
        }, 3000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <button className="back-button" onClick={() => navigate('/login')}>
        <span className="arrow">←</span> Back
      </button>

      <div className="logo-container">
        <img src={Logo} alt="Company Logo" className="auth-logo" />
      </div>

      <div className="auth-card">
        <h2 className="auth-title">Reset Your Password</h2>
        {email && <p className="otp-instructions">For: {email}</p>}
        
        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          <div className="input-group">
            <label htmlFor="password">New Password</label>
            <input
              type="password"
              id="password"
              placeholder="Enter new password (min 8 characters)"
              className="auth-input"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
              required
              minLength="6"
            />
            <p className="password-hint">
              Use at least 6 characters
            </p>
          </div>

          <div className="input-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              placeholder="Confirm new password"
              className="auth-input"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (error) setError('');
              }}
              required
            />
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={isLoading}
          >
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;