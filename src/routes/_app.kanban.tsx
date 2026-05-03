import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Plus, MoreHorizontal, MessageSquare, User, Tag, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/kanban")({
  head: () => ({ meta: [{ title: "Funil de Vendas — InoovaWeb CRM" }] }),
  component: KanbanPage,
});

const STAGE_LABELS: Record<string, string> = {
  novo: "Novos / Aguardando",
  qualificacao: "Em Atendimento",
  visita: "Agendados",
  proposta: "Proposta",
  fechado: "Fechados / Sucesso",
};

const STAGE_ORDER = ["novo", "qualificacao", "visita", "proposta", "fechado"];

const STAGE_COLOR: Record<string, string> = {
  novo: "border-blue-500 bg-blue-50/30",
  qualificacao: "border-orange-500 bg-orange-50/30",
  visita: "border-violet-500 bg-violet-50/30",
  proposta: "border-primary bg-primary/5",
  fechado: "border-emerald-500 bg-emerald-50/30",
};

function KanbanPage() {
  const { orgId, user, isAdmin } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sellers, setSellers] = useState<any[]>([]);

  useEffect(() => {
    if (orgId) {
      loadData();
      loadSellers();
    }
  }, [orgId]);

  const loadSellers = async () => {
    const { data } = await supabase.from("profiles").select("id, full_name").eq("org_id", orgId);
    if (data) setSellers(data);
  };

  const loadData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("org_id", orgId)
      .order("last_message_at", { ascending: false });

    if (!error && data) setConversations(data);
    setLoading(false);
  };

  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {
      novo: [], qualificacao: [], visita: [], proposta: [], fechado: [],
    };

    conversations.forEach((conv) => {
      // Mapeamento lógico de status/labels para colunas do Kanban
      const labels = conv.labels || [];
      if (labels.includes("Fechado") || conv.status === 'finalizado') {
        map.fechado.push(conv);
      } else if (labels.includes("Agendado")) {
        map.visita.push(conv);
      } else if (labels.includes("Quente")) {
        map.qualificacao.push(conv);
      } else if (conv.status === 'atendimento') {
        map.proposta.push(conv);
      } else {
        map.novo.push(conv);
      }
    });

    return map;
  }, [conversations]);

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from("conversations").update({ status: newStatus }).eq("id", id);
    if (!error) loadData();
    else toast.error("Erro ao atualizar.");
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
      <header className="bg-white border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Funil de Vendas</h1>
            <p className="text-sm text-muted-foreground mt-1">Gerencie seus leads do WhatsApp em tempo real</p>
          </div>
          <button onClick={loadData} className="p-2 rounded-lg hover:bg-accent text-muted-foreground">
            <RefreshCw className={cn("size-5", loading && "animate-spin")} />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-6 p-6 min-w-max h-full">
          {STAGE_ORDER.map((stage) => (
            <div key={stage} className={cn("w-80 shrink-0 flex flex-col rounded-2xl border-t-4 shadow-sm bg-white/50", STAGE_COLOR[stage])}>
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-700 uppercase tracking-tight">{STAGE_LABELS[stage]}</span>
                  <span className="bg-white px-2 py-0.5 rounded-full text-[10px] font-bold border border-border shadow-sm text-slate-500">
                    {grouped[stage].length}
                  </span>
                </div>
                <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal className="size-4" /></button>
              </div>

              <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-3">
                {grouped[stage].map((conv) => (
                  <LeadCard key={conv.id} conv={conv} seller={sellers.find(s => s.id === conv.assigned_to)} />
                ))}
                {grouped[stage].length === 0 && (
                  <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-xl">
                    <p className="text-xs text-slate-400">Nenhum lead nesta etapa</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LeadCard({ conv, seller }: { conv: any, seller?: any }) {
  const initials = (conv.contact_name || conv.contact_phone || "?").slice(0, 2).toUpperCase();
  
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all group cursor-pointer">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0 overflow-hidden">
            {conv.contact_avatar ? <img src={conv.contact_avatar} className="size-full object-cover" /> : initials}
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-primary transition-colors">
              {conv.contact_name || conv.contact_phone}
            </h4>
            <p className="text-[10px] text-slate-500 font-medium">+{conv.contact_phone}</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 rounded-lg p-2.5 mb-3 border border-slate-100">
        <p className="text-[11px] text-slate-600 line-clamp-2 italic leading-relaxed">
          "{conv.last_message_preview || "Sem mensagens"}"
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {conv.labels?.map((l: string) => (
          <span key={l} className="text-[9px] px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
            {l}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex items-center gap-1.5">
          <div className="size-5 rounded-full bg-slate-100 grid place-items-center">
            <User className="size-3 text-slate-400" />
          </div>
          <span className="text-[10px] text-slate-500 font-bold">{seller?.full_name || "Sem Atendente"}</span>
        </div>
        <div className="text-[9px] text-slate-400 font-medium">
          {new Date(conv.last_message_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
        </div>
      </div>
    </div>
  );
}
