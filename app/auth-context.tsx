'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { AuthUser } from '@/types';

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
    try {
      await fetch('/api/auth/login', { method: 'DELETE' });
    } catch {
      // 네트워크 오류여도 클라이언트 상태는 초기화
    } finally {
      setUser(null);
    }
  };

  useEffect(() => { refresh(); }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
