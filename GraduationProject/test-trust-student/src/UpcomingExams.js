import React from 'react';
import { BrowserRouter as Router, Routes, Route,Link } from 'react-router-dom';
import './App.css';
import HomePage from './App';
import Login from './login';
import SignUp from './signup';
import Logo from './logo.svg';
import AboutUs from './AboutUs';
import DiveInto from './DiveInto';
import './UpcomingExams.css';
import App from './App';

const Navbar6 = () => {
  return (
    <nav className="navbar6">
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

function login6() {
  return (
    <Router>
      <div className="login6">
        <Navbar6 />
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

const UpcomingExams = () => {
  const exams = [
    {
      id: 1,
      course: 'Advanced Mathematics',
      date: '2023-11-15',
      time: '09:00 AM',
      duration: '120 mins',
      type: 'Final Exam',
      preparation: 'Chapters 5-8',
      status: 'upcoming'
    },
    {
      id: 2,
      course: 'Computer Science',
      date: '2023-11-20',
      time: '02:00 PM',
      duration: '90 mins',
      type: 'Midterm',
      preparation: 'Algorithms & Data Structures',
      status: 'upcoming'
    },
    {
      id: 3,
      course: 'Literature',
      date: '2023-11-25',
      time: '10:30 AM',
      duration: '150 mins',
      type: 'Essay Exam',
      preparation: 'Modernist Period',
      status: 'upcoming'
    }
  ];

  return (
    <div className="upcoming-exams">
      <div className="exam-header">
        <h1>Your Exam Schedule</h1>
        <div className="exam-filters">
          <button className="filter-btn active">All Exams</button>
          <button className="filter-btn">This Week</button>
          <button className="filter-btn">By Subject</button>
        </div>
      </div>

      <div className="exam-timeline">
        {exams.map((exam, index) => (
          <div key={exam.id} className={`timeline-card ${exam.status}`}>
            <div className="timeline-marker">
              <div className="marker-circle"></div>
              {index !== exams.length - 1 && <div className="timeline-line"></div>}
            </div>
            <div className="exam-content">
              <div className="exam-main">
                <h3>{exam.course}</h3>
                <div className="exam-meta">
                  <span className="exam-date">
                    <i className="icon">📅</i> {exam.date} • {exam.time}
                  </span>
                  <span className="exam-duration">
                    <i className="icon">⏱️</i> {exam.duration}
                  </span>
                </div>
                <p className="exam-type">{exam.type}</p>
              </div>
              <div className="exam-details">
                <div className="preparation">
                  <h4>Preparation:</h4>
                  <p>{exam.preparation}</p>
                </div>
                <div className="exam-actions">
                  <Link to={`/study-materials/${exam.id}`} className="action-btn outline">
                    Study Materials
                  </Link>
                  <Link to={`/practice-exam/${exam.id}`} className="action-btn solid">
                    Practice Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="exam-stats">
        <div className="stat-card">
          <h3>Upcoming Exams</h3>
          <p className="stat-value">{exams.length}</p>
        </div>
        <div className="stat-card">
          <h3>Days Until Next Exam</h3>
          <p className="stat-value">5</p>
        </div>
        <div className="stat-card">
          <h3>Average Preparation</h3>
          <p className="stat-value">72%</p>
        </div>
      </div>
    </div>
  );
};

export default UpcomingExams;