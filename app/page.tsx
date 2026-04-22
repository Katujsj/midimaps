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

type SideTab = 'members' | 'comments' | 'myprofile';

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [members, setMembers]         = useState<IMember[]>([]);
  const [selected, setSelected]       = useState<IMember | null>(null);
  const [tab, setTab]                 = useState<SideTab>('members');
  const [editing, setEditing]         = useState(false);
  const [stats, setStats]             = useState({ total: 0, regions: 0 });
  const [isMobile, setIsMobile]       = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const mapInstanceRef                = useRef<any>(null);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const fetchMembers = useCallback(async () => {
    const res  = await fetch('/api/members');
    const data = await res.json();
    const list: IMember[] = data.members || [];
    setMembers(list);
    setStats({
      total:   list.length,
      regions: new Set(list.map(m => m.region)).size,
    });
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const myMember = members.find(m => m.userId === user?.id) ?? null;

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
            {tab === 'members' && (
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
                      />
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 의견 탭 */}
            {tab === 'comments' && <CommentBoard />}

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
                          ? <img src={myMember.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                  ? <img src={selected.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
      </div>
    </div>
  );
}
