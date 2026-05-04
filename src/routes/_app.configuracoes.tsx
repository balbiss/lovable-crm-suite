import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import {
  Webhook,
  Sparkles,
  Clock,
  Users,
  Save,
  CheckCircle2,
  AlertCircle,
  Database,
  Upload,
  FileText,
  Trash2,
  Loader2,
  Smartphone,
  X,
  QrCode,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MOCK_USERS } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MoreHorizontal, LayoutDashboard, GripVertical, Palette } from "lucide-react";

export const Route = createFileRoute("/_app/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — InoovaWeb CRM" }] }),
  component: ConfigPage,
});

const API = import.meta.env.VITE_API_URL || "https://api-crminoovaweb.inoovaweb.com.br/api";

const TABS = [
  { id: "whatsapp", label: "WhatsApp", icon: Webhook },
  { id: "kanban", label: "Kanban", icon: LayoutDashboard },
  { id: "ia", label: "IA & Automação", icon: Sparkles },
  { id: "conhecimento", label: "Conhecimento", icon: Database },
  { id: "rodizio", label: "Equipe", icon: Users },
] as const;

type TabId = (typeof TABS)[number]["id"];

function ConfigPage() {
  const [tab, setTab] = useState<TabId>("whatsapp");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-6 py-4">
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Apenas administradores podem alterar essas configurações.
        </p>
      </header>

      <div className="p-6 w-full">

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-2 mb-6 -mx-1 px-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                  active
                    ? "bg-gradient-primary text-primary-foreground shadow-soft"
                    : "bg-card border border-border hover:bg-accent text-muted-foreground"
                )}
              >
                <Icon className="size-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl bg-card border border-border shadow-soft p-6">
          {tab === "whatsapp" && <PapiSettings />}
          {tab === "kanban" && <KanbanSettings />}
          {tab === "ia" && <AiPromptSettings />}
          {tab === "conhecimento" && <KnowledgeBaseSettings />}
          {tab === "rodizio" && <RotationSettings />}

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <div className="text-sm text-muted-foreground">
              Última alteração: há 2 dias por Marina Costa
            </div>
            <button
              onClick={handleSave}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all",
                saved
                  ? "bg-success text-success-foreground"
                  : "bg-gradient-primary text-primary-foreground shadow-soft"
              )}
            >
              {saved ? (
                <>
                  <CheckCircle2 className="size-4" /> Salvo!
                </>
              ) : (
                <>
                  <Save className="size-4" /> Salvar alterações
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

const inputClass =
  "w-full px-3.5 py-2.5 text-sm rounded-xl bg-muted border-0 focus:ring-2 focus:ring-primary/30 outline-none placeholder:text-muted-foreground/60";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  ShieldCheck, 
  MessageSquareDashed, 
  Bell, 
  Eye, 
  History,
  Info,
  Globe,
  RefreshCw
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  useOrganizationSettings, 
  usePapiStatus, 
  usePapiSettings 
} from "@/hooks/use-organization-settings";
import { ConfigSkeleton, AiSkeleton } from "@/components/config-skeleton";
import { useQueryClient } from "@tanstack/react-query";

  const isConnected = status?.status === 'CONNECTED';
  const queryClient = useQueryClient();

  // Cria nova instância
  const handleCreateInstance = async () => {
    if (!newInstanceName.trim()) { toast.error("Digite um nome para a instância."); return; }
    setLoading(true);
    try {
      const response = await fetch(`${API}/papi/instances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceId: newInstanceName, orgId: user?.orgId })
      });
      if (response.ok) {
        setNewInstanceName("");
        setIsCreateModalOpen(false);
        toast.success("Instância criada com sucesso!");
        queryClient.invalidateQueries({ queryKey: ["org-settings"] });
      } else {
        toast.error("Erro ao criar instância.");
      }
    } catch (error) {
      toast.error("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  // Gera QR Code para conectar
  const handleConnect = async () => {
    if (!instanceId) return;
    setLoading(true);
    setQrCode(null);
    try {
      const response = await fetch(`${API}/papi/instances/${instanceId}/qr`);
      if (response.ok) {
        const data = await response.json();
        const qr = data.qrImage || data.qrcode || data.qr;
        if (qr) {
          setQrCode(qr);
        } else {
          toast.info("Aguardando geração do QR Code...");
        }
      } else {
        toast.error("Erro ao gerar QR Code.");
      }
    } catch (error) {
      toast.error("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  // Deleta instância da PAPI e desvincula
  const handleDelete = async () => {
    if (!instanceId) return;
    if (!confirm("Tem certeza que deseja apagar esta instância? Esta ação é irreversível.")) return;
    setLoading(true);
    try {
      const response = await fetch(
        `${API}/papi/instances/${instanceId}?orgId=${user?.orgId}`,
        { method: 'DELETE' }
      );
      if (response.ok) {
        setQrCode(null);
        toast.success("Instância apagada com sucesso!");
        queryClient.invalidateQueries({ queryKey: ["org-settings"] });
        queryClient.invalidateQueries({ queryKey: ["papi-status"] });
      } else {
        toast.error("Erro ao apagar instância.");
      }
    } catch (error) {
      toast.error("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  // Atualiza uma configuração individual
  const handleUpdateSetting = async (key: string, value: boolean) => {
    if (!instanceId) return;
    const updated = { ...(localSettings || {}), [key]: value };
    setLocalSettings(updated);
    try {
      await fetch(`${API}/papi/instances/${instanceId}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      toast.success("Configuração salva!");
      queryClient.invalidateQueries({ queryKey: ["papi-settings", instanceId] });
    } catch (error) {
      toast.error("Erro ao salvar configuração.");
    }
  };

  const isConnected = status?.status === 'CONNECTED';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <SectionHeader
          title="Conexão WhatsApp (PAPI)"
          description="Gerencie sua conexão oficial com o WhatsApp através da InoovaWeb PAPI."
        />
        {instanceId && (
          isConnected ? (
            <span className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full bg-success/10 text-success border border-success/20">
              <span className="size-2 rounded-full bg-success shadow-[0_0_6px] shadow-success animate-pulse" />
              CONECTADO
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full bg-warning/10 text-warning-foreground border border-warning/20">
              <span className="size-2 rounded-full bg-amber-400 animate-pulse" />
              AGUARDANDO CONEXÃO
            </span>
          )
        )}
      </div>

      {!instanceId ? (
        /* Estado: sem instância */
        <div className="flex flex-col items-center justify-center min-h-[280px] border-2 border-dashed border-border rounded-2xl gap-4 bg-muted/20">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Smartphone className="w-8 h-8 text-primary" />
          </div>
          <div className="text-center space-y-1">
            <h3 className="text-lg font-bold">Nenhuma Instância Ativa</h3>
            <p className="text-sm text-muted-foreground">Configure uma conexão WhatsApp para começar a automatizar.</p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} className="rounded-xl px-8 shadow-soft">
            <Plus className="w-4 h-4 mr-2" /> Criar Instância
          </Button>

          {/* Modal de criação */}
          {isCreateModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <div className="bg-card rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg">Nova Instância</h3>
                  <button onClick={() => setIsCreateModalOpen(false)} className="p-1.5 rounded-lg hover:bg-accent">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">Defina um identificador único para sua conexão.</p>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Identificador</label>
                  <input
                    type="text"
                    placeholder="Ex: atendimento_principal"
                    className={inputClass}
                    value={newInstanceName}
                    onChange={(e) => setNewInstanceName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateInstance()}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setIsCreateModalOpen(false)} className="flex-1 rounded-xl">
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateInstance} disabled={loading} className="flex-1 rounded-xl">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Estado: com instância */
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          {/* Card da instância */}
          <Card className="lg:col-span-2 border-0 shadow-soft bg-card">
            <div className="p-5 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Identificador</p>
                  <p className="text-sm font-bold font-mono text-primary">{instanceId}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/50">
                  <span className="text-xs text-muted-foreground font-medium">Status PAPI</span>
                  <span className={`text-xs font-bold uppercase ${isConnected ? 'text-success' : 'text-amber-500'}`}>
                    {status?.status || 'Processando...'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/50">
                  <span className="text-xs text-muted-foreground font-medium">Telefone</span>
                  <span className="text-xs font-bold font-mono">
                    {status?.phoneNumber ? `+${status.phoneNumber}` : 'Não vinculado'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
                {!isConnected && (
                  <Button onClick={handleConnect} disabled={loading} className="w-full rounded-xl h-11 shadow-soft">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <QrCode className="w-4 h-4 mr-2" />}
                    {qrCode ? 'Atualizar QR Code' : 'Conectar WhatsApp'}
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  disabled={loading}
                  className="w-full rounded-xl h-11 border-destructive/20 text-destructive hover:bg-destructive/5"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Desconectar e Apagar
                </Button>
              </div>
            </div>
          </Card>

          {/* Painel direito: QR / Conectado / Aguardando */}
          <div className="lg:col-span-3">
            {qrCode && !isConnected ? (
              <Card className="border-0 shadow-soft bg-card flex flex-col items-center p-8 text-center gap-6">
                <div>
                  <h4 className="text-xl font-black text-foreground">Escaneie o QR Code</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Abra o WhatsApp → <strong>Aparelhos Conectados</strong> → escaneie abaixo
                  </p>
                </div>
                <div className="p-4 bg-white rounded-2xl shadow-inner border border-border/40">
                  <img src={qrCode} alt="QR Code WhatsApp" className="w-56 h-56" />
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Aguardando autenticação...
                </div>
              </Card>
            ) : isConnected ? (
              <Card className="border-0 shadow-soft bg-gradient-to-br from-success/5 to-success/10 flex flex-col items-center justify-center p-10 text-center min-h-[280px] gap-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-success/20 rounded-full blur-xl animate-pulse" />
                  <div className="relative w-20 h-20 bg-success rounded-2xl flex items-center justify-center shadow-lg">
                    <Smartphone className="w-10 h-10 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-black text-foreground">Conexão Ativa!</h4>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Seu CRM está sincronizado com o WhatsApp e pronto para automações.
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap justify-center">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-success text-white">Operacional</span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border border-success/30 text-success">Webhook Ativo</span>
                </div>
              </Card>
            ) : (
              <div className="min-h-[280px] border-2 border-dashed border-border/50 rounded-2xl flex flex-col items-center justify-center gap-3 opacity-40">
                <QrCode className="w-12 h-12" />
                <div className="text-center">
                  <p className="font-bold">Aguardando Conexão</p>
                  <p className="text-sm text-muted-foreground">Clique em "Conectar WhatsApp" para gerar o QR Code.</p>
                </div>
              </div>
            )}
          </div>

          {/* Configurações avançadas — só aparecem quando conectado */}
          {isConnected && (
            <div className="lg:col-span-5 grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-soft bg-card overflow-hidden">
                <div className="p-4 border-b border-border/50 flex items-center gap-2 bg-muted/20">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <h4 className="font-bold text-sm">Privacidade & Segurança</h4>
                </div>
                <div className="p-5 space-y-5">
                  {[
                    { key: 'rejectCalls', label: 'Rejeitar Chamadas', desc: 'Recusa chamadas de voz e vídeo automaticamente.' },
                    { key: 'alwaysOnline', label: 'Sempre Online', desc: 'Mantém o status "Online" 24/7 no WhatsApp.' },
                    { key: 'readMessages', label: 'Ler Mensagens', desc: 'Marca mensagens como lidas assim que chegam ao CRM.' },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-bold">{label}</Label>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                      <Switch
                        checked={localSettings?.[key] || false}
                        onCheckedChange={(v) => handleUpdateSetting(key, v)}
                      />
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="border-0 shadow-soft bg-card overflow-hidden">
                <div className="p-4 border-b border-border/50 flex items-center gap-2 bg-muted/20">
                  <MessageSquareDashed className="w-4 h-4 text-primary" />
                  <h4 className="font-bold text-sm">Filtros & Sincronização</h4>
                </div>
                <div className="p-5 space-y-5">
                  {[
                    { key: 'ignoreGroups', label: 'Ignorar Grupos', desc: 'Não processa mensagens de grupos (@g.us).' },
                    { key: 'ignoreNewsletters', label: 'Ignorar Newsletters', desc: 'Oculta mensagens de canais (@newsletter).' },
                    { key: 'readStatus', label: 'Visualizar Status', desc: 'Visualiza Stories dos contatos automaticamente.' },
                    { key: 'syncFullHistory', label: 'Sincronizar Histórico', desc: 'Carrega conversas antigas ao conectar.' },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-bold">{label}</Label>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                      <Switch
                        checked={localSettings?.[key] || false}
                        onCheckedChange={(v) => handleUpdateSetting(key, v)}
                      />
                    </div>
                  ))}
                </div>
              </Card>

              {/* Card de Webhook */}
              <WebhookCard instanceId={instanceId} />
            </div>
          )}
        </div>
      )}

      <div className="pt-6 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
        <p className="flex items-center gap-2">
          <Loader2 className="w-3 h-3 animate-spin text-primary" />
          Sincronização em tempo real ativa
        </p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/5 text-primary font-medium border border-primary/10">
            <Info className="w-3.5 h-3.5" />
            Configurações salvas automaticamente
          </div>
          <Button className="rounded-xl px-8 py-3 h-auto font-bold shadow-soft flex items-center gap-2">
            <Save className="w-4 h-4" />
            Salvar Tudo
          </Button>
        </div>
      </div>
    </div>
  );
}

function AiPromptSettings() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: org, isLoading } = useOrganizationSettings();

  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("Amigável");

  useEffect(() => {
    if (org) {
      setPrompt(org.ai_prompt || "");
      setTone(org.ai_tone || "Amigável");
    }
  }, [org]);

  const handleSave = async () => {
    if (!user?.orgId) return;
    setSaving(true);
    const { error } = await supabase
      .from('organizations')
      .update({ ai_prompt: prompt, ai_tone: tone })
      .eq('id', user.orgId);
    
    if (error) {
      toast.error("Erro ao salvar configurações de IA.");
    } else {
      toast.success("Configurações de IA salvas com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["org-settings"] });
    }
    setSaving(false);
  };

  if (isLoading && !org) return <AiSkeleton />;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Prompt da IA"
        description="Defina como a IA deve se comportar nos atendimentos automáticos e nas sugestões."
      />
      
      <Field label="Tom de voz">
        <div className="flex flex-wrap gap-2">
          {["Profissional", "Amigável", "Consultivo", "Direto"].map((t) => (
            <button
              key={t}
              onClick={() => setTone(t)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm border transition-all",
                tone === t
                  ? "bg-primary/10 border-primary text-primary font-medium shadow-sm"
                  : "bg-card border-border hover:border-primary/30"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </Field>

      <Field
        label="Instruções principais"
        hint="O tom de voz selecionado e estas instruções são a lei absoluta para a assistente."
      >
        <textarea
          className={cn(inputClass, "min-h-48 font-mono text-xs leading-relaxed border border-border/50 bg-muted/30 focus:bg-background transition-colors")}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ex: Você é a assistente da InoovaWeb. Seja cordial e encaminhe para o vendedor caso o cliente peça preços específicos."
        />
      </Field>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="rounded-xl px-8 shadow-soft">
          {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
          Salvar Configurações de IA
        </Button>
      </div>
    </div>
  );
}

function KnowledgeBaseSettings() {
  const { orgId } = useAuth();
  const [files, setFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (orgId) loadFiles();
  }, [orgId]);

  const loadFiles = async () => {
    const { data } = await supabase
      .from("company_knowledge")
      .select("id, title, file_type, created_at")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });
    if (data) setFiles(data);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || !orgId) return;

    console.log("[Knowledge] Iniciando upload para Org:", orgId);
    setUploading(true);
    for (const file of Array.from(selectedFiles)) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("orgId", orgId);
      formData.append("title", file.name);

      try {
        console.log(`[Knowledge] Enviando arquivo: ${file.name} (${file.size} bytes)`);
        const res = await fetch(`${API}/ai/knowledge/upload`, {
          method: "POST",
          body: formData,
        });
        
        if (res.ok) {
          toast.success(`${file.name} indexado!`);
        } else {
          const errorData = await res.json();
          console.error("[Knowledge] Erro no servidor:", errorData);
          toast.error(`Erro ao indexar: ${errorData.error || res.statusText}`);
        }
      } catch (err: any) {
        console.error("[Knowledge] Erro de conexão/rede:", err);
        toast.error(`Erro de conexão: ${err.message}`);
      }
    }
    setUploading(false);
    loadFiles();
  };

  const removeFile = async (id: string) => {
    const { error } = await supabase.from("company_knowledge").delete().eq("id", id);
    if (!error) {
      toast.success("Documento removido.");
      loadFiles();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <SectionHeader
        title="Base de Conhecimento (RAG)"
        description="Indexe documentos para que a IA possa responder dúvidas técnicas, preços e prazos com precisão."
      />

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".pdf,.txt"
        multiple
        onChange={handleFileChange}
      />

      <div 
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center border-2 border-dashed border-primary/20 rounded-2xl p-12 bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer group",
          uploading && "opacity-50 cursor-wait"
        )}
      >
        <div className="size-14 rounded-2xl bg-primary text-primary-foreground grid place-items-center mb-4 shadow-glow group-hover:scale-110 transition-transform">
          {uploading ? <Loader2 className="size-6 animate-spin" /> : <Upload className="size-6" />}
        </div>
        <h3 className="text-lg font-semibold text-primary">
          {uploading ? "Indexando arquivos..." : "Escolher PDF/TXT para indexar"}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Arraste e solte ou clique para selecionar arquivos (máx. 10MB)
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Documentos Indexados
          </h4>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent text-primary">
            {files.length} arquivos
          </span>
        </div>

        {files.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground italic bg-muted/20 rounded-xl border border-border">
            Nenhum documento indexado ainda.
          </div>
        ) : (
          <div className="grid gap-2">
            {files.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:shadow-soft transition-all group"
              >
                <div className="size-10 rounded-lg bg-primary/10 text-primary grid place-items-center">
                  <FileText className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{f.title}</div>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                    <span className="uppercase">{f.file_type.split("/")[1]}</span>
                    <span className="size-1 rounded-full bg-border" />
                    <span>Indexado em {new Date(f.created_at).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(f.id)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


function KanbanSettings() {
  const { orgId } = useAuth();
  const [stages, setStages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orgId) load();
  }, [orgId]);

  const load = async () => {
    const { data } = await supabase.from("organizations").select("kanban_config").eq("id", orgId).single();
    if (data?.kanban_config) {
      setStages(data.kanban_config);
    } else {
      setStages([
        { id: "novo", title: "Novos Leads", color: "bg-blue-500" },
        { id: "qualificacao", title: "Em Qualificação", color: "bg-orange-500" },
        { id: "visita", title: "Visita Agendada", color: "bg-violet-500" },
        { id: "proposta", title: "Proposta Enviada", color: "bg-indigo-500" },
        { id: "fechado", title: "Fechamento", color: "bg-emerald-500" },
      ]);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    const { error } = await supabase.from("organizations").update({ kanban_config: stages }).eq("id", orgId);
    if (!error) toast.success("Fluxo do Kanban salvo!");
    else toast.error("Erro ao salvar.");
  };

  const addStage = () => {
    const id = "stage_" + Math.random().toString(36).substr(2, 4);
    setStages([...stages, { id, title: "Nova Etapa", color: "bg-slate-400" }]);
  };

  const removeStage = (id: string) => {
    setStages(stages.filter(s => s.id !== id));
  };

  const updateStage = (id: string, field: string, value: string) => {
    setStages(stages.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <SectionHeader 
          title="Personalização do Kanban" 
          description="Defina as etapas do seu funil de vendas. Os leads podem ser arrastados entre essas colunas." 
        />
        <Button onClick={addStage} variant="outline" className="rounded-xl">
          <Plus className="size-4 mr-2" /> Adicionar Coluna
        </Button>
      </div>

      <div className="space-y-3">
        {stages.map((stage, index) => (
          <div key={stage.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card shadow-sm group">
            <div className="text-muted-foreground"><GripVertical className="size-4" /></div>
            <div className={cn("size-3 rounded-full shrink-0", stage.color)} />
            <input 
              className={cn(inputClass, "flex-1 font-bold")} 
              value={stage.title} 
              onChange={(e) => updateStage(stage.id, "title", e.target.value)}
            />
            <select 
              className={cn(inputClass, "w-40")}
              value={stage.color}
              onChange={(e) => updateStage(stage.id, "color", e.target.value)}
            >
              <option value="bg-blue-500">Azul</option>
              <option value="bg-orange-500">Laranja</option>
              <option value="bg-violet-500">Roxo</option>
              <option value="bg-indigo-500">Indigo</option>
              <option value="bg-emerald-500">Verde</option>
              <option value="bg-rose-500">Rosa</option>
              <option value="bg-slate-500">Cinza</option>
            </select>
            <button onClick={() => removeStage(stage.id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all">
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} className="rounded-xl px-8 bg-gradient-primary shadow-soft">
          <Save className="size-4 mr-2" /> Salvar Funil
        </Button>
      </div>
    </div>
  );
}

function RotationSettings() {
  const [showAdd, setShowAdd] = useState(false);
  const [attendants, setAttendants] = useState(
    MOCK_USERS.map((u) => ({ ...u, active: true, rotation: u.role === "vendedor" }))
  );

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <SectionHeader
          title="Gestão da Equipe"
          description="Cadastre atendentes e defina quem participa do rodízio automático de leads."
        />
        <button 
          onClick={() => setShowAdd(true)}
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 font-medium transition-all"
        >
          <Plus className="size-4" /> Novo Atendente
        </button>
      </div>

      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="text-muted-foreground border-b border-border">
              <th className="pb-3 font-medium">Atendente</th>
              <th className="pb-3 font-medium">Perfil</th>
              <th className="pb-3 font-medium text-center">Status</th>
              <th className="pb-3 font-medium text-center">Rodízio</th>
              <th className="pb-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {attendants.map((u) => (
              <tr key={u.id} className="group">
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <img src={u.avatar} className="size-9 rounded-full object-cover" alt="" />
                    <div>
                      <div className="font-medium">{u.name}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="py-4">
                  <span className={cn(
                    "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase",
                    u.role === "admin" ? "bg-primary/10 text-primary" : "bg-accent text-accent-foreground"
                  )}>
                    {u.role}
                  </span>
                </td>
                <td className="py-4 text-center">
                  <div className="flex justify-center">
                    <Switch defaultChecked={u.active} />
                  </div>
                </td>
                <td className="py-4 text-center">
                  <div className="flex justify-center">
                    <Switch defaultChecked={u.rotation} />
                  </div>
                </td>
                <td className="py-4 text-right">
                  <button className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                    <MoreHorizontal className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border shadow-elevated rounded-3xl p-6 max-w-md w-full animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Novo Atendente</h2>
              <button onClick={() => setShowAdd(false)} className="p-2 rounded-full hover:bg-muted transition-colors">
                <X className="size-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <Field label="Nome Completo">
                <input className={inputClass} placeholder="Ex: João Silva" />
              </Field>
              <Field label="E-mail">
                <input type="email" className={inputClass} placeholder="joao@empresa.com" />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Senha">
                  <input type="password" className={inputClass} placeholder="••••••••" />
                </Field>
                <Field label="Perfil">
                  <select className={inputClass}>
                    <option value="vendedor">Vendedor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </Field>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button 
                  onClick={() => setShowAdd(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border font-medium hover:bg-accent transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => setShowAdd(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-soft"
                >
                  Cadastrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WebhookCard({ instanceId }: { instanceId: string }) {
  const [webhook, setWebhook] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchWebhook = async () => {
    try {
      const response = await fetch(`${API}/papi/instances/${instanceId}/webhook`);
      if (response.ok) {
        const data = await response.json();
        setWebhook(data.webhook || data);
      }
    } catch (error) {
      console.error("Erro ao buscar webhook:", error);
    }
  };

  const handleSyncWebhook = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/papi/instances/${instanceId}/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        setWebhook(data.webhook || data);
        toast.success("Webhook sincronizado com sucesso!");
      } else {
        const err = await response.json();
        toast.error(err.error || "Erro ao sincronizar webhook.");
      }
    } catch (error) {
      toast.error("Erro ao sincronizar webhook.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (instanceId) fetchWebhook();
  }, [instanceId]);

  return (
    <Card className="lg:col-span-5 border-0 shadow-soft bg-card overflow-hidden mt-6">
      <div className="p-4 border-b border-border/50 flex items-center justify-between bg-muted/20">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          <h4 className="font-bold text-sm">Integração Webhook (Chat ao Vivo)</h4>
        </div>
        {webhook && (
          <Badge variant={webhook.enabled ? "outline" : "secondary"} className={cn(
            "rounded-full px-2 py-0.5 text-[10px]",
            webhook.enabled ? "bg-success/10 text-success border-success/20" : ""
          )}>
            {webhook.enabled ? "Ativo" : "Inativo"}
          </Badge>
        )}
      </div>
      <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1 flex-1 min-w-0">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">URL de Recebimento</p>
          <div className="flex items-center gap-2">
            <code className="bg-muted px-3 py-1.5 rounded-lg text-[11px] font-mono text-primary truncate flex-1">
              {webhook?.url || "Não configurado"}
            </code>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Esta URL recebe os eventos da PAPI e atualiza o chat central. Se estiver vazio ou incorreto, clique em sincronizar.
          </p>
        </div>
        <Button 
          onClick={handleSyncWebhook} 
          disabled={loading}
          variant="outline"
          className="rounded-xl font-bold shadow-sm whitespace-nowrap h-11"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Sincronizar Webhook
        </Button>
      </div>
    </Card>
  );
}

function SectionHeader({
  title,
  description,
  status,
}: {
  title: string;
  description: string;
  status?: "connected" | "warning" | "error";
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-2">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      </div>
      {status === "connected" && (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-success/10 text-success">
          <CheckCircle2 className="size-3.5" /> Conectado
        </span>
      )}
      {status === "warning" && (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-warning/10 text-warning-foreground">
          <AlertCircle className="size-3.5" /> Atenção
        </span>
      )}
      {status === "error" && (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="size-3.5" /> Desconectado
        </span>
      )}
    </div>
  );
}
