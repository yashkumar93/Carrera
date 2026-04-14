'use client';

import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

const CURRENCY_PREFIX = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };

function formatMoney(v, currency = 'USD') {
    const prefix = CURRENCY_PREFIX[currency] || '';
    if (typeof v !== 'number') return '—';
    if (currency === 'INR') {
        if (v >= 10000000) return `${prefix}${(v / 10000000).toFixed(1)}Cr`;
        if (v >= 100000)   return `${prefix}${(v / 100000).toFixed(1)}L`;
        return `${prefix}${v.toLocaleString('en-IN')}`;
    }
    if (v >= 1000000) return `${prefix}${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000)    return `${prefix}${(v / 1000).toFixed(0)}K`;
    return `${prefix}${v}`;
}

/**
 * Salary distribution by region (percentile bars) + optional experience progression.
 */
export default function SalaryBreakdown({
    careerName,
    data,
    experienceLevels,
    onSuggestionClick,
}) {
    const regions = (Array.isArray(data) ? data : []).filter(r => r && r.region && r.percentiles);
    const [activeRegionIdx, setActiveRegionIdx] = useState(0);

    const active = regions[activeRegionIdx];
    const currency = active?.currency || 'USD';

    // Convert percentiles to Recharts horizontal bar format
    const percentileData = useMemo(() => {
        if (!active) return [];
        const p = active.percentiles;
        return [
            { label: 'Top 10%',    value: p.p90    },
            { label: 'Top 25%',    value: p.p75    },
            { label: 'Median',     value: p.median },
            { label: 'Bottom 25%', value: p.p25    },
            { label: 'Bottom 10%', value: p.p10    },
        ].filter(d => typeof d.value === 'number');
    }, [active]);

    const expData = useMemo(() => {
        if (!Array.isArray(experienceLevels)) return [];
        return experienceLevels
            .filter(l => l && l.level && typeof l.median === 'number')
            .map(l => ({ level: l.level, median: l.median }));
    }, [experienceLevels]);

    if (regions.length === 0 || percentileData.length === 0) return null;

    return (
        <div className="mt-3 bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden shadow-xl">
            {/* Header */}
            <div className="px-5 pt-5 pb-2">
                <p className="text-[11px] font-semibold text-green-300 uppercase tracking-wider mb-1">💰 Salary Breakdown</p>
                <h3 className="text-lg font-bold text-white">{careerName || 'Salary ranges'}</h3>
            </div>

            {/* Region tabs */}
            {regions.length > 1 && (
                <div className="px-5 pb-3 flex gap-1.5 flex-wrap">
                    {regions.map((r, i) => (
                        <button
                            key={i}
                            onClick={() => setActiveRegionIdx(i)}
                            className={`text-xs font-medium px-3 py-1 rounded-lg transition-colors ${
                                i === activeRegionIdx
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'
                            }`}
                        >
                            {r.region}
                        </button>
                    ))}
                </div>
            )}

            {/* Percentile bar chart */}
            <div className="h-56 w-full pl-2 pr-4 pb-2">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={percentileData}
                        layout="vertical"
                        margin={{ top: 4, right: 24, left: 0, bottom: 4 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                        <XAxis
                            type="number"
                            tick={{ fill: '#9ca3af', fontSize: 11 }}
                            tickFormatter={(v) => formatMoney(v, currency)}
                            stroke="#4b5563"
                        />
                        <YAxis
                            type="category"
                            dataKey="label"
                            tick={{ fill: '#9ca3af', fontSize: 11 }}
                            width={90}
                            stroke="#4b5563"
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(16,185,129,0.08)' }}
                            contentStyle={{
                                background: '#111827',
                                border: '1px solid #374151',
                                borderRadius: '8px',
                                fontSize: '12px',
                            }}
                            formatter={(v) => [formatMoney(v, currency), 'Salary']}
                        />
                        <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Median highlight */}
            {active?.percentiles?.median != null && (
                <div className="px-5 py-3 border-t border-gray-800 bg-gray-900/40 flex items-baseline justify-between">
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Median in {active.region}</span>
                    <span className="text-xl font-bold text-green-300">{formatMoney(active.percentiles.median, currency)}</span>
                </div>
            )}

            {/* Experience progression */}
            {expData.length >= 2 && (
                <>
                    <div className="px-5 pt-4 pb-2 border-t border-gray-800">
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Progression by Experience</p>
                    </div>
                    <div className="h-40 w-full pl-2 pr-4 pb-3">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={expData} margin={{ top: 4, right: 24, left: 0, bottom: 4 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="level" tick={{ fill: '#9ca3af', fontSize: 11 }} stroke="#4b5563" />
                                <YAxis
                                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                                    tickFormatter={(v) => formatMoney(v, currency)}
                                    stroke="#4b5563"
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: '#111827',
                                        border: '1px solid #374151',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                    }}
                                    formatter={(v) => [formatMoney(v, currency), 'Median']}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="median"
                                    stroke="#a78bfa"
                                    strokeWidth={2.5}
                                    dot={{ fill: '#a78bfa', r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </>
            )}

            {/* Disclaimer + actions */}
            <div className="border-t border-gray-700 bg-gray-900/50 px-4 py-3">
                <p className="text-[10px] text-gray-500 mb-2">
                    ⚠️ Market estimates — vary by location, experience, and employer.
                </p>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => onSuggestionClick?.(`How do I negotiate a salary in this range for ${careerName}?`)}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors"
                    >
                        💬 Negotiation tips
                    </button>
                    <button
                        onClick={() => onSuggestionClick?.(`What experience level do I need to reach the top 25% in ${careerName}?`)}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors"
                    >
                        📈 How to reach top 25%
                    </button>
                </div>
            </div>
        </div>
    );
}
