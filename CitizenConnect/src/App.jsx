import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import Login from './pages/Login';
import UserDashboard from './pages/UserDashboard';
import ReportProblem from './pages/ReportProblem';
import ComplaintDetails from './pages/ComplaintDetails';
import AdminDashboard from './pages/AdminDashboard';
import IssueDetails from './pages/IssueDetails';
import Scanner from './pages/Scanner';

function App() {
  return (
    <LanguageProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/report" element={<ReportProblem />} />
          <Route path="/issue/:id" element={<ComplaintDetails />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/issue/:id" element={<IssueDetails />} />
          <Route path="/scanner" element={<Scanner />} />
        </Routes>
      </Router>
    </LanguageProvider>
  );
}

export default App;
