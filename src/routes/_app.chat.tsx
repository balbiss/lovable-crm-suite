import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { MOCK_LEADS, MOCK_MESSAGES, MOCK_USERS } from "@/lib/mock-data";
import type { Lead, Message } from "@/lib/types";
import {
  Search,
  Send,
  Mic,
  Paperclip,
  Sparkles,
  FileText,
  Phone,
  Video,
  MoreVertical,
  Play,
  Check,
  CheckCheck,
  ArrowLeft,
  Tag,
  Building2,
  Stethoscope,
  Car,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/chat")({
  head: () => ({ meta: [{ title: "Chat Central — Nexora CRM" }] }),
  component: ChatPage,
});

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 60000;
  if (diff < 1) return "agora";
  if (diff < 60) return `${Math.floor(diff)}m`;
  if (diff < 60 * 24) return `${Math.floor(diff / 60)}h`;
  return `${Math.floor(diff / 60 / 24)}d`;
}

const NICHE_ICON = {
  imobiliaria: Building2,
  clinica: Stethoscope,
  carros: Car,
};

function ChatPage() {
  const { user, isAdmin } = useAuth();
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [messagesByLead, setMessagesByLead] = useState(MOCK_MESSAGES);
  const [aiLoading, setAiLoading] = useState<null | "summary" | "suggest">(null);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const visibleLeads = useMemo(() => {
    const base = isAdmin ? MOCK_LEADS : MOCK_LEADS.filter((l) => l.assignedTo === user?.id);
    if (!search) return base;
    return base.filter((l) => l.name.toLowerCase().includes(search.toLowerCase()));
  }, [search, isAdmin, user]);

  // Default selection: first lead on desktop, none on mobile
  useEffect(() => {
    if (!activeId && visibleLeads.length > 0 && window.innerWidth >= 768) {
      setActiveId(visibleLeads[0].id);
    }
  }, [visibleLeads, activeId]);

  const activeLead = visibleLeads.find((l) => l.id === activeId) ?? null;
  const messages = activeId ? messagesByLead[activeId] ?? [] : [];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, activeId]);

  const sendDraft = () => {
    if (!draft.trim() || !activeId) return;
    const msg: Message = {
      id: `m${Date.now()}`,
      leadId: activeId,
      from: "agent",
      type: "text",
      content: draft.trim(),
      at: new Date().toISOString(),
      status: "sent",
    };
    setMessagesByLead((prev) => ({ ...prev, [activeId]: [...(prev[activeId] ?? []), msg] }));
    setDraft("");
  };

  const runAi = (kind: "summary" | "suggest") => {
    setAiLoading(kind);
    setAiResult(null);
    setTimeout(() => {
      if (kind === "summary") {
        setAiResult(
          `📝 Resumo: ${activeLead?.name} demonstrou interesse claro, perguntou sobre condições e disponibilidade. Solicitou agendamento e mencionou usar FGTS na entrada. Lead com alta intenção de compra.`
        );
      } else {
        setAiResult(
          `💬 Sugestão: "Ótimo, ${activeLead?.name?.split(" ")[0]}! Quinta às 16h fica perfeito. Já estou te enviando a localização e o link da visita virtual no WhatsApp. Posso confirmar?"`
        );
      }
      setAiLoading(null);
    }, 1100);
  };

  return (
    <div className="flex-1 flex min-h-0 bg-card">
      {/* Lead list — hidden on mobile when chat is open */}
      <div
        className={cn(
          "w-full md:w-80 lg:w-96 flex-col border-r border-border",
          activeId ? "hidden md:flex" : "flex"
        )}
      >
        <div className="px-4 py-4 border-b border-border">
          <h2 className="font-semibold text-lg mb-3">Conversas</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar lead..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-muted border-0 focus:ring-2 focus:ring-primary/30 outline-none"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {visibleLeads.map((l) => {
            const last = (messagesByLead[l.id] ?? []).slice(-1)[0];
            const NicheIcon = NICHE_ICON[l.niche];
            return (
              <button
                key={l.id}
                onClick={() => setActiveId(l.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-left border-b border-border/60 transition-colors",
                  activeId === l.id ? "bg-accent" : "hover:bg-accent/50"
                )}
              >
                <div className="relative">
                  <img src={l.avatar} alt="" className="size-12 rounded-full object-cover" />
                  <div className="absolute -bottom-0.5 -right-0.5 size-5 rounded-full bg-card grid place-items-center">
                    <NicheIcon className="size-3 text-primary" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium truncate">{l.name}</div>
                    <div className="text-[10px] text-muted-foreground shrink-0">
                      {timeAgo(l.lastMessageAt)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <div className="text-xs text-muted-foreground truncate">
                      {last?.from === "agent" ? "Você: " : ""}
                      {last?.type === "audio" ? "🎤 Áudio" : last?.content ?? "—"}
                    </div>
                    {l.unread > 0 && (
                      <span className="shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold grid place-items-center">
                        {l.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conversation */}
      <div className={cn("flex-1 min-w-0 flex flex-col", !activeId && "hidden md:flex")}>
        {activeLead ? (
          <ConversationView
            lead={activeLead}
            messages={messages}
            draft={draft}
            setDraft={setDraft}
            onSend={sendDraft}
            onBack={() => setActiveId(null)}
            onAi={runAi}
            aiLoading={aiLoading}
            aiResult={aiResult}
            onClearAi={() => setAiResult(null)}
          />
        ) : (
          <div className="flex-1 hidden md:grid place-items-center text-muted-foreground">
            <div className="text-center">
              <Sparkles className="size-10 mx-auto mb-2 text-primary" />
              <p>Selecione uma conversa</p>
            </div>
          </div>
        )}
      </div>

      {/* Lead sidebar (desktop only) */}
      {activeLead && <LeadSidebar lead={activeLead} />}
    </div>
  );
}

function ConversationView({
  lead,
  messages,
  draft,
  setDraft,
  onSend,
  onBack,
  onAi,
  aiLoading,
  aiResult,
  onClearAi,
}: {
  lead: Lead;
  messages: Message[];
  draft: string;
  setDraft: (s: string) => void;
  onSend: () => void;
  onBack: () => void;
  onAi: (k: "summary" | "suggest") => void;
  aiLoading: null | "summary" | "suggest";
  aiResult: string | null;
  onClearAi: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length, aiResult]);

  return (
    <>
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <button
          onClick={onBack}
          className="md:hidden p-2 -ml-2 rounded-lg hover:bg-accent"
          aria-label="Voltar"
        >
          <ArrowLeft className="size-5" />
        </button>
        <img src={lead.avatar} className="size-10 rounded-full object-cover" alt="" />
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{lead.name}</div>
          <div className="text-xs text-success flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-success animate-pulse-dot" />
            online · {lead.phone}
          </div>
        </div>
        <button className="p-2 rounded-lg hover:bg-accent text-muted-foreground"><Phone className="size-4" /></button>
        <button className="p-2 rounded-lg hover:bg-accent text-muted-foreground"><Video className="size-4" /></button>
        <button className="p-2 rounded-lg hover:bg-accent text-muted-foreground"><MoreVertical className="size-4" /></button>
      </header>

      {/* AI quick actions */}
      <div className="flex flex-wrap gap-2 px-4 py-2.5 border-b border-border bg-gradient-soft">
        <button
          onClick={() => onAi("summary")}
          disabled={!!aiLoading}
          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-card border border-border hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-60"
        >
          <FileText className="size-3.5" />
          {aiLoading === "summary" ? "Resumindo..." : "Resumir conversa"}
        </button>
        <button
          onClick={() => onAi("suggest")}
          disabled={!!aiLoading}
          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-gradient-primary text-primary-foreground shadow-soft disabled:opacity-60"
        >
          <Sparkles className="size-3.5" />
          {aiLoading === "suggest" ? "Pensando..." : "Sugerir resposta IA"}
        </button>
        {lead.tags.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-accent text-accent-foreground">
            <Tag className="size-3" /> {t}
          </span>
        ))}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-3 bg-gradient-soft">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {aiResult && (
          <div className="flex justify-center animate-slide-down">
            <div className="max-w-md rounded-2xl border-2 border-primary/30 bg-card px-4 py-3 shadow-soft">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                  <Sparkles className="size-3.5" /> ASSISTENTE IA
                </div>
                <button onClick={onClearAi} className="text-xs text-muted-foreground hover:text-foreground">
                  fechar
                </button>
              </div>
              <p className="text-sm leading-relaxed">{aiResult}</p>
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-border bg-card px-3 py-3">
        <div className="flex items-end gap-2">
          <button className="p-2.5 rounded-xl hover:bg-accent text-muted-foreground"><Paperclip className="size-5" /></button>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder="Digite uma mensagem..."
            rows={1}
            className="flex-1 max-h-32 resize-none px-4 py-2.5 text-sm rounded-xl bg-muted border-0 focus:ring-2 focus:ring-primary/30 outline-none"
          />
          {draft.trim() ? (
            <button
              onClick={onSend}
              className="p-2.5 rounded-xl bg-gradient-primary text-primary-foreground shadow-soft hover:opacity-95 active:scale-95 transition"
            >
              <Send className="size-5" />
            </button>
          ) : (
            <button className="p-2.5 rounded-xl hover:bg-accent text-muted-foreground">
              <Mic className="size-5" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const me = message.from === "agent";
  return (
    <div className={cn("flex", me ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[78%] md:max-w-[70%] rounded-2xl px-3.5 py-2.5 shadow-soft",
          me
            ? "bg-gradient-primary text-primary-foreground rounded-br-md"
            : "bg-card border border-border rounded-bl-md"
        )}
      >
        {message.type === "audio" ? (
          <AudioMessage message={message} mine={me} />
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        )}
        <div
          className={cn(
            "flex items-center gap-1 justify-end mt-1 text-[10px]",
            me ? "text-primary-foreground/70" : "text-muted-foreground"
          )}
        >
          {new Date(message.at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          {me && message.status === "read" && <CheckCheck className="size-3" />}
          {me && message.status === "delivered" && <CheckCheck className="size-3 opacity-60" />}
          {me && message.status === "sent" && <Check className="size-3" />}
        </div>
      </div>
    </div>
  );
}

function AudioMessage({ message, mine }: { message: Message; mine: boolean }) {
  const [showTranscript, setShowTranscript] = useState(false);
  return (
    <div className="min-w-[220px]">
      <div className="flex items-center gap-2.5">
        <button
          className={cn(
            "size-9 rounded-full grid place-items-center shrink-0",
            mine ? "bg-white/20" : "bg-primary/10 text-primary"
          )}
        >
          <Play className="size-4 ml-0.5" />
        </button>
        <div className="flex-1">
          <div className="flex gap-0.5 items-center h-6">
            {Array.from({ length: 22 }).map((_, i) => (
              <div
                key={i}
                className={cn("w-0.5 rounded-full", mine ? "bg-white/60" : "bg-primary/50")}
                style={{ height: `${20 + Math.sin(i) * 60 + (i % 3) * 8}%` }}
              />
            ))}
          </div>
          <div className={cn("text-[10px] mt-0.5", mine ? "text-white/70" : "text-muted-foreground")}>
            0:{String(message.duration ?? 0).padStart(2, "0")}
          </div>
        </div>
      </div>
      {message.transcription && (
        <>
          <button
            onClick={() => setShowTranscript((s) => !s)}
            className={cn(
              "mt-2 text-[10px] font-semibold inline-flex items-center gap-1 underline-offset-2 hover:underline",
              mine ? "text-white/90" : "text-primary"
            )}
          >
            <Sparkles className="size-3" />
            {showTranscript ? "Ocultar" : "Ver transcrição IA"}
          </button>
          {showTranscript && (
            <p className={cn("text-xs mt-1.5 italic leading-relaxed", mine ? "text-white/90" : "text-foreground")}>
              "{message.transcription}"
            </p>
          )}
        </>
      )}
    </div>
  );
}

function LeadSidebar({ lead }: { lead: Lead }) {
  const NicheIcon = NICHE_ICON[lead.niche];
  const owner = MOCK_USERS.find((u) => u.id === lead.assignedTo);

  return (
    <aside className="hidden xl:flex w-80 shrink-0 flex-col border-l border-border bg-card overflow-y-auto scrollbar-thin">
      <div className="p-5 text-center border-b border-border">
        <img src={lead.avatar} alt="" className="size-20 rounded-full mx-auto object-cover ring-4 ring-accent" />
        <h3 className="font-semibold mt-3">{lead.name}</h3>
        <p className="text-sm text-muted-foreground">{lead.phone}</p>
        <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 mt-3 rounded-full bg-accent text-accent-foreground capitalize">
          <NicheIcon className="size-3" /> {lead.niche}
        </span>
      </div>

      <div className="p-5 space-y-5">
        <Section title="Responsável">
          {owner && (
            <div className="flex items-center gap-2.5">
              <img src={owner.avatar} className="size-8 rounded-full" alt="" />
              <div>
                <div className="text-sm font-medium">{owner.name}</div>
                <div className="text-xs text-muted-foreground capitalize">{owner.role}</div>
              </div>
            </div>
          )}
        </Section>

        {lead.imobiliaria && (
          <Section title="Imobiliária">
            <Field label="Tipo" value={lead.imobiliaria.tipo} />
            <Field label="Bairro" value={lead.imobiliaria.bairro} />
            <Field label="Faixa de valor" value={lead.imobiliaria.valor} />
          </Section>
        )}
        {lead.clinica && (
          <Section title="Clínica">
            <Field label="Procedimento" value={lead.clinica.procedimento} />
            <Field label="Convênio" value={lead.clinica.convenio} />
          </Section>
        )}
        {lead.carros && (
          <Section title="Veículo">
            <Field label="Modelo" value={lead.carros.modelo} />
            <Field label="Ano" value={lead.carros.ano} />
            <Field label="Pagamento" value={lead.carros.financiamento} />
          </Section>
        )}

        <Section title="Tags">
          <div className="flex flex-wrap gap-1.5">
            {lead.tags.map((t) => (
              <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-accent text-accent-foreground">
                {t}
              </span>
            ))}
          </div>
        </Section>
      </div>
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
        {title}
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
