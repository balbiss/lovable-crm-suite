import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { 
  Search, 
  Send, 
  Paperclip, 
  Loader2, 
  MessageSquare, 
  RefreshCw,
  ArrowLeft,
  UserPlus,
  Tag,
  Trash2,
  Sparkles,
  FileText,
  Check,
  CheckCheck,
  StickyNote,
  Plus,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/chat")({
  head: () => ({ meta: [{ title: "Chat Central — InoovaWeb CRM" }] }),
  component: ChatPage,
});

const API_URL = import.meta.env.VITE_API_URL || "https://api-crminoovaweb.inoovaweb.com.br/api";

const SummaryModal = ({ isOpen, onClose, summary }: { isOpen: boolean; onClose: () => void; summary: string }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <Sparkles className="size-5 text-primary" />
            Resumo Inteligente
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-lg transition-colors">
            <RefreshCw className="size-4 text-slate-500" />
          </button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="prose prose-slate prose-sm max-w-none">
            {summary.split('\n').map((line, i) => (
              <p key={i} className="mb-2 text-slate-600 leading-relaxed">{line}</p>
            ))}
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-border flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

function formatTime(at: string | number) {
  if (!at) return "";
  const date = new Date(at);
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function timeAgo(at: string | number) {
  if (!at) return "";
  const date = new Date(at);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const dayInMs = 86400000;

  if (diff < dayInMs && date.getDate() === now.getDate()) return formatTime(at);
  if (diff < dayInMs * 2) return "Ontem";
  if (diff < dayInMs * 7) {
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    return days[date.getDay()];
  }
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function getInitials(name?: string, phone?: string) {
  if (name) return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  if (phone) return phone.substring(0, 2);
  return "WA";
}

function avatarColor(jid?: string) {
  if (!jid) return "bg-slate-400";
  const colors = ["bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-rose-500", "bg-orange-500", "bg-indigo-500"];
  const index = jid.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[index % colors.length];
}

const MessageBubble = ({ message, isMe }: { message: any; isMe: boolean }) => {
  return (
    <div className={cn("flex w-full mb-1", isMe ? "justify-end" : "justify-start")}>
      <div 
        className={cn(
          "relative max-w-[85%] px-3 py-2 rounded-lg shadow-sm mb-1",
          isMe ? "!bg-[#dcf8c6]" : "!bg-white",
          message.optimistic && "opacity-60"
        )}
        style={{ 
          borderRadius: isMe ? "8px 0px 8px 8px" : "0px 8px 8px 8px"
        }}
      >
        {message.media_url && (
          <div className="mb-1 rounded overflow-hidden max-w-full">
            {message.type === 'image' && (
              <img src={message.media_url} alt="Mídia" className="max-w-full h-auto object-contain cursor-pointer rounded" onClick={() => window.open(message.media_url!, '_blank')} />
            )}
            {message.type === 'video' && (
              <video src={message.media_url} controls className="max-w-full h-auto rounded" />
            )}
            {message.type === 'audio' && (
              <audio src={message.media_url} controls className="w-full max-w-[240px] h-10" />
            )}
            {message.type === 'document' && (
              <a href={message.media_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-black/5 rounded hover:bg-black/10 transition-colors min-w-[200px]">
                <FileText className="size-8 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate text-slate-800">{message.content || "Documento"}</div>
                  <div className="text-[10px] opacity-60 uppercase text-slate-500">Documento</div>
                </div>
              </a>
            )}
          </div>
        )}
        
        {message.content && message.type !== 'document' && message.type !== 'audio' && (
          <p className="text-message leading-snug whitespace-pre-wrap break-words pr-14 text-[#111b21]">
            {message.content}
          </p>
        )}

        <div className="flex items-center justify-end gap-1 mt-0.5 ml-auto">
          <span className="text-detail">
            {formatTime(message.created_at)}
          </span>
          {isMe && (
            message.optimistic ? (
              <Loader2 className="size-3 animate-spin text-[#8696a0]" />
            ) : (
              <CheckCheck className={cn("size-3.5", message.status >= 4 ? "text-[#53bdeb]" : "text-[#8696a0]")} />
            )
          )}
        </div>
      </div>
    </div>
  );
};

function ChatPage() {
  const { user, orgId } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [instanceId, setInstanceId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [sellers, setSellers] = useState<any[]>([]);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [summaryModal, setSummaryModal] = useState({ open: false, content: "" });
  const [kanbanStages, setKanbanStages] = useState<any[]>([]);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [convToDelete, setConvToDelete] = useState<string | null>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!orgId) return;

    loadConversations();
    loadSellers();
    fetchInstance();

    // Conexão SSE para Tempo Real
    console.log("[SSE] Conectando...");
    const eventSource = new EventSource(`${API_URL}/chat/sse/${orgId}`);

    eventSource.addEventListener("new_message", (e: any) => {
      const data = JSON.parse(e.data);
      console.log("[SSE] Nova mensagem recebida:", data);
      
      // Feedback sonoro para novas mensagens recebidas
      if (!data.message.is_from_me) {
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3");
        audio.play().catch(() => {});
      }

      // Se a mensagem for da conversa ativa, atualiza as mensagens
      if (activeConvRef.current?.id === data.message.conversation_id) {
        setMessages(prev => {
          // Se já existir uma versão otimista desta mensagem (mesmo conteúdo e timestamp próximo), substitui ela
          const otherMsgs = prev.filter(m => !m.optimistic || m.content !== data.message.content);
          return [...otherMsgs, data.message];
        });
      }

      // Atualiza a lista de conversas (posiciona no topo e atualiza preview)
      setConversations(prev => {
        const otherConvs = prev.filter(c => c.id !== data.conversation.id);
        return [data.conversation, ...otherConvs];
      });
    });

    eventSource.addEventListener("message_status_update", (e: any) => {
      const data = JSON.parse(e.data);
      setMessages(prev => prev.map(m => m.id === data.messageId ? { ...m, status: data.status } : m));
    });

    eventSource.addEventListener("lead_assigned", (e: any) => {
      const data = JSON.parse(e.data);
      console.log("[SSE] Lead atribuído:", data);
      
      // Se o lead for para o usuário logado, toca som de "sucesso" e mostra toast
      if (data.sellerId === user?.id) {
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3"); // Som de caixa registradora/moeda
        audio.play().catch(() => {});
        
        toast.success(`🎉 NOVO LEAD: ${data.contactName || "Cliente novo"}`, {
          description: "Você acabou de receber este lead via rodízio!",
          duration: 10000,
        });

        // Tenta enviar notificação do navegador se tiver permissão
        if (Notification.permission === "granted") {
          new Notification("🎉 Novo Lead Atribuído!", {
            body: `Você recebeu o lead ${data.contactName || "Cliente novo"}.`,
            icon: "/pwa-192x192.png"
          });
        }
        
        loadConversations();
      }
    });

    // Solicita permissão para notificações se ainda não tiver
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Registra Service Worker para Push
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(reg => {
        console.log('[PWA] Service Worker registrado!', reg.scope);
      }).catch(err => {
        console.error('[PWA] Erro ao registrar SW:', err);
      });
    }

    eventSource.onerror = (err) => {
      console.error("[SSE] Erro na conexão. Reconectando em 5s...", err);
      eventSource.close();
    };

    return () => {
      console.log("[SSE] Desconectando...");
      eventSource.close();
    };
  }, [orgId]);

  // Ref para activeConv para ser usado dentro do listener do SSE sem dependências circulares
  const activeConvRef = useRef(activeConv);
  useEffect(() => {
    activeConvRef.current = activeConv;
    if (activeConv) {
      loadMessages(activeConv.id);
      loadNotes(activeConv.id);
    }
  }, [activeConv?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchInstance = async () => {
    const { data } = await supabase.from("organizations").select("papi_instance_id, kanban_config").eq("id", orgId).single();
    if (data?.papi_instance_id) setInstanceId(data.papi_instance_id);
    if (data?.kanban_config) setKanbanStages(data.kanban_config);
  };

  const loadSellers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("org_id", orgId);
    if (data) setSellers(data);
  };

  const loadConversations = async () => {
    if (!orgId) return;
    setLoadingConvs(true);
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("org_id", orgId)
      .order("last_message_at", { ascending: false });

    if (!error && data) setConversations(data);
    setLoadingConvs(false);
  };

  const loadMessages = async (convId: string) => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });

    if (!error && data) setMessages(data);
  };
  
  const loadNotes = async (convId: string) => {
    const { data } = await supabase
      .from("conversation_notes")
      .select("*, profiles(full_name)")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: false });
    if (data) setNotes(data);
  };

  const addNote = async () => {
    if (!newNote.trim() || !activeConv) return;
    const { error } = await supabase.from("conversation_notes").insert({
      conversation_id: activeConv.id,
      profile_id: user?.id,
      content: newNote
    });
    if (!error) {
      setNewNote("");
      loadNotes(activeConv.id);
      toast.success("Nota adicionada");
    }
  };

  const openConversation = (conv: any) => {
    setActiveConv(conv);
    if (conv.unread_count > 0) {
      supabase.from("conversations").update({ unread_count: 0 }).eq("id", conv.id).then();
      setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unread_count: 0 } : c));
    }
  };

  const sendMessage = async (text: string, type: string = 'text', mediaUrl?: string, filename?: string) => {
    if (!instanceId || !activeConv || sending) return;
    if (!text.trim() && !mediaUrl) return;

    // Optimistic Update: Adiciona mensagem na UI imediatamente
    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      content: text,
      type,
      media_url: mediaUrl,
      is_from_me: true,
      created_at: new Date().toISOString(),
      status: 1,
      optimistic: true
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setInputText("");

    try {
      const payload = {
        conversationId: activeConv.id,
        instanceId,
        jid: activeConv.jid,
        type,
        content: text,
        mediaUrl,
        filename,
        orgId
      };

      const res = await fetch(`${API_URL}/chat/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao enviar.");
        // Reverte optimistic update em caso de erro
        setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
      } else {
        // A mensagem real virá via SSE e substituirá a otimista
        if (activeConv) setActiveConv({ ...activeConv, ai_enabled: false });
      }
    } catch (err) {
      toast.error("Erro de conexão.");
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
    }
  };

  const handleSuggest = async () => {
    if (!activeConv || sending) return;
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/ai/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: activeConv.id, orgId }),
      });
      const data = await res.json();
      if (data.suggestion) {
        setInputText(data.suggestion);
      }
    } catch {
      toast.error("Erro ao obter sugestão.");
    } finally {
      setSending(false);
    }
  };

  const handleSummarize = async () => {
    if (!activeConv) return;
    const toastId = toast.loading("IA resumindo conversa...");
    try {
      const res = await fetch(`${API_URL}/ai/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: activeConv.id }),
      });
      const data = await res.json();
      if (data.summary) {
        toast.dismiss(toastId);
        setSummaryModal({ open: true, content: data.summary });
      }
    } catch {
      toast.error("Erro ao resumir.");
    }
  };

  const toggleAI = async () => {
    if (!activeConv) return;
    const newState = !activeConv.ai_enabled;
    const { error } = await supabase.from("conversations").update({ ai_enabled: newState }).eq("id", activeConv.id);
    if (!error) {
      setActiveConv({ ...activeConv, ai_enabled: newState });
      toast.success(newState ? "IA Reativada" : "IA Pausada");
    }
  };

  const deleteConversation = async (id: string) => {
    setConvToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!convToDelete) return;
    const id = convToDelete;
    try {
      await supabase.from("messages").delete().eq("conversation_id", id);
      await supabase.from("conversations").delete().eq("id", id);
      setConversations(prev => prev.filter(c => c.id !== id));
      setActiveConv(null);
      toast.success("Conversa excluída.");
    } catch {
      toast.error("Erro ao excluir.");
    } finally {
      setIsDeleteDialogOpen(false);
      setConvToDelete(null);
    }
  };

  const assignAtendente = async (convId: string, sellerId: string | null, mode: 'manual' | 'rotation') => {
    try {
      const res = await fetch(`${API_URL}/chat/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: convId, sellerId, mode, orgId }),
      });
      if (res.ok) {
        toast.success(mode === 'rotation' ? "Lead enviado para o rodízio." : "Atendente atribuído.");
        loadConversations();
        if (activeConv?.id === convId) {
          const { data } = await supabase.from("conversations").select("*").eq("id", convId).single();
          if (data) setActiveConv(data);
        }
      }
    } catch {
      toast.error("Erro na atribuição.");
    }
  };

  const toggleLabel = async (conv: any, stageId: string) => {
    try {
      const stage = kanbanStages.find(s => s.id === stageId);
      const isClosing = stage?.title.toLowerCase().includes("fechado") || stage?.title.toLowerCase().includes("perdido") || stageId === "fechado";
      
      const updateData: any = { kanban_stage: stageId };
      if (isClosing) {
        updateData.ai_enabled = true;
        updateData.status = "finalizado";
      }

      const { error } = await supabase
        .from("conversations")
        .update(updateData)
        .eq("id", conv.id);
      
      if (!error) {
        setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, ...updateData } : c));
        if (activeConv?.id === conv.id) setActiveConv({ ...activeConv, ...updateData });
        toast.success(isClosing ? "Lead finalizado e IA reativada" : "Fase atualizada");
      }
    } catch {
      toast.error("Erro ao atualizar fase.");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      const fileType = file.type.split('/')[0];
      const finalType = ['image', 'video', 'audio'].includes(fileType) ? fileType : 'document';
      await sendMessage("", finalType, base64, file.name);
      e.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  const filtered = conversations.filter((c) => {
    const name = c.contact_name || c.contact_phone || "";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="flex-1 flex min-h-0 bg-[#f0f2f5]">
      {/* Lista de conversas */}
      <div className={cn("w-full md:w-80 lg:w-96 flex-col border-r border-border bg-white", activeConv ? "hidden md:flex" : "flex")}>
        <div className="px-4 py-4 border-b border-border bg-[#f0f2f5]/50">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg text-[#111b21]">Conversas</h2>
            <button onClick={loadConversations} className="p-2 rounded-full hover:bg-black/5 text-[#54656f]">
              <RefreshCw className="size-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#667781]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar..."
              className="w-full pl-10 pr-3 py-2 text-sm rounded-lg bg-[#f0f2f5] border-0 focus:ring-0 outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {loadingConvs ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : filtered.map((conv) => (
            <button
              key={conv.id}
              onClick={() => openConversation(conv)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-left border-b border-[#f0f2f5] transition-colors hover:bg-[#f5f6f6]",
                activeConv?.id === conv.id && "bg-[#ebebeb]"
              )}
            >
              <div className={cn("size-12 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center text-white font-bold", !conv.contact_avatar && avatarColor(conv.jid))}>
                {conv.contact_avatar ? <img src={conv.contact_avatar} alt="" className="size-full object-cover rounded-full" /> : getInitials(conv.contact_name, conv.contact_phone)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-system text-[#111b21] truncate">{conv.contact_name || conv.contact_phone || "Contato"}</div>
                  <div className="text-detail">{timeAgo(conv.last_message_at)}</div>
                </div>
                <div className="text-detail truncate mt-0.5">{conv.last_message_preview || "..."}</div>
                {conv.kanban_stage && kanbanStages.length > 0 && (
                  <div className="flex gap-1 mt-1.5">
                    <div className={cn("px-2 py-0.5 rounded text-[9px] font-bold text-white uppercase tracking-wider", kanbanStages.find(s => s.id === conv.kanban_stage)?.color || "bg-slate-400")}>
                      {kanbanStages.find(s => s.id === conv.kanban_stage)?.title}
                    </div>
                  </div>
                )}
              </div>
              {conv.unread_count > 0 && (
                <div className="size-5 rounded-full bg-[#25d366] text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                  {conv.unread_count}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Área de conversa */}
      <div className={cn("flex-1 min-w-0 flex flex-col relative", !activeConv && "hidden md:flex items-center justify-center bg-[#f0f2f5]")}>
        {!activeConv ? (
          <div className="text-center max-w-sm px-6">
            <div className="size-24 rounded-full bg-black/5 grid place-items-center mx-auto mb-6">
              <MessageSquare className="size-10 text-[#667781]" />
            </div>
            <h2 className="text-2xl font-light text-[#41525d] mb-2">CRM WhatsApp</h2>
            <p className="text-sm text-[#667781]">Selecione uma conversa para começar a atender.</p>
          </div>
        ) : (
          <>
            <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-white z-10">
              <button onClick={() => setActiveConv(null)} className="md:hidden p-2 -ml-2 rounded-full hover:bg-black/5 text-[#54656f]">
                <ArrowLeft className="size-5" />
              </button>
              <div className={cn("size-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold", !activeConv.contact_avatar && avatarColor(activeConv.jid))}>
                {activeConv.contact_avatar ? <img src={activeConv.contact_avatar} alt="" className="size-full object-cover rounded-full" /> : getInitials(activeConv.contact_name, activeConv.contact_phone)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[#111b21] truncate flex items-center gap-2">
                  {activeConv.contact_name || activeConv.contact_phone}
                  <button 
                    onClick={toggleAI}
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 transition-colors",
                      activeConv.ai_enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                    )}
                  >
                    <Sparkles className="size-3" />
                    {activeConv.ai_enabled ? "IA ATIVA" : "IA PAUSADA"}
                  </button>
                </div>
                <div className="text-xs text-[#667781] truncate">Online</div>
              </div>
              <div className="flex items-center gap-2 text-[#54656f]">
                <button onClick={handleSummarize} className="p-2 rounded-full hover:bg-black/5" title="Resumo da IA">
                  <FileText className="size-5" />
                </button>
                <div className="relative">
                  <button 
                    onClick={() => setActiveMenu(activeMenu === 'assign' ? null : 'assign')}
                    className={cn("p-2 rounded-full hover:bg-black/5 transition-colors", activeMenu === 'assign' && "bg-black/10")} 
                    title="Atribuir Atendente"
                  >
                    <UserPlus className="size-5" />
                  </button>
                  {activeMenu === 'assign' && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
                      <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-border rounded-xl shadow-xl z-50 py-2 animate-in fade-in zoom-in duration-200">
                        <div className="px-4 py-2 text-[10px] font-bold text-[#667781] uppercase tracking-wider">Enviar Lead Para:</div>
                        <button 
                          onClick={() => { assignAtendente(activeConv.id, null, 'rotation'); setActiveMenu(null); }} 
                          className="w-full px-4 py-2.5 text-left text-sm hover:bg-[#f5f6f6] flex items-center gap-3 text-primary font-bold"
                        >
                          <Sparkles className="size-4" /> Rodízio Automático
                        </button>
                        <div className="h-[1px] bg-border my-1 mx-2" />
                        {sellers.map(s => (
                          <button 
                            key={s.id} 
                            onClick={() => { assignAtendente(activeConv.id, s.id, 'manual'); setActiveMenu(null); }} 
                            className="w-full px-4 py-2.5 text-left text-sm hover:bg-[#f5f6f6] truncate"
                          >
                            {s.full_name} <span className="text-[9px] opacity-40 ml-1 uppercase">{s.role}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div className="relative">
                  <button 
                    onClick={() => setActiveMenu(activeMenu === 'labels' ? null : 'labels')}
                    className={cn("p-2 rounded-full hover:bg-black/5 transition-colors", activeMenu === 'labels' && "bg-black/10")} 
                    title="Etiquetas"
                  >
                    <Tag className="size-5" />
                  </button>
                  {activeMenu === 'labels' && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-border rounded-xl shadow-xl z-50 py-2 animate-in fade-in zoom-in duration-200">
                        {kanbanStages.map(l => (
                          <button 
                            key={l.id} 
                            onClick={() => toggleLabel(activeConv, l.id)} 
                            className="w-full px-4 py-2.5 text-left text-sm hover:bg-[#f5f6f6] flex items-center justify-between"
                          >
                            <span className="flex items-center gap-2"><div className={cn("size-2.5 rounded-full", l.color)} /> {l.title}</span>
                            {activeConv.kanban_stage === l.id && <Check className="size-4 text-emerald-500" />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <button 
                  onClick={() => setIsNoteOpen(!isNoteOpen)} 
                  className={cn("p-2 rounded-full transition-colors", isNoteOpen ? "bg-amber-100 text-amber-600" : "hover:bg-black/5")} 
                  title="Notas Internas"
                >
                  <StickyNote className="size-5" />
                </button>
                <button onClick={() => deleteConversation(activeConv.id)} className="p-2 rounded-full hover:bg-rose-50 text-[#54656f] hover:text-rose-500 transition-colors"><Trash2 className="size-5" /></button>
              </div>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-4 py-6 space-y-4 whatsapp-bg relative">
              <div className="relative z-10 space-y-2">
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} isMe={msg.is_from_me} />
                ))}
              </div>
            </div>

            <footer className="bg-[#f0f2f5] p-3 border-t border-border z-10">
              <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-1 shadow-sm">
                <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-full hover:bg-black/5 text-[#54656f]">
                  <Paperclip className="size-5" />
                </button>
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
                <input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(inputText)}
                  placeholder="Digite uma mensagem"
                  className="flex-1 py-2 text-sm bg-transparent border-0 focus:ring-0 outline-none text-[#111b21]"
                />
                <button 
                  onClick={handleSuggest}
                  disabled={sending}
                  className="p-2 rounded-full hover:bg-primary/5 text-primary transition-colors"
                  title="Sugerir resposta com IA"
                >
                  <Sparkles className="size-5" />
                </button>
                <button 
                  onClick={() => sendMessage(inputText)}
                  disabled={sending || (!inputText.trim())}
                  className={cn("p-2 rounded-full transition-colors", inputText.trim() ? "text-primary" : "text-[#667781]")}
                >
                  {sending ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
                </button>
              </div>
            </footer>
          </>
        )}
      </div>

      {/* Painel de Notas Laterais */}
      {isNoteOpen && activeConv && (
        <div className="w-80 bg-[#fefce8] border-l border-amber-200 flex flex-col animate-in slide-in-from-right duration-300">
          <div className="p-4 border-b border-amber-200 flex items-center justify-between bg-amber-100/50">
            <h3 className="font-bold text-amber-900 flex items-center gap-2">
              <StickyNote className="size-4" /> Notas Internas
            </h3>
            <button onClick={() => setIsNoteOpen(false)} className="p-1 hover:bg-amber-200 rounded-lg">
              <X className="size-4 text-amber-700" />
            </button>
          </div>
          
          <div className="p-4 space-y-4 flex-1 overflow-y-auto">
            <div className="bg-white/50 rounded-xl p-3 border border-amber-200">
              <textarea 
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Adicionar observação..."
                className="w-full bg-transparent border-0 focus:ring-0 text-sm resize-none h-20 placeholder:text-amber-800/40"
              />
              <button 
                onClick={addNote}
                disabled={!newNote.trim()}
                className="w-full mt-2 py-2 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="size-3" /> Salvar Nota
              </button>
            </div>

            <div className="space-y-3">
              {notes.map(note => (
                <div key={note.id} className="bg-amber-50 rounded-lg p-3 border border-amber-100 shadow-sm relative group">
                  <div className="text-xs text-amber-900 leading-relaxed mb-2">{note.content}</div>
                  <div className="flex items-center justify-between opacity-60">
                    <div className="text-[9px] font-bold uppercase text-amber-800">{note.profiles?.full_name || "Sistema"}</div>
                    <div className="text-[9px] text-amber-700">{new Date(note.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
              {notes.length === 0 && (
                <div className="text-center py-10 opacity-30">
                  <StickyNote className="size-10 mx-auto mb-2" />
                  <div className="text-xs">Nenhuma nota ainda</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <SummaryModal 
        isOpen={summaryModal.open} 
        summary={summaryModal.content} 
        onClose={() => setSummaryModal({ ...summaryModal, open: false })} 
      />
    </div>
  );
}
