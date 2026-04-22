'use client';

import { useEffect, useRef } from 'react';
import type { IMember } from '@/types';

interface Props {
  members: IMember[];
  onMarkerClick: (member: IMember) => void;
  selectedId?: string;
}

export default function MapView({ members, onMarkerClick, selectedId }: Props) {
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (mapRef.current) return; // 이미 초기화됨

    import('leaflet').then((L) => {
      // 기본 아이콘 픽스
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!containerRef.current) return;

      const map = L.map(containerRef.current, {
        center: [36.5, 127.8], // 한국 중심
        zoom: 7,
        zoomControl: true,
        attributionControl: false,
      });

      // CartoDB Dark 타일
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 18,
        subdomains: 'abcd',
      }).addTo(map);

      mapRef.current = map;

      // Attribution 커스텀 위치
      L.control.attribution({ position: 'bottomleft', prefix: '' }).addTo(map);

      renderMarkers(L, map, members);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current = {};
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // members 변경 시 마커 재렌더
  useEffect(() => {
    if (!mapRef.current) return;
    import('leaflet').then((L) => {
      renderMarkers(L, mapRef.current, members);
    });
  }, [members]);

  // 선택된 마커로 지도 이동
  useEffect(() => {
    if (!selectedId || !mapRef.current) return;
    const m = members.find((m) => m._id === selectedId);
    if (m) mapRef.current.setView([m.lat, m.lng], 10, { animate: true });
  }, [selectedId, members]);

  function renderMarkers(L: any, map: any, memberList: IMember[]) {
    // 기존 마커 제거
    Object.values(markersRef.current).forEach((m: any) => m.remove());
    markersRef.current = {};

    memberList.forEach((member) => {
      const initials = member.name.charAt(0);
      const isSelected = member._id === selectedId;

      const iconHtml = member.avatarUrl
        ? `<div class="member-marker-pin"><img class="member-marker-img" src="${member.avatarUrl}" alt="${member.name}" onerror="this.style.display='none';this.nextSibling.style.display='flex'" /><div class="member-marker-dot" style="display:none">${initials}</div>${isSelected ? '<div style="position:absolute;inset:-4px;border-radius:50%;border:2px solid #1de9b6;animation:pulse-ring 1.5s ease-out infinite;pointer-events:none"></div>' : ''}</div>`
        : `<div class="member-marker-pin"><div class="member-marker-dot">${initials}</div>${isSelected ? '<div style="position:absolute;inset:-4px;border-radius:50%;border:2px solid #1de9b6;animation:pulse-ring 1.5s ease-out infinite;pointer-events:none"></div>' : ''}</div>`;

      const icon = L.divIcon({
        html: iconHtml,
        className: '',
        iconSize: [44, 44],
        iconAnchor: [22, 22],
        popupAnchor: [0, -26],
      });

      const marker = L.marker([member.lat, member.lng], { icon });

      const popupContent = `
        <div style="min-width:160px;font-family:'Plus Jakarta Sans',sans-serif">
          <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:15px;color:#e8eaf6;margin-bottom:4px">${member.name}</div>
          <div style="font-size:12px;color:#1de9b6;margin-bottom:6px">${member.generation}기 · ${member.region}</div>
          ${member.bio ? `<div style="font-size:13px;color:#8899aa;line-height:1.5">${member.bio}</div>` : ''}
        </div>`;

      marker.bindPopup(popupContent);
      marker.on('click', () => onMarkerClick(member));
      marker.addTo(map);
      markersRef.current[member._id] = marker;
    });
  }

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', borderRadius: 'inherit' }}
    />
  );
}
