'use client';

import React, { useState } from 'react';
import { ArrowRight, Lock, Mail, User as UserIcon } from 'lucide-react';
import {
  signInWithGoogle,
  signInWithGitHub,
  signInWithEmail,
  signUpWithEmail,
  resetPassword,
} from '../lib/firebase';

/* ---------- Tiny carrera-style logo ---------- */
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
      <span className="display" style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' }}>
        carrera
      </span>
    </div>
  );
}

/* ---------- Styled input row ---------- */
function AuthField({ icon, type = 'text', placeholder, value, onChange, required, name, autoComplete }) {
  const [focused, setFocused] = useState(false);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '14px 16px',
        borderRadius: 14,
        background: 'var(--crr-surface-2)',
        border: `1px solid ${focused ? 'var(--crr-accent)' : 'var(--crr-line)'}`,
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        boxShadow: focused ? '0 0 0 3px rgba(200,83,44,0.12)' : 'none',
      }}
    >
      <span style={{ color: 'var(--crr-text-faint)', display: 'flex' }}>{icon}</span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          flex: 1,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontSize: 15,
          color: 'var(--crr-text)',
          fontFamily: 'inherit',
        }}
      />
    </div>
  );
}

/* ---------- OAuth icon buttons ---------- */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.57 0-.28-.01-1.03-.02-2.03-3.34.73-4.04-1.61-4.04-1.61-.54-1.38-1.33-1.74-1.33-1.74-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.49 1 .11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 013-.4c1.02.005 2.04.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.65.24 2.87.12 3.17.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22 0 1.6-.01 2.9-.01 3.29 0 .32.21.69.83.57C20.57 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function OAuthButton({ icon, label, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1,
        justifyContent: 'center',
        padding: 12,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        borderRadius: 999,
        background: 'var(--crr-surface-2)',
        border: '1px solid var(--crr-line-strong)',
        color: 'var(--crr-text)',
        fontWeight: 500,
        fontSize: 14,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'background 0.2s ease',
        fontFamily: 'inherit',
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = 'var(--crr-surface-3)';
      }}
      onMouseLeave={(e) => {
        if (!disabled) e.currentTarget.style.background = 'var(--crr-surface-2)';
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

/* ---------- Page ---------- */
export default function AuthPage({ onAuthSuccess, onBack }) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const translateError = (err) => {
    const code = err?.code;
    if (code === 'auth/user-not-found') return 'No account found with this email';
    if (code === 'auth/wrong-password') return 'Incorrect password';
    if (code === 'auth/email-already-in-use') return 'An account with this email already exists';
    if (code === 'auth/invalid-email') return 'Invalid email address';
    if (code === 'auth/invalid-credential') return 'Invalid email or password';
    if (code === 'auth/account-exists-with-different-credential')
      return 'An account already exists with the same email. Try signing in with Google or email.';
    return err?.message || 'Something went wrong';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'reset') {
      setLoading(true);
      try {
        await resetPassword(email);
        setResetSent(true);
      } catch (err) {
        setError(translateError(err));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === 'signup' && password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, name);
      }
      onAuthSuccess?.();
    } catch (err) {
      setError(translateError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider) => {
    setError('');
    setLoading(true);
    try {
      if (provider === 'google') await signInWithGoogle();
      else await signInWithGitHub();
      onAuthSuccess?.();
    } catch (err) {
      setError(translateError(err));
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (next) => {
    setMode(next);
    setError('');
    setResetSent(false);
  };

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
      {/* Glows */}
      <div className="glow-field">
        <div className="crr-glow sky" style={{ width: 520, height: 520, left: -160, top: -100 }} />
        <div className="crr-glow sage" style={{ width: 440, height: 440, right: -100, top: 200, animationDelay: '2s' }} />
        <div className="crr-glow peach" style={{ width: 380, height: 380, left: '50%', bottom: -100, animationDelay: '4s' }} />
      </div>

      {/* Top bar */}
      <div style={{ padding: '20px 32px', display: 'flex', alignItems: 'center', position: 'relative', zIndex: 2 }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'transparent',
            border: 'none',
            cursor: onBack ? 'pointer' : 'default',
            padding: 0,
            fontFamily: 'inherit',
          }}
        >
          <Logo />
        </button>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px 32px 60px',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div
          className="crr-card crr-reveal"
          style={{ width: '100%', maxWidth: 440, padding: 36, boxShadow: 'var(--crr-shadow-lg)' }}
        >
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <h1 className="display" style={{ fontSize: 36, fontWeight: 400, margin: 0, letterSpacing: '-0.03em' }}>
              {mode === 'signin' && (
                <>
                  Welcome <span className="serif-accent" style={{ color: 'var(--crr-accent)' }}>back</span>.
                </>
              )}
              {mode === 'signup' && (
                <>
                  Begin <span className="serif-accent" style={{ color: 'var(--crr-accent)' }}>quietly</span>.
                </>
              )}
              {mode === 'reset' && (
                <>
                  Reset <span className="serif-accent" style={{ color: 'var(--crr-accent)' }}>access</span>.
                </>
              )}
            </h1>
            <p style={{ fontSize: 14.5, color: 'var(--crr-text-dim)', margin: '8px 0 0' }}>
              {mode === 'signin' && 'Pick up where you left off.'}
              {mode === 'signup' && 'Free to start. No credit card required.'}
              {mode === 'reset' && "We'll send you a link to reset your password."}
            </p>
          </div>

          {mode !== 'reset' && (
            <>
              <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
                <OAuthButton icon={<GoogleIcon />} label="Google" onClick={() => handleOAuth('google')} disabled={loading} />
                <OAuthButton icon={<GithubIcon />} label="GitHub" onClick={() => handleOAuth('github')} disabled={loading} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
                <div style={{ flex: 1, height: 1, background: 'var(--crr-line)' }} />
                <span className="eyebrow" style={{ fontSize: 12, color: 'var(--crr-text-faint)' }}>
                  or
                </span>
                <div style={{ flex: 1, height: 1, background: 'var(--crr-line)' }} />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {mode === 'signup' && (
              <AuthField
                icon={<UserIcon size={16} />}
                placeholder="Full name"
                value={name}
                onChange={setName}
                name="name"
                autoComplete="name"
                required
              />
            )}
            <AuthField
              icon={<Mail size={16} />}
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={setEmail}
              name="email"
              autoComplete="email"
              required
            />
            {mode !== 'reset' && (
              <AuthField
                icon={<Lock size={16} />}
                type="password"
                placeholder={mode === 'signup' ? 'Min 6 characters' : 'Password'}
                value={password}
                onChange={setPassword}
                name="password"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                required
              />
            )}
            {mode === 'signin' && (
              <button
                type="button"
                onClick={() => switchMode('reset')}
                style={{
                  alignSelf: 'flex-end',
                  fontSize: 13,
                  color: 'var(--crr-text-dim)',
                  padding: '4px 0',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Forgot password?
              </button>
            )}

            {error && (
              <div
                style={{
                  padding: '10px 14px',
                  background: 'rgba(200,83,44,0.08)',
                  border: '1px solid rgba(200,83,44,0.25)',
                  borderRadius: 12,
                  color: 'var(--crr-accent-deep)',
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                {error}
              </div>
            )}

            {resetSent && mode === 'reset' && (
              <div
                style={{
                  padding: '10px 14px',
                  background: 'rgba(159,184,154,0.18)',
                  border: '1px solid var(--sage)',
                  borderRadius: 12,
                  color: '#2d4a30',
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                Reset email sent to <strong>{email}</strong>.
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="crr-btn crr-btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: 14,
                fontSize: 15,
                marginTop: 6,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                'Working…'
              ) : (
                <>
                  {mode === 'signin' && <>Sign in <ArrowRight size={16} /></>}
                  {mode === 'signup' && <>Create your account <ArrowRight size={16} /></>}
                  {mode === 'reset' && <>Send reset link <ArrowRight size={16} /></>}
                </>
              )}
            </button>
          </form>

          <div
            style={{
              textAlign: 'center',
              marginTop: 22,
              fontSize: 13.5,
              color: 'var(--crr-text-dim)',
            }}
          >
            {mode === 'signin' && (
              <>
                New here?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  style={{
                    color: 'var(--crr-accent)',
                    fontWeight: 500,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                  }}
                >
                  Create an account
                </button>
              </>
            )}
            {mode === 'signup' && (
              <>
                Already have one?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  style={{
                    color: 'var(--crr-accent)',
                    fontWeight: 500,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                  }}
                >
                  Sign in
                </button>
              </>
            )}
            {mode === 'reset' && (
              <button
                type="button"
                onClick={() => switchMode('signin')}
                style={{
                  color: 'var(--crr-accent)',
                  fontWeight: 500,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                }}
              >
                Back to sign in
              </button>
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          padding: '24px 32px',
          textAlign: 'center',
          fontSize: 12.5,
          color: 'var(--crr-text-faint)',
          position: 'relative',
          zIndex: 2,
        }}
      >
        Free to start · No credit card required · Your conversations stay yours.
      </div>
    </div>
  );
}
