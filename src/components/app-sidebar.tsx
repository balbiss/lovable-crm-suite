import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  MessagesSquare,
  KanbanSquare,
  Settings,
  CreditCard,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
}

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/chat", label: "Chat Central", icon: MessagesSquare },
  { to: "/kanban", label: "Funil de Vendas", icon: KanbanSquare },
  { to: "/configuracoes", label: "Configurações", icon: Settings, adminOnly: true },
  { to: "/configuracoes-ia", label: "Cérebro da IA", icon: Sparkles, adminOnly: true },
  { to: "/faturamento", label: "Faturamento", icon: CreditCard, adminOnly: true },
];

function GlobalAIToggle({ orgId }: { orgId?: string }) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    
    async function loadStatus() {
      const { data } = await supabase
        .from("organizations")
        .select("global_ai_enabled")
        .eq("id", orgId)
        .single();
      
      if (data) setEnabled(data.global_ai_enabled !== false);
    }
    loadStatus();
  }, [orgId]);

  const toggle = async () => {
    if (!orgId || loading) return;
    setLoading(true);
    const newValue = !enabled;
    
    const { error } = await supabase
      .from("organizations")
      .update({ global_ai_enabled: newValue })
      .eq("id", orgId);
    
    if (!error) {
      setEnabled(newValue);
    }
    setLoading(false);
  };

  if (enabled === null) return null;

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={cn(
        "flex items-center justify-between w-full p-2.5 rounded-lg border transition-all mb-2",
        enabled 
          ? "bg-primary/5 border-primary/20 text-primary shadow-sm" 
          : "bg-slate-50 border-slate-200 text-slate-500 opacity-80"
      )}
    >
      <div className="flex items-center gap-2">
        <Sparkles className={cn("size-3.5", enabled ? "text-primary" : "text-slate-400")} />
        <span className="text-[10px] font-bold uppercase tracking-wider">
          {enabled ? "IA GERAL ATIVA" : "IA GERAL DESLIGADA"}
        </span>
      </div>
      <div className={cn(
        "w-8 h-4 rounded-full relative transition-colors",
        enabled ? "bg-primary" : "bg-slate-300"
      )}>
        <div className={cn(
          "absolute top-0.5 left-0.5 size-3 bg-white rounded-full transition-transform shadow-sm",
          enabled ? "translate-x-4" : "translate-x-0"
        )} />
      </div>
    </button>
  );
}

export function AppSidebar() {
  const { user, isAdmin, logout, setRole } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  const items = NAV.filter((i) => !i.adminOnly || isAdmin);

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="size-9 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
            <Sparkles className="size-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-semibold leading-tight">InoovaWeb CRM</div>
            <div className="text-xs text-muted-foreground">Multi-tenant</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {items.map((item) => {
          const active = path.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-soft"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className={cn("size-4", active && "text-primary")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <div className="flex flex-col gap-3 px-2 py-2">
          <div className="flex items-center gap-3">
            <img src={user?.avatar} alt={user?.name} className="size-9 rounded-full object-cover" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user?.companyName}</div>
              <div className="text-xs text-muted-foreground truncate">{user?.name} • {user?.role}</div>
            </div>
            <button
              onClick={() => {
                logout();
                navigate({ to: "/login" });
              }}
              className="p-2 rounded-md hover:bg-sidebar-accent text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Sair"
            >
              <LogOut className="size-4" />
            </button>
          </div>
          
          <div className="mt-2">
            {isAdmin && <GlobalAIToggle orgId={user?.orgId} />}
            
            <div className="flex items-center gap-1 p-1 bg-sidebar-accent/50 rounded-lg mb-2">
              <button
                onClick={() => setRole("admin")}
                className={cn(
                  "flex-1 px-2 py-1 text-[10px] font-bold rounded-md transition-all",
                  isAdmin ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                ADMIN
              </button>
              <button
                onClick={() => setRole("vendedor")}
                className={cn(
                  "flex-1 px-2 py-1 text-[10px] font-bold rounded-md transition-all",
                  !isAdmin ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                VENDEDOR
              </button>
            </div>

            <button
              onClick={async () => {
              const newStatus = !user?.online_status;
              const { error } = await supabase.from("profiles").update({ online_status: newStatus }).eq("id", user?.id);
              if (!error) {
                // Atualiza o contexto local (se possível) ou apenas recarrega
                window.location.reload(); 
              }
            }}
            className={cn(
              "flex items-center justify-center gap-2 w-full py-2 rounded-lg border text-[10px] font-bold transition-all",
              user?.online_status 
                ? "bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm" 
                : "bg-slate-50 border-slate-200 text-slate-500"
            )}
          >
            <div className={cn("size-2 rounded-full", user?.online_status ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} />
            {user?.online_status ? "VOCÊ ESTÁ ONLINE" : "FICAR ONLINE"}
          </button>
        </div>
      </div>
    </aside>
  );
}
