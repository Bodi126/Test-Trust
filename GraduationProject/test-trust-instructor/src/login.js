import './login.css';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Logo from './images/Logo.jpg';

function valid(values) {
  const errors = {};
  const email_pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!values.email.trim()) {
    errors.email = "Email is required!";
  } else if (!email_pattern.test(values.email)) {
    errors.email = "Email is not valid!";
  }

  if (!values.password.trim()) {
    errors.password = "Password is required!";
  }

  return errors;
}

function Login() {
  const [values, setValues] = useState({
    email:'',
    password:''
  });

  const [errors, setErrors] = useState({});

  const [loginError, setLoginError] = useState('');
  const navigate = useNavigate();

  function handleChange(event) {
    const { name, value } = event.target;
    setValues({ ...values, [name]: value });
  }

  async function validation(event) {
    event.preventDefault();
    const validationErrors = valid(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      try {
        console.log('Attempting login with:', values.email);
        const response = await axios.post('http://localhost:5000/api/auth/login', values);
        const { user, token } = response.data;
        
        console.log('Login successful, user:', user);
        console.log('Token received:', token ? 'Token received' : 'No token');
        
        if (user.twoFactorEnabled) {
          console.log('2FA enabled, redirecting to 2FA page');
          localStorage.setItem('pendingUser', JSON.stringify(user));
          localStorage.setItem('pendingToken', token);
          localStorage.setItem('userEmail', user.email);
          navigate(`/two-factor-auth?email=${encodeURIComponent(user.email)}`);
        } else {
          console.log('Regular login, storing token and redirecting');
          localStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('token', token);
          localStorage.setItem('userEmail', user.email);
          
          // Force a page reload to ensure all components get the new auth state
          window.location.href = '/dashboard';
        }
      } catch (error) {
        console.error('Login error:', error);
        const errorMessage = error.response?.data?.message || 'Invalid credentials';
        console.log('Login failed:', errorMessage);
        setLoginError(errorMessage);
      }
    }
  }


  return (
    <div className="auth-container">
      <button className="back-button" onClick={() => navigate('/')}>
        <span className="arrow">←</span> Back
      </button>

      <div className="logo-container">
        <img src={Logo} alt="Company Logo" className="auth-logo" />
      </div>

      <div className="auth-card">
        <h2 className="auth-title">Login to Your Account</h2>

        <form className="auth-form" onSubmit={validation}>
          <div className="input-group">
            <label htmlFor="email" className="email-label">Email</label>
            <input
              type="text"
              id="email"
              placeholder="Enter your Email address"
              name="email"
              value={values.email}
              onChange={handleChange}
              className="auth-input"
            />
            {errors.email && <p style={{ color: 'red' }}>{errors.email}</p>}
          </div>

          <div className="input-group">
            <label htmlFor="password" className='password-label'>Password</label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              name="password"
              value={values.password}
              onChange={handleChange}
              className="auth-input"
            />
            {errors.password && <p style={{ color: 'red' }}>{errors.password}</p>}
          </div>

          <div className="options-row">
            <div className="remember-me">
              <input type="checkbox" id="remember" />
              <label htmlFor="remember">Remember me</label>
            </div>
            <span className="forgot-password" onClick={() => navigate('/ForgetPassword')}>
              Forgot password?
            </span>
          </div>

          <button type="submit" className="auth-button">Login</button>
        </form>

        {loginError && <p style={{ color: 'red', marginTop: '10px' }}>{loginError}</p>}

        <div className="auth-footer">
          Don't have an account? <span className="auth-link" onClick={() => navigate('/signup')}>Sign up</span>
        </div>
      </div>
    </div>
  );
}

export default Login;
