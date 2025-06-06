// src/pages/TwoFactorAuth.js
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  TextField, 
  Button, 
  Typography, 
  CircularProgress,
  Box
} from '@mui/material';
import axios from 'axios';

const TwoFactorAuth = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const userEmail = queryParams.get('email');
    
    if (!userEmail) {
      navigate('/login');
      return;
    }
    
    setEmail(userEmail);
    setCountdown(30);
    
    const timer = setInterval(() => {
      setCountdown(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [location, navigate]);

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/auth/verify-2fa', {
        email,
        code
      });
      
      if (response.data.valid) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/Dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    
    setResending(true);
    try {
      await axios.post('http://localhost:5000/api/auth/send-2fa-code', { email });
      setCountdown(30);
      setError('');
    } catch (err) {
      setError('Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <Box className="two-factor-container">
      <Typography variant="h5" gutterBottom>
        Two-Factor Authentication
      </Typography>
      <Typography variant="body1" gutterBottom>
        We've sent a 6-digit verification code to your email at {email}
      </Typography>
      
      <TextField
        label="Verification Code"
        variant="outlined"
        fullWidth
        margin="normal"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        error={!!error}
        helperText={error}
        inputProps={{ maxLength: 6 }}
      />
      
      <Button
        variant="contained"
        color="primary"
        fullWidth
        onClick={handleVerify}
        disabled={loading}
      >
        {loading ? <CircularProgress size={24} /> : 'Verify'}
      </Button>
      
      <Button
        variant="outlined"
        color="secondary"
        fullWidth
        onClick={handleResend}
        disabled={resending || countdown > 0}
        sx={{ mt: 2 }}
      >
        {resending ? (
          <CircularProgress size={24} />
        ) : countdown > 0 ? (
          `Resend in ${countdown}s`
        ) : (
          'Resend Code'
        )}
      </Button>
    </Box>
  );
};

export default TwoFactorAuth;