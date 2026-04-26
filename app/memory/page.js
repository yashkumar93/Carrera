'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import {
  Brain,
  Compass,
  Download,
  FileText,
  GraduationCap,
  History,
  Map as MapIcon,
  MessageCircle,
  Pin,
  RefreshCw,
  Scale,
  ScrollText,
  Search,
  User as UserIcon,
} from 'lucide-react';
import api from '@/lib/api';

const PAGE_TITLES = {
  profile:          'Profile',
  explorations:     'Career Explorations',
  roadmap:          'Learning Roadmap',
  decisions:        'Key Decisions',
  session_log:      'Session Log',
  courses_tracking: 'Courses & Projects',
};

const PAGE_THEMES = {
  profile:          { icon: <UserIcon size={14} />,       bg: 'var(--peach)',      ink: '#6a3618',         kind: 'identity'   },
  explorations:     { icon: <Compass size={14} />,        bg: 'var(--butter)',     ink: '#6b5520',         kind: 'energy'     },
  roadmap:          { icon: <MapIcon size={14} />,        bg: 'var(--sage)',       ink: '#2d4a30',         kind: 'goal'       },
  decisions:        { icon: <Scale size={14} />,          bg: 'var(--lilac)',      ink: '#3d2d5a',         kind: 'value'      },
  session_log:      { icon: <ScrollText size={14} />,     bg: 'var(--sky)',        ink: '#1d3d52',         kind: 'skill'      },
  courses_tracking: { icon: <GraduationCap size={14} />,  bg: 'var(--cream-300)',  ink: 'var(--ink-900)',  kind: 'constraint' },
};

const FALLBACK_THEME = { icon: <FileText size={14} />, bg: 'var(--cream-300)', ink: 'var(--ink-900)', kind: 'constraint' };

function themeFor(slug) {
  return PAGE_THEMES[slug] || FALLBACK_THEME;
}

