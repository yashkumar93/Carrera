'use client';

import React, { useState } from 'react';
import { signInWithGoogle } from '../lib/firebase';

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
      <span className="display" style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' }}>
        carrera
      </span>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export default function AuthPage({ onAuthSuccess, onBack }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      onAuthSuccess?.();
    } catch (err) {
      const code = err?.code;
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        // user dismissed — not an error
      } else if (code === 'auth/unauthorized-domain') {
        setError(
          'This domain is not authorised in Firebase. Add it under Authentication → Settings → Authorised domains in the Firebase Console.',
        );
      } else {
        setError(err?.message || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
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
        <div className="crr-glow sky"   style={{ width: 520, height: 520, left: -160, top: -100 }} />
        <div className="crr-glow sage"  style={{ width: 440, height: 440, right: -100, top: 200, animationDelay: '2s' }} />
        <div className="crr-glow peach" style={{ width: 380, height: 380, left: '50%', bottom: -100, animationDelay: '4s' }} />
      </div>

      {/* Top bar */}
      <div style={{ padding: '20px 32px', display: 'flex', alignItems: 'center', position: 'relative', zIndex: 2 }}>
        <button
          type="button"
          onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <Logo />
        </button>
      </div>

      {/* Card */}
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
          style={{ width: '100%', maxWidth: 400, padding: 36, boxShadow: 'var(--crr-shadow-lg)', textAlign: 'center' }}
        >
          {/* Logo repeated inside card */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: 'linear-gradient(135deg, var(--crr-accent), var(--peach))',
                display: 'grid',
                placeItems: 'center',
                boxShadow: '0 6px 18px -6px var(--crr-accent)',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 3v18" />
                <path d="m5 10 7-7 7 7" />
                <circle cx="12" cy="17" r="2" />
              </svg>
            </div>
          </div>

          <h1 className="display" style={{ fontSize: 32, fontWeight: 400, margin: 0, letterSpacing: '-0.03em' }}>
            Welcome to{' '}
            <span className="serif-accent" style={{ color: 'var(--crr-accent)' }}>
              carrera
            </span>
            .
          </h1>
          <p style={{ fontSize: 14.5, color: 'var(--crr-text-dim)', margin: '10px 0 28px' }}>
            A quiet mentor for loud career questions.
          </p>

          {error && (
            <div
              style={{
                padding: '10px 14px',
                marginBottom: 18,
                background: 'rgba(200,83,44,0.08)',
                border: '1px solid rgba(200,83,44,0.25)',
                borderRadius: 12,
                color: 'var(--crr-accent-deep)',
                fontSize: 13,
                textAlign: 'left',
                lineHeight: 1.5,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              padding: '14px 20px',
              borderRadius: 999,
              background: loading ? 'var(--crr-surface-3)' : 'var(--crr-surface-2)',
              border: '1px solid var(--crr-line-strong)',
              color: 'var(--crr-text)',
              fontWeight: 500,
              fontSize: 15,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'background 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease',
              fontFamily: 'inherit',
              boxShadow: 'var(--crr-shadow-sm)',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = 'var(--crr-surface-3)';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = 'var(--crr-shadow)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--crr-surface-2)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--crr-shadow-sm)';
            }}
          >
            {loading ? (
              <>
                <span
                  style={{
                    width: 20,
                    height: 20,
                    border: '2px solid var(--crr-line-strong)',
                    borderTopColor: 'var(--crr-accent)',
                    borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite',
                    flexShrink: 0,
                  }}
                />
                Signing in…
              </>
            ) : (
              <>
                <GoogleIcon />
                Continue with Google
              </>
            )}
          </button>

          <p style={{ marginTop: 20, fontSize: 12.5, color: 'var(--crr-text-faint)', lineHeight: 1.55 }}>
            By signing in you agree to our{' '}
            <a href="#" style={{ color: 'var(--crr-text-dim)', textDecoration: 'underline' }}>Terms</a>
            {' '}and{' '}
            <a href="#" style={{ color: 'var(--crr-text-dim)', textDecoration: 'underline' }}>Privacy Policy</a>.
          </p>
        </div>
      </div>

      <div style={{ padding: '24px 32px', textAlign: 'center', fontSize: 12.5, color: 'var(--crr-text-faint)', position: 'relative', zIndex: 2 }}>
        Free to start · No credit card required · Your conversations stay yours.
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
