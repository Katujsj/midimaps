'use client';

import { useAuth } from '@/app/layout';
import Link from 'next/link';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      background: 'rgba(8,12,20,0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
      height: 56,
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      justifyContent: 'space-between',
    }}>
      {/* 로고 */}
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
        {/* 웨이브폼 아이콘 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 24 }}>
          {[0.6, 1, 0.8, 1.2, 0.7, 1, 0.5].map((h, i) => (
            <div key={i} className="waveform-bar"
              style={{ height: `${h * 20}px`, animationDelay: `${i * 0.12}s` }} />
          ))}
        </div>
        <span style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 800,
          fontSize: 17,
          color: 'var(--text)',
          letterSpacing: '0.02em',
        }}>
          MIDI<span style={{ color: 'var(--primary)' }}>ology</span>
        </span>
      </Link>

      {/* 우측 메뉴 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {user ? (
          <>
            <span style={{ fontSize: 13, color: 'var(--text-dim)', marginRight: 4 }}>
              {user.name}
            </span>
            <button
              onClick={logout}
              className="btn-ghost"
              style={{ padding: '6px 14px', fontSize: 13 }}
            >
              로그아웃
            </button>
          </>
        ) : (
          <Link href="/login">
            <button className="btn-primary" style={{ padding: '6px 16px', fontSize: 13 }}>
              로그인
            </button>
          </Link>
        )}
      </div>
    </nav>
  );
}
