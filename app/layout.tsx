'use client';

import './globals.css';
import { createContext, useContext, useEffect, useState } from 'react';
import type { AuthUser } from '@/types';

/* ── Auth Context ───────────────────────────────────────────── */
interface AuthCtx {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
  user: null, loading: true,
  refresh: async () => {}, logout: async () => {},
});

export function useAuth() { return useContext(AuthContext); }

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setUser(data.user ?? null);
    } catch { setUser(null); }
    finally { setLoading(false); }
  };

  const logout = async () => {
    await fetch('/api/auth/login', { method: 'DELETE' });
    setUser(null);
  };

  useEffect(() => { refresh(); }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/* ── Root Layout ────────────────────────────────────────────── */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <title>미디올로지 전국 지도</title>
        <meta name="description" content="전국 미디올로지 동아리원 지도" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
