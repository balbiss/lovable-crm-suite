import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppSidebar } from "./app-sidebar";
import { MobileTabBar } from "./mobile-tab-bar";
import { PushToastStack } from "./push-toast-stack";
import { useAuth } from "@/lib/auth-context";

export function AppLayout() {
  const { user, loading, canAccess } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    // Aguarda o Supabase restaurar a sessão antes de redirecionar
    if (loading) return;
    if (!user) {
      navigate({ to: "/login" });
    } else if (!canAccess(path)) {
      navigate({ to: "/dashboard" });
    }
  }, [user, loading, path, canAccess, navigate]);

  // Exibe spinner enquanto a sessão está sendo restaurada
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Carregando sessão...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <AppSidebar />
      <main className="flex-1 min-w-0 flex flex-col pb-14 md:pb-0">
        <Outlet />
      </main>
      <MobileTabBar />
      <PushToastStack />
    </div>
  );
}
