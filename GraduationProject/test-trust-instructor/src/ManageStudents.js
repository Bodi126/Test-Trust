import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiMonitor, 
  FiPower, 
  FiRefreshCw, 
  FiFilter, 
  FiSearch, 
  FiClock,
  FiAlertCircle,
  FiArrowLeft,
  FiUsers,
  FiEye
} from 'react-icons/fi';
import { 
  FaDesktop, 
  FaLaptop, 
  FaPowerOff, 
  FaUserGraduate
} from 'react-icons/fa';
import './ManageStudents.css';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';

const ManageStudents = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [students, setStudents] = useState([]);
  const [filters, setFilters] = useState({ department: '', year: '', subject: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [isManaging, setIsManaging] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shutdownRecords, setShutdownRecords] = useState({});
  const [connectedCount, setConnectedCount] = useState(0);
  const [examStudentCount, setExamStudentCount] = useState(0);

  // Handle started exam from dashboard
  useEffect(() => {
    if (location.state?.startedExam && location.state?.autoManage) {
      const startedExam = location.state.startedExam;
      console.log('🚀 Auto-managing started exam:', startedExam);
      
      // Add the started exam to the exams list if it's not already there
      setExams(prevExams => {
        const examExists = prevExams.find(exam => exam._id === startedExam._id);
        if (!examExists) {
          return [...prevExams, startedExam];
        }
        return prevExams;
      });
      
      // Automatically start managing this exam
      setSelectedExam(startedExam);
      setIsManaging(true);
      setSelectedStudent(null);
      setError(null);
      
      // Fetch student status immediately
      fetchStudentStatusForExam(startedExam);
      
      // Clear the location state to prevent re-triggering
      navigate(location.pathname, { replace: true });
    }
  }, [location.state]);

  // Fetch all exams for the instructor
  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true);
        const instructorEmail = localStorage.getItem('instructorEmail') || localStorage.getItem('email');
        const response = await axios.get(`http://localhost:5000/api/auth/exams${instructorEmail ? `?instructor=${instructorEmail}` : ''}`);
        setExams(response.data || []);
      } catch (error) {
        console.error('Error fetching exams:', error);
        setError('Failed to load exams');
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  // Real-time WebSocket event listeners for instant status updates
  useEffect(() => {
    const socket = io('http://localhost:5000');
    
    socket.on('student_connected', (data) => {
      if (selectedExam && data.examId === selectedExam._id) {
        setStudents(prev =>
          prev.map(student =>
            student.studentId === data.studentId
              ? { ...student, status: 'online', lastActive: new Date().toISOString() }
              : student
          )
        );
      }
    });

    socket.on('student_disconnected', (data) => {
      if (selectedExam && data.examId === selectedExam._id) {
        setStudents(prev =>
          prev.map(student =>
            student.studentId === data.studentId
              ? { ...student, status: 'offline', lastActive: new Date().toISOString() }
              : student
          )
        );
      }
    });

    return () => {
      socket.off('student_connected');
      socket.off('student_disconnected');
    };
  }, [selectedExam]);

  // Recalculate connectedCount from students array after every update
  useEffect(() => {
    setConnectedCount(students.filter(s => s.status === 'online').length);
  }, [students]);

  // Helper function to fetch connected students count
  const fetchConnectedCount = async (examId) => {
    if (!examId) return;

    try {
      const response = await axios.get(`http://localhost:5000/api/instructors/students/connected-count/${examId}`);
      setConnectedCount(response.data.connectedStudents);
      setExamStudentCount(response.data.totalStudents);
    } catch (error) {
      console.error('Error fetching connected count:', error);
    }
  };

  // Helper function to fetch student status for a specific exam
  const fetchStudentStatusForExam = async (exam) => {
    if (!exam) return;

    try {
      const response = await axios.get(`http://localhost:5000/api/instructors/students/status?examId=${exam._id}`);
      setStudents(response.data.students || []);
      
      // Update shutdown records
      const shutdownResponse = await axios.get(`http://localhost:5000/api/instructors/students/shutdown-records/${exam._id}`);
      const records = shutdownResponse.data.records || [];
      const recordsMap = {};
      records.forEach(record => {
        recordsMap[record.studentId] = record;
      });
      setShutdownRecords(recordsMap);

      // Fetch connected count
      await fetchConnectedCount(exam._id);
    } catch (error) {
      console.error('Error fetching student status:', error);
    }
  };

  const filteredExams = exams.filter(exam => {
    // Check if exam has date and time, and if it has passed
    if (exam.examDate && exam.examTime) {
      const examDateTime = new Date(`${exam.examDate}T${exam.examTime}`);
      const now = new Date();
      
      // Only exclude exams that have already passed
      if (examDateTime < now) {
        return false; // Exclude passed exams
      }
    }

    const matchesSearch = exam.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (exam.createdBy && exam.createdBy.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilters = 
      (filters.department === '' || exam.department === filters.department) &&
      (filters.year === '' || exam.year === filters.year) &&
      (filters.subject === '' || exam.subject.includes(filters.subject));
    return matchesSearch && matchesFilters;
  });

  const handleManageExam = async (exam) => {
    setSelectedExam(exam);
    setIsManaging(true);
    setSelectedStudent(null);
    setError(null);
    
    try {
      // Fetch initial student status
      await fetchStudentStatusForExam(exam);
    } catch (error) {
      setError('Failed to load student status');
    }
  };

  const handleShutdownPC = async (studentId) => {
    if (!selectedExam) return;

    console.log('Shutting down student:', studentId, 'for exam:', selectedExam._id);

    try {
      const response = await axios.post(`http://localhost:5000/api/instructors/students/${studentId}/shutdown`, {
        examId: selectedExam._id,
        instructorId: localStorage.getItem('instructorId') || 'instructor'
      });

      if (response.data.success) {
        // Update local state immediately
        setStudents(prev => prev.map(student => 
          student.studentId === studentId 
            ? { ...student, status: 'offline', shutdownTime: response.data.shutdownRecord.shutdownTime }
            : student
        ));
        
        // Update shutdown records
        setShutdownRecords(prev => ({
          ...prev,
          [studentId]: response.data.shutdownRecord
        }));

        // Update connected count
        setConnectedCount(prev => Math.max(0, prev - 1));

        console.log(`Shutdown successful for student ${studentId}`);
      }
    } catch (error) {
      console.error('Error shutting down student PC:', error);
      alert('Failed to shutdown student PC. Please try again.');
    }
  };

  const handlePowerOnPC = async (studentId) => {
    if (!selectedExam) return;

    try {
      const response = await axios.post(`http://localhost:5000/api/instructors/students/${studentId}/poweron`, {
        examId: selectedExam._id
      });

      if (response.data.success) {
        // Remove from shutdown records immediately
        setShutdownRecords(prev => {
          const newRecords = { ...prev };
          delete newRecords[studentId];
          return newRecords;
        });

        // Update student status to online immediately
        setStudents(prev => prev.map(student => 
          student.studentId === studentId 
            ? { ...student, status: 'online' }
            : student
        ));

        // Update connected count
        setConnectedCount(prev => prev + 1);

        // Show success message
        alert(`Exam restarted successfully for student ${studentId}. The student will be redirected to the exam page.`);
        console.log(`Power-on signal sent to student ${studentId}`);
      }
    } catch (error) {
      console.error('Error powering on student PC:', error);
      if (error.response?.data?.error === 'Power-on window has expired') {
        alert('Power-on window has expired for this student.');
      } else {
        alert('Failed to power on student PC. Please try again.');
      }
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (selectedExam) {
        await fetchStudentStatusForExam(selectedExam);
      }
    } catch (error) {
      setError('Failed to refresh student status');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCloseManagement = () => {
    setIsManaging(false);
    setSelectedExam(null);
    setSelectedStudent(null);
    setStudents([]);
    setShutdownRecords({});
    setConnectedCount(0);
    setExamStudentCount(0);
  };

  const handleViewStudent = (student) => {
    setSelectedStudent(student);
  };

  const getTimeRemaining = (shutdownTime) => {
    if (!shutdownTime) return "";
    const shutdown = new Date(shutdownTime);
    const tenMinutesAfter = new Date(shutdown.getTime() + 10 * 60 * 1000);
    const now = new Date();
    
    if (now >= tenMinutesAfter) return "Power-on window expired";
    
    const diff = tenMinutesAfter - now;
    const minutes = Math.floor(diff / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${minutes}m ${seconds}s remaining`;
  };

  const getStudentStatus = (student) => {
    const shutdownRecord = shutdownRecords[student.studentId];
    
    if (student.status === 'online') {
      return { status: 'online', canPowerOn: false, powerOnExpired: false };
    }
    
    if (shutdownRecord) {
      const shutdownTime = new Date(shutdownRecord.shutdownTime);
      const tenMinutesAfter = new Date(shutdownTime.getTime() + 10 * 60 * 1000);
      const now = new Date();
      
      if (now >= tenMinutesAfter) {
        return { status: 'offline', canPowerOn: false, powerOnExpired: true };
      } else {
        return { status: 'offline', canPowerOn: true, powerOnExpired: false };
      }
    }
    
    return { status: 'offline', canPowerOn: false, powerOnExpired: false };
  };

  if (loading) {
    return (
      <div className="manage-students-container">
        <div className="loading-message">Loading exams...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="manage-students-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="manage-students-container">
      <div className="page-header">
        <h1 className="page-title">Student Management</h1>
        <button 
          className="back-to-dashboard-btn"
          onClick={() => navigate('/dashboard')}
        >
          <FiArrowLeft className="btn-icon" />
          <span>Back to Dashboard</span>
        </button>
      </div>

      <div className="search-filter-bar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search exams for student management..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-dropdown">
          <FiFilter className="filter-icon" />
          <select
            value={filters.department}
            onChange={(e) => setFilters({...filters, department: e.target.value})}
          >
            <option value="">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Medicine">Medicine</option>
            <option value="Science">Science</option>
          </select>
        </div>
        <div className="filter-dropdown">
          <select
            value={filters.year}
            onChange={(e) => setFilters({...filters, year: e.target.value})}
          >
            <option value="">All Years</option>
            <option value="2023">2023</option>
            <option value="2024">2024</option>
          </select>
        </div>
        <div className="filter-dropdown">
          <select
            value={filters.subject}
            onChange={(e) => setFilters({...filters, subject: e.target.value})}
          >
            <option value="">All Subjects</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Physics">Physics</option>
            <option value="Biology">Biology</option>
          </select>
        </div>
      </div>

      <div className="exams-list-container">
        <div style={{ 
          padding: '1rem 1.5rem', 
          background: 'rgba(67, 97, 238, 0.05)', 
          borderBottom: '1px solid var(--light-gray)',
          fontSize: '0.9rem',
          color: 'var(--gray)',
          fontStyle: 'italic'
        }}>
          📋 Showing exams available for student management (exams that haven't passed their scheduled date/time)
        </div>
        <div className="exams-list-header">
          <div>Subject</div>
          <div>Department</div>
          <div>Year</div>
          <div>Questions</div>
          <div>Actions</div>
        </div>
        <div className="exams-list">
          {filteredExams.length === 0 ? (
            <div style={{
              padding: '3rem 2rem',
              textAlign: 'center',
              color: 'var(--gray)',
              fontSize: '1.1rem',
              fontStyle: 'italic'
            }}>
              {searchTerm || Object.values(filters).some(f => f !== '') ? 
                'No exams found matching your search criteria.' :
                'No exams available for student management. All scheduled exams have passed.'
              }
            </div>
          ) : (
            filteredExams.map(exam => (
              <div key={exam._id} className={`exam-card ${isManaging && selectedExam?._id === exam._id ? 'active-exam' : ''}`}>
                <div className="exam-subject">
                  {exam.subject}
                  {isManaging && selectedExam?._id === exam._id && (
                    <span className="live-indicator">
                      🔴 LIVE
                    </span>
                  )}
                </div>
                <div className="exam-meta">{exam.department}</div>
                <div className="exam-meta">{exam.year}</div>
                <div className="exam-meta">{exam.questionCount || 0} questions</div>
                <div className="exam-actions">
                  <button 
                    className={`exam-action-btn ${isManaging && selectedExam?._id === exam._id ? 'managing' : 'manage'}`}
                    onClick={() => handleManageExam(exam)}
                  >
                    {isManaging && selectedExam?._id === exam._id ? 'Managing' : 'Manage'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {isManaging && selectedExam && (
          <motion.div 
            className="pc-management-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h2>
                  <FaDesktop className="header-icon" />
                  Managing: {selectedExam.subject} ({selectedExam.department} - {selectedExam.year})
                </h2>
                <div className="header-actions">
                  <button 
                    className="refresh-btn"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                  >
                    <FiRefreshCw className={isRefreshing ? 'spinning' : ''} />
                    Refresh
                  </button>
                  <button className="close-btn" onClick={handleCloseManagement}>
                    Close
                  </button>
                </div>
              </div>

              <div className="pc-stats">
                <div className="stat-card online">
                  <span className="stat-value">
                    {connectedCount}
                  </span>
                  <span className="stat-label">Online</span>
                </div>
                <div className="stat-card offline">
                  <span className="stat-value">
                    {examStudentCount - connectedCount}
                  </span>
                  <span className="stat-label">Offline</span>
                </div>
                <div className="stat-card total">
                  <span className="stat-value">30</span>
                  <span className="stat-label">Total PCs</span>
                </div>
              </div>

              <div className="management-container">
                <div className="pc-grid">
                  {students.map(student => (
                    <div 
                      key={student.studentId} 
                      className={`pc-card ${student.status} ${selectedStudent?.studentId === student.studentId ? 'selected' : ''}`}
                      onClick={() => handleViewStudent(student)}
                    >
                      <div className="pc-icon">
                        {student.status === 'online' ? <FaLaptop /> : <FaPowerOff />}
                      </div>
                      <div className="pc-info">
                        <div className="pc-name">{student.pcName}</div>
                        <div className="pc-student">
                          <FaUserGraduate size={12} /> {student.name}
                        </div>
                        <div className="pc-id">ID: {student.studentId}</div>
                        <div className="pc-status">
                          <span className={`status-badge ${student.status}`}>
                            {student.status}
                          </span>
                          {shutdownRecords[student.studentId] && (
                            <div className={`poweron-window ${getStudentStatus(student).powerOnExpired ? 'expired' : ''}`}>
                              <FiClock size={12} /> {getTimeRemaining(shutdownRecords[student.studentId].shutdownTime)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="pc-actions">
                        {student.status === 'online' ? (
                          <button 
                            className="action-btn shutdown"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShutdownPC(student.studentId);
                            }}
                          >
                            <FiPower /> Shutdown
                          </button>
                        ) : getStudentStatus(student).powerOnExpired ? (
                          <div className="expired-warning">
                            <FiAlertCircle /> Expired
                          </div>
                        ) : (
                          <button 
                            className={`action-btn poweron ${!getStudentStatus(student).canPowerOn ? 'disabled' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              getStudentStatus(student).canPowerOn && handlePowerOnPC(student.studentId);
                            }}
                            disabled={!getStudentStatus(student).canPowerOn}
                          >
                            <FiPower /> Power On
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {selectedStudent && (
                  <div className="student-details">
                    <h3>
                      <FaUserGraduate /> Student Details
                    </h3>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">PC Name:</span>
                        <span className="detail-value">{selectedStudent.pcName}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Student:</span>
                        <span className="detail-value">{selectedStudent.name}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Student ID:</span>
                        <span className="detail-value student-id">{selectedStudent.studentId}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Department:</span>
                        <span className="detail-value">{selectedStudent.department}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Academic Year:</span>
                        <span className="detail-value">{selectedStudent.academicYear}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Status:</span>
                        <span className={`detail-value status-${selectedStudent.status}`}>
                          {selectedStudent.status}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Last Active:</span>
                        <span className="detail-value">
                          {selectedStudent.lastActive ? new Date(selectedStudent.lastActive).toLocaleString() : 'N/A'}
                        </span>
                      </div>
                      {shutdownRecords[selectedStudent.studentId] && (
                        <div className="detail-item">
                          <span className="detail-label">Power-on Window:</span>
                          <span className={`detail-value ${getStudentStatus(selectedStudent).powerOnExpired ? 'status-offline' : ''}`}>
                            {getStudentStatus(selectedStudent).powerOnExpired ? 'Expired' : getTimeRemaining(shutdownRecords[selectedStudent.studentId].shutdownTime)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="student-actions">
                      {selectedStudent.status === 'online' ? (
                        <button 
                          className="action-btn shutdown"
                          onClick={() => handleShutdownPC(selectedStudent.studentId)}
                        >
                          <FiPower /> Remote Shutdown
                        </button>
                      ) : getStudentStatus(selectedStudent).powerOnExpired ? (
                        <div className="expired-warning">
                          <FiAlertCircle /> Power-on window expired
                        </div>
                      ) : (
                        <button 
                          className={`action-btn poweron ${!getStudentStatus(selectedStudent).canPowerOn ? 'disabled' : ''}`}
                          onClick={() => getStudentStatus(selectedStudent).canPowerOn && handlePowerOnPC(selectedStudent.studentId)}
                          disabled={!getStudentStatus(selectedStudent).canPowerOn}
                        >
                          <FiPower /> Remote Power On
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageStudents;