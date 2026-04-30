import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import ReportProblem from './pages/ReportProblem';
import AdminDashboard from './pages/AdminDashboard';
import IssueDetails from './pages/IssueDetails';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/report" element={<ReportProblem />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/issue/:id" element={<IssueDetails />} />
      </Routes>
    </Router>
  );
}

export default App;
