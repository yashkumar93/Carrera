'use client';

import { useState, useEffect, useRef } from 'react';
import ChatInterface from '../components/ChatInterface';
import LandingPage from '../components/LandingPage';
import AuthPage from '../components/AuthPage';
import OnboardingChat from '../components/OnboardingChat';
import { onAuthChange } from '../lib/firebase';
import apiService from '../lib/api';

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasEntered, setHasEntered] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  // null = not yet checked, false = needs onboarding, true = done
  const [onboardingComplete, setOnboardingComplete] = useState(null);
  const hadUserRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        hadUserRef.current = true;
        setUser(firebaseUser);
        setShowAuth(false);

        // Check whether this user has completed onboarding
        try {
          const profileResponse = await apiService.getProfile();
          const done = profileResponse?.profile?.onboarding_complete === true;
          setOnboardingComplete(done);
        } catch (err) {
          // If profile check fails, skip onboarding so users aren't blocked
          console.warn('Could not check onboarding status:', err);
          setOnboardingComplete(true);
        }
      } else {
        setUser(null);
        setOnboardingComplete(null);
        if (hadUserRef.current) {
          setHasEntered(false);
          setShowAuth(false);
          hadUserRef.current = false;
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const startFlow = () => {
    setHasEntered(true);
    setShowAuth(!user);
  };

  // ── Landing entry ────────────────────────────────────────────────────────────
  if (!hasEntered) {
    return <LandingPage onSignIn={startFlow} onStart={startFlow} />;
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#0f0f0f',
        color: '#ffffff',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '36px',
            height: '36px',
            border: '3px solid rgba(255,255,255,0.1)',
            borderTop: '3px solid #a855f7',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 1rem',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // ── Authenticated ────────────────────────────────────────────────────────────
  if (user) {
    // Still checking onboarding status
    if (onboardingComplete === null) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: '#0f0f0f',
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid rgba(255,255,255,0.1)',
            borderTop: '3px solid #a855f7',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      );
    }

    // New user — show onboarding
    if (!onboardingComplete) {
      return (
        <OnboardingChat
          onComplete={() => setOnboardingComplete(true)}
        />
      );
    }

    // Returning user — main chat
    return <ChatInterface />;
  }

  // ── Unauthenticated ──────────────────────────────────────────────────────────
  if (showAuth) {
    return (
      <AuthPage
        onBack={() => {
          setShowAuth(false);
          setHasEntered(false);
        }}
      />
    );
  }

  return <LandingPage onSignIn={startFlow} onStart={startFlow} />;
}
