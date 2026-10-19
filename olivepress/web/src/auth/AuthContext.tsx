import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { authApi } from '../api/services';
import { clearToken, loadToken, saveTokens, setUnauthorizedHandler } from '../api/client';
import { Permission, User } from '../types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signingIn: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  can: (permission: Permission) => boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    (async () => {
      try {
        const token = await loadToken();
        if (token) {
          const me = await authApi.me();
          setUser(me);
        }
      } catch {
        await clearToken();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setSigningIn(true);
    try {
      const res = await authApi.login(username.trim(), password);
      await saveTokens(res.token, res.refreshToken);
      setUser(res.user);
    } finally {
      setSigningIn(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await clearToken();
    setUser(null);
  }, []);

  const can = useCallback(
    (permission: Permission) =>
      !!user && (user.role === 'ADMIN' || user.permissions.includes(permission)),
    [user],
  );

  const value = useMemo(
    () => ({ user, loading, signingIn, login, logout, can, isAdmin: user?.role === 'ADMIN' }),
    [user, loading, signingIn, login, logout, can],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
