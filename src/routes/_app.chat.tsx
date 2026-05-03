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
  CheckCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/chat")({
  head: () => ({ meta: [{ title: "Chat Central — InoovaWeb CRM" }] }),
  component: ChatPage,
});

const API_URL = import.meta.env.VITE_API_URL || "https://api-crminoovaweb.inoovaweb.com.br/api";

const AVAILABLE_LABELS = [
  { name: "Novo", color: "bg-blue-500" },
  { name: "Quente", color: "bg-orange-500" },
  { name: "Frio", color: "bg-slate-500" },
  { name: "Agendado", color: "bg-violet-500" },
  { name: "Fechado", color: "bg-emerald-500" },
  { name: "Perdido", color: "bg-rose-500" },
];

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
          isMe ? "!bg-[#dcf8c6]" : "!bg-white"
        )}
        style={{ 
          backgroundColor: isMe ? "#dcf8c6" : "#ffffff",
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
          <p className="text-[14px] leading-snug whitespace-pre-wrap break-words pr-14 text-[#111b21]">
            {message.content}
          </p>
        )}

        <div className="flex items-center justify-end gap-1 mt-0.5 ml-auto">
          <span className="text-[10px] text-[#667781]">
            {formatTime(message.created_at)}
          </span>
          {isMe && (
            <CheckCheck className={cn("size-3.5", message.status >= 4 ? "text-[#53bdeb]" : "text-[#8696a0]")} />
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (orgId) {
      loadConversations();
      loadSellers();
      fetchInstance();
    }
  }, [orgId]);

  useEffect(() => {
    let interval: any;
    if (activeConv) {
      loadMessages(activeConv.id);
      interval = setInterval(() => loadMessages(activeConv.id), 5000);
    }
    return () => clearInterval(interval);
  }, [activeConv?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchInstance = async () => {
    const { data } = await supabase.from("organizations").select("papi_instance_id").eq("id", orgId).single();
    if (data?.papi_instance_id) setInstanceId(data.papi_instance_id);
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

    setSending(true);
    try {
      const payload = {
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

      if (res.ok) {
        setInputText("");
        loadMessages(activeConv.id);
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao enviar.");
      }
    } catch (err) {
      toast.error("Erro de conexão.");
    } finally {
      setSending(false);
    }
  };

  const deleteConversation = async (id: string) => {
    if (!confirm("Tem certeza que deseja apagar esta conversa?")) return;
    try {
      await supabase.from("messages").delete().eq("conversation_id", id);
      await supabase.from("conversations").delete().eq("id", id);
      setConversations(prev => prev.filter(c => c.id !== id));
      setActiveConv(null);
      toast.success("Conversa excluída.");
    } catch {
      toast.error("Erro ao excluir.");
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

  const toggleLabel = async (conv: any, labelName: string) => {
    const newLabels = conv.labels?.includes(labelName)
      ? conv.labels.filter((l: string) => l !== labelName)
      : [...(conv.labels || []), labelName];

    try {
      const { error } = await supabase.from("conversations").update({ labels: newLabels }).eq("id", conv.id);
      if (!error) {
        setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, labels: newLabels } : c));
        if (activeConv?.id === conv.id) setActiveConv({ ...activeConv, labels: newLabels });
      }
    } catch {
      toast.error("Erro ao atualizar etiquetas.");
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
            <h2 className="font-bold text-xl text-[#111b21]">Conversas</h2>
            <button onClick={loadConversations} className="p-2 rounded-full hover:bg-black/5 text-[#54656f]">
              <RefreshCw className="size-5" />
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
                  <div className="font-medium text-[#111b21] truncate">{conv.contact_name || conv.contact_phone || "Contato"}</div>
                  <div className="text-[10px] text-[#667781]">{timeAgo(conv.last_message_at)}</div>
                </div>
                <div className="text-xs text-[#667781] truncate mt-0.5">{conv.last_message_preview || "..."}</div>
                {conv.labels?.length > 0 && (
                  <div className="flex gap-1 mt-1.5">
                    {conv.labels.slice(0, 3).map((l: string) => (
                      <div key={l} className={cn("size-2 rounded-full", AVAILABLE_LABELS.find(al => al.name === l)?.color || "bg-slate-400")} />
                    ))}
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
                  {activeConv.assigned_to && (
                    <span className="text-[10px] bg-[#f0f2f5] px-2 py-0.5 rounded-full font-medium text-[#667781]">
                      {sellers.find(s => s.id === activeConv.assigned_to)?.full_name || "Atendente"}
                    </span>
                  )}
                </div>
                <div className="text-xs text-[#667781] truncate">Online</div>
              </div>
              <div className="flex items-center gap-2 text-[#54656f]">
                <div className="relative group">
                  <button className="p-2 rounded-full hover:bg-black/5" title="Atribuir Atendente"><UserPlus className="size-5" /></button>
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-border rounded-xl shadow-xl z-50 hidden group-hover:block py-2 animate-in fade-in zoom-in duration-200">
                    <div className="px-4 py-2 text-[10px] font-bold text-[#667781] uppercase tracking-wider">Enviar Lead Para:</div>
                    <button onClick={() => assignAtendente(activeConv.id, null, 'rotation')} className="w-full px-4 py-2.5 text-left text-sm hover:bg-[#f5f6f6] flex items-center gap-3 text-primary font-bold">
                      <Sparkles className="size-4" /> Rodízio Automático
                    </button>
                    <div className="h-[1px] bg-border my-1 mx-2" />
                    {sellers.map(s => (
                      <button key={s.id} onClick={() => assignAtendente(activeConv.id, s.id, 'manual')} className="w-full px-4 py-2.5 text-left text-sm hover:bg-[#f5f6f6] truncate">
                        {s.full_name} <span className="text-[9px] opacity-40 ml-1 uppercase">{s.role}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative group">
                  <button className="p-2 rounded-full hover:bg-black/5" title="Etiquetas"><Tag className="size-5" /></button>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-border rounded-xl shadow-xl z-50 hidden group-hover:block py-2 animate-in fade-in zoom-in duration-200">
                    {AVAILABLE_LABELS.map(l => (
                      <button key={l.name} onClick={() => toggleLabel(activeConv, l.name)} className="w-full px-4 py-2.5 text-left text-sm hover:bg-[#f5f6f6] flex items-center justify-between">
                        <span className="flex items-center gap-2"><div className={cn("size-2.5 rounded-full", l.color)} /> {l.name}</span>
                        {activeConv.labels?.includes(l.name) && <Check className="size-4 text-emerald-500" />}
                      </button>
                    ))}
                  </div>
                </div>
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
    </div>
  );
}
