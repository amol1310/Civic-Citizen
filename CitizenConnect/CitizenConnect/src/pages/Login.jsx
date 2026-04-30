import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, User, KeyRound, Droplet, Car, Zap, Waves } from 'lucide-react';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (mobile && name && otp) {
      // Basic validation mock
      navigate('/report');
    } else {
      alert('Please fill all fields');
    }
  };

  return (
    <div className="card login-card animate-fade-in">
      <div className="login-header">
        <div className="logo-placeholder">
          <div className="logo-circle logo-red"></div>
          <div className="logo-circle logo-green"></div>
          <div className="logo-circle logo-blue"></div>
          <div className="logo-circle logo-yellow"></div>
        </div>
        <h2>Citizen Connect</h2>
      </div>

      <div className="card-body">
        <h3 className="text-center" style={{ marginBottom: '24px', color: 'var(--primary-blue)' }}>User Login</h3>
        
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <Phone className="input-icon" size={20} />
            <input 
              type="tel" 
              className="input-field with-icon" 
              placeholder="Mobile Number"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
            />
          </div>

          <div className="input-group">
            <User className="input-icon" size={20} />
            <input 
              type="text" 
              className="input-field with-icon" 
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="otp-group">
            <div className="input-group otp-input-wrapper">
              <KeyRound className="input-icon" size={20} />
              <input 
                type="text" 
                className="input-field with-icon" 
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>
            <button type="button" className="btn-get-otp">Get OTP</button>
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '16px' }}>
            Login
          </button>
        </form>
      </div>

      <div className="login-footer">
        <h4>Report & Resolve Your Problems</h4>
        <div className="footer-icons">
          <div className="footer-icon-item">
            <Waves size={24} />
            <span>Drainage</span>
          </div>
          <div className="footer-icon-item">
            <Droplet size={24} />
            <span>Water</span>
          </div>
          <div className="footer-icon-item">
            <Car size={24} />
            <span>Road</span>
          </div>
          <div className="footer-icon-item">
            <Zap size={24} />
            <span>Electricity</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
