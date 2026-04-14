'use client';

function formatSalary(min, max, currency = 'INR') {
    const fmt = (n) => {
        if (typeof n !== 'number') return '—';
        if (currency === 'INR') {
            if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
            if (n >= 100000)   return `₹${(n / 100000).toFixed(1)}L`;
            return `₹${n.toLocaleString('en-IN')}`;
        }
        if (currency === 'USD') {
            if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
            return `$${n.toLocaleString('en-US')}`;
        }
        return `${n}`;
    };
    return `${fmt(min)} – ${fmt(max)}`;
}

function fitColor(score) {
    if (score >= 8) return 'from-green-500 to-emerald-600';
    if (score >= 6) return 'from-yellow-500 to-amber-600';
    return 'from-gray-500 to-gray-600';
}

export default function CareerCard({
    careerName,
    fitScore,
    salaryRange,
    growthRate,
    entryTime,
    rationale,
    topSkillGaps,
    onSuggestionClick,
}) {
    const gaps = Array.isArray(topSkillGaps) ? topSkillGaps : [];
    const score = typeof fitScore === 'number' ? Math.min(10, Math.max(0, fitScore)) : null;

    return (
        <div className="mt-3 bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl overflow-hidden shadow-xl">
            {/* Header */}
            <div className="p-5 pb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">Career Match</p>
                    <h3 className="text-xl font-bold text-white leading-tight">{careerName}</h3>
                </div>
                {score !== null && (
                    <div className={`shrink-0 bg-gradient-to-br ${fitColor(score)} text-white font-bold px-3 py-1.5 rounded-full text-sm shadow-lg flex items-center gap-1.5`}>
                        <span className="text-base leading-none">★</span>
                        <span>{score}/10 fit</span>
                    </div>
                )}
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-3 gap-0.5 bg-gray-700/30 mx-5 rounded-lg overflow-hidden">
                <Metric label="Salary" value={salaryRange ? formatSalary(salaryRange.min, salaryRange.max, salaryRange.currency) : '—'} />
                <Metric label="Growth" value={growthRate || '—'} tint="green" />
                <Metric label="Entry Time" value={entryTime || '—'} />
            </div>

            {/* Rationale */}
            {rationale && (
                <div className="px-5 pt-4 pb-3">
                    <p className="text-sm text-gray-300 leading-relaxed">{rationale}</p>
                </div>
            )}

            {/* Skill gaps */}
            {gaps.length > 0 && (
                <div className="px-5 pb-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Top Skill Gaps</p>
                    <div className="flex flex-wrap gap-1.5">
                        {gaps.slice(0, 5).map((gap, i) => (
                            <span
                                key={i}
                                className="text-xs bg-red-900/30 text-red-300 border border-red-700/40 px-2.5 py-1 rounded-full font-medium"
                            >
                                {gap}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="border-t border-gray-700 bg-gray-900/50 px-5 py-3 flex flex-wrap gap-2">
                <ActionBtn onClick={() => onSuggestionClick?.(`Compare ${careerName} with other careers`)}>Compare</ActionBtn>
                <ActionBtn onClick={() => onSuggestionClick?.(`Show me the skill gaps for ${careerName} in detail`)}>Show skill gaps</ActionBtn>
                <ActionBtn onClick={() => onSuggestionClick?.(`Create a 90-day learning roadmap for ${careerName}`)} primary>Start roadmap →</ActionBtn>
            </div>
        </div>
    );
}

function Metric({ label, value, tint }) {
    const valueColor = tint === 'green' ? 'text-green-400' : 'text-white';
    return (
        <div className="bg-gray-900 p-3 text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">{label}</p>
            <p className={`text-sm font-bold ${valueColor} leading-tight`}>{value}</p>
        </div>
    );
}

function ActionBtn({ children, onClick, primary }) {
    const base = 'text-xs font-medium px-3 py-1.5 rounded-lg transition-colors';
    const cls = primary
        ? `${base} bg-purple-600 hover:bg-purple-700 text-white`
        : `${base} bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700`;
    return <button onClick={onClick} className={cls}>{children}</button>;
}
