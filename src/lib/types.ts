export type Role = "admin" | "vendedor";
export type Niche = "imobiliaria" | "clinica" | "carros";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  niche: Niche;
  stage: KanbanStage;
  assignedTo: string; // user id
  lastMessageAt: string;
  unread: number;
  tags: string[];
  // Niche-specific fields
  imobiliaria?: { tipo: string; bairro: string; valor: string };
  clinica?: { procedimento: string; convenio: string };
  carros?: { modelo: string; ano: string; financiamento: string };
}

export type KanbanStage =
  | "novo"
  | "qualificacao"
  | "proposta"
  | "negociacao"
  | "ganho"
  | "perdido";

export interface Message {
  id: string;
  leadId: string;
  from: "lead" | "agent" | "ai";
  type: "text" | "audio" | "image";
  content: string;
  transcription?: string;
  duration?: number; // seconds (audio)
  at: string;
  status?: "sent" | "delivered" | "read";
}

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  at: number;
}
