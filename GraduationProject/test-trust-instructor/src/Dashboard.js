import './Dashboard.css';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from "react-router-dom";
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import axios from 'axios';
import { format } from 'date-fns';

function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('current');
  const [allExams, setAllExams] = useState([]);
  const [examData, setExamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tooltip, setTooltip] = useState({ show: false, content: '', x: 0, y: 0 });

  useEffect(() => {
  const fetchExams = async () => {
    try {
      setLoading(true);
      const userEmail = localStorage.getItem('userEmail');
      if (!userEmail) {
        setError('User not logged in');
        setLoading(false);
        return;
      }
      const response = await axios.get(
        `http://localhost:5000/api/auth/my-exams?user=${encodeURIComponent(userEmail)}`,
        { withCredentials: true }
      );
      const exams = response.data.exams || [];
      setAllExams(exams);

      const today = normalizeDate(new Date());
      const todayExam = exams.find(exam => normalizeDate(exam.examDate).getTime() === today.getTime());
      if (todayExam) {
        setExamData(todayExam);
      }
    } catch (err) {
      console.error('Error fetching exams:', err);
      setError(err.response?.data?.message || 'Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  fetchExams();
}, []);


  // Helper function to normalize dates for comparison
  const normalizeDate = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const handleStartExam = () => {
  navigate(`/start-exam/${examData._id}`);
};


  // Filter exams for today
  const getTodaysExams = () => {
    const today = normalizeDate(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return allExams.filter(exam => {
      const examDate = normalizeDate(exam.examDate);
      return examDate.getTime() === today.getTime();
    });
  };

  // Filter upcoming exams (next 6 days)
  const getUpcomingExams = () => {
    const today = normalizeDate(new Date());
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const todayExams = getTodaysExams();

    return allExams.filter(exam => {
      const examDate = normalizeDate(exam.examDate);
      const isToday = examDate.getTime() === today.getTime();
      const isInNextWeek = examDate > today && examDate < nextWeek;
      const isNotToday = !todayExams.some(e => e._id === exam._id);
      return isInNextWeek && isNotToday;
    });
  };

  const todaysExams = getTodaysExams();
  const upcomingExams = getUpcomingExams();

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${period}`;
  };

  const formatDate = (dateString) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Check if a date has exams and return the exams
  const getExamsForDate = (date) => {
    if (!date) return [];
    const normalizedDate = normalizeDate(date);
    return allExams.filter(exam => {
      const examDate = normalizeDate(exam.examDate);
      return examDate.getTime() === normalizedDate.getTime();
    });
  };

  // Check if a date has exams
  const dateHasExams = (date) => {
    return getExamsForDate(date).length > 0;
  };

  // Format exam details for tooltip
  const formatExamDetails = (exams) => {
    return exams.map(exam => ({
      subject: exam.subject,
      department: exam.department,
      year: exam.year,
      time: formatTime(exam.examTime),
      date: exam.examDate
    }));
  };

  // Handle date hover in calendar
  const handleDateHover = (date, event) => {
    const exams = getExamsForDate(date);
    if (exams.length === 0) return;
    
    const rect = event.target.closest('.react-calendar__tile').getBoundingClientRect();
    
    setTooltip({
      show: true,
      content: formatExamDetails(exams),
      x: rect.left + window.scrollX + (rect.width / 2),
      y: rect.top + window.scrollY - 10,
      date: date.toDateString()
    });
  };

  // Hide tooltip when mouse leaves date
  const handleDateLeave = () => {
    setTooltip(prev => ({ ...prev, show: false }));
  };

  const handleAddExam = () => navigate('/AddExam1');
  const handleManageExams = () => navigate('/ManageExam');
  const handleResults = () => navigate('/results');
  const handleSettings = () => navigate('/settings');
  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    navigate('/');
  };


  const location = useLocation();
const examReady = location.state?.examReady;

  // Calendar tile content with exam indicator
  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    const hasExams = dateHasExams(date);
    const isToday = normalizeDate(date).getTime() === normalizeDate(new Date()).getTime();
    const exams = getExamsForDate(date);
    
    return (
      <div 
        className="calendar-day-wrapper"
        onMouseEnter={(e) => handleDateHover(date, e)}
        onMouseLeave={handleDateLeave}
      >
        <div className={`calendar-day ${hasExams ? 'has-exam' : ''} ${isToday ? 'today' : ''}`}>
          {hasExams && (
            <div className="exam-date-marker" data-exam-count={exams.length}>
              {exams.length > 1 && <span className="exam-count">{exams.length}</span>}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Calendar tile props
  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return null;
    const classes = [];
    const today = new Date();
    const currentDate = new Date(date);
    
    // Check if the date is today
    if (currentDate.getDate() === today.getDate() &&
        currentDate.getMonth() === today.getMonth() &&
        currentDate.getFullYear() === today.getFullYear()) {
      classes.push('react-calendar__tile--now');
    }
    
    // Add class for dates with exams
    if (dateHasExams(date)) {
      classes.push('react-calendar__tile--has-exam');
    }
    
    return classes.join(' ');
  };

  // Format day of month for calendar
  const formatDay = (locale, date) => {
    return date.getDate().toString();
  };

  // Format short week day names
  const formatShortWeekday = (locale, date) => {
    return ['S', 'M', 'T', 'W', 'T', 'F', 'S'][date.getDay()];
  };

  return (
    <div className="dashboard-container">
{/* Tooltip for exam details */}
{tooltip.show && (
  <div 
    className="calendar-tooltip"
    style={{
      left: `${tooltip.x}px`,
      top: `${tooltip.y}px`,
      transform: 'translateY(-100%)'
    }}
  >
    <div className="tooltip-date">{new Date(tooltip.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
    <div className="exams-list">
      {tooltip.content.map((exam, index) => (
        <div key={index} className="exam-detail">
          <div className="exam-subject">{exam.subject}</div>
          <div className="exam-meta">
            <span className="exam-department">{exam.department} - Year {exam.year}</span>
            <span className="exam-time">{exam.time}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
      {/* Left Sidebar */}
      <div className="dashboard-sidebar">
        <h2 className="sidebar-title">Instructor Dashboard</h2>
        <div className="sidebar-nav">
          <button className="nav-button active">
            <i className="fas fa-tachometer-alt"></i>
            <span>Dashboard</span>
          </button>
          <button className="nav-button" onClick={handleAddExam}>
            <i className="fas fa-plus-circle"></i>
            <span>Add Exam</span>
          </button>
          <button className="nav-button" onClick={handleManageExams}>
            <i className="fas fa-tasks"></i>
            <span>Manage Exams</span>
          </button>
          <button className="nav-button" onClick={handleResults}>
            <i className="fas fa-chart-bar"></i>
            <span>Results</span>
          </button>
          <button className="nav-button" onClick={handleSettings}>
            <i className="fas fa-cog"></i>
            <span>Settings</span>
          </button>
          <button className="sidebar-back-button" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Middle Section - Exam Info */}
      <div className="dashboard-main">
        <div className="exam-status-container">
          <div className="section-header">
            <h3>Exam Status</h3>
            <div className="status-tabs">
              <button 
                className={`tab-button ${activeTab === 'current' ? 'active' : ''}`}
                onClick={() => setActiveTab('current')}
              >
                Current
              </button>
              <button 
                className={`tab-button ${activeTab === 'upcoming' ? 'active' : ''}`}
                onClick={() => setActiveTab('upcoming')}
              >
                Upcoming
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading-message">Loading exams...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : activeTab === 'current' ? (
            <div className="status-cards">
              {todaysExams.length > 0 ? (
                todaysExams.map((exam) => (
                  <div key={exam._id} className="status-card">
                    <div className="exam-info">
                      <h4>{exam.subject}</h4>
                      <span className="status-badge">
                        {new Date(exam.examDate) > new Date() ? 'Upcoming' : 'Ongoing'}
                      </span>
                    </div>
                    <div className="exam-meta">
                      <span>{exam.department} - {exam.year}</span>
                        {examReady && (
              <button className="nav-button" onClick={handleStartExam}><span>Start</span></button> )}
                      <span>{formatTime(exam.examTime)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-exams">No exams scheduled for today</div>
          )}
            </div>
            
          ) : (
            <div className="upcoming-exams">
              {upcomingExams.length > 0 ? (
                upcomingExams.map((exam) => (
                  <div key={exam._id} className="exam-card">
                    <div className="exam-date">
                      <div className="date-day">{formatDate(exam.examDate)}</div>
                    </div>
                    <div className="exam-details">
                      <h4>{exam.subject}</h4>
                      <p>{formatTime(exam.examTime)}</p>
                      <small>{exam.department} - {exam.year}</small>
                    </div>
                    <button className="view-button">View</button>
                  </div>
                ))
              ) : (
                <div className="no-exams">No upcoming exams in the next 6 days</div>
              )}
              
            </div>
          )}
          
        </div>



        <div className="quick-stats">
          <div className="stat-card">
            <h4>Total Exams</h4>
            <p className="stat-value">{allExams.length}</p>
          </div>
          <div className="stat-card">
            <h4>Active Students</h4>
            <p className="stat-value">-</p>
          </div>
        </div>
      </div>

      {/* Right Calendar Section */}
      <div className="dashboard-calendar">
        <div className="calendar-container">
          <Calendar
            className="modern-calendar"
            value={new Date()}
            tileContent={tileContent}
            tileClassName={tileClassName}
            formatDay={formatDay}
            formatShortWeekday={formatShortWeekday}
            onActiveStartDateChange={({ activeStartDate }) => {
              // Update view when month changes
              console.log('View changed to:', activeStartDate);
            }}
            onClickDay={(date) => {
              const exams = getExamsForDate(date);
              if (exams.length > 0) {
                console.log('Exams on', date.toDateString(), ':', exams);
              }
            }}
            onMouseLeave={handleDateLeave}
          />
          

        </div>
        
        {/* Upcoming exams list */}
        <div className="calendar-events">
          <h3>Upcoming Exams</h3>
          <div className="event-list">
            {getUpcomingExams().slice(0, 3).map((exam, index) => (
              <div key={index} className="event-item">
                <div className="event-time">
                  {formatTime(exam.examTime)}
                </div>
                <div className="event-details">
                  <h4>{exam.subject}</h4>
                  <p>{exam.department} - {exam.year}</p>
                </div>
              </div>
            ))}
            {getUpcomingExams().length === 0 && (
              <p>No upcoming exams</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;