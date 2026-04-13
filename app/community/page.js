'use client';

import { useState, useEffect } from 'react';
import { onAuthChange } from '../../lib/firebase';
import apiService from '../../lib/api';

const TAGS = [
  'All', 'career-advice', 'tech', 'data-science', 'design', 'finance',
  'entrepreneurship', 'certifications', 'internships', 'salary',
  'study-tips', 'interview-prep', 'general',
];

function timeAgo(ts) {
  if (!ts) return '';
  const now = Date.now();
  const then = ts._seconds ? ts._seconds * 1000 : new Date(ts).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function CommunityPage() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState('All');
  const [selectedPost, setSelectedPost] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', tags: ['general'] });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [votedIds, setVotedIds] = useState(new Set());

  useEffect(() => {
    const unsub = onAuthChange(async (u) => {
      if (u) {
        setUser(u);
        await loadPosts();
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function loadPosts(tag = null) {
    setLoading(true);
    try {
      const data = await apiService.listPosts(tag, 30);
      setPosts(data.posts || []);
    } catch (e) { /* silent */ }
    setLoading(false);
  }

  async function filterByTag(tag) {
    setActiveTag(tag);
    await loadPosts(tag === 'All' ? null : tag);
  }

  async function openPost(post) {
    const full = await apiService.getPost(post.id);
    setSelectedPost(full);
    setReplyText('');
  }

  async function submitReply() {
    if (!replyText.trim() || !selectedPost) return;
    setSubmitting(true);
    try {
      await apiService.addReply(selectedPost.id, replyText.trim());
      const full = await apiService.getPost(selectedPost.id);
      setSelectedPost(full);
      setReplyText('');
      // Update reply count in list
      setPosts(prev => prev.map(p => p.id === selectedPost.id ? { ...p, reply_count: (p.reply_count || 0) + 1 } : p));
      showToast('Reply posted');
    } catch (e) { showToast('Failed to post reply', true); }
    setSubmitting(false);
  }

  async function submitNewPost() {
    if (!newPost.title.trim() || !newPost.content.trim()) return;
    setSubmitting(true);
    try {
      await apiService.createPost(newPost.title, newPost.content, newPost.tags);
      setShowNewPost(false);
      setNewPost({ title: '', content: '', tags: ['general'] });
      await loadPosts(activeTag === 'All' ? null : activeTag);
      showToast('Post created!');
    } catch (e) { showToast(e.message || 'Failed to create post', true); }
    setSubmitting(false);
  }

  async function handleVote(postId, e) {
    e.stopPropagation();
    try {
      const res = await apiService.votePost(postId);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, upvotes: res.upvotes } : p));
      if (selectedPost?.id === postId) setSelectedPost(s => ({ ...s, upvotes: res.upvotes }));
      setVotedIds(prev => {
        const n = new Set(prev);
        n.has(postId) ? n.delete(postId) : n.add(postId);
        return n;
      });
    } catch (e) { /* silent */ }
  }

  function toggleTag(tag) {
    setNewPost(p => ({
      ...p,
      tags: p.tags.includes(tag) ? p.tags.filter(t => t !== tag) : [...p.tags.slice(0, 2), tag],
    }));
  }

  function showToast(msg, err = false) {
    setToast({ msg, err });
    setTimeout(() => setToast(null), 3000);
  }

  const s = {
    page: { minHeight: '100vh', background: '#0f0f0f', color: '#fff', fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif", padding: '2rem' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
    title: { fontSize: '1.8rem', fontWeight: 700, color: '#a855f7', margin: 0 },
    subtitle: { color: '#888', marginTop: '0.3rem', fontSize: '0.9rem' },
    primaryBtn: { background: '#a855f7', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.6rem 1.2rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' },
    secondaryBtn: { background: '#1a1a1a', color: '#aaa', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' },
    filters: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' },
    pill: (active) => ({ padding: '0.3rem 0.85rem', borderRadius: '20px', border: `1px solid ${active ? '#a855f7' : '#2a2a2a'}`, background: active ? 'rgba(168,85,247,0.15)' : 'transparent', color: active ? '#c084fc' : '#666', cursor: 'pointer', fontSize: '0.78rem', fontWeight: active ? 700 : 400 }),
    card: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '1rem 1.2rem', marginBottom: '0.75rem', cursor: 'pointer', transition: 'border-color 0.15s' },
    postTitle: { fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.35rem', color: '#e5e7eb' },
    postContent: { color: '#888', fontSize: '0.82rem', lineHeight: 1.5, marginBottom: '0.6rem' },
    postMeta: { display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#555', alignItems: 'center', flexWrap: 'wrap' },
    voteBtn: (voted) => ({ background: 'none', border: `1px solid ${voted ? '#a855f7' : '#333'}`, borderRadius: '6px', color: voted ? '#c084fc' : '#666', cursor: 'pointer', padding: '0.2rem 0.6rem', fontSize: '0.75rem', fontWeight: voted ? 700 : 400 }),
    tagChip: { display: 'inline-block', background: '#111', border: '1px solid #2a2a2a', color: '#555', borderRadius: '20px', padding: '0.1rem 0.5rem', fontSize: '0.68rem' },
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' },
    modal: { background: '#111', border: '1px solid #2a2a2a', borderRadius: '16px', width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
    closeBtn: { background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '1.3rem' },
    label: { display: 'block', color: '#888', fontSize: '0.78rem', marginBottom: '0.35rem', marginTop: '0.9rem' },
    input: { width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', padding: '0.6rem 0.9rem', color: '#fff', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' },
    textarea: { width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', padding: '0.6rem 0.9rem', color: '#fff', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', resize: 'vertical', minHeight: '80px' },
    reply: { background: '#1a1a1a', borderRadius: '8px', padding: '0.75rem', marginBottom: '0.5rem', fontSize: '0.85rem' },
    replyAuthor: { color: '#a855f7', fontWeight: 600, fontSize: '0.78rem', marginBottom: '0.25rem' },
    toast: (err) => ({ position: 'fixed', bottom: '2rem', right: '2rem', background: err ? '#7f1d1d' : '#166534', color: '#fff', padding: '0.75rem 1.2rem', borderRadius: '8px', fontWeight: 600, zIndex: 9999 }),
  };

  return (
    <div style={s.page}>
      {toast && <div style={s.toast(toast.err)}>{toast.msg}</div>}

      <div style={s.header}>
        <div>
          <h1 style={s.title}>Community Forum</h1>
          <p style={s.subtitle}>Ask questions, share experiences, help each other grow</p>
        </div>
        <button style={s.primaryBtn} onClick={() => setShowNewPost(true)}>+ New Post</button>
      </div>

      <div style={s.filters}>
        {TAGS.map(t => (
          <button key={t} style={s.pill(activeTag === t)} onClick={() => filterByTag(t)}>{t}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: '#555', padding: '2rem' }}>Loading posts...</div>
      ) : posts.length === 0 ? (
        <div style={{ color: '#555', padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</div>
          No posts yet. Be the first to ask something!
        </div>
      ) : (
        posts.map(post => (
          <div key={post.id} style={s.card} onClick={() => openPost(post)}
            onMouseOver={e => e.currentTarget.style.borderColor = '#a855f7'}
            onMouseOut={e => e.currentTarget.style.borderColor = '#2a2a2a'}>
            <div style={s.postTitle}>{post.title}</div>
            <div style={s.postContent}>{post.content?.slice(0, 140)}{post.content?.length > 140 ? '...' : ''}</div>
            <div style={s.postMeta}>
              <button style={s.voteBtn(votedIds.has(post.id))} onClick={e => handleVote(post.id, e)}>
                ▲ {post.upvotes || 0}
              </button>
              <span>💬 {post.reply_count || 0} replies</span>
              <span>{timeAgo(post.createdAt)}</span>
              <span>by {post.author_name || 'Anonymous'}</span>
              {(post.tags || []).map(t => <span key={t} style={s.tagChip}>{t}</span>)}
            </div>
          </div>
        ))
      )}

      {/* Post detail modal */}
      {selectedPost && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setSelectedPost(null)}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#e5e7eb', flex: 1, paddingRight: '1rem' }}>{selectedPost.title}</div>
              <button style={s.closeBtn} onClick={() => setSelectedPost(null)}>✕</button>
            </div>
            <div style={{ color: '#aaa', fontSize: '0.75rem', marginBottom: '1rem' }}>
              by {selectedPost.author_name || 'Anonymous'} · {timeAgo(selectedPost.createdAt)} · {(selectedPost.tags || []).map(t => <span key={t} style={{ ...s.tagChip, marginRight: '0.3rem' }}>{t}</span>)}
            </div>
            <p style={{ color: '#ccc', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '1.5rem', whiteSpace: 'pre-wrap' }}>{selectedPost.content}</p>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <button style={s.voteBtn(votedIds.has(selectedPost.id))} onClick={e => handleVote(selectedPost.id, e)}>▲ {selectedPost.upvotes || 0} upvotes</button>
            </div>

            <div style={{ borderTop: '1px solid #2a2a2a', paddingTop: '1rem', marginBottom: '1rem' }}>
              <div style={{ color: '#888', fontSize: '0.78rem', marginBottom: '0.75rem' }}>{(selectedPost.replies || []).length} replies</div>
              {(selectedPost.replies || []).map(r => (
                <div key={r.id} style={s.reply}>
                  <div style={s.replyAuthor}>{r.author_id?.slice(0, 8)}…</div>
                  <div style={{ color: '#ccc', lineHeight: 1.5 }}>{r.content}</div>
                  <div style={{ color: '#555', fontSize: '0.72rem', marginTop: '0.3rem' }}>{timeAgo(r.createdAt)}</div>
                </div>
              ))}
            </div>

            <label style={s.label}>Add a reply</label>
            <textarea style={s.textarea} value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Share your thoughts or advice..." />
            <button style={{ ...s.primaryBtn, marginTop: '0.75rem', width: '100%' }} onClick={submitReply} disabled={submitting || !replyText.trim()}>
              {submitting ? 'Posting...' : 'Post Reply'}
            </button>
          </div>
        </div>
      )}

      {/* New post modal */}
      {showNewPost && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setShowNewPost(false)}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#a855f7' }}>New Post</div>
              <button style={s.closeBtn} onClick={() => setShowNewPost(false)}>✕</button>
            </div>
            <label style={s.label}>Title *</label>
            <input style={s.input} value={newPost.title} onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))} placeholder="What's your question or topic?" />
            <label style={s.label}>Content *</label>
            <textarea style={{ ...s.textarea, minHeight: '120px' }} value={newPost.content} onChange={e => setNewPost(p => ({ ...p, content: e.target.value }))} placeholder="Share details, context, or what you've already tried..." />
            <label style={s.label}>Tags (select up to 3)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {TAGS.slice(1).map(t => (
                <button key={t} type="button" style={s.pill(newPost.tags.includes(t))} onClick={() => toggleTag(t)}>{t}</button>
              ))}
            </div>
            <button style={{ ...s.primaryBtn, width: '100%', marginTop: '1.2rem' }} onClick={submitNewPost} disabled={submitting || !newPost.title.trim() || !newPost.content.trim()}>
              {submitting ? 'Posting...' : 'Publish Post'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
