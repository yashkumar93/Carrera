'use client';

const SENTIMENT_STYLES = {
    positive: { badge: 'bg-green-900/40 text-green-300 border-green-700/40', dot: 'bg-green-400', label: 'Positive' },
    negative: { badge: 'bg-red-900/40 text-red-300 border-red-700/40',       dot: 'bg-red-400',   label: 'Negative' },
    mixed:    { badge: 'bg-amber-900/40 text-amber-300 border-amber-700/40', dot: 'bg-amber-400', label: 'Mixed' },
};

export default function CommunityInsight({
    insight,
    sentiment,
    insightType,
    source,
    postDate,
    onSuggestionClick,
}) {
    if (!insight) return null;

    const style = SENTIMENT_STYLES[sentiment] || SENTIMENT_STYLES.mixed;

    return (
        <div className="mt-3 bg-gradient-to-br from-amber-950/30 via-orange-950/20 to-gray-900 border border-amber-700/30 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-5 pt-4 pb-2 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                    <p className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider">Community Insight</p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${style.badge}`}>
                    {style.label}
                </span>
            </div>

            <div className="px-5 py-3">
                <p className="text-sm text-gray-200 leading-relaxed border-l-2 border-amber-600/50 pl-3">
                    {insight}
                </p>
            </div>

            <div className="px-5 pb-4 flex items-center gap-2 text-[11px] text-gray-500">
                {insightType && (
                    <>
                        <span className="text-amber-400">{insightType}</span>
                        <span>·</span>
                    </>
                )}
                {source && (
                    <span>
                        From community discussions in <span className="text-gray-400">{source}</span>
                    </span>
                )}
                {postDate && <span className="ml-auto text-gray-600">{postDate}</span>}
            </div>

            <div className="border-t border-amber-800/20 bg-gray-900/50 px-4 py-3 flex flex-wrap gap-2">
                <button
                    onClick={() => onSuggestionClick?.('Show me more insights like this')}
                    className="text-xs font-medium px-3 py-2 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 border border-amber-500/30 transition-colors"
                >
                    See more insights
                </button>
                <button
                    onClick={() => onSuggestionClick?.('What should I do based on this?')}
                    className="text-xs font-medium px-3 py-2 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 transition-colors"
                >
                    What should I do next?
                </button>
                <button
                    onClick={() => onSuggestionClick?.('Give me practical steps for this career path')}
                    className="text-xs font-medium px-3 py-2 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 transition-colors"
                >
                    Show next steps
                </button>
            </div>
        </div>
    );
}
