'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowUp,
  BookOpen,
  Brain,
  Briefcase,
  Check,
  ChevronRight,
  Clock,
  Lock,
  Map,
  MessageCircle,
  Sparkles,
  Star,
  Target,
  TrendingUp,
} from 'lucide-react';

/* ---------- Flip words (hero) ---------- */
function FlipWords({ words, interval = 2200 }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % words.length), interval);
    return () => clearInterval(id);
  }, [words.length, interval]);
  return (
    <span style={{ position: 'relative', display: 'inline-block', minWidth: '6ch', verticalAlign: 'baseline' }}>
      {words.map((w, idx) => (
        <span
          key={w}
          className="serif-accent"
          style={{
            position: idx === i ? 'relative' : 'absolute',
            left: 0,
            top: 0,
            opacity: idx === i ? 1 : 0,
            transform: idx === i ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 0.6s cubic-bezier(.2,.7,.2,1), transform 0.6s cubic-bezier(.2,.7,.2,1)',
            color: 'var(--crr-accent)',
            whiteSpace: 'nowrap',
          }}
        >
          {w}
        </span>
      ))}
    </span>
  );
}

/* ---------- Shiny badge ---------- */
function ShinyBadge({ children }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 14px 6px 8px',
        borderRadius: 999,
        background: 'var(--crr-surface-2)',
        border: '1px solid var(--crr-line)',
        fontSize: 13,
        color: 'var(--crr-text-dim)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--crr-accent) 0%, var(--peach) 100%)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
        }}
      >
        <Sparkles size={12} strokeWidth={2.2} />
      </span>
      <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
      <span
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(110deg, transparent 40%, rgba(255,255,255,0.4) 50%, transparent 60%)',
          animation: 'crr-shine 3s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

/* ---------- Hero chat demo ---------- */
function CareerChatDemo() {
  const script = useMemo(
    () => [
      { role: 'bot', text: "Hi — I'm your career mentor. Tell me what you've been thinking about." },
      { role: 'user', text: "I'm a 3rd year CS student. I like building things but I'm overwhelmed." },
      { role: 'bot', text: 'Totally normal. Are you more drawn to shipping products, or figuring out how systems work?' },
      { role: 'user', text: 'Shipping things people use.' },
      { role: 'bot', text: '', card: 'match' },
    ],
    [],
  );
  const [step, setStep] = useState(0);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    if (step >= script.length) {
      const id = setTimeout(() => setStep(0), 3800);
      return () => clearTimeout(id);
    }
    const msg = script[step];
    const typingTimer = setTimeout(() => setTyping(msg.role === 'bot'), 0);
    const id = setTimeout(
      () => {
        setTyping(false);
        setStep((s) => s + 1);
      },
      msg.role === 'bot' ? 1600 : 1100,
    );
    return () => {
      clearTimeout(typingTimer);
      clearTimeout(id);
    };
  }, [step, script]);

  const shown = script.slice(0, step);

  return (
    <div
      className="crr-card"
      style={{ padding: 0, width: '100%', maxWidth: 480, overflow: 'hidden', boxShadow: 'var(--crr-shadow-lg)' }}
    >
      <div
        style={{
          padding: '14px 18px',
          borderBottom: '1px solid var(--crr-line)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'var(--crr-surface-3)',
        }}
      >
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--sage)' }} />
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--crr-text)' }}>Carrera · live mentor</span>
        <span className="eyebrow" style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--crr-text-faint)' }}>
          DISCOVERY
        </span>
      </div>

      <div style={{ padding: '20px 18px', minHeight: 380, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {shown.map((m, i) => {
          if (m.card === 'match') return <MatchMini key={i} />;
          return (
            <div
              key={i}
              className={`bubble ${m.role === 'bot' ? 'bubble-bot' : 'bubble-user'}`}
              style={{
                animation: 'crr-riseIn 0.5s cubic-bezier(.2,.7,.2,1) both',
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                fontSize: 14,
                maxWidth: '85%',
              }}
            >
              {m.text}
            </div>
          );
        })}
        {typing && (
          <div
            className="bubble bubble-bot"
            style={{ display: 'inline-flex', gap: 4, alignSelf: 'flex-start', padding: '14px 16px' }}
          >
            <TypingDot delay={0} />
            <TypingDot delay={0.15} />
            <TypingDot delay={0.3} />
          </div>
        )}
      </div>

      <div
        style={{
          padding: '12px 14px',
          borderTop: '1px solid var(--crr-line)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'var(--crr-surface-2)',
        }}
      >
        <div
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 999,
            background: 'var(--crr-surface-3)',
            color: 'var(--crr-text-faint)',
            fontSize: 13,
          }}
        >
          Keep the conversation going…
        </div>
        <button
          type="button"
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'var(--crr-accent)',
            color: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <ArrowUp size={16} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}

function TypingDot({ delay }) {
  return (
    <span
      style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: 'var(--crr-text-faint)',
        animation: 'crr-tping 1.2s ease-in-out infinite',
        animationDelay: `${delay}s`,
        alignSelf: 'center',
      }}
    />
  );
}

function MatchMini() {
  return (
    <div
      style={{
        border: '1px solid var(--crr-line)',
        borderRadius: 18,
        padding: 14,
        background: 'var(--crr-surface-2)',
        animation: 'crr-riseIn 0.6s cubic-bezier(.2,.7,.2,1) both',
        display: 'flex',
        gap: 12,
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: 'linear-gradient(135deg, var(--peach), var(--crr-accent))',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
        }}
      >
        <Target size={22} />
      </div>
      <div style={{ flex: 1 }}>
        <div className="eyebrow" style={{ fontSize: 12, color: 'var(--crr-text-faint)' }}>
          Match 94%
        </div>
        <div style={{ fontSize: 15, fontWeight: 500 }}>Applied AI Engineer</div>
        <div style={{ fontSize: 12.5, color: 'var(--crr-text-dim)' }}>Ships real tools, systems-adjacent.</div>
      </div>
      <ChevronRight size={18} />
    </div>
  );
}

/* ---------- Navbar ---------- */
function Logo({ compact }) {
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
      {!compact && (
        <span className="display" style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' }}>
          carrera
        </span>
      )}
    </div>
  );
}

function Navbar({ onStart, onAuth }) {
  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        gap: 40,
        background: 'rgba(251,247,241,0.75)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--crr-line)',
      }}
    >
      <Logo />
      <div style={{ display: 'flex', gap: 4, marginLeft: 20 }}>
        <a href="#features" className="crr-btn crr-btn-ghost" style={{ fontSize: 14, padding: '8px 14px' }}>
          Features
        </a>
        <a href="#how" className="crr-btn crr-btn-ghost" style={{ fontSize: 14, padding: '8px 14px' }}>
          How it works
        </a>
        <a href="#manifesto" className="crr-btn crr-btn-ghost" style={{ fontSize: 14, padding: '8px 14px' }}>
          Manifesto
        </a>
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        <button type="button" className="crr-btn crr-btn-ghost" onClick={onAuth} style={{ fontSize: 14 }}>
          Sign in
        </button>
        <button type="button" className="crr-btn crr-btn-primary" onClick={onStart} style={{ fontSize: 14 }}>
          Start assessment <ArrowRight size={16} />
        </button>
      </div>
    </nav>
  );
}

/* ---------- Hero ---------- */
function Proof({ label, value, unit }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
        <span className="display tnum" style={{ fontSize: 22, fontWeight: 500 }}>
          {value}
        </span>
        {unit && <span style={{ fontSize: 13, color: 'var(--crr-text-faint)' }}>{unit}</span>}
      </div>
      <span style={{ fontSize: 12, color: 'var(--crr-text-faint)' }}>{label}</span>
    </div>
  );
}

