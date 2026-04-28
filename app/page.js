'use client';

import { useState, useEffect, useRef } from 'react';
import ChatInterface from '../components/ChatInterface';
import LandingPage from '../components/LandingPage';
import AuthPage from '../components/AuthPage';
import OnboardingChat from '../components/OnboardingChat';
import { onAuthChange } from '../lib/firebase';
import apiService from '../lib/api';

const spinnerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: '#0f0f0f',
};

const ringStyle = {
    width: '36px',
    height: '36px',
    border: '3px solid rgba(255,255,255,0.1)',
    borderTop: '3px solid #a855f7',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
};

function Spinner() {
    return (
        <div style={spinnerStyle}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div style={ringStyle} />
        </div>
    );
}

export default function Home() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hasEntered, setHasEntered] = useState(false);
    const [showAuth, setShowAuth] = useState(false);
    const [onboardingComplete, setOnboardingComplete] = useState(null);
    const hadUserRef = useRef(false);

    useEffect(() => {
        const unsubscribe = onAuthChange(async (firebaseUser) => {
            if (firebaseUser) {
                hadUserRef.current = true;
                setUser(firebaseUser);
                setShowAuth(false);

                try {
                    const profileResponse = await apiService.getProfile();
                    const done = profileResponse?.profile?.onboarding_complete === true;
                    setOnboardingComplete(done);
                } catch (err) {
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

    if (!hasEntered) {
        return <LandingPage onSignIn={startFlow} onStart={startFlow} />;
    }

    if (loading || (user && onboardingComplete === null)) {
        return <Spinner />;
    }

    if (user) {
        if (!onboardingComplete) {
            return <OnboardingChat onComplete={() => setOnboardingComplete(true)} />;
        }
        return <ChatInterface />;
    }

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
