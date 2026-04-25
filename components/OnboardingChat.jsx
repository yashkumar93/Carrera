'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowUp,
  Briefcase,
  Check,
  Leaf,
  Lock,
  Sparkles,
  Star,
  Target,
  Users,
} from 'lucide-react';
import apiService from '../lib/api';

/* ---------- Question script ---------- */
const OB_STEPS = [
  {
    q: "Hi — I'm Carrera.",
    q2: 'Before we begin, what should I call you?',
    k: 'name',
    placeholder: 'Your first name…',
    hint: 'Just a name. A nickname is fine.',
  },
  {
    q: 'Nice to meet you, {name}.',
    q2: "What's the story so far — school, work, or somewhere in between?",
    k: 'background',
    placeholder: 'A sentence or two is plenty.',
    hint: "No résumé. Just how you'd say it to a friend.",
  },
  {
    q: "Let's rewind to this week.",
    q2: 'What did you do that felt easy or energizing — even if it seemed small?',
    k: 'energized',
    placeholder: 'Anything. Debugging, cooking, helping a friend…',
    hint: "Small moments count. That's often where the signal is.",
  },
  {
    q: 'Flip side.',
    q2: 'What drained you? No judgment — this just helps me steer away.',
    k: 'drained',
    placeholder: 'Meetings, specific tasks, a kind of work…',
    hint: 'Be honest. We all have one.',
  },
  {
    q: 'Now dream a little.',
    q2: 'If you had three uninterrupted months to build one thing, what would you build?',
    k: 'build',
    placeholder: 'A product, a book, a community, a skill…',
    hint: "We'll make it concrete later. For now, go big.",
  },
  {
    q: 'On your mind already.',
    q2: "Any careers or roles you're drawn to? Even a vague vibe works.",
    k: 'careers',
    placeholder: 'e.g. "something AI-adjacent, but not research"',
    hint: "Contradictions are fine. I'll untangle them.",
  },
  {
    q: 'Last one, and the hardest.',
    q2: 'What does a good career look like to you, honestly?',
    k: 'values',
    placeholder: 'Money, meaning, flexibility, prestige, something else…',
    hint: 'Write freely. Nothing is wrong here.',
  },
];

/* ---------- Logo ---------- */
function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 10,
          background: 'linear-gradient(135deg, var(--crr-accent), var(--peach))',
          display: 'grid',
          placeItems: 'center',
          boxShadow: '0 2px 8px -2px var(--crr-accent)',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 3v18" />
          <path d="m5 10 7-7 7 7" />
          <circle cx="12" cy="17" r="2" />
        </svg>
      </div>
      <span className="display" style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em' }}>
        carrera
      </span>
    </div>
  );
}

