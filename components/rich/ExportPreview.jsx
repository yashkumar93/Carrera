'use client';

const SECTION_ICONS = {
    profile:       '👤',
    career_target: '🎯',
    skills:        '⚡',
    roadmap:       '🗺️',
    courses:       '📚',
    projects:      '🛠️',
    decisions:     '⚖️',
    action_plan:   '📅',
};

/**
 * Preview card shown when the user asks to export/share their career plan.
 * Summarises what's included, then offers the export action.
 */
export default function ExportPreview({
    title,
    sections,
    pageCount,
    format,
    onSuggestionClick,
}) {
    const sectionList = Array.isArray(sections) ? sections : [];
    if (sectionList.length === 0) return null;

    return (
        <div className="mt-3 bg-gradient-to-br from-slate-800 via-gray-900 to-gray-900 border border-gray-700 rounded-2xl overflow-hidden shadow-xl">
            {/* Header */}
            <div className="px-5 pt-5 pb-4 flex items-start gap-4">
                {/* Document icon */}
                <div className="shrink-0 w-14 h-16 rounded-md bg-white/95 flex flex-col items-center justify-center shadow-lg relative">
                    <div className="absolute top-0 right-0 w-3 h-3 bg-gray-300 clip-corner" style={{ clipPath: 'polygon(0 0, 100% 100%, 100% 0)' }} />
                    <span className="text-[8px] font-bold text-purple-600 uppercase tracking-widest">{format || 'PDF'}</span>
                    <div className="w-8 h-0.5 bg-gray-300 mt-1" />
                    <div className="w-6 h-0.5 bg-gray-300 mt-0.5" />
                    <div className="w-7 h-0.5 bg-gray-300 mt-0.5" />
                </div>

                {/* Title + meta */}
                <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-purple-300 uppercase tracking-wider mb-1">Ready to export</p>
                    <h3 className="text-base font-bold text-white leading-tight">{title || 'Your career plan'}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                        {pageCount ? `${pageCount} page${pageCount !== 1 ? 's' : ''}` : 'Summary document'}
                        {' · '}
                        {sectionList.length} section{sectionList.length !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            {/* Sections list */}
            <div className="px-5 pb-4">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2">Included in this export</p>
                <ul className="space-y-1.5">
                    {sectionList.map((section, i) => {
                        const key = typeof section === 'string' ? section : section.key;
                        const label = typeof section === 'string' ? section : section.label;
                        const summary = typeof section === 'object' ? section.summary : null;
                        const icon = SECTION_ICONS[key] || '📄';

                        return (
                            <li key={i} className="flex items-start gap-2.5 text-xs">
                                <span className="shrink-0">{icon}</span>
                                <div className="min-w-0 flex-1">
                                    <span className="text-gray-200 font-medium capitalize">{label?.replace(/_/g, ' ') || key}</span>
                                    {summary && <p className="text-gray-500 mt-0.5 line-clamp-2">{summary}</p>}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>

            {/* Actions */}
            <div className="border-t border-gray-700 bg-gray-900/50 px-4 py-3 flex flex-wrap gap-2">
                <button
                    onClick={() => onSuggestionClick?.('Yes — generate the PDF now')}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors inline-flex items-center gap-1.5"
                >
                    📥 Download PDF
                </button>
                <button
                    onClick={() => onSuggestionClick?.('Create a shareable link instead of a PDF')}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors inline-flex items-center gap-1.5"
                >
                    🔗 Share link
                </button>
                <button
                    onClick={() => onSuggestionClick?.('Customize what goes into the export')}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 border border-gray-700 transition-colors"
                >
                    ⚙️ Customize
                </button>
            </div>
        </div>
    );
}
