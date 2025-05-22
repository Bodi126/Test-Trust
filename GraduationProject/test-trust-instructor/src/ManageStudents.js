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
  FiArrowLeft
} from 'react-icons/fi';
import { 
  FaDesktop, 
  FaLaptop, 
  FaPowerOff, 
  FaUserGraduate
} from 'react-icons/fa';
import './ManageStudents.css';
import { useNavigate } from 'react-router-dom';

const mockExams = [
  {
    id: 1,
    subject: 'Mathematics',
    year: '2023',
    department: 'Engineering',
    students: 12,
    date: '2023-05-15',
    doctor: 'Dr. Ahmed Mohamed'
  },
  {
    id: 2,
    subject: 'Physics',
    year: '2023',
    department: 'Science',
    students: 8,
    date: '2023-06-20',
    doctor: 'Dr. Sarah Johnson'
  },
  {
    id: 3,
    subject: 'Biology',
    year: '2024',
    department: 'Medicine',
    students: 10,
    date: '2024-02-10',
    doctor: 'Dr. Michael Chen'
  }
];

const generatePCStatus = (examId, studentCount) => {
  const statuses = [];
  for (let i = 1; i <= studentCount; i++) {
    const studentId = Math.floor(1000000 + Math.random() * 9000000);
    statuses.push({
      id: `${examId}-pc-${i}`,
      name: `PC-${i}`,
      student: `Student ${i}`,
      studentId: studentId.toString(),
      status: Math.random() > 0.3 ? 'online' : 'offline',
      lastActive: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      shutdownTime: null,
      canPowerOn: false,
      powerOnExpired: false
    });
  }
  return statuses;
};

