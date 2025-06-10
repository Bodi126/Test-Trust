// src/pages/TwoFactorAuth.js
import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from './contexts/AuthContext';
import { 
  TextField, 
  Button, 
  Typography, 
  CircularProgress,
  Box,
  Paper,
  Container,
  Alert
} from '@mui/material';
import axios from 'axios';

const TwoFactorAuth = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [success, setSuccess] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { login } = useContext(AuthContext);

  useEffect(() => {
    // Get email from location state or params
    const userEmail = location.state?.email || params.email;
    
    if (!userEmail) {
      // If no email in state or params, try to get it from the URL
      const queryParams = new URLSearchParams(location.search);
      const emailFromQuery = queryParams.get('email');
      
      if (!emailFromQuery) {
        navigate('/login');
        return;
      }
      
      setEmail(emailFromQuery);
    } else {
      setEmail(userEmail);
    }
    
    // Start countdown for resend button
    setCountdown(30);
    const timer = setInterval(() => {
      setCountdown(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [location, navigate, params]);

  const handleVerify = async (e) => {
    e?.preventDefault();
    
    if (!code || code.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log('[2FA] Attempting to verify code for:', email.trim());
      
      const response = await axios.post('http://localhost:5000/api/auth/verify-2fa', 
        {
          email: email.trim(),
          code: code
        },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('[2FA] Full response:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data
      });

      if (response.data && response.data.valid === true) {
        console.log('[2FA] Verification successful, processing response...');
        
        // Ensure we have required data
        if (!response.data.token) {
          throw new Error('No token received in response');
        }
        
        // Save token and user data
        localStorage.setItem('token', response.data.token);
        
        // Update user data with last login time
        const userData = response.data.user || {};
        userData.lastLogin = new Date().toISOString();
        
        console.log('[2FA] Saving user data:', userData);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Store email in localStorage for dashboard access
        if (userData.email) {
          localStorage.setItem('userEmail', userData.email);
          console.log('[2FA] Stored user email in localStorage');
        }
        
        // Update auth context with the logged-in user
        console.log('[2FA] Updating auth context');
        login(userData, response.data.token);
        
        // Also set a global flag for any legacy code that might be checking it
        if (window.updateAuthState) {
          console.log('[2FA] Updating legacy auth state');
          window.updateAuthState({
            isAuthenticated: true,
            user: userData,
            token: response.data.token
          });
        }
        
        setSuccess('Verification successful! Redirecting...');
        console.log('[2FA] Navigating to dashboard...');
        
        // Use window.location for more reliable navigation
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      } else {
        const errorMsg = response.data?.message || 'Verification failed. Please try again.';
        console.error('[2FA] Verification failed:', errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      console.error('Verification error:', err);
      const errorMessage = err.response?.data?.message || 
                         err.response?.data?.error || 
                         'Failed to verify code. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    
    setResending(true);
    setError('');
    
    try {
      const response = await axios.post('http://localhost:5000/send-2fa-code', { 
        email: email.trim() 
      });
      
      if (response.data.testCode) {
        console.log('Test code (development only):', response.data.testCode);
      }
      
      setCountdown(30);
      setSuccess('A new verification code has been sent to your email.');
    } catch (err) {
      console.error('Resend error:', err);
      setError('Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper 
        elevation={3} 
        sx={{
          marginTop: 8,
          padding: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          borderRadius: 2,
          boxShadow: '0 3px 10px rgba(0,0,0,0.1)'
        }}
      >
        <Typography component="h1" variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
          Two-Factor Authentication
        </Typography>
        
        {success && (
          <Alert severity="success" sx={{ width: '100%', mb: 3 }}>
            {success}
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleVerify} sx={{ width: '100%', mt: 1 }}>
          <Typography variant="body1" align="center" sx={{ mb: 3 }}>
            We've sent a 6-digit verification code to:
            <br />
            <strong>{email}</strong>
          </Typography>
          
          <TextField
            label="Verification Code"
            variant="outlined"
            fullWidth
            margin="normal"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
              setError('');
            }}
            error={!!error}
            helperText={error ? error : ' '}
            inputProps={{ 
              maxLength: 6,
              inputMode: 'numeric',
              pattern: '[0-9]*',
              style: { 
                textAlign: 'center',
                fontSize: '1.5rem',
                letterSpacing: '0.5em',
                padding: '12px 0'
              }
            }}
            sx={{ mb: 3 }}
            autoFocus
            autoComplete="one-time-code"
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              mt: 1,
              mb: 2,
              py: 1.5,
              fontSize: '1rem',
              background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
              }
            }}
            disabled={loading || code.length !== 6}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Verify Code'
            )}
          </Button>
          
          <Box sx={{ textAlign: 'center', mt: 2, mb: 1 }}>
            <Typography variant="body2" color="textSecondary">
              Didn't receive a code?
            </Typography>
            <Button
              onClick={handleResend}
              disabled={resending || countdown > 0}
              sx={{
                textTransform: 'none',
                color: countdown > 0 ? 'text.secondary' : 'primary.main',
                fontWeight: 'medium',
                '&:hover': {
                  backgroundColor: 'transparent',
                  textDecoration: 'underline',
                },
                '&.Mui-disabled': {
                  color: 'text.disabled',
                }
              }}
            >
              {resending ? (
                <CircularProgress size={20} />
              ) : countdown > 0 ? (
                `Resend code in ${countdown}s`
              ) : (
                'Resend code'
              )}
            </Button>
          </Box>
          
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button
              onClick={() => navigate('/login')}
              color="primary"
              size="small"
              sx={{ textTransform: 'none' }}
            >
              Back to Login
            </Button>
          </Box>
        </Box>
      </Paper>
      
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Having trouble? Contact support@testtrust.com
        </Typography>
      </Box>
    </Container>
  );
};

export default TwoFactorAuth;