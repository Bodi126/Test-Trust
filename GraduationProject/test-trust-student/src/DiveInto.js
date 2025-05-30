// src/pages/DiveInto.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import App from './App';
import Login from './login';
import SignUp from './signup';
import Logo from './logo.svg';
import HomePage from './App';
import './DiveInto.css'; 



const Navbar5 = () => {
  return (
    <nav className="navbar5">
      <div className="nav-left">
        <a href="/" className="nav-link">Home</a>
        <a href="#dive-into" className="nav-link">Dive Into</a>
        <a href="#about-us" className="nav-link">About Us</a>
      </div>
      <img src={Logo.svg} alt="App Logo" className="logo" />
      <div className="nav-right">
        
        <div className="auth-buttons">
          <a href="/login" className="btn login-btn">Login</a>
          <a href="/signup" className="btn signup-btn">Sign Up</a>
        </div>
      </div>
    </nav>
  );
}; 

function login5() {
  return (
    <Router>
      <div className="login5">
        <Navbar5 />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          
          {/* Other routes would go here */}
        </Routes>
      </div>
    </Router>
  );
}


const DiveInto = () => {
  return (
    <div className="dive-into-page">
      <div className="content-container">
        <h1>Dive Into Our Examination System</h1>
        <p className="subtitle">Explore the features and capabilities of our platform</p>
        
        <div className="features-container">
          <div className="feature-card">
            <h2>📝 Take Exams</h2>
           <p>Access your scheduled exams with a simple click. Our intuitive interface makes test-taking stress-free.</p>
          </div>
          
          <div className="feature-card">
            <h2>⏰ Exam Schedule</h2>
            <p>Never miss an exam with our personalized calendar and reminder system.</p>

          </div>
          
          <div className="feature-card">
            <h2>🛡️ Security</h2>
            <p>Advanced proctoring features including browser lockdown and activity monitoring.</p>
          </div>
        </div>
        
        <div className="cta-section">
          <p>Ready to get started?</p>
          <Link to="/signup" className="cta-button">Create Account</Link>
          <span className="login-prompt">
            Already have an account? <Link to="/login" className="login-link">Login</Link>
          </span>
        </div>
      </div>
    </div>
  );
};

export default DiveInto;