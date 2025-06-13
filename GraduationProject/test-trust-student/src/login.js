import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './login.css';
import App from './App';
import SignUp from './signup';
import Logo from './images/Logo.jpg';
import HomePage from './App';
import { useNavigate } from 'react-router-dom';
import socket from './socket'; 


const Navbar2 = () => {
  return (
    <nav className="navbar2">
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


function login2() {
  return (
    <Router>
      <div className="login2">
        <Navbar2 />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signup" element={<SignUp />} />
         {/* <Route path="/exam" element={<UpcomingExams />} /> */}
          {/* Other routes would go here */}
        </Routes>
      </div>
    </Router>
  );
}





const Login = () => {
  const [studentName, setStudentName] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const res = await fetch('http://localhost:5000/api/auth_stu/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: studentName.trim(), 
        nationalId: password   
      })
    });

    const data = await res.json();

    if (res.ok) {
      alert('Login successful');
      localStorage.setItem('studentName', data.student.fullName); 
      localStorage.setItem('studentId', data.student._id);
      localStorage.setItem('nationalId', data.student.nationalId);
      socket.emit('student_join', data.student._id);
      window.location.href = '/'; 
    } else {
      alert(data.message || 'User does not exist??');
    }
  } catch (error) {
    console.error(error);
    alert('Something went wrong');
  }
};


  return (


    <div className="app-container">
    
      <div className="login-container">
        <form onSubmit={handleSubmit} className="login-form">
          <h2>Student Login</h2>
          
          <div className="form-group">
            <label htmlFor="studentName">Student Name</label>
            <input
              type="text"
              id="studentName"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="form-options">
            <div className="remember-me">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="rememberMe">Remember me?</label> 
              <a href="#forgot-password" className="forgot-password">
              Forgot Password?
            </a>
            </div>
        
          </div>
          
          <button type="submit" className="login-button">Login</button>
            
          <div className="signup-prompt">
            Don't have an account? <a href="/signup" className="signup-link">Sign Up</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;