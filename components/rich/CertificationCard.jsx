'use client';

const VALUE_TIERS = {
    high:   { label: 'High Value',     tint: 'from-green-500 to-emerald-600', text: 'text-green-300' },
    medium: { label: 'Good Value',     tint: 'from-blue-500 to-indigo-600',   text: 'text-blue-300' },
    low:    { label: 'Niche / Optional', tint: 'from-gray-500 to-gray-600',   text: 'text-gray-300' },
};

function formatCost(cost) {
    if (cost == null) return 'Free';
    if (typeof cost === 'string') return cost;
    if (typeof cost === 'object') {
        const parts = [];
        if (cost.INR != null) parts.push(`₹${cost.INR.toLocaleString('en-IN')}`);
        if (cost.USD != null) parts.push(`$${cost.USD}`);
        return parts.join(' / ') || 'Free';
    }
    return `$${cost}`;
}

/**
 * Certification recommendation — from the curated whitelist only.
 */
export default function CertificationCard({
    name,
    issuer,
    cost,
    timeToComplete,
    valueTier,
    recommended,
    skills,
    url,
    onSuggestionClick,
}) {
    if (!name) return null;
    const tier = VALUE_TIERS[valueTier] || VALUE_TIERS.medium;
    const skillList = Array.isArray(skills) ? skills : [];

    return (
        <div className="mt-3 bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden shadow-xl">
            {/* Header */}
            <div className="p-5 pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            🏅 Certification
                            {recommended && (
                                <span className="text-[10px] bg-purple-900/50 text-purple-300 border border-purple-700/40 px-1.5 py-0.5 rounded-full normal-case font-medium">Recommended</span>
                            )}
                        </p>
                        <h3 className="text-lg font-bold text-white leading-tight">{name}</h3>
                        {issuer && <p className="text-sm text-gray-400 mt-0.5">by {issuer}</p>}
                    </div>
                    <div className={`shrink-0 bg-gradient-to-br ${tier.tint} text-white text-[10px] font-semibold px-2.5 py-1 rounded-full shadow-md whitespace-nowrap`}>
                        {tier.label}
                    </div>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-px bg-gray-700/30 mx-5 rounded-lg overflow-hidden">
                <Metric label="Cost" value={formatCost(cost)} />
                <Metric label="Time" value={timeToComplete || '—'} />
            </div>

            {/* Skills covered */}
            {skillList.length > 0 && (
                <div className="px-5 pt-4">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2">Skills Covered</p>
                    <div className="flex flex-wrap gap-1.5">
                        {skillList.slice(0, 6).map((s, i) => (
                            <span key={i} className="text-xs bg-blue-900/30 text-blue-300 border border-blue-700/30 px-2 py-0.5 rounded-full">{s}</span>
                        ))}
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="mt-4 border-t border-gray-700 bg-gray-900/50 px-4 py-3 flex flex-wrap gap-2">
                {url && (
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors inline-flex items-center gap-1"
                    >
                        View on issuer site ↗
                    </a>
                )}
                <button
                    onClick={() => onSuggestionClick?.(`Add ${name} to my learning roadmap`)}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors"
                >
                    ＋ Add to roadmap
                </button>
                <button
                    onClick={() => onSuggestionClick?.(`Is ${name} worth it for my target career?`)}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 border border-gray-700 transition-colors"
                >
                    Is it worth it?
                </button>
            </div>
        </div>
    );
}

function Metric({ label, value }) {
    return (
        <div className="bg-gray-900 p-3 text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">{label}</p>
            <p className="text-sm font-bold text-white">{value}</p>
        </div>
    );
}
