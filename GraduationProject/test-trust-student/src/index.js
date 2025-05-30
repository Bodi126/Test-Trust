import { BrowserRouter as Router, Routes, Route, Link, BrowserRouter } from 'react-router-dom';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import Login from './login';
import SignUp from './signup';
import reportWebVitals from './reportWebVitals';
import UpcomingExams from './UpcomingExams';
import 'bootstrap/dist/css/bootstrap.min.css';
import PracticeTests from './PracticeTests';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* <BrowserRouter>
    <UpcomingExams />
    </BrowserRouter> */}
    <App />
  </React.StrictMode>
);


