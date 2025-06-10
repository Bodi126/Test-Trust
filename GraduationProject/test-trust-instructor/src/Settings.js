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
import axios from 'axios';
import './Settings.css';

const Settings = () => {
  const onSubmit = (data) => {
    console.log('Form submitted:', data);
    // Add form submission logic here
  };

  const [profileData, setProfileData] = useState(null);
  const { register, handleSubmit, reset } = useForm();
  const [anchorEl, setAnchorEl] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [colorTheme, setColorTheme] = useState('#6e48aa');
  const [contactOpen, setContactOpen] = useState(false);
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loginNotificationsEnabled, setLoginNotificationsEnabled] = useState(true);
  const [allExams, setAllExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState('');
  const [twoFactorSuccess, setTwoFactorSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const examCount = allExams.length; // Calculate count from allExams array
  
  // Handle edit profile
  const handleEditClick = () => {
    setIsEditing(true);
  };

  // Handle save profile
  const handleSaveProfile = (data) => {
    console.log('Saving profile:', data);
    // Here you would typically make an API call to save the profile
    // For now, we'll just update the local state
    setProfileData(prev => ({
      ...prev,
      firstName: data.firstName,
      lastName: data.lastName
    }));
    setIsEditing(false);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    reset(profileData); // Reset form to original values
    setIsEditing(false);
  };

  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const currentUser = JSON.parse(localStorage.getItem('user'));

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
  }, [currentUser, reset, navigate]);

  const handleSignOut = () => {
    logout();
    navigate('/App');
  };

  const handleLoginNotificationsToggle = async (event) => {
    const enabled = event.target.checked;
    try {
      await axios.post('http://localhost:5000/api/auth/login-notifications', {
        email: currentUser.email,
        enabled
      });
      setLoginNotificationsEnabled(enabled);
    } catch (err) {
      console.error('Failed to update login notifications:', err);
    }
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleOptionSelect = (option) => {
    handleMenuClose();
    if (option === 'dashboard') {
      navigate('/Dashboard');
    } else if (option === 'remove') {
      alert('A confirmation email will be sent to your registered email address to confirm account deletion.');
    } else if (option === 'contact') {
      setContactOpen(true);
    }
  };

  const handleContactSubmit = () => {
    console.log("Contact form submitted:", { email: contactEmail, message: contactMessage });
    setContactOpen(false);
    setContactEmail('');
    setContactMessage('');
    alert('Your message has been sent successfully!');
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

  const colorThemes = [
    '#6e48aa', // Purple
    '#4776E6', // Blue
    '#00C9A7', // Teal
    '#FF6B6B', // Coral
    '#FFC75F'  // Gold
  ];

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

  const renderTabContent = () => {
    if (!profileData) {
      return (
        <Box className="loading-spinner">
          <div className="pulse-animation"></div>
          <Typography variant="body2" sx={{ mt: 2 }}>Loading your settings...</Typography>
        </Box>
      );
    }
    switch (activeTab) {
      case 'profile':
        return (
          <div className="tab-content">
            <h3>Profile Settings</h3>
            <form onSubmit={handleSubmit(handleSaveProfile)}>
              <TextField
                label="First Name"
                {...register('firstName')}
                fullWidth
                margin="normal"
                disabled={!isEditing}
                InputLabelProps={{
                  shrink: true,
                }}
              />
              <TextField
                label="Last Name"
                {...register('lastName')}
                fullWidth
                margin="normal"
                disabled={!isEditing}
                InputLabelProps={{
                  shrink: true,
                }}
              />
              <TextField
                label="Email"
                type="email"
                {...register('email')}
                fullWidth
                margin="normal"
                disabled
              />
              
              {isEditing ? (
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <Button 
                    type="button" 
                    variant="outlined" 
                    onClick={handleCancelEdit}
                    sx={{
                      borderRadius: '12px',
                      textTransform: 'none',
                      padding: '8px 24px',
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      '&:hover': {
                        borderColor: 'rgba(255, 255, 255, 0.4)',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)'
                      }
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    variant="contained" 
                    color="primary" 
                    sx={{
                      borderRadius: '12px',
                      textTransform: 'none',
                      padding: '8px 24px',
                      background: 'linear-gradient(135deg, var(--theme-color) 0%, #9a4dff 100%)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 25px rgba(110, 72, 170, 0.5)'
                      }
                    }}
                  >
                    Save Changes
                  </Button>
                </div>
              ) : (
                <Button 
                  type="button"
                  variant="outlined"
                  onClick={handleEditClick}
                  sx={{
                    marginTop: '20px',
                    borderRadius: '12px',
                    textTransform: 'none',
                    padding: '8px 24px',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    '&:hover': {
                      borderColor: 'var(--theme-color)',
                      backgroundColor: 'rgba(110, 72, 170, 0.1)'
                    }
                  }}
                >
                  Edit Profile
                </Button>
              )}
            </form>
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
          <div className="settings-tab">
            <div className="settings-section">
              <Typography variant="h6" className="section-title">
                <SecurityIcon /> Account Security
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
                      : "Get alerts for new logins"}
                  </Typography>
                </div>
                <Switch 
                  checked={loginNotificationsEnabled}
                  onChange={handleLoginNotificationsToggle}
                  color="primary" 
                />
              </div>
            </div>

            <div className="settings-section">
              <Typography variant="h6" className="section-title">
                <NotificationsIcon /> Notifications
              </Typography>
              <div className="setting-item">
                <div className="setting-text">
                  <Typography>Email Notifications</Typography>
                  <Typography variant="caption">Receive updates via email</Typography>
                </div>
                <Switch defaultChecked color="primary" />
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
            aria-label="more"
            aria-controls="long-menu"
            aria-haspopup="true"
            onClick={handleMenuClick}
            className="menu-button"
          >
            <MenuIcon />
          </IconButton>
          <Menu
            id="long-menu"
            anchorEl={anchorEl}
            keepMounted
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            TransitionComponent={Fade}
          >
            {['Profile', 'Settings', 'Activity'].map((option) => (
              <MenuItem
                key={option}
                selected={option.toLowerCase() === activeTab}
                onClick={() => handleOptionSelect(option.toLowerCase())}
              >
                {option}
              </MenuItem>
            ))}
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
    </div>
  );
};

export default Settings;