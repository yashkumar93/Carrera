'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Download,
  MessageCircle,
  MoreHorizontal,
  Map as MapIcon,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import api from '@/lib/api';

/* ---------- Column config ---------- */
const COLUMN_CONFIG = {
  todo:        { label: 'To do',       color: 'var(--peach)',      ink: '#6a3618' },
  in_progress: { label: 'In progress', color: 'var(--crr-accent)', ink: '#fff' },
  completed:   { label: 'Completed',   color: 'var(--sage)',       ink: '#2d4a30' },
};

const CATEGORY_ICONS = {
  course:        '📚',
  project:       '🛠️',
  certification: '🏅',
  skill:         '⚡',
  milestone:     '🎯',
  general:       '📌',
};

const PRIORITY_STYLES = {
  high:   { bg: 'rgba(200,83,44,0.12)', color: 'var(--crr-accent-deep)' },
  medium: { bg: 'rgba(234,217,168,0.55)', color: '#6a5a18' },
  low:    { bg: 'var(--crr-surface-3)', color: 'var(--crr-text-dim)' },
};

/* ---------- roadmap.sh catalog ---------- */
const ROADMAPSH_CATALOG = [
  // Role-based
  { id: 'frontend',          title: 'Frontend Developer',      slug: 'frontend',          category: 'Role-based',   icon: '🖥️',  desc: 'HTML, CSS, JS, frameworks and browser fundamentals.' },
  { id: 'backend',           title: 'Backend Developer',       slug: 'backend',           category: 'Role-based',   icon: '⚙️',  desc: 'APIs, databases, auth, servers and cloud basics.' },
  { id: 'fullstack',         title: 'Full Stack Developer',    slug: 'full-stack',        category: 'Role-based',   icon: '🔀',  desc: 'Combines frontend and backend disciplines.' },
  { id: 'devops',            title: 'DevOps Engineer',         slug: 'devops',            category: 'Role-based',   icon: '🚀',  desc: 'CI/CD, infrastructure, containers and monitoring.' },
  { id: 'android',           title: 'Android Developer',       slug: 'android',           category: 'Role-based',   icon: '🤖',  desc: 'Kotlin, Jetpack Compose, and Android ecosystem.' },
  { id: 'ios',               title: 'iOS Developer',           slug: 'ios',               category: 'Role-based',   icon: '🍎',  desc: 'Swift, SwiftUI, Xcode and Apple platforms.' },
  { id: 'postgresql-dba',    title: 'PostgreSQL DBA',          slug: 'postgresql-dba',    category: 'Role-based',   icon: '🐘',  desc: 'Administration, tuning, backups and HA for Postgres.' },
  { id: 'blockchain',        title: 'Blockchain Developer',    slug: 'blockchain',        category: 'Role-based',   icon: '⛓️',  desc: 'Smart contracts, DeFi, Web3 and Solidity.' },
  { id: 'qa',                title: 'QA Engineer',             slug: 'qa',                category: 'Role-based',   icon: '🧪',  desc: 'Testing strategies, automation and quality assurance.' },
  { id: 'software-architect',title: 'Software Architect',      slug: 'software-architect',category: 'Role-based',   icon: '🏛️',  desc: 'System design, patterns and architectural decisions.' },
  { id: 'cyber-security',    title: 'Cyber Security',          slug: 'cyber-security',    category: 'Role-based',   icon: '🔒',  desc: 'Penetration testing, networking and threat modeling.' },
  { id: 'ai-data-scientist', title: 'AI & Data Scientist',     slug: 'ai-data-scientist', category: 'Role-based',   icon: '🧠',  desc: 'ML, deep learning, statistics and data pipelines.' },
  { id: 'mlops',             title: 'MLOps Engineer',          slug: 'mlops',             category: 'Role-based',   icon: '🔬',  desc: 'Model deployment, monitoring and ML infrastructure.' },
  { id: 'game-developer',    title: 'Game Developer',          slug: 'game-developer',    category: 'Role-based',   icon: '🎮',  desc: 'Game engines, graphics, physics and game design.' },
  { id: 'technical-writer',  title: 'Technical Writer',        slug: 'technical-writer',  category: 'Role-based',   icon: '✍️',  desc: 'Docs, API references, style guides and tooling.' },
  { id: 'data-analyst',      title: 'Data Analyst',            slug: 'data-analyst',      category: 'Role-based',   icon: '📊',  desc: 'SQL, visualization, Excel, Python and analytics.' },
  // Skill-based
  { id: 'react',             title: 'React',                   slug: 'react',             category: 'Skill-based',  icon: '⚛️',  desc: 'Hooks, state management, routing and ecosystem.' },
  { id: 'vue',               title: 'Vue.js',                  slug: 'vue',               category: 'Skill-based',  icon: '💚',  desc: 'Composition API, Vuex/Pinia and Nuxt.js.' },
  { id: 'angular',           title: 'Angular',                 slug: 'angular',           category: 'Skill-based',  icon: '🅰️',  desc: 'Modules, services, RxJS and Angular CLI.' },
  { id: 'nodejs',            title: 'Node.js',                 slug: 'nodejs',            category: 'Skill-based',  icon: '🟢',  desc: 'Event loop, streams, Express, and runtime APIs.' },
  { id: 'javascript',        title: 'JavaScript',              slug: 'javascript',        category: 'Skill-based',  icon: '🟡',  desc: 'Core language, async patterns and browser APIs.' },
  { id: 'typescript',        title: 'TypeScript',              slug: 'typescript',        category: 'Skill-based',  icon: '🔵',  desc: 'Type system, generics, decorators and tooling.' },
  { id: 'python',            title: 'Python',                  slug: 'python',            category: 'Skill-based',  icon: '🐍',  desc: 'Syntax, OOP, packaging, testing and ecosystem.' },
  { id: 'java',              title: 'Java',                    slug: 'java',              category: 'Skill-based',  icon: '☕',  desc: 'JVM, OOP, collections, streams and frameworks.' },
  { id: 'spring-boot',       title: 'Spring Boot',             slug: 'spring-boot',       category: 'Skill-based',  icon: '🌱',  desc: 'REST APIs, security, data access and cloud-native.' },
  { id: 'go',                title: 'Go (Golang)',             slug: 'golang',            category: 'Skill-based',  icon: '🐹',  desc: 'Goroutines, channels, standard library and modules.' },
  { id: 'rust',              title: 'Rust',                    slug: 'rust',              category: 'Skill-based',  icon: '🦀',  desc: 'Ownership, lifetimes, async and systems programming.' },
  { id: 'cpp',               title: 'C++',                     slug: 'cpp',               category: 'Skill-based',  icon: '⚡',  desc: 'Memory management, STL, templates and modern C++.' },
  { id: 'docker',            title: 'Docker',                  slug: 'docker',            category: 'Skill-based',  icon: '🐳',  desc: 'Images, containers, Compose and best practices.' },
  { id: 'kubernetes',        title: 'Kubernetes',              slug: 'kubernetes',        category: 'Skill-based',  icon: '☸️',  desc: 'Pods, deployments, services and cluster operations.' },
  { id: 'graphql',           title: 'GraphQL',                 slug: 'graphql',           category: 'Skill-based',  icon: '🔷',  desc: 'Schema, resolvers, queries, mutations and tooling.' },
  { id: 'mongodb',           title: 'MongoDB',                 slug: 'mongodb',           category: 'Skill-based',  icon: '🍃',  desc: 'Documents, aggregation, indexing and Atlas.' },
  { id: 'sql',               title: 'SQL',                     slug: 'sql',               category: 'Skill-based',  icon: '🗄️',  desc: 'Queries, joins, window functions and optimization.' },
  { id: 'linux',             title: 'Linux',                   slug: 'linux',             category: 'Skill-based',  icon: '🐧',  desc: 'Shell, processes, file system and administration.' },
  { id: 'git-github',        title: 'Git & GitHub',            slug: 'git-github',        category: 'Skill-based',  icon: '🐙',  desc: 'Version control, branching, CI/CD and collaboration.' },
  { id: 'system-design',     title: 'System Design',           slug: 'system-design',     category: 'Skill-based',  icon: '🏗️',  desc: 'Scalability, databases, caching and architecture.' },
  { id: 'design-system',     title: 'Design System',           slug: 'design-system',     category: 'Skill-based',  icon: '🎨',  desc: 'Component libraries, tokens and accessibility.' },
  // Fundamentals
  { id: 'computer-science',  title: 'Computer Science',        slug: 'computer-science',  category: 'Fundamentals', icon: '🖥️',  desc: 'Algorithms, data structures, networking and OS.' },
  { id: 'data-structures',   title: 'Data Structures',         slug: 'data-structures',   category: 'Fundamentals', icon: '📐',  desc: 'Arrays, trees, graphs, sorting and search.' },
  { id: 'software-design-architecture', title: 'Software Design & Architecture', slug: 'software-design-architecture', category: 'Fundamentals', icon: '🧩', desc: 'SOLID, design patterns and clean architecture.' },
  { id: 'code-review',       title: 'Code Review',             slug: 'code-review',       category: 'Fundamentals', icon: '👀',  desc: 'Best practices, checklist and collaboration tips.' },
  { id: 'api-design',        title: 'API Design',              slug: 'api-design',        category: 'Fundamentals', icon: '🔌',  desc: 'REST, versioning, auth, pagination and docs.' },
];

