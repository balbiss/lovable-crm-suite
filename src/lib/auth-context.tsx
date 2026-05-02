import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "./types";
import { MOCK_USERS } from "./mock-data";

interface AuthContextValue {
  user: User | null;
  login: (userId: string) => void;
  logout: () => void;
  isAdmin: boolean;
  canAccess: (path: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "crm_demo_user";

const ADMIN_ONLY_PATHS = ["/configuracoes", "/faturamento"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = window.localStorage.getItem(STORAGE_KEY);
    if (id) {
      const found = MOCK_USERS.find((u) => u.id === id);
      if (found) setUser(found);
    }
  }, []);

  const login = (userId: string) => {
    const found = MOCK_USERS.find((u) => u.id === userId);
    if (found) {
      setUser(found);
      window.localStorage.setItem(STORAGE_KEY, found.id);
    }
  };

  const logout = () => {
    setUser(null);
    window.localStorage.removeItem(STORAGE_KEY);
  };

  const isAdmin = user?.role === "admin";

  const canAccess = (path: string) => {
    if (!user) return false;
    if (ADMIN_ONLY_PATHS.some((p) => path.startsWith(p))) return user.role === "admin";
    return true;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin, canAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
