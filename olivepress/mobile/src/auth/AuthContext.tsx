import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Permission, Role, User } from '../types';
import { authApi } from '../api/services';
import { clearToken, loadToken, saveTokens, setUnauthorizedHandler } from '../api/client';
import { syncPushToken } from '../utils/push';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  signingIn: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  can: (permission: Permission) => boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);

  const logout = useCallback(async () => {
    await clearToken();
    setUser(null);
    setToken(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      setToken(null);
    });
  }, []);

  useEffect(() => {
    (async () => {
      const stored = await loadToken();
      if (stored) {
        try {
          const me = await authApi.me();
          setUser(me);
          setToken(stored);
          void syncPushToken();
        } catch {
          await clearToken();
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setSigningIn(true);
    try {
      const res = await authApi.login(username.trim(), password);
      await saveTokens(res.token, res.refreshToken);
      setToken(res.token);
      setUser(res.user);
      void syncPushToken();
    } finally {
      setSigningIn(false);
    }
  }, []);

  const can = useCallback(
    (permission: Permission) => {
      if (!user) return false;
      if (user.role === ('ADMIN' as Role)) return true;
      return user.permissions?.includes(permission) ?? false;
    },
    [user]
  );

  const value = useMemo<AuthState>(
    () => ({
      user,
      token,
      loading,
      signingIn,
      login,
      logout,
      can,
      isAdmin: user?.role === 'ADMIN',
    }),
    [user, token, loading, signingIn, login, logout, can]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit etre utilise dans AuthProvider');
  return ctx;
}
