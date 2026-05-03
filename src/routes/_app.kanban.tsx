import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { MOCK_LEADS, STAGE_ORDER, STAGE_LABELS, MOCK_USERS } from "@/lib/mock-data";
import type { Lead, KanbanStage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Plus, MoreHorizontal, Building2, Stethoscope, Car, Filter } from "lucide-react";

export const Route = createFileRoute("/_app/kanban")({
  head: () => ({ meta: [{ title: "Funil de Vendas — InoovaWeb CRM" }] }),
  component: KanbanPage,
});

const NICHE_ICON = { imobiliaria: Building2, clinica: Stethoscope, carros: Car };

const STAGE_COLOR: Record<KanbanStage, string> = {
  novo: "border-info bg-info/5",
  qualificacao: "border-primary bg-primary/5",
  visita: "border-chart-4 bg-chart-4/5",
  proposta: "border-warning bg-warning/5",
  fechado: "border-success bg-success/5",
};

const STAGE_DOT: Record<KanbanStage, string> = {
  novo: "bg-info",
  qualificacao: "bg-primary",
  visita: "bg-chart-4",
  proposta: "bg-warning",
  fechado: "bg-success",
};

function KanbanPage() {
  const { user, isAdmin } = useAuth();
  const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<KanbanStage | null>(null);

  const visible = useMemo(
    () => (isAdmin ? leads : leads.filter((l) => l.assignedTo === user?.id)),
    [leads, isAdmin, user]
  );

  const grouped = useMemo(() => {
    const map: Record<KanbanStage, Lead[]> = {
      novo: [], qualificacao: [], visita: [], proposta: [], fechado: [],
    };
    visible.forEach((l) => map[l.stage].push(l));
    return map;
  }, [visible]);

  const handleDrop = (stage: KanbanStage) => {
    if (!draggingId) return;
    setLeads((prev) => prev.map((l) => (l.id === draggingId ? { ...l, stage } : l)));
    setDraggingId(null);
    setDragOver(null);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Funil de Vendas</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {visible.length} leads • Arraste para mover entre etapas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-border bg-card hover:bg-accent transition-colors">
              <Filter className="size-4" /> Filtros
            </button>
            <button className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-gradient-primary text-primary-foreground shadow-soft">
              <Plus className="size-4" /> Novo lead
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-x-auto scrollbar-thin">
        <div className="flex gap-4 p-4 md:p-6 min-w-max h-full">
          {STAGE_ORDER.map((stage) => {
            const items = grouped[stage];
            return (
              <div
                key={stage}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(stage);
                }}
                onDragLeave={() => setDragOver((s) => (s === stage ? null : s))}
                onDrop={() => handleDrop(stage)}
                className={cn(
                  "w-72 shrink-0 flex flex-col rounded-2xl border-t-4 bg-muted/40 transition-all",
                  STAGE_COLOR[stage],
                  dragOver === stage && "ring-2 ring-primary/40 scale-[1.01]"
                )}
              >
                <div className="px-3 pt-3 pb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn("size-2 rounded-full", STAGE_DOT[stage])} />
                    <span className="font-semibold text-sm">{STAGE_LABELS[stage]}</span>
                    <span className="text-xs text-muted-foreground bg-card px-1.5 rounded-md">
                      {items.length}
                    </span>
                  </div>
                  <button className="text-muted-foreground hover:text-foreground p-1">
                    <MoreHorizontal className="size-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-thin px-2 pb-2 space-y-2 min-h-[80px]">
                  {items.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      dragging={draggingId === lead.id}
                      onDragStart={() => setDraggingId(lead.id)}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setDragOver(null);
                      }}
                    />
                  ))}
                  {items.length === 0 && (
                    <div className="text-center text-xs text-muted-foreground py-6 border-2 border-dashed border-border rounded-xl">
                      Nenhum lead aqui
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LeadCard({
  lead,
  dragging,
  onDragStart,
  onDragEnd,
}: {
  lead: Lead;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const owner = MOCK_USERS.find((u) => u.id === lead.assignedTo);
  const NicheIcon = NICHE_ICON[lead.niche];

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "rounded-xl bg-card border border-border p-3 cursor-grab active:cursor-grabbing shadow-soft hover:shadow-elevated transition-all group",
        dragging && "opacity-40 scale-95"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            <img src={lead.avatar} className="size-9 rounded-full object-cover border border-border" alt="" />
            <div className="absolute -bottom-1 -right-1 size-4 rounded-full bg-card border border-border grid place-items-center shadow-sm">
              <NicheIcon className="size-2.5 text-primary" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm truncate group-hover:text-primary transition-colors">{lead.name}</div>
            <div className="text-[10px] text-muted-foreground flex items-center gap-1">
               <span className="capitalize">{lead.niche}</span>
            </div>
          </div>
        </div>
        {lead.unread > 0 && (
          <span className="size-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold grid place-items-center shrink-0 shadow-glow">
            {lead.unread}
          </span>
        )}
      </div>

      <div className="bg-muted/50 rounded-lg p-2 mb-3 border border-border/50">
        <div className="text-[11px] font-semibold text-foreground/80">
          {lead.imobiliaria?.valor || lead.clinica?.valor || lead.carros?.valor || "Valor não definido"}
        </div>
        <div className="text-[10px] text-muted-foreground truncate mt-0.5">
          {lead.imobiliaria?.tipo || lead.clinica?.procedimento || lead.carros?.modelo}
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mb-3">
        {lead.tags.slice(0, 2).map((t) => (
          <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-md bg-accent/50 text-accent-foreground font-medium">
            {t}
          </span>
        ))}
      </div>

      {owner && (
        <div className="flex items-center justify-between pt-2.5 border-t border-border/60">
          <div className="flex items-center gap-1.5">
            <img src={owner.avatar} className="size-4.5 rounded-full" alt="" />
            <span className="text-[10px] text-muted-foreground font-medium">{owner.name.split(" ")[0]}</span>
          </div>
          <div className="text-[9px] text-muted-foreground">
            {new Date(lead.lastMessageAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
          </div>
        </div>
      )}
    </div>
  );
}
