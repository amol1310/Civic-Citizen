import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import './ReportProblem.css';

const ReportProblem = () => {
  const navigate = useNavigate();
  const [problem, setProblem] = useState('Drainage Issue');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate submission and redirect to admin for demo purposes
    alert('Problem Submitted Successfully!');
    navigate('/admin');
  };

  return (
    <div className="card report-card animate-fade-in">
      <div className="card-header">
        <ChevronLeft 
          className="card-header-icon" 
          size={24} 
          onClick={() => navigate('/')} 
        />
        <h2>Report a Problem</h2>
      </div>

      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="input-label">Select Problem</label>
            <select 
              className="input-field select-field"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
            >
              <option value="Drainage Issue">Drainage Issue</option>
              <option value="Water Supply">Water Supply</option>
              <option value="Road Repair">Road Repair</option>
              <option value="Electricity">Electricity</option>
            </select>
          </div>

          <div className="form-group">
            <label className="input-label">Description</label>
            <textarea 
              className="input-field textarea-field" 
              placeholder="Describe the issue..."
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          </div>

          <div className="form-group upload-group">
            <label className="input-label upload-label">Upload Photo</label>
            <div className="file-input-wrapper">
              <button type="button" className="btn-choose-file">Choose File</button>
              <span className="file-name">No file chosen</span>
              <input type="file" className="hidden-file-input" />
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '24px' }}>
            Submit Problem
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReportProblem;
