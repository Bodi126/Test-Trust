import React from 'react';
import { BrowserRouter as Router, Routes, Route,Link } from 'react-router-dom';
import './App.css';
import Login from './login';
import SignUp from './signup';
import Logo from './logo.svg';
import AboutUs from './AboutUs';
import DiveInto from './DiveInto';


// Navbar Component
const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="nav-left">

        <Link to="/" className="nav-link">Home</Link>
        <Link to="/dive-into" className="nav-link">Dive Into</Link>
        <Link to="/about-us" className="nav-link">About Us</Link>


        {/* <a href="/" className="nav-link">Home</a>
        <a href="#dive-into" className="nav-link">Dive Into</a>
        <a href="#about-us" className="nav-link">About Us</a> */}
        {/* <Link to="/about-us" className="AboutUs">About Us</Link> */}
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

// Main App Component with Home Page
function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
           <Route path="/about-us" element={<AboutUs />} />
           <Route path="/dive-into" element={<DiveInto />} />
          {/* Other routes would go here */}
        </Routes>
      </div>
    </Router>
  );
}

// Home Page Component
const HomePage = () => {
  return (
    <main className="main-content">
      <section className="hero-section">
        <div className="hero-content">
          <h1>Welcome to TestTrust</h1>
          <p>Your complete examination system for academic success</p>
          <div className="cta-buttons">
            <a href="/login" className="btn primary">Student Login</a>
            <a href="/signup" className="btn secondary">Register Now</a>
          </div>
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

// Reusable Feature Card Component
const FeatureCard = ({ icon, title, description }) => {
  return (
    <div className="feature-card">
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
};

export default App;