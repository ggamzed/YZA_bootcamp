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
import './components/HomePage/HomePage.css';

function AppContent() {
  const { 
    token, 
    logout, 
    resetKey,
    // Floating Pomodoro için gerekli state'ler
    showFloatingPomodoro,
    isBreak,
    currentSession,
    pomodoroTime,
    isRunning,
    pomodoroCount,
    startPomodoro,
    pausePomodoro,
    resetPomodoro,
    closeFloatingPomodoro,
    formatTime,
    getProgressPercentage
  } = useUser();

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

        {/* Global Floating Pomodoro Widget */}
        {showFloatingPomodoro && token && (
          <div className={`floating-pomodoro ${isBreak ? 'break-mode' : ''}`}>
            <div className="floating-pomodoro-header">
              <h6 className="floating-pomodoro-title">🍅 Pomodoro</h6>
              <button 
                className="floating-pomodoro-close"
                onClick={closeFloatingPomodoro}
                title="Kapat"
              >
                ×
              </button>
            </div>
            
            <div className="floating-pomodoro-status">
              {currentSession === 'focus' ? '⏰ Odaklanma' : 
               currentSession === 'shortBreak' ? '☕ Kısa Mola' : 
               '🛋️ Uzun Mola'}
            </div>
            
            <div className="floating-pomodoro-timer">
              {formatTime(pomodoroTime)}
            </div>
            
            <div className="floating-pomodoro-progress">
              <div 
                className="floating-pomodoro-progress-bar" 
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
            
            <div className="floating-pomodoro-controls">
              {!isRunning ? (
                <button 
                  className="floating-pomodoro-btn" 
                  onClick={startPomodoro}
                >
                  <i className="bi-play-fill me-1"></i>Başlat
                </button>
              ) : (
                <button 
                  className="floating-pomodoro-btn" 
                  onClick={pausePomodoro}
                >
                  <i className="bi-pause-fill me-1"></i>Duraklat
                </button>
              )}
              
              <button 
                className="floating-pomodoro-btn" 
                onClick={resetPomodoro}
              >
                <i className="bi-arrow-clockwise me-1"></i>Sıfırla
              </button>
            </div>
            
            <div className="floating-pomodoro-count">
              🎯 {pomodoroCount} Pomodoro tamamlandı
            </div>
          </div>
        )}
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
