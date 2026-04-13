'use client';

import { useState, useEffect } from 'react';
import { onAuthChange } from '../../lib/firebase';
import apiService from '../../lib/api';

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('stats');
  const [error, setError] = useState(null);
  const [roleUpdating, setRoleUpdating] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const unsub = onAuthChange(async (firebaseUser) => {
      if (!firebaseUser) {
        setLoading(false);
        setError('Not authenticated');
        return;
      }
      setUser(firebaseUser);
      await fetchStats();
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function fetchStats() {
    try {
      const data = await apiService.get('/admin/stats');
      setStats(data);
    } catch (e) {
      if (e.response?.status === 403) {
        setError('Access denied — admin role required.');
      } else {
        setError('Failed to load stats: ' + (e.message || 'unknown error'));
      }
    }
  }

  async function fetchUsers() {
    try {
      const data = await apiService.get('/admin/users');
      setUsers(data.users || []);
    } catch (e) {
      setError('Failed to load users');
    }
  }

  async function updateRole(uid, role) {
    setRoleUpdating(uid);
    try {
      await apiService.patch(`/admin/users/${uid}/role`, { role });
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role } : u));
      showToast(`Role updated to '${role}'`);
    } catch (e) {
      showToast('Failed to update role', true);
    } finally {
      setRoleUpdating(null);
    }
  }

  function showToast(message, isError = false) {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => {
    if (activeTab === 'users' && users.length === 0) {
      fetchUsers();
    }
  }, [activeTab]);

  // ── Styles ──────────────────────────────────────────────────────────────
  const s = {
    page: {
      minHeight: '100vh',
      background: '#0f0f0f',
      color: '#fff',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
      padding: '2rem',
    },
    header: { marginBottom: '2rem' },
    title: { fontSize: '1.8rem', fontWeight: 700, color: '#a855f7', margin: 0 },
    subtitle: { color: '#888', marginTop: '0.3rem', fontSize: '0.9rem' },
    tabs: { display: 'flex', gap: '0.5rem', marginBottom: '2rem' },
    tab: (active) => ({
      padding: '0.5rem 1.2rem',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: 600,
      fontSize: '0.85rem',
      background: active ? '#a855f7' : '#1a1a1a',
      color: active ? '#fff' : '#888',
      transition: 'all 0.2s',
    }),
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' },
    card: {
      background: '#1a1a1a',
      border: '1px solid #2a2a2a',
      borderRadius: '12px',
      padding: '1.2rem',
    },
    cardLabel: { color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' },
    cardValue: { fontSize: '2rem', fontWeight: 700, color: '#fff', margin: '0.3rem 0 0' },
    cardSub: { color: '#a855f7', fontSize: '0.8rem' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '0.75rem 1rem', background: '#1a1a1a', color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #2a2a2a' },
    td: { padding: '0.75rem 1rem', borderBottom: '1px solid #1a1a1a', fontSize: '0.85rem' },
    badge: (role) => ({
      display: 'inline-block',
      padding: '0.2rem 0.6rem',
      borderRadius: '20px',
      fontSize: '0.7rem',
      fontWeight: 700,
      background: role === 'admin' ? '#7c3aed' : role === 'counselor' ? '#0ea5e9' : '#2a2a2a',
      color: '#fff',
    }),
    select: {
      background: '#1a1a1a',
      color: '#fff',
      border: '1px solid #333',
      borderRadius: '6px',
      padding: '0.3rem 0.6rem',
      fontSize: '0.8rem',
      cursor: 'pointer',
    },
    error: { background: '#2a1010', border: '1px solid #7f1d1d', borderRadius: '8px', padding: '1rem', color: '#fca5a5' },
    toast: (isError) => ({
      position: 'fixed', bottom: '2rem', right: '2rem',
      background: isError ? '#7f1d1d' : '#166534',
      color: '#fff', padding: '0.75rem 1.2rem',
      borderRadius: '8px', fontWeight: 600, zIndex: 9999,
      boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
    }),
    sectionTitle: { fontSize: '1rem', fontWeight: 700, color: '#ccc', marginBottom: '1rem' },
    stageBar: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' },
    stagePill: (stage) => ({
      background: { discovery: '#1d4ed8', assessment: '#0f766e', exploration: '#7c3aed', roadmap: '#c2410c' }[stage] || '#333',
      color: '#fff', padding: '0.2rem 0.7rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
    }),
  };

  if (loading) {
    return (
      <div style={{ ...s.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#888' }}>Loading admin panel...</div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div style={s.page}>
        <div style={s.error}>{error}</div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      {toast && <div style={s.toast(toast.isError)}>{toast.message}</div>}

      <div style={s.header}>
        <h1 style={s.title}>Admin Dashboard</h1>
        <p style={s.subtitle}>Careerra platform analytics &amp; user management</p>
      </div>

      <div style={s.tabs}>
        {['stats', 'users'].map(tab => (
          <button key={tab} style={s.tab(activeTab === tab)} onClick={() => setActiveTab(tab)}>
            {tab === 'stats' ? 'Platform Stats' : 'User Management'}
          </button>
        ))}
      </div>

      {activeTab === 'stats' && stats && (
        <>
          <div style={s.grid}>
            <div style={s.card}>
              <div style={s.cardLabel}>Total Users</div>
              <div style={s.cardValue}>{stats.total_users}</div>
            </div>
            <div style={s.card}>
              <div style={s.cardLabel}>Total Sessions</div>
              <div style={s.cardValue}>{stats.total_sessions}</div>
              <div style={s.cardSub}>{stats.avg_messages_per_session} avg msgs/session</div>
            </div>
            <div style={s.card}>
              <div style={s.cardLabel}>Total Messages</div>
              <div style={s.cardValue}>{stats.total_messages}</div>
            </div>
            <div style={s.card}>
              <div style={s.cardLabel}>Feedback Collected</div>
              <div style={s.cardValue}>{stats.total_feedback}</div>
              <div style={s.cardSub}>👍 {stats.thumbs_up} &nbsp; 👎 {stats.thumbs_down}</div>
            </div>
            <div style={s.card}>
              <div style={s.cardLabel}>Thumbs-Up Rate</div>
              <div style={{ ...s.cardValue, color: stats.thumbs_up_rate >= 75 ? '#4ade80' : stats.thumbs_up_rate >= 50 ? '#facc15' : '#f87171' }}>
                {stats.thumbs_up_rate}%
              </div>
              <div style={s.cardSub}>target ≥ 75%</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={s.card}>
              <div style={s.sectionTitle}>Users by Role</div>
              {Object.entries(stats.role_counts || {}).map(([role, count]) => (
                <div key={role} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #2a2a2a' }}>
                  <span style={s.badge(role)}>{role}</span>
                  <span style={{ color: '#ccc', fontWeight: 700 }}>{count}</span>
                </div>
              ))}
              {!Object.keys(stats.role_counts || {}).length && <div style={{ color: '#555' }}>No role data yet</div>}
            </div>
            <div style={s.card}>
              <div style={s.sectionTitle}>Sessions by Stage</div>
              <div style={s.stageBar}>
                {Object.entries(stats.stage_counts || {}).map(([stage, count]) => (
                  <div key={stage} style={s.stagePill(stage)}>{stage}: {count}</div>
                ))}
              </div>
              {!Object.keys(stats.stage_counts || {}).length && <div style={{ color: '#555' }}>No stage data yet</div>}
            </div>
          </div>
        </>
      )}

      {activeTab === 'users' && (
        <div style={s.card}>
          <div style={s.sectionTitle}>All Users ({users.length})</div>
          {users.length === 0 ? (
            <div style={{ color: '#555' }}>No users found or loading...</div>
          ) : (
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Name / Email</th>
                  <th style={s.th}>UID</th>
                  <th style={s.th}>Role</th>
                  <th style={s.th}>Experience</th>
                  <th style={s.th}>Onboarded</th>
                  <th style={s.th}>Change Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.uid}>
                    <td style={s.td}>
                      <div style={{ fontWeight: 600 }}>{u.name || '—'}</div>
                      <div style={{ color: '#666', fontSize: '0.75rem' }}>{u.email || '—'}</div>
                    </td>
                    <td style={{ ...s.td, color: '#555', fontSize: '0.7rem', fontFamily: 'monospace' }}>{u.uid?.slice(0, 12)}…</td>
                    <td style={s.td}><span style={s.badge(u.role || 'user')}>{u.role || 'user'}</span></td>
                    <td style={{ ...s.td, color: '#888' }}>{u.experience_level || '—'}</td>
                    <td style={{ ...s.td, color: u.onboarding_complete ? '#4ade80' : '#f87171' }}>
                      {u.onboarding_complete ? 'Yes' : 'No'}
                    </td>
                    <td style={s.td}>
                      <select
                        style={s.select}
                        value={u.role || 'user'}
                        disabled={roleUpdating === u.uid}
                        onChange={e => updateRole(u.uid, e.target.value)}
                      >
                        <option value="user">user</option>
                        <option value="counselor">counselor</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