function formatTime(ts) {
  if (!ts) return '';
  try {
    const d = ts._seconds ? new Date(ts._seconds * 1000) : new Date(ts);
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function formatRelative(ts) {
  if (!ts) return '—';
  try {
    const d = ts._seconds ? new Date(ts._seconds * 1000) : new Date(ts);
    const diffMs = Date.now() - d.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (days < 1) return 'today';
    if (days < 2) return '1d';
    if (days < 30) return `${days}d`;
    const months = Math.floor(days / 30);
    return `${months}mo`;
  } catch {
    return '—';
  }
}

function deriveSnippet(content) {
  if (!content) return null;
  const cleaned = content
    .replace(/^#+\s.*$/gm, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/[*_`>]/g, '')
    .replace(/\n{2,}/g, '\n')
    .trim();
  if (!cleaned) return null;
  const firstParagraph = cleaned.split('\n').find((line) => line.trim().length > 0) || '';
  return firstParagraph.length > 220 ? `${firstParagraph.slice(0, 217)}…` : firstParagraph;
}

/* ---------- Memory category card ---------- */
function MemoryCard({ slug, page, description, isPinned, onPin, onOpen, delay }) {
  const theme = themeFor(slug);
  const hasContent = (page?.version || 0) > 0;
  const snippet = hasContent ? deriveSnippet(page?.content) : null;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="crr-card lift"
      style={{
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        animation: `crr-riseIn 0.6s cubic-bezier(.2,.7,.2,1) ${delay}s both`,
        textAlign: 'left',
        cursor: 'pointer',
        background: 'var(--crr-surface-2)',
        color: 'var(--crr-text)',
        fontFamily: 'inherit',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: theme.bg,
            color: theme.ink,
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          {theme.icon}
        </div>
        <span className="eyebrow" style={{ fontSize: 10.5 }}>
          {PAGE_TITLES[slug] || slug}
        </span>
        <span
          onClick={(e) => {
            e.stopPropagation();
            onPin();
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              onPin();
            }
          }}
          aria-label={isPinned ? 'Unpin' : 'Pin'}
          title={isPinned ? 'Pinned' : 'Pin'}
          style={{
            marginLeft: 'auto',
            padding: 4,
            display: 'inline-flex',
            color: isPinned ? 'var(--crr-accent)' : 'var(--crr-text-faint)',
            cursor: 'pointer',
            borderRadius: 6,
          }}
        >
          <Pin size={14} fill={isPinned ? 'currentColor' : 'none'} />
        </span>
      </div>

      <div style={{ fontSize: 14.5, color: 'var(--crr-text)', lineHeight: 1.55, minHeight: 22 }}>
        {snippet || (
          <span style={{ color: 'var(--crr-text-faint)', fontStyle: 'italic' }}>
            {description || 'Empty — no notes yet.'}
          </span>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginTop: 4,
          paddingTop: 10,
          borderTop: '1px solid var(--crr-line)',
          fontSize: 11.5,
          color: 'var(--crr-text-faint)',
        }}
      >
        <MessageCircle size={11} />
        <span>{hasContent ? `v${page.version}` : 'empty'}</span>
        <span style={{ marginLeft: 'auto' }}>{hasContent ? formatTime(page.updated_at) : '—'}</span>
      </div>
    </button>
  );
}

/* ---------- Stats strip ---------- */
function StatTile({ label, value, sub }) {
  return (
    <div className="crr-card" style={{ padding: '16px 18px' }}>
      <div className="eyebrow" style={{ fontSize: 10 }}>
        {label}
      </div>
      <div
        className="display tnum"
        style={{
          fontSize: 28,
          fontWeight: 500,
          letterSpacing: '-0.02em',
          marginTop: 4,
          color: 'var(--crr-text)',
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--crr-text-faint)', marginTop: 2 }}>{sub}</div>
    </div>
  );
}

/* ---------- Active page reader ---------- */
function PageReader({ slug, page, description, onClose }) {
  const theme = themeFor(slug);
  const hasContent = (page?.version || 0) > 0;
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(28,26,23,0.4)',
        backdropFilter: 'blur(8px)',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        className="crr-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 760,
          maxHeight: '90vh',
          padding: 0,
          overflow: 'hidden',
          boxShadow: 'var(--crr-shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            borderBottom: '1px solid var(--crr-line)',
            background: 'var(--crr-surface-3)',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: theme.bg,
              color: theme.ink,
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            {theme.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="display" style={{ fontSize: 18, fontWeight: 500, letterSpacing: '-0.01em' }}>
              {PAGE_TITLES[slug] || slug}
            </div>
            <div style={{ fontSize: 12, color: 'var(--crr-text-faint)' }}>
              {description || ''}
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--crr-text-faint)' }}>
            {hasContent ? (
              <>
                <div style={{ color: 'var(--crr-accent)', fontWeight: 500 }}>v{page.version}</div>
                <div>Updated {formatTime(page.updated_at)}</div>
              </>
            ) : (
              <span style={{ fontStyle: 'italic' }}>Empty</span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              padding: 6,
              borderRadius: 8,
              background: 'transparent',
              border: 'none',
              color: 'var(--crr-text-faint)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 18,
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            padding: '24px 28px',
            overflowY: 'auto',
            color: 'var(--crr-text)',
            fontSize: 14.5,
            lineHeight: 1.7,
          }}
        >
          {hasContent ? (
            <article className="crr-prose">
              <ReactMarkdown>{page.content || ''}</ReactMarkdown>
            </article>
          ) : (
            <div style={{ color: 'var(--crr-text-faint)', fontStyle: 'italic' }}>
              No content yet. This category will fill in as you talk to Carrera.
            </div>
          )}
        </div>
      </div>
      <style>{`
        .crr-prose h1, .crr-prose h2, .crr-prose h3 { color: var(--crr-text); letter-spacing: -0.02em; font-weight: 500; }
        .crr-prose p { margin: 0 0 0.85em; }
        .crr-prose ul, .crr-prose ol { margin: 0 0 0.85em 1.2em; }
        .crr-prose li { margin-bottom: 4px; }
        .crr-prose a { color: var(--crr-accent); text-decoration: underline; }
        .crr-prose code { background: var(--crr-surface-3); padding: 2px 6px; border-radius: 6px; font-size: 0.9em; }
        .crr-prose strong { color: var(--crr-text); font-weight: 600; }
      `}</style>
    </div>
  );
}

/* ---------- Updates view ---------- */
function UpdatesPanel({ updates }) {
  if (!updates.length) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--crr-text-faint)' }}>
        <History size={28} style={{ marginBottom: 12, opacity: 0.6 }} />
        <p style={{ margin: 0, fontSize: 14 }}>
          No memory updates yet. Start talking to Carrera and your memory will grow.
        </p>
      </div>
    );
  }
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="eyebrow" style={{ marginBottom: 4 }}>
        Update log — what Carrera changed in your memory
      </div>
      {updates.map((u, i) => (
        <div
          key={u.id || i}
          className="crr-card"
          style={{
            padding: 18,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            animation: `crr-riseIn 0.5s cubic-bezier(.2,.7,.2,1) ${Math.min(i, 6) * 0.04}s both`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--crr-text)', flex: 1, lineHeight: 1.55 }}>
              {u.summary || 'Memory revised'}
            </p>
            <span style={{ fontSize: 11, color: 'var(--crr-text-faint)', flexShrink: 0 }}>
              {formatTime(u.created_at)}
            </span>
          </div>
          {(u.pages_updated || []).length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(u.pages_updated || []).map((slug) => {
                const theme = themeFor(slug);
                return (
                  <span
                    key={slug}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 10px',
                      borderRadius: 999,
                      background: theme.bg,
                      color: theme.ink,
                      fontSize: 11.5,
                      fontWeight: 500,
                    }}
                  >
                    {theme.icon} {PAGE_TITLES[slug] || slug}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ---------- Page ---------- */
export default function MemoryPage() {
  const router = useRouter();
  const [wiki, setWiki] = useState({});
  const [slugs, setSlugs] = useState([]);
  const [descriptions, setDescriptions] = useState({});
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState('memories'); // 'memories' | 'updates'
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [pinned, setPinned] = useState(() => new Set());
  const [activeSlug, setActiveSlug] = useState(null);

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const [wikiData, updatesData] = await Promise.all([api.getWiki(), api.getWikiUpdates()]);
      setWiki(wikiData?.wiki || {});
      setSlugs(wikiData?.slugs || []);
      setDescriptions(wikiData?.descriptions || {});
      setUpdates(updatesData || []);
      setError('');
    } catch {
      setError('Failed to load memory.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Persist pinned set across reloads.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('carrera:memory:pinned');
      if (raw) setPinned(new Set(JSON.parse(raw)));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem('carrera:memory:pinned', JSON.stringify(Array.from(pinned)));
    } catch {
      // ignore
    }
  }, [pinned]);

  const togglePin = (slug) => {
    setPinned((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const totalVersions = useMemo(
    () => Object.values(wiki).reduce((sum, p) => sum + (p?.version || 0), 0),
    [wiki],
  );
  const populated = useMemo(() => Object.values(wiki).filter((p) => (p?.version || 0) > 0).length, [wiki]);
  const lastUpdated = useMemo(() => {
    let latest = null;
    for (const u of updates) {
      const ts = u.created_at?._seconds ? new Date(u.created_at._seconds * 1000) : new Date(u.created_at);
      if (!Number.isNaN(ts.getTime()) && (!latest || ts > latest)) latest = ts;
    }
    return latest;
  }, [updates]);

  const filterPills = useMemo(() => {
    const all = [{ k: 'all', label: 'Everything' }];
    for (const slug of slugs) {
      all.push({ k: slug, label: PAGE_TITLES[slug] || slug });
    }
    return all;
  }, [slugs]);

  const visibleSlugs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return slugs.filter((slug) => {
      if (filter !== 'all' && filter !== slug) return false;
      if (!q) return true;
      const page = wiki[slug];
      const haystack = `${PAGE_TITLES[slug] || slug} ${descriptions[slug] || ''} ${page?.content || ''}`;
      return haystack.toLowerCase().includes(q);
    });
  }, [slugs, filter, query, wiki, descriptions]);

  const pinnedSlugs = visibleSlugs.filter((s) => pinned.has(s));
  const restSlugs = visibleSlugs.filter((s) => !pinned.has(s));

  return (
    <div className="carrera-root" style={{ minHeight: '100vh', position: 'relative' }}>
      <div className="glow-field">
        <div className="crr-glow lilac" style={{ width: 480, height: 480, left: -160, top: -120, opacity: 0.45 }} />
        <div className="crr-glow peach" style={{ width: 360, height: 360, right: -100, top: 80, animationDelay: '3s', opacity: 0.4 }} />
      </div>

      {/* Header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          borderBottom: '1px solid var(--crr-line)',
          background: 'rgba(251,247,241,0.85)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '0 36px',
            height: 64,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <button
            type="button"
            onClick={() => router.push('/')}
            className="crr-btn crr-btn-ghost"
            style={{ padding: '6px 12px', fontSize: 13 }}
          >
            ← Back
          </button>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: 'var(--lilac)',
              color: '#3d2d5a',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Brain size={16} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>Memory</div>
            <div style={{ fontSize: 12, color: 'var(--crr-text-faint)' }}>
              Everything Carrera remembers about you · {populated} populated · {totalVersions} revisions
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => setView(view === 'memories' ? 'updates' : 'memories')}
              className="crr-btn crr-btn-ghost"
              style={{ padding: '8px 12px', fontSize: 13 }}
            >
              <History size={14} /> {view === 'memories' ? 'Update log' : 'Memories'}
            </button>
            <button
              type="button"
              onClick={() => load(true)}
              disabled={refreshing}
              className="crr-btn crr-btn-ghost"
              style={{ padding: '8px 10px', fontSize: 13, opacity: refreshing ? 0.5 : 1 }}
              aria-label="Refresh memory"
              title="Refresh"
            >
              <RefreshCw
                size={14}
                style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }}
              />
            </button>
            <button type="button" className="crr-btn crr-btn-ghost" style={{ padding: '8px 12px', fontSize: 13 }}>
              <Download size={14} /> Export
            </button>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="crr-btn"
              style={{
                padding: '7px 14px',
                fontSize: 13,
                border: '1px solid var(--crr-line-strong)',
                background: 'var(--crr-surface-2)',
                color: 'var(--crr-text)',
              }}
            >
              <MessageCircle size={14} /> Back to chat
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '36px 36px 60px', position: 'relative' }}>
        {/* Hero */}
        <div style={{ marginBottom: 32, maxWidth: 680 }}>
          <div className="eyebrow" style={{ marginBottom: 10, color: 'var(--crr-accent)' }}>
            Your long-term memory
          </div>
          <h1
            className="display"
            style={{
              fontSize: 48,
              fontWeight: 400,
              margin: 0,
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
            }}
          >
            Everything I remember,
            <br />
            <span className="serif-accent" style={{ color: 'var(--crr-accent)' }}>
              kept honest.
            </span>
          </h1>
          <p style={{ fontSize: 16, color: 'var(--crr-text-dim)', marginTop: 14, lineHeight: 1.6 }}>
            These notes shape every suggestion I make. If any of them feel wrong — pin the ones that matter, or open
            a category to read the full revision.
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240 }}>
            <div
              style={{
                width: 36,
                height: 36,
                border: '3px solid var(--crr-line)',
                borderTopColor: 'var(--crr-accent)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ color: 'var(--crr-accent-deep)', marginBottom: 12 }}>{error}</p>
            <button
              type="button"
              onClick={() => load()}
              className="crr-btn crr-btn-primary"
              style={{ padding: '10px 18px', fontSize: 13 }}
            >
              Try again
            </button>
          </div>
        ) : view === 'updates' ? (
          <UpdatesPanel updates={updates} />
        ) : (
          <>
            {/* Stats strip */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 12,
                marginBottom: 28,
              }}
            >
              <StatTile label="Total categories" value={slugs.length} sub={`${populated} populated`} />
              <StatTile label="Pinned" value={pinned.size} sub="always-surface" />
              <StatTile label="Revisions" value={totalVersions} sub="across sessions" />
              <StatTile
                label="Last updated"
                value={lastUpdated ? formatRelative(lastUpdated) : '—'}
                sub={lastUpdated ? `ago · ${formatTime(lastUpdated)}` : 'no updates yet'}
              />
              <StatTile
                label="Recent log"
                value={updates.length}
                sub={updates.length === 1 ? 'entry' : 'entries'}
              />
            </div>

            {/* Controls */}
            <div
              style={{
                display: 'flex',
                gap: 10,
                marginBottom: 24,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  flex: '1 1 280px',
                  maxWidth: 360,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  borderRadius: 12,
                  background: 'var(--crr-surface-2)',
                  border: '1px solid var(--crr-line)',
                }}
              >
                <Search size={16} style={{ color: 'var(--crr-text-faint)' }} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search your memories…"
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: 14,
                    color: 'var(--crr-text)',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {filterPills.map((f) => {
                  const active = filter === f.k;
                  return (
                    <button
                      key={f.k}
                      type="button"
                      onClick={() => setFilter(f.k)}
                      style={{
                        padding: '7px 13px',
                        borderRadius: 999,
                        fontSize: 12.5,
                        fontWeight: 500,
                        background: active ? 'var(--crr-accent)' : 'var(--crr-surface-2)',
                        color: active ? '#fff' : 'var(--crr-text-dim)',
                        border: `1px solid ${active ? 'var(--crr-accent)' : 'var(--crr-line)'}`,
                        transition: 'all 0.15s ease',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {pinnedSlugs.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <div
                  className="eyebrow"
                  style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Pin size={11} fill="currentColor" /> Pinned
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: 12,
                  }}
                >
                  {pinnedSlugs.map((slug, i) => (
                    <MemoryCard
                      key={slug}
                      slug={slug}
                      page={wiki[slug] || { version: 0 }}
                      description={descriptions[slug] || ''}
                      isPinned
                      onPin={() => togglePin(slug)}
                      onOpen={() => setActiveSlug(slug)}
                      delay={i * 0.03}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="eyebrow" style={{ marginBottom: 12 }}>
              All memories
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 12,
              }}
            >
              {restSlugs.map((slug, i) => (
                <MemoryCard
                  key={slug}
                  slug={slug}
                  page={wiki[slug] || { version: 0 }}
                  description={descriptions[slug] || ''}
                  isPinned={false}
                  onPin={() => togglePin(slug)}
                  onOpen={() => setActiveSlug(slug)}
                  delay={i * 0.02}
                />
              ))}
            </div>

            {visibleSlugs.length === 0 && (
              <div
                style={{
                  padding: 60,
                  textAlign: 'center',
                  color: 'var(--crr-text-faint)',
                  fontSize: 14,
                }}
              >
                Nothing matches that filter yet.
              </div>
            )}
          </>
        )}
      </div>

      {activeSlug && (
        <PageReader
          slug={activeSlug}
          page={wiki[activeSlug] || { version: 0 }}
          description={descriptions[activeSlug] || ''}
          onClose={() => setActiveSlug(null)}
        />
      )}
    </div>
  );
}
