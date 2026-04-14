'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

// ---------------------------------------------------------------------------
// Column colours
// ---------------------------------------------------------------------------
const COLUMN_CONFIG = {
    todo:        { label: 'To Do',       color: 'border-gray-600',   badge: 'bg-gray-700 text-gray-300'   },
    in_progress: { label: 'In Progress', color: 'border-blue-500',   badge: 'bg-blue-900 text-blue-300'   },
    completed:   { label: 'Completed',   color: 'border-green-500',  badge: 'bg-green-900 text-green-300' },
};

const CATEGORY_ICONS = {
    course:         '📚',
    project:        '🛠️',
    certification:  '🏅',
    skill:          '⚡',
    milestone:      '🎯',
    general:        '📌',
};

// ---------------------------------------------------------------------------
// roadmap.sh catalog
// ---------------------------------------------------------------------------
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
    { id: 'ai-data-scientist', title: 'AI & Data Scientist',     slug: 'ai-data-scientist', category: 'Role-based',   icon: '🤖',  desc: 'ML, deep learning, statistics and data pipelines.' },
    { id: 'mlops',             title: 'MLOps Engineer',          slug: 'mlops',             category: 'Role-based',   icon: '🔬',  desc: 'Model deployment, monitoring and ML infrastructure.' },
    { id: 'game-developer',    title: 'Game Developer',          slug: 'game-developer',    category: 'Role-based',   icon: '🎮',  desc: 'Game engines, graphics, physics and game design.' },
    { id: 'technical-writer',  title: 'Technical Writer',        slug: 'technical-writer',  category: 'Role-based',   icon: '✍️',  desc: 'Docs, API references, style guides and tooling.' },
    { id: 'data-analyst',      title: 'Data Analyst',            slug: 'data-analyst',      category: 'Role-based',   icon: '📊',  desc: 'SQL, visualization, Excel, Python and analytics.' },
    // Skill-based
    { id: 'react',             title: 'React',                   slug: 'react',             category: 'Skill-based',  icon: '⚛️',  desc: 'Hooks, state management, routing and ecosystem.' },
    { id: 'vue',               title: 'Vue.js',                  slug: 'vue',               category: 'Skill-based',  icon: '💚',  desc: 'Composition API, Vuex/Pinia and Nuxt.js.' },
    { id: 'angular',           title: 'Angular',                 slug: 'angular',           category: 'Skill-based',  icon: '🔴',  desc: 'Modules, services, RxJS and Angular CLI.' },
    { id: 'nodejs',            title: 'Node.js',                 slug: 'nodejs',            category: 'Skill-based',  icon: '🟩',  desc: 'Event loop, streams, Express, and runtime APIs.' },
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
    // Best practices / fundamentals
    { id: 'computer-science',  title: 'Computer Science',        slug: 'computer-science',  category: 'Fundamentals', icon: '🖥️',  desc: 'Algorithms, data structures, networking and OS.' },
    { id: 'data-structures',   title: 'Data Structures',         slug: 'data-structures',   category: 'Fundamentals', icon: '📐',  desc: 'Arrays, trees, graphs, sorting and search.' },
    { id: 'software-design-architecture', title: 'Software Design & Architecture', slug: 'software-design-architecture', category: 'Fundamentals', icon: '🧩', desc: 'SOLID, design patterns and clean architecture.' },
    { id: 'code-review',       title: 'Code Review',             slug: 'code-review',       category: 'Fundamentals', icon: '👀',  desc: 'Best practices, checklist and collaboration tips.' },
    { id: 'api-design',        title: 'API Design',              slug: 'api-design',        category: 'Fundamentals', icon: '🔌',  desc: 'REST, versioning, auth, pagination and docs.' },
];

const ALL_CATEGORIES = ['All', ...Array.from(new Set(ROADMAPSH_CATALOG.map(r => r.category)))];

