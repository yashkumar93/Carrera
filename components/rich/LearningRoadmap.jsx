'use client';

import { useState } from 'react';

const ITEM_TYPE_ICONS = {
    course:        '📚',
    certification: '🏅',
    project:       '🛠️',
    skill:         '⚡',
    milestone:     '🎯',
    book:          '📖',
    video:         '🎬',
};

const ITEM_TYPE_COLOR = {
    course:        'text-blue-400',
    certification: 'text-purple-400',
    project:       'text-indigo-400',
    skill:         'text-amber-400',
    milestone:     'text-green-400',
    book:          'text-pink-400',
    video:         'text-red-400',
};

function formatCost(cost) {
    if (cost == null) return null;
    if (typeof cost === 'string') return cost;
    if (cost === 0) return 'Free';
    return `$${cost}`;
}

/**
 * A structured, ordered learning path. Unlike ActionPlan (week-based timeline),
 * LearningRoadmap is an ordered list of concrete resources (courses, certs,
 * projects) the user should complete in sequence.
 */
export default function LearningRoadmap({
    title,
    trackName,
    targetRole,
    totalWeeks,
    items,
    onSuggestionClick,
}) {
    const validItems = (Array.isArray(items) ? items : []).filter(i => i && i.title);
    const [expandedIdx, setExpandedIdx] = useState(null);

    if (validItems.length === 0) return null;

    return (
        <div className="mt-3 bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden shadow-xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border-b border-gray-700 px-5 py-4">
                <p className="text-[11px] font-semibold text-purple-300 uppercase tracking-wider mb-1">📍 Learning Roadmap</p>
                <h3 className="text-lg font-bold text-white">{title || 'Your learning path'}</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-400">
                    {trackName && <span>Track: <span className="text-gray-300">{trackName}</span></span>}
                    {targetRole && <span>Target: <span className="text-gray-300">{targetRole}</span></span>}
                    {totalWeeks && <span>~{totalWeeks} weeks total</span>}
                    <span>{validItems.length} steps</span>
                </div>
            </div>

            {/* Ordered steps */}
            <ol className="divide-y divide-gray-800">
                {validItems.map((item, i) => {
                    const typeKey = (item.type || 'course').toLowerCase();
                    const icon = ITEM_TYPE_ICONS[typeKey] || '📌';
                    const color = ITEM_TYPE_COLOR[typeKey] || 'text-gray-400';
                    const isOpen = expandedIdx === i;
                    const hasExpandableContent = item.description || item.skills?.length > 0;

                    return (
                        <li key={i} className="relative">
                            <button
                                onClick={() => hasExpandableContent && setExpandedIdx(isOpen ? null : i)}
                                className={`w-full flex items-center gap-3 p-4 text-left transition-colors ${hasExpandableContent ? 'hover:bg-gray-800/50 cursor-pointer' : 'cursor-default'}`}
                            >
                                {/* Step number */}
                                <div className="shrink-0 w-7 h-7 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-xs font-bold text-gray-400">
                                    {i + 1}
                                </div>

                                {/* Main */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-sm shrink-0">{icon}</span>
                                        <p className="text-sm font-semibold text-white truncate">{item.title}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-[11px] text-gray-500">
                                        <span className={`font-medium capitalize ${color}`}>{typeKey}</span>
                                        {item.platform && <span>• {item.platform}</span>}
                                        {item.duration && <span>• {item.duration}</span>}
                                        {formatCost(item.cost) && <span>• {formatCost(item.cost)}</span>}
                                    </div>
                                </div>

                                {hasExpandableContent && (
                                    <span className={`text-gray-600 transition-transform shrink-0 ${isOpen ? 'rotate-90' : ''}`}>›</span>
                                )}
                            </button>

                            {/* Expanded details */}
                            {isOpen && (
                                <div className="px-4 pb-4 pl-14 space-y-2">
                                    {item.description && (
                                        <p className="text-xs text-gray-400 leading-relaxed">{item.description}</p>
                                    )}
                                    {Array.isArray(item.skills) && item.skills.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {item.skills.map((s, si) => (
                                                <span key={si} className="text-[10px] bg-gray-800 text-gray-400 border border-gray-700 px-2 py-0.5 rounded-full">{s}</span>
                                            ))}
                                        </div>
                                    )}
                                    {item.url && (
                                        <a
                                            href={item.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="inline-block text-[11px] text-purple-400 hover:text-purple-300"
                                        >
                                            Go to resource ↗
                                        </a>
                                    )}
                                </div>
                            )}
                        </li>
                    );
                })}
            </ol>

            {/* Actions */}
            <div className="border-t border-gray-700 bg-gray-900/50 px-4 py-3 flex flex-wrap gap-2">
                <button
                    onClick={() => onSuggestionClick?.('Add this entire roadmap to my learning tracker')}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                >
                    ＋ Add all to my roadmap
                </button>
                <button
                    onClick={() => onSuggestionClick?.('Generate a weekly schedule for this roadmap')}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors"
                >
                    📅 Weekly schedule
                </button>
            </div>
        </div>
    );
}