function HeroSection({ onStart, headline = 'clarity' }) {
  const variants = {
    clarity: { lead: 'A quiet place to find your', words: ['clarity', 'direction', 'purpose', 'confidence'] },
    engineer: { lead: 'Engineer the', words: ['path', 'skills', 'roadmap', 'story'], trail: 'you actually want.' },
    rewritten: { lead: 'Your career,', words: ['rewritten', 'rethought', 'remapped', 'reimagined'] },
  };
  const v = variants[headline] || variants.clarity;

  return (
    <section style={{ position: 'relative', padding: '80px 0 64px' }}>
      <div className="glow-field">
        <div className="crr-glow peach" style={{ width: 500, height: 500, left: -100, top: -100 }} />
        <div className="crr-glow sage" style={{ width: 420, height: 420, right: -80, top: 60, animationDelay: '2s' }} />
        <div className="crr-glow butter" style={{ width: 380, height: 380, left: '40%', top: 300, animationDelay: '4s' }} />
      </div>

      <div
        className="crr-container"
        style={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: '1.05fr 1fr',
          gap: 60,
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div className="crr-reveal">
            <ShinyBadge>Your AI career mentor · now in public beta</ShinyBadge>
          </div>

          <h1 className="display crr-reveal" style={{ fontSize: 76, margin: 0, fontWeight: 400, animationDelay: '0.1s' }}>
            {v.lead}
            <br />
            <FlipWords words={v.words} />
            {v.trail && (
              <>
                <br />
                {v.trail}
              </>
            )}
          </h1>

          <p
            className="crr-reveal"
            style={{
              fontSize: 19,
              color: 'var(--crr-text-dim)',
              margin: 0,
              maxWidth: 520,
              lineHeight: 1.55,
              animationDelay: '0.2s',
            }}
          >
            Carrera is a calm, curious mentor that listens first. We talk through what you want, map the skills you need,
            and build the path — one honest step at a time.
          </p>

          <div className="crr-reveal" style={{ display: 'flex', alignItems: 'center', gap: 20, animationDelay: '0.3s' }}>
            <button
              type="button"
              className="crr-btn crr-btn-primary"
              onClick={onStart}
              style={{ padding: '14px 22px', fontSize: 16 }}
            >
              Begin the conversation <ArrowRight size={18} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--crr-text-dim)' }}>
              <Clock size={14} /> Free · Under 5 minutes
            </div>
          </div>

          <div
            className="crr-reveal"
            style={{
              display: 'flex',
              gap: 28,
              paddingTop: 16,
              borderTop: '1px solid var(--crr-line)',
              marginTop: 8,
              animationDelay: '0.4s',
            }}
          >
            <Proof label="Career matches" value="240+" />
            <Proof label="Students helped" value="38k" />
            <Proof label="Avg. clarity rating" value="4.9" unit="/5" />
          </div>
        </div>

        <div className="crr-reveal" style={{ animationDelay: '0.25s', display: 'flex', justifyContent: 'center' }}>
          <CareerChatDemo />
        </div>
      </div>
    </section>
  );
}

/* ---------- Bento preview ---------- */
function BentoMatch() {
  return (
    <div
      className="crr-card lift"
      style={{
        padding: 22,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        gridColumn: 'span 4',
        background: 'var(--crr-surface-2)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'var(--peach)',
            display: 'grid',
            placeItems: 'center',
            color: 'var(--crr-accent-deep)',
          }}
        >
          <Target size={18} />
        </div>
        <span className="eyebrow">Career match</span>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--crr-accent)', fontWeight: 600 }}>98%</span>
      </div>
      <div>
        <div className="display" style={{ fontSize: 28, fontWeight: 500 }}>
          AI Architect
        </div>
        <div style={{ fontSize: 13.5, color: 'var(--crr-text-dim)', marginTop: 6 }}>
          Designs intelligent systems, shapes products that learn.
        </div>
      </div>
      <div style={{ height: 6, borderRadius: 999, background: 'var(--cream-200)', overflow: 'hidden' }}>
        <div style={{ width: '98%', height: '100%', background: 'var(--crr-accent)' }} />
      </div>
    </div>
  );
}

