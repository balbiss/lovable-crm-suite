import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { MOCK_METRICS, MOCK_CHART_FUNNEL, MOCK_CHART_DAILY, MOCK_LEADS, STAGE_LABELS } from "@/lib/mock-data";
import { TrendingUp, TrendingDown, Users, Target, Clock, DollarSign } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Nexora CRM" }] }),
  component: DashboardPage,
});

function MetricCard({
  icon: Icon,
  label,
  value,
  delta,
  format,
  invertDelta,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  delta: number;
  format?: "number" | "percent" | "currency" | "minutes";
  invertDelta?: boolean;
}) {
  const formatted =
    format === "currency"
      ? value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
      : format === "percent"
      ? `${value.toFixed(1)}%`
      : format === "minutes"
      ? `${value.toFixed(1)} min`
      : value.toLocaleString("pt-BR");
  const positive = invertDelta ? delta < 0 : delta > 0;

  return (
    <div className="rounded-2xl bg-card border border-border p-5 shadow-soft hover:shadow-elevated transition-shadow">
      <div className="flex items-start justify-between">
        <div className="size-10 rounded-xl bg-accent grid place-items-center text-primary">
          <Icon className="size-5" />
        </div>
        <div
          className={cn(
            "inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full",
            positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
          )}
        >
          {positive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
          {Math.abs(delta).toFixed(1)}%
        </div>
      </div>
      <div className="mt-4">
        <div className="text-2xl font-bold tracking-tight">{formatted}</div>
        <div className="text-sm text-muted-foreground mt-1">{label}</div>
      </div>
    </div>
  );
}

function DashboardPage() {
  const { user, isAdmin } = useAuth();

  const myLeads = isAdmin
    ? MOCK_LEADS
    : MOCK_LEADS.filter((l) => l.assignedTo === user?.id);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Olá, {user?.name.split(" ")[0]} 👋
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isAdmin ? "Visão geral da operação" : "Seus leads e atendimentos"}
            </p>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6 max-w-7xl">
        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            icon={Users}
            label="Novos leads (7d)"
            value={isAdmin ? MOCK_METRICS.newLeads.value : myLeads.length}
            delta={MOCK_METRICS.newLeads.delta}
          />
          <MetricCard
            icon={Target}
            label="Taxa de conversão"
            value={MOCK_METRICS.conversion.value}
            delta={MOCK_METRICS.conversion.delta}
            format="percent"
          />
          <MetricCard
            icon={Clock}
            label="Tempo de resposta"
            value={MOCK_METRICS.avgResponse.value}
            delta={MOCK_METRICS.avgResponse.delta}
            format="minutes"
            invertDelta
          />
          {isAdmin && (
            <MetricCard
              icon={DollarSign}
              label="Receita gerada"
              value={MOCK_METRICS.revenue.value}
              delta={MOCK_METRICS.revenue.delta}
              format="currency"
            />
          )}
          {!isAdmin && (
            <MetricCard
              icon={DollarSign}
              label="Meta do mês"
              value={68}
              delta={5.2}
              format="percent"
            />
          )}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-card border border-border p-5 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Atendimentos vs Fechamentos</h3>
                <p className="text-xs text-muted-foreground">Últimos 7 dias</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={MOCK_CHART_DAILY}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.52 0.18 268)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="oklch(0.52 0.18 268)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.65 0.16 155)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="oklch(0.65 0.16 155)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.008 255)" vertical={false} />
                <XAxis dataKey="day" stroke="oklch(0.5 0.02 258)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.5 0.02 258)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(1 0 0)",
                    border: "1px solid oklch(0.92 0.008 255)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="atendimentos" stroke="oklch(0.52 0.18 268)" strokeWidth={2} fill="url(#g1)" />
                <Area type="monotone" dataKey="fechados" stroke="oklch(0.65 0.16 155)" strokeWidth={2} fill="url(#g2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl bg-card border border-border p-5 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Funil de conversão</h3>
                <p className="text-xs text-muted-foreground">Distribuição por etapa</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={MOCK_CHART_FUNNEL} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.008 255)" horizontal={false} />
                <XAxis type="number" stroke="oklch(0.5 0.02 258)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="stage" stroke="oklch(0.5 0.02 258)" fontSize={12} tickLine={false} axisLine={false} width={70} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(1 0 0)",
                    border: "1px solid oklch(0.92 0.008 255)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="leads" fill="oklch(0.52 0.18 268)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent leads */}
        <div className="rounded-2xl bg-card border border-border shadow-soft overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-semibold">{isAdmin ? "Leads recentes" : "Meus leads"}</h3>
          </div>
          <div className="divide-y divide-border">
            {myLeads.slice(0, 5).map((l) => (
              <div key={l.id} className="flex items-center gap-4 px-5 py-3 hover:bg-accent/40 transition-colors">
                <img src={l.avatar} alt="" className="size-10 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{l.name}</div>
                  <div className="text-xs text-muted-foreground capitalize">{l.niche}</div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-accent text-accent-foreground font-medium">
                  {STAGE_LABELS[l.stage]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