const ManageStudents = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState(mockExams);
  const [selectedExam, setSelectedExam] = useState(null);
  const [pcStatuses, setPcStatuses] = useState([]);
  const [filters, setFilters] = useState({ department: '', year: '', subject: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [isManaging, setIsManaging] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    if (!isManaging) return;

    const interval = setInterval(() => {
      setPcStatuses(prev => prev.map(pc => {
        if (pc.shutdownTime && !pc.powerOnExpired) {
          const shutdownTime = new Date(pc.shutdownTime);
          const tenMinutesAfter = new Date(shutdownTime.getTime() + 10 * 60 * 1000);
          const now = new Date();
          
          if (now >= tenMinutesAfter) {
            return {
              ...pc,
              canPowerOn: false,
              powerOnExpired: true
            };
          } else {
            return {
              ...pc,
              canPowerOn: true
            };
          }
        }
        return pc;
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [isManaging]);

  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         exam.doctor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilters = 
      (filters.department === '' || exam.department === filters.department) &&
      (filters.year === '' || exam.year === filters.year) &&
      (filters.subject === '' || exam.subject.includes(filters.subject));
    return matchesSearch && matchesFilters;
  });

  const handleManageExam = (exam) => {
    setSelectedExam(exam);
    setPcStatuses(generatePCStatus(exam.id, exam.students));
    setIsManaging(true);
    setSelectedStudent(null);
  };

  const handleShutdownPC = (pcId) => {
    setPcStatuses(prev => prev.map(pc => 
      pc.id === pcId ? { 
        ...pc, 
        status: 'offline',
        shutdownTime: new Date().toISOString(),
        canPowerOn: true,
        powerOnExpired: false
      } : pc
    ));
    console.log(`Shutting down ${pcId}`);
  };

  const handlePowerOnPC = (pcId) => {
    setPcStatuses(prev => prev.map(pc => 
      pc.id === pcId ? { 
        ...pc, 
        status: 'online',
        shutdownTime: null,
        canPowerOn: false,
        powerOnExpired: false
      } : pc
    ));
    console.log(`Powering on ${pcId}`);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      if (selectedExam) {
        setPcStatuses(generatePCStatus(selectedExam.id, selectedExam.students));
      }
      setIsRefreshing(false);
    }, 1000);
  };

  const handleCloseManagement = () => {
    setIsManaging(false);
    setSelectedExam(null);
    setSelectedStudent(null);
  };

  const handleViewStudent = (pc) => {
    setSelectedStudent(pc);
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
            placeholder="Search exams..."
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
        <div className="exams-list-header">
          <div>Subject</div>
          <div>Department</div>
          <div>Year</div>
          <div>Students</div>
          <div>Actions</div>
        </div>
        <div className="exams-list">
          {filteredExams.map(exam => (
            <div key={exam.id} className="exam-card">
              <div className="exam-subject">{exam.subject}</div>
              <div className="exam-meta">{exam.department}</div>
              <div className="exam-meta">{exam.year}</div>
              <div className="exam-meta">{exam.students} students</div>
              <div className="exam-actions">
                <button 
                  className="exam-action-btn manage"
                  onClick={() => handleManageExam(exam)}
                >
                  Manage
                </button>
              </div>
            </div>
          ))}
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
                    {pcStatuses.filter(pc => pc.status === 'online').length}
                  </span>
                  <span className="stat-label">Online</span>
                </div>
                <div className="stat-card offline">
                  <span className="stat-value">
                    {pcStatuses.filter(pc => pc.status === 'offline').length}
                  </span>
                  <span className="stat-label">Offline</span>
                </div>
                <div className="stat-card total">
                  <span className="stat-value">{pcStatuses.length}</span>
                  <span className="stat-label">Total PCs</span>
                </div>
              </div>

              <div className="management-container">
                <div className="pc-grid">
                  {pcStatuses.map(pc => (
                    <div 
                      key={pc.id} 
                      className={`pc-card ${pc.status} ${selectedStudent?.id === pc.id ? 'selected' : ''}`}
                      onClick={() => handleViewStudent(pc)}
                    >
                      <div className="pc-icon">
                        {pc.status === 'online' ? <FaLaptop /> : <FaPowerOff />}
                      </div>
                      <div className="pc-info">
                        <div className="pc-name">{pc.name}</div>
                        <div className="pc-student">
                          <FaUserGraduate size={12} /> {pc.student}
                        </div>
                        <div className="pc-id">ID: {pc.studentId}</div>
                        <div className="pc-status">
                          <span className={`status-badge ${pc.status}`}>
                            {pc.status}
                          </span>
                          {pc.shutdownTime && (
                            <div className={`poweron-window ${pc.powerOnExpired ? 'expired' : ''}`}>
                              <FiClock size={12} /> {getTimeRemaining(pc.shutdownTime)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="pc-actions">
                        {pc.status === 'online' ? (
                          <button 
                            className="action-btn shutdown"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShutdownPC(pc.id);
                            }}
                          >
                            <FiPower /> Shutdown
                          </button>
                        ) : pc.powerOnExpired ? (
                          <div className="expired-warning">
                            <FiAlertCircle /> Expired
                          </div>
                        ) : (
                          <button 
                            className={`action-btn poweron ${!pc.canPowerOn ? 'disabled' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              pc.canPowerOn && handlePowerOnPC(pc.id);
                            }}
                            disabled={!pc.canPowerOn}
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
                        <span className="detail-value">{selectedStudent.name}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Student:</span>
                        <span className="detail-value">{selectedStudent.student}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Student ID:</span>
                        <span className="detail-value student-id">{selectedStudent.studentId}</span>
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
                          {new Date(selectedStudent.lastActive).toLocaleString()}
                        </span>
                      </div>
                      {selectedStudent.shutdownTime && (
                        <div className="detail-item">
                          <span className="detail-label">Power-on Window:</span>
                          <span className={`detail-value ${selectedStudent.powerOnExpired ? 'status-offline' : ''}`}>
                            {selectedStudent.powerOnExpired ? 'Expired' : getTimeRemaining(selectedStudent.shutdownTime)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="student-actions">
                      {selectedStudent.status === 'online' ? (
                        <button 
                          className="action-btn shutdown"
                          onClick={() => handleShutdownPC(selectedStudent.id)}
                        >
                          <FiPower /> Remote Shutdown
                        </button>
                      ) : selectedStudent.powerOnExpired ? (
                        <div className="expired-warning">
                          <FiAlertCircle /> Power-on window expired
                        </div>
                      ) : (
                        <button 
                          className={`action-btn poweron ${!selectedStudent.canPowerOn ? 'disabled' : ''}`}
                          onClick={() => selectedStudent.canPowerOn && handlePowerOnPC(selectedStudent.id)}
                          disabled={!selectedStudent.canPowerOn}
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