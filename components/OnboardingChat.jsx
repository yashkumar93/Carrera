'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import apiService from '../lib/api';
import { ArrowUp, Sparkles, CheckCircle, User, GraduationCap, Briefcase, Target, MapPin } from 'lucide-react';

// ─── Inline styles (no external deps) ────────────────────────────────────────

const styles = {
  root: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: '0',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif",
    color: '#ececec',
  },
  header: {
    width: '100%',
    padding: '1rem 1.5rem',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    background: 'rgba(0,0,0,0.2)',
    backdropFilter: 'blur(10px)',
  },
  logo: {
    fontSize: '1.1rem',
    fontWeight: '700',
    letterSpacing: '-0.02em',
    background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  badge: {
    fontSize: '0.7rem',
    fontWeight: '600',
    padding: '0.2rem 0.6rem',
    borderRadius: '999px',
    background: 'rgba(124, 58, 237, 0.2)',
    border: '1px solid rgba(124, 58, 237, 0.4)',
    color: '#a78bfa',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  chatContainer: {
    width: '100%',
    maxWidth: '680px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '1.5rem 1rem',
    gap: '0',
    overflowY: 'auto',
    paddingBottom: '0',
  },
  progressBar: {
    width: '100%',
    maxWidth: '680px',
    padding: '0.75rem 1rem 0',
  },
  progressTrack: {
    height: '3px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  progressFill: (pct) => ({
    height: '100%',
    width: `${pct}%`,
    background: 'linear-gradient(90deg, #7c3aed, #a855f7)',
    borderRadius: '2px',
    transition: 'width 0.6s ease',
  }),
  progressLabel: {
    fontSize: '0.75rem',
    color: 'rgba(255,255,255,0.4)',
    marginTop: '0.4rem',
  },
  messageRow: (isUser) => ({
    display: 'flex',
    justifyContent: isUser ? 'flex-end' : 'flex-start',
    marginBottom: '1rem',
    gap: '0.625rem',
    alignItems: 'flex-end',
    animation: isUser ? 'slideInRight 0.35s ease-out' : 'slideInLeft 0.4s ease-out',
    animationFillMode: 'both',
  }),
  avatarBot: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontSize: '0.875rem',
    fontWeight: '700',
    color: '#fff',
    animation: 'pulseGlow 2.5s ease-in-out infinite',
  },
  bubbleBot: {
    maxWidth: '520px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '18px 18px 18px 4px',
    padding: '0.875rem 1rem',
    fontSize: '0.9375rem',
    lineHeight: '1.6',
    color: '#ececec',
  },
  bubbleUser: {
    maxWidth: '400px',
    background: 'rgba(124, 58, 237, 0.25)',
    border: '1px solid rgba(124, 58, 237, 0.4)',
    borderRadius: '18px 18px 4px 18px',
    padding: '0.75rem 1rem',
    fontSize: '0.9375rem',
    lineHeight: '1.6',
    color: '#ececec',
  },
  typingDots: {
    display: 'flex',
    gap: '4px',
    padding: '4px 0',
    alignItems: 'center',
  },
  dot: (delay) => ({
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.5)',
    animation: 'bounce 1.4s infinite ease-in-out',
    animationDelay: delay,
  }),
  inputArea: {
    width: '100%',
    maxWidth: '680px',
    padding: '1rem',
    background: 'rgba(0,0,0,0.3)',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    gap: '0.625rem',
    alignItems: 'flex-end',
  },
  textarea: {
    flex: 1,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '12px',
    padding: '0.75rem 1rem',
    color: '#ececec',
    fontSize: '0.9375rem',
    lineHeight: '1.5',
    resize: 'none',
    minHeight: '48px',
    maxHeight: '160px',
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s',
  },
  sendBtn: (disabled) => ({
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: disabled ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #7c3aed, #a855f7)',
    border: 'none',
    color: disabled ? 'rgba(255,255,255,0.3)' : '#fff',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.2s',
  }),

  // Profile review card styles
  reviewOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    zIndex: 50,
  },
  reviewCard: {
    background: '#1a1a2e',
    border: '1px solid rgba(124, 58, 237, 0.3)',
    borderRadius: '20px',
    padding: '2rem',
    maxWidth: '520px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
  },
  reviewTitle: {
    fontSize: '1.4rem',
    fontWeight: '700',
    marginBottom: '0.25rem',
    background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  reviewSubtitle: {
    fontSize: '0.875rem',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: '1.5rem',
  },
  profileGrid: {
    display: 'grid',
    gap: '0.75rem',
    marginBottom: '1.75rem',
  },
  profileRow: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'flex-start',
    padding: '0.75rem 1rem',
    background: 'rgba(255,255,255,0.04)',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.07)',
  },
  profileIcon: {
    color: '#a78bfa',
    flexShrink: 0,
    marginTop: '1px',
  },
  profileLabel: {
    fontSize: '0.75rem',
    color: 'rgba(255,255,255,0.45)',
    marginBottom: '0.15rem',
    fontWeight: '600',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  profileValue: {
    fontSize: '0.9rem',
    color: '#ececec',
    lineHeight: '1.4',
  },
  startBtn: {
    width: '100%',
    padding: '0.875rem',
    background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
    border: 'none',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    transition: 'opacity 0.2s',
  },
  skipBtn: {
    width: '100%',
    marginTop: '0.75rem',
    padding: '0.625rem',
    background: 'transparent',
    border: 'none',
    color: 'rgba(255,255,255,0.35)',
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'color 0.2s',
  },
};

