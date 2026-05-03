import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — InoovaWeb CRM" },
      { name: "description", content: "Acesse o CRM multi-tenant InoovaWeb." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/dashboard" });
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      toast.success("Bem-vindo de volta!");
      navigate({ to: "/dashboard" });
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login");
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
            Impulsione suas vendas com Inteligência Artificial.
          </h1>
          <p className="text-base opacity-90 leading-relaxed">
            Centralize leads, automatize processos e gerencie sua equipe em tempo real. A plataforma definitiva para imobiliárias, clínicas e concessionárias.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { v: "+85%", l: "Eficiência" },
              { v: "30%", l: "Mais Vendas" },
              { v: "24/7", l: "IA Ativa" },
            ].map((s) => (
              <div key={s.l} className="rounded-xl bg-white/10 backdrop-blur px-4 py-3">
                <div className="text-2xl font-bold">{s.v}</div>
                <div className="text-xs opacity-80">{s.l}</div>
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

          <h2 className="text-3xl font-bold tracking-tight">Bem-vindo de volta</h2>
          <p className="text-muted-foreground mt-2">
            Acesse sua conta para gerenciar seus negócios.
          </p>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@empresa.com"
                className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:ring-2 focus:ring-primary/20 outline-none transition"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Senha</label>
                <button type="button" className="text-xs text-primary font-medium hover:underline">
                  Esqueci minha senha
                </button>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:ring-2 focus:ring-primary/20 outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-primary text-primary-foreground py-3.5 font-semibold shadow-glow hover:opacity-95 active:scale-[0.99] transition disabled:opacity-70"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Entrar no sistema"}
              <ArrowRight className="size-4" />
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Não tem uma conta?{" "}
              <button 
                onClick={() => navigate({ to: "/signup" })}
                className="text-primary font-semibold hover:underline"
              >
                Cadastre sua empresa
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
