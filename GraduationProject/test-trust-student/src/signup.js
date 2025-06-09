import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './signup.css';
import Logo from './logo.svg';
import App from './App';
import Login from './login';
import HomePage from './App';


const Navbar3 = () => {
  return (
    <nav className="navbar3">
      <div className="nav-left">
        <a href="/" className="nav-link">Home</a>
        <a href="#dive-into" className="nav-link">Dive Into</a>
        <a href="#about-us" className="nav-link">About Us</a>
      </div>
      <div className="nav-right">
        <img src={Logo.svg} alt="App Logo" className="logo" />
      </div>
    </nav>
  );
};

function login3() {
  return (
    <Router>
      <div className="login3">
        <Navbar3 />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          {/* Other routes would go here */}
        </Routes>
      </div>
    </Router>
  );
}

const SignUp = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    codeId: '',
    academicYear: '',
    email: '',
    confirmEmail: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle signup logic here
    console.log(formData);
  };

  return (
    <div className="app-container">
      
      <div className="signup-container">
        <form onSubmit={handleSubmit} className="signup-form">
          <h2>Create Account</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="codeId">Code ID</label>
              <input
                type="text"
                id="codeId"
                name="codeId"
                value={formData.codeId}
                onChange={handleChange}
                
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="academicYear">Academic Year</label>
              <input
                type="text"
                id="academicYear"
                name="academicYear"
                value={formData.academicYear}
                onChange={handleChange}
                
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmEmail">Confirm Email</label>
            <input
              type="email"
              id="confirmEmail"
              name="confirmEmail"
              value={formData.confirmEmail}
              onChange={handleChange}
              
            />
          </div>
          
          <button type="submit" className="create-account-btn">Create Account</button>
          
          <div className="login-prompt">
            Already have an account? <a href="/login" className="login-link">Login</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUp;