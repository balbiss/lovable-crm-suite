import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User, Role } from "./types";
import { supabase } from "./supabase";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  isAdmin: boolean;
  canAccess: (path: string) => boolean;
  setRole: (role: Role) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const ADMIN_ONLY_PATHS = ["/configuracoes", "/faturamento"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const mappedUser = await mapSupabaseUser(session.user);
        setUser(mappedUser);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const mappedUser = await mapSupabaseUser(session.user);
        setUser(mappedUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const mapSupabaseUser = async (sbUser: any): Promise<User> => {
    console.log("Mapeando usuário Supabase:", sbUser.id);
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("org_id, full_name, role")
      .eq("id", sbUser.id)
      .single();

    if (error) {
      console.error("Erro ao buscar perfil no Supabase:", error);
    }
    
    console.log("Perfil encontrado:", profile);

    const metadata = sbUser.user_metadata || {};
    const mapped = {
      id: sbUser.id,
      name: profile?.full_name || metadata.full_name || metadata.name || sbUser.email?.split("@")[0] || "Usuário",
      email: sbUser.email || "",
      role: (profile?.role as Role) || (metadata.role as Role) || "vendedor",
      avatar: metadata.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sbUser.id}`,
      companyName: metadata.company || metadata.company_name || "Minha Empresa",
      orgId: profile?.org_id || metadata.org_id,
      org_id: profile?.org_id || metadata.org_id, // compatibilidade snake_case
    };
    
    console.log("Usuário mapeado final:", mapped);
    return mapped;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const isAdmin = user?.role === "admin";

  const canAccess = (path: string) => {
    if (!user) return false;
    if (ADMIN_ONLY_PATHS.some((p) => path.startsWith(p))) return user.role === "admin";
    return true;
  };

  const setRole = (role: Role) => {
    if (user) {
      setUser({ ...user, role });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, isAdmin, canAccess, setRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
