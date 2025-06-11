import './login.css';
import React, { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from './contexts/AuthContext';
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
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(AuthContext);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues({ ...values, [name]: value });
  }

  async function validation(event) {
    event.preventDefault();
    setLoginError('');
    const validationErrors = valid(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      setIsLoading(true);
      try {
        console.log('[FRONTEND] Attempting login with email:', values.email);
        const response = await axios.post('http://localhost:5000/api/auth/login', {
          email: values.email.trim(),
          password: values.password
        });
        
        console.log('[FRONTEND] Login response:', response.data);
        
        if (response.data.require2FA) {
          // Handle 2FA case
          console.log('[FRONTEND] 2FA required for user:', values.email);
          // Navigate to 2FA page with email in state
          navigate('/two-factor-auth', { 
            state: { email: values.email },
            replace: true 
          });
        } else if (response.data.token) {
          // Handle successful login without 2FA
          const { user, token } = response.data;
          console.log('[FRONTEND] Login successful for user:', user.email);
          
          // Use the login function from AuthContext
          login(user, token);
          
          // Clear any pending 2FA state
          localStorage.removeItem('pendingUser');
          localStorage.removeItem('pendingToken');
          
          // Redirect to the intended page or dashboard
          const from = location.state?.from?.pathname || '/dashboard';
          navigate(from, { replace: true });
        } else {
          // Handle unexpected response
          console.error('[FRONTEND] Unexpected response format:', response.data);
          setLoginError('Invalid server response. Please try again.');
        }
      } catch (error) {
        console.error('[FRONTEND] Login error:', error);
        const errorMessage = error.response?.data?.message || 
                           error.message || 
                           'Failed to connect to the server. Please check your connection.';
        console.log('[FRONTEND] Login failed:', errorMessage);
        setLoginError(errorMessage);
        
        // Log the full error for debugging
        if (error.response) {
          console.error('[FRONTEND] Error response data:', error.response.data);
          console.error('[FRONTEND] Error status:', error.response.status);
          console.error('[FRONTEND] Error headers:', error.response.headers);
        } else if (error.request) {
          console.error('[FRONTEND] No response received:', error.request);
        } else {
          console.error('[FRONTEND] Error message:', error.message);
        }
      } finally {
        setIsLoading(false);
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
            <span className="forgot-password" onClick={() => navigate('/ForgetPassword')}>
              Forgot password?
            </span>
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
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
