'use client';

import { useState, useEffect } from 'react';
import ChatInterface from '../components/ChatInterface';
import LandingPage from '../components/LandingPage';
import { onAuthChange, signInWithGoogle } from '../lib/firebase';

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };

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

  // Show landing page if not authenticated
  if (!user) {
    return <LandingPage onSignIn={handleSignIn} />;
  }

  // Show chat interface if authenticated
  return <ChatInterface />;
}
