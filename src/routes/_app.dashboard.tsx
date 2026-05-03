import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { TrendingUp, Users, Target, Clock, DollarSign, MessageSquare } from "lucide-react";
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
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — InoovaWeb CRM" }] }),
  component: DashboardPage,
});

function MetricCard({
  icon: Icon,
  label,
  value,
  delta,
  format,
  loading
}: {
  icon: any;
  label: string;
  value: number;
  delta?: number;
  format?: "number" | "percent" | "currency" | "minutes";
  loading?: boolean;
}) {
  const formatted = loading ? "..." : 
    format === "currency"
      ? value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
      : format === "percent"
      ? `${value.toFixed(1)}%`
      : format === "minutes"
      ? `${value.toFixed(1)} min`
      : value.toLocaleString("pt-BR");

  return (
    <div className="rounded-2xl bg-card border border-border p-5 shadow-soft hover:shadow-elevated transition-shadow">
      <div className="flex items-start justify-between">
        <div className="size-10 rounded-xl bg-accent grid place-items-center text-primary">
          <Icon className="size-5" />
        </div>
        {delta !== undefined && (
          <div className={cn(
            "inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full",
            delta >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
          )}>
            <TrendingUp className={cn("size-3", delta < 0 && "rotate-180")} />
            {Math.abs(delta).toFixed(1)}%
          </div>
        )}
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
  const [metrics, setMetrics] = useState({
    totalLeads: 0,
    activeChats: 0,
    finishedChats: 0,
    newLeads7d: 0
  });
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!user?.org_id) return;
      
      const { data: convs } = await supabase
        .from("conversations")
        .select("*")
        .eq("org_id", user.org_id)
        .order("created_at", { ascending: false });

      if (convs) {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        setMetrics({
          totalLeads: convs.length,
          activeChats: convs.filter(c => c.status === "atendimento").length,
          finishedChats: convs.filter(c => c.status === "finalizado").length,
          newLeads7d: convs.filter(c => new Date(c.created_at) > sevenDaysAgo).length
        });
        setRecentLeads(convs.slice(0, 5));
      }
      setLoading(false);
    }
    fetchData();
  }, [user?.org_id]);

  const chartData = [
    { name: "Aguardando", leads: metrics.totalLeads - metrics.activeChats - metrics.finishedChats },
    { name: "Atendimento", leads: metrics.activeChats },
    { name: "Finalizado", leads: metrics.finishedChats },
  ];

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-[#f8fafc]">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Olá, {user?.companyName || "Equipe"} 👋
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isAdmin ? "Visão geral da operação" : "Seus leads e atendimentos"}
            </p>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6 w-full max-w-7xl mx-auto">
        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            icon={Users}
            label="Total de Leads"
            value={metrics.totalLeads}
            loading={loading}
          />
          <MetricCard
            icon={MessageSquare}
            label="Novos (7 dias)"
            value={metrics.newLeads7d}
            delta={metrics.totalLeads > 0 ? (metrics.newLeads7d / metrics.totalLeads) * 100 : 0}
            loading={loading}
          />
          <MetricCard
            icon={Clock}
            label="Em Atendimento"
            value={metrics.activeChats}
            loading={loading}
          />
          <MetricCard
            icon={Target}
            label="Conversão (Finalizados)"
            value={metrics.totalLeads > 0 ? (metrics.finishedChats / metrics.totalLeads) * 100 : 0}
            format="percent"
            loading={loading}
          />
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-card border border-border p-5 shadow-soft">
            <h3 className="font-semibold mb-4">Status do Funil Real</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} />
                <Tooltip cursor={{ fill: "#f8fafc" }} />
                <Bar dataKey="leads" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl bg-card border border-border shadow-soft overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-muted/20">
              <h3 className="font-semibold">Atividades Recentes</h3>
            </div>
            <div className="divide-y divide-border">
              {recentLeads.length > 0 ? (
                recentLeads.map((l) => (
                  <div key={l.id} className="flex items-center gap-4 px-5 py-3 hover:bg-accent/40 transition-colors">
                    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                      {l.contact_name?.substring(0, 2).toUpperCase() || "WA"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{l.contact_name || l.contact_phone}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        Última msg: {l.last_message_preview || "Nenhuma mensagem"}
                      </div>
                    </div>
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                      l.status === "finalizado" ? "bg-emerald-100 text-emerald-700" :
                      l.status === "atendimento" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700"
                    )}>
                      {l.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-10 text-center text-muted-foreground text-sm">
                  Nenhum lead encontrado ainda.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
