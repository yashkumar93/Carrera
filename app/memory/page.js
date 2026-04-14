'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import api from '@/lib/api';

// ---------------------------------------------------------------------------
// Icons for each wiki page
// ---------------------------------------------------------------------------
const PAGE_ICONS = {
    profile:          '👤',
    explorations:     '🧭',
    roadmap:          '🗺️',
    decisions:        '⚖️',
    session_log:      '📝',
    courses_tracking: '🎓',
};

const PAGE_TITLES = {
    profile:          'Profile',
    explorations:     'Career Explorations',
    roadmap:          'Learning Roadmap',
    decisions:        'Key Decisions',
    session_log:      'Session Log',
    courses_tracking: 'Courses & Projects',
};

function formatTime(ts) {
    if (!ts) return '';
    try {
        const d = ts._seconds ? new Date(ts._seconds * 1000) : new Date(ts);
        return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
        return '';
    }
}

// ---------------------------------------------------------------------------
// Page card
// ---------------------------------------------------------------------------
function WikiPageCard({ slug, page, description, active, onClick }) {
    const hasContent = page.version > 0;
    return (
        <button
            onClick={onClick}
            className={`w-full text-left bg-gray-900 border rounded-xl p-3 transition-all ${
                active
                    ? 'border-purple-500 shadow-lg shadow-purple-900/30'
                    : 'border-gray-700 hover:border-gray-600'
            }`}
        >
            <div className="flex items-start gap-2.5">
                <span className="text-2xl shrink-0">{PAGE_ICONS[slug] || '📄'}</span>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className={`font-semibold text-sm ${active ? 'text-white' : 'text-gray-200'}`}>
                            {PAGE_TITLES[slug] || slug}
                        </h3>
                        {hasContent && (
                            <span className="text-[10px] bg-purple-900/40 text-purple-300 px-1.5 py-0.5 rounded-full">v{page.version}</span>
                        )}
                        {!hasContent && (
                            <span className="text-[10px] bg-gray-700 text-gray-500 px-1.5 py-0.5 rounded-full">empty</span>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{description}</p>
                </div>
            </div>
        </button>
    );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function MemoryPage() {
    const router = useRouter();
    const [wiki, setWiki] = useState({});
    const [slugs, setSlugs] = useState([]);
    const [descriptions, setDescriptions] = useState({});
    const [updates, setUpdates] = useState([]);
    const [activeSlug, setActiveSlug] = useState('profile');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [view, setView] = useState('pages'); // 'pages' | 'updates'

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [wikiData, updatesData] = await Promise.all([
                api.getWiki(),
                api.getWikiUpdates(),
            ]);
            setWiki(wikiData.wiki || {});
            setSlugs(wikiData.slugs || []);
            setDescriptions(wikiData.descriptions || {});
            setUpdates(updatesData || []);
        } catch (e) {
            setError('Failed to load memory.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const activePage = wiki[activeSlug];
    const totalVersions = Object.values(wiki).reduce((sum, p) => sum + (p?.version || 0), 0);
    const populatedPages = Object.values(wiki).filter(p => p?.version > 0).length;

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            {/* Top bar */}
            <div className="border-b border-gray-800 bg-gray-900 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/')} className="text-gray-400 hover:text-white text-sm">← Back</button>
                        <div>
                            <h1 className="text-xl font-bold flex items-center gap-2">🧠 My Career Memory</h1>
                            <p className="text-gray-400 text-sm">What Careerra has learned about you across all conversations</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="hidden sm:flex items-center gap-3 text-xs text-gray-400 mr-2">
                            <span><span className="text-purple-400 font-semibold">{populatedPages}</span>/{slugs.length} pages</span>
                            <span><span className="text-purple-400 font-semibold">{totalVersions}</span> revisions</span>
                        </div>
                        <button
                            onClick={() => setView(view === 'pages' ? 'updates' : 'pages')}
                            className="text-sm text-gray-300 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            {view === 'pages' ? '📜 Update log' : '📄 Wiki pages'}
                        </button>
                        <button
                            onClick={load}
                            className="text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-lg transition-colors"
                            title="Refresh"
                        >
                            ↻
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : error ? (
                    <div className="text-center py-16">
                        <p className="text-red-400 mb-3">{error}</p>
                        <button onClick={load} className="text-sm text-purple-400 hover:text-purple-300">Retry</button>
                    </div>
                ) : view === 'pages' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
                        {/* Sidebar — page list */}
                        <aside className="space-y-2.5">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1 pb-1">Wiki pages</div>
                            {slugs.map(slug => (
                                <WikiPageCard
                                    key={slug}
                                    slug={slug}
                                    page={wiki[slug] || { version: 0 }}
                                    description={descriptions[slug] || ''}
                                    active={activeSlug === slug}
                                    onClick={() => setActiveSlug(slug)}
                                />
                            ))}
                        </aside>

                        {/* Content — active page */}
                        <main className="bg-gray-900 border border-gray-700 rounded-xl p-6 min-h-[60vh]">
                            <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-800">
                                <div className="flex items-center gap-2.5">
                                    <span className="text-2xl">{PAGE_ICONS[activeSlug] || '📄'}</span>
                                    <div>
                                        <h2 className="text-lg font-bold text-white">{PAGE_TITLES[activeSlug] || activeSlug}</h2>
                                        <p className="text-xs text-gray-500">{descriptions[activeSlug] || ''}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    {activePage?.version > 0 ? (
                                        <>
                                            <p className="text-xs text-purple-300 font-semibold">v{activePage.version}</p>
                                            <p className="text-[11px] text-gray-500 mt-0.5">Updated {formatTime(activePage.updated_at)}</p>
                                        </>
                                    ) : (
                                        <span className="text-xs text-gray-500 italic">Empty — no updates yet</span>
                                    )}
                                </div>
                            </div>

                            <article className="prose prose-invert prose-sm max-w-none prose-headings:text-white prose-p:text-gray-300 prose-strong:text-white prose-li:text-gray-300 prose-code:text-purple-300 prose-a:text-purple-400">
                                <ReactMarkdown>
                                    {activePage?.content || '_No content yet._'}
                                </ReactMarkdown>
                            </article>
                        </main>
                    </div>
                ) : (
                    /* Updates view */
                    <div className="max-w-3xl mx-auto">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">
                            Update log — what the AI changed in your wiki
                        </div>
                        {updates.length === 0 ? (
                            <div className="text-center py-16 text-gray-500">
                                <p className="text-4xl mb-3">📜</p>
                                <p>No wiki updates yet. Start chatting to build your memory.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {updates.map(u => (
                                    <div key={u.id} className="bg-gray-900 border border-gray-700 rounded-xl p-4">
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <p className="text-gray-200 text-sm flex-1">{u.summary || 'Wiki revised'}</p>
                                            <span className="text-[11px] text-gray-500 shrink-0">{formatTime(u.created_at)}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {(u.pages_updated || []).map(slug => (
                                                <span key={slug} className="text-[11px] bg-purple-900/30 text-purple-300 border border-purple-700/40 px-2 py-0.5 rounded-full">
                                                    {PAGE_ICONS[slug]} {PAGE_TITLES[slug] || slug}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
