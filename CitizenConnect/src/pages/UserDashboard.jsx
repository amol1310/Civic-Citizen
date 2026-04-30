import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, List, Clock, CheckCircle2, MapPin, ChevronRight, LogOut, LayoutDashboard, Settings, Globe, QrCode, Search } from 'lucide-react';
import { io } from 'socket.io-client';
import { useLanguage } from '../context/LanguageContext';
import './UserDashboard.css';

const API_BASE = import.meta.env.PROD ? '' : `http://${window.location.hostname}:5000`;

const UserDashboard = () => {
  const navigate = useNavigate();
  const { t, lang, setLang } = useLanguage();
  const [complaints, setComplaints] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0 });
  const [user, setUser] = useState(null);
  const [qrArea, setQrArea] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/');
      return;
    }
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    setQrArea(localStorage.getItem('scannedArea') || '');
    fetchUserComplaints(parsedUser._id || parsedUser.id);

    const socket = io(API_BASE || '/');
    socket.on('status_updated', () => fetchUserComplaints(parsedUser._id || parsedUser.id));
    return () => socket.disconnect();
  }, [navigate]);

  const filteredComplaints = complaints.filter(c => 
    c.id.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
    t(c.issue_type).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchUserComplaints = async (userId) => {
    try {
      const res = await fetch(`${API_BASE}/api/users/my-complaints?user_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setComplaints(data.sort((a, b) => b.id - a.id));
        setStats({
          total: data.length,
          pending: data.filter(c => c.status !== 'Resolved').length,
          resolved: data.filter(c => c.status === 'Resolved').length
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="dashboard-container">
      <header className="user-topbar">
        <div className="user-topbar-row1">
          <div className="user-info-block">
            <div className="avatar-circle">{user?.name ? user.name[0].toUpperCase() : 'U'}</div>
            <div className="profile-text">
              <span className="p-name">{user?.name}</span>
              {qrArea && <span className="area-tag-mini">📍 {qrArea}</span>}
            </div>
          </div>
          <button className="logout-btn-minimal" onClick={handleLogout}>
            <LogOut size={16} />
            <span>{t('logout')}</span>
          </button>
        </div>

        <div className="user-topbar-row2">
          <div className="search-container-modern">
            <Search size={16} className="search-icon-dim" />
            <input 
              type="text" 
              placeholder={t('search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      <main className="dashboard-main animate-fade-in">
        <header className="user-welcome">
          <div className="welcome-text">
            <h1>{t('welcome')}, {user?.name.split(' ')[0]}!</h1>
            <p>{t('welcome_msg')}</p>
          </div>
          <button className="fab-report" onClick={() => navigate('/report')}>
            <Plus size={24} />
            <span>{t('new_report')}</span>
          </button>
        </header>

        <section className="stats-grid-dashboard">
          <div className="stat-item primary">
            <LayoutDashboard size={24} className="stat-icon" />
            <div className="stat-info">
              <span className="stat-val">{stats.total}</span>
              <span className="stat-label">{t('total_reports')}</span>
            </div>
          </div>
          <div className="stat-item warning">
            <Clock size={24} className="stat-icon" />
            <div className="stat-info">
              <span className="stat-val">{stats.pending}</span>
              <span className="stat-label">{t('pending')}</span>
            </div>
          </div>
          <div className="stat-item success">
            <CheckCircle2 size={24} className="stat-icon" />
            <div className="stat-info">
              <span className="stat-val">{stats.resolved}</span>
              <span className="stat-label">{t('resolved')}</span>
            </div>
          </div>
        </section>

        <section className="recent-activity">
          <div className="section-header">
            <h2>{t('my_activity')}</h2>
          </div>
          
          <div className="complaint-feed">
            {filteredComplaints.length > 0 ? (
              filteredComplaints.map(item => (
                <div key={item.id} className="feed-card" onClick={() => navigate(`/issue/${item.id}`)}>
                  <div className="feed-status">
                    <div className={`status-line status-${item.status.toLowerCase().replace(' ', '-')}`}></div>
                  </div>
                  <div className="feed-body">
                    <div className="feed-meta">
                      <span className="feed-id">#{item.id}</span>
                      <span className="feed-date">{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                    <h3>{t(item.issue_type)}</h3>
                    <div className="feed-footer">
                      <span className={`status-pill status-${item.status.toLowerCase().replace(' ', '-')}`}>
                        {t(item.status)}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="arrow-icon" size={20} />
                </div>
              ))
            ) : (
              <div className="empty-dashboard card">
                <MapPin size={48} className="empty-icon" />
                <h3>{t('no_reports')}</h3>
                <p>{t('start_reporting')}...</p>
                <button className="btn-primary" onClick={() => navigate('/report')}>{t('new_report')}</button>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default UserDashboard;