// ─── Keyframes injected once ─────────────────────────────────────────────────
const KEYFRAMES = `
@keyframes bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-8px); opacity: 1; }
}
@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-24px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes slideInRight {
  from { opacity: 0; transform: translateX(24px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes pulseGlow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0); }
  50% { box-shadow: 0 0 12px 2px rgba(124, 58, 237, 0.25); }
}
`;

// ─── Profile review card ──────────────────────────────────────────────────────

function ProfileReviewCard({ profile, onConfirm, onSkip }) {
  const fields = [
    {
      icon: <GraduationCap size={16} />,
      label: 'Education',
      value: profile?.education || 'Not specified',
    },
    {
      icon: <Target size={16} />,
      label: 'Career Interests',
      value: Array.isArray(profile?.career_interests)
        ? profile.career_interests.join(', ')
        : profile?.career_interests || 'Not specified',
    },
    {
      icon: <Briefcase size={16} />,
      label: 'Skills',
      value: Array.isArray(profile?.skills)
        ? profile.skills.join(', ')
        : profile?.skills || 'Not specified',
    },
    {
      icon: <User size={16} />,
      label: 'Experience Level',
      value: profile?.experience_level || 'Not specified',
    },
    {
      icon: <MapPin size={16} />,
      label: 'About You',
      value: profile?.bio || 'Not specified',
    },
  ];

  return (
    <div style={styles.reviewOverlay}>
      <div style={styles.reviewCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
          <CheckCircle size={22} color="#a78bfa" />
          <div style={styles.reviewTitle}>Your Profile is Ready</div>
        </div>
        <div style={styles.reviewSubtitle}>
          Here's what I learned about you. This will be used to personalize your career guidance.
        </div>

        <div style={styles.profileGrid}>
          {fields.map((f) => (
            <div key={f.label} style={styles.profileRow}>
              <span style={styles.profileIcon}>{f.icon}</span>
              <div>
                <div style={styles.profileLabel}>{f.label}</div>
                <div style={styles.profileValue}>{f.value}</div>
              </div>
            </div>
          ))}
        </div>

        <button style={styles.startBtn} onClick={onConfirm}>
          <Sparkles size={16} />
          Start My Career Journey
        </button>
        <button style={styles.skipBtn} onClick={onSkip}>
          Edit later in settings
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function OnboardingChat({ onComplete }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [profileData, setProfileData] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Inject keyframes once
  useEffect(() => {
    const id = 'onboarding-keyframes';
    if (!document.getElementById(id)) {
      const style = document.createElement('style');
      style.id = id;
      style.textContent = KEYFRAMES;
      document.head.appendChild(style);
    }
  }, []);

  // Trigger the AI's opening greeting on mount
  useEffect(() => {
    triggerGreeting();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [inputValue]);

  const addMessage = (content, isUser) => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), content, isUser, timestamp: Date.now() },
    ]);
  };

  async function triggerGreeting() {
    setIsLoading(true);
    try {
      const data = await apiService.sendMessage('start', null, true);
      addMessage(data.response, false);
    } catch (err) {
      addMessage(
        "Hi! I'm Careerra, your AI career advisor. I'd love to learn a bit about you first. What's your current situation — are you a student, recent graduate, or working professional?",
        false,
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSend(text = inputValue) {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    addMessage(trimmed, true);
    setInputValue('');
    setUserMessageCount((c) => c + 1);
    setIsLoading(true);

    try {
      const data = await apiService.sendMessage(trimmed, null, true);

      addMessage(data.response, false);

      if (data.onboarding_complete && data.profile_data) {
        setProfileData(data.profile_data);
        setOnboardingDone(true);
      }
    } catch (err) {
      addMessage(
        "I'm sorry, something went wrong. Please try again.",
        false,
      );
    } finally {
      setIsLoading(false);
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Progress: assume ~7 exchanges to complete onboarding
  const progressPct = Math.min(Math.round((userMessageCount / 7) * 100), 95);

  return (
    <div style={styles.root}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logo}>Careerra</div>
        <div style={styles.badge}>Getting to know you</div>
      </div>

      {/* Progress bar */}
      <div style={styles.progressBar}>
        <div style={styles.progressTrack}>
          <div style={styles.progressFill(progressPct)} />
        </div>
        <div style={styles.progressLabel}>
          {progressPct < 95
            ? `Step ${Math.max(userMessageCount, 1)} of ~7 — Building your profile`
            : 'Almost done — finishing your profile…'}
        </div>
      </div>

      {/* Chat messages */}
      <div style={{ ...styles.chatContainer, flex: 1 }}>
        {messages.map((msg) => (
          <div key={msg.id} className="onboarding-msg" style={styles.messageRow(msg.isUser)}>
            {!msg.isUser && (
              <div style={styles.avatarBot}>C</div>
            )}
            <div style={msg.isUser ? styles.bubbleUser : styles.bubbleBot}>
              <ReactMarkdown
                components={{
                  p: ({ node, ...props }) => (
                    <p style={{ margin: '0 0 0.5em 0' }} {...props} />
                  ),
                  strong: ({ node, ...props }) => (
                    <strong style={{ color: '#c4b5fd' }} {...props} />
                  ),
                }}
              >
                {msg.content}
              </ReactMarkdown>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="onboarding-msg" style={styles.messageRow(false)}>
            <div style={styles.avatarBot}>C</div>
            <div style={styles.bubbleBot}>
              <div style={styles.typingDots}>
                <div style={styles.dot('0s')} />
                <div style={styles.dot('0.2s')} />
                <div style={styles.dot('0.4s')} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={styles.inputArea}>
        <textarea
          ref={textareaRef}
          style={styles.textarea}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your response…"
          rows={1}
          disabled={isLoading || onboardingDone}
        />
        <button
          style={styles.sendBtn(!inputValue.trim() || isLoading || onboardingDone)}
          onClick={() => handleSend()}
          disabled={!inputValue.trim() || isLoading || onboardingDone}
        >
          <ArrowUp size={16} />
        </button>
      </div>

      {/* Profile review modal */}
      {onboardingDone && profileData && (
        <ProfileReviewCard
          profile={profileData}
          onConfirm={() => onComplete(profileData)}
          onSkip={() => onComplete(profileData)}
        />
      )}
    </div>
  );
}
