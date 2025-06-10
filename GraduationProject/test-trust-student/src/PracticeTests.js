import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './PracticeTests.css';
import App from './App';
import SignUp from './signup';
import Logo from './images/Logo.jpg';
import HomePage from './App';
import UpcomingExams from './UpcomingExams';
import AboutUs from './AboutUs';
import DiveInto from './DiveInto';
import Login from './login';


const Navbar7 = () => {
  return (
    <nav className="navbar7">
      <div className="nav-left">
        <a href="/" className="nav-link">Home</a>
        <a href="#dive-into" className="nav-link">Dive Into</a>
        <a href="#about-us" className="nav-link">About Us</a>
      </div>
      <img src={Logo.svg} alt="App Logo" className="logo" />
      <div className="nav-right">
        
        <div className="auth-buttons">
          <a href="/login" className="btn login-btn">Logout</a>
          {/* <a href="/signup" className="btn signup-btn">Sign Up</a> */}
        </div>
      </div>
    </nav>
  );
}; 

function login7() {
  return (
    <Router>
      <div className="login7">
        <Navbar7 />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          {/* <Route path="/signup" element={<SignUp />} /> */}
          
          {/* Other routes would go here */}
        </Routes>
      </div>
    </Router>
  );
}



const PracticeTests = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState(null);

  const subjects = [
    { id: 'math', name: 'Mathematics', icon: '🧮', progress: 65 },
    { id: 'science', name: 'Science', icon: '🔬', progress: 42 },
    { id: 'literature', name: 'Literature', icon: '📚', progress: 78 },
    { id: 'history', name: 'History', icon: '🏛️', progress: 53 },
    { id: 'coding', name: 'Computer Science', icon: '💻', progress: 89 },
  ];

  const tests = [
    {
      id: 1,
      title: 'Algebra Fundamentals',
      subject: 'math',
      questions: 20,
      duration: 30,
      difficulty: 'Medium',
      taken: 1245,
      rating: 4.5,
      lastAttempt: '2023-10-15',
      badge: '🥈 Silver'
    },
    {
      id: 2,
      title: 'Chemical Reactions',
      subject: 'science',
      questions: 15,
      duration: 25,
      difficulty: 'Easy',
      taken: 892,
      rating: 4.2,
      badge: '🥉 Bronze'
    },
    {
      id: 3,
      title: 'Modernist Poetry',
      subject: 'literature',
      questions: 10,
      duration: 20,
      difficulty: 'Hard',
      taken: 567,
      rating: 4.7,
      badge: '🎖️ Classic'
    },
  ];

  const filteredTests = selectedSubject 
    ? tests.filter(test => test.subject === selectedSubject)
    : tests;

  return (
    <div className="practice-tests">
      <div className="practice-header">
        <h1>Practice Tests</h1>
        <p>Sharpen your skills with our interactive practice exams</p>
      </div>

      <div className="practice-container">
        <div className="subject-selector">
          <h2>Subjects</h2>
          <div className="subject-cards">
            {subjects.map(subject => (
              <div 
                key={subject.id}
                className={`subject-card ${selectedSubject === subject.id ? 'active' : ''}`}
                onClick={() => setSelectedSubject(
                  selectedSubject === subject.id ? null : subject.id
                )}
              >
                <div className="subject-icon">{subject.icon}</div>
                <h3>{subject.name}</h3>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${subject.progress}%` }}
                  ></div>
                </div>
                <span className="progress-text">{subject.progress}% Mastery</span>
              </div>
            ))}
          </div>
        </div>

        <div className="test-browser">
          <div className="test-filters">
            <div className="filter-tabs">
              <button 
                className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                All Tests
              </button>
              <button 
                className={`tab-btn ${activeTab === 'recent' ? 'active' : ''}`}
                onClick={() => setActiveTab('recent')}
              >
                Recently Taken
              </button>
              <button 
                className={`tab-btn ${activeTab === 'recommended' ? 'active' : ''}`}
                onClick={() => setActiveTab('recommended')}
              >
                Recommended
              </button>
            </div>
            <div className="search-box">
              <input type="text" placeholder="Search tests..." />
              <button>🔍</button>
            </div>
          </div>

          <div className="test-grid">
            {filteredTests.map(test => (
              <div key={test.id} className="test-card">
                <div className="test-badge">{test.badge}</div>
                <div className="test-header">
                  <h3>{test.title}</h3>
                  <span className={`difficulty ${test.difficulty.toLowerCase()}`}>
                    {test.difficulty}
                  </span>
                </div>
                <div className="test-meta">
                  <span>📝 {test.questions} questions</span>
                  <span>⏱️ {test.duration} mins</span>
                  <span>⭐ {test.rating}</span>
                  <span>👥 {test.taken} students</span>
                </div>
                <div className="test-actions">
                  <Link to={`/practice-test/${test.id}`} className="start-btn">
                    Start Test
                  </Link>
                  <button className="preview-btn">
                    Quick Preview
                  </button>
                </div>
                {test.lastAttempt && (
                  <div className="last-attempt">
                    Last attempted: {test.lastAttempt}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="motivation-section">
        <h2>Keep Going!</h2>
        <p>You've completed 12 practice tests this month. Aim for 20 to earn the Gold Scholar badge!</p>
        <div className="progress-tracker">
          <div className="progress-fill" style={{ width: '60%' }}></div>
          <span>12/20 tests</span>
        </div>
      </div>
    </div>
  );
};

export default PracticeTests;