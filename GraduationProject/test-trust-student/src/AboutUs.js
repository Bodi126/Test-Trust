import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import App from './App';
import Login from './login';
import SignUp from './signup';
import Logo from './images/Logo.jpg';
import HomePage from './App';


const Navbar4 = () => {
  return (
    <nav className="navbar4">
      <div className="nav-left">
        <a href="/" className="nav-link">Home</a>
        <a href="#dive-into" className="nav-link">Dive Into</a>
        <a href="#about-us" className="nav-link">About Us</a>
      </div>
      <img src={Logo} alt="App Logo" className="logo" />
      <div className="nav-right">
        
        <div className="auth-buttons">
          <a href="/login" className="btn login-btn">Login</a>
          <a href="/signup" className="btn signup-btn">Sign Up</a>
        </div>
      </div>
    </nav>
  );
}; 


function login4() {
  return (
    <Router>
      <div className="login4">
        <Navbar4 />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          
          {/* Other routes would go here */}
        </Routes>
      </div>
    </Router>
  );
}
const AboutUs = () => {

return (

<h1>About Page</h1>


);

} ;

export default AboutUs;

