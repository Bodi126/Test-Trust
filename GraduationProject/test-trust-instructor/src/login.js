import './login.css';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from './images/Logo.jpg';

function Login() {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault(); // Prevent form submission reload
    navigate('/dashboard'); // Redirect to dashboard
  };

  return (
    <div className="auth-container">
      {/* Back Button */}
      <button className="back-button" onClick={() => navigate('/')}>
        <span className="arrow">←</span> Back
      </button>

      {/* Logo */}
      <div className="logo-container">
        <img src={Logo} alt="Company Logo" className="auth-logo" />
      </div>

      {/* Login Form */}
      <div className="auth-card">
        <h2 className="auth-title">Login to Your Account</h2>
        
        <form className="auth-form" onSubmit={handleLogin}>
          <div className="input-group">
            <label htmlFor="email">Email or ID</label>
            <input 
              type="text" 
              id="email" 
              placeholder="Enter your email or ID" 
              className="auth-input"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              placeholder="Enter your password" 
              className="auth-input"
            />
          </div>

          <div className="options-row">
            <div className="remember-me">
              <input type="checkbox" id="remember" />
              <label htmlFor="remember">Remember me</label>
            </div>
            <a href="#forgot" className="forgot-password">Forgot password?</a>
          </div>

          <button type="submit" className="auth-button">Login</button>
        </form>

        <div className="auth-footer">
          Don't have an account? <span className="auth-link" onClick={() => navigate('/signup')}>Sign up</span>
        </div>
      </div>
    </div>
  );
}

export default Login;