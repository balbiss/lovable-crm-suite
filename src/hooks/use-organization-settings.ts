import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

const API = import.meta.env.VITE_API_URL || "https://api-crminoovaweb.inoovaweb.com.br/api";

export function useOrganizationSettings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["org-settings", user?.orgId],
    queryFn: async () => {
      if (!user?.orgId) throw new Error("Usuário não autenticado ou sem organização");

      const { data, error } = await supabase
        .from("organizations")
        .select("papi_instance_id, ai_prompt, ai_tone, global_ai_enabled")
        .eq("id", user.orgId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.orgId,
    staleTime: 1000 * 60 * 5, // 5 minutos de cache "fresco"
  });
}

export function usePapiStatus(instanceId: string | null | undefined) {
  return useQuery({
    queryKey: ["papi-status", instanceId],
    queryFn: async () => {
      if (!instanceId) return null;
      const response = await fetch(`${API}/papi/instances/${instanceId}`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.data || data.instance || data;
    },
    enabled: !!instanceId,
    refetchInterval: (query) => {
      // Se não estiver conectado, verifica a cada 5 segundos (polling para QR Code)
      const data: any = query.state.data;
      return data?.status !== "CONNECTED" ? 5000 : 30000;
    },
  });
}

export function usePapiSettings(instanceId: string | null | undefined) {
  return useQuery({
    queryKey: ["papi-settings", instanceId],
    queryFn: async () => {
      if (!instanceId) return null;
      const response = await fetch(`${API}/papi/instances/${instanceId}/settings`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.data?.settings || data.settings || null;
    },
    enabled: !!instanceId,
    staleTime: 1000 * 60 * 10, // Configurações mudam pouco, cache longo
  });
}
