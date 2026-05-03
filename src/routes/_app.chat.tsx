import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  Search,
  Send,
  Mic,
  Paperclip,
  Sparkles,
  FileText,
  MoreVertical,
  Check,
  CheckCheck,
  ArrowLeft,
  MessageSquare,
  Loader2,
  RefreshCw,
  Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/chat")({
  head: () => ({ meta: [{ title: "Chat Central — InoovaWeb CRM" }] }),
  component: ChatPage,
});

const API = import.meta.env.VITE_API_URL || "https://api-crminoovaweb.inoovaweb.com.br/api";

// Tipos reais (sem mock)
interface Conversation {
  id: string;
  org_id: string;
  jid: string;
  contact_name: string | null;
  contact_phone: string | null;
  unread_count: number;
  last_message_at: string;
  last_message_preview: string | null;
}

interface Message {
  id: string;
  conversation_id: string;
  org_id: string;
  content: string | null;
  is_from_me: boolean;
  type: string;
  status: number;
  created_at: string;
}

function timeAgo(iso: string) {
  if (!iso) return "";
  const diff = (Date.now() - new Date(iso).getTime()) / 60000;
  if (diff < 1) return "agora";
  if (diff < 60) return `${Math.floor(diff)}m`;
  if (diff < 60 * 24) return `${Math.floor(diff / 60)}h`;
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function getInitials(name: string | null, phone: string | null): string {
  const n = name || phone || "?";
  return n.slice(0, 2).toUpperCase();
}

function avatarColor(jid: string): string {
  const colors = [
    "bg-violet-500", "bg-blue-500", "bg-emerald-500",
    "bg-orange-500", "bg-pink-500", "bg-indigo-500",
    "bg-teal-500", "bg-rose-500"
  ];
  const idx = jid.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
  return colors[idx];
}

function ChatPage() {
  const { user } = useAuth();
  const orgId = user?.orgId;

  const [search, setSearch] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [instanceId, setInstanceId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Busca o instanceId da org
  useEffect(() => {
    if (!orgId) return;
    fetch(`${API}/papi/instances`)
      .then((r) => r.json())
      .catch(() => []);
    
    // Busca do Supabase via backend (rota que já temos)
    import("@/lib/supabase").then(({ supabase }) => {
      supabase
        .from("organizations")
        .select("papi_instance_id")
        .eq("id", orgId)
        .single()
        .then(({ data }) => {
          if (data?.papi_instance_id) setInstanceId(data.papi_instance_id);
        });
    });
  }, [orgId]);

  // Carrega conversas
  const loadConversations = useCallback(async () => {
    if (!orgId) return;
    try {
      const r = await fetch(`${API}/chat/conversations?orgId=${orgId}`);
      if (r.ok) {
        const data = await r.json();
        setConversations(data);
      }
    } catch (error) {
      console.error("Erro ao carregar conversas:", error);
    } finally {
      setLoadingConvs(false);
    }
  }, [orgId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // SSE — eventos em tempo real
  useEffect(() => {
    if (!orgId) return;
    const evtSource = new EventSource(`${API}/chat/sse/${orgId}`);

    evtSource.addEventListener("new_message", (e) => {
      const payload = JSON.parse(e.data);
      const newMsg: Message = payload.message;
      const updatedConv: Conversation = payload.conversation;

      // Atualiza a conversa na lista
      setConversations((prev) => {
        const exists = prev.find((c) => c.id === updatedConv.id);
        if (exists) {
          return prev
            .map((c) => c.id === updatedConv.id ? { ...c, ...updatedConv } : c)
            .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
        }
        return [updatedConv, ...prev];
      });

      // Se a conversa estiver aberta, adiciona a mensagem diretamente
      setActiveConv((prev) => {
        if (prev?.id === newMsg.conversation_id) {
          setMessages((msgs) => [...msgs, newMsg]);
          // Scroll automático
          setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50);
        }
        return prev;
      });
    });

    evtSource.onerror = () => {
      console.warn("[SSE] Conexão perdida, tentando reconectar...");
    };

    return () => evtSource.close();
  }, [orgId]);

  // Carrega mensagens ao abrir uma conversa
  const openConversation = async (conv: Conversation) => {
    setActiveConv(conv);
    setLoadingMsgs(true);
    setMessages([]);
    try {
      const r = await fetch(`${API}/chat/conversations/${conv.id}/messages`);
      if (r.ok) {
        const data = await r.json();
        setMessages(data);
        // Zera badge de não lidos localmente
        setConversations((prev) =>
          prev.map((c) => c.id === conv.id ? { ...c, unread_count: 0 } : c)
        );
      }
    } catch (error) {
      toast.error("Erro ao carregar mensagens.");
    } finally {
      setLoadingMsgs(false);
    }
  };

  // Scroll automático quando mensagens carregam
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }), 50);
    }
  }, [messages.length, activeConv?.id]);

  // Envia mensagem
  const sendMessage = async () => {
    if (!draft.trim() || !activeConv || !instanceId) return;
    const text = draft.trim();
    setDraft("");
    setSending(true);

    // Otimistic update
    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: activeConv.id,
      org_id: orgId!,
      content: text,
      is_from_me: true,
      type: "text",
      status: 1,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50);

    try {
      const r = await fetch(`${API}/chat/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConv.id,
          instanceId,
          jid: activeConv.jid,
          content: text,
          orgId,
        }),
      });

      if (r.ok) {
        const { message: saved } = await r.json();
        // Substitui o temporário pela mensagem real
        setMessages((prev) => prev.map((m) => m.id === tempMsg.id ? saved : m));
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConv.id
              ? { ...c, last_message_preview: text, last_message_at: new Date().toISOString() }
              : c
          ).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
        );
      } else {
        toast.error("Erro ao enviar mensagem.");
        // Remove otimistic
        setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
      }
    } catch {
      toast.error("Erro de conexão.");
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
    } finally {
      setSending(false);
    }
  };

  const filtered = conversations.filter((c) => {
    if (!search) return true;
    const name = c.contact_name || c.contact_phone || "";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="flex-1 flex min-h-0 bg-card">
      {/* Lista de conversas */}
      <div className={cn("w-full md:w-80 lg:w-96 flex-col border-r border-border", activeConv ? "hidden md:flex" : "flex")}>
        <div className="px-4 py-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-lg">Conversas</h2>
            <button
              onClick={loadConversations}
              className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground"
              title="Atualizar"
            >
              <RefreshCw className="size-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar contato..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-muted border-0 focus:ring-2 focus:ring-primary/30 outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {loadingConvs ? (
            <div className="flex items-center justify-center h-32 gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <span className="text-sm">Carregando conversas...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-center px-6">
              <MessageSquare className="size-10 text-primary/30" />
              <div>
                <p className="font-semibold text-sm">Nenhuma conversa ainda</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {instanceId
                    ? "Aguardando a primeira mensagem pelo WhatsApp."
                    : "Configure uma instância WhatsApp nas Configurações."}
                </p>
              </div>
            </div>
          ) : (
            filtered.map((conv) => {
              const initials = getInitials(conv.contact_name, conv.contact_phone);
              const color = avatarColor(conv.jid);
              return (
                <button
                  key={conv.id}
                  onClick={() => openConversation(conv)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-left border-b border-border/60 transition-colors",
                    activeConv?.id === conv.id ? "bg-accent" : "hover:bg-accent/50"
                  )}
                >
                  <div className={cn("size-12 rounded-full flex-shrink-0 grid place-items-center text-white font-bold text-sm", color)}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium truncate">
                        {conv.contact_name || conv.contact_phone || conv.jid.split("@")[0]}
                      </div>
                      <div className="text-[10px] text-muted-foreground shrink-0">
                        {timeAgo(conv.last_message_at)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <div className="text-xs text-muted-foreground truncate">
                        {conv.last_message_preview ?? "..."}
                      </div>
                      {conv.unread_count > 0 && (
                        <span className="shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold grid place-items-center">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Área de conversa */}
      <div className={cn("flex-1 min-w-0 flex flex-col", !activeConv && "hidden md:flex")}>
        {activeConv ? (
          <>
            {/* Header */}
            <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
              <button
                onClick={() => setActiveConv(null)}
                className="md:hidden p-2 -ml-2 rounded-lg hover:bg-accent"
              >
                <ArrowLeft className="size-5" />
              </button>
              <div className={cn("size-10 rounded-full flex-shrink-0 grid place-items-center text-white font-bold text-sm", avatarColor(activeConv.jid))}>
                {getInitials(activeConv.contact_name, activeConv.contact_phone)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">
                  {activeConv.contact_name || activeConv.contact_phone || activeConv.jid.split("@")[0]}
                </div>
                <div className="text-xs text-muted-foreground">
                  {activeConv.contact_phone ? `+${activeConv.contact_phone}` : activeConv.jid.split("@")[0]}
                </div>
              </div>
              <button className="p-2 rounded-lg hover:bg-accent text-muted-foreground">
                <Phone className="size-4" />
              </button>
              <button className="p-2 rounded-lg hover:bg-accent text-muted-foreground">
                <MoreVertical className="size-4" />
              </button>
            </header>

            {/* Mensagens */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-3 bg-gradient-soft">
              {loadingMsgs ? (
                <div className="flex items-center justify-center h-full gap-2 text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  <span className="text-sm">Carregando mensagens...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Nenhuma mensagem ainda.
                </div>
              ) : (
                messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))
              )}
            </div>

            {/* Compositor */}
            <div className="border-t border-border bg-card px-3 py-3">
              {!instanceId && (
                <div className="mb-2 px-3 py-2 rounded-xl bg-warning/10 text-warning-foreground text-xs flex items-center gap-2">
                  <Sparkles className="size-3.5" />
                  Configure uma instância WhatsApp nas Configurações para enviar mensagens.
                </div>
              )}
              <div className="flex items-end gap-2">
                <button className="p-2.5 rounded-xl hover:bg-accent text-muted-foreground">
                  <Paperclip className="size-5" />
                </button>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder={instanceId ? "Digite uma mensagem..." : "Instância não configurada"}
                  disabled={!instanceId || sending}
                  rows={1}
                  className="flex-1 max-h-32 resize-none px-4 py-2.5 text-sm rounded-xl bg-muted border-0 focus:ring-2 focus:ring-primary/30 outline-none disabled:opacity-60"
                />
                {draft.trim() ? (
                  <button
                    onClick={sendMessage}
                    disabled={sending || !instanceId}
                    className="p-2.5 rounded-xl bg-gradient-primary text-primary-foreground shadow-soft hover:opacity-95 active:scale-95 transition disabled:opacity-60"
                  >
                    {sending ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
                  </button>
                ) : (
                  <button className="p-2.5 rounded-xl hover:bg-accent text-muted-foreground">
                    <Mic className="size-5" />
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 hidden md:grid place-items-center text-muted-foreground">
            <div className="text-center space-y-3">
              <MessageSquare className="size-12 mx-auto text-primary/20" />
              <div>
                <p className="font-semibold">Selecione uma conversa</p>
                <p className="text-sm text-muted-foreground mt-1">
                  As mensagens do WhatsApp aparecerão aqui em tempo real.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const me = message.is_from_me;
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
        {message.type === 'image' && (
          <div className="mb-2 rounded-lg overflow-hidden bg-muted">
            <img 
              src={message.content?.startsWith('http') ? message.content : `data:image/jpeg;base64,${message.content}`} 
              alt="Mídia" 
              className="max-w-full h-auto object-contain"
            />
          </div>
        )}
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.type === 'text' ? message.content : (message.content?.startsWith('http') ? '' : message.content)}
          {message.type !== 'text' && !message.content && `[${message.type}]`}
        </p>
        <div
          className={cn(
            "flex items-center gap-1 justify-end mt-1 text-[10px]",
            me ? "text-primary-foreground/70" : "text-muted-foreground"
          )}
        >
          {new Date(message.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          {me && message.status === 4 && <CheckCheck className="size-3" />}
          {me && message.status === 3 && <CheckCheck className="size-3 opacity-60" />}
          {me && message.status <= 2 && <Check className="size-3" />}
        </div>
      </div>
    </div>
  );
}
