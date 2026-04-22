'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/auth-context';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const url  = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = mode === 'login'
        ? { email: form.email, password: form.password }
        : { email: form.email, password: form.password, name: form.name };

      const res  = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) { setError(data.error || '오류가 발생했습니다.'); return; }
      await refresh();
      router.push('/');
    } catch { setError('서버와 통신할 수 없습니다.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 20,
      backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(29,233,182,0.05) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(124,77,255,0.05) 0%, transparent 50%)',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* 로고 */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 28 }}>
                {[0.6, 1, 0.8, 1.2, 0.7, 1, 0.5].map((h, i) => (
                  <div key={i} className="waveform-bar" style={{ height: `${h * 22}px`, animationDelay: `${i * 0.12}s` }} />
                ))}
              </div>
              <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 22, color: 'var(--text)' }}>
                MIDI<span style={{ color: 'var(--primary)' }}>ology</span>
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>전국 동아리원 지도</p>
          </Link>
        </div>

        {/* 카드 */}
        <div className="panel" style={{ padding: 28 }}>
          {/* 탭 */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg)', borderRadius: 10, padding: 4 }}>
            {(['login', 'register'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                style={{
                  flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontFamily: 'Syne', fontWeight: 700, fontSize: 13,
                  background: mode === m ? 'var(--surface2)' : 'transparent',
                  color: mode === m ? 'var(--primary)' : 'var(--text-dim)',
                  transition: 'all 0.2s',
                  boxShadow: mode === m ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
                }}
              >
                {m === 'login' ? '로그인' : '회원가입'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'register' && (
              <div>
                <label style={label}>이름</label>
                <input className="input-field" placeholder="홍길동" value={form.name} onChange={set('name')} />
              </div>
            )}
            <div>
              <label style={label}>이메일</label>
              <input className="input-field" type="email" placeholder="example@email.com" value={form.email} onChange={set('email')}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
            </div>
            <div>
              <label style={label}>비밀번호{mode === 'register' && ' (6자 이상)'}</label>
              <input className="input-field" type="password" placeholder="••••••••" value={form.password} onChange={set('password')}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
            </div>
          </div>

          {error && (
            <div style={{ marginTop: 14, background: 'rgba(255,64,100,0.1)', border: '1px solid rgba(255,64,100,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#ff4064' }}>
              {error}
            </div>
          )}

          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={loading}
            style={{ width: '100%', marginTop: 20, padding: '12px 0', fontSize: 15 }}
          >
            {loading ? '처리 중...' : (mode === 'login' ? '로그인' : '가입하기')}
          </button>
        </div>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--text-dim)' }}>
          <Link href="/" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>← 지도로 돌아가기</Link>
        </p>
      </div>
    </div>
  );
}

const label: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-dim)',
  marginBottom: 6, fontFamily: 'Syne',
};
