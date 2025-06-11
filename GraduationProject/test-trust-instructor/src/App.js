import { useEffect, useState, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { AuthContext } from './contexts/AuthContext';
import AuthLink from './components/AuthLink';
import Logo from './images/Logo.jpg';
import './App.css';
import AboutUs from './AboutUs';
import Login from './login';
import Signup from './signup';
import DiveInto from './DiveInto';
import Dashboard from './Dashboard'; 
import AddExam1 from './AddExam1';
import AddExam2 from './AddExam2';
import ManageExams from './ManageExam';
import ManageStudents from './ManageStudents';
import ForgetPassword from './ForgetPassword';
import ResetPassword from './ResetPassword';
import Settings from './Settings';
import TwoFactorAuth from './TwoFactorAuth';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // You might want to validate the token with your backend here
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  const { currentUser } = useContext(AuthContext);
  useEffect(() => {
    const shapes = document.querySelectorAll('.shape');
    
    const handleMouseMove = (e) => {
      shapes.forEach(shape => {
        const rect = shape.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        shape.style.setProperty('--mouse-x', `${x}px`);
        shape.style.setProperty('--mouse-y', `${y}px`);
      });
    };
  
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);



  return (
    <Router>
      <div className="App">
        <nav className='app-navbar'>
          <div className="navbar-brand">
            <Link to="/">
              <img src={Logo} className="app-logo" alt="TestTrust Logo" />
            </Link>
          </div>  
          
          <ul className='nav-menu'>
            <li className="nav-item">
              <Link to="/dive-into" className="nav-link">Dive Into</Link>
            </li>
            <li className="nav-item">
              <Link to="/about-us" className="nav-link">About Us</Link>
            </li>
            <li className="nav-item">
              {currentUser ? (
                <li className="nav-item">
                  <Link to="/settings" className="nav-link" style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '5px 0',
                    borderRadius: '50%',
                    transition: 'all 0.3s ease',
                    position: 'relative'
                  }}>
                    <div className="avatar-glow" style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'radial-gradient(circle, rgba(110,72,170,0.4) 0%, rgba(110,72,170,0.1) 70%)',
                      padding: '2px'
                    }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: '#6e48aa',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        fontWeight: 'bold'
                      }}>
                        {currentUser.firstName ? currentUser.firstName.charAt(0).toUpperCase() : 'U'}
                      </div>
                    </div>
                  </Link>
                </li>
              ) : (
                <li className="nav-item">
                  <AuthLink to="/signup" className="nav-link">Join Us</AuthLink>
                </li>
              )}
            </li>
          </ul>        
        </nav>

          <Routes>
            <Route path="/" element={
              <div className="main-content">
                <div className="content-wrapper">
                  <h1>Welcome to the TestTrust Community!</h1>
                  <p className="hero-description">
                    A comprehensive learning management system where educators can:
                  </p>
                  <ul className="feature-list">
                    <li>Create and manage assignments</li>
                    <li>Grade submissions efficiently</li>
                    <li>Add students and organize exams</li>
                    <li>Monitor live exams in real-time</li>
                    <li>Contribute to our open-source platform</li>
                  </ul>
                  <AuthLink to="/login" className="cta-button">Get Started Now</AuthLink>
                </div>
              </div>
            } />
            <Route path="/about-us" element={
              <div className="main-content">
                <AboutUs />
              </div>
            } />
            <Route path="/login" element={
              <div className="main-content">
                <Login />
              </div>
            } />
            <Route path="/signup" element={
              <div className="main-content">
                <Signup />
              </div>
            } />
            <Route path="/dive-into" element={
              <div className="main-content">
                <DiveInto />
              </div>
            } />
            {/* Protected Routes */}
            <Route element={
              <ProtectedRoute>
                <div className="main-content">
                  <Outlet />
                </div>
              </ProtectedRoute>
            }>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/addexam1" element={<AddExam1 />} />
              <Route path="/addexam2" element={<AddExam2 />} />
              <Route path="/ManageExam/:examId?" element={<ManageExams />} />
              <Route path="/ManageStudents" element={<ManageStudents />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            <Route path="/ForgetPassword" element={
              <div className="main-content">
                <ForgetPassword />
              </div>
            } />
            <Route path="/ResetPassword" element={
              <div className="main-content">
                <ResetPassword />
              </div>
            } />
            <Route path="/two-factor-auth" element={
              <div className="main-content">
                <TwoFactorAuth />
              </div>
            } />


          </Routes>

          <div className="background-shapes">
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
            <div className="shape shape-3"></div>
            <div className="shape shape-4"></div>
          </div>
        </div>
      </Router>

  );
}

export default App;