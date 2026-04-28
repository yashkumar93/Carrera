'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  ArrowUp,
  Brain,
  Briefcase,
  ChevronDown,
  Compass,
  Download,
  GitCompareArrows,
  LogOut,
  Map as MapIcon,
  MessageSquare,
  Paperclip,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
  Sparkles,
  Target,
  ThumbsDown,
  ThumbsUp,
  User as UserIcon,
  Users,
} from 'lucide-react';

import apiService from '../lib/api';
import { signInWithGoogle, signOutUser, onAuthChange } from '../lib/firebase';
import ProfileSettings from './ProfileSettings';
import RichResponseRenderer from './rich/RichResponseRenderer';
import AptitudeAssessment from './AptitudeAssessment';
import CareerComparison from './CareerComparison';

const STAGE_META = {
  discovery:       { label: 'DISCOVERY',       color: 'var(--peach)',      helper: 'Understanding your background' },
  assessment:      { label: 'ASSESSMENT',      color: 'var(--butter)',     helper: 'Evaluating your strengths' },
  analysis:        { label: 'ANALYSIS',        color: 'var(--butter)',     helper: 'Evaluating your strengths' },
  exploration:     { label: 'EXPLORATION',     color: 'var(--sage)',       helper: 'Exploring career options' },
  recommendations: { label: 'RECOMMENDATIONS', color: 'var(--sage)',       helper: 'Exploring career options' },
  roadmap:         { label: 'ROADMAP',         color: 'var(--crr-accent)', helper: 'Building your roadmap' },
  learning_path:   { label: 'LEARNING PATH',   color: 'var(--crr-accent)', helper: 'Building your roadmap' },
  action_plan:     { label: 'ACTION PLAN',     color: 'var(--lilac)',      helper: 'Creating next steps' },
  follow_up:       { label: 'FOLLOW UP',       color: 'var(--sky)',        helper: 'Ongoing support' },
};

const STAGE_PLACEHOLDERS = {
  discovery:   'Tell me about your interests, education, or career goals…',
  assessment:  'Share your skills, strengths, or what you want to improve…',
  exploration: 'Ask about any career, compare paths, or explore options…',
  roadmap:     'Ask about courses, certifications, or next steps…',
};

const WELCOME_MD = `# Welcome to Carrera

I'm your quiet career mentor. We'll talk through what you want, map the skills you need, and build the path — one honest step at a time.

**What we can explore together:**
- Your strengths and what gives you energy
- Honest career matches with real tradeoffs
- A personalized learning roadmap
- Practical next steps you can actually take

What's been on your mind lately?`;

const STARTER_SUGGESTIONS = [
  'I want to transition to a new career',
  'Help me advance in my current role',
  "I'm a recent graduate seeking direction",
  "I'm re-entering the workforce",
];

/* ---------- Logo ---------- */
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
          flexShrink: 0,
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M12 3v18" />
          <path d="m5 10 7-7 7 7" />
          <circle cx="12" cy="17" r="2" />
        </svg>
      </div>
      {!compact && (
        <span className="display" style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em' }}>
          carrera
        </span>
      )}
    </div>
  );
}

