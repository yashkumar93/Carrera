'use client';

import { useMemo } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';

/**
 * Skill gap visualisation: current vs required skill levels.
 * Uses Recharts RadarChart — two overlapping polygons.
 */
export default function SkillRadar({ careerName, skills, onSuggestionClick }) {
    const data = useMemo(() => {
        return (Array.isArray(skills) ? skills : [])
            .filter(s => s && s.name)
            .slice(0, 8)  // Radar charts get unreadable beyond 8 axes
            .map(s => ({
                skill: s.name,
                Current: Math.max(0, Math.min(100, Number(s.current) || 0)),
                Required: Math.max(0, Math.min(100, Number(s.required) || 0)),
            }));
    }, [skills]);

    if (data.length < 3) return null; // Radar needs at least 3 axes to make sense

    // Count significant gaps (required - current > 20)
    const gaps = data.filter(d => d.Required - d.Current > 20).length;

    return (
        <div className="mt-3 bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden shadow-xl">
            {/* Header */}
            <div className="px-5 pt-5 pb-2">
                <p className="text-[11px] font-semibold text-blue-300 uppercase tracking-wider mb-1">⚡ Skill Gap Analysis</p>
                <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-bold text-white">{careerName || 'Your skills'}</h3>
                    {gaps > 0 && (
                        <span className="text-[11px] text-amber-300 bg-amber-900/30 border border-amber-700/40 px-2 py-0.5 rounded-full font-medium">
                            {gaps} gap{gaps !== 1 ? 's' : ''} to close
                        </span>
                    )}
                </div>
            </div>

            {/* Radar */}
            <div className="h-72 w-full px-2">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={data} outerRadius="70%">
                        <PolarGrid stroke="#374151" />
                        <PolarAngleAxis dataKey="skill" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#4b5563', fontSize: 10 }} stroke="#374151" />
                        <Radar
                            name="Required"
                            dataKey="Required"
                            stroke="#10b981"
                            strokeWidth={2}
                            fill="#10b981"
                            fillOpacity={0.08}
                        />
                        <Radar
                            name="Your current"
                            dataKey="Current"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            fill="#3b82f6"
                            fillOpacity={0.35}
                        />
                        <Tooltip
                            contentStyle={{
                                background: '#111827',
                                border: '1px solid #374151',
                                borderRadius: '8px',
                                fontSize: '12px',
                            }}
                            labelStyle={{ color: '#fff', fontWeight: 600 }}
                        />
                        <Legend
                            wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                            iconType="circle"
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            {/* Top gaps list */}
            {gaps > 0 && (
                <div className="px-5 pt-2 pb-4">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2">Priority Skills to Develop</p>
                    <div className="flex flex-wrap gap-1.5">
                        {data
                            .filter(d => d.Required - d.Current > 20)
                            .sort((a, b) => (b.Required - b.Current) - (a.Required - a.Current))
                            .slice(0, 5)
                            .map((d, i) => (
                                <span
                                    key={i}
                                    className="text-xs bg-red-900/30 text-red-300 border border-red-700/40 px-2.5 py-1 rounded-full font-medium"
                                    title={`${d.Current}/100 → ${d.Required}/100`}
                                >
                                    {d.skill} <span className="text-red-500">(+{d.Required - d.Current})</span>
                                </span>
                            ))}
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="border-t border-gray-700 bg-gray-900/50 px-4 py-3 flex flex-wrap gap-2">
                <button
                    onClick={() => onSuggestionClick?.(`Give me a plan to close my top skill gaps for ${careerName || 'this role'}`)}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                    🎯 Close the gaps
                </button>
                <button
                    onClick={() => onSuggestionClick?.('Recommend courses for my weakest skill')}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors"
                >
                    📚 Find courses
                </button>
            </div>
        </div>
    );
}
