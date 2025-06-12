import React, { useState, useEffect, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './contexts/AuthContext';
import { 
  Avatar, 
  Button, 
  TextField, 
  IconButton, 
  Menu, 
  MenuItem,
  Typography,
  Box,
  Fade,
  Slide,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Alert,
  CircularProgress,
  Paper
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PaletteIcon from '@mui/icons-material/Palette';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SecurityIcon from '@mui/icons-material/Security';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LockIcon from '@mui/icons-material/Lock';
import LogoutIcon from '@mui/icons-material/Logout';
import HomeIcon from '@mui/icons-material/Home';
import ContactSupportIcon from '@mui/icons-material/ContactSupport';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import axios from 'axios';
import './Settings.css';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import DialogContentText from '@mui/material/DialogContentText';

const Settings = () => {
  // State variables
  const [profileData, setProfileData] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [contactOpen, setContactOpen] = useState(false);
  const [allExams, setAllExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState('');
  const [twoFactorSuccess, setTwoFactorSuccess] = useState('');
  const [colorTheme, setColorTheme] = useState('#6e48aa');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  
  const examCount = allExams.length; // Calculate count from allExams array
  const navigate = useNavigate();
  const { register, reset, handleSubmit } = useForm();
  const { logout } = useContext(AuthContext);
  const currentUser = JSON.parse(localStorage.getItem('user'));
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(currentUser?.twoFactorEnabled || false);
  const [loginNotificationsEnabled, setLoginNotificationsEnabled] = useState(currentUser?.loginNotificationsEnabled ?? true);
  
  // Sync 2FA state with user data on component mount and when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setTwoFactorEnabled(currentUser.twoFactorEnabled || false);
      setLoginNotificationsEnabled(currentUser.loginNotificationsEnabled ?? true);
    }
  }, [currentUser]);
  
  const onSubmit = (data) => {
    console.log('Form submitted:', data);
    // Handle form submission if needed
  };
  
  const colorThemes = [
    '#6e48aa', // Purple
    '#4776E6', // Blue
    '#00C9A7', // Teal
    '#FF6B6B', // Coral
    '#FFC75F'  // Gold
  ];
  
  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleteError('');
      const token = localStorage.getItem('token');
      const userEmail = currentUser?.email || '';
      
      if (!token || !userEmail) {
        setDeleteError('Authentication error. Please log in again.');
        return;
      }

      const response = await fetch('http://localhost:5000/api/auth/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: userEmail,
          password: password
        }),
        credentials: 'include' // Important for cookie-based sessions
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete account');
      }

      // Clear all auth-related data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // If using context or global state for auth, update it here
      if (logout) {
        logout();
      }
      
      // Navigate to root path which should be handled by your router
      // This assumes your App component is rendered at the root path '/'
      window.location.href = '/';
      // No need for reload() as href assignment will trigger a page load
      
    } catch (error) {
      console.error('Delete account error:', error);
      setDeleteError(error.message || 'Failed to delete account. Please try again.');
    } finally {
      setDeleteDialogOpen(false);
      setPassword('');
    }
  };

  const handleOptionSelect = (option) => {
    handleMenuClose();
    if (option === 'dashboard') {
      navigate('/Dashboard');
    } else if (option === 'delete-account') {
      setDeleteDialogOpen(true);
    } else if (option === 'contact') {
      setContactOpen(true);
    }
  };
  
  const handleContactSubmit = async () => {
    try {
      const response = await fetch('/api/auth/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          email: contactEmail,
          message: contactMessage
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send message');
      }

      setContactOpen(false);
      setContactEmail('');
      setContactMessage('');
      
      // Show success message
      alert(data.message || 'Your message has been sent successfully!');
    } catch (error) {
      console.error('Error submitting contact form:', error);
      alert(error.message || 'Failed to send message. Please try again later.');
    }
  };
  
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const checkNotificationSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await axios.get(
        'http://localhost:5000/api/auth/debug/notification-settings',
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Current notification settings:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('Error checking notification settings:', error);
      throw error;
    }
  };

  const handleLoginNotificationsToggle = async (event) => {
    const newValue = event.target.checked;
    console.log('[FRONTEND] Toggling login notifications to:', newValue);
    
    try {
      // Update UI immediately for better UX
      setLoginNotificationsEnabled(newValue);
      
      // Get auth token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Make API call to update preference
      console.log('[FRONTEND] Sending update request to server...');
      const response = await axios.post(
        'http://localhost:5000/api/auth/update-login-notifications',
        { enabled: newValue },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('[FRONTEND] Server response:', response.data);
      
      if (response.data.success) {
        // Fetch the latest user data from the server to ensure consistency
        const userResponse = await axios.get(
          `http://localhost:5000/api/auth/user/${currentUser._id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (userResponse.data) {
          // Update local storage with the complete user data from the server
          localStorage.setItem('user', JSON.stringify(userResponse.data));
          // Update the current user state
          setLoginNotificationsEnabled(userResponse.data.loginNotificationsEnabled);
          
          setTwoFactorSuccess(
            `Login notifications ${userResponse.data.loginNotificationsEnabled ? 'enabled' : 'disabled'} successfully`
          );
        } else {
          // Fallback to optimistic update if user fetch fails
          const updatedUser = { ...currentUser, loginNotificationsEnabled: newValue };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setTwoFactorSuccess(
            `Login notifications ${newValue ? 'enabled' : 'disabled'} successfully`
          );
        }
      } else {
        // If server reports failure, revert the UI
        setLoginNotificationsEnabled(!newValue);
        setTwoFactorError(response.data.message || 'Failed to update preference');
      }
      
    } catch (error) {
      console.error('[FRONTEND] Error updating login notifications:', error);
      
      // Revert UI on error
      setLoginNotificationsEnabled(!newValue);
      
      // Show error message
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to update login notifications';
      setTwoFactorError(errorMessage);
    } finally {
      // Clear messages after 3 seconds
      setTimeout(() => {
        setTwoFactorSuccess('');
        setTwoFactorError('');
      }, 3000);
    }
  };
  
  const ActivityItem = ({ icon, primary, secondary, time, success, star, warning }) => (
    <>
      <ListItem className="activity-item">
        <ListItemAvatar>
          <Avatar className={`activity-icon ${success ? 'success' : ''} ${star ? 'star' : ''} ${warning ? 'warning' : ''}`}>
            {icon}
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={primary}
          secondary={
            <>
              <Typography component="span" variant="body2">
                {secondary}
              </Typography>
              <Typography variant="caption" className="activity-time">
                {time}
              </Typography>
            </>
          }
        />
      </ListItem>
      <Divider variant="inset" component="li" />
    </>
  );



  // Fetch user's exams - matches Dashboard's implementation
  const fetchExams = async () => {
    try {
      console.log('[Settings] Starting to fetch exams...');
      setLoading(true);
      setError(null);
      
      const userEmail = localStorage.getItem('userEmail') || currentUser?.email;
      console.log('[Settings] Using email:', userEmail);
      
      if (!userEmail) {
        const errorMsg = 'User not logged in';
        console.error('[Settings]', errorMsg);
        throw new Error(errorMsg);
      }
      
      const token = localStorage.getItem('token');
      console.log('[Settings] Token exists:', !!token);
      
      if (!token) {
        const errorMsg = 'No authentication token found';
        console.error('[Settings]', errorMsg);
        throw new Error(errorMsg);
      }
      
      console.log('[Settings] Making API request to fetch exams...');
      const response = await axios.get(
        `http://localhost:5000/api/auth/my-exams?user=${encodeURIComponent(userEmail)}`,
        { 
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      
      console.log('[Settings] API Response:', {
        status: response.status,
        data: response.data,
        examsCount: response.data?.exams?.length || 0
      });
      
      if (response.data && Array.isArray(response.data.exams)) {
        console.log(`[Settings] Found ${response.data.exams.length} exams`);
        setAllExams(response.data.exams);
        console.log('[Settings] Updated allExams state:', response.data.exams);
      } else {
        const errorMsg = 'Unexpected response format: exams array not found';
        console.error('[Settings]', errorMsg, response.data);
        setError(errorMsg);
        setAllExams([]);
      }
    } catch (err) {
      const errorDetails = {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        config: {
          url: err.config?.url,
          method: err.config?.method
        }
      };
      console.error('[Settings] Error fetching exams:', errorDetails);
      setError(err.response?.data?.message || err.message || 'Failed to load exams');
      setAllExams([]);
    } finally {
      console.log('[Settings] Finished fetching exams, loading:', false);
      setLoading(false);
    }
  };

  // Handle 2FA toggle
  const handleTwoFactorToggle = async (event) => {
    const enabled = event.target.checked;
    const originalState = twoFactorEnabled;
    
    if (!currentUser?.email) {
      alert("User email not found. Please log in again.");
      handleSignOut();
      return;
    }

    // If disabling 2FA, show confirmation dialog
    if (!enabled) {
      const confirmDisable = window.confirm(
        'Are you sure you want to disable two-factor authentication? This will reduce the security of your account.'
      );
      
      if (!confirmDisable) {
        // If user cancels, revert the toggle
        event.target.checked = true;
        return;
      }
    }

    setTwoFactorLoading(true);
    setTwoFactorError('');
    setTwoFactorSuccess('');
    
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      const response = await axios.post(
        'http://localhost:5000/api/auth/toggle-2fa',
        { email: currentUser.email, enabled },
        config
      );
      
      if (response.data.success) {
        setTwoFactorEnabled(enabled);
        setTwoFactorSuccess(
          enabled 
            ? 'Two-factor authentication has been enabled. You will need to verify your identity on next login.'
            : 'Two-factor authentication has been disabled.'
        );
        
        // Update local user data
        const updatedUser = { 
          ...currentUser, 
          twoFactorEnabled: enabled 
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        if (enabled) {
          alert('On your next login, you will receive a verification code via email.');
        }
      } else {
        setTwoFactorError(response.data.message || 'Failed to update 2FA settings');
        // Revert the toggle if the API call fails
        setTwoFactorEnabled(originalState);
        event.target.checked = originalState;
      }
    } catch (error) {
      console.error('Error updating 2FA:', error);
      setTwoFactorEnabled(originalState);
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         'An error occurred while updating 2FA settings. Please try again.';
      setTwoFactorError(errorMessage);
      
      if (error.response?.status === 401) {
        logout();
      }
    } finally {
      setTwoFactorLoading(false);
    }
  };

  // Calculate days since account creation
  const calculateDaysWithApp = () => {
    if (!currentUser?.createdAt) return '1 day'; // Default if no creation date
    
    try {
      const joinDate = new Date(currentUser.createdAt);
      const currentDate = new Date();
      
      // Calculate difference in milliseconds and convert to days
      const diffTime = Math.abs(currentDate - joinDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Return singular or plural form
      return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
      
    } catch (err) {
      console.error('Error calculating account age:', err);
      return '1 day'; // Default on error
    }
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        if (!currentUser?.email) {
          navigate('/login');
          return;
        }
        
        const response = await axios.get(`http://localhost:5000/api/instructors/email/${currentUser.email}`);
        const instructorData = response.data;
        
        const formattedData = {
          name: `${instructorData.position} ${instructorData.firstName} ${instructorData.lastName}`,
          email: instructorData.email,
          idNumber: instructorData.idNumber,
          position: instructorData.position,
          firstName: instructorData.firstName,
          lastName: instructorData.lastName,
          createdAt: instructorData.createdAt || new Date().toISOString(),
          twoFactorEnabled: instructorData.twoFactorEnabled || false
        };
        
        console.log('[Settings] Setting profile data:', formattedData);
        setProfileData(formattedData);
        reset(formattedData);
        
        // Set 2FA state from user data
        if (instructorData.twoFactorEnabled !== undefined) {
          setTwoFactorEnabled(instructorData.twoFactorEnabled);
        } else if (currentUser.twoFactorEnabled !== undefined) {
          // Fallback to currentUser data if available
          setTwoFactorEnabled(currentUser.twoFactorEnabled);
        }

        // Fetch exams data
        console.log('[Settings] Fetching exams data...');
        await fetchExams();
      } catch (err) {
        console.error('[Settings] Failed to fetch profile:', {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data
        });
        
        if (currentUser) {
          console.log('[Settings] Using fallback data for current user');
          const fallbackData = {
            name: `${currentUser.position} ${currentUser.firstName} ${currentUser.lastName}`,
            email: currentUser.email,
            idNumber: currentUser.idNumber,
            position: currentUser.position,
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            createdAt: currentUser.createdAt || new Date().toISOString()
          };
          console.log('[Settings] Fallback data:', fallbackData);
          setProfileData(fallbackData);
          reset(fallbackData);
        }
      }
    };

    fetchProfileData();
  }, [currentUser, navigate]);

  const handleSignOut = () => {
    logout();
    navigate('/App');
  };

  // ... (rest of the code remains the same)

  const renderTabContent = () => {
    if (!profileData) {
      return (
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '300px',
          width: '100%',
          position: 'relative',
        }}>
          <Box sx={{
            position: 'relative',
            width: '80px',
            height: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3,
          }}>
            {/* Outer circle */}
            <Box sx={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              border: '3px solid rgba(110, 72, 170, 0.2)',
              borderTopColor: 'transparent',
              animation: 'spin 1.2s linear infinite',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' },
              },
            }} />
            {/* Middle circle */}
            <Box sx={{
              position: 'absolute',
              width: '70%',
              height: '70%',
              borderRadius: '50%',
              border: '3px solid rgba(110, 72, 170, 0.4)',
              borderTopColor: 'transparent',
              animation: 'spinReverse 1.5s linear infinite',
              '@keyframes spinReverse': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(-360deg)' },
              },
            }} />
            {/* Inner circle */}
            <Box sx={{
              position: 'absolute',
              width: '40%',
              height: '40%',
              borderRadius: '50%',
              border: '3px solid rgba(110, 72, 170, 0.6)',
              borderTopColor: 'transparent',
              animation: 'spin 2s linear infinite',
            }} />
            {/* Pulsing dot */}
            <Box sx={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6e48aa, #9d50bb)',
              boxShadow: '0 0 15px rgba(110, 72, 170, 0.8)',
              animation: 'pulse 1.5s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': { transform: 'scale(1)', opacity: 1 },
                '50%': { transform: 'scale(1.3)', opacity: 0.7 },
              },
            }} />
          </Box>
          <Typography variant="h6" sx={{
            color: '#fff',
            fontWeight: 500,
            mb: 1,
            background: 'linear-gradient(90deg, #fff, #d1c4e9)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'fadeIn 0.5s ease-out',
          }}>
            Loading Your Settings
          </Typography>
          <Typography variant="body2" sx={{
            color: 'rgba(255, 255, 255, 0.7)',
            maxWidth: '300px',
            textAlign: 'center',
            animation: 'fadeIn 0.5s 0.1s ease-out both',
          }}>
            Just a moment while we prepare your personalized settings...
          </Typography>
        </Box>
      );
    }
    switch (activeTab) {
      case 'profile':
        return (
          <div className="tab-content">
            <h3>Profile Information</h3>
            <div style={{ marginTop: '20px' }}>
              <TextField
                label="First Name"
                value={profileData?.firstName || ''}
                fullWidth
                margin="normal"
                disabled
                InputLabelProps={{
                  shrink: true,
                }}
              />
              <TextField
                label="Last Name"
                value={profileData?.lastName || ''}
                fullWidth
                margin="normal"
                disabled
                InputLabelProps={{
                  shrink: true,
                }}
              />
              <TextField
                label="Email"
                type="email"
                value={profileData?.email || ''}
                fullWidth
                margin="normal"
                disabled
              />
              <TextField
                label="ID Number"
                value={profileData?.idNumber || ''}
                fullWidth
                margin="normal"
                disabled
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </div>
          </div>
        );
      case 'security':
        return (
          <Box className="tab-content">
            <Typography variant="h5" gutterBottom>
              Security Settings
            </Typography>
            
            {/* Two-Factor Authentication Section */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0', borderRadius: 1 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <LockIcon color="primary" sx={{ mr: 2, fontSize: 30 }} />
                <Box>
                  <Typography variant="h6">Two-Factor Authentication</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Add an extra layer of security to your account
                  </Typography>
                </Box>
                <Box sx={{ ml: 'auto' }}>
                  {twoFactorLoading ? (
                    <CircularProgress size={24} />
                  ) : (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={twoFactorEnabled}
                          onChange={handleTwoFactorToggle}
                          color="primary"
                          disabled={twoFactorLoading}
                        />
                      }
                      label={twoFactorEnabled ? 'Enabled' : 'Disabled'}
                      labelPlacement="start"
                    />
                  )}
                </Box>
              </Box>
              
              {twoFactorError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {twoFactorError}
                </Alert>
              )}
              
              {twoFactorSuccess && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  {twoFactorSuccess}
                </Alert>
              )}
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                {twoFactorEnabled 
                  ? 'Two-factor authentication is currently enabled on your account. You will be required to enter a verification code during login.'
                  : 'Two-factor authentication adds an extra layer of security by requiring a verification code in addition to your password when signing in.'}
              </Typography>
            </Paper>
            
            {/* Change Password Section */}
            <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom>
                Password
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Change your password regularly to keep your account secure
              </Typography>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => navigate('/change-password')}
              >
                Change Password
              </Button>
            </Paper>
            
            {/* Login Notifications Section */}
            <Paper elevation={0} sx={{ p: 3, mt: 3, border: '1px solid #e0e0e0', borderRadius: 1 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <NotificationsIcon color="primary" sx={{ mr: 2, fontSize: 30 }} />
                <Box>
                  <Typography variant="h6">Login Notifications</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Get notified when someone logs into your account
                  </Typography>
                </Box>
                <Box sx={{ ml: 'auto' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={loginNotificationsEnabled}
                        onChange={handleLoginNotificationsToggle}
                        color="primary"
                      />
                    }
                    label={loginNotificationsEnabled ? 'Enabled' : 'Disabled'}
                    labelPlacement="start"
                  />
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {loginNotificationsEnabled 
                  ? 'You will receive email notifications for new logins.'
                  : 'Login notifications are currently disabled.'}
              </Typography>
            </Paper>

            <div className="form-actions">
              <Button
                variant="contained"
                color="error"
                size="medium"
                className="signout-btn"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </div>
          </Box>
        );
      
      case 'settings':
        return (
          <div className="settings-container">
            <div className="settings-header">
              <Typography variant="h4" className="settings-title">
                Account Settings
              </Typography>
            </div>
            
            <div className="settings-section">
              <Typography variant="h6" className="section-title">
                <SecurityIcon /> Security
              </Typography>
              
              <div className="setting-item">
                <div className="setting-text">
                  <Typography>Two-Factor Authentication</Typography>
                  <Typography variant="caption">
                    {twoFactorEnabled 
                      ? "Enabled - Next login will require PIN verification" 
                      : "Add an extra layer of security"}
                  </Typography>
                </div>
                <Switch 
                  checked={twoFactorEnabled}
                  onChange={handleTwoFactorToggle}
                  color="primary" 
                />
              </div>
              
              <div className="setting-item">
                <div className="setting-text">
                  <Typography>Login Notifications</Typography>
                  <Typography variant="caption">
                    {loginNotificationsEnabled 
                      ? "Enabled - You'll receive email alerts for logins" 
                      : "Disabled - No login alerts will be sent"}
                  </Typography>
                </div>
                <Switch 
                  checked={loginNotificationsEnabled}
                  onChange={handleLoginNotificationsToggle}
                  color="primary"
                />
              </div>
            </div>
            
            <div className="settings-section danger-zone">
              <Typography variant="h6" className="section-title" style={{ color: '#f44336' }}>
                <ErrorOutlineIcon /> Danger Zone
              </Typography>
              <div className="setting-item">
                <div className="setting-text">
                  <Typography>Delete Account</Typography>
                  <Typography variant="caption" color="error">
                    Permanently delete your account and all associated data
                  </Typography>
                </div>
                <Button 
                  variant="outlined" 
                  color="error"
                  startIcon={<DeleteForeverIcon />}
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  Delete Account
                </Button>
              </div>
            </div>
          </div>
        );
      
      case 'activity':
        return (
          <div className="activity-tab">
            <Typography variant="h6" className="recent-activity-title">
              Recent Activity
            </Typography>
            
            <List className="activity-list">
              <ActivityItem 
                icon={<CalendarTodayIcon />}
                primary="Exam Scheduled"
                secondary="Created final exam for CS101"
                time="1 day ago"
                success
              />
              <div className="activity-stats">
                <div className="stat-card">
                  <Typography variant="h4">{examCount}</Typography>
                  <Typography variant="caption">Exams</Typography>
                </div>
                <div className="stat-card">
                  <Typography variant="h4">0</Typography>
                  <Typography variant="caption">Students</Typography>
                </div>
                <div className="stat-card highlight">
                  <Typography variant="h4">0%</Typography>
                  <Typography variant="caption">Satisfaction</Typography>
                </div>
              </div>
            </List>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (!profileData) {
    return (
      <Box className="loading-spinner">
        <div className="pulse-animation"></div>
        <Typography>Loading</Typography>
      </Box>
    );
  }

  return (
    <div className="settings-container" style={{ '--theme-color': colorTheme }}>
      <div className="floating-bg-elements">
        <div className="bg-circle-1"></div>
        <div className="bg-circle-2"></div>
        <div className="bg-circle-3"></div>
      </div>

      <div className="header-actions">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <IconButton
            className="menu-button"
            onClick={handleMenuClick}
            aria-label="settings"
            aria-controls="settings-menu"
            aria-haspopup="true"
          >
            <MenuIcon className="menu-icon" />
          </IconButton>
          <Menu
            id="settings-menu"
            anchorEl={anchorEl}
            keepMounted
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            className="settings-menu"
            PaperProps={{
              style: {
                backgroundColor: '#1a1f2e',
                color: 'white',
                borderRadius: '12px',
                padding: '8px 0',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                minWidth: '200px',
              },
            }}
          >
            <MenuItem 
              onClick={() => handleOptionSelect('dashboard')}
              sx={{
                padding: '10px 16px',
                '&:hover': {
                  backgroundColor: 'rgba(110, 72, 170, 0.15)',
                },
              }}
            >
              <Box component="span" sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <HomeIcon sx={{ mr: 1.5, color: '#6e48aa' }} />
                <span>Go to Dashboard</span>
              </Box>
            </MenuItem>
            <MenuItem 
              onClick={() => handleOptionSelect('contact')}
              sx={{
                padding: '10px 16px',
                '&:hover': {
                  backgroundColor: 'rgba(110, 72, 170, 0.15)',
                },
              }}
            >
              <Box component="span" sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <ContactSupportIcon sx={{ mr: 1.5, color: '#6e48aa' }} />
                <span>Contact Us</span>
              </Box>
            </MenuItem>
            <Divider sx={{ my: 0.5, bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
            <MenuItem 
              onClick={() => handleOptionSelect('delete-account')}
              sx={{
                padding: '10px 16px',
                color: '#ff4d4f',
                '&:hover': {
                  backgroundColor: 'rgba(255, 77, 79, 0.1)',
                },
              }}
            >
              <Box component="span" sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <DeleteForeverIcon sx={{ mr: 1.5 }} />
                <span>Delete Account</span>
              </Box>
            </MenuItem>
          </Menu>
          <Button 
            variant="outlined" 
            color="error" 
            startIcon={<LogoutIcon />}
            onClick={handleSignOut}
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              padding: '8px 16px',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              '&:hover': {
                borderColor: '#ff4444',
                backgroundColor: 'rgba(255, 0, 0, 0.1)'
              }
            }}
          >
            Sign Out
          </Button>
          
          <div className="theme-selector">
            <PaletteIcon className="theme-icon" />
            {colorThemes.map((color) => (
              <div
                key={color}
                className={`theme-option ${colorTheme === color ? 'active' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setColorTheme(color)}
              />
            ))}
          </div>
        </div>
      </div>

      <Dialog open={contactOpen} onClose={() => setContactOpen(false)} className="contact-dialog">
        <DialogTitle className="contact-dialog-title">Contact Support</DialogTitle>
        <DialogContent className="contact-dialog-content">
          <TextField
            autoFocus
            margin="dense"
            label="Your Email"
            type="email"
            fullWidth
            variant="outlined"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="contact-input"
          />
          <TextField
            margin="dense"
            label="Your Message"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={4}
            value={contactMessage}
            onChange={(e) => setContactMessage(e.target.value)}
            className="contact-input"
          />
        </DialogContent>
        <DialogActions className="contact-dialog-actions">
          <Button onClick={() => setContactOpen(false)} className="contact-cancel-btn">
            Cancel
          </Button>
          <Button onClick={handleContactSubmit} className="contact-submit-btn">
            Send Message
          </Button>
        </DialogActions>
      </Dialog>

      <Slide direction="up" in={true} mountOnEnter unmountOnExit>
        <div className="profile-content">
          <div className="profile-header">
            <div className="profile-avatar-container">
              <div className="avatar-glow">
                <Avatar
                  src={avatar || ''}
                  alt={profileData.name}
                  className="profile-avatar"
                >
                  {!avatar && profileData.name.charAt(0)}
                </Avatar>
              </div>
              <input
                accept="image/*"
                id="avatar-upload"
                type="file"
                className="avatar-upload-input"
                onChange={handleAvatarChange}
              />
              <label htmlFor="avatar-upload" className="avatar-upload-label">
                <Button 
                  variant="outlined" 
                  component="span" 
                  startIcon={<CloudUploadIcon />}
                  className="avatar-upload-button"
                >
                  {avatar ? 'Change' : 'Upload'}
                </Button>
              </label>
            </div>
            <div className="profile-info">
              <Typography variant="h5" className="profile-name">
                {profileData.name}
              </Typography>
              <Typography variant="subtitle1" className="profile-title">
                ID: {profileData.idNumber} 
              </Typography>
              <div className="profile-stats">
                <div className="stat-item">
                  <div className="stat-value">{examCount}</div>
                  <div className="stat-label">Exams</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">0</div>
                  <div className="stat-label">Rating</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{calculateDaysWithApp().split(' ')[0]}</div>
                  <div className="stat-label">{calculateDaysWithApp().split(' ')[1]}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="tab-navigation">
            <button 
              className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              Profile
            </button>
            <button 
              className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              Settings
            </button>
            <button 
              className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
              onClick={() => setActiveTab('activity')}
            >
              Activity
            </button>
            <div className="tab-indicator" style={{ left: activeTab === 'profile' ? '0%' : activeTab === 'settings' ? '33.33%' : '66.66%' }}></div>
          </div>

          {renderTabContent()}
        </div>
      </Slide>

      {/* Delete Account Confirmation Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-account-dialog"
      >
        <DialogTitle id="delete-account-dialog">
          <ErrorOutlineIcon color="error" style={{ verticalAlign: 'middle', marginRight: 8 }} />
          Delete Your Account
        </DialogTitle>
        <DialogContent>
          <DialogContentText component="div">
            <Typography color="error" paragraph>
              <strong>Warning:</strong> This action cannot be undone. All your data will be permanently deleted.
            </Typography>
            <Typography paragraph>
              To confirm, please enter your password to continue with account deletion.
            </Typography>
            <TextField
              autoFocus
              margin="dense"
              id="password"
              label="Password"
              type="password"
              fullWidth
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!deleteError}
              helperText={deleteError}
            />
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setDeleteDialogOpen(false);
            setDeleteError('');
            setPassword('');
          }} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteAccount} 
            color="error"
            variant="contained"
            disabled={!password.trim()}
          >
            Delete My Account
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Settings;