import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Logo from './images/Logo.jpg';
import './App.css';
import AboutUs from './AboutUs';
import Login from './login';
import Signup from './signup';
import DiveInto from './DiveInto';
import Dashboard from './Dashboard'; 
import AddExam1 from './AddExam1';
import AddExam2 from './AddExam2';
import ManageExams from './ManageExam';


function App() {
  useEffect(() => {
    const shapes = document.querySelectorAll('.shape');
    
    const handleMouseMove = (e) => {
      shapes.forEach(shape => {
        const rect = shape.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        shape.style.setProperty('--mouse-x', `${x}px`);
        shape.style.setProperty('--mouse-y', `${y}px`);
      });
    };
  
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <Router>
      <div className="App">
        <nav className='app-navbar'>
          <div className="navbar-brand">
            <Link to="/">  {/* This will navigate to the home route */}
              <img src={Logo} className="app-logo" alt="TestTrust Logo" />
            </Link>
          </div>  
          
          <ul className='nav-menu'>
            <li className="nav-item">
              <Link to="/dive-into" className="nav-link">Dive Into</Link>
            </li>
            <li className="nav-item">
              <Link to="/about-us" className="nav-link">About Us</Link>
            </li>
            <li className="nav-item">
              <Link to="/signup" className="nav-link">Join Us</Link>
            </li>
          </ul>        
        </nav>

        <Routes>
          <Route path="/" element={
            <div className="main-content">
              <div className="content-wrapper">
                <h1>Welcome to the TestTrust Community!</h1>
                <p className="hero-description">
                  A comprehensive learning management system where educators can:
                </p>
                <ul className="feature-list">
                  <li>Create and manage assignments</li>
                  <li>Grade submissions efficiently</li>
                  <li>Add students and organize exams</li>
                  <li>Monitor live exams in real-time</li>
                  <li>Contribute to our open-source platform</li>
                </ul>
                <Link to="/login" className="cta-button">Get Started Now</Link>
              </div>
            </div>
          } />
          <Route path="/about-us" element={
            <div className="main-content">
              <AboutUs />
            </div>
          } />
          <Route path="/login" element={
            <div className="main-content">
              <Login />
            </div>
          } />
          <Route path="/signup" element={
            <div className="main-content">
              <Signup />
            </div>
          } />
          <Route path="/dive-into" element={
            <div className="main-content">
              <DiveInto />
            </div>
          } />
          {/* Add the Dashboard route */}
          <Route path="/dashboard" element={
            <div className="main-content">
              <Dashboard />
            </div>
          } />
          <Route path="/addexam1" element={
            <div className="main-content">
              <AddExam1 />
            </div>
          } />
          <Route path="/addexam2" element={
            <div className="main-content">
              <AddExam2 />
            </div>
          } />
          <Route path="/ManageExam" element={
            <div className="main-content">
              <ManageExams />
            </div>
          } />
        </Routes>

        <div className="background-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
        </div>
      </div>
    </Router>
  );
}

export default App;