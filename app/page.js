'use client';

import { useState, useEffect } from 'react';
import ChatInterface from '../components/ChatInterface';
import LandingPage from '../components/LandingPage';
import AuthPage from '../components/AuthPage';
import { onAuthChange, signInWithGoogle } from '../lib/firebase';

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      if (firebaseUser) setShowAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#1a1a1a',
        color: '#ffffff'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  // Show chat interface if authenticated
  if (user) {
    return <ChatInterface />;
  }

  // Show auth page
  if (showAuth) {
    return <AuthPage onBack={() => setShowAuth(false)} />;
  }

  // Show landing page if not authenticated
  return <LandingPage onSignIn={() => setShowAuth(true)} />;
}
