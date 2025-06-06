import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
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
  DialogActions
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PaletteIcon from '@mui/icons-material/Palette';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SecurityIcon from '@mui/icons-material/Security';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import axios from 'axios';
import './Settings.css';

const Settings = () => {
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

  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user'));

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
          lastName: instructorData.lastName
        };
        
        setProfileData(formattedData);
        setTwoFactorEnabled(instructorData.twoFactorEnabled || false);
        setLoginNotificationsEnabled(instructorData.loginNotificationsEnabled !== false);
        reset({
          name: `${instructorData.firstName} ${instructorData.lastName}`,
          email: instructorData.email
        });
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        if (currentUser) {
          const fallbackData = {
            name: `${currentUser.position} ${currentUser.firstName} ${currentUser.lastName}`,
            email: currentUser.email,
            idNumber: currentUser.idNumber,
            position: currentUser.position,
            firstName: currentUser.firstName,
            lastName: currentUser.lastName
          };
          setProfileData(fallbackData);
          reset(fallbackData);
        }
      }
    };

    fetchProfileData();
  }, [currentUser, reset, navigate]);

  const handleSignOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

const handleTwoFactorToggle = async (event) => {
  const enabled = event.target.checked;
  const originalState = twoFactorEnabled;

  if (!currentUser?.email) {
    alert("User email not found. Please log in again.");
    handleSignOut();
    return;
  }

  setTwoFactorEnabled(enabled);

  try {
    const token = localStorage.getItem('token');
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

    const response = await axios.post(
      'http://localhost:5000/instructors/two-factor',
      { email: currentUser.email, enabled },
      config
    );

    // Update local storage with new 2FA status
    const updatedUser = {
      ...currentUser,
      twoFactorEnabled: enabled
    };
    localStorage.setItem('user', JSON.stringify(updatedUser));

    alert(`Two-factor authentication ${enabled ? 'enabled' : 'disabled'} successfully!`);
    if (enabled) {
      alert('On your next login, you will receive a verification code via email.');
    }
  } catch (err) {
    setTwoFactorEnabled(originalState);
    const errorMessage = err.response?.data?.message ||
      err.message ||
      'Failed to update two-factor setting';
    console.error('2FA toggle error:', err, err.response);
    alert(`Error: ${errorMessage}. Please try again.`);
    if (err.response?.status === 401) {
      handleSignOut();
    }
  }
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
    switch (activeTab) {
      case 'profile':
        return (
          <div className="settings-form">
            <div className="form-fields">
              <div className="input-group">
                <label>Full Name</label>
                <TextField
                  variant="outlined"
                  fullWidth
                  className="form-input"
                  value={profileData?.name || ''}
                  disabled
                />
              </div>
              
              <div className="input-group">
                <label>Email</label>
                <TextField
                  variant="outlined"
                  fullWidth
                  type="email"
                  className="form-input"
                  value={profileData?.email || ''}
                  disabled
                />
              </div>
              
              <div className="input-group">
                <label>ID Number</label>
                <TextField
                  variant="outlined"
                  fullWidth
                  className="form-input"
                  value={profileData?.idNumber || ''}
                  disabled
                />
              </div>
              
              <div className="input-group">
                <label>Position</label>
                <TextField
                  variant="outlined"
                  fullWidth
                  className="form-input"
                  value={profileData?.position || ''}
                  disabled
                />
              </div>
            </div>

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
          </div>
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
                <Typography variant="h4">0</Typography>
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
        <Typography>Loading your profile...</Typography>
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
        <IconButton
          aria-label="settings"
          onClick={handleMenuClick}
          className="menu-button"
          size="small"
        >
          <MenuIcon className="menu-icon" />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          className="settings-menu"
          TransitionComponent={Fade}
        >
          <MenuItem onClick={() => handleOptionSelect('dashboard')}>Back to Dashboard</MenuItem>
          <MenuItem onClick={() => handleOptionSelect('remove')}>Remove Account</MenuItem>
          <MenuItem onClick={() => handleOptionSelect('contact')}>Contact Us</MenuItem>
        </Menu>

        <div className="theme-selector">
          {colorThemes.map((color) => (
            <div 
              key={color}
              className={`theme-option ${colorTheme === color ? 'active' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => setColorTheme(color)}
            />
          ))}
          <PaletteIcon className="theme-icon" />
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
            <div className="avatar-section">
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
                className="avatar-input"
                onChange={handleAvatarChange}
              />
              <label htmlFor="avatar-upload" className="avatar-label">
                <Button 
                  variant="outlined" 
                  component="span" 
                  startIcon={<CloudUploadIcon />}
                  className="avatar-upload-btn"
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
                  <div className="stat-value">0</div>
                  <div className="stat-label">Exams</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">0</div>
                  <div className="stat-label">Rating</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">0</div>
                  <div className="stat-label">Years</div>
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