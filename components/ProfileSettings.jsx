'use client';

import { useState, useEffect } from 'react';
import apiService from '../lib/api';
import { deleteCurrentUser, signOutUser } from '../lib/firebase';
import { ArrowLeft, Save, Trash2, AlertTriangle } from 'lucide-react';
import ResumeUpload from './ResumeUpload';

export default function ProfileSettings({ onBack, isDarkMode }) {
  const [profile, setProfile] = useState({
    name: '',
    education: '',
    career_interests: [],
    skills: [],
    experience_level: '',
    bio: '',
  });
  const [interestsInput, setInterestsInput] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Resume upload
  const [showResumeUpload, setShowResumeUpload] = useState(false);

  const dark = isDarkMode;

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    try {
      const data = await apiService.getProfile();
      const p = data?.profile || {};
      setProfile({
        name: p.name || '',
        education: p.education || '',
        career_interests: Array.isArray(p.career_interests) ? p.career_interests : [],
        skills: Array.isArray(p.skills) ? p.skills : [],
        experience_level: p.experience_level || '',
        bio: p.bio || '',
      });
      setInterestsInput(Array.isArray(p.career_interests) ? p.career_interests.join(', ') : '');
      setSkillsInput(Array.isArray(p.skills) ? p.skills.join(', ') : '');
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const payload = {
        name: profile.name || null,
        education: profile.education || null,
        career_interests: interestsInput
          ? interestsInput.split(',').map(s => s.trim()).filter(Boolean)
          : null,
        skills: skillsInput
          ? skillsInput.split(',').map(s => s.trim()).filter(Boolean)
          : null,
        experience_level: profile.experience_level || null,
        bio: profile.bio || null,
      };
      await apiService.updateProfile(payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError('Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteText !== 'DELETE') return;
    setDeleting(true);
    setError('');
    try {
      // 1. Delete all user data on the server
      await apiService.deleteAccountData();
      // 2. Delete Firebase Auth account
      await deleteCurrentUser();
      // 3. Sign out (clears local state)
      await signOutUser();
      // The auth listener in page.js will redirect to landing
    } catch (err) {
      setError('Failed to delete account. You may need to re-authenticate first.');
      setDeleting(false);
    }
  }

  // ── Styles ─────────────────────────────────────────────────────────────────
  const bg = dark ? '#212121' : '#ffffff';
  const cardBg = dark ? '#2a2a2a' : '#ffffff';
  const border = dark ? '#3f3f3f' : '#e5e5e5';
  const textColor = dark ? '#ececec' : '#2f2f2f';
  const secondaryText = dark ? '#9b9b9b' : '#6b6b6b';
  const inputBg = dark ? '#333333' : '#f8fafc';
  const accent = '#7c3aed';

  const containerStyle = {
    minHeight: '100vh',
    background: bg,
    color: textColor,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    overflowY: 'auto',
  };

  const headerStyle = {
    width: '100%',
    maxWidth: '600px',
    padding: '1.5rem 1rem 0',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  };

  const backBtnStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    background: 'transparent',
    border: `1px solid ${border}`,
    borderRadius: '8px',
    padding: '0.5rem 0.75rem',
    color: textColor,
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  };

  const cardStyle = {
    width: '100%',
    maxWidth: '600px',
    padding: '1.5rem 1rem',
  };

  const sectionStyle = {
    background: cardBg,
    border: `1px solid ${border}`,
    borderRadius: '14px',
    padding: '1.5rem',
    marginBottom: '1rem',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: secondaryText,
    marginBottom: '0.375rem',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  };

  const inputStyle = {
    width: '100%',
    padding: '0.625rem 0.75rem',
    borderRadius: '8px',
    border: `1px solid ${border}`,
    background: inputBg,
    color: textColor,
    fontSize: '0.9rem',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  };

  const fieldGap = { marginBottom: '1rem' };

  const saveBtnStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    width: '100%',
    padding: '0.75rem',
    background: accent,
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.9375rem',
    fontWeight: 600,
    cursor: saving ? 'not-allowed' : 'pointer',
    opacity: saving ? 0.7 : 1,
    fontFamily: 'inherit',
    transition: 'opacity 0.15s',
  };

  if (loading) {
    return (
      <div style={{ ...containerStyle, justifyContent: 'center' }}>
        <div style={{
          width: '32px', height: '32px',
          border: `3px solid ${border}`,
          borderTopColor: accent,
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={headerStyle}>
        <button onClick={onBack} style={backBtnStyle}>
          <ArrowLeft size={15} /> Back
        </button>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Profile Settings</h2>
      </div>

      {/* Form */}
      <div style={cardStyle}>
        <form onSubmit={handleSave}>
          <div style={sectionStyle}>
            <div style={fieldGap}>
              <label style={labelStyle}>Name</label>
              <input
                style={inputStyle}
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="Your name"
              />
            </div>
            <div style={fieldGap}>
              <label style={labelStyle}>Education</label>
              <input
                style={inputStyle}
                value={profile.education}
                onChange={(e) => setProfile({ ...profile, education: e.target.value })}
                placeholder="e.g. B.Sc Computer Science"
              />
            </div>
            <div style={fieldGap}>
              <label style={labelStyle}>Career Interests</label>
              <input
                style={inputStyle}
                value={interestsInput}
                onChange={(e) => setInterestsInput(e.target.value)}
                placeholder="e.g. Data Science, UX Design, Product Management"
              />
              <span style={{ fontSize: '0.75rem', color: secondaryText }}>
                Separate with commas
              </span>
            </div>
            <div style={fieldGap}>
              <label style={labelStyle}>Skills</label>
              <input
                style={inputStyle}
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                placeholder="e.g. Python, SQL, Figma, Communication"
              />
              <span style={{ fontSize: '0.75rem', color: secondaryText }}>
                Separate with commas
              </span>
            </div>
            <div style={fieldGap}>
              <label style={labelStyle}>Experience Level</label>
              <select
                style={{ ...inputStyle, cursor: 'pointer' }}
                value={profile.experience_level}
                onChange={(e) => setProfile({ ...profile, experience_level: e.target.value })}
              >
                <option value="">Select...</option>
                <option value="student">Student</option>
                <option value="entry">Entry Level</option>
                <option value="mid">Mid Level</option>
                <option value="senior">Senior</option>
                <option value="career_changer">Career Changer</option>
              </select>
            </div>
            <div style={{ marginBottom: 0 }}>
              <label style={labelStyle}>Bio</label>
              <textarea
                style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Tell us a bit about yourself and your career goals..."
                maxLength={500}
              />
            </div>
          </div>

          {error && (
            <div style={{
              padding: '0.75rem 1rem',
              background: dark ? 'rgba(239,68,68,0.15)' : '#fef2f2',
              border: `1px solid ${dark ? 'rgba(239,68,68,0.4)' : '#fecaca'}`,
              borderRadius: '10px',
              color: '#ef4444',
              fontSize: '0.8125rem',
              fontWeight: 500,
              marginBottom: '1rem',
            }}>
              {error}
            </div>
          )}

          {saved && (
            <div style={{
              padding: '0.75rem 1rem',
              background: dark ? 'rgba(34,197,94,0.15)' : '#f0fdf4',
              border: `1px solid ${dark ? 'rgba(34,197,94,0.4)' : '#bbf7d0'}`,
              borderRadius: '10px',
              color: '#22c55e',
              fontSize: '0.8125rem',
              fontWeight: 500,
              marginBottom: '1rem',
              textAlign: 'center',
            }}>
              Profile saved successfully
            </div>
          )}

          <button type="submit" disabled={saving} style={saveBtnStyle}>
            {saving ? <span style={{
              width: '18px', height: '18px',
              border: '2px solid rgba(255,255,255,0.3)',
              borderTopColor: '#fff',
              borderRadius: '50%',
              display: 'inline-block',
              animation: 'spin 0.6s linear infinite',
            }} /> : <><Save size={15} /> Save Profile</>}
          </button>
        </form>

        {/* ── Resume Upload ────────────────────────────────────────────────── */}
        <div style={{ ...sectionStyle, marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0 }}>Resume Analysis</h3>
            <button
              onClick={() => setShowResumeUpload(v => !v)}
              style={{
                padding: '0.35rem 0.9rem',
                background: accent,
                color: '#fff',
                border: 'none',
                borderRadius: '7px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {showResumeUpload ? 'Hide' : 'Upload Resume'}
            </button>
          </div>
          <p style={{ fontSize: '0.8rem', color: secondaryText, marginBottom: '0.75rem' }}>
            Upload your PDF resume to auto-extract skills, experience, and get personalised career matches.
          </p>
          {showResumeUpload && (
            <ResumeUpload
              onAnalysisComplete={(analysis) => {
                if (analysis.skills?.length) {
                  setProfile(p => ({ ...p, skills: analysis.skills }));
                  setSkillsInput(analysis.skills.join(', '));
                }
                if (analysis.experience_level) {
                  setProfile(p => ({ ...p, experience_level: analysis.experience_level }));
                }
                if (analysis.career_interests_inferred?.length) {
                  setProfile(p => ({ ...p, career_interests: analysis.career_interests_inferred }));
                  setInterestsInput(analysis.career_interests_inferred.join(', '));
                }
              }}
            />
          )}
        </div>

        {/* ── Danger zone: Delete Account ──────────────────────────────────── */}
        <div style={{
          ...sectionStyle,
          marginTop: '2rem',
          border: `1px solid ${dark ? 'rgba(239,68,68,0.4)' : '#fecaca'}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <AlertTriangle size={16} color="#ef4444" />
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0, color: '#ef4444' }}>
              Danger Zone
            </h3>
          </div>
          <p style={{ fontSize: '0.8125rem', color: secondaryText, marginBottom: '1rem', lineHeight: 1.5 }}>
            Permanently delete your account and all associated data (sessions, profile, feedback).
            This action cannot be undone.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.625rem 1rem',
                background: 'transparent',
                border: `1px solid ${dark ? 'rgba(239,68,68,0.5)' : '#fecaca'}`,
                borderRadius: '8px',
                color: '#ef4444',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <Trash2 size={14} /> Delete My Account
            </button>
          ) : (
            <div>
              <p style={{ fontSize: '0.8125rem', color: textColor, marginBottom: '0.625rem' }}>
                Type <strong>DELETE</strong> to confirm:
              </p>
              <input
                style={{ ...inputStyle, marginBottom: '0.625rem' }}
                value={deleteText}
                onChange={(e) => setDeleteText(e.target.value)}
                placeholder="Type DELETE"
                autoFocus
              />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteText !== 'DELETE' || deleting}
                  style={{
                    flex: 1,
                    padding: '0.625rem',
                    background: deleteText === 'DELETE' ? '#ef4444' : (dark ? '#333' : '#e2e8f0'),
                    color: deleteText === 'DELETE' ? '#fff' : secondaryText,
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    cursor: deleteText === 'DELETE' && !deleting ? 'pointer' : 'not-allowed',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.375rem',
                  }}
                >
                  {deleting ? <span style={{
                    width: '14px', height: '14px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'spin 0.6s linear infinite',
                  }} /> : 'Permanently Delete'}
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteText(''); }}
                  style={{
                    padding: '0.625rem 1rem',
                    background: 'transparent',
                    border: `1px solid ${border}`,
                    borderRadius: '8px',
                    color: textColor,
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
