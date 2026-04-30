import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { List, RefreshCw, UserCheck, Check, User } from 'lucide-react';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  const issues = [
    { id: 1, name: 'Rajesh Kumar', mobile: '9876543210', status: 'Pending', statusClass: 'status-pending' },
    { id: 2, name: 'Priya Sharma', mobile: '876542109', status: 'Pending', statusClass: 'status-pending' },
    { id: 3, name: 'Amit Patel', mobile: '1n Progress', status: 'In Progress', statusClass: 'status-progress' }, // The mockup says "1n Progress" for mobile, probably a typo but I'll use a standard mobile number
    { id: 4, name: 'Amit Patel', mobile: '998876655', status: 'Pending', statusClass: 'status-pending' },
  ];

  return (
    <div className="admin-layout animate-fade-in">
      <div className="admin-header">
        <div className="admin-header-left">
          <List size={24} className="header-icon" />
          <h2>Admin Dashboard</h2>
        </div>
        <div className="admin-header-right">
          <Check size={24} className="header-icon-red" style={{color: '#ef4444'}} />
          <User size={24} className="header-icon" />
        </div>
      </div>

      <div className="admin-body">
        <div className="admin-sidebar">
          <div 
            className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <List size={20} />
            <span>Dashboard</span>
          </div>
          <div 
            className={`sidebar-item ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            <RefreshCw size={20} />
            <span>Pending Items</span>
          </div>
          <div 
            className={`sidebar-item ${activeTab === 'resolved' ? 'active' : ''}`}
            onClick={() => setActiveTab('resolved')}
          >
            <UserCheck size={20} />
            <span>Resolved Issues</span>
          </div>
        </div>

        <div className="admin-content">
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Mobile Number</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((issue) => (
                  <tr key={issue.id} onClick={() => navigate(`/admin/issue/${issue.id}`)}>
                    <td>{issue.name}</td>
                    <td>{issue.mobile === '1n Progress' ? '9876543212' : issue.mobile}</td>
                    <td>
                      <span className={`status-badge ${issue.statusClass}`}>
                        {issue.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