const ALL_CATEGORIES = ['All', ...Array.from(new Set(ROADMAPSH_CATALOG.map((r) => r.category)))];

/* ---------- Logo ---------- */
function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: 'var(--sage)',
          color: '#2d4a30',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <MapIcon size={16} />
      </div>
    </div>
  );
}

/* ---------- Card ---------- */
function RoadmapCard({ item, onMove, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const statuses = Object.keys(COLUMN_CONFIG).filter((s) => s !== item.status);
  const priorityStyle = item.priority ? PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.low : null;

  return (
    <div
      className="crr-card lift"
      style={{
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{ fontSize: 20, lineHeight: 1 }}>{CATEGORY_ICONS[item.category] || '📌'}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              color: 'var(--crr-text)',
              fontSize: 13.5,
              fontWeight: 500,
              lineHeight: 1.4,
              margin: 0,
            }}
          >
            {item.title}
          </p>
          {item.week && (
            <span className="eyebrow" style={{ fontSize: 10, color: 'var(--crr-text-faint)' }}>
              Week {item.week}
            </span>
          )}
        </div>
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Card options"
            style={{
              color: 'var(--crr-text-faint)',
              padding: 4,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              borderRadius: 6,
              display: 'inline-flex',
            }}
          >
            <MoreHorizontal size={16} />
          </button>
          {menuOpen && (
            <div
              onMouseLeave={() => setMenuOpen(false)}
              style={{
                position: 'absolute',
                right: 0,
                top: 28,
                background: 'var(--crr-surface-2)',
                border: '1px solid var(--crr-line)',
                borderRadius: 10,
                boxShadow: 'var(--crr-shadow)',
                zIndex: 10,
                width: 170,
                padding: 4,
              }}
            >
              {statuses.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    onMove(item.id, s);
                    setMenuOpen(false);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '6px 10px',
                    fontSize: 12,
                    color: 'var(--crr-text-dim)',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--crr-surface-3)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  Move to {COLUMN_CONFIG[s].label}
                </button>
              ))}
              <div style={{ height: 1, background: 'var(--crr-line)', margin: '4px 0' }} />
              <button
                type="button"
                onClick={() => {
                  onDelete(item.id);
                  setMenuOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  width: '100%',
                  textAlign: 'left',
                  padding: '6px 10px',
                  fontSize: 12,
                  color: 'var(--crr-accent-deep)',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(200,83,44,0.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <Trash2 size={12} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {item.description && (
        <p
          style={{
            color: 'var(--crr-text-dim)',
            fontSize: 12.5,
            lineHeight: 1.5,
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {item.description}
        </p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {item.category && (
          <span
            style={{
              fontSize: 11,
              padding: '3px 8px',
              borderRadius: 999,
              background: 'var(--crr-surface-3)',
              color: 'var(--crr-text-dim)',
              textTransform: 'capitalize',
            }}
          >
            {item.category}
          </span>
        )}
        {item.priority && (
          <span
            style={{
              fontSize: 11,
              padding: '3px 8px',
              borderRadius: 999,
              background: priorityStyle.bg,
              color: priorityStyle.color,
              fontWeight: 500,
              textTransform: 'capitalize',
            }}
          >
            {item.priority}
          </span>
        )}
        {item.estimated_hours && (
          <span
            className="tnum"
            style={{
              fontSize: 11,
              padding: '3px 8px',
              borderRadius: 999,
              background: 'var(--crr-surface-3)',
              color: 'var(--crr-text-faint)',
            }}
          >
            {item.estimated_hours}h
          </span>
        )}
      </div>

      {item.resources?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {item.resources.slice(0, 3).map((r, i) => (
            <span
              key={i}
              style={{
                fontSize: 11,
                padding: '3px 8px',
                borderRadius: 999,
                background: 'rgba(169,198,216,0.3)',
                color: '#1d3d52',
                border: '1px solid rgba(169,198,216,0.5)',
              }}
            >
              {r}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Column ---------- */
function Column({ status, items, onMove, onDelete }) {
  const cfg = COLUMN_CONFIG[status];
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        background: 'var(--crr-surface-3)',
        border: '1px solid var(--crr-line)',
        borderRadius: 20,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '14px 18px',
          borderBottom: '1px solid var(--crr-line)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'var(--crr-surface-2)',
        }}
      >
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: cfg.color }} />
        <h3 style={{ color: 'var(--crr-text)', fontSize: 14, fontWeight: 500, margin: 0 }}>{cfg.label}</h3>
        <span
          className="tnum"
          style={{
            marginLeft: 'auto',
            fontSize: 11,
            fontWeight: 500,
            padding: '2px 8px',
            borderRadius: 999,
            background: 'var(--crr-surface-3)',
            color: 'var(--crr-text-dim)',
          }}
        >
          {items.length}
        </span>
      </div>
      <div
        style={{
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          flex: 1,
          overflowY: 'auto',
          maxHeight: '60vh',
        }}
      >
        {items.map((item) => (
          <RoadmapCard key={item.id} item={item} onMove={onMove} onDelete={onDelete} />
        ))}
        {items.length === 0 && (
          <p style={{ color: 'var(--crr-text-faint)', fontSize: 12, textAlign: 'center', marginTop: 24 }}>
            Nothing here yet
          </p>
        )}
      </div>
    </div>
  );
}

/* ---------- Generate modal ---------- */
function GenerateModal({ onGenerate, onClose, loading, error }) {
  const [goal, setGoal] = useState('');
  const [months, setMonths] = useState(6);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(28,26,23,0.4)',
        backdropFilter: 'blur(8px)',
        padding: 16,
      }}
    >
      <div
        className="crr-card"
        style={{
          width: '100%',
          maxWidth: 460,
          padding: 28,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          boxShadow: 'var(--crr-shadow-lg)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 4 }}>
              AI roadmap
            </div>
            <h3
              className="display"
              style={{ color: 'var(--crr-text)', fontWeight: 500, fontSize: 22, letterSpacing: '-0.02em', margin: 0 }}
            >
              Design your path
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              color: 'var(--crr-text-faint)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 8,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              background: 'rgba(200,83,44,0.08)',
              border: '1px solid rgba(200,83,44,0.25)',
              borderRadius: 12,
              color: 'var(--crr-accent-deep)',
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        <div>
          <label style={{ fontSize: 13, color: 'var(--crr-text-dim)', display: 'block', marginBottom: 6 }}>
            Career goal
          </label>
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !loading && goal.trim() && onGenerate(goal, months)}
            placeholder="e.g. Become a Machine Learning Engineer"
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 12,
              border: '1px solid var(--crr-line)',
              background: 'var(--crr-surface-2)',
              color: 'var(--crr-text)',
              fontSize: 14,
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <label style={{ fontSize: 13, color: 'var(--crr-text-dim)' }}>Timeline</label>
            <span className="tnum" style={{ fontSize: 13, color: 'var(--crr-accent)', fontWeight: 500 }}>
              {months} {months === 1 ? 'month' : 'months'}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={24}
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--crr-accent)' }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 11,
              color: 'var(--crr-text-faint)',
              marginTop: 4,
            }}
          >
            <span>1 mo</span>
            <span>12 mo</span>
            <span>24 mo</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
          <button
            type="button"
            onClick={onClose}
            className="crr-btn"
            style={{
              flex: 1,
              justifyContent: 'center',
              padding: 12,
              border: '1px solid var(--crr-line-strong)',
              background: 'var(--crr-surface-2)',
              color: 'var(--crr-text)',
              fontSize: 14,
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading || !goal.trim()}
            onClick={() => onGenerate(goal, months)}
            className="crr-btn crr-btn-primary"
            style={{
              flex: 1,
              justifyContent: 'center',
              padding: 12,
              fontSize: 14,
              opacity: loading || !goal.trim() ? 0.6 : 1,
              cursor: loading || !goal.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Generating…' : (<>Generate <ArrowRight size={14} /></>)}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Explore card ---------- */
function ExploreCard({ roadmap }) {
  return (
    <a
      href={`https://roadmap.sh/${roadmap.slug}`}
      target="_blank"
      rel="noopener noreferrer"
      className="crr-card lift"
      style={{
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        textDecoration: 'none',
        color: 'var(--crr-text)',
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <span style={{ fontSize: 24 }}>{roadmap.icon}</span>
          <div style={{ minWidth: 0 }}>
            <h3
              style={{
                color: 'var(--crr-text)',
                fontWeight: 500,
                fontSize: 14.5,
                lineHeight: 1.3,
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              {roadmap.title}
            </h3>
            <span
              className="eyebrow"
              style={{ fontSize: 10, color: 'var(--crr-text-faint)', marginTop: 4, display: 'inline-block' }}
            >
              {roadmap.category}
            </span>
          </div>
        </div>
        <ChevronRight size={16} style={{ color: 'var(--crr-text-faint)', flexShrink: 0, marginTop: 4 }} />
      </div>
      <p style={{ color: 'var(--crr-text-dim)', fontSize: 12.5, lineHeight: 1.5, margin: 0 }}>{roadmap.desc}</p>
      <div
        style={{
          marginTop: 'auto',
          paddingTop: 4,
          fontSize: 11,
          color: 'var(--crr-accent)',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <span>Open on roadmap.sh</span>
      </div>
    </a>
  );
}

/* ---------- Explore tab ---------- */
function ExploreTab() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return ROADMAPSH_CATALOG.filter((r) => {
      const matchCat = activeCategory === 'All' || r.category === activeCategory;
      const matchSearch =
        !q ||
        r.title.toLowerCase().includes(q) ||
        r.desc.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [search, activeCategory]);

  const grouped = useMemo(() => {
    if (activeCategory !== 'All') return { [activeCategory]: filtered };
    return filtered.reduce((acc, r) => {
      if (!acc[r.category]) acc[r.category] = [];
      acc[r.category].push(r);
      return acc;
    }, {});
  }, [filtered, activeCategory]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 280px' }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--crr-text-faint)',
            }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search roadmaps…"
            style={{
              width: '100%',
              padding: '10px 14px 10px 38px',
              borderRadius: 12,
              border: '1px solid var(--crr-line)',
              background: 'var(--crr-surface-2)',
              color: 'var(--crr-text)',
              fontSize: 13.5,
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {ALL_CATEGORIES.map((cat) => {
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className="crr-btn"
                style={{
                  padding: '8px 14px',
                  fontSize: 12.5,
                  background: active ? 'var(--crr-accent)' : 'var(--crr-surface-2)',
                  color: active ? '#fff' : 'var(--crr-text-dim)',
                  border: `1px solid ${active ? 'var(--crr-accent)' : 'var(--crr-line)'}`,
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="crr-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '14px 18px',
        }}
      >
        <span style={{ fontSize: 22 }}>🗺️</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: 'var(--crr-text)', fontSize: 13.5, margin: 0 }}>
            Powered by{' '}
            <span style={{ color: 'var(--crr-accent)', fontWeight: 500 }}>roadmap.sh</span> —
            community-driven developer roadmaps
          </p>
          <p style={{ color: 'var(--crr-text-faint)', fontSize: 11.5, margin: '2px 0 0' }}>
            Click any card to open the full interactive roadmap
          </p>
        </div>
        <a
          href="https://roadmap.sh"
          target="_blank"
          rel="noopener noreferrer"
          className="crr-btn"
          style={{
            padding: '6px 12px',
            fontSize: 12,
            border: '1px solid var(--crr-line-strong)',
            color: 'var(--crr-text)',
            textDecoration: 'none',
          }}
        >
          Visit site ↗
        </a>
      </div>

      {Object.keys(grouped).length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--crr-text-faint)' }}>
          <p style={{ fontSize: 36, margin: '0 0 8px' }}>🔍</p>
          <p style={{ margin: 0 }}>No roadmaps match your search.</p>
        </div>
      )}

      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
            <h2 className="display" style={{ fontSize: 18, fontWeight: 500, letterSpacing: '-0.01em', margin: 0 }}>
              {category}
            </h2>
            <span style={{ fontSize: 12, color: 'var(--crr-text-faint)' }}>{items.length} roadmaps</span>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 12,
            }}
          >
            {items.map((r) => (
              <ExploreCard key={r.id} roadmap={r} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Hero strip ---------- */
function HeroStrip({ total, pct, doneCount, inProgressCount }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1.3fr 1fr 1fr',
        gap: 16,
        marginBottom: 28,
      }}
    >
      <div
        className="crr-card"
        style={{
          padding: 22,
          background: 'var(--ink-900)',
          color: 'var(--cream-50)',
          borderColor: 'transparent',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div className="eyebrow" style={{ color: 'var(--cream-300)', marginBottom: 8 }}>
          Progress
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
          <span
            className="display tnum"
            style={{ fontSize: 44, fontWeight: 500, letterSpacing: '-0.03em' }}
          >
            {pct}%
          </span>
          <span style={{ fontSize: 14, color: 'var(--cream-300)' }}>
            {doneCount} of {total} {total === 1 ? 'item' : 'items'}
          </span>
        </div>
        <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden' }}>
          <div
            style={{
              width: `${pct}%`,
              height: '100%',
              background: 'linear-gradient(90deg, var(--crr-accent), var(--peach))',
              transition: 'width 0.8s cubic-bezier(.2,.7,.2,1)',
            }}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            right: -60,
            bottom: -60,
            width: 180,
            height: 180,
            borderRadius: '50%',
            background: 'radial-gradient(circle, var(--crr-accent) 0%, transparent 70%)',
            opacity: 0.25,
            filter: 'blur(30px)',
          }}
        />
      </div>

      <div className="crr-card" style={{ padding: 22 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>
          In progress
        </div>
        <div className="display" style={{ fontSize: 32, fontWeight: 500, letterSpacing: '-0.02em' }}>
          <span className="tnum">{inProgressCount}</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--crr-text-dim)', marginTop: 2 }}>
          {inProgressCount === 1 ? 'Item being worked on' : 'Items being worked on'}
        </div>
      </div>

      <div className="crr-card" style={{ padding: 22 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>
          Done
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span className="display tnum" style={{ fontSize: 32, fontWeight: 500 }}>
            {doneCount}
          </span>
          <span style={{ fontSize: 13, color: 'var(--crr-text-dim)' }}>completed</span>
        </div>
        <div style={{ display: 'flex', gap: 3, marginTop: 12 }}>
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background:
                  i < Math.min(20, doneCount)
                    ? `rgba(200,83,44,${0.3 + (i / 20) * 0.7})`
                    : 'var(--crr-surface-3)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Page ---------- */
export default function RoadmapPage() {
  const router = useRouter();
  const [tab, setTab] = useState('my_roadmap');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [error, setError] = useState('');

  const fetchRoadmap = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.getRoadmap();
      setData(d);
    } catch {
      setError('Failed to load roadmap.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoadmap();
  }, [fetchRoadmap]);

  const handleMove = async (itemId, newStatus) => {
    setData((prev) => {
      const allItems = [...(prev.todo || []), ...(prev.in_progress || []), ...(prev.completed || [])];
      const updated = allItems.map((i) => (i.id === itemId ? { ...i, status: newStatus } : i));
      return {
        todo:        updated.filter((i) => i.status === 'todo'),
        in_progress: updated.filter((i) => i.status === 'in_progress'),
        completed:   updated.filter((i) => i.status === 'completed'),
        total: updated.length,
        completion_pct: updated.length
          ? Math.round((updated.filter((i) => i.status === 'completed').length / updated.length) * 100)
          : 0,
      };
    });
    try {
      await api.updateRoadmapItem(itemId, { status: newStatus });
    } catch {
      fetchRoadmap();
    }
  };

  const handleDelete = async (itemId) => {
    setData((prev) => {
      const allItems = [...(prev.todo || []), ...(prev.in_progress || []), ...(prev.completed || [])];
      const updated = allItems.filter((i) => i.id !== itemId);
      return {
        todo:        updated.filter((i) => i.status === 'todo'),
        in_progress: updated.filter((i) => i.status === 'in_progress'),
        completed:   updated.filter((i) => i.status === 'completed'),
        total: updated.length,
        completion_pct: updated.length
          ? Math.round((updated.filter((i) => i.status === 'completed').length / updated.length) * 100)
          : 0,
      };
    });
    try {
      await api.deleteRoadmapItem(itemId);
    } catch {
      fetchRoadmap();
    }
  };

  const handleGenerate = async (goal, months) => {
    setGenerating(true);
    setError('');
    try {
      await api.generateRoadmap(goal, months);
      setShowGenerate(false);
      await fetchRoadmap();
    } catch (e) {
      const detail = e.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail[0]?.msg || 'Validation error.');
      } else {
        setError(typeof detail === 'string' ? detail : e.message || 'Generation failed.');
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleClear = async () => {
    if (!confirm('Clear all roadmap items?')) return;
    await api.clearRoadmap();
    fetchRoadmap();
  };

  const total = data?.total || 0;
  const pct = data?.completion_pct || 0;
  const doneCount = data?.completed?.length || 0;
  const inProgressCount = data?.in_progress?.length || 0;

  return (
    <div className="carrera-root" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div
        style={{
          borderBottom: '1px solid var(--crr-line)',
          background: 'var(--crr-surface)',
          position: 'sticky',
          top: 0,
          zIndex: 20,
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
            aria-label="Back"
          >
            ← Back
          </button>
          <Logo />
          <div>
            <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--crr-text)' }}>Your Roadmap</div>
            <div style={{ fontSize: 12, color: 'var(--crr-text-faint)' }}>
              {total > 0 ? `${total} items · ${pct}% complete` : 'Track your career milestones'}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            {tab === 'my_roadmap' && total > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="crr-btn crr-btn-ghost"
                style={{ padding: '8px 12px', fontSize: 13, color: 'var(--crr-text-dim)' }}
              >
                <Trash2 size={14} /> Clear all
              </button>
            )}
            <Link
              href="/"
              className="crr-btn"
              style={{
                padding: '7px 14px',
                fontSize: 13,
                border: '1px solid var(--crr-line-strong)',
                background: 'var(--crr-surface-2)',
                color: 'var(--crr-text)',
                textDecoration: 'none',
              }}
            >
              <MessageCircle size={14} /> Talk to mentor
            </Link>
            {tab === 'my_roadmap' && (
              <button
                type="button"
                onClick={() => setShowGenerate(true)}
                className="crr-btn crr-btn-primary"
                style={{ padding: '8px 16px', fontSize: 13 }}
              >
                <Sparkles size={14} /> Generate
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 36px', display: 'flex', gap: 4 }}>
          {[
            { key: 'my_roadmap', label: 'My roadmap', icon: <MapIcon size={14} /> },
            { key: 'explore', label: 'Explore', icon: <BookOpen size={14} /> },
          ].map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                style={{
                  padding: '10px 16px',
                  fontSize: 13,
                  fontWeight: 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  borderBottom: `2px solid ${active ? 'var(--crr-accent)' : 'transparent'}`,
                  color: active ? 'var(--crr-text)' : 'var(--crr-text-dim)',
                  background: 'transparent',
                  border: 'none',
                  borderBottomWidth: 2,
                  borderBottomStyle: 'solid',
                  borderBottomColor: active ? 'var(--crr-accent)' : 'transparent',
                  marginBottom: -1,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {t.icon} {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '36px' }}>
        {tab === 'my_roadmap' &&
          (loading ? (
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
          ) : error && !data ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <p style={{ color: 'var(--crr-accent-deep)', marginBottom: 12 }}>{error}</p>
              <button
                type="button"
                onClick={fetchRoadmap}
                className="crr-btn crr-btn-primary"
                style={{ padding: '10px 18px', fontSize: 13 }}
              >
                Try again
              </button>
            </div>
          ) : total === 0 ? (
            <div style={{ position: 'relative', overflow: 'hidden' }}>
              <div className="glow-field">
                <div
                  className="crr-glow peach"
                  style={{ width: 420, height: 420, left: '10%', top: '10%', opacity: 0.45 }}
                />
                <div
                  className="crr-glow sage"
                  style={{ width: 340, height: 340, right: '10%', bottom: '10%', animationDelay: '2s' }}
                />
              </div>
              <div
                style={{
                  position: 'relative',
                  textAlign: 'center',
                  padding: '80px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 18,
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 20,
                    background: 'linear-gradient(135deg, var(--crr-accent), var(--peach))',
                    display: 'grid',
                    placeItems: 'center',
                    color: '#fff',
                  }}
                >
                  <MapIcon size={28} />
                </div>
                <h2
                  className="display"
                  style={{ fontSize: 38, fontWeight: 400, letterSpacing: '-0.03em', margin: 0, maxWidth: 540 }}
                >
                  No roadmap yet — let&apos;s{' '}
                  <span className="serif-accent" style={{ color: 'var(--crr-accent)' }}>
                    build one
                  </span>
                  .
                </h2>
                <p style={{ fontSize: 15, color: 'var(--crr-text-dim)', maxWidth: 480, margin: 0, lineHeight: 1.55 }}>
                  Generate an AI-powered learning roadmap based on your career goal, or explore community roadmaps.
                </p>
                <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                  <button
                    type="button"
                    onClick={() => setShowGenerate(true)}
                    className="crr-btn crr-btn-primary"
                    style={{ padding: '12px 20px', fontSize: 14 }}
                  >
                    <Sparkles size={16} /> Generate my roadmap
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('explore')}
                    className="crr-btn"
                    style={{
                      padding: '12px 20px',
                      fontSize: 14,
                      border: '1px solid var(--crr-line-strong)',
                      background: 'var(--crr-surface-2)',
                      color: 'var(--crr-text)',
                    }}
                  >
                    <BookOpen size={16} /> Explore roadmaps
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <HeroStrip total={total} pct={pct} doneCount={doneCount} inProgressCount={inProgressCount} />
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gap: 16,
                  alignItems: 'start',
                }}
              >
                {Object.keys(COLUMN_CONFIG).map((status) => (
                  <Column
                    key={status}
                    status={status}
                    items={data?.[status] || []}
                    onMove={handleMove}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </>
          ))}

        {tab === 'explore' && <ExploreTab />}
      </div>

      {showGenerate && (
        <GenerateModal
          loading={generating}
          error={error}
          onGenerate={handleGenerate}
          onClose={() => {
            setShowGenerate(false);
            setError('');
          }}
        />
      )}
    </div>
  );
}
