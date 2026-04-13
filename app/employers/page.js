'use client';

import { useState, useEffect } from 'react';
import { onAuthChange } from '../../lib/firebase';
import apiService from '../../lib/api';

export default function EmployersPage() {
  const [user, setUser] = useState(null);
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const unsub = onAuthChange(async (u) => {
      if (u) {
        setUser(u);
        const data = await apiService.listEmployers();
        setEmployers(data.employers || []);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function searchEmployers() {
    setLoading(true);
    const data = await apiService.listEmployers(search.trim() || null);
    setEmployers(data.employers || []);
    setLoading(false);
  }

  const s = {
    page: { minHeight: '100vh', background: '#0f0f0f', color: '#fff', fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif", padding: '2rem' },
    header: { marginBottom: '2rem' },
    title: { fontSize: '1.8rem', fontWeight: 700, color: '#a855f7', margin: 0 },
    subtitle: { color: '#888', marginTop: '0.3rem', fontSize: '0.9rem' },
    searchRow: { display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' },
    input: { flex: 1, background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', padding: '0.65rem 1rem', color: '#fff', fontSize: '0.88rem', outline: 'none' },
    searchBtn: { background: '#a855f7', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.65rem 1.2rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' },
    card: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '1.3rem', cursor: 'pointer', transition: 'border-color 0.2s' },
    company: { fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.2rem' },
    industry: { color: '#888', fontSize: '0.8rem', marginBottom: '0.75rem' },
    desc: { color: '#aaa', fontSize: '0.83rem', lineHeight: 1.5, marginBottom: '0.75rem' },
    roles: { display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.75rem' },
    rolePill: { background: '#1f2937', border: '1px solid #374151', color: '#93c5fd', borderRadius: '20px', padding: '0.15rem 0.55rem', fontSize: '0.7rem' },
    meta: { display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#555', flexWrap: 'wrap' },
    badge: { display: 'inline-block', background: '#166534', color: '#4ade80', borderRadius: '20px', padding: '0.1rem 0.5rem', fontSize: '0.68rem', fontWeight: 700, marginLeft: '0.4rem' },
    remoteBadge: { display: 'inline-block', background: '#1e3a5f', color: '#60a5fa', borderRadius: '20px', padding: '0.1rem 0.5rem', fontSize: '0.68rem', fontWeight: 700 },
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' },
    modal: { background: '#111', border: '1px solid #2a2a2a', borderRadius: '16px', width: '100%', maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' },
    closeBtn: { background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '1.3rem' },
    sectionTitle: { color: '#888', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem', marginTop: '1rem' },
    roleCard: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '0.75rem', marginBottom: '0.5rem' },
    roleTitle: { fontWeight: 700, color: '#e5e7eb', fontSize: '0.9rem' },
    roleMeta: { color: '#888', fontSize: '0.78rem', marginTop: '0.2rem' },
    emptyState: { color: '#555', padding: '3rem', textAlign: 'center' },
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>Employer Partners</h1>
        <p style={s.subtitle}>Verified companies actively hiring across tech, design, finance, and more</p>
      </div>

      <div style={s.searchRow}>
        <input
          style={s.input}
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && searchEmployers()}
          placeholder="Filter by career path (e.g. Data Scientist, UX Designer)..."
        />
        <button style={s.searchBtn} onClick={searchEmployers}>Search</button>
      </div>

      {loading ? (
        <div style={s.emptyState}>Loading employers...</div>
      ) : employers.length === 0 ? (
        <div style={s.emptyState}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏢</div>
          {search ? `No employers found hiring for "${search}"` : 'No employer partners yet — check back soon!'}
        </div>
      ) : (
        <div style={s.grid}>
          {employers.map(e => (
            <div key={e.id} style={s.card} onClick={() => setSelected(e)}
              onMouseOver={el => el.currentTarget.style.borderColor = '#a855f7'}
              onMouseOut={el => el.currentTarget.style.borderColor = '#2a2a2a'}>
              <div style={s.company}>
                {e.name}
                {e.verified && <span style={s.badge}>✓ Verified</span>}
                {e.remote_friendly && <span style={{ ...s.remoteBadge, marginLeft: '0.4rem' }}>Remote</span>}
              </div>
              <div style={s.industry}>{e.industry} · {e.company_size || 'N/A'} employees</div>
              <div style={s.desc}>{e.description?.slice(0, 120)}{e.description?.length > 120 ? '...' : ''}</div>
              <div style={s.roles}>
                {(e.hiring_for || []).slice(0, 3).map(r => <span key={r} style={s.rolePill}>{r}</span>)}
              </div>
              <div style={s.meta}>
                <span>{(e.open_roles || []).length} open roles</span>
                {(e.locations || []).slice(0, 2).map(l => <span key={l}>{l}</span>)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Employer detail modal */}
      {selected && (
        <div style={s.overlay} onClick={ev => ev.target === ev.currentTarget && setSelected(null)}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.3rem', color: '#e5e7eb' }}>
                  {selected.name}
                  {selected.verified && <span style={s.badge}>✓ Verified</span>}
                </div>
                <div style={{ color: '#888', fontSize: '0.82rem', marginTop: '0.2rem' }}>{selected.industry} · {selected.company_size || 'N/A'} employees</div>
              </div>
              <button style={s.closeBtn} onClick={() => setSelected(null)}>✕</button>
            </div>
            <p style={{ color: '#ccc', fontSize: '0.88rem', lineHeight: 1.6 }}>{selected.description}</p>

            {selected.website && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: '#60a5fa' }}>{selected.website}</div>
            )}

            {(selected.locations || []).length > 0 && (
              <>
                <div style={s.sectionTitle}>Locations</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {selected.locations.map(l => <span key={l} style={{ ...s.rolePill, background: '#1a1a1a', borderColor: '#2a2a2a', color: '#aaa' }}>{l}</span>)}
                </div>
              </>
            )}

            {(selected.hiring_for || []).length > 0 && (
              <>
                <div style={s.sectionTitle}>Hiring For</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {selected.hiring_for.map(r => <span key={r} style={s.rolePill}>{r}</span>)}
                </div>
              </>
            )}

            {(selected.open_roles || []).length > 0 && (
              <>
                <div style={s.sectionTitle}>Open Roles ({selected.open_roles.length})</div>
                {selected.open_roles.map((role, i) => (
                  <div key={i} style={s.roleCard}>
                    <div style={s.roleTitle}>{role.title}</div>
                    <div style={s.roleMeta}>
                      {role.location && <span>{role.location} · </span>}
                      {role.type && <span>{role.type}</span>}
                    </div>
                    {role.url && (
                      <div style={{ marginTop: '0.4rem' }}>
                        <span style={{ color: '#60a5fa', fontSize: '0.78rem' }}>Apply: {role.url}</span>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}

            {selected.remote_friendly && (
              <div style={{ marginTop: '1rem', background: 'rgba(30,58,95,0.4)', border: '1px solid #1e3a5f', borderRadius: '8px', padding: '0.75rem', fontSize: '0.85rem', color: '#93c5fd' }}>
                🌐 This employer is remote-friendly
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
