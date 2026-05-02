import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { MOCK_USERS } from "@/lib/mock-data";
import { Sparkles, ShieldCheck, User as UserIcon, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — Nexora CRM" },
      { name: "description", content: "Acesse o CRM multi-tenant Nexora." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string>("u-admin");

  useEffect(() => {
    if (user) navigate({ to: "/dashboard" });
  }, [user, navigate]);

  const handle = () => {
    login(selected);
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen w-full grid md:grid-cols-2 bg-gradient-soft">
      {/* Brand panel */}
      <div className="hidden md:flex relative overflow-hidden bg-gradient-primary text-primary-foreground p-12 flex-col justify-between">
        <div className="absolute -top-32 -right-32 size-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 size-96 rounded-full bg-white/10 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="size-11 rounded-2xl bg-white/15 backdrop-blur grid place-items-center">
            <Sparkles className="size-6" />
          </div>
          <div>
            <div className="text-lg font-semibold">Nexora CRM</div>
            <div className="text-sm opacity-80">Multi-tenant Híbrido</div>
          </div>
        </div>

        <div className="relative space-y-6 max-w-md">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            Atendimento, IA e vendas em um só lugar.
          </h1>
          <p className="text-base opacity-90 leading-relaxed">
            Centralize WhatsApp, Kanban, automação e relatórios para imobiliárias, clínicas e
            concessionárias — em desktop ou no celular.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { v: "+82%", l: "Resposta" },
              { v: "24%", l: "Conversão" },
              { v: "3x", l: "Produtividade" },
            ].map((s) => (
              <div key={s.l} className="rounded-xl bg-white/10 backdrop-blur px-4 py-3">
                <div className="text-2xl font-bold">{s.v}</div>
                <div className="text-xs opacity-80">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-xs opacity-70">© 2026 Nexora — Todos os direitos reservados</div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <div className="md:hidden flex items-center gap-2 mb-8">
            <div className="size-10 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
              <Sparkles className="size-5 text-primary-foreground" />
            </div>
            <div className="font-semibold text-lg">Nexora CRM</div>
          </div>

          <h2 className="text-3xl font-bold tracking-tight">Bem-vindo de volta</h2>
          <p className="text-muted-foreground mt-2">
            Selecione um perfil de demonstração para experimentar as permissões.
          </p>

          <div className="mt-8 space-y-3">
            {MOCK_USERS.map((u) => {
              const isSel = selected === u.id;
              const Icon = u.role === "admin" ? ShieldCheck : UserIcon;
              return (
                <button
                  key={u.id}
                  onClick={() => setSelected(u.id)}
                  className={cn(
                    "w-full flex items-center gap-4 rounded-2xl border p-4 transition-all text-left",
                    isSel
                      ? "border-primary bg-accent shadow-soft ring-2 ring-primary/20"
                      : "border-border bg-card hover:border-primary/30 hover:bg-accent/40"
                  )}
                >
                  <img src={u.avatar} alt="" className="size-12 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{u.name}</span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full",
                          u.role === "admin"
                            ? "bg-primary/10 text-primary"
                            : "bg-success/10 text-success"
                        )}
                      >
                        <Icon className="size-3" /> {u.role}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground truncate">{u.email}</div>
                  </div>
                  <div
                    className={cn(
                      "size-5 rounded-full border-2 transition-colors shrink-0",
                      isSel ? "border-primary bg-primary" : "border-border"
                    )}
                  />
                </button>
              );
            })}
          </div>

          <button
            onClick={handle}
            className="mt-8 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-primary text-primary-foreground py-3.5 font-semibold shadow-glow hover:opacity-95 active:scale-[0.99] transition"
          >
            Entrar como{" "}
            {MOCK_USERS.find((u) => u.id === selected)?.name.split(" ")[0]}
            <ArrowRight className="size-4" />
          </button>

          <p className="mt-6 text-xs text-center text-muted-foreground">
            Demo — alterne entre Admin e Vendedor para ver a diferença de permissões.
          </p>
        </div>
      </div>
    </div>
  );
}