function BentoRoadmap() {
  const steps = [
    { label: 'LLM Foundations', done: true },
    { label: 'Vector Databases', done: true },
    { label: 'RAG Systems', done: false, current: true },
    { label: 'Agent Orchestration', done: false },
  ];
  return (
    <div
      className="crr-card lift"
      style={{
        padding: 22,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        gridColumn: 'span 5',
        background: 'var(--crr-surface-2)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'var(--sage)',
            display: 'grid',
            placeItems: 'center',
            color: '#2d4a30',
          }}
        >
          <Map size={18} />
        </div>
        <span className="eyebrow">Personal roadmap</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: s.done ? 'var(--crr-accent)' : s.current ? 'transparent' : 'var(--cream-200)',
                border: s.current ? '2px dashed var(--crr-accent)' : 'none',
                display: 'grid',
                placeItems: 'center',
                color: '#fff',
                flexShrink: 0,
              }}
            >
              {s.done && <Check size={12} strokeWidth={2.5} />}
              {s.current && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--crr-accent)' }} />}
            </div>
            <span
              style={{
                fontSize: 14,
                color: s.done ? 'var(--crr-text-dim)' : 'var(--crr-text)',
                textDecoration: s.done ? 'line-through' : 'none',
                fontWeight: s.current ? 500 : 400,
              }}
            >
              {s.label}
            </span>
            {s.current && (
              <span
                className="eyebrow"
                style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--crr-accent)', fontWeight: 600 }}
              >
                Now
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function BentoStat() {
  return (
    <div
      className="lift"
      style={{
        padding: 22,
        gridColumn: 'span 3',
        borderRadius: 24,
        background: 'var(--ink-900)',
        color: 'var(--cream-50)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <span className="eyebrow" style={{ color: 'var(--cream-300)' }}>
        Time to first insight
      </span>
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: 13, color: 'var(--cream-300)' }}>&lt;</span>
          <span
            className="display"
            style={{ fontSize: 76, fontWeight: 400, letterSpacing: '-0.05em', color: 'var(--cream-50)' }}
          >
            3
          </span>
          <span style={{ fontSize: 16, color: 'var(--cream-200)', marginLeft: 4 }}>min</span>
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--cream-300)', marginTop: -4 }}>
          from first message to your first career card.
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          right: -30,
          top: -30,
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--crr-accent-soft) 0%, transparent 70%)',
          opacity: 0.5,
        }}
      />
    </div>
  );
}

function BentoPreviewSection() {
  return (
    <section style={{ padding: '24px 0 60px', position: 'relative' }}>
      <div className="crr-container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 16 }}>
          <BentoMatch />
          <BentoRoadmap />
          <BentoStat />
        </div>
      </div>
    </section>
  );
}

/* ---------- Features section ---------- */
function MatchStrip() {
  const items = [
    { t: 'Applied AI Engineer', m: 94 },
    { t: 'Product Engineer', m: 87 },
    { t: 'DevTools PM', m: 79 },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
      {items.map((it) => (
        <div
          key={it.t}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 14px',
            borderRadius: 12,
            background: 'var(--crr-surface-3)',
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 500 }}>{it.t}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 100, height: 4, background: 'var(--cream-200)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: `${it.m}%`, height: '100%', background: 'var(--crr-accent)' }} />
            </div>
            <span
              className="tnum"
              style={{ fontSize: 12, color: 'var(--crr-text-dim)', minWidth: 32, textAlign: 'right' }}
            >
              {it.m}%
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function CourseStrip() {
  const tracks = [
    { t: 'LLM Engineering', w: '6 wks', c: 'var(--peach)' },
    { t: 'Systems Design', w: '8 wks', c: 'var(--sage)' },
    { t: 'Product Writing', w: '3 wks', c: 'var(--butter)' },
    { t: 'Vector DBs', w: '4 wks', c: 'var(--sky)' },
  ];
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
      {tracks.map((t) => (
        <div
          key={t.t}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 14px 8px 10px',
            borderRadius: 999,
            background: 'var(--crr-surface-3)',
            border: '1px solid var(--crr-line)',
            fontSize: 13,
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.c }} />
          <span style={{ fontWeight: 500 }}>{t.t}</span>
          <span style={{ color: 'var(--crr-text-faint)' }}>{t.w}</span>
        </div>
      ))}
    </div>
  );
}

function PortfolioStrip() {
  const companies = ['Stripe', 'Vercel', 'Anthropic', 'Linear', 'Figma', 'Notion'];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 6 }}>
      {companies.map((c) => (
        <div
          key={c}
          style={{
            padding: '14px 16px',
            borderRadius: 12,
            background: 'var(--crr-surface-3)',
            fontSize: 13,
            fontWeight: 500,
            textAlign: 'center',
            border: '1px solid var(--crr-line)',
          }}
        >
          {c}
        </div>
      ))}
    </div>
  );
}

