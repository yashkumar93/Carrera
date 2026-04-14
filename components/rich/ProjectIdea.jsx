'use client';

const DIFFICULTY_STYLES = {
    beginner:     { label: 'Beginner',     tint: 'bg-green-900/40 text-green-300 border-green-700/40',   bars: 1 },
    intermediate: { label: 'Intermediate', tint: 'bg-amber-900/40 text-amber-300 border-amber-700/40',   bars: 2 },
    advanced:     { label: 'Advanced',     tint: 'bg-red-900/40 text-red-300 border-red-700/40',         bars: 3 },
};

export default function ProjectIdea({
    title,
    description,
    difficulty,
    skillsPractised,
    estimatedHours,
    deliverables,
    onSuggestionClick,
}) {
    if (!title) return null;
    const dKey = (difficulty || 'intermediate').toLowerCase();
    const diff = DIFFICULTY_STYLES[dKey] || DIFFICULTY_STYLES.intermediate;
    const skills = Array.isArray(skillsPractised) ? skillsPractised : [];
    const deliverableList = Array.isArray(deliverables) ? deliverables : [];

    return (
        <div className="mt-3 bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden shadow-xl">
            {/* Header */}
            <div className="p-5 pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider mb-1">🛠️ Portfolio Project</p>
                        <h3 className="text-lg font-bold text-white leading-tight">{title}</h3>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {/* Difficulty bars */}
                        <div className="flex gap-0.5">
                            {[0, 1, 2].map(i => (
                                <span
                                    key={i}
                                    className={`w-1 h-3 rounded-full ${i < diff.bars ? 'bg-indigo-400' : 'bg-gray-700'}`}
                                />
                            ))}
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${diff.tint}`}>
                            {diff.label}
                        </span>
                    </div>
                </div>
            </div>

            {/* Description */}
            {description && (
                <div className="px-5 pb-3">
                    <p className="text-sm text-gray-300 leading-relaxed">{description}</p>
                </div>
            )}

            {/* Metrics row */}
            <div className="px-5 pb-3 flex flex-wrap items-center gap-3 text-xs">
                {estimatedHours != null && (
                    <span className="flex items-center gap-1 text-gray-400">
                        <span>⏱️</span>
                        <span>{estimatedHours} hours</span>
                    </span>
                )}
                {skills.length > 0 && (
                    <span className="flex items-center gap-1 text-gray-400">
                        <span>⚡</span>
                        <span>{skills.length} skill{skills.length !== 1 ? 's' : ''} practised</span>
                    </span>
                )}
            </div>

            {/* Skills practised */}
            {skills.length > 0 && (
                <div className="px-5 pb-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1.5">Skills You'll Practise</p>
                    <div className="flex flex-wrap gap-1.5">
                        {skills.slice(0, 6).map((s, i) => (
                            <span key={i} className="text-xs bg-indigo-900/30 text-indigo-300 border border-indigo-700/30 px-2 py-0.5 rounded-full">{s}</span>
                        ))}
                    </div>
                </div>
            )}

            {/* Deliverables */}
            {deliverableList.length > 0 && (
                <div className="px-5 pb-4">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2">What You'll Build</p>
                    <ul className="space-y-1">
                        {deliverableList.map((d, i) => (
                            <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                                <span className="text-indigo-400 mt-0.5">▸</span>
                                <span>{d}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Actions */}
            <div className="border-t border-gray-700 bg-gray-900/50 px-4 py-3 flex flex-wrap gap-2">
                <button
                    onClick={() => onSuggestionClick?.(`Give me a step-by-step guide to build: ${title}`)}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                >
                    🚀 Show me how to start
                </button>
                <button
                    onClick={() => onSuggestionClick?.(`Add ${title} to my roadmap as a project`)}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors"
                >
                    ＋ Add to roadmap
                </button>
                <button
                    onClick={() => onSuggestionClick?.(`Suggest 2 more projects like ${title}`)}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 border border-gray-700 transition-colors"
                >
                    More like this
                </button>
            </div>
        </div>
    );
}