// ---------------------------------------------------------------------------
// Card component
// ---------------------------------------------------------------------------
function RoadmapCard({ item, onMove, onDelete }) {
    const [menuOpen, setMenuOpen] = useState(false);

    const statuses = Object.keys(COLUMN_CONFIG).filter(s => s !== item.status);

    return (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-3 shadow space-y-2 relative">
            {/* Header row */}
            <div className="flex items-start gap-2">
                <span className="text-lg">{CATEGORY_ICONS[item.category] || '📌'}</span>
                <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium leading-snug">{item.title}</p>
                    {item.week && (
                        <span className="text-xs text-gray-500">Week {item.week}</span>
                    )}
                </div>
                {/* Menu */}
                <div className="relative">
                    <button
                        onClick={() => setMenuOpen(v => !v)}
                        className="text-gray-500 hover:text-gray-300 px-1 text-lg leading-none"
                    >
                        ⋮
                    </button>
                    {menuOpen && (
                        <div className="absolute right-0 top-6 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-10 w-36 py-1" onMouseLeave={() => setMenuOpen(false)}>
                            {statuses.map(s => (
                                <button
                                    key={s}
                                    className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700"
                                    onClick={() => { onMove(item.id, s); setMenuOpen(false); }}
                                >
                                    Move to {COLUMN_CONFIG[s].label}
                                </button>
                            ))}
                            <hr className="border-gray-700 my-1" />
                            <button
                                className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-gray-700"
                                onClick={() => { onDelete(item.id); setMenuOpen(false); }}
                            >
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Description */}
            {item.description && (
                <p className="text-gray-400 text-xs leading-relaxed line-clamp-3">{item.description}</p>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-1">
                {item.category && (
                    <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full capitalize">{item.category}</span>
                )}
                {item.priority && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                        item.priority === 'high' ? 'bg-red-900/40 text-red-400' :
                        item.priority === 'medium' ? 'bg-yellow-900/40 text-yellow-400' :
                        'bg-gray-700 text-gray-400'
                    }`}>{item.priority}</span>
                )}
                {item.estimated_hours && (
                    <span className="text-xs bg-gray-700/50 text-gray-500 px-2 py-0.5 rounded-full">{item.estimated_hours}h</span>
                )}
            </div>

            {/* Resources */}
            {item.resources?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {item.resources.slice(0, 3).map((r, i) => (
                        <span key={i} className="text-xs bg-purple-900/30 text-purple-400 px-2 py-0.5 rounded-full">{r}</span>
                    ))}
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Column component
// ---------------------------------------------------------------------------
function Column({ status, items, onMove, onDelete }) {
    const cfg = COLUMN_CONFIG[status];
    return (
        <div className={`flex-1 min-w-0 bg-gray-900 rounded-xl border ${cfg.color} flex flex-col`}>
            <div className="p-3 border-b border-gray-700 flex items-center gap-2">
                <h3 className="text-white font-semibold text-sm">{cfg.label}</h3>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>{items.length}</span>
            </div>
            <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[60vh]">
                {items.map(item => (
                    <RoadmapCard key={item.id} item={item} onMove={onMove} onDelete={onDelete} />
                ))}
                {items.length === 0 && (
                    <p className="text-gray-600 text-xs text-center mt-6">No items here</p>
                )}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Generate modal
// ---------------------------------------------------------------------------
function GenerateModal({ onGenerate, onClose, loading, error }) {
    const [goal, setGoal] = useState('');
    const [months, setMonths] = useState(6);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-white font-bold text-lg">Generate AI Roadmap</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">&times;</button>
                </div>
                {error && (
                    <div className="bg-red-900/30 border border-red-700/50 rounded-lg px-3 py-2 text-red-400 text-sm">{error}</div>
                )}
                <div>
                    <label className="text-sm text-gray-400 block mb-1">Career Goal</label>
                    <input
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                        placeholder="e.g. Become a Machine Learning Engineer"
                        value={goal}
                        onChange={e => setGoal(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !loading && goal.trim() && onGenerate(goal, months)}
                    />
                </div>
                <div>
                    <label className="text-sm text-gray-400 block mb-1">Timeline: {months} months</label>
                    <input
                        type="range" min={1} max={24} value={months}
                        onChange={e => setMonths(Number(e.target.value))}
                        className="w-full accent-purple-500"
                    />
                    <div className="flex justify-between text-xs text-gray-600 mt-0.5">
                        <span>1 mo</span><span>12 mo</span><span>24 mo</span>
                    </div>
                </div>
                <div className="flex gap-3 pt-2">
                    <button onClick={onClose} className="flex-1 py-2 border border-gray-600 text-gray-300 rounded-lg text-sm hover:border-gray-400">Cancel</button>
                    <button
                        disabled={loading || !goal.trim()}
                        onClick={() => onGenerate(goal, months)}
                        className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors"
                    >
                        {loading ? 'Generating…' : 'Generate'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// roadmap.sh card
// ---------------------------------------------------------------------------
const CATEGORY_BADGE = {
    'Role-based':   'bg-purple-900/40 text-purple-300 border border-purple-700/40',
    'Skill-based':  'bg-blue-900/40   text-blue-300   border border-blue-700/40',
    'Fundamentals': 'bg-amber-900/40  text-amber-300  border border-amber-700/40',
};

function ExploreCard({ roadmap }) {
    return (
        <a
            href={`https://roadmap.sh/${roadmap.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-gray-900 border border-gray-700 hover:border-purple-500 rounded-xl p-4 flex flex-col gap-3 transition-all duration-200 hover:shadow-lg hover:shadow-purple-900/20 cursor-pointer no-underline"
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{roadmap.icon}</span>
                    <div>
                        <h3 className="text-white font-semibold text-sm leading-snug group-hover:text-purple-300 transition-colors">
                            {roadmap.title}
                        </h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_BADGE[roadmap.category] || 'bg-gray-700 text-gray-400'}`}>
                            {roadmap.category}
                        </span>
                    </div>
                </div>
                <span className="text-gray-600 group-hover:text-purple-400 text-lg transition-colors mt-0.5 shrink-0">↗</span>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed">{roadmap.desc}</p>
            <div className="mt-auto pt-1 flex items-center gap-1 text-xs text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Open on roadmap.sh</span>
            </div>
        </a>
    );
}

// ---------------------------------------------------------------------------
// Explore tab
// ---------------------------------------------------------------------------
function ExploreTab() {
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        return ROADMAPSH_CATALOG.filter(r => {
            const matchCat = activeCategory === 'All' || r.category === activeCategory;
            const matchSearch = !q || r.title.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q) || r.category.toLowerCase().includes(q);
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
        <div className="space-y-6">
            {/* Search + filter bar */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
                    <input
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                        placeholder="Search roadmaps…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {ALL_CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                                activeCategory === cat
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Attribution banner */}
            <div className="flex items-center gap-3 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3">
                <span className="text-xl">🗺️</span>
                <div className="flex-1 min-w-0">
                    <p className="text-gray-300 text-sm">Powered by <span className="text-purple-400 font-semibold">roadmap.sh</span> — community-driven developer roadmaps</p>
                    <p className="text-gray-500 text-xs mt-0.5">Click any card to open the full interactive roadmap on roadmap.sh</p>
                </div>
                <a
                    href="https://roadmap.sh"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-xs text-purple-400 hover:text-purple-300 border border-purple-700/40 px-3 py-1.5 rounded-lg transition-colors"
                >
                    Visit site ↗
                </a>
            </div>

            {/* No results */}
            {Object.keys(grouped).length === 0 && (
                <div className="text-center py-16 text-gray-500">
                    <p className="text-4xl mb-3">🔍</p>
                    <p>No roadmaps match your search.</p>
                </div>
            )}

            {/* Grouped grid */}
            {Object.entries(grouped).map(([category, items]) => (
                <div key={category}>
                    <h2 className="text-gray-300 font-semibold text-sm mb-3 flex items-center gap-2">
                        <span>{category}</span>
                        <span className="text-xs text-gray-600 font-normal">{items.length} roadmaps</span>
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {items.map(r => <ExploreCard key={r.id} roadmap={r} />)}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
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
        } catch (e) {
            setError('Failed to load roadmap.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchRoadmap(); }, [fetchRoadmap]);

    const handleMove = async (itemId, newStatus) => {
        setData(prev => {
            const allItems = [...(prev.todo || []), ...(prev.in_progress || []), ...(prev.completed || [])];
            const updated = allItems.map(i => i.id === itemId ? { ...i, status: newStatus } : i);
            return {
                todo:        updated.filter(i => i.status === 'todo'),
                in_progress: updated.filter(i => i.status === 'in_progress'),
                completed:   updated.filter(i => i.status === 'completed'),
                total: updated.length,
                completion_pct: Math.round(updated.filter(i => i.status === 'completed').length / updated.length * 100),
            };
        });
        try {
            await api.updateRoadmapItem(itemId, { status: newStatus });
        } catch {
            fetchRoadmap();
        }
    };

    const handleDelete = async (itemId) => {
        setData(prev => {
            const allItems = [...(prev.todo || []), ...(prev.in_progress || []), ...(prev.completed || [])];
            const updated = allItems.filter(i => i.id !== itemId);
            return {
                todo:        updated.filter(i => i.status === 'todo'),
                in_progress: updated.filter(i => i.status === 'in_progress'),
                completed:   updated.filter(i => i.status === 'completed'),
                total: updated.length,
                completion_pct: updated.length ? Math.round(updated.filter(i => i.status === 'completed').length / updated.length * 100) : 0,
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
                // Pydantic validation errors → show first message
                setError(detail[0]?.msg || 'Validation error.');
            } else {
                setError(typeof detail === 'string' ? detail : (e.message || 'Generation failed.'));
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

    return (
        <div className="min-h-screen bg-gray-950 text-white">

            {/* Top bar */}
            <div className="border-b border-gray-800 bg-gray-900 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/')} className="text-gray-400 hover:text-white text-sm">← Back</button>
                        <div>
                            <h1 className="text-xl font-bold">Learning Roadmap</h1>
                            <p className="text-gray-400 text-sm">Track your career milestones</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {tab === 'my_roadmap' && total > 0 && (
                            <div className="text-right hidden sm:block">
                                <p className="text-xs text-gray-400">{pct}% complete</p>
                                <div className="w-32 bg-gray-700 rounded-full h-1.5 mt-0.5">
                                    <div className="bg-green-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                                </div>
                            </div>
                        )}
                        {tab === 'my_roadmap' && total > 0 && (
                            <button onClick={handleClear} className="text-sm text-gray-400 hover:text-red-400 px-3 py-1.5 border border-gray-700 hover:border-red-700 rounded-lg transition-colors">
                                Clear All
                            </button>
                        )}
                        {tab === 'my_roadmap' && (
                            <button
                                onClick={() => setShowGenerate(true)}
                                className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                            >
                                ✨ Generate Roadmap
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-800 bg-gray-900/50 px-6">
                <div className="max-w-7xl mx-auto flex gap-1">
                    {[
                        { key: 'my_roadmap', label: '🗺️  My Roadmap' },
                        { key: 'explore',    label: '🌐  Explore Roadmaps' },
                    ].map(t => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                                tab === t.key
                                    ? 'border-purple-500 text-white'
                                    : 'border-transparent text-gray-500 hover:text-gray-300'
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6">

                {/* ── My Roadmap tab ── */}
                {tab === 'my_roadmap' && (
                    loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-16">
                            <p className="text-red-400 mb-3">{error}</p>
                            <button onClick={fetchRoadmap} className="text-sm text-purple-400 hover:text-purple-300">Retry</button>
                        </div>
                    ) : total === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center gap-4">
                            <div className="text-5xl">🗺️</div>
                            <h2 className="text-xl font-semibold text-gray-300">No roadmap yet</h2>
                            <p className="text-gray-500 max-w-sm">Generate an AI-powered learning roadmap based on your career goal, or explore community roadmaps on the Explore tab.</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowGenerate(true)}
                                    className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
                                >
                                    ✨ Generate My Roadmap
                                </button>
                                <button
                                    onClick={() => setTab('explore')}
                                    className="border border-gray-600 hover:border-gray-400 text-gray-300 font-semibold px-6 py-2.5 rounded-xl transition-colors"
                                >
                                    🌐 Explore Roadmaps
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-4 items-start">
                            {Object.keys(COLUMN_CONFIG).map(status => (
                                <Column
                                    key={status}
                                    status={status}
                                    items={data?.[status] || []}
                                    onMove={handleMove}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    )
                )}

                {/* ── Explore tab ── */}
                {tab === 'explore' && <ExploreTab />}
            </div>

            {/* Modals */}
            {showGenerate && (
                <GenerateModal
                    loading={generating}
                    error={error}
                    onGenerate={handleGenerate}
                    onClose={() => { setShowGenerate(false); setError(''); }}
                />
            )}
        </div>
    );
}
