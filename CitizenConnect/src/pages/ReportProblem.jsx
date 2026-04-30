import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Camera, Loader2, Droplets, Zap, Trash2, Road, Wrench, MoreHorizontal } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import './ReportProblem.css';

const API_BASE = import.meta.env.PROD ? '' : `http://${window.location.hostname}:5000`;

const ReportProblem = () => {
  const navigate = useNavigate();
  
  const { t, lang, setLang } = useLanguage();
  const [problem, setProblem] = useState('drainage');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([null, null, null]);
  const [previews, setPreviews] = useState([null, null, null]);
  const [zoomImg, setZoomImg] = useState(null);
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/');
      return;
    }

    // Extract area_id from QR Code URL
    const params = new URLSearchParams(window.location.search);
    const areaId = params.get('area_id');
    if (areaId) {
      setAddress(areaId);
      localStorage.setItem('scannedArea', areaId);
    }

    // Auto-fetch GPS Location on page load
    if (navigator.geolocation) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocating(false);
        },
        (err) => {
          console.warn('Auto GPS Failed:', err.message);
          setLocating(false);
        }
      );
    }
  }, [navigate]);

  const handleGetLocation = () => {
    setLocating(true);
    if (!navigator.geolocation) {
      alert('Geolocation not supported');
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      (err) => {
        alert('GPS Failed: ' + err.message + '. Enter address manually.');
        setLocating(false);
      }
    );
  };

  const handleSlotChange = (index, e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const newFiles = [...files];
    newFiles[index] = file;
    setFiles(newFiles);

    const reader = new FileReader();
    reader.onloadend = () => {
      const newPreviews = [...previews];
      newPreviews[index] = reader.result;
      setPreviews(newPreviews);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validFiles = files.filter(f => f !== null);
    if (validFiles.length === 0) return alert('At least 1 image is mandatory');
    if (!location && !address) return alert('Provide GPS or Address');

    setSubmitting(true);
    const user = JSON.parse(localStorage.getItem('user'));
    const userId = user._id || user.id;
    
    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('issue_type', problem);
    formData.append('description', description);
    formData.append('lat', location?.lat || 0);
    formData.append('lng', location?.lng || 0);
    formData.append('address', address);
    validFiles.forEach(f => formData.append('images', f));

    try {
      const res = await fetch(`${API_BASE}/api/complaints`, { method: 'POST', body: formData });
      if (res.ok) {
      alert('✅ ' + (t('submit_report') || 'Reported Successfully!'));
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="report-page animate-fade-in">
      <div className="report-container">
        <header className="report-header-nav">
          <button className="back-btn" onClick={() => navigate('/dashboard')}>
            <ChevronLeft size={20} />
            <span>{t('back') || 'Back'}</span>
          </button>
          <h2>{t('new_report')}</h2>
          <div style={{width: '80px'}} />
        </header>

        <form onSubmit={handleSubmit} className="report-form-card">
          <div className="form-section">
            <label className="section-title-sm">{t('select_issue')}</label>
            <div className="problem-chips-grid">
              {[
                { key: 'drainage', icon: '💧' },
                { key: 'water',    icon: '🚰' },
                { key: 'road',     icon: '🛣️' },
                { key: 'electricity', icon: '⚡' },
                { key: 'garbage',  icon: '🗑️' },
                { key: 'others',   icon: '🔧' },
              ].map(({ key, icon }) => (
                <button
                  type="button"
                  key={key}
                  className={`chip-btn ${problem === key ? 'chip-active' : ''}`}
                  onClick={() => setProblem(key)}
                >
                  <span className="chip-icon">{icon}</span>
                  <span>{t(key)}</span>
                </button>
              ))}
            </div>
            <textarea 
              placeholder={t('description')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            ></textarea>
          </div>

          <div className="form-section">
            <label className="section-title-sm">{t('proof')} (Max 3)</label>
            <div className="photo-slots-grid">
              {[0, 1, 2].map((i) => (
                <div key={i} className="photo-slot-wrapper">
                  <div 
                    className={`photo-slot ${previews[i] ? 'has-img' : ''}`}
                    onClick={() => previews[i] ? setZoomImg(previews[i]) : document.getElementById(`slot-${i}`).click()}
                  >
                    {previews[i] ? (
                      <img src={previews[i]} alt={`Proof ${i+1}`} />
                    ) : (
                      <>
                        <Camera size={24} />
                        <span>{t('photo')} {i + 1}</span>
                      </>
                    )}
                    <input 
                      id={`slot-${i}`}
                      type="file" 
                      accept="image/*" 
                      capture="environment"
                      style={{ display: 'none' }} 
                      onChange={(e) => handleSlotChange(i, e)} 
                    />
                  </div>
                  {previews[i] && (
                    <button type="button" className="slot-remove" onClick={(e) => {
                      e.stopPropagation();
                      const nf = [...files]; nf[i] = null; setFiles(nf);
                      const np = [...previews]; np[i] = null; setPreviews(np);
                    }}>×</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="form-section">
            <label className="section-title-sm">{t('location')}</label>
            <div className="location-action-bar">
              <button type="button" className={`gps-btn ${location ? 'success' : ''}`} onClick={handleGetLocation} disabled={locating}>
                <MapPin size={18} />
                {locating ? '...' : location ? 'OK' : t('get_gps')}
              </button>
            </div>
            <div className="address-fallback">
              <input 
                type="text" 
                placeholder={t('manual_address')}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="submit-report-btn" disabled={submitting}>
            {submitting ? <Loader2 className="spinner" /> : t('submit_report')}
          </button>
        </form>
      </div>

      {zoomImg && (
        <div className="zoom-overlay" onClick={() => setZoomImg(null)}>
          <div className="zoom-content animate-zoom">
            <img src={zoomImg} alt="Zoomed" />
            <button className="close-zoom">×</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportProblem;
