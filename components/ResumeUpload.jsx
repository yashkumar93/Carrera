'use client';

import { useState, useRef } from 'react';
import apiService from '../lib/api';

export default function ResumeUpload({ onAnalysisComplete }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  async function handleFile(file) {
    if (!file) return;
    if (!file.name.endsWith('.pdf')) {
      setError('Only PDF files are supported.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum size is 5 MB.');
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const result = await apiService.parseResume(file);
      setAnalysis(result.analysis);
      if (onAnalysisComplete) onAnalysisComplete(result.analysis);
    } catch (e) {
      setError(e.message || 'Failed to parse resume. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  const s = {
    container: { fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" },
    dropzone: {
      border: `2px dashed ${dragging ? '#a855f7' : '#333'}`,
      borderRadius: '12px',
      padding: '2rem',
      textAlign: 'center',
      background: dragging ? 'rgba(168,85,247,0.05)' : '#111',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    icon: { fontSize: '2.5rem', marginBottom: '0.5rem' },
    label: { color: '#aaa', fontSize: '0.9rem', marginBottom: '0.25rem' },
    hint: { color: '#555', fontSize: '0.75rem' },
    btn: {
      marginTop: '1rem',
      background: '#a855f7',
      color: '#fff',
      border: 'none',
      borderRadius: '8px',
      padding: '0.5rem 1.2rem',
      cursor: 'pointer',
      fontWeight: 600,
      fontSize: '0.85rem',
    },
    error: { color: '#f87171', marginTop: '0.75rem', fontSize: '0.85rem' },
    spinner: { color: '#a855f7', marginTop: '0.5rem', fontSize: '0.85rem' },
    card: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '1.2rem', marginTop: '1.5rem' },
    sectionTitle: { color: '#888', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' },
    pill: { display: 'inline-block', background: '#2a1f3d', color: '#c084fc', border: '1px solid #4c1d95', borderRadius: '20px', padding: '0.2rem 0.65rem', fontSize: '0.75rem', margin: '0.15rem' },
    careerCard: { background: '#111', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '0.8rem', marginBottom: '0.5rem' },
    careerName: { fontWeight: 700, color: '#fff', marginBottom: '0.25rem', fontSize: '0.9rem' },
    fitReason: { color: '#aaa', fontSize: '0.8rem', marginBottom: '0.3rem' },
    gapLabel: { color: '#fbbf24', fontSize: '0.75rem' },
    successBadge: { color: '#4ade80', fontSize: '0.8rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' },
  };

  if (analysis) {
    return (
      <div style={s.container}>
        <div style={s.successBadge}>
          <span>✓</span> Resume parsed — profile updated automatically
        </div>

        <div style={s.card}>
          <div style={s.sectionTitle}>Skills Extracted ({(analysis.skills || []).length})</div>
          <div>{(analysis.skills || []).map(sk => <span key={sk} style={s.pill}>{sk}</span>)}</div>
        </div>

        {(analysis.certifications || []).length > 0 && (
          <div style={s.card}>
            <div style={s.sectionTitle}>Certifications</div>
            <div>{(analysis.certifications || []).map(c => <span key={c} style={{ ...s.pill, background: '#1f2937', color: '#93c5fd', borderColor: '#1e40af' }}>{c}</span>)}</div>
          </div>
        )}

        {(analysis.recommended_careers || []).length > 0 && (
          <div style={s.card}>
            <div style={s.sectionTitle}>Recommended Careers</div>
            {(analysis.recommended_careers || []).map((c, i) => (
              <div key={i} style={s.careerCard}>
                <div style={s.careerName}>{c.career}</div>
                <div style={s.fitReason}>{c.fit_reason}</div>
                {(c.skill_gap || []).length > 0 && (
                  <div style={s.gapLabel}>Gap: {c.skill_gap.join(', ')}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {(analysis.transferable_skills || []).length > 0 && (
          <div style={s.card}>
            <div style={s.sectionTitle}>Transferable Skills</div>
            {(analysis.transferable_skills || []).map((t, i) => (
              <div key={i} style={{ padding: '0.4rem 0', borderBottom: '1px solid #1a1a1a', fontSize: '0.82rem' }}>
                <span style={{ color: '#c084fc', fontWeight: 600 }}>{t.skill}</span>
                <span style={{ color: '#555' }}> → </span>
                <span style={{ color: '#888' }}>{(t.target_careers || []).join(', ')}</span>
                <span style={{ color: t.strength === 'high' ? '#4ade80' : t.strength === 'medium' ? '#facc15' : '#f87171', marginLeft: '0.5rem', fontSize: '0.7rem' }}>
                  {t.strength}
                </span>
              </div>
            ))}
          </div>
        )}

        <button
          style={{ ...s.btn, background: '#2a2a2a', color: '#888', marginTop: '1rem' }}
          onClick={() => { setAnalysis(null); setError(null); }}
        >
          Upload another resume
        </button>
      </div>
    );
  }

  return (
    <div style={s.container}>
      <div
        style={s.dropzone}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !uploading && fileRef.current?.click()}
      >
        <div style={s.icon}>{uploading ? '⏳' : '📄'}</div>
        <div style={s.label}>
          {uploading ? 'Parsing your resume with AI...' : 'Drop your PDF resume here'}
        </div>
        <div style={s.hint}>or click to browse — PDF only, max 5 MB</div>
        {!uploading && <button style={s.btn} onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}>Choose File</button>}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,application/pdf"
        style={{ display: 'none' }}
        onChange={e => handleFile(e.target.files[0])}
      />
      {uploading && <div style={s.spinner}>Extracting skills, experience, and career matches...</div>}
      {error && <div style={s.error}>{error}</div>}
    </div>
  );
}
