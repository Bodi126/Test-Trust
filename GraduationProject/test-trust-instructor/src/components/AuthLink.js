import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const AuthLink = ({ to, className, children }) => {
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);

  const handleClick = (e) => {
    e.preventDefault();
    if (currentUser) {
      navigate('/dashboard');
    } else {
      navigate(to);
    }
  };

  return (
    <Link to={to} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
};

export default AuthLink;
