'use client';

import { useState } from 'react';

const STATUS_STYLES = {
    completed: { badge: 'bg-green-900/40 text-green-300 border-green-700/40', dot: 'bg-green-500', label: 'Done' },
    current:   { badge: 'bg-blue-900/40 text-blue-300 border-blue-700/40',    dot: 'bg-blue-500',  label: 'Active' },
    upcoming:  { badge: 'bg-gray-800 text-gray-400 border-gray-700',          dot: 'bg-gray-600',  label: 'Upcoming' },
};

export default function ActionPlan({ title, trackName, weeks, onSuggestionClick }) {
    // Auto-expand the current week
    const initialExpanded = {};
    (weeks || []).forEach((w, i) => {
        if (w.status === 'current') initialExpanded[i] = true;
    });
    const [expanded, setExpanded] = useState(initialExpanded);
    const [checked, setChecked] = useState({});

    const validWeeks = (weeks || []).filter(w => w && w.label && Array.isArray(w.tasks));

    const totalTasks = validWeeks.reduce((sum, w) => sum + w.tasks.length, 0);
    const completedTasks = validWeeks.reduce(
        (sum, w, wi) => sum + w.tasks.filter((t, ti) => checked[`${wi}-${ti}`] ?? t.completed).length,
        0,
    );
    const pct = totalTasks > 0 ? Math.round(completedTasks / totalTasks * 100) : 0;

    const toggleWeek = (i) => setExpanded(prev => ({ ...prev, [i]: !prev[i] }));
    const toggleTask = (wi, ti) => {
        const key = `${wi}-${ti}`;
        setChecked(prev => ({ ...prev, [key]: !(prev[key] ?? validWeeks[wi].tasks[ti].completed) }));
    };

    return (
        <div className="mt-3 bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden shadow-xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-gray-700 px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-1">Action Plan</p>
                        <h3 className="text-lg font-bold text-white">{title || 'Your Action Plan'}</h3>
                        {trackName && <p className="text-sm text-gray-400 mt-0.5">{trackName}</p>}
                    </div>
                    <div className="text-right shrink-0">
                        <p className="text-2xl font-bold text-white">{pct}<span className="text-sm text-gray-400">%</span></p>
                        <p className="text-[11px] text-gray-500 uppercase tracking-wider">Complete</p>
                    </div>
                </div>
                {/* Progress bar */}
                <div className="mt-3 w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                    />
                </div>
            </div>

            {/* Weeks */}
            <div className="divide-y divide-gray-800">
                {validWeeks.map((week, wi) => {
                    const status = STATUS_STYLES[week.status] || STATUS_STYLES.upcoming;
                    const isOpen = !!expanded[wi];
                    return (
                        <div key={wi}>
                            <button
                                onClick={() => toggleWeek(wi)}
                                className="w-full flex items-center justify-between gap-3 p-4 hover:bg-gray-800/50 transition-colors text-left"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${status.dot}`} />
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-white truncate">{week.label}</p>
                                        <p className="text-xs text-gray-500">{week.tasks.length} task{week.tasks.length !== 1 ? 's' : ''}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${status.badge}`}>
                                        {status.label}
                                    </span>
                                    <span className={`text-gray-500 transition-transform ${isOpen ? 'rotate-90' : ''}`}>›</span>
                                </div>
                            </button>
                            {isOpen && (
                                <div className="px-4 pb-4 pl-9 space-y-2">
                                    {week.tasks.map((task, ti) => {
                                        const key = `${wi}-${ti}`;
                                        const done = checked[key] ?? task.completed;
                                        return (
                                            <label
                                                key={ti}
                                                className="flex items-start gap-2.5 cursor-pointer group"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={done}
                                                    onChange={() => toggleTask(wi, ti)}
                                                    className="mt-0.5 w-4 h-4 rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500 focus:ring-offset-gray-900 shrink-0"
                                                />
                                                <span className={`text-sm leading-snug ${done ? 'text-gray-500 line-through' : 'text-gray-300 group-hover:text-white'}`}>
                                                    {task.text}
                                                    {task.resourceUrl && (
                                                        <a
                                                            href={task.resourceUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="ml-2 text-purple-400 hover:text-purple-300 text-xs"
                                                        >
                                                            ↗
                                                        </a>
                                                    )}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Actions */}
            <div className="border-t border-gray-700 bg-gray-900/50 px-4 py-3 flex flex-wrap gap-2">
                <button
                    onClick={() => onSuggestionClick?.('Add this plan to my roadmap')}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                >
                    ＋ Add to my roadmap
                </button>
                <button
                    onClick={() => onSuggestionClick?.('Export my action plan as a PDF')}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors"
                >
                    📄 Export as PDF
                </button>
            </div>
        </div>
    );
}