/* ---------- Sidebar ---------- */
function Sidebar({
  collapsed,
  onToggle,
  user,
  onSignIn,
  onSignOut,
  onOpenSettings,
  onOpenComparison,
  onNewConversation,
  canClear,
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const w = collapsed ? 68 : 260;

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navItems = [
    { k: 'chat', label: 'Chat', icon: <MessageSquare size={18} />, active: true },
    { k: 'roadmap', label: 'Roadmap', icon: <MapIcon size={18} />, href: '/roadmap' },
    { k: 'memory', label: 'Memory', icon: <Brain size={18} />, href: '/memory' },
    { k: 'aptitude', label: 'Aptitude', icon: <Target size={18} />, action: 'aptitude' },
    { k: 'compare', label: 'Compare', icon: <GitCompareArrows size={18} />, action: 'compare' },
    { k: 'community', label: 'Community', icon: <Users size={18} />, href: '/community' },
    { k: 'employers', label: 'Employers', icon: <Briefcase size={18} />, href: '/employers' },
  ];

  return (
    <aside
      style={{
        width: w,
        background: 'var(--crr-surface-3)',
        borderRight: '1px solid var(--crr-line)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s cubic-bezier(.2,.7,.2,1)',
        flexShrink: 0,
        position: 'relative',
      }}
    >
      <div
        style={{
          padding: collapsed ? '16px 14px' : '18px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          height: 64,
          borderBottom: '1px solid var(--crr-line)',
        }}
      >
        <Logo compact={collapsed} />
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            marginLeft: 'auto',
            width: 30,
            height: 30,
            borderRadius: 8,
            display: 'grid',
            placeItems: 'center',
            color: 'var(--crr-text-faint)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--crr-surface-2)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      <div style={{ padding: '14px 14px 6px' }}>
        <button
          type="button"
          onClick={onNewConversation}
          disabled={!canClear}
          className="crr-btn crr-btn-primary"
          style={{
            width: '100%',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '10px' : '10px 16px',
            fontSize: 14,
            opacity: canClear ? 1 : 0.6,
            cursor: canClear ? 'pointer' : 'not-allowed',
          }}
        >
          <Plus size={16} strokeWidth={2.4} />
          {!collapsed && <span>New conversation</span>}
        </button>
      </div>

      <nav style={{ padding: '10px', flex: 1, display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        {navItems.map((it) => {
          const Element = it.href ? 'a' : 'button';
          const elProps = it.href
            ? { href: it.href }
            : {
                type: 'button',
                onClick: () => {
                  if (it.action === 'aptitude') window.dispatchEvent(new CustomEvent('carrera:open-aptitude'));
                  if (it.action === 'compare') onOpenComparison();
                },
              };
          return (
            <Element
              key={it.k}
              {...elProps}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: collapsed ? '10px' : '10px 14px',
                borderRadius: 10,
                justifyContent: collapsed ? 'center' : 'flex-start',
                background: it.active ? 'var(--crr-surface-2)' : 'transparent',
                color: it.active ? 'var(--crr-text)' : 'var(--crr-text-dim)',
                fontSize: 14,
                fontWeight: it.active ? 500 : 400,
                position: 'relative',
                transition: 'background 0.15s ease, color 0.15s ease',
                textDecoration: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => {
                if (!it.active) e.currentTarget.style.background = 'var(--crr-surface-2)';
              }}
              onMouseLeave={(e) => {
                if (!it.active) e.currentTarget.style.background = 'transparent';
              }}
            >
              {it.active && (
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 8,
                    bottom: 8,
                    width: 3,
                    background: 'var(--crr-accent)',
                    borderRadius: 2,
                  }}
                />
              )}
              {it.icon}
              {!collapsed && <span>{it.label}</span>}
            </Element>
          );
        })}
      </nav>

      <div
        ref={profileRef}
        style={{
          padding: '12px 14px',
          borderTop: '1px solid var(--crr-line)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          position: 'relative',
        }}
      >
        {user ? (
          <>
            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                minWidth: 0,
                fontFamily: 'inherit',
                color: 'inherit',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--peach), var(--sage))',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 13,
                  flexShrink: 0,
                  overflow: 'hidden',
                }}
              >
                {user.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  (user.displayName || user.email || 'U').charAt(0).toUpperCase()
                )}
              </div>
              {!collapsed && (
                <>
                  <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {user.displayName || 'You'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--crr-text-faint)' }}>{user.email || 'Signed in'}</div>
                  </div>
                  <ChevronDown
                    size={14}
                    style={{
                      color: 'var(--crr-text-faint)',
                      transform: profileOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.15s ease',
                    }}
                  />
                </>
              )}
            </button>

            {profileOpen && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: 14,
                  right: 14,
                  marginBottom: 8,
                  background: 'var(--crr-surface-2)',
                  border: '1px solid var(--crr-line)',
                  borderRadius: 12,
                  padding: 6,
                  boxShadow: 'var(--crr-shadow)',
                  zIndex: 20,
                }}
              >
                <MenuRow icon={<Settings size={15} />} label="Profile settings" onClick={() => { setProfileOpen(false); onOpenSettings(); }} />
                <MenuRow icon={<GitCompareArrows size={15} />} label="Compare careers" onClick={() => { setProfileOpen(false); onOpenComparison(); }} />
                <MenuRow icon={<Brain size={15} />} label="My memory" href="/memory" />
                <MenuRow icon={<MapIcon size={15} />} label="Learning roadmap" href="/roadmap" />
                <div style={{ height: 1, background: 'var(--crr-line)', margin: '4px 0' }} />
                <MenuRow icon={<LogOut size={15} />} label="Log out" onClick={() => { setProfileOpen(false); onSignOut(); }} />
              </div>
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={onSignIn}
            className="crr-btn crr-btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '10px 14px', fontSize: 13 }}
          >
            {collapsed ? <UserIcon size={16} /> : 'Sign in with Google'}
          </button>
        )}
      </div>
    </aside>
  );
}

