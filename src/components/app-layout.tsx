import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppSidebar } from "./app-sidebar";
import { MobileTabBar } from "./mobile-tab-bar";
import { PushToastStack } from "./push-toast-stack";
import { useAuth } from "@/lib/auth-context";

export function AppLayout() {
  const { user, canAccess } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!user) {
      navigate({ to: "/login" });
    } else if (!canAccess(path)) {
      navigate({ to: "/dashboard" });
    }
  }, [user, path, canAccess, navigate]);

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
