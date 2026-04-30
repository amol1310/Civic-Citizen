import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { 
  LayoutGrid, Clock, CheckCircle2, ListFilter, Search, 
  LogOut, ShieldAlert, BarChart, Users, Map as MapIcon, ChevronRight, ChevronLeft, Globe, ShieldCheck, QrCode
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, LayerGroup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLanguage } from '../context/LanguageContext';
import './AdminDashboard.css';

// Fix Leaflet icon issue
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip, Legend 
} from 'recharts';
import { QRCodeCanvas } from 'qrcode.react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { t, lang, setLang } = useLanguage();
  const [currentView, setCurrentView] = useState('overview'); // overview, analytics, workers, map, qr_manager
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [issues, setIssues] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0, byType: {} });
  const [searchTerm, setSearchTerm] = useState('');
  const [admins, setAdmins] = useState([]);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '' });
  const [qrArea, setQrArea] = useState('');

  const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];
  const STATUS_COLORS = {
    'Submitted': '#6366f1',
    'Assigned': '#8b5cf6',
    'In Progress': '#f59e0b',
    'Resolved': '#10b981'
  };

  // Custom Markers
  const getMarkerIcon = (status) => {
    let color = 'red'; // Submitted/Assigned
    if (status === 'In Progress') color = 'orange';
    if (status === 'Resolved') color = 'green';
    
    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.3);"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    });
  };

  useEffect(() => {
    const admin = localStorage.getItem('admin');
    if (!admin) return navigate('/');
    
    fetchIssues();
    fetchStats();

    const socket = io(`http://${window.location.hostname}:5000`);
    socket.on('new_complaint', () => { fetchIssues(); fetchStats(); });
    socket.on('status_updated', () => { fetchIssues(); fetchStats(); });
    return () => socket.disconnect();
  }, [navigate]);

  const fetchIssues = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return navigate('/');

    try {
      const res = await fetch(`http://${window.location.hostname}:5000/api/complaints`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('adminToken');
        return navigate('/');
      }
      if (res.ok) {
        const data = await res.json();
        setIssues(data.sort((a, b) => b.id - a.id));
      }
    } catch (err) { console.error(err); }
  };

  const fetchStats = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    try {
      const res = await fetch(`http://${window.location.hostname}:5000/api/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setStats(await res.json());
    } catch (err) { console.error(err); }
  };

  const filteredIssues = issues.filter(item => {
    const matchesSearch = item.id.includes(searchTerm) || 
                         item.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.issue_type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'pending') return matchesSearch && item.status !== 'Resolved';
    if (activeTab === 'resolved') return matchesSearch && item.status === 'Resolved';
    return matchesSearch;
  });

  const renderOverview = () => (
    <>
      <section className="stats-strip">
        <div className="stat-card-admin">
          <h3>Total Complaints</h3>
          <p>{stats.total}</p>
        </div>
        <div className="stat-card-admin warning">
          <h3>Active Issues</h3>
          <p>{stats.pending}</p>
        </div>
        <div className="stat-card-admin success">
          <h3>Resolved</h3>
          <p>{stats.resolved}</p>
        </div>
      </section>

      <section className="admin-content-area">
        <div className="content-header">
          <h2>Complaint Log</h2>
          <div className="tab-pills">
            <button className={activeTab === 'all' ? 'active' : ''} onClick={() => setActiveTab('all')}>All</button>
            <button className={activeTab === 'pending' ? 'active' : ''} onClick={() => setActiveTab('pending')}>Pending</button>
            <button className={activeTab === 'resolved' ? 'active' : ''} onClick={() => setActiveTab('resolved')}>Resolved</button>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="modern-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Reporter</th>
                <th>Issue Type</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Area</th>
                <th>Last Update</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredIssues.map(item => (
                <tr key={item.id} onClick={() => navigate(`/admin/issue/${item.id}`)}>
                  <td><b>#{item.id}</b></td>
                  <td>
                    <div className="user-cell">
                      <span>{item.user_name || 'Citizen'}</span>
                      <small>{item.mobile_number}</small>
                    </div>
                  </td>
                  <td>{t(item.issue_type)}</td>
                  <td>
                    <span className={`prio-tag prio-${(item.priority || 'Medium').toLowerCase()}`}>
                      {item.priority || 'Medium'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-tag status-${item.status.toLowerCase().replace(' ', '-')}`}>
                      {t(item.status)}
                    </span>
                  </td>
                  <td>
                    <span className="area-tag">{item.area_id || 'General'}</span>
                  </td>
                  <td>
                    <div className="update-cell">
                      <span>{item.last_updated_by_name || 'New'}</span>
                      <small>{item.updated_at ? new Date(item.updated_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '-'}</small>
                    </div>
                  </td>
                  <td>{new Date(item.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );

  const renderAnalytics = () => {
    const statusData = [
      { name: 'Assigned', value: issues.filter(i => i.status === 'Assigned').length },
      { name: 'In Progress', value: issues.filter(i => i.status === 'In Progress').length },
      { name: 'Resolved', value: issues.filter(i => i.status === 'Resolved').length },
      { name: 'New', value: issues.filter(i => i.status === 'Submitted').length },
    ].filter(d => d.value > 0);

    const typeData = Object.entries(stats.byType || {}).map(([name, value]) => ({ name: t(name), value }));

    return (
      <section className="admin-content-area animate-fade-in">
        <div className="view-header-row">
          <h2>Analytics Dashboard</h2>
        </div>
        
        <div className="analytics-grid-main">
          <div className="card-admin chart-card">
            <h3>Status Distribution</h3>
            <div className="chart-container-large">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card-admin chart-card">
            <h3>Complaints by Category</h3>
            <div className="chart-container-large">
              <ResponsiveContainer width="100%" height={300}>
                <ReBarChart data={typeData}>
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </ReBarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>
    );
  };

  const renderQRManager = () => {
    const qrUrl = `http://${window.location.hostname}:5173/report?area_id=${encodeURIComponent(qrArea)}`;

    const downloadQR = () => {
      const canvas = document.getElementById("qr-gen-canvas");
      if (!canvas) return;
      const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
      let downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `QR_${qrArea || 'General'}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };

    return (
      <section className="admin-content-area animate-fade-in">
        <div className="view-header-row">
          <h2>QR Area Manager</h2>
        </div>

        <div className="qr-manager-layout">
          <div className="card-admin-details qr-config-card">
            <h3>Generate Location QR</h3>
            <p>Create a QR code for a specific area to simplify reporting for citizens.</p>
            
            <div className="form-group" style={{marginTop: '24px'}}>
              <label>Area Name / Landmark</label>
              <input 
                type="text" 
                placeholder="e.g. Railway Station, Main Market..." 
                value={qrArea}
                onChange={(e) => setQrArea(e.target.value)}
                className="modern-input"
              />
            </div>
            
            <div className="qr-preview-box">
              <div className="qr-frame">
                <QRCodeCanvas 
                  id="qr-gen-canvas"
                  value={qrUrl} 
                  size={200} 
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div className="qr-meta">
                <p><b>Link:</b> {qrUrl}</p>
                <button className="btn-primary" onClick={downloadQR} style={{marginTop: '15px'}}>
                  Download QR Image
                </button>
              </div>
            </div>
          </div>

          <div className="card-admin-details qr-help-card">
            <h3>How to use?</h3>
            <ul className="help-list">
              <li>1. Enter the name of the area where you will place the sticker.</li>
              <li>2. Download the high-quality QR code.</li>
              <li>3. Print and paste it at the location.</li>
              <li>4. When scanned, the report form will automatically pre-fill the area name!</li>
            </ul>
          </div>
        </div>
      </section>
    );
  };

  const renderWorkers = () => {
    const workers = [...new Set(issues.map(i => i.assignedTo).filter(Boolean))];
    const workerIssues = issues.filter(i => i.assignedTo === selectedWorker);

    return (
      <section className="admin-content-area animate-fade-in">
        <div className="view-header-row">
          <h2>Field Workers</h2>
          {selectedWorker && <button className="text-btn" onClick={() => setSelectedWorker(null)}>Back to List</button>}
        </div>

        {!selectedWorker ? (
          <div className="worker-list">
            {workers.length > 0 ? workers.map(w => (
              <div key={w} className="card-admin-details worker-card" onClick={() => setSelectedWorker(w)}>
                <div className="worker-info">
                  <div className="worker-avatar-icon"><Users size={24} /></div>
                  <div style={{flex: 1}}>
                    <h4>{w}</h4>
                    <p>{issues.filter(i => i.assignedTo === w).length} Active Tasks</p>
                  </div>
                  <ChevronRight size={18} />
                </div>
              </div>
            )) : <div className="empty-state">No workers assigned yet.</div>}
          </div>
        ) : (
          <div className="worker-detail-view">
            <h3 className="worker-name-title">Tasks for {selectedWorker}</h3>
            <div className="table-wrapper">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Issue Type</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {workerIssues.map(item => (
                    <tr key={item.id} onClick={() => navigate(`/admin/issue/${item.id}`)}>
                      <td><b>#{item.id}</b></td>
                      <td>{t(item.issue_type)}</td>
                      <td>
                        <span className={`status-tag status-${item.status.toLowerCase().replace(' ', '-')}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>{new Date(item.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    );
  };

  const renderMap = () => {
    // Chhatrapati Sambhajinagar coordinates
    const cityCenter = [19.8762, 75.3433];
    const mapIssues = issues.filter(i => i.location && i.location.lat !== 0 && i.location.lat !== undefined);

    return (
      <section className="admin-content-area animate-fade-in">
        <div className="view-header-row">
          <h2>City Issue Map - Chhatrapati Sambhajinagar</h2>
        </div>
        <div className="map-legend">
          <div className="legend-item"><span className="dot red"></span> {t('pending')} / Assigned</div>
          <div className="legend-item"><span className="dot yellow"></span> In Progress</div>
          <div className="legend-item"><span className="dot green"></span> {t('resolved')}</div>
        </div>
        <div className="map-view-full card" style={{ height: '600px', borderRadius: '20px', overflow: 'hidden', zIndex: 1 }}>
          <MapContainer center={cityCenter} zoom={13} maxZoom={20} style={{ height: '100%', width: '100%' }}>
            <LayersControl position="topright">
              <LayersControl.BaseLayer checked name="Google Roadmap">
                <TileLayer
                  url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                  subdomains={['mt0','mt1','mt2','mt3']}
                  attribution='&copy; Google Maps'
                  maxZoom={20}
                />
              </LayersControl.BaseLayer>

              <LayersControl.BaseLayer name="Google Satellite">
                <TileLayer
                  url="https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
                  subdomains={['mt0','mt1','mt2','mt3']}
                  attribution='&copy; Google Maps'
                  maxZoom={20}
                />
              </LayersControl.BaseLayer>

              <LayersControl.BaseLayer name="Google Hybrid">
                <TileLayer
                  url="https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}"
                  subdomains={['mt0','mt1','mt2','mt3']}
                  attribution='&copy; Google Maps'
                  maxZoom={20}
                />
              </LayersControl.BaseLayer>

              <LayersControl.BaseLayer name="Google Terrain">
                <TileLayer
                  url="https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}"
                  subdomains={['mt0','mt1','mt2','mt3']}
                  attribution='&copy; Google Maps'
                  maxZoom={20}
                />
              </LayersControl.BaseLayer>
            </LayersControl>
            {mapIssues.map(issue => (
              <Marker 
                key={issue.id} 
                position={[issue.location.lat, issue.location.lng]} 
                icon={getMarkerIcon(issue.status)}
              >
                <Popup>
                  <div className="map-popup">
                    <h4>#{issue.id} - {t(issue.issue_type)}</h4>
                    <p>Status: <b>{issue.status}</b></p>
                    <p>Reporter: {issue.user_name}</p>
                    <button onClick={() => navigate(`/admin/issue/${issue.id}`)}>View Details</button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </section>
    );
  };



  useEffect(() => {
    if (currentView === 'admin_manage') fetchAdmins();
  }, [currentView]);

  const fetchAdmins = async () => {
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`http://${window.location.hostname}:5000/api/admin/list`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setAdmins(await res.json());
    } catch (err) { console.error(err); }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`http://${window.location.hostname}:5000/api/admin/create`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(newAdmin)
      });
      if (res.ok) {
        alert('Admin created successfully');
        setNewAdmin({ name: '', email: '', password: '' });
        fetchAdmins();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) { console.error(err); }
  };

  const renderAdminManage = () => (
    <div className="admin-manage-section">
      <div className="view-header-row">
        <h2>Manage Admin Users</h2>
      </div>

      <div className="admin-grid-layout">
        <div className="card-admin create-admin-card">
          <h3>Add New Admin</h3>
          <form onSubmit={handleCreateAdmin}>
            <div className="form-group">
              <label>Full Name</label>
              <input 
                type="text" 
                required 
                value={newAdmin.name}
                onChange={(e) => setNewAdmin({...newAdmin, name: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                required 
                value={newAdmin.email}
                onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                required 
                value={newAdmin.password}
                onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
              />
            </div>
            <button type="submit" className="btn-primary">Create Admin Account</button>
          </form>
        </div>

        <div className="card-admin list-admin-card">
          <h3>Current Administrators</h3>
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {admins.map(a => (
                  <tr key={a.id}>
                    <td><b>{a.name}</b></td>
                    <td>{a.email}</td>
                    <td><span className="status-tag status-resolved">{a.status}</span></td>
                    <td>{new Date(a.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`admin-wrapper ${isCollapsed ? 'collapsed' : ''}`}>
      <aside className="admin-sidebar">
        <div className="sidebar-logo">
          <ShieldAlert size={28} />
          {!isCollapsed && <span>AdminPanel</span>}
          <button className="sidebar-toggle-btn" onClick={() => setIsCollapsed(!isCollapsed)}>
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
        <nav className="sidebar-nav">
          <div className={`nav-link ${currentView === 'overview' ? 'active' : ''}`} onClick={() => { setCurrentView('overview'); setSelectedWorker(null); }}>
            <LayoutGrid size={20} /> {!isCollapsed && <span>Overview</span>}
          </div>
          <div className={`nav-link ${currentView === 'analytics' ? 'active' : ''}`} onClick={() => { setCurrentView('analytics'); setSelectedWorker(null); }}>
            <BarChart size={20} /> {!isCollapsed && <span>Analytics</span>}
          </div>
          <div className={`nav-link ${currentView === 'qr_manager' ? 'active' : ''}`} onClick={() => { setCurrentView('qr_manager'); setSelectedWorker(null); }}>
            <QrCode size={20} /> {!isCollapsed && <span>QR Manager</span>}
          </div>
          <div className={`nav-link ${currentView === 'workers' ? 'active' : ''}`} onClick={() => { setCurrentView('workers'); setSelectedWorker(null); }}>
            <Users size={20} /> {!isCollapsed && <span>Field Workers</span>}
          </div>
          <div className={`nav-link ${currentView === 'admin_manage' ? 'active' : ''}`} onClick={() => setCurrentView('admin_manage')}>
            <ShieldCheck size={20} /> {!isCollapsed && <span>Manage Admins</span>}
          </div>
          <div className={`nav-link ${currentView === 'map' ? 'active' : ''}`} onClick={() => setCurrentView('map')}>
            <MapIcon size={20} /> {!isCollapsed && <span>Map View</span>}
          </div>
        </nav>
        <button className="sidebar-logout" onClick={() => { localStorage.removeItem('admin'); navigate('/'); }}>
          <LogOut size={20} /> {!isCollapsed && <span>Logout</span>}
        </button>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="admin-bottom-nav">
        <button className={currentView === 'overview' ? 'active' : ''} onClick={() => setCurrentView('overview')}>
          <LayoutGrid size={20} />
          <span>Overview</span>
        </button>
        <button className={currentView === 'analytics' ? 'active' : ''} onClick={() => setCurrentView('analytics')}>
          <BarChart size={20} />
          <span>Stats</span>
        </button>
        <button className={currentView === 'qr_manager' ? 'active' : ''} onClick={() => setCurrentView('qr_manager')}>
          <QrCode size={20} />
          <span>QR</span>
        </button>
        <button className={currentView === 'workers' ? 'active' : ''} onClick={() => setCurrentView('workers')}>
          <Users size={20} />
          <span>Workers</span>
        </button>
        <button className={currentView === 'map' ? 'active' : ''} onClick={() => setCurrentView('map')}>
          <MapIcon size={20} />
          <span>Map</span>
        </button>
      </nav>

      <main className="admin-main">
        <header className="admin-header-sleek">
          <div className="header-left">
            <div className="search-container-modern">
              <Search size={18} className="search-icon-dim" />
              <input 
                type="text" 
                placeholder={t('search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <div className="search-stat-mini">
                  {filteredComplaints.length}
                </div>
              )}
            </div>
          </div>

          <div className="header-right">
            <div className="header-controls">
              <div className="profile-pill-compact">
                <div className="avatar-circle">A</div>
                <div className="profile-text">
                  <span className="p-name">Admin</span>
                  <span className="p-role">{t('system_control') || 'Control'}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {currentView === 'overview' && renderOverview()}
        {currentView === 'analytics' && renderAnalytics()}
        {currentView === 'qr_manager' && renderQRManager()}
        {currentView === 'workers' && renderWorkers()}
        {currentView === 'admin_manage' && renderAdminManage()}
        {currentView === 'map' && renderMap()}
      </main>
    </div>
  );
};

export default AdminDashboard;
