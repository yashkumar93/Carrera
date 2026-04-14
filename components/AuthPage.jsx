'use client';

import React, { useState } from 'react';
import { signInWithGoogle, signInWithGitHub, signInWithEmail, signUpWithEmail, resetPassword } from '../lib/firebase';

const AuthPage = ({ onAuthSuccess, onBack }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetSent, setResetSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await signInWithEmail(email, password);
            } else {
                if (password.length < 6) {
                    setError('Password must be at least 6 characters');
                    setLoading(false);
                    return;
                }
                await signUpWithEmail(email, password, name);
            }
            if (onAuthSuccess) onAuthSuccess();
        } catch (err) {
            const code = err.code;
            if (code === 'auth/user-not-found') setError('No account found with this email');
            else if (code === 'auth/wrong-password') setError('Incorrect password');
            else if (code === 'auth/email-already-in-use') setError('An account with this email already exists');
            else if (code === 'auth/invalid-email') setError('Invalid email address');
            else if (code === 'auth/invalid-credential') setError('Invalid email or password');
            else setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        setLoading(true);
        try {
            await signInWithGoogle();
            if (onAuthSuccess) onAuthSuccess();
        } catch (err) {
            setError('Google sign-in failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGitHubSignIn = async () => {
        setError('');
        setLoading(true);
        try {
            await signInWithGitHub();
            if (onAuthSuccess) onAuthSuccess();
        } catch (err) {
            if (err.code === 'auth/account-exists-with-different-credential') {
                setError('An account already exists with the same email. Try signing in with Google or email.');
            } else {
                setError('GitHub sign-in failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await resetPassword(resetEmail || email);
            setResetSent(true);
        } catch (err) {
            const code = err.code;
            if (code === 'auth/user-not-found') setError('No account found with this email');
            else if (code === 'auth/invalid-email') setError('Invalid email address');
            else setError(err.message || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    // ── Password reset screen ──────────────────────────────────────────────
    if (showResetPassword) {
        return (
            <div style={styles.page}>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <div style={styles.bgGlow1} />
                <div style={styles.bgGlow2} />
                <div style={styles.container}>
                    <button onClick={() => { setShowResetPassword(false); setResetSent(false); setError(''); }} style={styles.backBtn}>
                        ← Back to sign in
                    </button>
                    <div style={styles.logoSection}>
                        <div style={styles.logoIcon}>C</div>
                        <span style={styles.logoText}>Careerra</span>
                    </div>
                    <div style={styles.card}>
                        <h1 style={styles.heading}>Reset your password</h1>
                        <p style={styles.subheading}>
                            {resetSent
                                ? 'Check your inbox for a password reset link.'
                                : "Enter your email and we'll send you a reset link."}
                        </p>

                        {resetSent ? (
                            <div style={{
                                padding: '0.875rem 1rem',
                                background: '#f0fdf4',
                                border: '1px solid #bbf7d0',
                                borderRadius: '10px',
                                color: '#16a34a',
                                fontSize: '0.8125rem',
                                fontWeight: 500,
                                textAlign: 'center',
                            }}>
                                Reset email sent to <strong>{resetEmail || email}</strong>
                            </div>
                        ) : (
                            <form onSubmit={handlePasswordReset} style={styles.form}>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Email</label>
                                    <input
                                        type="email"
                                        value={resetEmail || email}
                                        onChange={(e) => setResetEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        style={styles.input}
                                        required
                                        onFocus={(e) => {
                                            e.target.style.borderColor = '#3B82F6';
                                            e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = '#e2e8f0';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>
                                {error && <div style={styles.errorMsg}>{error}</div>}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        ...styles.submitBtn,
                                        opacity: loading ? 0.7 : 1,
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    {loading ? <span style={styles.spinner} /> : 'Send Reset Link'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            {/* Spinner keyframes */}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            {/* Background decoration */}
            <div style={styles.bgGlow1} />
            <div style={styles.bgGlow2} />

            <div style={styles.container}>
                {/* Back button */}
                {onBack && (
                    <button onClick={onBack} style={styles.backBtn}>
                        ← Back
                    </button>
                )}

                {/* Logo */}
                <div style={styles.logoSection}>
                    <div style={styles.logoIcon}>C</div>
                    <span style={styles.logoText}>Careerra</span>
                </div>

                {/* Card */}
                <div style={styles.card}>
                    <h1 style={styles.heading}>
                        {isLogin ? 'Welcome back' : 'Create your account'}
                    </h1>
                    <p style={styles.subheading}>
                        {isLogin
                            ? 'Sign in to continue your career journey'
                            : 'Get started with your personalized career roadmap'}
                    </p>

                    {/* OAuth buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {/* Google Sign In */}
                        <button
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                            style={styles.oauthBtn}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#f1f5f9';
                                e.currentTarget.style.borderColor = '#cbd5e1';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#ffffff';
                                e.currentTarget.style.borderColor = '#e2e8f0';
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            <span>Continue with Google</span>
                        </button>

                        {/* GitHub Sign In */}
                        <button
                            onClick={handleGitHubSignIn}
                            disabled={loading}
                            style={styles.oauthBtn}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#f1f5f9';
                                e.currentTarget.style.borderColor = '#cbd5e1';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#ffffff';
                                e.currentTarget.style.borderColor = '#e2e8f0';
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="#1a1a1a" style={{ flexShrink: 0 }}>
                                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.57 0-.28-.01-1.03-.02-2.03-3.34.73-4.04-1.61-4.04-1.61-.54-1.38-1.33-1.74-1.33-1.74-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.49 1 .11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 013-.4c1.02.005 2.04.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.65.24 2.87.12 3.17.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22 0 1.6-.01 2.9-.01 3.29 0 .32.21.69.83.57C20.57 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
                            </svg>
                            <span>Continue with GitHub</span>
                        </button>
                    </div>

                    {/* Divider */}
                    <div style={styles.divider}>
                        <div style={styles.dividerLine} />
                        <span style={styles.dividerText}>or</span>
                        <div style={styles.dividerLine} />
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} style={styles.form}>
                        {!isLogin && (
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Full Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="John Doe"
                                    style={styles.input}
                                    required={!isLogin}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = '#3B82F6';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = '#e2e8f0';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                            </div>
                        )}

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                style={styles.input}
                                required
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#3B82F6';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#e2e8f0';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={isLogin ? '••••••••' : 'Min 6 characters'}
                                style={styles.input}
                                required
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#3B82F6';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#e2e8f0';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>

                        {isLogin && (
                            <div style={{ textAlign: 'right', marginTop: '-0.25rem' }}>
                                <button
                                    type="button"
                                    onClick={() => { setShowResetPassword(true); setResetEmail(email); setError(''); }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'oklch(0.62 0.14 39.04)',
                                        fontSize: '0.8125rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        padding: 0,
                                        fontFamily: 'inherit',
                                    }}
                                >
                                    Forgot password?
                                </button>
                            </div>
                        )}

                        {error && <div style={styles.errorMsg}>{error}</div>}

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                ...styles.submitBtn,
                                opacity: loading ? 0.7 : 1,
                                cursor: loading ? 'not-allowed' : 'pointer',
                            }}
                        >
                            {loading ? (
                                <span style={styles.spinner} />
                            ) : (
                                isLogin ? 'Sign In' : 'Create Account'
                            )}
                        </button>
                    </form>

                    {/* Toggle */}
                    <p style={styles.toggleText}>
                        {isLogin ? "Don't have an account? " : 'Already have an account? '}
                        <button
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError('');
                            }}
                            style={styles.toggleBtn}
                        >
                            {isLogin ? 'Sign up' : 'Sign in'}
                        </button>
                    </p>
                </div>

                {/* Footer */}
                <p style={styles.footer}>
                    Free to start · No credit card required
                </p>
            </div>
        </div>
    );
};

const styles = {
    page: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    },
    bgGlow1: {
        position: 'absolute',
        top: '-200px',
        right: '-200px',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
    },
    bgGlow2: {
        position: 'absolute',
        bottom: '-150px',
        left: '-150px',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
    },
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        maxWidth: '420px',
        padding: '2rem 1.5rem',
        position: 'relative',
        zIndex: 1,
    },
    logoSection: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem',
        marginBottom: '2rem',
    },
    logoIcon: {
        width: '40px',
        height: '40px',
        background: 'oklch(0.62 0.14 39.04)',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        fontWeight: 800,
        fontSize: '1.125rem',
    },
    logoText: {
        fontSize: '1.5rem',
        fontWeight: 800,
        color: '#0F172A',
        letterSpacing: '-0.02em',
    },
    card: {
        width: '100%',
        background: '#ffffff',
        borderRadius: '24px',
        border: '1px solid #e2e8f0',
        padding: '2rem',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
    },
    heading: {
        fontSize: '1.5rem',
        fontWeight: 800,
        color: '#0F172A',
        marginBottom: '0.375rem',
        letterSpacing: '-0.02em',
        margin: '0 0 0.375rem 0',
    },
    subheading: {
        fontSize: '0.875rem',
        color: '#64748b',
        marginBottom: '1.5rem',
        lineHeight: 1.5,
        fontWeight: 500,
        margin: '0 0 1.5rem 0',
    },
    googleBtn: {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        fontSize: '0.875rem',
        fontWeight: 600,
        color: '#1e293b',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        fontFamily: 'inherit',
    },
    oauthBtn: {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        fontSize: '0.875rem',
        fontWeight: 600,
        color: '#1e293b',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        fontFamily: 'inherit',
    },
    divider: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        margin: '1.5rem 0',
    },
    dividerLine: {
        flex: 1,
        height: '1px',
        background: '#e2e8f0',
    },
    dividerText: {
        fontSize: '0.75rem',
        color: '#94a3b8',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.375rem',
    },
    label: {
        fontSize: '0.8125rem',
        fontWeight: 600,
        color: '#334155',
    },
    input: {
        width: '100%',
        padding: '0.75rem 1rem',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        fontSize: '0.875rem',
        color: '#0f172a',
        background: '#f8fafc',
        outline: 'none',
        transition: 'all 0.15s ease',
        fontFamily: 'inherit',
        boxSizing: 'border-box',
    },
    errorMsg: {
        padding: '0.75rem 1rem',
        background: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '10px',
        color: '#dc2626',
        fontSize: '0.8125rem',
        fontWeight: 500,
    },
    submitBtn: {
        width: '100%',
        padding: '0.875rem 1rem',
        background: 'oklch(0.62 0.14 39.04)',
        color: '#ffffff',
        border: 'none',
        borderRadius: '12px',
        fontSize: '0.9375rem',
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        fontFamily: 'inherit',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: '0.25rem',
    },
    spinner: {
        width: '20px',
        height: '20px',
        border: '2px solid rgba(255,255,255,0.3)',
        borderTopColor: '#ffffff',
        borderRadius: '50%',
        display: 'inline-block',
        animation: 'spin 0.6s linear infinite',
    },
    toggleText: {
        textAlign: 'center',
        fontSize: '0.8125rem',
        color: '#64748b',
        marginTop: '1.5rem',
        marginBottom: 0,
        fontWeight: 500,
    },
    toggleBtn: {
        background: 'none',
        border: 'none',
        color: 'oklch(0.62 0.14 39.04)',
        fontWeight: 700,
        cursor: 'pointer',
        fontSize: '0.8125rem',
        padding: 0,
        fontFamily: 'inherit',
    },
    footer: {
        marginTop: '1.5rem',
        fontSize: '0.75rem',
        color: '#94a3b8',
        fontWeight: 600,
    },
    backBtn: {
        alignSelf: 'flex-start',
        display: 'flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.5rem 0.75rem',
        background: 'transparent',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        fontSize: '0.8125rem',
        fontWeight: 600,
        color: '#64748b',
        cursor: 'pointer',
        marginBottom: '1rem',
        transition: 'all 0.15s ease',
        fontFamily: 'inherit',
    },
};

export default AuthPage;
