import React, { useState } from 'react';
import { FaFacebook, FaInstagram, FaLinkedin, FaTimes, FaGithub } from 'react-icons/fa';
import { MdSchool, MdWork } from 'react-icons/md';
import './TeamMember.css';

const TeamMember = ({ member }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="team-circle" onClick={() => setIsOpen(true)}>
        <div 
          className="circle-image" 
          style={{ backgroundImage: `url(${member.image})` }}
        />
        <div className="circle-overlay">
          <h3>{member.name}</h3>
          <p>{member.role}</p>
        </div>
      </div>

      {isOpen && (
        <div className="member-modal" onClick={() => setIsOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setIsOpen(false)}>
              <FaTimes />
            </button>
            
            <div className="modal-header">
              <div 
                className="modal-image" 
                style={{ backgroundImage: `url(${member.image})` }}
              />
              <div className="member-info">
                <h2>{member.name}</h2>
                <p className="role">{member.role}</p>
                <div className="social-links">
                  {member.github && (
                    <a href={member.github} target="_blank" rel="noopener noreferrer">
                      <FaGithub />
                    </a>
                  )}
                  {member.linkedin && (
                    <a href={member.linkedin} target="_blank" rel="noopener noreferrer">
                      <FaLinkedin />
                    </a>
                  )}
                  {member.facebook && (
                    <a href={member.facebook} target="_blank" rel="noopener noreferrer">
                      <FaFacebook />
                    </a>
                  )}
                  {member.instagram && (
                    <a href={member.instagram} target="_blank" rel="noopener noreferrer">
                      <FaInstagram />
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-body">
              <div className="info-item">
                <MdSchool className="icon" />
                <p>{member.education}</p>
              </div>
              <div className="info-item">
                <MdWork className="icon" />
                <p>{member.experience}</p>
              </div>
              <div className="bio">
                <p>{member.bio}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TeamMember;