import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, MapPin, CheckCircle2, Star, MessageSquare, Info, Clock, Check, Globe } from 'lucide-react';
import { io } from 'socket.io-client';
import { useLanguage } from '../context/LanguageContext';
import './ComplaintDetails.css';

const ComplaintDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t, lang, setLang } = useLanguage();
  const [issue, setIssue] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    fetchIssue();
    const socket = io(`http://${window.location.hostname}:5000`);
    socket.on('status_updated', (data) => {
      if (data.id === id) fetchIssue();
    });
    return () => socket.disconnect();
  }, [id]);

  const fetchIssue = async () => {
    try {
      const res = await fetch(`http://${window.location.hostname}:5000/api/complaints/${id}`);
      if (res.ok) setIssue(await res.json());
    } catch (error) { console.error(error); }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return alert('Select rating');
    setSubmittingFeedback(true);
    try {
      const res = await fetch(`http://${window.location.hostname}:5000/api/users/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complaintId: id, rating, comment })
      });
      if (res.ok) { alert('Thanks!'); fetchIssue(); }
    } catch (error) { console.error(error); } finally { setSubmittingFeedback(false); }
  };

  if (!issue) return <div className="loading-screen">Updating...</div>;

  const steps = [t('pending'), 'Assigned', 'In Progress', t('resolved')];
  const currentIdx = steps.indexOf(issue.status) !== -1 ? steps.indexOf(issue.status) : 0;

  return (
    <div className="user-details-container animate-fade-in">
      <header className="details-top-bar">
        <button className="back-btn-square" onClick={() => navigate('/dashboard')}>
          <ChevronLeft size={20} />
        </button>
        <h1>{t('track_issue')}</h1>
        <div className="nav-lang-selector">
          <Globe size={18} />
          <select value={lang} onChange={(e) => setLang(e.target.value)}>
            <option value="en">EN</option>
            <option value="hi">हिन्दी</option>
            <option value="mr">मराठी</option>
          </select>
        </div>
      </header>

      <section className="tracking-timeline-card">
        <div className="timeline-horizontal">
          {['Submitted', 'Assigned', 'In Progress', 'Resolved'].map((step, idx) => {
            const stepLabels = {
              'Submitted': t('pending'),
              'Assigned': 'Assigned',
              'In Progress': 'In Progress',
              'Resolved': t('resolved')
            };
            const issueStatusIdx = ['Submitted', 'Assigned', 'In Progress', 'Resolved'].indexOf(issue.status);
            return (
              <div key={step} className={`step-item ${idx <= issueStatusIdx ? 'active' : ''}`}>
                <div className="step-point">
                  {idx < issueStatusIdx ? <Check size={14} /> : idx === issueStatusIdx ? <Clock size={14} /> : null}
                </div>
                <span>{stepLabels[step]}</span>
              </div>
            );
          })}
        </div>
      </section>

      <div className="details-content-grid">
        <div className="main-report-card">
          <div className="report-badge">#{issue.id}</div>
          <h2>{t(issue.issue_type)}</h2>
          <p className="report-desc">{issue.description}</p>
          
          <div className="report-location-info">
            <MapPin size={16} />
            <span>{issue.location.address || t('location')}</span>
          </div>

          <div className="photo-preview-grid">
            {issue.image_urls?.map((url, i) => (
              <img key={i} src={url} alt="Proof" className="preview-img-square" />
            ))}
          </div>
        </div>

        {issue.status === 'Resolved' && !issue.feedback && (
          <div className="feedback-prompt-card animate-slide-up">
            <h3>{t('feedback_title')}</h3>
            <p>{t('feedback_msg')}</p>
            <div className="star-rating-row">
              {[1, 2, 3, 4, 5].map(s => (
                <Star 
                  key={s} 
                  size={36} 
                  className={rating >= s ? 'star-gold' : 'star-muted'} 
                  onClick={() => setRating(s)}
                />
              ))}
            </div>
            <textarea 
              placeholder="..." 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            ></textarea>
            <button className="submit-feedback-btn" onClick={handleFeedbackSubmit} disabled={submittingFeedback}>
              {t('submit_feedback')}
            </button>
          </div>
        )}

        {issue.feedback && (
          <div className="feedback-done-card">
            <div className="feedback-header">
              <MessageSquare size={18} />
              <span>{t('feedback_title')}</span>
            </div>
            <div className="stars-small">
              {'★'.repeat(issue.feedback.rating)}{'☆'.repeat(5-issue.feedback.rating)}
            </div>
            <p>"{issue.feedback.comment}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplaintDetails;
