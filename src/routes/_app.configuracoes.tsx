import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Webhook,
  Sparkles,
  Clock,
  Users,
  Save,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MOCK_USERS } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — Nexora CRM" }] }),
  component: ConfigPage,
});

const TABS = [
  { id: "evolution", label: "Evolution API", icon: Webhook },
  { id: "ia", label: "Prompt da IA", icon: Sparkles },
  { id: "followup", label: "Follow-up", icon: Clock },
  { id: "rodizio", label: "Rodízio", icon: Users },
] as const;

type TabId = (typeof TABS)[number]["id"];

function ConfigPage() {
  const [tab, setTab] = useState<TabId>("evolution");
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

      <div className="p-6 max-w-5xl">
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
          {tab === "evolution" && <EvolutionSettings />}
          {tab === "ia" && <AiPromptSettings />}
          {tab === "followup" && <FollowupSettings />}
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

function EvolutionSettings() {
  return (
    <div className="space-y-5">
      <SectionHeader
        title="Integração Evolution API"
        description="Conecte sua instância do WhatsApp via Evolution API."
        status="connected"
      />
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="URL da API" hint="Endpoint base da sua instância">
          <input className={inputClass} defaultValue="https://api.evolution.nexora.com.br" />
        </Field>
        <Field label="API Key">
          <input type="password" className={inputClass} defaultValue="evo_sk_••••••••••••••••" />
        </Field>
        <Field label="Nome da instância">
          <input className={inputClass} defaultValue="nexora-prod-01" />
        </Field>
        <Field label="Webhook de eventos">
          <input className={inputClass} defaultValue="https://crm.nexora.com.br/webhooks/evolution" />
        </Field>
      </div>
    </div>
  );
}

function AiPromptSettings() {
  return (
    <div className="space-y-5">
      <SectionHeader
        title="Prompt da IA"
        description="Defina como a IA deve se comportar nos atendimentos automáticos e nas sugestões."
      />
      <Field label="Modelo">
        <select className={inputClass}>
          <option>GPT-4o (recomendado)</option>
          <option>GPT-4o mini</option>
          <option>Claude 3.5 Sonnet</option>
        </select>
      </Field>
      <Field label="Tom de voz">
        <div className="flex flex-wrap gap-2">
          {["Profissional", "Amigável", "Consultivo", "Direto"].map((t, i) => (
            <button
              key={t}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm border",
                i === 1
                  ? "bg-primary/10 border-primary text-primary font-medium"
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
        hint="Esse texto é injetado no system prompt em todas as conversas."
      >
        <textarea
          className={cn(inputClass, "min-h-32 font-mono text-xs leading-relaxed")}
          defaultValue={`Você é a assistente virtual da Nexora. Seja cordial, objetiva e empática.
- Sempre confirme nome e interesse principal antes de qualificar
- Não invente preços; consulte a tabela atualizada
- Encaminhe para um humano em casos complexos`}
        />
      </Field>
    </div>
  );
}

function FollowupSettings() {
  const rules = [
    { delay: "30 min", channel: "WhatsApp", trigger: "Sem resposta após 1ª mensagem", on: true },
    { delay: "2 h", channel: "WhatsApp", trigger: "Sem resposta após qualificação", on: true },
    { delay: "1 dia", channel: "Email", trigger: "Proposta enviada sem retorno", on: true },
    { delay: "3 dias", channel: "WhatsApp", trigger: "Última tentativa antes de marcar como frio", on: false },
  ];
  return (
    <div className="space-y-5">
      <SectionHeader
        title="Regras de Follow-up automático"
        description="A IA executa essas regras quando os leads ficam sem resposta."
      />
      <div className="space-y-2">
        {rules.map((r, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-3 rounded-xl border border-border bg-muted/40"
          >
            <div className="size-10 rounded-xl bg-card border border-border grid place-items-center text-primary shrink-0">
              <Clock className="size-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">Após {r.delay}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                  {r.channel}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{r.trigger}</div>
            </div>
            <Switch defaultOn={r.on} />
          </div>
        ))}
      </div>
    </div>
  );
}

function RotationSettings() {
  return (
    <div className="space-y-5">
      <SectionHeader
        title="Rodízio de leads"
        description="Distribua automaticamente os novos leads entre os vendedores."
      />
      <Field label="Estratégia">
        <select className={inputClass} defaultValue="round-robin">
          <option value="round-robin">Round-robin (igualitário)</option>
          <option value="weighted">Por peso/performance</option>
          <option value="manual">Manual</option>
        </select>
      </Field>
      <div>
        <div className="text-sm font-medium mb-2">Vendedores ativos</div>
        <div className="space-y-2">
          {MOCK_USERS.filter((u) => u.role === "vendedor").map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-muted/40"
            >
              <img src={u.avatar} className="size-9 rounded-full" alt="" />
              <div className="flex-1">
                <div className="text-sm font-medium">{u.name}</div>
                <div className="text-xs text-muted-foreground">{u.email}</div>
              </div>
              <Field label="">
                <input
                  type="number"
                  defaultValue={50}
                  min={0}
                  max={100}
                  className={cn(inputClass, "w-20 text-center")}
                />
              </Field>
              <Switch defaultOn />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  description,
  status,
}: {
  title: string;
  description: string;
  status?: "connected" | "warning";
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
    </div>
  );
}

function Switch({ defaultOn }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(!!defaultOn);
  return (
    <button
      onClick={() => setOn((v) => !v)}
      className={cn(
        "relative w-11 h-6 rounded-full transition-colors shrink-0",
        on ? "bg-primary" : "bg-border"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 size-5 bg-white rounded-full shadow transition-transform",
          on ? "translate-x-5" : "translate-x-0.5"
        )}
      />
    </button>
  );
}
