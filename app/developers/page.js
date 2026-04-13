'use client';

import { useState, useEffect } from 'react';
import { onAuthChange } from '../../lib/firebase';
import apiService from '../../lib/api';

export default function DevelopersPage() {
  const [user, setUser] = useState(null);
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKey, setNewKey] = useState(null); // shown once
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState(null);
  const [revoking, setRevoking] = useState(null);

  useEffect(() => {
    const unsub = onAuthChange(async (u) => {
      if (u) {
        setUser(u);
        await loadKeys();
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function loadKeys() {
    try {
      const data = await apiService.listApiKeys();
      setKeys(data.keys || []);
    } catch (e) { /* silent */ }
  }

  async function createKey() {
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const data = await apiService.createApiKey(newKeyName.trim());
      setNewKey(data);
      setNewKeyName('');
      await loadKeys();
    } catch (e) {
      showToast(e.message || 'Failed to create key', true);
    } finally {
      setCreating(false);
    }
  }

  async function revokeKey(keyId) {
    setRevoking(keyId);
    try {
      await apiService.revokeApiKey(keyId);
      setKeys(prev => prev.filter(k => k.id !== keyId));
      showToast('Key revoked');
    } catch (e) {
      showToast('Failed to revoke key', true);
    } finally {
      setRevoking(null);
    }
  }

  function showToast(msg, err = false) {
    setToast({ msg, err });
    setTimeout(() => setToast(null), 4000);
  }

  const API_BASE = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') : 'http://localhost:8000';

  const s = {
    page: { minHeight: '100vh', background: '#0f0f0f', color: '#fff', fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif", padding: '2rem', maxWidth: '900px', margin: '0 auto' },
    title: { fontSize: '1.8rem', fontWeight: 700, color: '#a855f7', margin: 0 },
    subtitle: { color: '#888', marginTop: '0.3rem', fontSize: '0.9rem', marginBottom: '2rem' },
    section: { marginBottom: '2.5rem' },
    sectionTitle: { fontSize: '1.1rem', fontWeight: 700, color: '#e5e7eb', marginBottom: '1rem' },
    card: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '1.3rem' },
    input: { flex: 1, background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '0.65rem 1rem', color: '#fff', fontSize: '0.88rem', outline: 'none' },
    primaryBtn: { background: '#a855f7', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.65rem 1.2rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' },
    dangerBtn: { background: 'transparent', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '6px', padding: '0.35rem 0.8rem', cursor: 'pointer', fontSize: '0.78rem' },
    keyRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid #111', fontSize: '0.85rem' },
    code: { background: '#111', border: '1px solid #333', borderRadius: '6px', padding: '0.8rem 1rem', fontFamily: 'monospace', fontSize: '0.82rem', color: '#4ade80', wordBreak: 'break-all', userSelect: 'all', marginTop: '0.5rem' },
    codeBlock: { background: '#0a0a0a', border: '1px solid #1f1f1f', borderRadius: '8px', padding: '1rem', fontFamily: 'monospace', fontSize: '0.8rem', color: '#e5e7eb', overflowX: 'auto', whiteSpace: 'pre', marginTop: '0.5rem', lineHeight: 1.6 },
    label: { color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' },
    alert: { background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: '8px', padding: '0.9rem', color: '#fbbf24', fontSize: '0.85rem', marginBottom: '1rem' },
    toast: (err) => ({ position: 'fixed', bottom: '2rem', right: '2rem', background: err ? '#7f1d1d' : '#166534', color: '#fff', padding: '0.75rem 1.2rem', borderRadius: '8px', fontWeight: 600, zIndex: 9999 }),
  };

  return (
    <div style={s.page}>
      {toast && <div style={s.toast(toast.err)}>{toast.msg}</div>}

      <h1 style={s.title}>Developer API</h1>
      <p style={s.subtitle}>Integrate Careerra's career intelligence into your own apps</p>

      {/* New key revealed */}
      {newKey && (
        <div style={{ ...s.card, borderColor: '#4ade80', marginBottom: '2rem' }}>
          <div style={{ color: '#4ade80', fontWeight: 700, marginBottom: '0.5rem' }}>✓ API Key Created — Copy it now!</div>
          <div style={{ color: '#fbbf24', fontSize: '0.82rem', marginBottom: '0.5rem' }}>This key will NOT be shown again.</div>
          <div style={s.code}>{newKey.key}</div>
          <button style={{ ...s.primaryBtn, marginTop: '0.75rem', background: '#1a1a1a', color: '#aaa', border: '1px solid #2a2a2a' }} onClick={() => { navigator.clipboard?.writeText(newKey.key); showToast('Copied!'); }}>Copy to clipboard</button>
          <button style={{ ...s.dangerBtn, marginLeft: '0.5rem', marginTop: '0.75rem' }} onClick={() => setNewKey(null)}>Dismiss</button>
        </div>
      )}

      {/* Generate new key */}
      <div style={{ ...s.section, ...s.card }}>
        <div style={s.sectionTitle}>Generate API Key</div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            style={s.input}
            value={newKeyName}
            onChange={e => setNewKeyName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createKey()}
            placeholder="Key name (e.g. My App, Portfolio Project)"
          />
          <button style={s.primaryBtn} onClick={createKey} disabled={creating || !newKeyName.trim()}>
            {creating ? 'Creating...' : 'Generate'}
          </button>
        </div>
        <div style={{ color: '#555', fontSize: '0.78rem', marginTop: '0.5rem' }}>Max 5 keys per account.</div>
      </div>

      {/* Existing keys */}
      <div style={s.section}>
        <div style={s.sectionTitle}>Active Keys ({keys.length})</div>
        {loading ? (
          <div style={{ color: '#555' }}>Loading...</div>
        ) : keys.length === 0 ? (
          <div style={{ color: '#555', fontSize: '0.85rem' }}>No API keys yet. Generate one above.</div>
        ) : (
          <div style={s.card}>
            {keys.map(k => (
              <div key={k.id} style={s.keyRow}>
                <div>
                  <div style={{ fontWeight: 600, color: '#e5e7eb' }}>{k.name}</div>
                  <div style={{ color: '#555', fontFamily: 'monospace', fontSize: '0.78rem' }}>{k.key_preview}</div>
                  <div style={{ color: '#444', fontSize: '0.72rem' }}>{k.request_count} requests · Created {k.createdAt ? new Date(k.createdAt._seconds * 1000).toLocaleDateString() : 'recently'}</div>
                </div>
                <button style={s.dangerBtn} disabled={revoking === k.id} onClick={() => revokeKey(k.id)}>
                  {revoking === k.id ? 'Revoking...' : 'Revoke'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* API Reference */}
      <div style={s.section}>
        <div style={s.sectionTitle}>Quick Start</div>
        <div style={s.card}>
          <div style={{ ...s.label, marginBottom: '0.5rem' }}>Base URL</div>
          <div style={s.code}>{API_BASE}/api</div>

          <div style={{ ...s.label, marginTop: '1.2rem', marginBottom: '0.5rem' }}>Authentication</div>
          <div style={{ color: '#aaa', fontSize: '0.83rem', marginBottom: '0.5rem' }}>Pass your API key in the <code style={{ color: '#c084fc' }}>X-API-Key</code> header on all requests.</div>

          <div style={{ ...s.label, marginTop: '1.2rem', marginBottom: '0.5rem' }}>POST /api/v1/careers/suggest</div>
          <div style={{ color: '#aaa', fontSize: '0.83rem', marginBottom: '0.5rem' }}>Get AI-powered career suggestions for a user profile.</div>
          <div style={s.codeBlock}>{`curl -X POST ${API_BASE}/api/v1/careers/suggest \\
  -H "X-API-Key: YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "interests": ["coding", "design"],
    "skills": ["Python", "Figma"],
    "experience_level": "entry",
    "max_results": 3
  }'`}</div>

          <div style={{ ...s.label, marginTop: '1.2rem', marginBottom: '0.5rem' }}>GET /api/v1/health</div>
          <div style={{ color: '#aaa', fontSize: '0.83rem', marginBottom: '0.5rem' }}>Verify your key is valid.</div>
          <div style={s.codeBlock}>{`curl ${API_BASE}/api/v1/health \\
  -H "X-API-Key: YOUR_KEY"`}</div>

          <div style={{ ...s.label, marginTop: '1.2rem', marginBottom: '0.5rem' }}>Response Format</div>
          <div style={s.codeBlock}>{`{
  "careers": [
    {
      "career": "UX Designer",
      "fit_score": 9,
      "salary_range": "$65k-$110k/yr (estimate)",
      "demand_trend": "Growing",
      "key_skills": ["Figma", "User Research", "Prototyping"],
      "fit_reason": "Strong design + tech combination...",
      "time_to_entry": "6-12 months"
    }
  ],
  "disclaimer": "Salary estimates are approximate.",
  "powered_by": "Careerra API v1"
}`}</div>

          <div style={{ ...s.label, marginTop: '1.2rem', marginBottom: '0.5rem' }}>Full API Docs</div>
          <div style={{ color: '#60a5fa', fontSize: '0.83rem' }}>
            Interactive docs available at <span style={{ fontFamily: 'monospace' }}>{API_BASE}/docs</span>
          </div>
        </div>
      </div>

      <div style={{ ...s.alert, marginTop: '1rem' }}>
        ⚠️ Keep your API keys secret. Do not expose them in client-side code or public repositories.
      </div>
    </div>
  );
}
