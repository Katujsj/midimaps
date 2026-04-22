'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/auth-context';
import type { IComment } from '@/types';

function timeAgo(date: string) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60)   return '방금 전';
  if (diff < 3600) return `${Math.floor(diff/60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff/3600)}시간 전`;
  return `${Math.floor(diff/86400)}일 전`;
}

export default function CommentBoard() {
  const { user } = useAuth();
  const [comments, setComments] = useState<IComment[]>([]);
  const [content, setContent]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(true);

  const fetchComments = useCallback(async () => {
    try {
      const res  = await fetch('/api/comments');
      const data = await res.json();
      setComments(data.comments || []);
    } finally { setFetching(false); }
  }, []);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const handleSubmit = async () => {
    if (!content.trim() || loading) return;
    setLoading(true);
    try {
      const res  = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        setContent('');
        fetchComments();
      }
    } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return;
    await fetch(`/api/comments/${id}`, { method: 'DELETE' });
    setComments(c => c.filter(x => x._id !== id));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 입력창 */}
      {user ? (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <textarea
            className="input-field"
            placeholder="의견이나 인사를 남겨보세요 🎹"
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
            maxLength={500}
            rows={2}
            style={{ resize: 'none', fontSize: 13 }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{content.length}/500</span>
            <button className="btn-primary" onClick={handleSubmit} disabled={loading || !content.trim()} style={{ padding: '7px 16px', fontSize: 13 }}>
              {loading ? '...' : '남기기'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', textAlign: 'center', fontSize: 13, color: 'var(--text-dim)' }}>
          의견을 남기려면 <a href="/login" style={{ color: 'var(--primary)', textDecoration: 'none' }}>로그인</a>이 필요합니다
        </div>
      )}

      {/* 댓글 목록 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {fetching ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>불러오는 중...</div>
        ) : comments.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
            첫 번째 의견을 남겨보세요 🎵
          </div>
        ) : (
          comments.map((c, i) => (
            <div
              key={c._id}
              className="animate-fade-in-up"
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)',
                animationDelay: `${i * 0.04}s`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>
                  {c.authorName}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{timeAgo(c.createdAt)}</span>
                  {user?.id === c.authorId && (
                    <button
                      onClick={() => handleDelete(c._id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--text-dim)', padding: 0 }}
                    >✕</button>
                  )}
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {c.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
