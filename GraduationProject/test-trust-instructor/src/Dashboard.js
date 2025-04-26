import './Dashboard.css';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';


function Dashboard() {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('examStatus');

  // Sample data
  const examStatus = [
    { name: 'Mathematics', status: 'Ongoing', progress: 65 },
    { name: 'Physics', status: 'Pending', progress: 0 },
    { name: 'Chemistry', status: 'Completed', progress: 100 }
  ];

  const upcomingExams = [
    { name: 'Biology', date: '2023-06-15', time: '09:00 AM' },
    { name: 'History', date: '2023-06-17', time: '11:00 AM' },
    { name: 'Literature', date: '2023-06-20', time: '10:00 AM' }
  ];

  return (
    <div className="dashboard-container">


      {/* Left Sidebar - Navigation */}
      <div className="dashboard-sidebar">
        <h2 className="sidebar-title">Dashboard</h2>
        <nav className="sidebar-nav">
          <button className="nav-button" onClick={() => navigate('/add-exam')}>
            <i className="fas fa-plus-circle"></i> Add Exam
          </button>
          <button className="nav-button" onClick={() => navigate('/manage-exam')}>
            <i className="fas fa-tasks"></i> Manage Exam
          </button>
          <button className="nav-button" onClick={() => navigate('/manage-students')}>
            <i className="fas fa-users"></i> Manage Students
          </button>
          <button className="nav-button" onClick={() => navigate('/results')}>
            <i className="fas fa-chart-bar"></i> View Results
          </button>
          <button className="nav-button" onClick={() => navigate('/settings')}>
            <i className="fas fa-cog"></i> Settings
          </button>
                {/* Back to Home Button */}
            <button 
                className="sidebar-back-button "
                onClick={() => navigate('/')}
            >
                ← Back to Home
            </button>
        </nav>
      </div>

      {/* Middle Section - Exam Info */}
      <div className="dashboard-main">
        <div className="exam-status-container">
          <div className="section-header">
            <h3>Exam Status</h3>
            <div className="status-tabs">
              <button 
                className={`tab-button ${activeTab === 'examStatus' ? 'active' : ''}`}
                onClick={() => setActiveTab('examStatus')}
              >
                Current
              </button>
              <button 
                className={`tab-button ${activeTab === 'upcomingExams' ? 'active' : ''}`}
                onClick={() => setActiveTab('upcomingExams')}
              >
                Upcoming
              </button>
            </div>
          </div>

          {activeTab === 'examStatus' ? (
            <div className="status-cards">
              {examStatus.map((exam, index) => (
                <div key={index} className="status-card">
                  <div className="exam-info">
                    <h4>{exam.name}</h4>
                    <span className={`status-badge ${exam.status.toLowerCase()}`}>
                      {exam.status}
                    </span>
                  </div>
                  <div className="progress-container">
                    <div 
                      className="progress-bar" 
                      style={{ width: `${exam.progress}%` }}
                    ></div>
                  </div>
                  <div className="progress-text">{exam.progress}%</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="upcoming-exams">
              {upcomingExams.map((exam, index) => (
                <div key={index} className="exam-card">
                  <div className="exam-date">
                    <div className="date-day">{new Date(exam.date).getDate()}</div>
                    <div className="date-month">
                      {new Date(exam.date).toLocaleString('default', { month: 'short' })}
                    </div>
                  </div>
                  <div className="exam-details">
                    <h4>{exam.name}</h4>
                    <p>{exam.time}</p>
                  </div>
                  <button className="view-button">View</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="quick-stats">
          <div className="stat-card">
            <h4>Total Exams</h4>
            <p className="stat-value">24</p>
          </div>
          <div className="stat-card">
            <h4>Active Students</h4>
            <p className="stat-value">156</p>
          </div>
        </div>
      </div>

      {/* Right Section - Calendar */}
      <div className="dashboard-calendar">
        <div className="calendar-container">
          <Calendar 
            onChange={setDate} 
            value={date} 
            className="modern-calendar"
          />
        </div>
        <div className="calendar-events">
          <h3>Today's Events</h3>
          <div className="event-list">
            <div className="event-item">
              <div className="event-time">09:00 AM</div>
              <div className="event-details">
                <h4>Mathematics Exam</h4>
                <p>Room 201</p>
              </div>
            </div>
            <div className="event-item">
              <div className="event-time">02:00 PM</div>
              <div className="event-details">
                <h4>Faculty Meeting</h4>
                <p>Conference Room</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;