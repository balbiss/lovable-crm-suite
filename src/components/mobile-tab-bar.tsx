import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, MessagesSquare, KanbanSquare, Settings } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

export function MobileTabBar() {
  const { isAdmin } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const items = [
    { to: "/dashboard", label: "Início", icon: LayoutDashboard },
    { to: "/chat", label: "Chat", icon: MessagesSquare },
    { to: "/kanban", label: "Funil", icon: KanbanSquare },
    ...(isAdmin ? [{ to: "/configuracoes", label: "Ajustes", icon: Settings }] : []),
  ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur-md safe-bottom">
      <div className="flex">
        {items.map((it) => {
          const active = path.startsWith(it.to);
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs"
            >
              <Icon
                className={cn(
                  "size-5 transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              />
              <span
                className={cn(
                  "transition-colors",
                  active ? "text-primary font-medium" : "text-muted-foreground"
                )}
              >
                {it.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
