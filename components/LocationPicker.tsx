'use client';

import { useEffect, useRef } from 'react';

interface Props {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

export default function LocationPicker({ lat, lng, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || mapRef.current) return;

    import('leaflet').then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;

      if (!containerRef.current) return;
      const map = L.map(containerRef.current, {
        center: [lat || 36.5, lng || 127.8],
        zoom: 7,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 18, subdomains: 'abcd',
      }).addTo(map);

      // 기존 위치 마커
      if (lat && lng) {
        markerRef.current = L.marker([lat, lng]).addTo(map);
      }

      map.on('click', (e: any) => {
        const { lat: newLat, lng: newLng } = e.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng([newLat, newLng]);
        } else {
          markerRef.current = L.marker([newLat, newLng]).addTo(map);
        }
        onChange(parseFloat(newLat.toFixed(5)), parseFloat(newLng.toFixed(5)));
      });

      mapRef.current = map;
    });

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
      <div style={{ padding: '8px 12px', background: 'var(--surface2)', fontSize: 12, color: 'var(--text-dim)', borderBottom: '1px solid var(--border)' }}>
        📍 지도를 클릭해서 내 위치를 선택하세요
        {lat && lng && (
          <span style={{ marginLeft: 8, color: 'var(--primary)' }}>
            {lat.toFixed(3)}, {lng.toFixed(3)} ✓
          </span>
        )}
      </div>
      <div ref={containerRef} style={{ height: 220 }} />
    </div>
  );
}