/* ---------- Progress dots ---------- */
function OBProgress({ step, total }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span className="eyebrow tnum" style={{ fontSize: 11 }}>
        {String(step + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </span>
      <div style={{ display: 'flex', gap: 6 }}>
        {Array.from({ length: total }).map((_, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <div
              key={i}
              style={{
                width: active ? 24 : 8,
                height: 8,
                borderRadius: 999,
                background: done || active ? 'var(--crr-accent)' : 'var(--cream-200)',
                transition: 'width 0.45s cubic-bezier(.2,.7,.2,1), background 0.3s ease',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Answer pill (past answer collapsed) ---------- */
function OBAnswerPill({ question, answer, onEdit, delay }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
        padding: '14px 18px',
        borderRadius: 18,
        background: 'var(--crr-surface-2)',
        border: '1px solid var(--crr-line)',
        boxShadow: 'var(--crr-shadow-sm)',
        animation: `obSlideIn 0.6s cubic-bezier(.2,.7,.2,1) ${delay}s both`,
      }}
    >
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: 'var(--crr-accent)',
          color: '#fff',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        <Check size={13} strokeWidth={2.6} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          className="eyebrow"
          style={{ fontSize: 10, color: 'var(--crr-text-faint)', marginBottom: 2 }}
        >
          {question}
        </div>
        <div style={{ fontSize: 14.5, color: 'var(--crr-text)', lineHeight: 1.5 }}>{answer}</div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        style={{
          fontSize: 12,
          color: 'var(--crr-text-faint)',
          padding: '4px 8px',
          borderRadius: 6,
          transition: 'color 0.15s ease',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--crr-accent)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--crr-text-faint)')}
      >
        Edit
      </button>
    </div>
  );
}

/* ---------- Listening dots ---------- */
function OBReflecting({ label = 'listening…' }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 0',
        animation: 'obFadeIn 0.4s ease both',
      }}
    >
      <div style={{ display: 'flex', gap: 5 }}>
        {[0, 0.15, 0.3].map((d, i) => (
          <span
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: 'var(--crr-accent)',
              animation: 'obPulse 1.3s ease-in-out infinite',
              animationDelay: `${d}s`,
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: 13, color: 'var(--crr-text-faint)', fontStyle: 'italic' }}>{label}</span>
    </div>
  );
}

/* ---------- Active question card ---------- */
function OBQuestionCard({ step, data, value, setValue, onSubmit, answersCount, disabled }) {
  const inputRef = useRef(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 450);
    return () => clearTimeout(t);
  }, [step]);

  return (
    <div
      key={step}
      style={{
        animation: 'obQuestionIn 0.7s cubic-bezier(.2,.7,.2,1) both',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--crr-accent), var(--peach))',
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
            boxShadow: '0 6px 18px -6px var(--crr-accent)',
            animation: 'obFloat 3.5s ease-in-out infinite',
          }}
        >
          <Sparkles size={16} strokeWidth={2.4} />
        </div>
        <span className="eyebrow" style={{ color: 'var(--crr-accent)' }}>
          Question {step + 1}
        </span>
      </div>

      <h2
        className="display"
        style={{
          fontSize: 44,
          fontWeight: 400,
          margin: 0,
          letterSpacing: '-0.03em',
          lineHeight: 1.08,
        }}
      >
        <span style={{ display: 'block', animation: 'obLineIn 0.8s cubic-bezier(.2,.7,.2,1) 0.1s both' }}>
          {data.q}
        </span>
        <span
          className="serif-accent"
          style={{
            display: 'block',
            color: 'var(--crr-accent)',
            marginTop: 6,
            animation: 'obLineIn 0.8s cubic-bezier(.2,.7,.2,1) 0.25s both',
          }}
        >
          {data.q2}
        </span>
      </h2>

      <p
        style={{
          fontSize: 14,
          color: 'var(--crr-text-dim)',
          marginTop: 14,
          marginBottom: 0,
          animation: 'obFadeIn 0.7s ease 0.5s both',
        }}
      >
        {data.hint}
      </p>

      <div style={{ marginTop: 28, animation: 'obFadeIn 0.7s ease 0.6s both' }}>
        <div
          style={{
            padding: '4px 6px 4px 22px',
            borderRadius: 22,
            background: 'var(--crr-surface-2)',
            border: `1px solid ${focused ? 'var(--crr-accent)' : 'var(--crr-line)'}`,
            boxShadow: focused
              ? '0 0 0 4px rgba(200,83,44,0.10), 0 8px 24px -12px rgba(28,26,23,0.15)'
              : '0 8px 24px -12px rgba(28,26,23,0.12)',
            display: 'flex',
            alignItems: 'flex-end',
            gap: 10,
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          }}
        >
          <textarea
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSubmit();
              }
            }}
            placeholder={data.placeholder}
            rows={1}
            disabled={disabled}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 16,
              color: 'var(--crr-text)',
              resize: 'none',
              padding: '16px 0',
              minHeight: 28,
              maxHeight: 180,
              fontFamily: 'inherit',
              lineHeight: 1.55,
            }}
          />
          <button
            type="button"
            onClick={onSubmit}
            disabled={!value.trim() || disabled}
            aria-label="Continue"
            style={{
              width: 44,
              height: 44,
              margin: 4,
              borderRadius: '50%',
              background: value.trim() ? 'var(--crr-accent)' : 'var(--cream-200)',
              color: value.trim() ? '#fff' : 'var(--crr-text-faint)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              flexShrink: 0,
              boxShadow: value.trim() ? '0 6px 16px -6px var(--crr-accent)' : 'none',
              transform: value.trim() ? 'scale(1)' : 'scale(0.92)',
              border: 'none',
              cursor: value.trim() && !disabled ? 'pointer' : 'not-allowed',
            }}
          >
            <ArrowUp size={18} strokeWidth={2.4} />
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginTop: 14,
            fontSize: 12,
            color: 'var(--crr-text-faint)',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <kbd
              style={{
                padding: '2px 8px',
                borderRadius: 6,
                background: 'var(--crr-surface-3)',
                border: '1px solid var(--crr-line)',
                fontSize: 11,
                fontFamily: 'inherit',
              }}
            >
              Enter
            </kbd>{' '}
            to continue
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <kbd
              style={{
                padding: '2px 8px',
                borderRadius: 6,
                background: 'var(--crr-surface-3)',
                border: '1px solid var(--crr-line)',
                fontSize: 11,
                fontFamily: 'inherit',
              }}
            >
              ⇧ Enter
            </kbd>{' '}
            for a new line
          </span>
          {answersCount > 0 && (
            <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Leaf size={12} /> {answersCount} answer{answersCount === 1 ? '' : 's'} saved
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Finale ---------- */
function OBFinale({ answers, onDone, submitting }) {
  const [revealed, setRevealed] = useState(0);
  const summary = useMemo(
    () => [
      { icon: <Users size={14} />, label: 'Who you are', body: `${answers.name || 'Friend'} · ${answers.background || '—'}` },
      { icon: <Sparkles size={14} />, label: 'Energizes you', body: answers.energized || '—' },
      { icon: <Leaf size={14} />, label: 'Drains you', body: answers.drained || '—' },
      { icon: <Target size={14} />, label: 'Wants to build', body: answers.build || '—' },
      { icon: <Briefcase size={14} />, label: 'On your mind', body: answers.careers || '—' },
      { icon: <Star size={14} />, label: 'What matters', body: answers.values || '—' },
    ],
    [answers],
  );

  useEffect(() => {
    if (revealed >= summary.length) return;
    const t = setTimeout(() => setRevealed((r) => r + 1), revealed === 0 ? 800 : 320);
    return () => clearTimeout(t);
  }, [revealed, summary.length]);

  return (
    <div style={{ animation: 'obQuestionIn 0.8s cubic-bezier(.2,.7,.2,1) both' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--crr-accent), var(--peach))',
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
            boxShadow: '0 6px 18px -6px var(--crr-accent)',
          }}
        >
          <Check size={16} strokeWidth={2.6} />
        </div>
        <span className="eyebrow" style={{ color: 'var(--crr-accent)' }}>
          Here&apos;s what I heard
        </span>
      </div>

      <h2
        className="display"
        style={{
          fontSize: 44,
          fontWeight: 400,
          margin: 0,
          letterSpacing: '-0.03em',
          lineHeight: 1.08,
        }}
      >
        A first sketch of{' '}
        <span className="serif-accent" style={{ color: 'var(--crr-accent)' }}>
          you
        </span>
        , {answers.name || 'friend'}.
      </h2>
      <p style={{ fontSize: 15, color: 'var(--crr-text-dim)', marginTop: 14, marginBottom: 26 }}>
        This will keep getting sharper as we talk. Edit anything that feels wrong.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 12,
          marginBottom: 28,
        }}
      >
        {summary.map((s, i) => {
          const shown = i < revealed;
          return (
            <div
              key={s.label}
              style={{
                padding: 18,
                borderRadius: 18,
                background: 'var(--crr-surface-2)',
                border: '1px solid var(--crr-line)',
                opacity: shown ? 1 : 0,
                transform: shown ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.98)',
                transition: `opacity 0.6s cubic-bezier(.2,.7,.2,1) ${i * 0.04}s, transform 0.6s cubic-bezier(.2,.7,.2,1) ${i * 0.04}s`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 6,
                  color: 'var(--crr-accent)',
                }}
              >
                {s.icon}
                <span className="eyebrow" style={{ color: 'var(--crr-text-faint)' }}>
                  {s.label}
                </span>
              </div>
              <div style={{ fontSize: 14, color: 'var(--crr-text)', lineHeight: 1.5 }}>{s.body}</div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className="crr-btn crr-btn-primary"
        onClick={onDone}
        disabled={submitting}
        style={{
          padding: '16px 24px',
          fontSize: 16,
          opacity: revealed >= summary.length ? (submitting ? 0.7 : 1) : 0,
          transform: revealed >= summary.length ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
          cursor: submitting ? 'not-allowed' : 'pointer',
        }}
      >
        {submitting ? 'Saving…' : (<>Start my career journey <ArrowRight size={18} /></>)}
      </button>
    </div>
  );
}

/* ---------- Main page ---------- */
export default function OnboardingChat({ onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [input, setInput] = useState('');
  const [reflecting, setReflecting] = useState(false);
  const [finished, setFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);
  const backendGreetedRef = useRef(false);
  const backendProfileRef = useRef(null);

  const current = OB_STEPS[step];

  const promptFor = (s) => s.q2.replace('{name}', answers.name || 'friend');
  const promptLeadFor = (s) => s.q.replace('{name}', answers.name || 'friend');

  // Kick off backend onboarding session once so profile state stays in sync.
  useEffect(() => {
    if (backendGreetedRef.current) return;
    backendGreetedRef.current = true;
    (async () => {
      try {
        await apiService.sendMessage('start', null, true);
      } catch {
        // Non-fatal — UI still works and the final submit will retry.
      }
    })();
  }, []);

  const submit = async () => {
    const trimmed = input.trim();
    if (!trimmed || reflecting || submitting) return;

    const next = { ...answers, [current.k]: trimmed };
    setAnswers(next);
    setInput('');
    setReflecting(true);
    setError('');

    // Fire-and-forget so the backend can keep building its profile signal.
    (async () => {
      try {
        const data = await apiService.sendMessage(trimmed, null, true);
        if (data?.onboarding_complete && data?.profile_data) {
          backendProfileRef.current = data.profile_data;
        }
      } catch {
        // Ignore — we'll retry at finale.
      }
    })();

    setTimeout(() => {
      setReflecting(false);
      if (step + 1 >= OB_STEPS.length) {
        setFinished(true);
      } else {
        setStep(step + 1);
      }
    }, 900);
  };

  const editAnswer = (idx) => {
    const k = OB_STEPS[idx].k;
    setInput(answers[k] || '');
    const clone = { ...answers };
    delete clone[k];
    setAnswers(clone);
    setStep(idx);
    setFinished(false);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [step, reflecting, finished]);

  const handleDone = async () => {
    setSubmitting(true);
    setError('');
    try {
      // If backend hasn't already marked complete, nudge it with a final summary message.
      if (!backendProfileRef.current) {
        try {
          const summary = Object.entries(answers)
            .map(([k, v]) => `${k}: ${v}`)
            .join('\n');
          const data = await apiService.sendMessage(
            `Here's a summary of what I shared:\n${summary}`,
            null,
            true,
          );
          if (data?.profile_data) backendProfileRef.current = data.profile_data;
        } catch {
          // Ignore — onComplete still fires so the user isn't blocked.
        }
      }
      onComplete?.(backendProfileRef.current || answers);
    } finally {
      setSubmitting(false);
    }
  };

  const answerCount = Object.keys(answers).length;

  return (
    <div
      className="carrera-root"
      style={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div className="glow-field">
        <div className="crr-glow peach" style={{ width: 560, height: 560, left: -180, top: -150 }} />
        <div className="crr-glow sage" style={{ width: 480, height: 480, right: -140, top: 100, animationDelay: '2s' }} />
        <div className="crr-glow butter" style={{ width: 420, height: 420, left: '30%', bottom: -150, animationDelay: '4s' }} />
        <div className="crr-glow lilac" style={{ width: 360, height: 360, right: 100, bottom: -100, animationDelay: '6s', opacity: 0.4 }} />
      </div>

      <div
        style={{
          padding: '20px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          position: 'relative',
          zIndex: 2,
          flexWrap: 'wrap',
        }}
      >
        <Logo />
        <div
          style={{
            padding: '5px 12px 5px 8px',
            borderRadius: 999,
            background: 'var(--crr-surface-2)',
            border: '1px solid var(--crr-line)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--peach)' }} />
          <span className="eyebrow" style={{ fontSize: 11 }}>
            DISCOVERY
          </span>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <OBProgress step={finished ? OB_STEPS.length - 1 : step} total={OB_STEPS.length} />
        </div>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 32px 40px' }}>
          {!finished && step > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 36 }}>
              {OB_STEPS.slice(0, step).map((s, i) =>
                answers[s.k] ? (
                  <OBAnswerPill
                    key={s.k}
                    question={promptFor(s)}
                    answer={answers[s.k]}
                    onEdit={() => editAnswer(i)}
                    delay={i === step - 1 ? 0.1 : 0}
                  />
                ) : null,
              )}
            </div>
          )}

          {reflecting && <OBReflecting />}

          {!reflecting && !finished && (
            <OBQuestionCard
              step={step}
              data={{ ...current, q: promptLeadFor(current), q2: promptFor(current) }}
              value={input}
              setValue={setInput}
              onSubmit={submit}
              answersCount={answerCount}
              disabled={reflecting}
            />
          )}

          {finished && <OBFinale answers={answers} onDone={handleDone} submitting={submitting} />}

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
        </div>
      </div>

      <div
        style={{
          padding: '16px 32px 22px',
          textAlign: 'center',
          fontSize: 12,
          color: 'var(--crr-text-faint)',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Lock size={12} /> Your answers stay yours. You can edit or delete anything, anytime.
        </span>
      </div>

      <style>{`
        @keyframes obSlideIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes obFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes obQuestionIn {
          from { opacity: 0; transform: translateY(20px); filter: blur(6px); }
          to   { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes obLineIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes obPulse {
          0%, 100% { opacity: 0.3; transform: scale(0.85); }
          50%      { opacity: 1;   transform: scale(1.1); }
        }
        @keyframes obFloat {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-3px); }
        }
      `}</style>
    </div>
  );
}
