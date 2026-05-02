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

  // Simulated incoming push every ~25s
  useEffect(() => {
    const samples = [
      { title: "Novo lead atribuído", body: "Carlos Mendes — interesse em apto Pinheiros" },
      { title: "Mensagem recebida", body: "Juliana respondeu sobre orçamento" },
      { title: "Follow-up sugerido", body: "Eduardo está há 2h sem resposta" },
    ];
    const t = setInterval(() => {
      const s = samples[Math.floor(Math.random() * samples.length)];
      push(s);
    }, 25000);
    return () => clearInterval(t);
  }, [push]);

  return <Ctx.Provider value={{ toasts, push, dismiss }}>{children}</Ctx.Provider>;
}

export function useNotifications() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useNotifications must be used inside provider");
  return c;
}
