import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import HomePage from './components/HomePage/HomePage';
import TestPage from './components/TestPage';
import QuestionPage from './components/questions/QuestionPage';
import StatsPage from './components/StatsPage/StatsPage';
import CompletedTests from './components/CompletedTests';
import Profile from './components/Profile';
import Settings from './components/Settings';
import './styles/bootstrap.min.css';
import './styles/tooplate-mini-finance.css';
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/" 
            element={token ? <Navigate to="/home" /> : <Login setToken={setToken} />} 
          />
          <Route 
            path="/home" 
            element={token ? <HomePage token={token} setToken={setToken} /> : <Navigate to="/" />} 
          />
          <Route 
            path="/test" 
            element={token ? <TestPage token={token} setToken={setToken} /> : <Navigate to="/" />} 
          />
          <Route 
            path="/statistics" 
            element={token ? <StatsPage token={token} /> : <Navigate to="/" />} 
          />
          <Route 
            path="/completed-tests" 
            element={token ? <CompletedTests token={token} /> : <Navigate to="/" />} 
          />
          <Route 
            path="/profile" 
            element={token ? <Profile token={token} setToken={setToken} /> : <Navigate to="/" />} 
          />
          <Route 
            path="/settings" 
            element={token ? <Settings token={token} setToken={setToken} /> : <Navigate to="/" />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