function MenuRow({ icon, label, onClick, href }) {
  const common = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 10px',
    borderRadius: 8,
    background: 'transparent',
    border: 'none',
    color: 'var(--crr-text)',
    fontSize: 13,
    cursor: 'pointer',
    textAlign: 'left',
    textDecoration: 'none',
    fontFamily: 'inherit',
  };
  const enter = (e) => (e.currentTarget.style.background = 'var(--crr-surface-3)');
  const leave = (e) => (e.currentTarget.style.background = 'transparent');
  if (href) {
    return (
      <a href={href} style={common} onMouseEnter={enter} onMouseLeave={leave}>
        {icon} {label}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} style={common} onMouseEnter={enter} onMouseLeave={leave}>
      {icon} {label}
    </button>
  );
}

/* ---------- Chat header ---------- */
function ChatHeader({ stage, onExport, exporting, disableExport }) {
  const s = STAGE_META[stage] || STAGE_META.discovery;
  return (
    <div
      style={{
        height: 64,
        padding: '0 28px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        borderBottom: '1px solid var(--crr-line)',
        background: 'var(--crr-surface)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '5px 12px 5px 8px',
          borderRadius: 999,
          background: 'var(--crr-surface-3)',
          border: '1px solid var(--crr-line)',
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
        <span className="eyebrow" style={{ fontSize: 11 }}>
          {s.label}
        </span>
      </div>
      <div style={{ fontSize: 15, fontWeight: 500 }}>Your career conversation</div>
      <span style={{ fontSize: 13, color: 'var(--crr-text-faint)' }}>· {s.helper}</span>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
        <button
          type="button"
          onClick={onExport}
          disabled={disableExport || exporting}
          className="crr-btn crr-btn-ghost"
          style={{
            padding: '8px 12px',
            fontSize: 13,
            opacity: disableExport || exporting ? 0.5 : 1,
            cursor: disableExport || exporting ? 'not-allowed' : 'pointer',
          }}
          aria-label="Export session as PDF"
        >
          <Download size={14} /> {exporting ? 'Exporting…' : 'Export'}
        </button>
        <a
          href="/roadmap"
          className="crr-btn"
          style={{
            padding: '7px 14px',
            fontSize: 13,
            border: '1px solid var(--crr-line-strong)',
            background: 'var(--crr-surface-2)',
            color: 'var(--crr-text)',
            textDecoration: 'none',
          }}
        >
          View roadmap
        </a>
      </div>
    </div>
  );
}

/* ---------- Messages ---------- */
function BotMessage({ message, onSuggest, feedback, onFeedback, canFeedback, onRichSuggest }) {
  const [hovered, setHovered] = useState(false);
  const displayContent = (message.content || '').split('<<META>>')[0];
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        maxWidth: 880,
        animation: 'crr-riseIn 0.6s cubic-bezier(.2,.7,.2,1) both',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: 'linear-gradient(135deg, var(--crr-accent), var(--peach))',
          display: 'grid',
          placeItems: 'center',
          color: '#fff',
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        <Sparkles size={14} strokeWidth={2.4} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {displayContent && (
          <div
            style={{
              fontSize: 15.5,
              color: 'var(--crr-text)',
              lineHeight: 1.6,
              maxWidth: 620,
            }}
          >
            <ReactMarkdown>{displayContent}</ReactMarkdown>
          </div>
        )}

        {message.richComponent && (
          <div style={{ marginTop: displayContent ? 14 : 0 }}>
            <RichResponseRenderer component={message.richComponent} onSuggestionClick={onRichSuggest} />
          </div>
        )}

        {Array.isArray(message.suggestions) && message.suggestions.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {message.suggestions.map((chip, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onSuggest(chip)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 999,
                  background: 'var(--crr-surface-2)',
                  border: '1px solid var(--crr-line)',
                  fontSize: 12.5,
                  color: 'var(--crr-text-dim)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--crr-accent)';
                  e.currentTarget.style.color = 'var(--crr-accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--crr-line)';
                  e.currentTarget.style.color = 'var(--crr-text-dim)';
                }}
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {canFeedback && (
          <div
            style={{
              display: 'flex',
              gap: 4,
              marginTop: 10,
              opacity: hovered || feedback ? 1 : 0,
              transition: 'opacity 0.2s ease',
            }}
          >
            <FeedbackButton
              active={feedback === 'thumbs_up'}
              onClick={() => onFeedback('thumbs_up')}
              title="Helpful"
              disabled={Boolean(feedback)}
            >
              <ThumbsUp size={13} />
            </FeedbackButton>
            <FeedbackButton
              active={feedback === 'thumbs_down'}
              onClick={() => onFeedback('thumbs_down')}
              title="Not helpful"
              disabled={Boolean(feedback)}
            >
              <ThumbsDown size={13} />
            </FeedbackButton>
            {feedback && (
              <span style={{ fontSize: 11, color: 'var(--crr-text-faint)', alignSelf: 'center', marginLeft: 4 }}>
                Feedback recorded
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FeedbackButton({ active, onClick, title, disabled, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      style={{
        padding: 6,
        borderRadius: 8,
        background: active ? 'var(--crr-surface-3)' : 'transparent',
        border: 'none',
        color: active ? 'var(--crr-accent)' : 'var(--crr-text-faint)',
        cursor: disabled && !active ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        fontFamily: 'inherit',
      }}
    >
      {children}
    </button>
  );
}

function UserMessage({ text }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        maxWidth: 880,
        animation: 'crr-riseIn 0.5s cubic-bezier(.2,.7,.2,1) both',
      }}
    >
      <div
        style={{
          padding: '12px 18px',
          borderRadius: 20,
          borderBottomRightRadius: 6,
          background: 'var(--crr-surface-3)',
          border: '1px solid var(--crr-line)',
          maxWidth: '70%',
          fontSize: 15,
          lineHeight: 1.55,
          whiteSpace: 'pre-wrap',
        }}
      >
        {text}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        animation: 'crr-riseIn 0.4s cubic-bezier(.2,.7,.2,1) both',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: 'linear-gradient(135deg, var(--crr-accent), var(--peach))',
          display: 'grid',
          placeItems: 'center',
          color: '#fff',
          flexShrink: 0,
        }}
      >
        <Sparkles size={14} strokeWidth={2.4} />
      </div>
      <div
        className="bubble bubble-bot"
        style={{ display: 'inline-flex', gap: 4, alignItems: 'center', padding: '14px 18px' }}
      >
        <span style={{ fontSize: 13, color: 'var(--crr-text-dim)', marginRight: 6 }}>Thinking</span>
        <Dot delay={0} />
        <Dot delay={0.15} />
        <Dot delay={0.3} />
      </div>
    </div>
  );
}

function Dot({ delay }) {
  return (
    <span
      style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: 'var(--crr-text-faint)',
        animation: 'crr-tping 1.2s ease-in-out infinite',
        animationDelay: `${delay}s`,
      }}
    />
  );
}

/* ---------- Composer ---------- */
function Composer({ value, onChange, onSend, disabled, stage }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = `${Math.min(ref.current.scrollHeight, 180)}px`;
    }
  }, [value]);

  const placeholder = STAGE_PLACEHOLDERS[stage] || STAGE_PLACEHOLDERS.discovery;
  const canSend = !disabled && value.trim().length > 0;

  return (
    <div
      style={{
        padding: '16px 28px 24px',
        background: 'linear-gradient(180deg, transparent, var(--crr-surface) 30%)',
        position: 'sticky',
        bottom: 0,
      }}
    >
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 10,
            padding: '12px 14px',
            borderRadius: 22,
            background: 'var(--crr-surface-2)',
            border: '1px solid var(--crr-line)',
            boxShadow: 'var(--crr-shadow-sm)',
          }}
        >
          <button
            type="button"
            style={{
              color: 'var(--crr-text-faint)',
              padding: 8,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
            aria-label="Attach file"
          >
            <Paperclip size={18} />
          </button>
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (canSend) onSend();
              }
            }}
            placeholder={placeholder}
            rows={1}
            disabled={disabled}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--crr-text)',
              fontSize: 15,
              resize: 'none',
              minHeight: 24,
              maxHeight: 180,
              padding: '8px 0',
              fontFamily: 'inherit',
              lineHeight: 1.5,
            }}
          />
          <button
            type="button"
            onClick={onSend}
            disabled={!canSend}
            aria-label="Send message"
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: canSend ? 'var(--crr-accent)' : 'var(--crr-surface-3)',
              color: canSend ? '#fff' : 'var(--crr-text-faint)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s ease',
              flexShrink: 0,
              border: 'none',
              cursor: canSend ? 'pointer' : 'not-allowed',
            }}
          >
            <ArrowUp size={16} strokeWidth={2.4} />
          </button>
        </div>
        <div style={{ textAlign: 'center', marginTop: 10, fontSize: 11.5, color: 'var(--crr-text-faint)' }}>
          Carrera learns from this conversation. You own your data · Press Enter to send
        </div>
      </div>
    </div>
  );
}

