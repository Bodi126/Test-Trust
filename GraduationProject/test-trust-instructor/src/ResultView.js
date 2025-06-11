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
  Chip
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import './ResultView.css';

const mockResults = [
  { id: 1, name: 'John Doe', avatar: 'JD', year: '2023', department: 'Computer Science', subject: 'Data Structures', score: 85, grade: 'A', status: 'Passed' },
  { id: 2, name: 'Jane Smith', avatar: 'JS', year: '2023', department: 'Computer Science', subject: 'Data Structures', score: 72, grade: 'B', status: 'Passed' },
  { id: 3, name: 'Alex Johnson', avatar: 'AJ', year: '2023', department: 'Electrical', subject: 'Circuit Theory', score: 91, grade: 'A+', status: 'Passed' },
  { id: 4, name: 'Sarah Williams', avatar: 'SW', year: '2022', department: 'Mechanical', subject: 'Thermodynamics', score: 68, grade: 'C', status: 'Passed' },
  { id: 5, name: 'Michael Brown', avatar: 'MB', year: '2022', department: 'Computer Science', subject: 'Algorithms', score: 45, grade: 'F', status: 'Failed' },
  { id: 6, name: 'Emily Davis', avatar: 'ED', year: '2023', department: 'Electrical', subject: 'Circuit Theory', score: 88, grade: 'A', status: 'Passed' },
  { id: 7, name: 'David Wilson', avatar: 'DW', year: '2022', department: 'Mechanical', subject: 'Thermodynamics', score: 52, grade: 'D', status: 'Passed' },
];

const ResultView = () => {
  const [yearFilter, setYearFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [filteredResults, setFilteredResults] = useState(mockResults);
  
  const years = ['All', ...new Set(mockResults.map(item => item.year))];
  const departments = ['All', ...new Set(mockResults.map(item => item.department))];
  const subjects = ['All', ...new Set(mockResults.map(item => item.subject))];

  useEffect(() => {
    let results = mockResults;
    
    if (yearFilter !== 'All') results = results.filter(item => item.year === yearFilter);
    if (departmentFilter !== 'All') results = results.filter(item => item.department === departmentFilter);
    if (subjectFilter !== 'All') results = results.filter(item => item.subject === subjectFilter);
    
    setFilteredResults(results);
  }, [yearFilter, departmentFilter, subjectFilter]);

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

  return (
    <div className="frame-container">
      <Container maxWidth="lg" className="result-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h4" component="h1" className="page-title">
            Exam Results
          </Typography>
          <Typography variant="subtitle1" className="page-subtitle">
            View and analyze student performance
          </Typography>
        </motion.div>

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
                  {years.map(year => (
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
                  {departments.map(dept => (
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
                  {subjects.map(sub => (
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
                    Total Results: <strong>{filteredResults.length}</strong>
                  </Typography>
                  <Typography variant="body1" className="summary-item">
                    Pass Rate: <strong>
                      {Math.round(
                        (filteredResults.filter(r => r.status === 'Passed').length / 
                        (filteredResults.length || 1)) * 100
                      )}%
                    </strong>
                  </Typography>
                  <Typography variant="body1" className="summary-item">
                    Average Score: <strong>
                      {Math.round(
                        filteredResults.reduce((sum, curr) => sum + curr.score, 0) / 
                        (filteredResults.length || 1)
                      )}
                    </strong>
                  </Typography>
                </Box>
                <Box className="progress-container">
                  <Typography variant="subtitle2" className="progress-title">
                    Score Distribution
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min(100, 
                      (filteredResults.filter(r => r.score >= 80).length / 
                      (filteredResults.length || 1)) * 100
                    )} 
                    className="progress-bar grade-a"
                  />
                  <Typography variant="caption" className="progress-label">
                    A Grades: {filteredResults.filter(r => r.score >= 80).length}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min(100, 
                      (filteredResults.filter(r => r.score >= 60 && r.score < 80).length / 
                      (filteredResults.length || 1)) * 100
                    )} 
                    className="progress-bar grade-bc"
                  />
                  <Typography variant="caption" className="progress-label">
                    B-C Grades: {filteredResults.filter(r => r.score >= 60 && r.score < 80).length}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min(100, 
                      (filteredResults.filter(r => r.score < 60).length / 
                      (filteredResults.length || 1)) * 100
                    )} 
                    className="progress-bar grade-f"
                  />
                  <Typography variant="caption" className="progress-label">
                    F Grades: {filteredResults.filter(r => r.score < 60).length}
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
                  {filteredResults.map((result) => (
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
                  ))}
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