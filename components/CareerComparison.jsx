'use client';
import { useState } from 'react';
import api from '@/lib/api';

// Simple horizontal bar (no external chart library needed)
function Bar({ value, max, color = '#a855f7' }) {
    const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
    return (
        <div className="w-full bg-gray-800 rounded-full h-2">
            <div
                className="h-2 rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, backgroundColor: color }}
            />
        </div>
    );
}

function FitBadge({ score }) {
    const color =
        score >= 8 ? 'bg-green-900 text-green-300' :
        score >= 5 ? 'bg-yellow-900 text-yellow-300' :
        'bg-red-900 text-red-300';
    return (
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>
            Fit {score}/10
        </span>
    );
}

function DemandBadge({ label }) {
    const map = {
        'Fast Growing': 'bg-green-900 text-green-300',
        'Growing':      'bg-blue-900 text-blue-300',
        'Stable':       'bg-gray-700 text-gray-300',
        'Declining':    'bg-red-900 text-red-300',
    };
    return (
        <span className={`text-xs px-2 py-0.5 rounded-full ${map[label] || 'bg-gray-700 text-gray-300'}`}>
            {label}
        </span>
    );
}

export default function CareerComparison({ onClose }) {
    const [step, setStep] = useState('input');   // input | loading | results
    const [inputs, setInputs] = useState(['', '']);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const addInput = () => {
        if (inputs.length < 3) setInputs([...inputs, '']);
    };
    const removeInput = (i) => {
        if (inputs.length > 2) setInputs(inputs.filter((_, idx) => idx !== i));
    };
    const updateInput = (i, v) => {
        const next = [...inputs];
        next[i] = v;
        setInputs(next);
    };

    const handleCompare = async () => {
        const careers = inputs.map(s => s.trim()).filter(Boolean);
        if (careers.length < 2) {
            setError('Enter at least 2 career names.');
            return;
        }
        setError('');
        setStep('loading');
        try {
            const data = await api.compareCareers(careers);
            setResult(data);
            setStep('results');
        } catch (e) {
            setError(e.message || 'Comparison failed. Please retry.');
            setStep('input');
        }
    };

    const maxSalary = result
        ? Math.max(...result.careers.map(c => c.median_salary_usd || 0))
        : 0;

    const COLORS = ['#a855f7', '#06b6d4', '#f97316'];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-700 sticky top-0 bg-gray-900 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-white">Career Comparison</h2>
                        <p className="text-sm text-gray-400">Compare 2–3 career paths side-by-side</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
                </div>

                <div className="p-5">

                    {/* ── INPUT STEP ── */}
                    {step === 'input' && (
                        <div className="space-y-4 max-w-md mx-auto">
                            {inputs.map((val, i) => (
                                <div key={i} className="flex gap-2">
                                    <input
                                        className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                                        placeholder={`Career ${i + 1} (e.g. Data Scientist)`}
                                        value={val}
                                        onChange={e => updateInput(i, e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleCompare()}
                                    />
                                    {inputs.length > 2 && (
                                        <button
                                            onClick={() => removeInput(i)}
                                            className="text-gray-500 hover:text-red-400 px-2"
                                        >
                                            &times;
                                        </button>
                                    )}
                                </div>
                            ))}

                            {inputs.length < 3 && (
                                <button
                                    onClick={addInput}
                                    className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
                                >
                                    + Add third career
                                </button>
                            )}

                            {error && <p className="text-red-400 text-sm">{error}</p>}

                            <button
                                onClick={handleCompare}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 rounded-lg transition-colors"
                            >
                                Compare Careers
                            </button>
                        </div>
                    )}

                    {/* ── LOADING ── */}
                    {step === 'loading' && (
                        <div className="flex flex-col items-center gap-4 py-16">
                            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-gray-400">Analysing career paths with AI…</p>
                        </div>
                    )}

                    {/* ── RESULTS ── */}
                    {step === 'results' && result && (
                        <div className="space-y-6">

                            {/* Recommendation banner */}
                            {result.recommendation && (
                                <div className="bg-purple-900/30 border border-purple-700 rounded-xl p-4">
                                    <p className="text-purple-300 font-semibold text-sm mb-1">AI Recommendation</p>
                                    <p className="text-white text-sm leading-relaxed">{result.recommendation.reasoning}</p>
                                    <div className="flex flex-wrap gap-3 mt-3 text-xs">
                                        <span className="text-gray-400">Best fit: <span className="text-green-400 font-medium">{result.recommendation.best_fit}</span></span>
                                        <span className="text-gray-400">Best salary: <span className="text-yellow-400 font-medium">{result.recommendation.best_salary}</span></span>
                                        <span className="text-gray-400">Fastest entry: <span className="text-cyan-400 font-medium">{result.recommendation.fastest_entry}</span></span>
                                    </div>
                                </div>
                            )}

                            {/* Career cards */}
                            <div className={`grid gap-4 ${result.careers.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
                                {result.careers.map((career, i) => (
                                    <div key={i} className="bg-gray-800 rounded-xl p-4 border border-gray-700 space-y-4">

                                        {/* Title row */}
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="text-white font-bold text-base leading-snug">{career.name}</h3>
                                            <FitBadge score={career.fit_score} />
                                        </div>

                                        <p className="text-gray-400 text-xs leading-relaxed">{career.summary}</p>

                                        {/* Salary */}
                                        <div>
                                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                                                <span>Median Salary</span>
                                                <span className="text-white font-semibold">
                                                    ${(career.median_salary_usd || 0).toLocaleString()}/yr
                                                </span>
                                            </div>
                                            <Bar value={career.median_salary_usd} max={maxSalary} color={COLORS[i]} />
                                            {career.salary_range && (
                                                <p className="text-gray-500 text-xs mt-0.5">
                                                    ${career.salary_range.min?.toLocaleString()} – ${career.salary_range.max?.toLocaleString()}
                                                </p>
                                            )}
                                        </div>

                                        {/* Demand */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-400">5-yr Growth</span>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs font-semibold ${career.demand_growth_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {career.demand_growth_pct > 0 ? '+' : ''}{career.demand_growth_pct}%
                                                </span>
                                                <DemandBadge label={career.demand_label} />
                                            </div>
                                        </div>

                                        {/* Education & Time */}
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="bg-gray-900 rounded-lg p-2">
                                                <p className="text-gray-500 mb-0.5">Education</p>
                                                <p className="text-white font-medium">{career.required_education}</p>
                                            </div>
                                            <div className="bg-gray-900 rounded-lg p-2">
                                                <p className="text-gray-500 mb-0.5">Time to Entry</p>
                                                <p className="text-white font-medium">{career.avg_time_to_entry_months} mo</p>
                                            </div>
                                        </div>

                                        {/* Skills */}
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Key Skills</p>
                                            <div className="flex flex-wrap gap-1">
                                                {(career.key_skills || []).map(s => (
                                                    <span key={s} className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">{s}</span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Skills gap */}
                                        {(career.transferable_from_user?.length > 0 || career.skills_to_learn?.length > 0) && (
                                            <div className="space-y-1.5">
                                                {career.transferable_from_user?.length > 0 && (
                                                    <div>
                                                        <p className="text-xs text-green-500 mb-0.5">You already have</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {career.transferable_from_user.map(s => (
                                                                <span key={s} className="text-xs bg-green-900/40 text-green-400 px-2 py-0.5 rounded-full">{s}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {career.skills_to_learn?.length > 0 && (
                                                    <div>
                                                        <p className="text-xs text-amber-500 mb-0.5">To learn</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {career.skills_to_learn.map(s => (
                                                                <span key={s} className="text-xs bg-amber-900/40 text-amber-400 px-2 py-0.5 rounded-full">{s}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Pros / Cons */}
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div>
                                                <p className="text-green-500 mb-1">Pros</p>
                                                <ul className="space-y-0.5">
                                                    {(career.pros || []).map((p, j) => (
                                                        <li key={j} className="text-gray-400 flex gap-1"><span className="text-green-600">+</span>{p}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div>
                                                <p className="text-red-500 mb-1">Cons</p>
                                                <ul className="space-y-0.5">
                                                    {(career.cons || []).map((c, j) => (
                                                        <li key={j} className="text-gray-400 flex gap-1"><span className="text-red-600">-</span>{c}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>

                                        {/* Extra */}
                                        <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-700">
                                            <span>{career.job_openings_estimate}</span>
                                            {career.remote_friendly && <span className="text-cyan-500">Remote-friendly</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {result.data_note && (
                                <p className="text-xs text-gray-600 text-center">{result.data_note}</p>
                            )}

                            {/* Actions */}
                            <div className="flex justify-center gap-3 pt-2">
                                <button
                                    onClick={() => { setStep('input'); setResult(null); }}
                                    className="px-4 py-2 text-sm border border-gray-600 text-gray-300 hover:text-white hover:border-gray-400 rounded-lg transition-colors"
                                >
                                    Compare Again
                                </button>
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
