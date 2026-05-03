import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { 
  Brain, 
  Upload, 
  Trash2, 
  FileText, 
  Loader2, 
  Plus,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/configuracoes-ia")({
  component: IASettingsPage,
});

const API_URL = import.meta.env.VITE_API_URL || "https://api-crminoovaweb.inoovaweb.com.br/api";

function IASettingsPage() {
  const { orgId } = useAuth();
  const [knowledge, setKnowledge] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (orgId) loadKnowledge();
  }, [orgId]);

  const loadKnowledge = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("company_knowledge")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    if (!error && data) setKnowledge(data);
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !orgId) return;

    // Validar tipo
    const allowed = ['application/pdf', 'text/plain'];
    if (!allowed.includes(file.mimetype || file.type)) {
      return toast.error("Apenas PDF ou TXT são permitidos.");
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('orgId', orgId);
      formData.append('title', file.name);

      const res = await fetch(`${API_URL}/ai/knowledge/upload`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        toast.success("Conhecimento adicionado com sucesso!");
        loadKnowledge();
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro no upload.");
      }
    } catch (err) {
      toast.error("Erro de conexão com o servidor.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const deleteKnowledge = async (id: string) => {
    if (!confirm("Remover este conhecimento da IA?")) return;
    const { error } = await supabase.from("company_knowledge").delete().eq("id", id);
    if (!error) {
      setKnowledge(prev => prev.filter(k => k.id !== id));
      toast.success("Conhecimento removido.");
    } else {
      toast.error("Erro ao remover.");
    }
  };

  return (
    <div className="flex-1 p-6 lg:p-10 max-w-5xl mx-auto">
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Brain className="size-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Cérebro da IA</h1>
        </div>
        <p className="text-muted-foreground">
          Gerencie o conhecimento que a IA usará para sugerir respostas e atender seus clientes.
        </p>
      </header>

      <div className="grid gap-8">
        {/* Upload Card */}
        <div className="bg-white rounded-2xl border border-border p-8 shadow-sm">
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-10 hover:border-primary/50 transition-colors bg-slate-50/50 group">
            <div className="p-4 rounded-full bg-white shadow-sm mb-4 group-hover:scale-110 transition-transform">
              {uploading ? <Loader2 className="size-8 animate-spin text-primary" /> : <Upload className="size-8 text-primary" />}
            </div>
            <h3 className="text-lg font-semibold mb-1">Subir novo conhecimento</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-xs">
              Selecione arquivos **PDF** ou **TXT** com informações sobre sua empresa, produtos ou serviços.
            </p>
            <label className="cursor-pointer">
              <input type="file" className="hidden" accept=".pdf,.txt" onChange={handleFileUpload} disabled={uploading} />
              <div className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium shadow-glow hover:opacity-90 transition-opacity flex items-center gap-2">
                <Plus className="size-4" /> Selecionar Arquivo
              </div>
            </label>
          </div>
        </div>

        {/* Knowledge List */}
        <div className="grid gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2 px-2">
            Documentos Ativos
            <span className="text-xs font-normal bg-slate-100 px-2 py-0.5 rounded-full text-slate-500">{knowledge.length}</span>
          </h2>

          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="size-8 animate-spin text-primary/30" /></div>
          ) : knowledge.length === 0 ? (
            <div className="text-center py-20 bg-slate-50/50 rounded-2xl border border-border">
              <FileText className="size-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">Nenhum documento cadastrado.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {knowledge.map((k) => (
                <div key={k.id} className="bg-white border border-border p-4 rounded-xl flex items-center gap-4 hover:shadow-md transition-shadow group">
                  <div className="size-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                    <FileText className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{k.title}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <span className="uppercase">{k.file_type?.split('/')[1] || 'TXT'}</span>
                      <span>•</span>
                      <span>Cadastrado em {new Date(k.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md mr-2">
                      <CheckCircle2 className="size-3" /> PRONTO
                    </div>
                    <button onClick={() => deleteKnowledge(k.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tip Card */}
        <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl flex gap-4">
          <AlertCircle className="size-6 text-indigo-500 shrink-0" />
          <div className="text-sm text-indigo-900 leading-relaxed">
            <strong className="block mb-1">Dica de Especialista:</strong>
            Para melhores resultados, suba documentos claros com perguntas e respostas frequentes (FAQ) ou tabelas de preços. A IA usará essas informações para gerar as sugestões no chat.
          </div>
        </div>
      </div>
    </div>
  );
}
