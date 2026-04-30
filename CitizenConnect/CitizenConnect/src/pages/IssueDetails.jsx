import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import './IssueDetails.css';

const IssueDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [status, setStatus] = useState('progress');

  const issue = {
    name: 'Rajesh Kumar',
    mobile: '9876543210',
    problem: 'Drainage Blockage',
    location: 'Near Sector 5, Main Road',
    photoUrl: 'https://images.unsplash.com/photo-1589926830501-8b2abdd85954?auto=format&fit=crop&q=80&w=800' // Example drainage image
  };

  const handleUpdate = () => {
    alert(`Status updated to ${status === 'progress' ? 'In Progress' : 'Resolved'}`);
    navigate('/admin');
  };

  return (
    <div className="card issue-card animate-fade-in">
      <div className="card-header">
        <ChevronLeft 
          className="card-header-icon" 
          size={24} 
          onClick={() => navigate('/admin')} 
        />
        <h2>Issue Details</h2>
      </div>

      <div className="card-body issue-body">
        <div className="detail-row">
          <span className="detail-label">Name:</span>
          <span className="detail-value">{issue.name}</span>
        </div>
        
        <div className="detail-row">
          <span className="detail-label">Mobile:</span>
          <span className="detail-value">{issue.mobile}</span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Problem:</span>
          <span className="detail-value">{issue.problem}</span>
        </div>

        <div className="problem-photo-section">
          <span className="detail-label">Problem Photo</span>
          <img src={issue.photoUrl} alt="Problem" className="problem-photo" />
        </div>

        <div className="detail-row" style={{ marginTop: '16px' }}>
          <span className="detail-label">Location:</span>
          <span className="detail-value location-text">{issue.location}</span>
        </div>

        <div className="status-update-section">
          <button className="btn-update" onClick={handleUpdate}>Update Status</button>
          
          <div className="radio-group">
            <label className="radio-label">
              <input 
                type="radio" 
                name="status" 
                value="progress"
                checked={status === 'progress'}
                onChange={() => setStatus('progress')}
              />
              <span className="radio-text">In Progress</span>
            </label>
            
            <label className="radio-label">
              <input 
                type="radio" 
                name="status" 
                value="resolved"
                checked={status === 'resolved'}
                onChange={() => setStatus('resolved')}
              />
              <span className="radio-text">Resolved</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueDetails;
