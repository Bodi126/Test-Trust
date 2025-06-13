import React from 'react';
import TeamMember from './TeamMembers';
import './AboutUs.css';
import abdelrahmanImage from './assets/team-members/Abdelrahman.jpeg';
import shahdImage from './assets/team-members/Shahd.jpeg';
import hazemImage from './assets/team-members/Hazem.jpeg';

const AboutUs = () => {
  const teamMembers = [
    {
      id: 1,
      name: 'Abdelrahman Sherif',
      role: 'Project Lead',
      image: abdelrahmanImage,
      education: 'Information Communication Technology Networking track, NCTU',
      experience: '10+ years in software development',
      bio: 'Abdelrahman leads our team with expertise in software architecture and project management. He ensures our projects are delivered on time and meet the highest quality standards.',
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
    },
    {
      id: 2,
      name: 'Shahd Aboelkaramat',
      role: 'Backend Developer, Database Administrator',
      image: shahdImage,
      education: 'Information Communication Technology Networking track, NCTU',
      experience: '7 years in UX design',
      bio: 'Shahd creates intuitive and beautiful user interfaces that delight our users while maintaining excellent usability standards.',
      github: 'https://github.com',
      instagram: 'https://instagram.com',
    },
    {
      id: 3,
      name: 'George Magdy',
      role: 'IOT Engineer, AI Engineer',
      image: 'https://randomuser.me/api/portraits/men/22.jpg',
      education: 'Information Communication Technology Networking track, NCTU',
      experience: '5 years with React ecosystem',
      bio: 'George specializes in building responsive, performant frontends with modern React and TypeScript.',
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
    },
    {
      id: 4,
      name: 'Nour Tamer',
      role: 'Server Developer, API Specialist',
      image: 'https://randomuser.me/api/portraits/women/63.jpg',
      education: 'MS Software Engineering, CMU',
      experience: '6 years in backend systems',
      bio: 'Nour builds robust, scalable backend services and APIs that power our applications.',
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
    },
    {
      id: 5,
      name: 'Youssef Yehia',
      role: 'Frontend Developer, DevOps Engineer',
      image: 'https://randomuser.me/api/portraits/men/75.jpg',
      education: 'BS Information Technology, Georgia Tech',
      experience: '4 years in cloud infrastructure',
      bio: 'Youssef ensures our systems are reliable, scalable, and secure with modern DevOps practices.',
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
    },
    {
      id: 6,
      name: 'Hazem Ebrahim',
      role: 'QA Specialist, Penetration tester',
      image: hazemImage,
      education: 'BS Computer Science, UW',
      experience: '5 years in quality assurance',
      bio: 'Hazem meticulously tests our software to ensure it meets our high quality standards before reaching users.',
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
    }
  ];

  return (
    <div className="about-us-page">
      <div className="about-header">
        <h1>Meet Our Team</h1>
        <p>The talented individuals behind our project</p>
      </div>
      
      <div className="team-grid">
        {teamMembers.map(member => (
          <TeamMember key={member.id} member={member} />
        ))}
      </div>
    </div>
  );
};

export default AboutUs;