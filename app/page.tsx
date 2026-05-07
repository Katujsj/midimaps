'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/app/auth-context';
import Navbar from '@/components/Navbar';
import MemberCard from '@/components/MemberCard';
import ProfileForm from '@/components/ProfileForm';
import CommentBoard from '@/components/CommentBoard';
import type { IMember } from '@/types';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

type SideTab = 'members' | 'comments' | 'myprofile' | 'songroom';

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [selectedMemberSongs, setSelectedMemberSongs] = useState<IMember | null>(null);
  const [members, setMembers] = useState<IMember[]>([]);
  const [selected, setSelected]       = useState<IMember | null>(null);
  const [tab, setTab]                 = useState<SideTab>('members');
  const [editing, setEditing]         = useState(false);
  const [stats, setStats]             = useState({ total: 0, regions: 0 });
  const [isMobile, setIsMobile]       = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const mapInstanceRef                = useRef<any>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [toastLeaving, setToastLeaving] = useState(false);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const toastRemoveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedAuthor, setSelectedAuthor] = useState<any | null>(null);
  const [authorPage, setAuthorPage] = useState(1);
  const titleWrapRef = useRef<HTMLDivElement>(null);
  const titleTrackRef = useRef<HTMLDivElement>(null);
  const titleTextRef = useRef<HTMLSpanElement>(null);
  const [rightComments, setRightComments] = useState<any[]>([]);
  const [rightCommentInput, setRightCommentInput] = useState('');
  const [currentSong, setCurrentSong] = useState<{
  title: string;
  thumbnailUrl: string;
  url: string;
} | null>(null);

  useEffect(() => {
    if (!titleTrackRef.current || !titleTextRef.current || !currentSong) return;

    const track = titleTrackRef.current;

    // 새 추천곡으로 바뀔 때마다 애니메이션을 처음부터 다시 시작
    track.style.animation = 'none';
    void track.offsetHeight;
    track.style.animation = '';

    requestAnimationFrame(() => {
      if (!titleTrackRef.current || !titleTextRef.current) return;

      const gap = 40;
      const textWidth = titleTextRef.current.offsetWidth;
      const distance = textWidth + gap;
      const speed = 35; // 숫자가 낮을수록 느림
      const duration = distance / speed;

      track.style.setProperty('--marquee-distance', `${distance}px`);
      track.style.setProperty('--marquee-duration', `${duration}s`);
    });
  }, [currentSong]);

  useEffect(() => {
    const initialMobile = window.innerWidth < 768;
    setIsMobile(initialMobile);
    if (initialMobile) setSidebarOpen(false);

    // resize에서 setSidebarOpen 호출 안 함 — iOS 키보드 open/close가 resize를 트리거해서 사이드바가 닫히는 버그 방지
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch('/api/members');

      if (!res.ok) {
        setMembers([]);
        setStats({ total: 0, regions: 0 });
        return;
      }

      const data = await res.json();
      const list: IMember[] = data.members || [];

      setMembers(list);
      setStats({
        total: list.length,
        regions: new Set(list.map(m => m.region)).size,
      });
    } catch {
      setMembers([]);
      setStats({ total: 0, regions: 0 });
    }
  }, []);

  // BOOKMARK: LOCAL_TEST_DISABLE_MEMBERS_FETCH
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const myMember = members.find(m => m.userId === user?.id) ?? null;

  const fetchRightComments = useCallback(async () => {
    try {
      const res = await fetch('/api/song-comments');

      if (!res.ok) {
        setRightComments([]);
        return;
      }

      const data = await res.json();
      setRightComments(data.comments || []);
    } catch {
      setRightComments([]);
    }
  }, []);

  // BOOKMARK: LOCAL_TEST_DISABLE_DB_FETCH
  useEffect(() => {
    fetchRightComments();
  }, [fetchRightComments]);

  const extractYoutubeUrl = (text: string) => {
    const match = text.match(
      /(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[^\s]+)/i
    );

    return match?.[0] || null;
  };

  const fetchYoutubeInfo = async (url: string) => {
    const res = await fetch(`/api/youtube?url=${encodeURIComponent(url)}`);

    if (!res.ok) return;

    const data = await res.json();
    setCurrentSong(data);
  };

  const showToast = (message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    if (toastRemoveTimerRef.current) clearTimeout(toastRemoveTimerRef.current);

    setToastMessage(message);
    setToastLeaving(false);

    toastTimerRef.current = setTimeout(() => {
      setToastLeaving(true);
    }, 1600);

    toastRemoveTimerRef.current = setTimeout(() => {
      setToastMessage('');
      setToastLeaving(false);
    }, 2050);
  };

  const handleRightCommentSubmit = async () => {
    if (!rightCommentInput.trim()) return;

    try {
      const res = await fetch('/api/song-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: rightCommentInput,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || '추천곡 등록에 실패했어요.');
        return;
      }

      setRightComments(prev => [data.comment, ...prev]);

      if (data.comment?.songUrl) {
        setCurrentSong({
          title: data.comment.songTitle || '',
          thumbnailUrl: data.comment.songThumbnailUrl || '',
          url: data.comment.songUrl || '',
        });
      }

      setRightCommentInput('');
    } catch {
      showToast('네트워크 오류가 발생했어요.');
    }
  };

  const handleReaction = async (commentIndex: number, emoji: '❤️' | '👍' | '😂') => {
    if (!user?.id) return;
    const comment = todayComments[commentIndex];
    if (!comment?._id) return;

    const currentReaction = comment.reactions?.[user.id];
    const nextEmoji = currentReaction === emoji ? '' : emoji;

    try {
      const res = await fetch(`/api/song-comments/${comment._id}/reaction`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji: nextEmoji }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || '감정표현 저장에 실패했어요.');
        return;
      }

      setRightComments(prev =>
        prev.map((item) =>
          item._id === data.comment._id
            ? { ...data.comment, showReactionPicker: false }
            : { ...item, showReactionPicker: false }
        )
      );
    } catch {
      showToast('네트워크 오류가 발생했어요.');
    }
  };

  const today = new Date().toLocaleDateString('ko-KR');

  const todayComments = rightComments.filter((comment) => {
    if (!comment.createdAt) return false;

    return (
      new Date(comment.createdAt).toLocaleDateString('ko-KR') === today
    );
  });

  const latestTodaySong = todayComments[0];

  const todayCurrentSong = latestTodaySong?.songThumbnailUrl
    ? {
        title: latestTodaySong.songTitle || '',
        thumbnailUrl: latestTodaySong.songThumbnailUrl,
        url: latestTodaySong.songUrl || '',
      }
    : currentSong;

  const handleFormSuccess = (member: IMember) => {
    setEditing(false);
    fetchMembers();
    setSelected(member);
    setTab('members');
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>
      <Navbar />

      <div style={{ flex: 1, display: 'flex', marginTop: 56, overflow: 'hidden', position: 'relative' }}>

        {/* ── 모바일 백드롭 ─────────────────────────────── */}
        {isMobile && sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed', inset: 0, top: 56,
              background: 'rgba(0,0,0,0.6)',
              zIndex: 400,
            }}
          />
        )}

        {/* ── 왼쪽 사이드바 ───────────────────────────────── */}
        <aside style={{
          width: 300,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          overflow: 'hidden',
          ...(isMobile ? {
            position: 'fixed',
            top: 56, left: 0, bottom: 0,
            zIndex: 500,
            transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s ease',
            boxShadow: sidebarOpen ? '4px 0 24px rgba(0,0,0,0.4)' : 'none',
          } : {}),
        }}>
          {/* 헤더 */}
          <div style={{ padding: '20px 20px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 20, color: 'var(--text)', lineHeight: 1.2 }}>
                미디올로지의 <span style={{ color: 'var(--primary)' }}>지도</span>
              </h1>
              {isMobile && (
                <button
                  onClick={() => setSidebarOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontSize: 20, lineHeight: 1, padding: '0 0 0 8px' }}
                >✕</button>
              )}
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 6, lineHeight: 1.5 }}>
              전국에 흩어진 미디올로지를 한눈에
            </p>

            {/* 통계 */}
            <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
              {[
                { label: '등록 인원', value: stats.total },
                { label: '활동 지역', value: stats.regions },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--surface2)', borderRadius: 10, padding: '10px 14px', flex: 1, border: '1px solid var(--border)' }}>
                  <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 22, color: 'var(--primary)' }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 탭 */}
          <div style={{ padding: '0 12px 10px', display: 'flex', gap: 4, borderBottom: '1px solid var(--border)' }}>
            {([
              { key: 'members',   label: '멤버' },
              { key: 'comments',  label: '의견' },
              { key: 'songroom',  label: '추천방' },
              { key: 'myprofile', label: '내 프로필' },
            ] as const).map(t => (
              <button
                key={t.key}
                className={`tab-btn ${tab === t.key ? 'active' : ''}`}
                onClick={() => { setTab(t.key); setEditing(false); }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* 탭 컨텐츠 */}
          <div style={{ flex: 1, overflowY: 'auto' }}>

            {/* 멤버 탭 */}
            {tab === 'members' && selectedMemberSongs ? (
              <div
                key={selectedMemberSongs._id}
                className="member-songs-page-enter"
                style={{ padding: 16 }}
              >
                <div
                  className="panel"
                  style={{
                    padding: 14,
                    marginBottom: 14,
                    borderRadius: 14,
                    background: 'var(--surface2)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'Syne',
                        fontWeight: 800,
                        fontSize: 16,
                        color: 'var(--text)',
                      }}
                    >
                      {selectedMemberSongs.name}님의 추천곡
                    </div>

                    <button
                      onClick={() => setSelectedMemberSongs(null)}
                      className="btn-ghost"
                      style={{
                        padding: '6px 10px',
                        fontSize: 11,
                        flexShrink: 0,
                      }}
                    >
                      ←
                    </button>
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--text-dim)',
                      marginTop: 7,
                    }}
                  >
                    지금까지 추천방에 남긴 곡 목록
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {rightComments
                    .filter((item) => item.authorId === selectedMemberSongs.userId)
                    .map((item, idx) => (
                      <a
                        key={item._id || idx}
                        href={item.songUrl || extractYoutubeUrl(item.content) || '#'}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'flex',
                          gap: 10,
                          padding: 10,
                          borderRadius: 12,
                          background: 'var(--surface2)',
                          border: '1px solid var(--border)',
                          textDecoration: 'none',
                          color: 'var(--text)',
                          boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
                        }}
                      >
                        {item.songThumbnailUrl && (
                          <img
                            src={item.songThumbnailUrl}
                            alt=""
                            style={{
                              width: 82,
                              aspectRatio: '16 / 9',
                              objectFit: 'cover',
                              borderRadius: 8,
                              border: '1px solid var(--border)',
                              flexShrink: 0,
                            }}
                          />
                        )}

                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              fontSize: 10,
                              color: 'var(--text-dim)',
                              marginBottom: 4,
                            }}
                          >
                            {item.createdAt
                              ? new Date(item.createdAt).toLocaleDateString('ko-KR')
                              : ''}
                          </div>

                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {item.songTitle || item.songUrl || item.content}
                          </div>
                        </div>
                      </a>
                    ))}
                </div>
              </div>
            ) : (
              <div style={{ padding: '8px 4px' }}>
                {members.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
                    아직 등록된 멤버가 없어요 🎵
                  </div>
                ) : (
                  members.map((m, i) => (
                    <div key={m._id} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
                      <MemberCard
                        member={m}
                        isSelected={selected?._id === m._id}
                        onClick={() => setSelected(prev => prev?._id === m._id ? null : m)}
                        onEdit={() => { setTab('myprofile'); setEditing(true); }}
                        onOpenSongs={() => setSelectedMemberSongs(m)}
                      />
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 의견 탭 */}
            {tab === 'comments' && <CommentBoard />}

            {/* 추천방 탭 */}
            {tab === 'songroom' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px 10px', flexShrink: 0 }}>
                  <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 10 }}>👍 1일 1추천, 표현 남기면 하나 더</p>
                  <input
                    value={rightCommentInput}
                    onChange={(e) => setRightCommentInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleRightCommentSubmit(); }}
                    placeholder="유튜브 링크를 입력하세요"
                    className="input-field"
                    style={{ fontSize: 13, marginBottom: 8 }}
                  />
                  <button className="btn-primary" onClick={handleRightCommentSubmit} style={{ width: '100%', fontSize: 13, padding: '8px' }}>
                    추천곡 남기기
                  </button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {todayComments.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 13, paddingTop: 24 }}>
                      오늘의 추천곡이 없어요 🎵
                    </div>
                  ) : todayComments.map((c, i) => (
                    <div key={c._id || i} style={{ background: 'var(--surface2)', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px 6px' }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', overflow: 'hidden', background: 'var(--surface)', border: '1px solid var(--primary)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: 'var(--primary)' }}>
                          {c.authorAvatarUrl
                            ? <img src={c.authorAvatarUrl} alt="" style={{ width: 24, height: 24, objectFit: 'cover', display: 'block' }} />
                            : c.authorName?.charAt(0) || '?'}
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 700 }}>{c.authorName || '익명'}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-dim)', marginLeft: 'auto' }}>
                          {c.createdAt ? new Date(c.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      {c.songThumbnailUrl && (
                        <div style={{ position: 'relative' }}>
                          <img
                            src={c.songThumbnailUrl} alt=""
                            onClick={() => {
                              if (user?.id && String(c.authorId) === String(user.id)) { showToast('내 추천곡에는\n감정표현을 남길 수 없어요'); return; }
                              setRightComments(prev => prev.map((comment) => ({
                                ...comment,
                                showReactionPicker: comment._id === c._id ? !comment.showReactionPicker : false,
                              })));
                            }}
                            style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block', cursor: 'pointer' }}
                          />
                          {c.showReactionPicker && (
                            <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', display: 'flex', gap: 6, padding: '5px 8px', borderRadius: 999, background: 'rgba(8,12,20,0.92)', border: '1px solid var(--border)', zIndex: 5 }}>
                              {(['❤️', '👍', '😂'] as const).map((emoji) => (
                                <button key={emoji} onClick={(e) => { e.stopPropagation(); handleReaction(i, emoji); }}
                                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 2 }}>
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      <div style={{ padding: '8px 12px 10px' }}>
                        <a href={c.songUrl || extractYoutubeUrl(c.content) || '#'} target="_blank" rel="noreferrer"
                          style={{ fontSize: 12, color: 'var(--text)', display: 'block', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.songUrl || c.content}
                        </a>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          {(['❤️', '👍', '😂'] as const).map((emoji) => {
                            const reactions = c.reactions || {};
                            const count = Object.values(reactions).filter((r) => r === emoji).length;
                            if (count === 0) return null;
                            const isReacted = user?.id && reactions[user.id] === emoji;
                            return (
                              <span key={emoji} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 999, background: isReacted ? 'var(--primary-dim)' : 'rgba(8,12,20,0.8)', border: `1px solid ${isReacted ? 'var(--primary)' : 'var(--border)'}`, color: isReacted ? 'var(--primary)' : 'var(--text-dim)' }}>
                                {emoji} {count}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 내 프로필 탭 */}
            {tab === 'myprofile' && (
              <div style={{ padding: 16 }}>
                {authLoading ? (
                  <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>로딩 중...</div>
                ) : !user ? (
                  <div style={{ textAlign: 'center', paddingTop: 12 }}>
                    <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 16, lineHeight: 1.6 }}>
                      로그인 후 내 위치를 등록하면<br />지도에 표시됩니다 🗺️
                    </p>
                    <a href="/login">
                      <button className="btn-primary" style={{ width: '100%' }}>로그인 / 회원가입</button>
                    </a>
                  </div>
                ) : editing || !myMember ? (
                  <ProfileForm
                    existing={myMember}
                    onSuccess={handleFormSuccess}
                    onCancel={() => setEditing(false)}
                  />
                ) : (
                  /* 내 프로필 보기 */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 60, height: 60, borderRadius: '50%', border: '2px solid var(--primary)', overflow: 'hidden', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(29,233,182,0.3)' }}>
                        {myMember.avatarUrl
                          ? <img src={myMember.avatarUrl} alt="" style={{ width: 60, height: 60, objectFit: 'cover', display: 'block' }} />
                          : <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 22, color: 'var(--primary)' }}>{myMember.name.charAt(0)}</span>
                        }
                      </div>
                      <div>
                        <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 18, color: 'var(--text)' }}>{myMember.name}</div>
                        <div style={{ fontSize: 13, color: 'var(--primary)', marginTop: 2 }}>{myMember.generation}기 · {myMember.region}</div>
                      </div>
                    </div>

                    {myMember.bio && (
                      <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.7, background: 'var(--surface2)', borderRadius: 10, padding: '10px 14px', border: '1px solid var(--border)' }}>
                        {myMember.bio}
                      </p>
                    )}

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn-primary" onClick={() => setEditing(true)} style={{ flex: 1 }}>수정하기</button>
                      <button
                        className="btn-ghost"
                        onClick={async () => {
                          if (!confirm('정말 삭제하시겠습니까?')) return;
                          await fetch(`/api/members/${myMember._id}`, { method: 'DELETE' });
                          fetchMembers();
                        }}
                      >삭제</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* ── 지도 영역 ───────────────────────────────────── */}
        <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {/* 커스텀 줌 컨트롤 그룹 (사이드바 열기 포함) */}
          {(!isMobile || !sidebarOpen) && (
            <div style={{
              position: 'absolute', top: 10, left: 10,
              zIndex: 1001,
              display: 'flex', flexDirection: 'column',
              border: '2px solid var(--border)',
              borderRadius: 4,
              overflow: 'hidden',
              boxShadow: '0 1px 5px rgba(0,0,0,0.65)',
            }}>
              {isMobile && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  style={{
                    width: 26, height: 26,
                    background: 'var(--surface2)',
                    border: 'none',
                    borderBottom: '1px solid var(--border)',
                    color: 'var(--primary)',
                    fontSize: 13,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >☰</button>
              )}
              <button
                onClick={() => mapInstanceRef.current?.zoomIn()}
                style={{
                  width: 26, height: 26,
                  background: 'var(--surface2)',
                  border: 'none',
                  borderBottom: '1px solid var(--border)',
                  color: 'var(--text)',
                  fontSize: 18, fontWeight: 700, lineHeight: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >+</button>
              <button
                onClick={() => mapInstanceRef.current?.zoomOut()}
                style={{
                  width: 26, height: 26,
                  background: 'var(--surface2)',
                  border: 'none',
                  color: 'var(--text)',
                  fontSize: 18, fontWeight: 700, lineHeight: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >−</button>
            </div>
          )}
          <MapView
            members={members}
            selectedId={selected?._id}
            onMapReady={(map) => { mapInstanceRef.current = map; }}
            onMarkerClick={(m) => {
              setSelected(prev => prev?._id === m._id ? null : m);
              setTab('members');
              if (isMobile) setSidebarOpen(true);
            }}
          />

          {/* 선택된 멤버 하단 카드 */}
          {selected && (
            <div
              className="animate-fade-in-up panel"
              style={{
                position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
                minWidth: 260, maxWidth: 360,
                padding: '16px 20px',
                display: 'flex', gap: 14, alignItems: 'center',
                backdropFilter: 'blur(12px)',
                background: 'rgba(15,22,36,0.9)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(29,233,182,0.2)',
              }}
            >
              <div style={{ width: 48, height: 48, borderRadius: '50%', border: '2px solid var(--primary)', overflow: 'hidden', background: 'var(--surface2)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(29,233,182,0.4)' }}>
                {selected.avatarUrl
                  ? <img src={selected.avatarUrl} alt="" style={{ width: 48, height: 48, objectFit: 'cover', display: 'block' }} />
                  : <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 18, color: 'var(--primary)' }}>{selected.name.charAt(0)}</span>
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>{selected.name}</div>
                <div style={{ fontSize: 12, color: 'var(--primary)', marginTop: 2 }}>{selected.generation}기 · {selected.region}</div>
                {selected.bio && <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.bio}</div>}
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontSize: 18, flexShrink: 0, lineHeight: 1 }}
              >✕</button>
            </div>
          )}

          {/* 지도 우측 하단 - 내 위치 등록 CTA */}
          {user && !myMember && (
            <button
              className="btn-primary animate-fade-in"
              onClick={() => { setTab('myprofile'); setSidebarOpen(true); }}
              style={{
                position: 'absolute', bottom: 24, right: 24,
                boxShadow: '0 4px 20px rgba(29,233,182,0.4)',
              }}
            >
              📍 내 위치 등록
            </button>
          )}
        </main>
        {/* ── 오른쪽 테스트 사이드바 ───────────────────────────── */}
        <aside
          style={{
            width: 280,
            flexShrink: 0,
            display: isMobile ? 'none' : 'flex',
            flexDirection: 'column',
            background: 'var(--surface)',
            borderLeft: '1px solid var(--border)',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div style={{ padding: '20px 20px 14px' }}>
            <h2
              style={{
                fontFamily: 'Syne',
                fontWeight: 800,
                fontSize: 20,
                color: 'var(--text)',
                lineHeight: 1.2,
              }}
            >
              고독한 추천방
            </h2>

            <p
              style={{
                fontSize: 12,
                color: 'var(--text-dim)',
                marginTop: 6,
                lineHeight: 1.5,
              }}
            >
              👍 1일 1추천, 표현 남기면 하나 더
            </p>
          </div>

          {/* 추천곡 입력 영역 */}
          <div
            style={{
              margin: '-4px 16px 10px',
              padding: 12,
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              boxShadow: '0 0 0 1px rgba(29,233,182,0.04)',
            }}
          >
            <input
              value={rightCommentInput}
              onChange={(e) => setRightCommentInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRightCommentSubmit();
              }}
              placeholder="유튜브 링크를 입력하세요"
              className="input-field"
              style={{
                fontSize: 13,
                padding: '9px 12px',
                marginBottom: 8,
              }}
            />

            <button
              className="btn-primary"
              onClick={handleRightCommentSubmit}
              style={{
                width: '100%',
                padding: '8px 14px',
                borderRadius: 10,
                fontSize: 13,
              }}
            >
              추천곡 남기기
            </button>
          </div>

          {/* LP + 추천곡 카드 묶음 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              margin: '8px 8px 12px',
              overflow: 'visible',
            }}
          >
            {/* LP */}
            <div
              className="lp-wrap"
              style={{
                width: 180,
                padding: 0,
                marginTop: 0,
                flexShrink: 0,
                transform: 'translateX(0px)',
                zIndex: 1,
              }}
            >
              <div className="lp-disc">
                <div className="lp-label">
                  <div className="lp-hole" />
                </div>
              </div>
            </div>

            {/* 추천곡 카드 */}
            <div
              style={{
                background: 'var(--surface2)',
                borderRadius: 14,
                padding: '12px 12px',
                height: 190,
                width: 300,
                minWidth: 180,
                overflow: 'hidden',
                transform: 'translateX(-110px)',
                border: '1px solid var(--primary)',
                position: 'relative',
                zIndex: 2,
                boxShadow:
                  '0 0 0 1px rgba(29,233,182,0.18), 0 12px 28px rgba(0,0,0,0.32), 0 0 24px rgba(29,233,182,0.16)',
              }}
            >
              <div
                style={{
                  fontFamily: 'Syne',
                  fontWeight: 800,
                  fontSize: 18,
                }}
              >
                <span style={{ color: 'var(--text)' }}>오늘의 </span>
                <span style={{ color: 'var(--primary)' }}>추천곡</span>
              </div>

              {todayCurrentSong ? (
                <>

                  <a href={todayCurrentSong.url} target="_blank" rel="noreferrer">
                    <img
                      src={todayCurrentSong.thumbnailUrl}
                      alt={todayCurrentSong.title}
                      style={{
                        width: '100%',
                        aspectRatio: '16 / 9',   // ⭐ 핵심
                        objectFit: 'cover',
                        marginTop: 14,
                        borderRadius: 10,
                        border: '1px solid var(--border)',
                        display: 'block',
                      }}
                    />
                  </a>

                  <div
                    ref={titleWrapRef}
                    style={{
                      marginTop: 8,
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      color: 'var(--text)',
                      fontSize: 13,
                      fontWeight: 700,
                      position: 'relative',
                      height: 18,
                      width: '100%',
                      maxWidth: '100%',
                    }}
                  >
                    <div
                      ref={titleTrackRef}
                      className="song-title-marquee-track"
                    >
                      <span ref={titleTextRef}>{todayCurrentSong.title}</span>
                      <span>{todayCurrentSong.title}</span>
                    </div>
                  </div>

                </>
              ) : (
                <div style={{ fontSize: 11, marginTop: 8 }}>
                  아직 추천곡이 없습니다.
                </div>
              )}
            </div>
          </div>
          
          {/* 댓글 영역 */}
          <div
            style={{
              margin: '0 16px 20px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              wordBreak: 'break-word',
              overflowWrap: 'anywhere',
              whiteSpace: 'pre-wrap',
              boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            }}
          >
            {/* 댓글 리스트 */}
            <div
              style={{
                flex: 1,
                padding: '12px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column-reverse',
                gap: 10,
              }}
            >
              {todayComments.map((c, i) => (
                <div
                  key={c._id || i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      flexShrink: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <div
                      onClick={() => {
                        setSelectedAuthor(c);
                        setAuthorPage(1);
                      }}
                      title="이 사람이 올린 추천곡 보기"
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        overflow: 'hidden',
                        background: 'var(--surface)',
                        border: '1px solid var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--primary)',
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      {c.authorAvatarUrl ? (
                        <img
                          src={c.authorAvatarUrl}
                          alt=""
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        c.authorName?.charAt(0) || '?'
                      )}
                    </div>

                    <div
                      style={{
                        minHeight: 66,
                        marginTop: 6,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      {(() => {
                        const reactions = c.reactions || {};

                        const activeReactions = (['❤️', '👍', '😂'] as const)
                          .map((emoji) => {
                            const count = Object.values(reactions).filter(
                              (reaction) => reaction === emoji
                            ).length;

                            if (count === 0) return null;

                            return { emoji, count };

                          })
                          .filter(
                            (item): item is {
                              emoji: '❤️' | '👍' | '😂';
                              count: number;
                              isLeaving: boolean;
                            } => item !== null
                          );

                        return activeReactions.map((item) => (
                          <div
                            key={item.emoji}
                            className="reaction-pill"
                            style={{
                              minWidth: 30,
                              height: 22,
                              padding: '0 6px',
                              borderRadius: 999,
                              background: 'rgba(8,12,20,0.95)',
                              border: '1px solid var(--border)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 3,
                              fontSize: 12,
                              lineHeight: 1,
                              boxShadow: '0 0 8px rgba(0,0,0,0.25)',
                            }}
                          >
                            <span>{item.emoji}</span>

                            <span
                              style={{
                                fontSize: 10,
                                color: 'var(--text-dim)',
                                fontWeight: 700,
                              }}
                            >
                              {item.count}
                            </span>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--primary)',
                        marginBottom: 4,
                        marginLeft: 2,
                        fontWeight: 700,
                      }}
                    >
                      {c.authorName || '익명'}
                    </div>

                    <div
                      style={{
                        maxWidth: '100%',
                        background: 'var(--bg)',
                        border: '1px solid var(--border)',
                        borderRadius: '14px 14px 14px 4px',
                        padding: '8px 10px',
                      }}
                    >
                    

                    {c.songThumbnailUrl && (
                      <div style={{ position: 'relative' }}>
                        <img
                          src={c.songThumbnailUrl}
                          alt=""
                          onClick={() => {
                            const currentUserId = user?.id;

                            if (currentUserId && String(c.authorId) === String(currentUserId)) {
                              showToast('내 추천곡에는\n감정표현을 남길 수 없어요');
                              return;
                            }

                            setRightComments(prev =>
                              prev.map((comment) => ({
                                ...comment,
                                showReactionPicker:
                                  comment._id === c._id ? !comment.showReactionPicker : false,
                              }))
                            );
                          }}
                          style={{
                            width: '100%',
                            aspectRatio: '16 / 9',
                            objectFit: 'cover',
                            borderRadius: 8,
                            border: '1px solid var(--border)',
                            marginBottom: 6,
                            display: 'block',
                            cursor: 'pointer',
                          }}
                        />

                        {c.showReactionPicker && (
                          <div
                            style={{
                              position: 'absolute',
                              left: '50%',
                              top: '50%',
                              transform: 'translate(-50%, -50%)',
                              display: 'flex',
                              gap: 6,
                              padding: '5px 7px',
                              borderRadius: 999,
                              background: 'rgba(8,12,20,0.92)',
                              border: '1px solid var(--border)',
                              boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
                              zIndex: 5,
                            }}
                          >
                            {(['❤️', '👍', '😂'] as const).map((emoji) => (
                              <button
                                key={emoji}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleReaction(i, emoji);
                                }}
                                style={{
                                  border: 'none',
                                  background: 'transparent',
                                  cursor: 'pointer',
                                  fontSize: 16,
                                  lineHeight: 1,
                                  padding: 2,
                                }}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <a
                      className="comment-link"
                      href={c.songUrl || extractYoutubeUrl(c.content) || '#'}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--text)',
                          wordBreak: 'break-word',
                          overflowWrap: 'anywhere',
                        }}
                      >
                        {c.songUrl || c.content}
                      </div>
                    </a>

                    <div
                      style={{
                        fontSize: 10,
                        color: 'var(--text-dim)',
                        marginTop: 4,
                        textAlign: 'right',
                      }}
                    >
                      {c.createdAt ? new Date(c.createdAt).toLocaleString('ko-KR') : ''}
                    </div>
                  </div>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {selectedAuthor && (
            <div
              onClick={() => setSelectedAuthor(null)}
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.6)',
                zIndex: 10,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '86%',
                  maxHeight: '72%',
                  background: 'var(--surface)',
                  border: '1px solid var(--primary)',
                  borderRadius: 16,
                  padding: 16,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 0 30px rgba(29,233,182,0.3)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <strong style={{ color: 'var(--primary)', fontSize: 14 }}>
                    {selectedAuthor.authorName || '익명'}님의 추천곡
                  </strong>

                  <button
                    onClick={() => setSelectedAuthor(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-dim)',
                      cursor: 'pointer',
                      fontSize: 18,
                    }}
                  >
                    ✕
                  </button>
                </div>

                <div
                  style={{
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  {(() => {
                    const authorSongs = rightComments.filter((item) =>
                      selectedAuthor.authorId
                        ? item.authorId === selectedAuthor.authorId
                        : item.authorName === selectedAuthor.authorName
                    );

                    const pageSize = 5;
                    const totalPages = Math.max(1, Math.ceil(authorSongs.length / pageSize));
                    const currentPage = Math.min(authorPage, totalPages);
                    const pagedSongs = authorSongs.slice(
                      (currentPage - 1) * pageSize,
                      currentPage * pageSize
                    );

                    return (
                      <>
                        <div
                          style={{
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 10,
                          }}
                        >
                          {pagedSongs.map((item, idx) => {
                            const url = item.songUrl || extractYoutubeUrl(item.content);

                            return (
                              <a
                                key={item._id || idx}
                                href={url || '#'}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  display: 'flex',
                                  gap: 10,
                                  alignItems: 'center',
                                  padding: 10,
                                  borderRadius: 10,
                                  background: 'var(--surface2)',
                                  border: '1px solid var(--border)',
                                  textDecoration: 'none',
                                  color: 'var(--text)',
                                }}
                              >
                                <div
                                  style={{
                                    width: 64,
                                    aspectRatio: '16 / 9',
                                    borderRadius: 6,
                                    overflow: 'hidden',
                                    background: 'var(--bg)',
                                    border: '1px solid var(--border)',
                                    flexShrink: 0,
                                  }}
                                >
                                  {item.songThumbnailUrl && (
                                    <img
                                      src={item.songThumbnailUrl}
                                      alt=""
                                      style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        display: 'block',
                                      }}
                                    />
                                  )}
                                </div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div
                                    style={{
                                      fontSize: 10,
                                      color: 'var(--text-dim)',
                                      marginBottom: 3,
                                    }}
                                  >
                                    {item.createdAt
                                      ? new Date(item.createdAt).toLocaleDateString('ko-KR')
                                      : ''}
                                  </div>

                                  <div
                                    style={{
                                      fontSize: 12,
                                      fontWeight: 600,
                                      color: 'var(--text)',
                                      overflow: 'hidden',
                                      whiteSpace: 'nowrap',
                                      textOverflow: 'ellipsis',
                                    }}
                                  >
                                    {item.songTitle || url || item.content}
                                  </div>
                                </div>
                              </a>
                            );
                          })}
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: 8,
                            marginTop: 12,
                            fontSize: 12,
                            color: 'var(--text-dim)',
                          }}
                        >
                          <button
                            onClick={() => setAuthorPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: currentPage === 1 ? 'var(--text-dim)' : 'var(--primary)',
                              cursor: currentPage === 1 ? 'default' : 'pointer',
                            }}
                          >
                            &lt;
                          </button>

                          {Array.from({ length: totalPages }).map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setAuthorPage(i + 1)}
                              style={{
                                background: i + 1 === currentPage ? 'var(--primary-dim)' : 'none',
                                border: 'none',
                                borderRadius: 6,
                                color: i + 1 === currentPage ? 'var(--primary)' : 'var(--text-dim)',
                                cursor: 'pointer',
                                padding: '3px 7px',
                                fontSize: 12,
                              }}
                            >
                              {i + 1}
                            </button>
                          ))}

                          <button
                            onClick={() => setAuthorPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            style={{
                              background: 'none',
                              border: 'none',
                              color:
                                currentPage === totalPages ? 'var(--text-dim)' : 'var(--primary)',
                              cursor: currentPage === totalPages ? 'default' : 'pointer',
                            }}
                          >
                            &gt;
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {toastMessage && (
            <div
              style={{
                position: 'absolute',
                left: 48,
                right: 48,
                top: 185,
                zIndex: 30,
                padding: '10px 12px',
                lineHeight: 1.35,
                borderRadius: 12,
                background: 'rgba(29,233,182,0.18)',
                border: '1px solid rgba(29,233,182,0.55)',
                color: 'var(--primary)',
                backdropFilter: 'blur(10px)',
                fontSize: 13,
                fontWeight: 700,
                boxShadow: '0 0 24px rgba(29,233,182,0.28)',
                textAlign: 'center',
                whiteSpace: 'pre-line',
                animation: toastLeaving
                  ? 'toast-out 0.35s ease both'
                  : 'toast-pop 0.22s ease both',
              }}
            >
              {toastMessage}
            </div>
          )}

        </aside>
      </div>
    </div>
  );
}
