'use client';

const SENTIMENT_STYLES = {
    positive: { badge: 'bg-green-900/40 text-green-300 border-green-700/40', dot: 'bg-green-400', label: 'Positive' },
    negative: { badge: 'bg-red-900/40 text-red-300 border-red-700/40',       dot: 'bg-red-400',   label: 'Negative' },
    mixed:    { badge: 'bg-amber-900/40 text-amber-300 border-amber-700/40', dot: 'bg-amber-400', label: 'Mixed' },
};

/**
 * Community perspective from forum discussions. Always framed as "professionals
 * report that..." — never as fact. Includes sentiment context + source.
 */
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
            {/* Header */}
            <div className="px-5 pt-4 pb-2 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                    <p className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider">Community Insight</p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${style.badge}`}>
                    {style.label}
                </span>
            </div>

            {/* Quote */}
            <div className="px-5 py-3">
                <blockquote className="text-sm text-gray-200 leading-relaxed italic border-l-2 border-amber-600/50 pl-3">
                    "{insight}"
                </blockquote>
            </div>

            {/* Source + type */}
            <div className="px-5 pb-4 flex items-center gap-2 text-[11px] text-gray-500">
                {insightType && (
                    <>
                        <span className="text-amber-400">{insightType}</span>
                        <span>·</span>
                    </>
                )}
                {source && (
                    <span>
                        Based on community discussions in <span className="text-gray-400">{source}</span>
                    </span>
                )}
                {postDate && <span className="ml-auto text-gray-600">{postDate}</span>}
            </div>

            {/* Feedback actions */}
            <div className="border-t border-amber-800/20 bg-gray-900/50 px-4 py-2.5 flex gap-2">
                <button
                    onClick={() => onSuggestionClick?.('Share more community perspectives on this')}
                    className="text-xs font-medium px-3 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors"
                >
                    👍 Helpful
                </button>
                <button
                    onClick={() => onSuggestionClick?.("This isn't what I was looking for — tell me more about the data")}
                    className="text-xs font-medium px-3 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-500 border border-gray-700 transition-colors"
                >
                    Not relevant
                </button>
            </div>
        </div>
    );
}
