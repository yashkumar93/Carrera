'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Brain,
  Check,
  Clock,
  DollarSign,
  Download,
  Leaf,
  MessageCircle,
  Plus,
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-react';
import api from '@/lib/api';

function matchColor(m) {
  if (m >= 90) return 'var(--crr-accent)';
  if (m >= 80) return 'var(--crr-accent-soft)';
  return 'var(--crr-text-dim)';
}

function fitToMatch(score) {
  if (typeof score !== 'number') return 0;
  // fit_score is 0–10; map to 0–100.
  return Math.round(Math.max(0, Math.min(100, score * 10)));
}

function deriveMeters(career) {
  const fit = fitToMatch(career.fit_score);
  const growth = Math.max(0, Math.min(100, 50 + (career.demand_growth_pct || 0) * 1.5));
  const remote = career.remote_friendly ? 80 : 35;
  const learning = career.skills_to_learn?.length
    ? Math.min(95, 40 + career.skills_to_learn.length * 12)
    : 50;
  const balance = Math.max(0, Math.min(100, 90 - (career.avg_time_to_entry_months || 6) * 2));
  const autonomy = career.remote_friendly ? 75 : 60;
  return { fit, growth, remote, learning, balance, autonomy };
}

function buildCareerCard(career) {
  const meters = deriveMeters(career);
  const salaryRange = career.salary_range
    ? `$${Math.round(career.salary_range.min / 1000)}–${Math.round(career.salary_range.max / 1000)}k`
    : career.median_salary_usd
      ? `$${Math.round(career.median_salary_usd / 1000)}k median`
      : '—';
  const time = career.avg_time_to_entry_months
    ? `${career.avg_time_to_entry_months} mo`
    : '—';
  const growth =
    typeof career.demand_growth_pct === 'number'
      ? `${career.demand_growth_pct > 0 ? '+' : ''}${career.demand_growth_pct}%`
      : '—';
  return {
    id: career.name,
    title: career.name,
    tagline: career.summary || '',
    match: meters.fit,
    salaryLabel: salaryRange,
    timeToRole: time,
    growthLabel: growth,
    growth: meters.growth,
    pace: career.demand_label || 'Stable',
    remote: career.remote_friendly ? 'Remote-friendly' : 'Office-leaning',
    reskill:
      career.skills_to_learn?.length > 4 ? 'High' : career.skills_to_learn?.length > 1 ? 'Medium' : 'Low',
    learning: meters.learning,
    balance: meters.balance,
    autonomy: meters.autonomy,
    craft: meters.fit,
    day: career.summary || 'Day-to-day not yet provided.',
    risks: (career.cons || []).join(' · ') || 'No specific risks noted.',
    fit: career.transferable_from_user || [],
    toLearn: career.skills_to_learn || [],
    keySkills: career.key_skills || [],
    industries: career.job_openings_estimate ? [career.job_openings_estimate] : [],
    education: career.required_education,
    pros: career.pros || [],
    cons: career.cons || [],
    raw: career,
  };
}

function CompareMeter({ label, value, color = 'var(--crr-accent)' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span className="eyebrow" style={{ fontSize: 10 }}>
          {label}
        </span>
        <span className="tnum" style={{ fontSize: 11, color: 'var(--crr-text-faint)', marginLeft: 'auto' }}>
          {Math.round(value)}
        </span>
      </div>
      <div style={{ height: 6, background: 'var(--crr-surface-3)', borderRadius: 999, overflow: 'hidden' }}>
        <div
          style={{
            width: `${value}%`,
            height: '100%',
            background: color,
            transition: 'width 1s cubic-bezier(.2,.7,.2,1)',
          }}
        />
      </div>
    </div>
  );
}

