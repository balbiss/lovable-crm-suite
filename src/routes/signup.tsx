import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, ArrowRight, Building2, Stethoscope, Car, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Cadastrar Empresa — InoovaWeb CRM" },
      { name: "description", content: "Crie sua conta no InoovaWeb CRM." },
    ],
  }),
  component: SignupPage,
});

const NICHES = [
  { id: "imobiliaria", label: "Imobiliária", icon: Building2 },
  { id: "clinica", label: "Clínica", icon: Stethoscope },
  { id: "carros", label: "Loja de Carros", icon: Car },
];

function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    adminName: "",
    email: "",
    companyName: "",
    whatsapp: "",
    password: "",
    niche: "imobiliaria",
  });

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.adminName,
            company: formData.companyName,
            whatsapp: formData.whatsapp,
            niche: formData.niche,
            role: "admin", // O primeiro cadastro de uma empresa é sempre admin
          }
        }
      });

      if (error) throw error;

      toast.success("Conta criada com sucesso! Verifique seu e-mail.");
      navigate({ to: "/dashboard" });
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid md:grid-cols-2 bg-gradient-soft">
      {/* Brand panel */}
      <div className="hidden md:flex relative overflow-hidden bg-gradient-primary text-primary-foreground p-12 flex-col justify-between">
        <div className="absolute -top-32 -right-32 size-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 size-96 rounded-full bg-white/10 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="size-11 rounded-2xl bg-white/15 backdrop-blur grid place-items-center">
            <Sparkles className="size-6" />
          </div>
          <div>
            <div className="text-lg font-semibold">InoovaWeb CRM</div>
            <div className="text-sm opacity-80">SaaS Multi-tenant Híbrido</div>
          </div>
        </div>

        <div className="relative space-y-6 max-w-md">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            Comece sua jornada para o topo hoje mesmo.
          </h1>
          <p className="text-base opacity-90 leading-relaxed">
            Junte-se a centenas de empresas que já transformaram seu atendimento com o InoovaWeb CRM. Cadastro rápido, sem burocracia.
          </p>
          <div className="space-y-4 pt-4">
            {[
              "Instância WhatsApp em 2 minutos",
              "Kanban inteligente e automatizado",
              "Gestão de equipe e rodízio de leads",
            ].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="size-5 rounded-full bg-white/20 grid place-items-center">
                  <div className="size-1.5 rounded-full bg-white" />
                </div>
                <span className="text-sm font-medium">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-xs opacity-70">© 2026 InoovaWeb — Todos os direitos reservados</div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <div className="md:hidden flex items-center gap-2 mb-8">
            <div className="size-10 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
              <Sparkles className="size-5 text-primary-foreground" />
            </div>
            <div className="font-semibold text-lg">InoovaWeb CRM</div>
          </div>

          <h2 className="text-3xl font-bold tracking-tight">Criar minha conta</h2>
          <p className="text-muted-foreground mt-2">
            {step === 1 ? "Dados pessoais e da empresa." : "Escolha seu nicho de atuação."}
          </p>

          <form onSubmit={handleNext} className="mt-8 space-y-5">
            {step === 1 ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome do Administrador</label>
                  <input
                    required
                    value={formData.adminName}
                    onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                    placeholder="Seu nome completo"
                    className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:ring-2 focus:ring-primary/20 outline-none transition"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">E-mail Corporativo</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="exemplo@empresa.com"
                    className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:ring-2 focus:ring-primary/20 outline-none transition"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Empresa</label>
                    <input
                      required
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      placeholder="Nome Fantasia"
                      className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:ring-2 focus:ring-primary/20 outline-none transition"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">WhatsApp</label>
                    <input
                      required
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      placeholder="(00) 00000-0000"
                      className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:ring-2 focus:ring-primary/20 outline-none transition"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Senha de Acesso</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:ring-2 focus:ring-primary/20 outline-none transition"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <label className="text-sm font-medium">Qual seu nicho principal?</label>
                <div className="grid grid-cols-1 gap-3">
                  {NICHES.map((n) => {
                    const Icon = n.icon;
                    const isSel = formData.niche === n.id;
                    return (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, niche: n.id })}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-2xl border transition-all text-left",
                          isSel
                            ? "border-primary bg-accent shadow-soft ring-2 ring-primary/20"
                            : "border-border bg-card hover:border-primary/30"
                        )}
                      >
                        <div className={cn(
                          "size-10 rounded-xl grid place-items-center",
                          isSel ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}>
                          <Icon className="size-5" />
                        </div>
                        <span className="font-semibold">{n.label}</span>
                        <div className={cn(
                          "ml-auto size-5 rounded-full border-2 transition-colors",
                          isSel ? "border-primary bg-primary" : "border-border"
                        )} />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-primary text-primary-foreground py-3.5 font-semibold shadow-glow hover:opacity-95 active:scale-[0.99] transition disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                step === 1 ? "Próximo passo" : "Finalizar cadastro"
              )}
              <ArrowRight className="size-4" />
            </button>

            {step === 2 && !loading && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-sm text-muted-foreground hover:text-foreground"
              >
                Voltar aos dados
              </button>
            )}
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Já tem uma conta?{" "}
              <button 
                onClick={() => navigate({ to: "/login" })}
                className="text-primary font-semibold hover:underline"
              >
                Fazer login
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
