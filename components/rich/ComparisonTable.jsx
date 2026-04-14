'use client';

import { useMemo } from 'react';

// Infer a rough ordering of metric keys so related rows group together
const METRIC_ORDER = ['salary', 'growth', 'growth_rate', 'entry_time', 'time_to_entry', 'difficulty', 'education', 'skills', 'skill_overlap', 'demand'];

const METRIC_LABELS = {
    salary:          'Salary Range',
    growth:          'Growth',
    growth_rate:     'Growth Rate',
    entry_time:      'Entry Time',
    time_to_entry:   'Time to Entry',
    difficulty:      'Entry Difficulty',
    education:       'Typical Education',
    skills:          'Key Skills',
    skill_overlap:   'Skill Overlap',
    demand:          'Demand',
};

export default function ComparisonTable({ careers, highlightWinner, onSuggestionClick }) {
    const { rows, columns } = useMemo(() => {
        const validCareers = (careers || []).filter(c => c && c.name && c.metrics);
        const allKeys = new Set();
        validCareers.forEach(c => Object.keys(c.metrics || {}).forEach(k => allKeys.add(k)));
        // Order: known metrics first, then any remaining alphabetically
        const known = METRIC_ORDER.filter(k => allKeys.has(k));
        const rest = [...allKeys].filter(k => !METRIC_ORDER.includes(k)).sort();
        return { rows: [...known, ...rest], columns: validCareers };
    }, [careers]);

    if (columns.length < 2) return null;

    const colCount = columns.length;
    const gridCols = colCount === 2
        ? 'grid-cols-[140px_1fr_1fr]'
        : 'grid-cols-[140px_1fr_1fr_1fr]';

    return (
        <div className="mt-3 bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden shadow-xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 border-b border-gray-700 px-4 py-3">
                <p className="text-xs font-semibold text-purple-300 uppercase tracking-wider">Side-by-side Comparison</p>
                <p className="text-sm text-gray-400 mt-0.5">Compare {colCount} careers on key metrics</p>
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
                {/* Column headers */}
                <div className={`grid ${gridCols} gap-0 bg-gray-800 border-b border-gray-700`}>
                    <div className="p-3 text-[11px] uppercase font-semibold text-gray-500 tracking-wider">Metric</div>
                    {columns.map((c, i) => (
                        <div key={i} className="p-3 border-l border-gray-700">
                            <p className="text-sm font-bold text-white">{c.name}</p>
                        </div>
                    ))}
                </div>

                {/* Rows */}
                {rows.map((key, ri) => (
                    <div
                        key={key}
                        className={`grid ${gridCols} gap-0 border-b border-gray-800 last:border-b-0 ${
                            ri % 2 === 0 ? 'bg-gray-900' : 'bg-gray-900/60'
                        }`}
                    >
                        <div className="p-3 text-xs font-semibold text-gray-400">
                            {METRIC_LABELS[key] || prettify(key)}
                        </div>
                        {columns.map((c, i) => (
                            <div key={i} className="p-3 border-l border-gray-800 text-sm text-gray-200">
                                {formatCell(c.metrics?.[key])}
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* Mobile: stacked */}
            <div className="sm:hidden divide-y divide-gray-800">
                {columns.map((c, i) => (
                    <div key={i} className="p-4">
                        <p className="text-sm font-bold text-white mb-3">{c.name}</p>
                        <div className="space-y-2">
                            {rows.map(key => (
                                <div key={key} className="flex justify-between gap-3 text-xs">
                                    <span className="text-gray-500">{METRIC_LABELS[key] || prettify(key)}</span>
                                    <span className="text-gray-200 text-right">{formatCell(c.metrics?.[key])}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Actions */}
            <div className="border-t border-gray-700 bg-gray-900/50 px-4 py-3 flex flex-wrap gap-2">
                {columns.map((c, i) => (
                    <button
                        key={i}
                        onClick={() => onSuggestionClick?.(`I want to pursue ${c.name} — create a detailed roadmap`)}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-purple-600 border border-gray-700 hover:border-purple-600 text-gray-300 hover:text-white transition-colors"
                    >
                        Choose {c.name} →
                    </button>
                ))}
            </div>
        </div>
    );
}

function prettify(key) {
    return key.replace(/_/g, ' ').replace(/\b\w/g, s => s.toUpperCase());
}

function formatCell(v) {
    if (v == null || v === '') return '—';
    if (Array.isArray(v)) return v.join(', ');
    return String(v);
}
