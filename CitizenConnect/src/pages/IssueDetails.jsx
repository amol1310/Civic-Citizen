import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, MapPin, User, Phone, Calendar, Briefcase, Star, CheckCircle, Clock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import './IssueDetails.css';

const API_BASE = import.meta.env.PROD ? '' : `http://${window.location.hostname}:5000`;

const IssueDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t, lang, setLang } = useLanguage();
  const [issue, setIssue] = useState(null);
  const [priority, setPriority] = useState('Medium');
  const [worker, setWorker] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [updating, setUpdating] = useState(false);
  const [zoomImg, setZoomImg] = useState(null);

  useEffect(() => {
    fetchIssue();
  }, [id]);

  const fetchIssue = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/complaints/${id}`);
      if (res.ok) {
        const data = await res.json();
        setIssue(data);
        setPriority(data.priority || 'Medium');
        setWorker(data.assignedTo || '');
        setSelectedStatus(data.status);
      }
    } catch (error) { console.error(error); }
  };

  const handleUpdate = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return alert('Session expired. Please login again.');

    setUpdating(true);
    try {
      let statusToSave = selectedStatus;
      if (worker && selectedStatus === 'Submitted') {
        statusToSave = 'Assigned';
      }

      const res = await fetch(`${API_BASE}/api/complaints/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          assignedTo: worker, 
          priority, 
          status: statusToSave 
        })
      });
      if (res.ok) {
        alert('Changes saved successfully!');
        navigate('/admin');
      } else {
        alert('Failed to update. Check your session.');
      }
    } catch (error) { 
      console.error(error); 
    } finally { 
      setUpdating(false); 
    }
  };

  if (!issue) return <div className="loading-screen">Loading Details...</div>;

  return (
    <div className="issue-details-admin animate-fade-in">
      <header className="details-nav-admin">
        <button className="back-btn" onClick={() => navigate('/admin')}>
          <ChevronLeft size={20} /> {t('back') || 'Back'}
        </button>
        <div className="issue-id-badge">#{issue.id}</div>
      </header>

      <div className="details-grid-admin">
        <div className="main-info-col">
          <div className="card-admin-details info-card">
            <div className="issue-main-header">
              <span className={`status-tag-large status-${issue.status.toLowerCase().replace(' ', '-')}`}>
                {issue.status}
              </span>
              <h1>{t(issue.issue_type)}</h1>
              <p className="desc-text">{issue.description}</p>
            </div>

            <div className="meta-info-grid">
              <div className="meta-item">
                <User size={18} />
                <div>
                  <label>Reporter</label>
                  <span>{issue.user_name}</span>
                </div>
              </div>
              <div className="meta-item">
                <Phone size={18} />
                <div>
                  <label>Contact</label>
                  <span>{issue.mobile_number}</span>
                </div>
              </div>
              <div className="meta-item">
                <Calendar size={18} />
                <div>
                  <label>Date Reported</label>
                  <span>{new Date(issue.created_at).toLocaleString()}</span>
                </div>
              </div>
              <div className="meta-item">
                <MapPin size={18} />
                <div className="report-location-info">
                  <MapPin size={16} />
                  <span>{issue.location?.address || 'No address provided'}</span>
                </div>
              </div>
            </div>

            <div className="card-admin-details activity-log-card">
              <h3>Activity Log</h3>
              <div className="history-timeline">
                {!issue.history || issue.history.length === 0 ? (
                  <p className="no-history">No activity recorded yet.</p>
                ) : (
                  issue.history.map((log, i) => (
                    <div key={i} className="history-item">
                      <div className="history-icon">
                        {log.type === 'status_change' ? <CheckCircle size={14} /> : <Briefcase size={14} />}
                      </div>
                      <div className="history-details">
                        <p>
                          <b>{log.updated_by}</b> {log.type === 'status_change' ? `updated status to ${log.to}` : `assigned work to ${log.to}`}
                        </p>
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  )).reverse()
                )}
              </div>
            </div>
          </div>

          <div className="card-admin-details gallery-card">
            <h3>Problem Photos</h3>
            <div className="photo-grid-admin">
              {(issue.image_urls || issue.images || []).map((img, i) => {
                let src = img;
                if (!img.startsWith('http')) {
                  // If it's a relative path like /uploads/abc.jpg, remove the leading slash before appending
                  const cleanPath = img.startsWith('/') ? img.substring(1) : img;
                  src = API_BASE ? `${API_BASE}/${cleanPath}` : `/${cleanPath}`;
                }
                return (
                  <img 
                    key={i} 
                    src={src} 
                    alt="Proof" 
                    onClick={() => setZoomImg(src)}
                    style={{ cursor: 'pointer' }}
                  />
                );
              })}
            </div>
          </div>

          {issue.location.lat !== 0 && (
            <div className="card-admin-details map-card-admin">
              <h3>Geolocation</h3>
              <div className="map-view-large">
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  src={`https://www.google.com/maps?q=${issue.location.lat},${issue.location.lng}&hl=es;z=14&output=embed`}
                  title="Map"
                ></iframe>
              </div>
            </div>
          )}
        </div>

        <div className="action-col-admin">
          <div className="card-admin-details management-card">
            <h3><Briefcase size={18} /> Management Panel</h3>
            <div className="assign-form">
              <label>Assign Worker (Optional)</label>
              <input 
                type="text" 
                placeholder="Enter worker name..." 
                value={worker} 
                onChange={(e) => setWorker(e.target.value)}
              />
              
              <label>Set Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
              </select>

              <label style={{marginTop: '16px'}}>Update Status</label>
              <div className="status-flow-buttons">
                {['Submitted', 'In Progress', 'Resolved'].map((s) => (
                  <button 
                    key={s}
                    type="button"
                    className={`flow-btn ${selectedStatus === s ? 'active' : ''}`}
                    onClick={() => setSelectedStatus(s)}
                  >
                    {s === 'Resolved' ? <CheckCircle size={16} /> : s === 'In Progress' ? <Clock size={16} /> : <div style={{width:16}}></div>}
                    {s}
                  </button>
                ))}
              </div>

              <button className="btn-assign-save" style={{marginTop: '24px'}} onClick={handleUpdate} disabled={updating}>
                {updating ? 'Saving...' : 'Update Complaint'}
              </button>
            </div>
          </div>

          {issue.feedback && (
            <div className="card-admin-details feedback-card-admin">
              <h3>User Feedback</h3>
              <div className="rating-row">
                <Star size={18} fill="#f59e0b" color="#f59e0b" />
                <span>{issue.feedback.rating}/5 Rating</span>
              </div>
              <p>"{issue.feedback.comment}"</p>
            </div>
          )}
        </div>
      </div>
      {zoomImg && (
        <div className="zoom-overlay" onClick={() => setZoomImg(null)} style={{zIndex: 9999}}>
          <div className="zoom-content animate-zoom">
            <img src={zoomImg} alt="Zoomed" style={{cursor: 'zoom-out'}} />
            <button className="close-zoom" style={{color: 'white', opacity: 1}}>×</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueDetails;
