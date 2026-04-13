'use client';

import { useState, useEffect } from 'react';
import { onAuthChange } from '../../lib/firebase';
import apiService from '../../lib/api';

const EXPERTISE_OPTIONS = [
  'All', 'Data Science', 'Software Engineering', 'UX Design', 'Product Management',
  'Finance', 'Marketing', 'Healthcare', 'Entrepreneurship', 'Machine Learning',
  'DevOps', 'Cybersecurity', 'Business Analysis', 'Project Management',
];

export default function MentorsPage() {
  const [user, setUser] = useState(null);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [requestModal, setRequestModal] = useState(null);
  const [requestForm, setRequestForm] = useState({ message: '', goals: '', preferred_schedule: '' });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [myProfile, setMyProfile] = useState(null);
  const [registerForm, setRegisterForm] = useState({
    name: '', bio: '', expertise: [], experience_years: 0,
    availability: '', pricing: 'Free', linkedin_url: '', languages: ['English'],
  });

  useEffect(() => {
    const unsub = onAuthChange(async (u) => {
      if (u) {
        setUser(u);
        const [m, mp] = await Promise.all([
          apiService.listMentors(),
          apiService.getMyMentorProfile(),
        ]);
        setMentors(m.mentors || []);
        setMyProfile(mp);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function applyFilter(exp) {
    setFilter(exp);
    setLoading(true);
    const data = await apiService.listMentors(exp === 'All' ? null : exp);
    setMentors(data.mentors || []);
    setLoading(false);
  }

  async function sendRequest() {
    if (!requestForm.message.trim() || !requestForm.goals.trim()) return;
    setSubmitting(true);
    try {
      await apiService.requestMentorship(requestModal.id, requestForm);
      showToast('Request sent!');
      setRequestModal(null);
      setRequestForm({ message: '', goals: '', preferred_schedule: '' });
    } catch (e) {
      showToast(e.message || 'Failed to send request', true);
    } finally {
      setSubmitting(false);
    }
  }

  async function registerAsMentor() {
    setSubmitting(true);
    try {
      await apiService.registerMentor(registerForm);
      const mp = await apiService.getMyMentorProfile();
      setMyProfile(mp);
      setShowRegister(false);
      showToast('Mentor profile saved!');
    } catch (e) {
      showToast(e.message || 'Failed to register', true);
    } finally {
      setSubmitting(false);
    }
  }

  function showToast(msg, err = false) {
    setToast({ msg, err });
    setTimeout(() => setToast(null), 3000);
  }

  const s = {
    page: { minHeight: '100vh', background: '#0f0f0f', color: '#fff', fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif", padding: '2rem' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' },
    title: { fontSize: '1.8rem', fontWeight: 700, color: '#a855f7', margin: 0 },
    subtitle: { color: '#888', marginTop: '0.3rem', fontSize: '0.9rem' },
    primaryBtn: { background: '#a855f7', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.6rem 1.2rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' },
    secondaryBtn: { background: '#1a1a1a', color: '#aaa', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' },
    filters: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' },
    filterPill: (active) => ({ padding: '0.3rem 0.9rem', borderRadius: '20px', border: `1px solid ${active ? '#a855f7' : '#2a2a2a'}`, background: active ? 'rgba(168,85,247,0.15)' : 'transparent', color: active ? '#c084fc' : '#666', cursor: 'pointer', fontSize: '0.8rem', fontWeight: active ? 700 : 400 }),
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' },
    card: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '1.2rem', cursor: 'pointer', transition: 'border-color 0.2s' },
    cardHover: { borderColor: '#a855f7' },
    name: { fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' },
    bio: { color: '#888', fontSize: '0.82rem', lineHeight: 1.5, marginBottom: '0.75rem' },
    tags: { display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.75rem' },
    tag: { background: '#2a1f3d', color: '#c084fc', border: '1px solid #4c1d95', borderRadius: '20px', padding: '0.15rem 0.55rem', fontSize: '0.7rem' },
    meta: { display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#666' },
    rating: { color: '#facc15' },
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' },
    modal: { background: '#111', border: '1px solid #2a2a2a', borderRadius: '16px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
    modalTitle: { fontSize: '1.2rem', fontWeight: 700, color: '#a855f7' },
    closeBtn: { background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '1.3rem' },
    label: { display: 'block', color: '#888', fontSize: '0.78rem', marginBottom: '0.4rem', marginTop: '0.9rem' },
    input: { width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', padding: '0.6rem 0.9rem', color: '#fff', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' },
    textarea: { width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', padding: '0.6rem 0.9rem', color: '#fff', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', resize: 'vertical', minHeight: '80px' },
    toast: (err) => ({ position: 'fixed', bottom: '2rem', right: '2rem', background: err ? '#7f1d1d' : '#166534', color: '#fff', padding: '0.75rem 1.2rem', borderRadius: '8px', fontWeight: 600, zIndex: 9999 }),
    badge: { display: 'inline-block', background: '#166534', color: '#4ade80', borderRadius: '20px', padding: '0.15rem 0.55rem', fontSize: '0.7rem', fontWeight: 700, marginLeft: '0.5rem' },
  };

  return (
    <div style={s.page}>
      {toast && <div style={s.toast(toast.err)}>{toast.msg}</div>}

      <div style={s.header}>
        <div>
          <h1 style={s.title}>Mentorship Marketplace</h1>
          <p style={s.subtitle}>Connect with industry professionals for 1-on-1 career guidance</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {myProfile ? (
            <button style={s.secondaryBtn} onClick={() => setShowRegister(true)}>
              Edit My Mentor Profile
            </button>
          ) : (
            <button style={s.primaryBtn} onClick={() => setShowRegister(true)}>
              Become a Mentor
            </button>
          )}
        </div>
      </div>

      {/* Expertise filters */}
      <div style={s.filters}>
        {EXPERTISE_OPTIONS.map(exp => (
          <button key={exp} style={s.filterPill(filter === exp)} onClick={() => applyFilter(exp)}>
            {exp}
          </button>
        ))}
      </div>

      {/* Mentor grid */}
      {loading ? (
        <div style={{ color: '#555', padding: '2rem' }}>Loading mentors...</div>
      ) : mentors.length === 0 ? (
        <div style={{ color: '#555', padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎓</div>
          No mentors found{filter !== 'All' ? ` for "${filter}"` : ''}. Be the first to register!
        </div>
      ) : (
        <div style={s.grid}>
          {mentors.map(m => (
            <div
              key={m.id}
              style={s.card}
              onClick={() => setSelectedMentor(m)}
              onMouseOver={e => e.currentTarget.style.borderColor = '#a855f7'}
              onMouseOut={e => e.currentTarget.style.borderColor = '#2a2a2a'}
            >
              <div style={s.name}>
                {m.name}
                {m.verified && <span style={s.badge}>✓ Verified</span>}
              </div>
              <div style={s.bio}>{m.bio?.slice(0, 120)}{m.bio?.length > 120 ? '...' : ''}</div>
              <div style={s.tags}>
                {(m.expertise || []).slice(0, 3).map(e => <span key={e} style={s.tag}>{e}</span>)}
              </div>
              <div style={s.meta}>
                <span style={s.rating}>{'★'.repeat(Math.round(m.rating || 0))}{'☆'.repeat(5 - Math.round(m.rating || 0))} {(m.rating || 0).toFixed(1)}</span>
                <span>{m.experience_years}y exp</span>
                <span>{m.pricing}</span>
                <span>{m.availability}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mentor detail modal */}
      {selectedMentor && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setSelectedMentor(null)}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <div>
                <div style={{ ...s.modalTitle, marginBottom: '0.25rem' }}>{selectedMentor.name}</div>
                <div style={{ color: '#888', fontSize: '0.82rem' }}>{selectedMentor.experience_years} years experience</div>
              </div>
              <button style={s.closeBtn} onClick={() => setSelectedMentor(null)}>✕</button>
            </div>
            <p style={{ color: '#ccc', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '1rem' }}>{selectedMentor.bio}</p>
            <div style={s.tags}>
              {(selectedMentor.expertise || []).map(e => <span key={e} style={s.tag}>{e}</span>)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', margin: '1rem 0', fontSize: '0.85rem' }}>
              <div><span style={{ color: '#555' }}>Pricing: </span><span style={{ color: '#ccc' }}>{selectedMentor.pricing}</span></div>
              <div><span style={{ color: '#555' }}>Availability: </span><span style={{ color: '#ccc' }}>{selectedMentor.availability}</span></div>
              <div><span style={{ color: '#555' }}>Languages: </span><span style={{ color: '#ccc' }}>{(selectedMentor.languages || []).join(', ')}</span></div>
              <div style={s.rating}>{'★'.repeat(Math.round(selectedMentor.rating || 0))} {(selectedMentor.rating || 0).toFixed(1)} ({selectedMentor.review_count || 0} reviews)</div>
            </div>
            {selectedMentor.linkedin_url && (
              <div style={{ marginBottom: '1rem' }}>
                <span style={{ color: '#555', fontSize: '0.82rem' }}>LinkedIn: </span>
                <span style={{ color: '#60a5fa', fontSize: '0.82rem' }}>{selectedMentor.linkedin_url}</span>
              </div>
            )}
            <button
              style={{ ...s.primaryBtn, width: '100%' }}
              onClick={() => { setRequestModal(selectedMentor); setSelectedMentor(null); }}
            >
              Request Mentorship Session
            </button>
          </div>
        </div>
      )}

      {/* Request modal */}
      {requestModal && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setRequestModal(null)}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <div style={s.modalTitle}>Request Mentorship — {requestModal.name}</div>
              <button style={s.closeBtn} onClick={() => setRequestModal(null)}>✕</button>
            </div>
            <label style={s.label}>Why do you want mentorship from {requestModal.name}? *</label>
            <textarea style={s.textarea} value={requestForm.message} onChange={e => setRequestForm(f => ({ ...f, message: e.target.value }))} placeholder="Introduce yourself and explain what you're working on..." />
            <label style={s.label}>What do you hope to achieve from this mentorship? *</label>
            <textarea style={s.textarea} value={requestForm.goals} onChange={e => setRequestForm(f => ({ ...f, goals: e.target.value }))} placeholder="Specific goals, e.g. 'Land a data science role in 3 months'" />
            <label style={s.label}>Preferred schedule (optional)</label>
            <input style={s.input} value={requestForm.preferred_schedule} onChange={e => setRequestForm(f => ({ ...f, preferred_schedule: e.target.value }))} placeholder="e.g. Weekends, Tuesday evenings" />
            <button style={{ ...s.primaryBtn, width: '100%', marginTop: '1.2rem' }} onClick={sendRequest} disabled={submitting || !requestForm.message || !requestForm.goals}>
              {submitting ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </div>
      )}

      {/* Register as mentor modal */}
      {showRegister && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setShowRegister(false)}>
          <div style={{ ...s.modal, maxWidth: '600px' }}>
            <div style={s.modalHeader}>
              <div style={s.modalTitle}>{myProfile ? 'Edit Mentor Profile' : 'Become a Mentor'}</div>
              <button style={s.closeBtn} onClick={() => setShowRegister(false)}>✕</button>
            </div>
            <label style={s.label}>Full Name *</label>
            <input style={s.input} value={registerForm.name} onChange={e => setRegisterForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" />
            <label style={s.label}>Bio (tell mentees about yourself) *</label>
            <textarea style={s.textarea} value={registerForm.bio} onChange={e => setRegisterForm(f => ({ ...f, bio: e.target.value }))} placeholder="Your background, experience, and what you can help with..." />
            <label style={s.label}>Expertise (click to select) *</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem' }}>
              {EXPERTISE_OPTIONS.slice(1).map(e => (
                <button
                  key={e}
                  type="button"
                  style={{ ...s.filterPill(registerForm.expertise.includes(e)), cursor: 'pointer' }}
                  onClick={() => setRegisterForm(f => ({
                    ...f,
                    expertise: f.expertise.includes(e) ? f.expertise.filter(x => x !== e) : [...f.expertise, e],
                  }))}
                >
                  {e}
                </button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={s.label}>Years of Experience *</label>
                <input style={s.input} type="number" min="0" max="50" value={registerForm.experience_years} onChange={e => setRegisterForm(f => ({ ...f, experience_years: parseInt(e.target.value) || 0 }))} />
              </div>
              <div>
                <label style={s.label}>Pricing</label>
                <input style={s.input} value={registerForm.pricing} onChange={e => setRegisterForm(f => ({ ...f, pricing: e.target.value }))} placeholder="Free, $50/hr..." />
              </div>
            </div>
            <label style={s.label}>Availability</label>
            <input style={s.input} value={registerForm.availability} onChange={e => setRegisterForm(f => ({ ...f, availability: e.target.value }))} placeholder="e.g. Weekends, 2 hrs/week" />
            <label style={s.label}>LinkedIn URL (optional)</label>
            <input style={s.input} value={registerForm.linkedin_url} onChange={e => setRegisterForm(f => ({ ...f, linkedin_url: e.target.value }))} placeholder="https://linkedin.com/in/yourprofile" />
            <button style={{ ...s.primaryBtn, width: '100%', marginTop: '1.2rem' }} onClick={registerAsMentor} disabled={submitting || !registerForm.name || !registerForm.bio || registerForm.expertise.length === 0}>
              {submitting ? 'Saving...' : 'Save Mentor Profile'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
