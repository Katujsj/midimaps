'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { IMember } from '@/types';

const LocationPicker = dynamic(() => import('./LocationPicker'), { ssr: false });

interface Props {
  existing?: IMember | null;
  onSuccess: (member: IMember) => void;
  onCancel: () => void;
}

export default function ProfileForm({ existing, onSuccess, onCancel }: Props) {
  const [form, setForm] = useState({
    name: '', generation: '', region: '', bio: '', avatarUrl: '',
    lat: 0, lng: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name,
        generation: String(existing.generation),
        region: existing.region,
        bio: existing.bio || '',
        avatarUrl: existing.avatarUrl || '',
        lat: existing.lat,
        lng: existing.lng,
      });
    }
  }, [existing]);

  const handleSubmit = async () => {
    setError('');
    if (!form.name || !form.generation || !form.region) {
      setError('이름, 기수, 지역은 필수입니다.'); return;
    }
    if (!form.lat || !form.lng) {
      setError('지도에서 위치를 선택해주세요.'); return;
    }

    setLoading(true);
    try {
      const url    = existing ? `/api/members/${existing._id}` : '/api/members';
      const method = existing ? 'PUT' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, generation: Number(form.generation) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || '오류가 발생했습니다.'); return; }
      onSuccess(data.member);
    } catch { setError('서버와 통신할 수 없습니다.'); }
    finally { setLoading(false); }
  };

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h3 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 16, color: 'var(--text)', marginBottom: 4 }}>
        {existing ? '프로필 수정' : '내 위치 등록'}
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={labelStyle}>이름 *</label>
          <input className="input-field" placeholder="홍길동" value={form.name} onChange={set('name')} />
        </div>
        <div>
          <label style={labelStyle}>기수 *</label>
          <input className="input-field" type="number" placeholder="1" value={form.generation} onChange={set('generation')} min={1} />
        </div>
      </div>

      <div>
        <label style={labelStyle}>지역 *</label>
        <input className="input-field" placeholder="서울, 부산, 제주 ..." value={form.region} onChange={set('region')} />
      </div>

      <div>
        <label style={labelStyle}>소개글</label>
        <textarea
          className="input-field"
          placeholder="간단한 소개를 적어주세요 (선택)"
          value={form.bio}
          onChange={set('bio')}
          maxLength={200}
          rows={2}
          style={{ resize: 'none' }}
        />
        <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-dim)', marginTop: 3 }}>{form.bio.length}/200</div>
      </div>

      <div>
        <label style={labelStyle}>프로필 이미지 URL (선택)</label>
        <input className="input-field" placeholder="https://..." value={form.avatarUrl} onChange={set('avatarUrl')} />
      </div>

      {/* 위치 선택 지도 */}
      <div>
        <label style={labelStyle}>내 위치 *</label>
        <LocationPicker
          lat={form.lat} lng={form.lng}
          onChange={(lat, lng) => setForm(f => ({ ...f, lat, lng }))}
        />
      </div>

      {error && (
        <div style={{ background: 'rgba(255,64,100,0.1)', border: '1px solid rgba(255,64,100,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#ff4064' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{ flex: 1 }}>
          {loading ? '저장 중...' : (existing ? '수정 완료' : '등록하기')}
        </button>
        <button className="btn-ghost" onClick={onCancel}>취소</button>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-dim)',
  marginBottom: 6, fontFamily: 'Syne',
};