function FeatureCard({ title, subtitle, desc, icon, span, children, accent = 'peach', dark, big }) {
  const accentBg = {
    peach: 'var(--peach)',
    sage: 'var(--sage)',
    sky: 'var(--sky)',
    lilac: 'var(--lilac)',
    butter: 'var(--butter)',
  }[accent];
  return (
    <div
      className="crr-card lift"
      style={{
        gridColumn: `span ${span}`,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        background: dark ? 'var(--ink-900)' : 'var(--crr-surface-2)',
        color: dark ? 'var(--cream-50)' : 'var(--crr-text)',
        borderColor: dark ? 'transparent' : 'var(--crr-line)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: accentBg,
            color: 'var(--ink-900)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          {icon}
        </div>
      </div>
      {big ? (
        <>
          <div className="display" style={{ fontSize: 64, fontWeight: 500, letterSpacing: '-0.04em', lineHeight: 1 }}>
            {title}
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--crr-text-dim)', lineHeight: 1.5 }}>{subtitle}</div>
        </>
      ) : (
        <>
          <div
            className="display"
            style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.15 }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 14,
              color: dark ? 'var(--cream-300)' : 'var(--crr-text-dim)',
              lineHeight: 1.55,
            }}
          >
            {desc}
          </div>
        </>
      )}
      {children}
    </div>
  );
}

const SKILL_TARGETS = [82, 64, 48, 91, 36];
const SKILL_LABELS = ['Python', 'Systems', 'ML Ops', 'Product', 'Writing'];

function SkillGapCard() {
  const [bars, setBars] = useState([0, 0, 0, 0, 0]);

  useEffect(() => {
    const el = document.getElementById('crr-skill-gap');
    if (!el) return;
    const io = new IntersectionObserver(
      (es) => {
        if (es[0].isIntersecting) {
          setTimeout(() => setBars(SKILL_TARGETS), 200);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      id="crr-skill-gap"
      className="lift"
      style={{
        gridColumn: 'span 6',
        gridRow: 'span 2',
        padding: 28,
        borderRadius: 24,
        background: 'var(--ink-900)',
        color: 'var(--cream-50)',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: 'var(--crr-accent)',
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <TrendingUp size={18} />
        </div>
        <span className="eyebrow" style={{ color: 'var(--cream-300)' }}>
          Skill gap · live
        </span>
      </div>
      <div
        className="display"
        style={{ fontSize: 34, fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1.1, color: 'var(--cream-50)' }}
      >
        See the distance between{' '}
        <span className="serif-accent" style={{ color: 'var(--peach)' }}>
          where you are
        </span>{' '}
        and where you want to be.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
        {SKILL_LABELS.map((l, i) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 80, fontSize: 13, color: 'var(--cream-200)' }}>{l}</div>
            <div
              style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden' }}
            >
              <div
                style={{
                  width: `${bars[i]}%`,
                  height: '100%',
                  background: i === 3 ? 'var(--sage)' : 'var(--crr-accent)',
                  transition: `width 1.2s cubic-bezier(.2,.7,.2,1) ${i * 0.12}s`,
                }}
              />
            </div>
            <div
              className="tnum"
              style={{ fontSize: 12, color: 'var(--cream-300)', minWidth: 30, textAlign: 'right' }}
            >
              {SKILL_TARGETS[i]}%
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          position: 'absolute',
          right: -80,
          bottom: -80,
          width: 260,
          height: 260,
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--crr-accent) 0%, transparent 70%)',
          opacity: 0.25,
          filter: 'blur(40px)',
        }}
      />
    </div>
  );
}

function FeaturesSection() {
  return (
    <section id="features" style={{ padding: '100px 0', position: 'relative' }}>
      <div className="crr-container">
        <div style={{ maxWidth: 640, marginBottom: 48 }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>
            What you get
          </div>
          <h2 className="display" style={{ fontSize: 56, margin: 0, fontWeight: 400, letterSpacing: '-0.03em' }}>
            Everything you need to move{' '}
            <span className="serif-accent" style={{ color: 'var(--crr-accent)' }}>
              from stuck to shipping
            </span>
            .
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gridAutoRows: 'minmax(180px, auto)',
            gap: 16,
          }}
        >
          <SkillGapCard />
          <FeatureCard
            title="Career matches, ranked honestly."
            desc="Not a popularity contest. We match based on what you actually enjoy doing on a Tuesday afternoon."
            icon={<Target size={18} />}
            span={5}
            accent="peach"
          >
            <MatchStrip />
          </FeatureCard>
          <FeatureCard
            title="4.9 / 5"
            subtitle="average clarity rating from 8,200+ students after their first session."
            icon={<Star size={18} />}
            span={3}
            accent="butter"
            big
          />
          <FeatureCard
            title="Course tracks that don't waste you."
            desc="We sequence what to learn — and what to skip — based on where you are right now."
            icon={<BookOpen size={18} />}
            span={6}
            accent="sky"
          >
            <CourseStrip />
          </FeatureCard>
          <FeatureCard
            title="Industry portfolios."
            desc="See the actual projects that get people hired at the places you care about."
            icon={<Briefcase size={18} />}
            span={6}
            accent="lilac"
          >
            <PortfolioStrip />
          </FeatureCard>
        </div>
      </div>
    </section>
  );
}

/* ---------- How it works ---------- */
function MockBubble({ text, user }) {
  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: 16,
        background: user ? 'var(--crr-accent)' : 'rgba(255,255,255,0.08)',
        color: user ? '#fff' : 'var(--cream-100)',
        alignSelf: user ? 'flex-end' : 'flex-start',
        maxWidth: '85%',
        fontSize: 14,
        animation: 'crr-riseIn 0.5s cubic-bezier(.2,.7,.2,1) both',
      }}
    >
      {text}
    </div>
  );
}

