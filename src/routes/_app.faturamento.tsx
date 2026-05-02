import { createFileRoute } from "@tanstack/react-router";
import { CreditCard, Download, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_app/faturamento")({
  head: () => ({ meta: [{ title: "Faturamento — Nexora CRM" }] }),
  component: BillingPage,
});

function BillingPage() {
  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-6 py-4">
        <h1 className="text-2xl font-bold tracking-tight">Faturamento</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gerencie seu plano e histórico.</p>
      </header>

      <div className="p-6 max-w-5xl space-y-6">
        <div className="rounded-2xl bg-gradient-primary text-primary-foreground p-6 shadow-glow">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider opacity-80 font-semibold">Plano atual</div>
              <div className="text-3xl font-bold mt-1">Business</div>
              <div className="text-sm opacity-90 mt-1">10 usuários • IA ilimitada • multi-tenant</div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">R$ 497<span className="text-lg opacity-80">/mês</span></div>
              <button className="mt-2 px-4 py-2 rounded-xl bg-white/15 backdrop-blur hover:bg-white/25 text-sm font-medium transition">
                Alterar plano
              </button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {[
            { label: "Próxima cobrança", value: "12 nov 2026" },
            { label: "Forma de pagamento", value: "Visa •••• 4242" },
            { label: "Status", value: "Ativo" },
          ].map((it) => (
            <div key={it.label} className="rounded-2xl bg-card border border-border p-5 shadow-soft">
              <div className="text-xs text-muted-foreground">{it.label}</div>
              <div className="font-semibold mt-1">{it.value}</div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-card border border-border shadow-soft overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold">Histórico de faturas</h3>
            <CreditCard className="size-4 text-muted-foreground" />
          </div>
          <div className="divide-y divide-border">
            {[
              { date: "12 out 2026", value: "R$ 497,00" },
              { date: "12 set 2026", value: "R$ 497,00" },
              { date: "12 ago 2026", value: "R$ 497,00" },
              { date: "12 jul 2026", value: "R$ 397,00" },
            ].map((f) => (
              <div key={f.date} className="flex items-center justify-between px-5 py-3 hover:bg-accent/40">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-success/10 grid place-items-center text-success">
                    <CheckCircle2 className="size-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{f.date}</div>
                    <div className="text-xs text-muted-foreground">Pagamento aprovado</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">{f.value}</span>
                  <button className="p-2 rounded-lg hover:bg-accent text-muted-foreground">
                    <Download className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