/* ---------- New conversation view ---------- */
function NewChatView({ userName, onSend }) {
  const [text, setText] = useState('');
  const send = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  };
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 28px 40px',
        position: 'relative',
      }}
    >
      <div className="glow-field">
        <div className="crr-glow peach" style={{ width: 420, height: 420, left: '10%', top: '10%' }} />
        <div className="crr-glow sage" style={{ width: 360, height: 360, right: '10%', bottom: '10%', animationDelay: '3s' }} />
      </div>
      <div style={{ position: 'relative', textAlign: 'center', maxWidth: 620, width: '100%' }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>
          A quiet place to think
        </div>
        <h1
          className="display"
          style={{ fontSize: 48, fontWeight: 400, letterSpacing: '-0.03em', lineHeight: 1.08, margin: 0 }}
        >
          Hi {userName || 'there'}, what&apos;s{' '}
          <span className="serif-accent" style={{ color: 'var(--crr-accent)' }}>
            on your mind
          </span>
          ?
        </h1>
        <p style={{ fontSize: 16, color: 'var(--crr-text-dim)', marginTop: 14, lineHeight: 1.55 }}>
          We&apos;ll talk through what you want, map the skills you need, and build the path — one honest step at a time.
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 10,
            padding: '14px 16px',
            borderRadius: 22,
            background: 'var(--crr-surface-2)',
            border: '1px solid var(--crr-line)',
            boxShadow: 'var(--crr-shadow)',
            marginTop: 28,
          }}
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Tell me what's been on your mind…"
            rows={1}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--crr-text)',
              fontSize: 15,
              resize: 'none',
              minHeight: 24,
              maxHeight: 180,
              fontFamily: 'inherit',
              lineHeight: 1.5,
              padding: '6px 0',
            }}
          />
          <button
            type="button"
            onClick={send}
            disabled={!text.trim()}
            aria-label="Begin"
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: text.trim() ? 'var(--crr-accent)' : 'var(--crr-surface-3)',
              color: text.trim() ? '#fff' : 'var(--crr-text-faint)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: text.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            <ArrowUp size={18} strokeWidth={2.4} />
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16, justifyContent: 'center' }}>
          {STARTER_SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSend(s)}
              style={{
                padding: '8px 14px',
                borderRadius: 999,
                background: 'var(--crr-surface-2)',
                border: '1px solid var(--crr-line)',
                fontSize: 13,
                color: 'var(--crr-text-dim)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--crr-accent)';
                e.currentTarget.style.color = 'var(--crr-accent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--crr-line)';
                e.currentTarget.style.color = 'var(--crr-text-dim)';
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Main interface ---------- */
export default function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [currentStage, setCurrentStage] = useState('discovery');
  const [isLoading, setIsLoading] = useState(false);

  const [user, setUser] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [showNewChatView, setShowNewChatView] = useState(true);
  const [messageFeedback, setMessageFeedback] = useState({});
  const [showSettings, setShowSettings] = useState(false);
  const [showAssessment, setShowAssessment] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);

  const messagesEndRef = useRef(null);
  const messagesAreaRef = useRef(null);

  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        content: WELCOME_MD,
        isUser: false,
        timestamp: Date.now(),
        suggestions: STARTER_SUGGESTIONS,
      },
    ]);
  }, []);

  useEffect(() => {
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isNearBottom]);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        });
        try {
          const history = await apiService.getChatHistory();
          if (history?.messages?.length) {
            const historical = history.messages.map((msg, i) => ({
              id: msg.id || `hist-${i}`,
              content: msg.content,
              isUser: msg.isUser,
              timestamp: msg.createdAt ? new Date(msg.createdAt).getTime() : Date.now(),
            }));
            setMessages(historical);
            setCurrentStage(history.stage || 'discovery');
            setShowNewChatView(false);
          }
        } catch (err) {
          console.error('Error loading chat history:', err);
        }
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const opener = () => setShowAssessment(true);
    window.addEventListener('carrera:open-aptitude', opener);
    return () => window.removeEventListener('carrera:open-aptitude', opener);
  }, []);

  const handleMessagesScroll = () => {
    const el = messagesAreaRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setIsNearBottom(distanceFromBottom < 120);
  };

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Sign-in failed:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (err) {
      console.error('Sign-out failed:', err);
    }
  };

  const handleSendMessage = async (override) => {
    const message = typeof override === 'string' ? override : inputValue;
    if (!message.trim() || isLoading) return;

    if (showNewChatView) setShowNewChatView(false);

    const userMessage = {
      id: Date.now(),
      content: message,
      isUser: true,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    const botMessageId = Date.now() + 1;
    const botMessage = {
      id: botMessageId,
      content: '',
      isUser: false,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, botMessage]);

    try {
      let fullResponse = '';

      await apiService.streamMessage(
        message,
        currentStage,
        (token) => {
          fullResponse += token;
          setMessages((prev) =>
            prev.map((msg) => (msg.id === botMessageId ? { ...msg, content: fullResponse } : msg)),
          );
        },
        (data) => {
          const { stage, suggestions, rich_component, clean_text } = data;
          if (stage) setCurrentStage(stage);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMessageId
                ? {
                    ...msg,
                    content: typeof clean_text === 'string' ? clean_text : msg.content,
                    richComponent: rich_component || null,
                    suggestions: suggestions || [],
                  }
                : msg,
            ),
          );
        },
        (error) => {
          throw error;
        },
      );
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = `I apologize, but I encountered an error: ${error.message}. Please try again.`;
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMessageId ? { ...msg, content: (msg.content || '') + '\n\n' + errorMessage } : msg,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (!confirm('Start a new conversation? This clears the current thread.')) return;
    try {
      await apiService.clearChatHistory();
      setMessages([
        {
          id: 'welcome',
          content: WELCOME_MD,
          isUser: false,
          timestamp: Date.now(),
          suggestions: STARTER_SUGGESTIONS,
        },
      ]);
      setCurrentStage('discovery');
      setShowNewChatView(true);
    } catch (err) {
      console.error('Failed to clear chat:', err);
    }
  };

  const handleExportPdf = async () => {
    if (exportingPdf) return;
    setExportingPdf(true);
    try {
      await apiService.exportChatHistoryPdf('career-plan.pdf');
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setExportingPdf(false);
    }
  };

  const handleFeedback = (messageId, rating) => {
    setMessageFeedback((prev) => ({ ...prev, [messageId]: rating }));
  };

  if (showSettings) {
    return (
      <div className="carrera-root" style={{ minHeight: '100vh' }}>
        <ProfileSettings isDarkMode={false} onBack={() => setShowSettings(false)} />
      </div>
    );
  }

  return (
    <div className="carrera-root" style={{ display: 'flex', height: '100vh' }}>
      {showAssessment && <AptitudeAssessment onClose={() => setShowAssessment(false)} />}
      {showComparison && <CareerComparison onClose={() => setShowComparison(false)} />}

      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        user={user}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        onOpenSettings={() => setShowSettings(true)}
        onOpenComparison={() => setShowComparison(true)}
        onNewConversation={handleClearChat}
        canClear={messages.length > 1 || !showNewChatView}
      />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <ChatHeader
          stage={currentStage}
          onExport={handleExportPdf}
          exporting={exportingPdf}
          disableExport={messages.length <= 1}
        />

        {showNewChatView ? (
          <NewChatView
            userName={user?.displayName?.split(' ')[0]}
            onSend={(text) => handleSendMessage(text)}
          />
        ) : (
          <>
            <div ref={messagesAreaRef} onScroll={handleMessagesScroll} style={{ flex: 1, overflowY: 'auto' }}>
              <div
                style={{
                  padding: '32px 28px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 22,
                  maxWidth: 980,
                  margin: '0 auto',
                }}
                role="log"
                aria-label="Chat conversation"
                aria-live="polite"
                aria-relevant="additions"
              >
                <div style={{ textAlign: 'center', padding: '12px 0 4px' }}>
                  <div className="eyebrow" style={{ color: 'var(--crr-text-faint)' }}>
                    <Compass size={11} style={{ display: 'inline', marginRight: 6, verticalAlign: '-1px' }} />
                    {STAGE_META[currentStage]?.label || 'SESSION'}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--crr-text-faint)', marginTop: 4 }}>
                    {STAGE_META[currentStage]?.helper || 'Career conversation'}
                  </div>
                </div>

                {messages.map((m) => {
                  if (m.isUser) return <UserMessage key={m.id} text={m.content} />;
                  const displayContent = (m.content || '').split('<<META>>')[0];
                  const canFeedback = Boolean(user) && Boolean(displayContent) && !isLoading;
                  return (
                    <BotMessage
                      key={m.id}
                      message={m}
                      onSuggest={(text) => handleSendMessage(text)}
                      onRichSuggest={(text) => handleSendMessage(text)}
                      feedback={messageFeedback[m.id]}
                      onFeedback={(rating) => handleFeedback(m.id, rating)}
                      canFeedback={canFeedback}
                    />
                  );
                })}

                {(() => {
                  const last = messages[messages.length - 1];
                  const preStream = isLoading && last && !last.isUser && !last.content;
                  return preStream ? <TypingDots /> : null;
                })()}

                <div ref={messagesEndRef} />
              </div>

              {!isNearBottom && messages.length > 2 && (
                <button
                  type="button"
                  onClick={() => {
                    setIsNearBottom(true);
                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{
                    position: 'sticky',
                    bottom: 20,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    padding: '8px 16px',
                    borderRadius: 999,
                    background: 'var(--ink-900)',
                    color: 'var(--cream-50)',
                    border: 'none',
                    fontSize: 12,
                    cursor: 'pointer',
                    boxShadow: 'var(--crr-shadow)',
                    fontFamily: 'inherit',
                    display: 'block',
                    margin: '0 auto',
                  }}
                >
                  ↓ Jump to latest
                </button>
              )}
            </div>

            <Composer
              value={inputValue}
              onChange={setInputValue}
              onSend={() => handleSendMessage()}
              disabled={isLoading}
              stage={currentStage}
            />
          </>
        )}
      </main>
    </div>
  );
}
