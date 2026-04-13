'use client';

import { useState } from 'react';
import apiService from '../lib/api';

const PHASES = { SETUP: 'setup', QUIZ: 'quiz', SCORING: 'scoring', RESULTS: 'results' };

export default function AptitudeAssessment({ onClose }) {
  const [phase, setPhase] = useState(PHASES.SETUP);
  const [career, setCareer] = useState('');
  const [numQuestions, setNumQuestions] = useState(12);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function startAssessment() {
    if (!career.trim()) { setError('Please enter a career name.'); return; }
    setError(null);
    setLoading(true);
    try {
      const data = await apiService.generateAssessment(career.trim(), numQuestions);
      setQuestions(data.questions || []);
      setAnswers({});
      setCurrentQ(0);
      setPhase(PHASES.QUIZ);
    } catch (e) {
      setError(e.message || 'Failed to generate assessment. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function selectAnswer(questionId, option) {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  }

  function next() {
    if (currentQ < questions.length - 1) setCurrentQ(q => q + 1);
  }

  function prev() {
    if (currentQ > 0) setCurrentQ(q => q - 1);
  }

  async function submitAnswers() {
    setPhase(PHASES.SCORING);
    setLoading(true);
    try {
      const answerList = Object.entries(answers).map(([id, answer]) => ({
        question_id: parseInt(id),
        answer,
      }));
      const data = await apiService.scoreAssessment(career, questions, answerList);
      setResult(data);
      setPhase(PHASES.RESULTS);
    } catch (e) {
      setError(e.message || 'Failed to score assessment.');
      setPhase(PHASES.QUIZ);
    } finally {
      setLoading(false);
    }
  }

  const answeredCount = Object.keys(answers).length;
  const progress = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0;

  const s = {
    overlay: {
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      padding: '1rem',
    },
    modal: {
      background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: '16px',
      width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto',
      padding: '2rem', fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
      color: '#fff',
    },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
    title: { fontSize: '1.3rem', fontWeight: 700, color: '#a855f7' },
    closeBtn: { background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '1.3rem' },
    label: { display: 'block', color: '#888', fontSize: '0.8rem', marginBottom: '0.4rem' },
    input: {
      width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px',
      padding: '0.65rem 0.9rem', color: '#fff', fontSize: '0.9rem', outline: 'none',
      boxSizing: 'border-box',
    },
    primaryBtn: {
      background: '#a855f7', color: '#fff', border: 'none', borderRadius: '8px',
      padding: '0.7rem 1.5rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem',
      marginTop: '1.2rem', width: '100%',
    },
    secondaryBtn: {
      background: '#1a1a1a', color: '#aaa', border: '1px solid #2a2a2a', borderRadius: '8px',
      padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem',
    },
    error: { color: '#f87171', fontSize: '0.85rem', marginTop: '0.5rem' },
    progressBar: { background: '#1a1a1a', borderRadius: '20px', height: '6px', marginBottom: '1.5rem', overflow: 'hidden' },
    progressFill: { background: '#a855f7', height: '100%', borderRadius: '20px', transition: 'width 0.3s ease' },
    qNum: { color: '#555', fontSize: '0.78rem', marginBottom: '0.5rem' },
    qType: { display: 'inline-block', padding: '0.15rem 0.55rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, marginBottom: '0.75rem' },
    question: { fontSize: '1rem', fontWeight: 600, color: '#fff', marginBottom: '1.2rem', lineHeight: 1.5 },
    option: (selected) => ({
      display: 'block', width: '100%', textAlign: 'left',
      padding: '0.75rem 1rem', marginBottom: '0.5rem', borderRadius: '8px',
      border: `1px solid ${selected ? '#a855f7' : '#2a2a2a'}`,
      background: selected ? 'rgba(168,85,247,0.12)' : '#111',
      color: selected ? '#e9d5ff' : '#ccc',
      cursor: 'pointer', fontSize: '0.88rem', fontWeight: selected ? 600 : 400,
      transition: 'all 0.15s',
    }),
    navRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' },
    fitBadge: (fit) => ({
      display: 'inline-block', padding: '0.4rem 1rem', borderRadius: '20px', fontWeight: 700, fontSize: '0.85rem',
      background: fit === 'Strong Fit' ? '#166534' : fit === 'Moderate Fit' ? '#854d0e' : fit === 'Needs Development' ? '#7c2d12' : '#1f2937',
      color: '#fff', marginBottom: '0.5rem',
    }),
    scoreCircle: { fontSize: '3rem', fontWeight: 900, color: '#a855f7', textAlign: 'center' },
    section: { marginBottom: '1.2rem' },
    sectionTitle: { color: '#888', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' },
    pill: (color) => ({ display: 'inline-block', background: color, padding: '0.2rem 0.65rem', borderRadius: '20px', fontSize: '0.75rem', margin: '0.15rem', color: '#fff' }),
    skillRow: { display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #1a1a1a', fontSize: '0.85rem' },
    skillBar: { background: '#1a1a1a', borderRadius: '20px', height: '5px', flex: 1, margin: '0 0.75rem', overflow: 'hidden', alignSelf: 'center' },
    skillFill: (pct, level) => ({
      height: '100%', borderRadius: '20px',
      background: level === 'Strong' ? '#4ade80' : level === 'Moderate' ? '#facc15' : '#f87171',
      width: `${pct}%`, transition: 'width 0.4s ease',
    }),
    actionBox: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '0.8rem', marginTop: '0.5rem', fontSize: '0.85rem' },
  };

  const typeColors = { technical: '#1d4ed8', soft_skill: '#0f766e', situational: '#7c3aed' };

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose?.()}>
      <div style={s.modal}>
        <div style={s.header}>
          <div style={s.title}>Aptitude Assessment</div>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* ── SETUP ── */}
        {phase === PHASES.SETUP && (
          <>
            <p style={{ color: '#888', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
              Take a personalised quiz to discover how well you match a target career. Gemini AI will generate relevant questions and score your responses.
            </p>
            <label style={s.label}>Target Career *</label>
            <input
              style={s.input}
              placeholder="e.g. Data Scientist, UX Designer, Software Engineer"
              value={career}
              onChange={e => setCareer(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && startAssessment()}
            />

            <label style={{ ...s.label, marginTop: '1rem' }}>Number of Questions</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[5, 10, 12, 15].map(n => (
                <button
                  key={n}
                  style={{ ...s.secondaryBtn, background: numQuestions === n ? '#a855f7' : '#1a1a1a', color: numQuestions === n ? '#fff' : '#aaa', borderColor: numQuestions === n ? '#a855f7' : '#2a2a2a' }}
                  onClick={() => setNumQuestions(n)}
                >
                  {n}
                </button>
              ))}
            </div>

            {error && <div style={s.error}>{error}</div>}
            <button style={s.primaryBtn} onClick={startAssessment} disabled={loading}>
              {loading ? 'Generating questions...' : 'Start Assessment'}
            </button>
          </>
        )}

        {/* ── QUIZ ── */}
        {phase === PHASES.QUIZ && questions.length > 0 && (
          <>
            <div style={s.progressBar}>
              <div style={{ ...s.progressFill, width: `${progress}%` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.78rem', color: '#555' }}>
              <span>Question {currentQ + 1} of {questions.length}</span>
              <span>{answeredCount} answered</span>
            </div>

            {(() => {
              const q = questions[currentQ];
              if (!q) return null;
              return (
                <>
                  <div style={s.qNum}>Q{q.id} · {q.skill_area}</div>
                  <span style={{ ...s.qType, background: typeColors[q.type] || '#333', color: '#fff' }}>{q.type}</span>
                  <div style={s.question}>{q.question}</div>
                  {(q.options || []).map(opt => (
                    <button
                      key={opt}
                      style={s.option(answers[q.id] === opt)}
                      onClick={() => selectAnswer(q.id, opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </>
              );
            })()}

            <div style={s.navRow}>
              <button style={s.secondaryBtn} onClick={prev} disabled={currentQ === 0}>← Back</button>
              {currentQ < questions.length - 1
                ? <button style={s.secondaryBtn} onClick={next}>Next →</button>
                : <button
                    style={{ ...s.primaryBtn, width: 'auto', marginTop: 0 }}
                    onClick={submitAnswers}
                    disabled={answeredCount < Math.ceil(questions.length * 0.8)}
                  >
                    Submit ({answeredCount}/{questions.length} answered)
                  </button>
              }
            </div>
            {error && <div style={s.error}>{error}</div>}
          </>
        )}

        {/* ── SCORING ── */}
        {phase === PHASES.SCORING && (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: '#888' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🧠</div>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Scoring your responses...</div>
            <div style={{ fontSize: '0.85rem' }}>Gemini AI is generating your skill gap report</div>
          </div>
        )}

        {/* ── RESULTS ── */}
        {phase === PHASES.RESULTS && result && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={s.scoreCircle}>{result.score_percent?.toFixed(0)}%</div>
              <div style={{ color: '#888', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{result.correct_count} / {result.total_questions} correct</div>
              <span style={s.fitBadge(result.fit_level)}>{result.fit_level}</span>
            </div>

            <div style={s.section}>
              <div style={s.sectionTitle}>Summary</div>
              <p style={{ color: '#ccc', fontSize: '0.88rem', lineHeight: 1.6 }}>{result.summary}</p>
            </div>

            {result.skill_scores && Object.keys(result.skill_scores).length > 0 && (
              <div style={s.section}>
                <div style={s.sectionTitle}>Skill Breakdown</div>
                {Object.entries(result.skill_scores).map(([area, data]) => (
                  <div key={area} style={s.skillRow}>
                    <span style={{ color: '#ccc', width: '160px', flexShrink: 0 }}>{area}</span>
                    <div style={s.skillBar}>
                      <div style={s.skillFill(data.score, data.level)} />
                    </div>
                    <span style={{ color: data.level === 'Strong' ? '#4ade80' : data.level === 'Moderate' ? '#facc15' : '#f87171', width: '70px', textAlign: 'right', fontSize: '0.78rem' }}>
                      {data.score?.toFixed(0)}% {data.level}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              {(result.strengths || []).length > 0 && (
                <div style={s.section}>
                  <div style={s.sectionTitle}>Strengths</div>
                  {result.strengths.map((s_, i) => <div key={i} style={s.pill('#166534')}>{s_}</div>)}
                </div>
              )}
              {(result.gaps || []).length > 0 && (
                <div style={s.section}>
                  <div style={s.sectionTitle}>Skill Gaps</div>
                  {result.gaps.map((g, i) => <div key={i} style={s.pill('#7c2d12')}>{g}</div>)}
                </div>
              )}
            </div>

            {(result.priority_learning || []).length > 0 && (
              <div style={s.section}>
                <div style={s.sectionTitle}>Priority Learning Actions</div>
                {result.priority_learning.map((item, i) => (
                  <div key={i} style={s.actionBox}>
                    <div style={{ fontWeight: 700, color: '#c084fc', marginBottom: '0.25rem' }}>{item.area}</div>
                    <div style={{ color: '#ccc', marginBottom: '0.25rem' }}>{item.action}</div>
                    {(item.resources || []).length > 0 && (
                      <div style={{ color: '#555', fontSize: '0.78rem' }}>Resources: {item.resources.join(' · ')}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {result.recommended_next_step && (
              <div style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid #4c1d95', borderRadius: '8px', padding: '0.9rem', marginBottom: '1rem' }}>
                <div style={{ color: '#c084fc', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>Recommended Next Step</div>
                <div style={{ color: '#e9d5ff', fontSize: '0.88rem' }}>{result.recommended_next_step}</div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button style={{ ...s.primaryBtn, marginTop: 0, flex: 1 }} onClick={() => { setPhase(PHASES.SETUP); setResult(null); setCareer(''); }}>
                Take Another Assessment
              </button>
              <button style={{ ...s.secondaryBtn, flex: 1 }} onClick={onClose}>Done</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
