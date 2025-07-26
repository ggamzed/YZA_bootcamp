import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Login from './components/Login';
import Register from './components/Register';
import HomePage from './components/HomePage/HomePage';
import TestPage from './components/TestPage';
import QuestionPage from './components/questions/QuestionPage';
import Statistics from './components/StatsPage/StatsPage';
import TestReport from './components/TestReport';
import CompletedTests from './components/CompletedTests';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login setToken={setToken} />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/home"
          element={<HomePage token={token} setToken={setToken} />}
        />

        <Route path="/test" element={<TestPage token={token} />} />
        <Route
          path="/question"
          element={<QuestionPage token={token} />}
        />

        <Route
          path="/statistics"
          element={<Statistics token={token} />}
        />

        <Route path="/test-raporu" element={<TestReport />} />
        <Route path="/completed-tests" element={<CompletedTests token={token} />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
