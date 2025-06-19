import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Link } from 'react-router-dom';
import './App.css';
import Login from './login';
import SignupPage from './SignupPage';
import Logo from './images/Logo.jpg';
import AboutUs from './AboutUs';
import DiveInto from './DiveInto';
import PracticeTests from './PracticeTests';
import ExamPage from './ExamPage';
import ChatBot from './components/ChatBot/ChatBot';

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
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/dive-into" className="nav-link">Dive Into</Link>
        <Link to="/about-us" className="nav-link">About Us</Link>
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
              <Link to="/PracticeTests" className="btn primary">Upcoming Exams</Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

// Feature Card Component
const FeatureCard = ({ icon, title, description }) => {
  return (
    <div className="feature-card">
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
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
              <Link to="/login" className="btn primary">Student Login</Link>
              <Link to="/signup" className="btn secondary">Register Now</Link>
            </div>
          )}
        </div>
      </section>

      <section className="features-section">
        <h2>Why Choose Our Platform?</h2>
        <div className="features-grid">
          <FeatureCard
            icon="📝"
            title="Secure Exams"
            description="Tamper-proof examination system with advanced proctoring"
          />
          <FeatureCard
            icon="📊"
            title="Instant Results"
            description="Get your scores immediately after submission"
          />
          <FeatureCard
            icon="📚"
            title="Study Resources"
            description="Access to previous exams and study materials"
          />
        </div>
      </section>

      <section className="stats-section">
        <div className="stat-item">
          <h3>10,000+</h3>
          <p>Students</p>
        </div>
        <div className="stat-item">
          <h3>500+</h3>
          <p>Exams Conducted</p>
        </div>
        <div className="stat-item">
          <h3>99.9%</h3>
          <p>System Uptime</p>
        </div>
      </section>
    </main>
  );
};

// Main App Component
const AppContent = () => {
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
      <ChatBot />
    </div>
  );
};

// App Wrapper
const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;