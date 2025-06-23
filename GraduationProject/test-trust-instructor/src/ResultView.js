import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Select, 
  MenuItem, 
  InputLabel, 
  FormControl,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  LinearProgress,
  Chip,
  IconButton,
  CircularProgress,
  Alert
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ResultView.css';

const ResultView = () => {
  const navigate = useNavigate();
  const [yearFilter, setYearFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [summary, setSummary] = useState({
    totalResults: 0,
    passedResults: 0,
    failedResults: 0,
    passRate: 0,
    averageScore: 0,
    gradeDistribution: {}
  });
  const [filters, setFilters] = useState({
    years: ['All'],
    departments: ['All'],
    subjects: ['All']
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data from API
  const fetchResults = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (yearFilter !== 'All') params.append('year', yearFilter);
      if (departmentFilter !== 'All') params.append('department', departmentFilter);
      if (subjectFilter !== 'All') params.append('subject', subjectFilter);

      // Get user data from localStorage to filter by instructor
      const userData = JSON.parse(localStorage.getItem('user'));
      let apiUrl = '/api/results/dashboard';
      
      if (userData && userData.email) {
        // Use instructor-specific endpoint
        apiUrl = `/api/results/instructor/${encodeURIComponent(userData.email)}`;
      }

      const response = await axios.get(`${apiUrl}?${params.toString()}`);
      
      setResults(response.data.results);
      setFilteredResults(response.data.results);
      setSummary(response.data.summary);
      setFilters(response.data.filters);
    } catch (err) {
      console.error('Error fetching results:', err);
      setError('Failed to load results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchResults();
  }, []);

  // Update filtered results when filters change
  useEffect(() => {
    fetchResults();
  }, [yearFilter, departmentFilter, subjectFilter]);

  // Prepare chart data
  const chartData = filteredResults.reduce((acc, curr) => {
    const existing = acc.find(item => item.name === curr.subject);
    if (existing) {
      existing.score += curr.score;
      existing.count += 1;
    } else {
      acc.push({ name: curr.subject, score: curr.score, count: 1 });
    }
    return acc;
  }, []).map(item => ({
    subject: item.name,
    averageScore: Math.round(item.score / item.count)
  }));

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  // Loading state
  if (loading) {
    return (
      <div className="frame-container">
        <Container maxWidth="lg" className="result-container">
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ ml: 2 }}>
              Loading results...
            </Typography>
          </Box>
        </Container>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="frame-container">
        <Container maxWidth="lg" className="result-container">
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <IconButton onClick={fetchResults} sx={{ mr: 2 }}>
              <CircularProgress size={20} />
            </IconButton>
            <Typography>Click to retry</Typography>
          </Box>
        </Container>
      </div>
    );
  }

  return (
    <div className="frame-container">
      <Container maxWidth="lg" className="result-container">
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton 
            onClick={handleBackToDashboard}
            sx={{
              mr: 2,
              color: 'primary.main',
              bgcolor: 'rgba(63, 81, 181, 0.08)',
              '&:hover': {
                bgcolor: 'rgba(63, 81, 181, 0.2)',
                transform: 'translateX(-2px)'
              }
            }}
          >
            <ArrowBackIosNewIcon fontSize="small" />
          </IconButton>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Typography variant="h4" component="h1" className="page-title">
              Exam Results Dashboard
            </Typography>
            <Typography variant="subtitle1" className="page-subtitle">
              View and analyze student performance
            </Typography>
          </motion.div>
        </Box>

        <Paper className="filter-card">
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Academic Year</InputLabel>
                <Select
                  value={yearFilter}
                  label="Academic Year"
                  onChange={(e) => setYearFilter(e.target.value)}
                >
                  {filters.years.map(year => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select
                  value={departmentFilter}
                  label="Department"
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                >
                  {filters.departments.map(dept => (
                    <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Subject</InputLabel>
                <Select
                  value={subjectFilter}
                  label="Subject"
                  onChange={(e) => setSubjectFilter(e.target.value)}
                >
                  {filters.subjects.map(sub => (
                    <MenuItem key={sub} value={sub}>{sub}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        <div className="scrollable-content">
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <Paper className="chart-card">
                <Typography variant="h6" className="card-title">
                  Performance Overview
                </Typography>
                <Box className="chart-container">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="subject" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar 
                          dataKey="averageScore" 
                          fill="#3f51b5"
                          name="Average Score"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 250 }}>
                      <Typography variant="body2" color="text.secondary">
                        No data available for chart
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper className="summary-card">
                <Typography variant="h6" className="card-title">
                  Summary
                </Typography>
                <Box className="summary-content">
                  <Typography variant="body1" className="summary-item">
                    Total Results: <strong>{summary.totalResults}</strong>
                  </Typography>
                  <Typography variant="body1" className="summary-item">
                    Pass Rate: <strong>{summary.passRate}%</strong>
                  </Typography>
                  <Typography variant="body1" className="summary-item">
                    Average Score: <strong>{summary.averageScore}</strong>
                  </Typography>
                </Box>
                <Box className="progress-container">
                  <Typography variant="subtitle2" className="progress-title">
                    Score Distribution
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min(100, 
                      (summary.gradeDistribution['A+'] || 0 + summary.gradeDistribution['A'] || 0) / 
                      (summary.totalResults || 1) * 100
                    )} 
                    className="progress-bar grade-a"
                  />
                  <Typography variant="caption" className="progress-label">
                    A Grades: {(summary.gradeDistribution['A+'] || 0) + (summary.gradeDistribution['A'] || 0)}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min(100, 
                      (summary.gradeDistribution['B+'] || 0 + summary.gradeDistribution['B'] || 0 + summary.gradeDistribution['C+'] || 0 + summary.gradeDistribution['C'] || 0) / 
                      (summary.totalResults || 1) * 100
                    )} 
                    className="progress-bar grade-bc"
                  />
                  <Typography variant="caption" className="progress-label">
                    B-C Grades: {(summary.gradeDistribution['B+'] || 0) + (summary.gradeDistribution['B'] || 0) + (summary.gradeDistribution['C+'] || 0) + (summary.gradeDistribution['C'] || 0)}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min(100, 
                      (summary.gradeDistribution['F'] || 0) / 
                      (summary.totalResults || 1) * 100
                    )} 
                    className="progress-bar grade-f"
                  />
                  <Typography variant="caption" className="progress-label">
                    F Grades: {summary.gradeDistribution['F'] || 0}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          <Paper className="table-card">
            <Typography variant="h6" className="card-title">
              Student Results
            </Typography>
            <TableContainer sx={{ maxHeight: 300 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Year</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell align="right">Score</TableCell>
                    <TableCell>Grade</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredResults.length > 0 ? (
                    filteredResults.map((result) => (
                      <TableRow key={result.id} hover>
                        <TableCell>
                          <Box className="student-cell">
                            <Avatar className="student-avatar">
                              {result.avatar}
                            </Avatar>
                            {result.name}
                          </Box>
                        </TableCell>
                        <TableCell>{result.year}</TableCell>
                        <TableCell>{result.department}</TableCell>
                        <TableCell>{result.subject}</TableCell>
                        <TableCell align="right">{result.score}</TableCell>
                        <TableCell>
                          <Chip 
                            label={result.grade} 
                            size="small"
                            className={`grade-chip grade-${result.grade.replace('+', '')}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={result.status} 
                            size="small"
                            className={`status-chip ${result.status.toLowerCase()}`}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body2" color="text.secondary">
                          No results found for the selected filters
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </div>
      </Container>
    </div>
  );
};

export default ResultView;