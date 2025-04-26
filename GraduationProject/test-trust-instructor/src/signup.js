import './signup.css';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from './images/Logo.jpg';

function Signup() {
  const navigate = useNavigate();

  return (
    <div className="signup-container">
      {/* Back Button */}
      <button className="back-button" onClick={() => navigate('/')}>
        <span className="arrow">←</span> Back to Home
      </button>

      <div className="signup-content">
        {/* Form Section (Left) */}
        <div className="form-section">
          <div className="signup-card">
            <h2 className="signup-title">Create Your Account</h2>
            
            <form className="signup-form">
              <div className="name-row">
                <div className="input-group">
                  <label htmlFor="firstName">First Name</label>
                  <input 
                    type="text" 
                    id="firstName" 
                    placeholder="First name" 
                    className="signup-input"
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input 
                    type="text" 
                    id="lastName" 
                    placeholder="Last name" 
                    className="signup-input"
                  />
                </div>
              </div>

              <div className="ID-and-position-row">
                <div className="input-group">
                  <label htmlFor="idNumber">ID Number</label>
                  <input 
                    type="text" 
                    id="idNumber" 
                    placeholder="Enter ID number" 
                    className="signup-input"
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="position">Position</label>
                  <input 
                    type="text" 
                    id="position" 
                    placeholder="Your position" 
                    className="signup-input"
                  />
                </div>
              </div>

              <div className="Email-and-Password-row">
                <div className="input-group">
                  <label htmlFor="email">Email</label>
                  <input 
                    type="email" 
                    id="email" 
                    placeholder="Enter your email" 
                    className="signup-input"
                  />
                </div>
                <div className="input-group">
                    <label htmlFor="password">Password</label>
                    <input 
                    type="password" 
                    id="password" 
                    placeholder="Create password" 
                    className="signup-input"
                    />
                </div>
              </div>

              <div className="terms-row">
                <input type="checkbox" id="terms" />
                <label htmlFor="terms">I agree to the Terms and Conditions</label>
              </div>

              <button 
                type="button" 
                className="signup-button"
                onClick={() => navigate('/Dashboard')}
              >
                Create Account
              </button>
            </form>

            <div className="signup-footer">
              Already have an account? <span className="signup-link" onClick={() => navigate('/login')}>Sign in</span>
            </div>
          </div>
        </div>

        {/* Logo Section (Right) */}
        <div className="logo-section">
          <div className="logo-glow">
            <img src={Logo} alt="Company Logo" className="signup-logo" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;