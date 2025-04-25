import { useEffect } from 'react';
import Logo from './images/Logo.jpg';
import './App.css';

function App() {
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
    <div className="App">
      <nav className='app-navbar'>
        <div className="navbar-brand">
          <img src={Logo} className="app-logo" alt="TestTrust Logo" />
        </div>
        
        <ul className='nav-menu'>
          <li className="nav-item">
            <a href="/dive-into" className="nav-link">Dive Into</a>
          </li>
          <li className="nav-item">
            <a href="/about-us" className="nav-link">About Us</a>
          </li>
          <li className="nav-item">
            <a href="/join-us" className="nav-link">Join Us</a>
          </li>
        </ul>        
      </nav>

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
          <button className="cta-button">Get Started Now</button>
        </div>
      </div>

      <div className="background-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
      </div>
    </div>
  );
}

export default App;