function MockDiscovery() {
  return (
    <>
      <MockBubble text="What did you do this week that felt effortless?" />
      <MockBubble user text="Helped a friend debug their API. Three hours flew by." />
      <MockBubble text="That tells me a lot. Let's go deeper." />
    </>
  );
}

function MockAssessment() {
  const skills = [
    { l: 'Systems thinking', v: 78 },
    { l: 'Communication', v: 64 },
    { l: 'Rapid prototyping', v: 86 },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '6px 8px' }}>
      <div style={{ fontSize: 13, color: 'var(--cream-300)' }}>Skill signals · from conversation</div>
      {skills.map((s) => (
        <div key={s.l} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, fontSize: 13 }}>{s.l}</div>
          <div style={{ width: 140, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ width: `${s.v}%`, height: '100%', background: 'var(--crr-accent)', transition: 'width 0.8s ease' }} />
          </div>
          <div className="tnum" style={{ fontSize: 12, minWidth: 30, textAlign: 'right', color: 'var(--cream-200)' }}>
            {s.v}
          </div>
        </div>
      ))}
    </div>
  );
}

function MockExploration() {
  const opts = [
    { t: 'Applied AI Engineer', m: 94 },
    { t: 'Developer Advocate', m: 81 },
    { t: 'DX Product Manager', m: 76 },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {opts.map((o) => (
        <div
          key={o.t}
          style={{
            padding: '14px 16px',
            borderRadius: 14,
            background: 'rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{o.t}</div>
          <div style={{ fontSize: 12, color: 'var(--peach)', fontWeight: 600 }}>{o.m}%</div>
          <ChevronRight size={16} />
        </div>
      ))}
    </div>
  );
}

function MockRoadmap() {
  const weeks = [
    { l: 'Week 1–2 · LLM fundamentals', done: true },
    { l: 'Week 3–4 · Build a RAG app', done: true },
    { l: 'Week 5–6 · Ship to 10 users', current: true },
    { l: 'Week 7–8 · Interview prep', done: false },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {weeks.map((w) => (
        <div key={w.l} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: w.done ? 'var(--crr-accent)' : w.current ? 'transparent' : 'rgba(255,255,255,0.1)',
              border: w.current ? '2px dashed var(--crr-accent)' : 'none',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
              color: '#fff',
            }}
          >
            {w.done && <Check size={11} strokeWidth={2.5} />}
          </div>
          <span
            style={{
              fontSize: 13.5,
              color: w.current ? 'var(--peach)' : 'var(--cream-200)',
              fontWeight: w.current ? 500 : 400,
            }}
          >
            {w.l}
          </span>
        </div>
      ))}
    </div>
  );
}

