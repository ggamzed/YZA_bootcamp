import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import HomePage from './components/HomePage/HomePage';
import TestPage from './components/TestPage';
import QuestionPage from './components/questions/QuestionPage';
import StatsPage from './components/StatsPage/StatsPage';
import CompletedTests from './components/CompletedTests';
import Profile from './components/Profile';
import Settings from './components/Settings';
import { UserProvider, useUser } from './contexts/UserContext';
import { ThemeProvider } from './contexts/ThemeContext';
import './styles/bootstrap.min.css';
import './styles/top.css';
import './App.css';

function AppContent() {
  const { token, logout, resetKey } = useUser();

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={token ? <Navigate to="/home" /> : <Login />} />
          <Route path="/register" element={token ? <Navigate to="/home" /> : <Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/home" element={token ? <HomePage key={`home-${resetKey}`} onLogout={logout} /> : <Navigate to="/" />} />
          <Route path="/test" element={token ? <TestPage key={`test-${resetKey}`} onLogout={logout} /> : <Navigate to="/" />} />
          <Route path="/questions" element={token ? <QuestionPage key={`questions-${resetKey}`} /> : <Navigate to="/" />} />
          <Route path="/statistics" element={token ? <StatsPage key={`stats-${resetKey}`} onLogout={logout} /> : <Navigate to="/" />} />
          <Route path="/completed-tests" element={token ? <CompletedTests key={`completed-${resetKey}`} onLogout={logout} /> : <Navigate to="/" />} />
          <Route path="/profile" element={token ? <Profile key={`profile-${resetKey}`} onLogout={logout} /> : <Navigate to="/" />} />
          <Route path="/settings" element={token ? <Settings key={`settings-${resetKey}`} onLogout={logout} /> : <Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <AppContent />
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;
