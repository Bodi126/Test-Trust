import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaShieldAlt, 
  FaFingerprint, 
  FaRobot, 
  FaClock,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaArrowRight
} from 'react-icons/fa';
import './DiveInto.css';

const DiveInto = () => {
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      id: 0,
      title: "Secure Exam Platform",
      description: "Military-grade security with live proctoring, AI cheating detection, and encrypted communication channels.",
      icon: <FaShieldAlt className="feature-icon" />,
      color: "#4a6bff"
    },
    {
      id: 1,
      title: "Fingerprint Authentication",
      description: "Biometric verification for both attendance and exam access, ensuring only authorized students can participate.",
      icon: <FaFingerprint className="feature-icon" />,
      color: "#ff6b6b"
    },
    {
      id: 2,
      title: "Automated Grading",
      description: "Instant grading for objective questions with AI-assisted evaluation for essays and coding assessments.",
      icon: <FaRobot className="feature-icon" />,
      color: "#6bffb8"
    },
    {
      id: 3,
      title: "Timed Assessments",
      description: "Flexible time controls with automatic submission and warnings to simulate real exam conditions.",
      icon: <FaClock className="feature-icon" />,
      color: "#ffb84a"
    },
    {
      id: 4,
      title: "Student Dashboard",
      description: "Personalized portal showing exam history, performance trends, and recommended study materials.",
      icon: <FaUserGraduate className="feature-icon" />,
      color: "#b84aff"
    },
    {
      id: 5,
      title: "Exam Management",
      description: "Comprehensive tools for creating, scheduling, and monitoring exams with real-time analytics.",
      icon: <FaChalkboardTeacher className="feature-icon" />,
      color: "#4affdf"
    }
  ];

  const handleGetStarted = () => {
    // Add your navigation logic here
    console.log("Get Started clicked");
    // Example: navigate('/signup');
  };

  return (
    <div className="dive-into-container">
      <div className="dive-into-content">
        {/* Left side - Project description */}
        <motion.div 
          className="project-description"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="header-section">
            <h1>Smart<span>Exam</span> System</h1>
            <p className="tagline">Modern assessment platform for academic institutions</p>
          </div>
          
          <div className="system-overview">
            <p>
              A comprehensive solution combining <strong>biometric security</strong>, <strong>automated grading</strong>, 
              and <strong>real-time analytics</strong> to streamline examination processes while maintaining 
              the highest standards of academic integrity.
            </p>
          </div>

          {/* Active feature description */}
          <motion.div
            className="feature-description"
            key={activeFeature}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="feature-header">
              <div className="icon-wrapper" style={{ backgroundColor: features[activeFeature].color }}>
                {features[activeFeature].icon}
              </div>
              <h2>{features[activeFeature].title}</h2>
            </div>
            <p>{features[activeFeature].description}</p>
          </motion.div>

          {/* Get Started Button Section */}
          <motion.div
            className="cta-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <p className="cta-text">Interested? Let's get your institution started!</p>
            <motion.button 
              className="get-started-button"
              onClick={handleGetStarted}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              Get Started
              <FaArrowRight className="arrow-icon" />
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Right side - Feature cards */}
        <div className="feature-cards-container">
          <h3 className="features-title">Core Features</h3>
          <div className="feature-cards">
            {features.map((feature, index) => (
              <motion.div
                key={feature.id}
                className={`feature-card ${activeFeature === index ? 'active' : ''}`}
                onClick={() => setActiveFeature(index)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                style={{ backgroundColor: feature.color }}
              >
                <div className="feature-content">
                  {feature.icon}
                  <div className="feature-overlay">
                    <h3>{feature.title}</h3>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiveInto;