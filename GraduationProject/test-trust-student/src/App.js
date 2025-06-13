import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './App.css';
import Login from './login';
import SignupPage from './SignupPage';
import Logo from './images/Logo.jpg';
import AboutUs from './AboutUs';
import DiveInto from './DiveInto';
import PracticeTests from './PracticeTests';
import ExamPage from './ExamPage';

// Navbar Component
const Navbar = () => {
  const studentName = localStorage.getItem('studentName');

  const handleLogout = () => {
    localStorage.removeItem('studentName');
    window.location.href = '/';
  };

  return (
    <nav className="navbar">
      <div className="nav-left">
        <a href="/" className="nav-link">Home</a>
        <a href="/dive-into" className="nav-link">Dive Into</a>
        <a href="/about-us" className="nav-link">About Us</a>
      </div>
      <img src={Logo} alt="App Logo" className="logo" />
      <div className="nav-right">
        {studentName && (
          <div className="auth-logged">
            <div style={{ display: 'flex', alignItems: 'center', paddingRight: '20px', gap: '25px' }}>
              <span className="student-name">👋 {studentName.split(" ").slice(0, 2).join(" ")}</span>
              <button className="nav-link" onClick={handleLogout}>Logout</button>
            </div>
            <div style={{ marginTop: '20px' }}>
              <a href="/PracticeTests" className="btn primary">Upcoming Exams</a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

// Home Page Component
const HomePage = () => {
  const studentName = localStorage.getItem('studentName');
  return (
    <main className="main-content">
      <section className="hero-section">
        <div className="hero-content">
          <h1>Welcome to TestTrust</h1>
          <p>Your complete examination system for academic success</p>
          {!studentName && (
            <div className="cta-buttons">
              <a href="/login" className="btn primary">Student Login</a>
              <a href="/signup" className="btn secondary">Register Now</a>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

// FeatureCard
const FeatureCard = ({ icon, title, description }) => (
  <div className="feature-card">
    <div className="feature-icon">{icon}</div>
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
);

function AppContent() {
  const location = useLocation();
  const hideNavbar = location.pathname === '/ExamPage';

  return (
    <div className="app">
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/dive-into" element={<DiveInto />} />
        <Route path="/ExamPage" element={<ExamPage />} />
        <Route path="/PracticeTests" element={<PracticeTests />} />
      </Routes>
    </div>
  );
}

// App الأساسي
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
