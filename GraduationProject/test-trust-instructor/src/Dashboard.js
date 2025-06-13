import './Dashboard.css';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from "react-router-dom";
import Calendar from 'react-calendar';
import axios from 'axios';
import { format } from 'date-fns';
import ExamControl from './ExamControl'; 
import io from 'socket.io-client';


function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('current');
  const [allExams, setAllExams] = useState([]);
  const [examData, setExamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tooltip, setTooltip] = useState({ show: false, content: '', x: 0, y: 0 });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [examReady, setExamReady] = useState(false);
  const [examCount, setExamCount] = useState(0);

  // Handle date change in the calendar
  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  // Handle month/year navigation
  const handleActiveStartDateChange = ({ activeStartDate }) => {
    // You can add logic here if you need to handle month/year changes
    console.log('View changed to:', activeStartDate);
  };

  const socket = io('http://localhost:5000');

  const handleTestMessage = () => {
    socket.emit('test_message', 'Hello from Doctor ');
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);
        const userEmail = localStorage.getItem('userEmail');
        const token = localStorage.getItem('token');
        
        if (!userEmail || !token) {
          throw new Error('User not logged in');
        }
        
        // Fetch user data to get exam count
        const userResponse = await axios.get(
          `http://localhost:5000/api/auth/me`,
          { 
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        if (userResponse.data && userResponse.data.examCount !== undefined) {
          setExamCount(userResponse.data.examCount);
        }
        
        // Fetch exams
        console.log('Fetching exams for user:', userEmail);
        const response = await axios.get(
          `http://localhost:5000/api/auth/my-exams?user=${encodeURIComponent(userEmail)}`,
          { 
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        console.log('Exams data received:', response.data);
        if (response.data && Array.isArray(response.data.exams)) {
          setAllExams(response.data.exams);
          // Only update exam count from exams if we didn't get it from user data
          if (userResponse.data.examCount === undefined) {
            setExamCount(response.data.exams.length);
          }
        } else {
          console.error('Unexpected response format:', response.data);
          setError('Invalid response format from server');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);


  // Helper function to normalize dates for comparison
  const normalizeDate = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const handleStartExam = (exam) => {
  console.log("🚀 Starting exam with data:", exam);
  socket.emit('start_exam', exam); 
  setExamData(exam);
  setExamReady(true);
  navigate('/Dashboard');
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
    if (exams.length === 0) {
      setTooltip(prev => ({ ...prev, show: false }));
      return;
    }
    
    const tile = event.target.closest('.react-calendar__tile');
    if (!tile) return;
    
    const rect = tile.getBoundingClientRect();
    
    // Calculate position for tooltip above the date using viewport coordinates
    const tooltipX = rect.left + (rect.width / 2);
    const tooltipY = rect.top - 10; // 10px above the date
    
    setTooltip({
      show: true,
      content: formatExamDetails(exams),
      x: tooltipX,
      y: tooltipY,
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


  // Calendar tile content - handles both day numbers and exam indicators
  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    
    const hasExams = dateHasExams(date);
    const exams = allExams.filter(exam => {
      const examDate = new Date(exam.examDate);
      return examDate.toDateString() === date.toDateString();
    });

    const today = new Date();
    const isToday = date.getDate() === today.getDate() && 
                  date.getMonth() === today.getMonth() && 
                  date.getFullYear() === today.getFullYear();

    return (
      <div 
        className="calendar-tile-content"
        onMouseEnter={(e) => handleDateHover(date, e)}
        onMouseLeave={handleDateLeave}
      >
        <div className={`day-number ${isToday ? 'today' : ''}`}>
          {date.getDate()}
          {hasExams && (
            <div className="exam-count">{exams.length}</div>
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

  // Format short week day names
  const formatShortWeekday = (locale, date) => {
    return ['S', 'M', 'T', 'W', 'T', 'F', 'S'][date.getDay()];
  };

  return (
    <div className="dashboard-container">
      {/* Tooltip for exam details */}
      <div 
        className={`calendar-tooltip ${tooltip.show ? 'show' : ''}`}
        style={{
          left: `${tooltip.x}px`,
          top: `${tooltip.y}px`,
          display: tooltip.show ? 'block' : 'none'
        }}
      >
        {tooltip.show && (
          <>
            <div className="tooltip-date">
              {new Date(tooltip.date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            <div className="exams-list">
              {tooltip.content.map((exam, index) => (
                <div key={index} className="exam-detail">
                  <div className="exam-subject">{exam.subject}</div>
                  <div className="exam-meta">
                    <span>{exam.time}</span>
                    <span>{exam.department} - Year {exam.year}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
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
            <span>Profile</span>
          </button>
          <button className="nav-button" onClick={() => navigate('/manageStudents')}>
            <i className="fas fa-users"></i>
            <span>Manage Students</span>
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
                    <button 
                      className="view-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/ManageExam/${exam._id}`);
                      }}
                    >
                      View
                    </button>
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
            <p className="stat-value">{examCount}</p>
          </div>
          <div className="stat-card">
            <h4>Active Students</h4>
            <p className="stat-value">-</p>
          </div>
        </div>
        {todaysExams.map((exam, index) => (
  <div key={exam._id} className="exam-card">
    <h4>{exam.subject}</h4>
    <p>Date: {formatDate(exam.examDate)}</p>
    <p>Time: {formatTime(exam.examTime)}</p>
    <button onClick={() => handleStartExam(exam)}>
      Start
    </button>
  </div>
))}

      </div>
      

      {/* Right Calendar Section */}
      <div className="dashboard-calendar">
        <div className="calendar-container">
          <Calendar
            onChange={handleDateChange}
            value={selectedDate}
            className="dashboard-calendar"
            tileClassName={tileClassName}
            tileContent={tileContent}
            formatShortWeekday={formatShortWeekday}
            calendarType="gregory"
            locale="en-US"
            onActiveStartDateChange={handleActiveStartDateChange}
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