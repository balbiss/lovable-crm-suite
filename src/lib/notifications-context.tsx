import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { PushNotification } from "./types";

interface NotificationsCtx {
  toasts: PushNotification[];
  push: (n: Omit<PushNotification, "id" | "at">) => void;
  dismiss: (id: string) => void;
}

const Ctx = createContext<NotificationsCtx | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<PushNotification[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (n: Omit<PushNotification, "id" | "at">) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((t) => [...t, { ...n, id, at: Date.now() }]);
      setTimeout(() => dismiss(id), 5000);
    },
    [dismiss]
  );

  // Notifications logic (real-time listeners can be added here)
  useEffect(() => {
    // Ready for real-time hooks
  }, []);

  return <Ctx.Provider value={{ toasts, push, dismiss }}>{children}</Ctx.Provider>;
}

export function useNotifications() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useNotifications must be used inside provider");
  return c;
}
