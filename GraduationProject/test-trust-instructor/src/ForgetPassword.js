import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ForgetPassword.css';
import Logo from './images/Logo.jpg';

// Base URL for API requests
const API_BASE_URL = 'http://localhost:5000/api/auth';

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [debugOtp, setDebugOtp] = useState(''); // For development/testing only

  const handleSubmitEmail = async (e) => {
    e.preventDefault();
    if (!email) {
      alert('Please enter your email address');
      return;
    }
    
    try {
      console.log('Sending forgot password request for email:', email);
      setIsLoading(true);
      
      const requestData = { 
        email: email.trim().toLowerCase() 
      };
      
      console.log('Request data:', requestData);
      
      const response = await axios({
        method: 'post',
        url: `${API_BASE_URL}/forgot-password`,
        data: requestData,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        withCredentials: true,
        timeout: 10000 // 10 second timeout
      });
      
      console.log('Forgot password response:', response.data);
      
      if (response.data && response.data.success === false) {
        throw new Error(response.data.message || 'Failed to process request');
      }
      
      // Show success message and move to OTP step
      const message = response.data?.message || 'If your email exists in our system, you will receive an OTP';
      
      // In development, show OTP in the UI for testing
      if (process.env.NODE_ENV === 'development' && response.data?.otp) {
        setDebugOtp(response.data.otp);
      }
      
      alert(message);
      setStep(2);
    } catch (error) {
      console.error('Error in handleSubmitEmail:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        code: error.code
      });
      
      let errorMessage = 'Failed to process forgot password request';
      
      if (error.response) {
        // Server responded with an error status code
        errorMessage = error.response.data?.message || errorMessage;
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        // Something happened in setting up the request
        errorMessage = error.message || errorMessage;
      }
      
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      alert('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post(`${API_BASE_URL}/verify-reset-otp`, { 
        email, 
        otp 
      });
      
      if (response.data.token) {
        // Navigate to reset password page with email and token
        navigate('/ResetPassword', { 
          state: { 
            email,
            token: response.data.token
          } 
        });
      } else {
        alert('Failed to verify OTP. Please try again.');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      const errorMessage = error.response?.data?.message || 'Failed to verify OTP. Please try again.';
      alert(errorMessage);
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
        <h2 className="auth-title">
          {step === 1 ? 'Reset Your Password' : 'Verify Your Email'}
        </h2>
        
        {step === 1 ? (
          <form className="auth-form" onSubmit={handleSubmitEmail}>
            <p className="otp-instructions">
              Enter your email to receive a verification code
            </p>
            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                placeholder="Enter your registered email"
                className="auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button 
              type="submit" 
              className="auth-button"
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleVerifyOtp}>
            <p className="otp-instructions">
              Enter the 6-digit code sent to your email
              {debugOtp && (
                <div style={{
                  marginTop: '10px',
                  padding: '10px',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '4px',
                  textAlign: 'center',
                  fontWeight: 'bold'
                }}>
                  TEST MODE - OTP: {debugOtp}
                </div>
              )}
            </p>
            <div className="input-group">
              <label htmlFor="otp">Verification Code</label>
              <input
                type="text"
                id="otp"
                placeholder="Enter 6-digit code"
                className="auth-input"
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, ''); // Allow only numbers
                  setOtp(value.slice(0, 6)); // Limit to 6 digits
                }}
                inputMode="numeric"
                pattern="\d{6}"
                required
              />
            </div>
            <button 
              type="submit" 
              className="auth-button"
              disabled={isLoading}
            >
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </button>
            <p className="otp-resend">
              Didn't receive code? <span 
                className="auth-link" 
                onClick={() => setStep(1)}
              >
                Resend
              </span>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;