function QuickFact({ label, value, icon, highlight }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--crr-text-faint)', marginBottom: 4 }}>
        {icon}
        <span className="eyebrow" style={{ fontSize: 10 }}>
          {label}
        </span>
      </div>
      <div
        className="tnum"
        style={{ fontSize: 14, fontWeight: 500, color: highlight ? 'var(--crr-accent)' : 'var(--crr-text)' }}
      >
        {value}
      </div>
    </div>
  );
}

function CareerColumn({ c, onRemove, onSetPrimary, canRemove, primary, delay }) {
  return (
    <div
      style={{
        animation: `crr-riseIn 0.6s cubic-bezier(.2,.7,.2,1) ${delay}s both`,
        borderRadius: 20,
        overflow: 'hidden',
        background: 'var(--crr-surface-2)',
        border: primary ? '2px solid var(--crr-accent)' : '1px solid var(--crr-line)',
        boxShadow: primary ? '0 20px 40px -20px rgba(200,83,44,0.25)' : 'var(--crr-shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        minWidth: 0,
      }}
    >
      {primary && (
        <div
          className="eyebrow"
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            padding: '4px 10px',
            borderRadius: 999,
            background: 'var(--crr-accent)',
            color: '#fff',
            fontSize: 10,
            letterSpacing: '0.12em',
          }}
        >
          TOP MATCH
        </div>
      )}
      <div
        style={{
          padding: 22,
          background: primary ? 'linear-gradient(180deg, rgba(200,83,44,0.08), transparent)' : 'transparent',
          borderBottom: '1px solid var(--crr-line)',
        }}
      >
        <div className="eyebrow" style={{ color: matchColor(c.match), marginBottom: 6 }}>
          {c.match}% match
        </div>
        <div className="display" style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
          {c.title}
        </div>
        <div style={{ fontSize: 13, color: 'var(--crr-text-dim)', marginTop: 4, lineHeight: 1.5 }}>{c.tagline}</div>
        <div style={{ marginTop: 14, height: 5, background: 'var(--crr-surface-3)', borderRadius: 999, overflow: 'hidden' }}>
          <div
            style={{
              width: `${c.match}%`,
              height: '100%',
              background: 'linear-gradient(90deg, var(--crr-accent), var(--peach))',
              transition: 'width 1s cubic-bezier(.2,.7,.2,1)',
            }}
          />
        </div>
      </div>

      <div
        style={{
          padding: 20,
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 14,
          borderBottom: '1px solid var(--crr-line)',
        }}
      >
        <QuickFact label="Salary" value={c.salaryLabel} icon={<DollarSign size={12} />} />
        <QuickFact label="Growth" value={c.growthLabel} icon={<TrendingUp size={12} />} highlight />
        <QuickFact label="Time to role" value={c.timeToRole} icon={<Clock size={12} />} />
        <QuickFact label="Reskill effort" value={c.reskill} icon={<Brain size={12} />} />
        <QuickFact label="Demand" value={c.pace} icon={<Sparkles size={12} />} />
        <QuickFact label="Remote" value={c.remote} icon={<Leaf size={12} />} />
      </div>

      <div
        style={{
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          borderBottom: '1px solid var(--crr-line)',
        }}
      >
        <CompareMeter label="Learning curve" value={c.learning} />
        <CompareMeter label="Autonomy" value={c.autonomy} />
        <CompareMeter label="Work-life balance" value={c.balance} />
        <CompareMeter label="Match strength" value={c.craft} />
      </div>

      <div style={{ padding: 20, borderBottom: '1px solid var(--crr-line)' }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>
          Summary
        </div>
        <p style={{ fontSize: 13.5, color: 'var(--crr-text)', margin: 0, lineHeight: 1.55 }}>{c.day}</p>
      </div>

      {c.cons.length > 0 && (
        <div style={{ padding: 20, borderBottom: '1px solid var(--crr-line)' }}>
          <div className="eyebrow" style={{ marginBottom: 8, color: 'var(--crr-accent-deep)' }}>
            Honest tradeoffs
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {c.cons.map((con, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  fontSize: 13,
                  color: 'var(--crr-text-dim)',
                }}
              >
                <span style={{ color: 'var(--crr-accent)', flexShrink: 0, marginTop: 2 }}>·</span>
                <span style={{ lineHeight: 1.5 }}>{con}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {c.pros.length > 0 && (
        <div style={{ padding: 20, borderBottom: '1px solid var(--crr-line)' }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            What you&apos;d gain
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {c.pros.map((p, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  fontSize: 13,
                  color: 'var(--crr-text)',
                }}
              >
                <Check size={12} strokeWidth={2.5} style={{ color: 'var(--crr-accent)', marginTop: 3, flexShrink: 0 }} />
                <span style={{ lineHeight: 1.5 }}>{p}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {c.fit.length > 0 && (
        <div style={{ padding: 20, borderBottom: '1px solid var(--crr-line)' }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            You already bring
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {c.fit.map((s) => (
              <span
                key={s}
                style={{
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: 'rgba(159,184,154,0.18)',
                  border: '1px solid var(--sage)',
                  color: '#2d4a30',
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {c.toLearn.length > 0 && (
        <div style={{ padding: 20, borderBottom: '1px solid var(--crr-line)' }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            To learn
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {c.toLearn.map((s) => (
              <span
                key={s}
                style={{
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: 'rgba(234,217,168,0.4)',
                  border: '1px solid var(--butter)',
                  color: '#6a5a18',
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {(c.keySkills.length > 0 || c.education || c.industries.length > 0) && (
        <div style={{ padding: 20, borderBottom: '1px solid var(--crr-line)' }}>
          {c.education && (
            <>
              <div className="eyebrow" style={{ marginBottom: 6 }}>
                Education
              </div>
              <div style={{ fontSize: 13, color: 'var(--crr-text)', marginBottom: 12 }}>{c.education}</div>
            </>
          )}
          {c.keySkills.length > 0 && (
            <>
              <div className="eyebrow" style={{ marginBottom: 8 }}>
                Key skills
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: c.industries.length ? 12 : 0 }}>
                {c.keySkills.map((s) => (
                  <span
                    key={s}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      background: 'var(--crr-surface-3)',
                      border: '1px solid var(--crr-line)',
                      fontSize: 12,
                      color: 'var(--crr-text-dim)',
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </>
          )}
          {c.industries.length > 0 && (
            <>
              <div className="eyebrow" style={{ marginBottom: 8 }}>
                Job openings
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {c.industries.map((ind) => (
                  <span
                    key={ind}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      background: 'rgba(169,198,216,0.25)',
                      border: '1px solid rgba(169,198,216,0.55)',
                      color: '#1d3d52',
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    {ind}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div style={{ padding: 18, display: 'flex', gap: 8, marginTop: 'auto' }}>
        <button
          type="button"
          onClick={() => onSetPrimary(c.id)}
          className={primary ? 'crr-btn' : 'crr-btn crr-btn-primary'}
          style={{
            flex: 1,
            justifyContent: 'center',
            fontSize: 13,
            padding: '10px 14px',
            ...(primary
              ? {
                  border: '1px solid var(--crr-line-strong)',
                  background: 'var(--crr-surface-2)',
                  color: 'var(--crr-text)',
                }
              : {}),
          }}
        >
          {primary ? 'Your top match' : 'Make top match'}
        </button>
        {canRemove && !primary && (
          <button
            type="button"
            onClick={() => onRemove(c.id)}
            className="crr-btn crr-btn-ghost"
            style={{ padding: 10, color: 'var(--crr-text-faint)' }}
            title="Remove"
            aria-label="Remove"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

function VerdictCell({ label, value, sub }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div className="eyebrow" style={{ color: 'var(--cream-300)', marginBottom: 6 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 17,
          fontWeight: 500,
          letterSpacing: '-0.01em',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--cream-300)', marginTop: 2 }}>{sub}</div>
    </div>
  );
}

function VerdictStrip({ careers }) {
  if (!careers.length) return null;

  const safeReduce = (sel, getter) => careers.reduce((a, b) => (sel(a, b) ? a : b));

  const topMatch = safeReduce((a, b) => a.match >= b.match);
  const mostMoney = safeReduce(
    (a, b) => (a.raw.salary_range?.max ?? a.raw.median_salary_usd ?? 0) >= (b.raw.salary_range?.max ?? b.raw.median_salary_usd ?? 0),
  );
  const bestBalance = safeReduce((a, b) => a.balance >= b.balance);
  const fastest = safeReduce(
    (a, b) => (a.raw.avg_time_to_entry_months ?? 999) <= (b.raw.avg_time_to_entry_months ?? 999),
  );

  return (
    <div
      className="crr-card"
      style={{
        padding: 22,
        marginBottom: 28,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 20,
        background: 'var(--ink-900)',
        color: 'var(--cream-50)',
        borderColor: 'transparent',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <VerdictCell
        label="Highest match"
        value={topMatch.title}
        sub={`${topMatch.match}% based on your profile`}
      />
      <VerdictCell label="Most money" value={mostMoney.title} sub={mostMoney.salaryLabel} />
      <VerdictCell label="Best balance" value={bestBalance.title} sub={`${Math.round(bestBalance.balance)}/100 WLB`} />
      <VerdictCell label="Fastest to start" value={fastest.title} sub={fastest.timeToRole} />
      <div
        style={{
          position: 'absolute',
          right: -60,
          top: -60,
          width: 220,
          height: 220,
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--crr-accent) 0%, transparent 70%)',
          opacity: 0.25,
          filter: 'blur(40px)',
        }}
      />
    </div>
  );
}

/* ---------- Main modal ---------- */
export default function CareerComparison({ onClose }) {
  const [step, setStep] = useState('input'); // input | loading | results
  const [inputs, setInputs] = useState(['', '']);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [primaryId, setPrimaryId] = useState(null);
  const [hidden, setHidden] = useState(() => new Set());

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const addInput = () => {
    if (inputs.length < 4) setInputs([...inputs, '']);
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
    const careers = inputs.map((s) => s.trim()).filter(Boolean);
    if (careers.length < 2) {
      setError('Enter at least 2 career names.');
      return;
    }
    setError('');
    setStep('loading');
    try {
      const data = await api.compareCareers(careers);
      setResult(data);
      const cards = (data?.careers || []).map(buildCareerCard);
      const top = cards.reduce((a, b) => (a.match >= b.match ? a : b), cards[0]);
      setPrimaryId(top?.id ?? null);
      setHidden(new Set());
      setStep('results');
    } catch (e) {
      setError(e.message || 'Comparison failed. Please retry.');
      setStep('input');
    }
  };

  const cards = useMemo(() => {
    if (!result?.careers) return [];
    return result.careers.map(buildCareerCard).filter((c) => !hidden.has(c.id));
  }, [result, hidden]);

  const cols = cards.length;
  const gridCols =
    cols === 1
      ? 'minmax(320px, 520px)'
      : cols === 2
        ? 'repeat(2, minmax(0, 1fr))'
        : cols === 3
          ? 'repeat(3, minmax(0, 1fr))'
          : 'repeat(4, minmax(0, 1fr))';

  return (
    <div
      className="carrera-root"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'rgba(28,26,23,0.4)',
        backdropFilter: 'blur(8px)',
        padding: 16,
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 1280,
          maxHeight: '94vh',
          background: 'var(--crr-surface)',
          border: '1px solid var(--crr-line)',
          borderRadius: 24,
          boxShadow: 'var(--crr-shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 28px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            borderBottom: '1px solid var(--crr-line)',
            background: 'var(--crr-surface-3)',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'var(--sky)',
              color: '#1d3d52',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Sparkles size={16} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="display" style={{ fontSize: 18, fontWeight: 500, letterSpacing: '-0.01em' }}>
              Compare careers
            </div>
            <div style={{ fontSize: 12, color: 'var(--crr-text-faint)' }}>
              {step === 'results' && cards.length
                ? `${cards.length} paths side by side · tradeoffs kept honest`
                : 'Pick 2–4 paths and we’ll lay the tradeoffs out.'}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            {step === 'results' && (
              <button
                type="button"
                onClick={() => {
                  setStep('input');
                  setResult(null);
                  setHidden(new Set());
                  setPrimaryId(null);
                }}
                className="crr-btn crr-btn-ghost"
                style={{ padding: '8px 12px', fontSize: 13 }}
              >
                <Download size={14} /> Compare again
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{
                padding: 8,
                borderRadius: 8,
                background: 'transparent',
                border: '1px solid var(--crr-line)',
                color: 'var(--crr-text-faint)',
                cursor: 'pointer',
                display: 'inline-flex',
                fontFamily: 'inherit',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
          {step === 'input' && (
            <div style={{ position: 'relative', padding: '40px 28px 56px' }}>
              <div className="glow-field">
                <div
                  className="crr-glow peach"
                  style={{ width: 360, height: 360, left: '10%', top: '-10%', opacity: 0.5 }}
                />
                <div
                  className="crr-glow sky"
                  style={{ width: 320, height: 320, right: '5%', bottom: '-10%', opacity: 0.45, animationDelay: '2s' }}
                />
              </div>

              <div style={{ position: 'relative', maxWidth: 560, margin: '0 auto' }}>
                <div className="eyebrow" style={{ color: 'var(--crr-accent)', marginBottom: 10 }}>
                  Tradeoffs, not winners
                </div>
                <h2
                  className="display"
                  style={{
                    fontSize: 36,
                    fontWeight: 400,
                    margin: 0,
                    letterSpacing: '-0.03em',
                    lineHeight: 1.08,
                  }}
                >
                  Two to four paths,{' '}
                  <span className="serif-accent" style={{ color: 'var(--crr-accent)' }}>
                    side by side.
                  </span>
                </h2>
                <p style={{ fontSize: 15, color: 'var(--crr-text-dim)', marginTop: 12, lineHeight: 1.55 }}>
                  Type a few careers you&apos;re weighing. Carrera will line up salary ranges, time to role, what a Tuesday
                  looks like, and what you&apos;d give up.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 26 }}>
                  {inputs.map((val, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '12px 14px',
                        borderRadius: 14,
                        background: 'var(--crr-surface-2)',
                        border: '1px solid var(--crr-line)',
                      }}
                    >
                      <span
                        className="eyebrow"
                        style={{
                          fontSize: 10,
                          color: 'var(--crr-text-faint)',
                          minWidth: 30,
                        }}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <input
                        value={val}
                        onChange={(e) => updateInput(i, e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCompare()}
                        placeholder={`Career ${i + 1} (e.g. Applied AI Engineer)`}
                        style={{
                          flex: 1,
                          background: 'transparent',
                          border: 'none',
                          outline: 'none',
                          fontSize: 14,
                          color: 'var(--crr-text)',
                          fontFamily: 'inherit',
                        }}
                      />
                      {inputs.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeInput(i)}
                          aria-label={`Remove career ${i + 1}`}
                          style={{
                            color: 'var(--crr-text-faint)',
                            background: 'transparent',
                            border: 'none',
                            padding: 4,
                            cursor: 'pointer',
                          }}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16 }}>
                  {inputs.length < 4 && (
                    <button
                      type="button"
                      onClick={addInput}
                      className="crr-btn crr-btn-ghost"
                      style={{ padding: '8px 12px', fontSize: 13, color: 'var(--crr-accent)' }}
                    >
                      <Plus size={14} /> Add another path
                    </button>
                  )}
                  <span style={{ fontSize: 12, color: 'var(--crr-text-faint)', marginLeft: 'auto' }}>
                    Up to 4 paths · press Enter to compare
                  </span>
                </div>

                {error && (
                  <div
                    style={{
                      marginTop: 16,
                      padding: '10px 14px',
                      background: 'rgba(200,83,44,0.08)',
                      border: '1px solid rgba(200,83,44,0.25)',
                      borderRadius: 12,
                      color: 'var(--crr-accent-deep)',
                      fontSize: 13,
                    }}
                  >
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleCompare}
                  className="crr-btn crr-btn-primary"
                  style={{ marginTop: 22, padding: '14px 22px', fontSize: 15, justifyContent: 'center', width: '100%' }}
                >
                  Lay them side by side <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 'loading' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 18,
                padding: '80px 20px',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  border: '3px solid var(--crr-line)',
                  borderTopColor: 'var(--crr-accent)',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              <p style={{ color: 'var(--crr-text-dim)', fontSize: 14, margin: 0 }}>
                Weighing each path against your profile…
              </p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {step === 'results' && result && (
            <div style={{ padding: '32px 28px 48px', maxWidth: 1240, margin: '0 auto' }}>
              {result.recommendation && (
                <div
                  className="crr-card"
                  style={{
                    padding: 20,
                    marginBottom: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div className="eyebrow" style={{ color: 'var(--crr-accent)' }}>
                    Carrera&apos;s reading
                  </div>
                  <p style={{ margin: 0, fontSize: 15, color: 'var(--crr-text)', lineHeight: 1.6 }}>
                    {result.recommendation.reasoning}
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 18,
                      fontSize: 12,
                      color: 'var(--crr-text-dim)',
                      paddingTop: 6,
                    }}
                  >
                    <span>
                      Best fit:{' '}
                      <span style={{ color: 'var(--crr-accent)', fontWeight: 500 }}>
                        {result.recommendation.best_fit}
                      </span>
                    </span>
                    <span>
                      Best salary:{' '}
                      <span style={{ color: 'var(--crr-text)', fontWeight: 500 }}>
                        {result.recommendation.best_salary}
                      </span>
                    </span>
                    <span>
                      Fastest entry:{' '}
                      <span style={{ color: 'var(--crr-text)', fontWeight: 500 }}>
                        {result.recommendation.fastest_entry}
                      </span>
                    </span>
                  </div>
                </div>
              )}

              <VerdictStrip careers={cards} />

              <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 16, alignItems: 'stretch' }}>
                {cards.map((c, i) => (
                  <CareerColumn
                    key={c.id}
                    c={c}
                    primary={c.id === primaryId}
                    canRemove={cards.length > 1}
                    onRemove={(id) =>
                      setHidden((prev) => {
                        const n = new Set(prev);
                        n.add(id);
                        return n;
                      })
                    }
                    onSetPrimary={(id) => setPrimaryId(id)}
                    delay={i * 0.08}
                  />
                ))}
              </div>

              {result.data_note && (
                <p
                  style={{
                    fontSize: 11,
                    color: 'var(--crr-text-faint)',
                    textAlign: 'center',
                    marginTop: 18,
                  }}
                >
                  {result.data_note}
                </p>
              )}

              <div
                className="crr-card"
                style={{
                  marginTop: 28,
                  padding: 24,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 20,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: '1 1 320px' }}>
                  <div
                    className="display"
                    style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.01em' }}
                  >
                    Still torn between{' '}
                    <span className="serif-accent" style={{ color: 'var(--crr-accent)' }}>
                      two paths
                    </span>
                    ?
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--crr-text-dim)', marginTop: 4 }}>
                    Tell me your tie-breakers — I&apos;ll weigh them out loud, not pick for you.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="crr-btn crr-btn-primary"
                  style={{ padding: '12px 20px' }}
                >
                  <MessageCircle size={16} /> Talk it through
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