function HowMock({ active }) {
  const labels = ['DISCOVERY', 'ASSESSMENT', 'EXPLORATION', 'ROADMAP'];
  return (
    <div
      style={{
        padding: 20,
        borderRadius: 28,
        background: 'var(--ink-900)',
        color: 'var(--cream-50)',
        minHeight: 460,
        boxShadow: 'var(--crr-shadow-lg)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#4a4037' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#4a4037' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#4a4037' }} />
        <span className="eyebrow" style={{ marginLeft: 'auto', color: 'var(--cream-300)' }}>
          {labels[active]}
        </span>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, padding: '12px 4px' }}>
        {active === 0 && <MockDiscovery />}
        {active === 1 && <MockAssessment />}
        {active === 2 && <MockExploration />}
        {active === 3 && <MockRoadmap />}
      </div>
      <div
        style={{
          position: 'absolute',
          left: -60,
          bottom: -60,
          width: 240,
          height: 240,
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--crr-accent) 0%, transparent 70%)',
          opacity: 0.25,
          filter: 'blur(40px)',
        }}
      />
    </div>
  );
}

function HowItWorks() {
  const steps = useMemo(
    () => [
      { k: 'Conversation', d: "Start by telling us what's on your mind. No forms, just talk.", icon: <MessageCircle size={20} /> },
      { k: 'Assessment', d: 'We map your skills, interests and what gives you energy — subtly, through chat.', icon: <Brain size={20} /> },
      { k: 'Exploration', d: 'Three to five honest career matches, each with the tradeoffs laid out.', icon: <Target size={20} /> },
      { k: 'Roadmap', d: 'A personalized, week-by-week path. You own it. You can change it.', icon: <Map size={20} /> },
    ],
    [],
  );
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % steps.length), 3400);
    return () => clearInterval(id);
  }, [steps.length]);

  return (
    <section id="how" style={{ padding: '100px 0', position: 'relative' }}>
      <div className="glow-field">
        <div className="crr-glow sky" style={{ width: 500, height: 500, right: -120, top: 80, opacity: 0.35 }} />
      </div>
      <div className="crr-container" style={{ position: 'relative' }}>
        <div style={{ maxWidth: 640, marginBottom: 56 }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>
            How it works
          </div>
          <h2 className="display" style={{ fontSize: 56, margin: 0, fontWeight: 400, letterSpacing: '-0.03em' }}>
            Four stages.{' '}
            <span className="serif-accent" style={{ color: 'var(--crr-accent)' }}>
              One conversation.
            </span>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {steps.map((s, i) => (
              <div
                key={s.k}
                onMouseEnter={() => setActive(i)}
                style={{
                  padding: '24px 20px',
                  borderRadius: 20,
                  background: i === active ? 'var(--crr-surface-2)' : 'transparent',
                  border: i === active ? '1px solid var(--crr-line)' : '1px solid transparent',
                  boxShadow: i === active ? 'var(--crr-shadow-sm)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  gap: 18,
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    background: i === active ? 'var(--crr-accent)' : 'var(--crr-surface-3)',
                    color: i === active ? '#fff' : 'var(--crr-text-dim)',
                    display: 'grid',
                    placeItems: 'center',
                    transition: 'all 0.3s ease',
                    flexShrink: 0,
                  }}
                >
                  {s.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
                    <span className="tnum" style={{ fontSize: 12, color: 'var(--crr-text-faint)', fontWeight: 500 }}>
                      0{i + 1}
                    </span>
                    <span
                      className="display"
                      style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em' }}
                    >
                      {s.k}
                    </span>
                  </div>
                  <div style={{ fontSize: 14.5, color: 'var(--crr-text-dim)', lineHeight: 1.55 }}>{s.d}</div>
                </div>
              </div>
            ))}
          </div>

          <HowMock active={active} />
        </div>
      </div>
    </section>
  );
}

/* ---------- CTA ---------- */
function CTASection({ onStart }) {
  return (
    <section style={{ padding: '64px 0' }}>
      <div className="crr-container">
        <div
          style={{
            padding: '80px 64px',
            borderRadius: 36,
            background: 'var(--ink-900)',
            color: 'var(--cream-50)',
            position: 'relative',
            overflow: 'hidden',
            display: 'grid',
            gridTemplateColumns: '1.2fr auto',
            gap: 40,
            alignItems: 'center',
          }}
        >
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div className="eyebrow" style={{ color: 'var(--peach)', marginBottom: 20 }}>
              One conversation away
            </div>
            <h2
              className="display"
              style={{ fontSize: 68, margin: 0, fontWeight: 400, letterSpacing: '-0.03em', lineHeight: 1.02 }}
            >
              Your career,
              <br />
              <span className="serif-accent" style={{ color: 'var(--peach)' }}>
                re-engineered.
              </span>
            </h2>
            <p style={{ fontSize: 17, color: 'var(--cream-300)', maxWidth: 440, marginTop: 20, lineHeight: 1.55 }}>
              Join 38,000+ people who stopped guessing and started building toward something that actually fits.
            </p>
          </div>
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              alignItems: 'flex-start',
            }}
          >
            <button
              type="button"
              className="crr-btn crr-btn-primary"
              onClick={onStart}
              style={{ padding: '18px 28px', fontSize: 17 }}
            >
              Start your conversation <ArrowRight size={18} />
            </button>
            <div
              style={{ fontSize: 13, color: 'var(--cream-300)', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <Lock size={12} /> Free to start · no credit card
            </div>
          </div>
          <div
            style={{
              position: 'absolute',
              right: -100,
              top: -100,
              width: 480,
              height: 480,
              borderRadius: '50%',
              background: 'radial-gradient(circle, var(--crr-accent) 0%, transparent 70%)',
              opacity: 0.35,
              filter: 'blur(60px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: -80,
              bottom: -80,
              width: 320,
              height: 320,
              borderRadius: '50%',
              background: 'radial-gradient(circle, var(--peach) 0%, transparent 70%)',
              opacity: 0.25,
              filter: 'blur(50px)',
            }}
          />
        </div>
      </div>
    </section>
  );
}

/* ---------- Footer ---------- */
function Footer() {
  const cols = [
    { h: 'Product', l: ['Features', 'Pricing', 'Roadmap', 'Changelog'] },
    { h: 'Company', l: ['About', 'Manifesto', 'Careers', 'Press'] },
    { h: 'Ecosystem', l: ['For mentors', 'For employers', 'Developer API', 'Community'] },
  ];
  return (
    <footer style={{ padding: '64px 0 40px', borderTop: '1px solid var(--crr-line)' }}>
      <div className="crr-container" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 48 }}>
        <div>
          <Logo />
          <p style={{ fontSize: 14, color: 'var(--crr-text-dim)', maxWidth: 280, marginTop: 16, lineHeight: 1.6 }}>
            A quiet mentor for loud career questions. Made with care in Brooklyn and Lisbon.
          </p>
        </div>
        {cols.map((c) => (
          <div key={c.h}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>
              {c.h}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {c.l.map((x) => (
                <a key={x} href="#" style={{ fontSize: 14, color: 'var(--crr-text-dim)', textDecoration: 'none' }}>
                  {x}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div
        className="crr-container"
        style={{
          marginTop: 48,
          paddingTop: 24,
          borderTop: '1px solid var(--crr-line)',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 13,
          color: 'var(--crr-text-faint)',
        }}
      >
        <div>© 2026 Carrera Labs. All rights belong to their owners.</div>
        <div style={{ display: 'flex', gap: 20 }}>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>
            Privacy
          </a>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>
            Terms
          </a>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}

/* ---------- Page ---------- */
export default function LandingPage({ onSignIn, onStart, headline = 'clarity' }) {
  const go = onStart || onSignIn || (() => {});
  const auth = onSignIn || (() => {});

  return (
    <div className="carrera-root" style={{ minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>
      <Navbar onStart={go} onAuth={auth} />
      <HeroSection onStart={go} headline={headline} />
      <BentoPreviewSection />
      <FeaturesSection />
      <HowItWorks />
      <CTASection onStart={go} />
      <Footer />
    </div>
  );
}
