import { Bell, X } from "lucide-react";
import { useNotifications } from "@/lib/notifications-context";

export function PushToastStack() {
  const { toasts, dismiss } = useNotifications();

  return (
    <div className="fixed top-0 inset-x-0 z-[100] flex flex-col items-center pointer-events-none safe-top">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto m-2 w-full max-w-md rounded-2xl bg-card/95 backdrop-blur-md shadow-elevated border border-border px-4 py-3 animate-slide-down"
        >
          <div className="flex items-start gap-3">
            <div className="size-9 rounded-xl bg-gradient-primary grid place-items-center shrink-0">
              <Bell className="size-4 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                  InoovaWeb CRM
                </span>
                <span className="text-[10px] text-muted-foreground">agora</span>
              </div>
              <div className="font-medium text-sm leading-tight mt-0.5">{t.title}</div>
              <div className="text-sm text-muted-foreground line-clamp-2">{t.body}</div>
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="text-muted-foreground hover:text-foreground p-1"
              aria-label="Dispensar"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
