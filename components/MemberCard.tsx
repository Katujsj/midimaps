'use client';

import type { IMember } from '@/types';
import { useAuth } from '@/app/layout';

interface Props {
  member: IMember;
  isSelected?: boolean;
  onClick?: () => void;
  onEdit?: () => void;
}

export default function MemberCard({ member, isSelected, onClick, onEdit }: Props) {
  const { user } = useAuth();
  const isOwner = user?.id === member.userId;
  const initials = member.name.charAt(0);

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        borderRadius: 12,
        cursor: 'pointer',
        transition: 'all 0.2s',
        background: isSelected ? 'var(--primary-dim)' : 'transparent',
        border: `1px solid ${isSelected ? 'rgba(29,233,182,0.3)' : 'transparent'}`,
      }}
      onMouseEnter={e => {
        if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'var(--surface2)';
      }}
      onMouseLeave={e => {
        if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'transparent';
      }}
    >
      {/* 아바타 */}
      <div style={{
        width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
        border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
        overflow: 'hidden', background: 'var(--surface2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: isSelected ? '0 0 10px rgba(29,233,182,0.4)' : 'none',
      }}>
        {member.avatarUrl ? (
          <img src={member.avatarUrl} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 16, color: isSelected ? 'var(--primary)' : 'var(--text-dim)' }}>
            {initials}
          </span>
        )}
      </div>

      {/* 텍스트 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 14, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {member.name}
          </span>
          {isOwner && (
            <span style={{ fontSize: 10, background: 'var(--primary-dim)', color: 'var(--primary)', borderRadius: 4, padding: '2px 6px', fontFamily: 'Syne', fontWeight: 700, flexShrink: 0 }}>
              나
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 1 }}>
          {member.generation}기 · {member.region}
        </div>
      </div>

      {/* 편집 버튼 (본인만) */}
      {isOwner && onEdit && (
        <button
          onClick={e => { e.stopPropagation(); onEdit(); }}
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--text-dim)', fontSize: 13, padding: '4px 8px',
            borderRadius: 6, flexShrink: 0, transition: 'color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-dim)')}
        >
          ✏️
        </button>
      )}
    </div>
  );
}
