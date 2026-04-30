import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, User, ShieldCheck, ArrowRight, Loader2, Globe, QrCode } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { t, lang, setLang } = useLanguage();
  const [activeTab, setActiveTab] = useState('user');
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpField, setShowOtpField] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleGetOTP = async () => {
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(mobile)) return alert('Enter a valid 10-digit mobile number');
    if (!name) return alert('Enter your name');

    setLoading(true);
    try {
      const res = await fetch(`http://${window.location.hostname}:5000/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile_number: mobile, name })
      });
      if (res.ok) {
        setShowOtpField(true);
        setTimer(60);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUserLogin = async () => {
    if (!otp) return alert('Enter OTP');
    setLoading(true);
    try {
      const res = await fetch(`http://${window.location.hostname}:5000/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile_number: mobile, otp })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/report');
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://${window.location.hostname}:5000/api/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('admin', JSON.stringify(data.admin));
        localStorage.setItem('adminToken', data.token);
        navigate('/admin');
      } else {
        alert(data.error || 'Login failed');
      }
    } catch (err) {
      console.error(err);
      alert('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-overlay"></div>
      <div className="login-container animate-slide-up">
        <div className="lang-selector-top">
          <Globe size={18} />
          <select value={lang} onChange={(e) => setLang(e.target.value)}>
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
            <option value="mr">मराठी</option>
          </select>
        </div>

        <div className="login-card">
          <div className="login-header">
            <div className="logo-badge">
              <ShieldCheck size={32} />
            </div>
            <h1>{t('title')}</h1>
            <p>{t('subtitle')}</p>
          </div>

          <div className="tab-switcher">
            <button 
              className={activeTab === 'user' ? 'active' : ''} 
              onClick={() => setActiveTab('user')}
            >
              {t('login_citizen')}
            </button>
            <button 
              className={activeTab === 'admin' ? 'active' : ''} 
              onClick={() => setActiveTab('admin')}
            >
              {t('login_admin')}
            </button>
          </div>

          {activeTab === 'user' ? (
            <div className="form-content">
              {!showOtpField ? (
                <>
                  <div className="input-group">
                    <User className="input-icon" size={18} />
                    <input 
                      type="text" 
                      placeholder={t('full_name')} 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                    />
                  </div>
                  <div className="input-group">
                    <Phone className="input-icon" size={18} />
                    <input 
                      type="tel" 
                      placeholder={t('mobile_number')} 
                      value={mobile} 
                      onChange={(e) => setMobile(e.target.value)} 
                    />
                  </div>
                  <button className="btn-login-main" onClick={handleGetOTP} disabled={loading}>
                    {loading ? <Loader2 className="spinner" /> : t('request_otp')}
                    <ArrowRight size={18} />
                  </button>
                </>
              ) : (
                <>
                  <p className="otp-info">{t('otp_sent')} <b>{mobile}</b></p>
                  <div className="input-group">
                    <ShieldCheck className="input-icon" size={18} />
                    <input 
                      type="text" 
                      placeholder="6-Digit OTP" 
                      value={otp} 
                      onChange={(e) => setOtp(e.target.value)} 
                    />
                  </div>
                  <button className="btn-login-main" onClick={handleUserLogin} disabled={loading}>
                    {loading ? <Loader2 className="spinner" /> : t('verify_login')}
                  </button>
                  <div className="timer-section">
                    {timer > 0 ? `Resend OTP in ${timer}s` : <button className="btn-text" onClick={handleGetOTP}>{t('resend_otp')}</button>}
                  </div>
                  <button className="btn-text" onClick={() => setShowOtpField(false)}>Change Number</button>
                </>
              )}
            </div>
          ) : (
            <div className="form-content">
              <div className="input-group">
                <User className="input-icon" size={18} />
                <input 
                  type="email" 
                  placeholder="Admin Email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                />
              </div>
              <div className="input-group">
                <ShieldCheck className="input-icon" size={18} />
                <input 
                  type="password" 
                  placeholder={t('password')} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                />
              </div>
              <button className="btn-login-main" onClick={handleAdminLogin} disabled={loading}>
                {loading ? <Loader2 className="spinner" /> : t('admin_login')}
              </button>
            </div>
          )}
        </div>
        <div className="login-footer">
          &copy; 2026 {t('title')} • Secure & Transparent Governance
        </div>
      </div>
    </div>
  );
};

export default Login;
