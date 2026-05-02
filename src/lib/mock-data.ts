import type { Lead, Message, User, KanbanStage } from "./types";

export const MOCK_USERS: User[] = [
  {
    id: "u-admin",
    name: "Marina Costa",
    email: "marina@empresa.com",
    role: "admin",
    avatar: "https://i.pravatar.cc/150?img=47",
  },
  {
    id: "u-seller-1",
    name: "Rafael Souza",
    email: "rafael@empresa.com",
    role: "vendedor",
    avatar: "https://i.pravatar.cc/150?img=12",
  },
  {
    id: "u-seller-2",
    name: "Beatriz Lima",
    email: "beatriz@empresa.com",
    role: "vendedor",
    avatar: "https://i.pravatar.cc/150?img=32",
  },
];

export const STAGE_LABELS: Record<KanbanStage, string> = {
  novo: "Novo Lead",
  qualificacao: "Qualificação",
  proposta: "Proposta",
  negociacao: "Negociação",
  ganho: "Ganho",
  perdido: "Perdido",
};

export const STAGE_ORDER: KanbanStage[] = [
  "novo",
  "qualificacao",
  "proposta",
  "negociacao",
  "ganho",
  "perdido",
];

const now = Date.now();
const min = (m: number) => new Date(now - m * 60_000).toISOString();
const hr = (h: number) => new Date(now - h * 3_600_000).toISOString();

export const MOCK_LEADS: Lead[] = [
  {
    id: "l1",
    name: "Carlos Mendes",
    phone: "+55 11 98765-4321",
    avatar: "https://i.pravatar.cc/150?img=68",
    niche: "imobiliaria",
    stage: "qualificacao",
    assignedTo: "u-seller-1",
    lastMessageAt: min(3),
    unread: 2,
    tags: ["quente", "imóvel-alto-padrão"],
    imobiliaria: { tipo: "Apartamento 3 dorm.", bairro: "Pinheiros, SP", valor: "R$ 1.2M – 1.6M" },
  },
  {
    id: "l2",
    name: "Juliana Pacheco",
    phone: "+55 21 99876-5432",
    avatar: "https://i.pravatar.cc/150?img=45",
    niche: "clinica",
    stage: "proposta",
    assignedTo: "u-seller-1",
    lastMessageAt: min(15),
    unread: 0,
    tags: ["estética"],
    clinica: { procedimento: "Harmonização facial", convenio: "Particular" },
  },
  {
    id: "l3",
    name: "Eduardo Tavares",
    phone: "+55 31 98123-4567",
    avatar: "https://i.pravatar.cc/150?img=15",
    niche: "carros",
    stage: "negociacao",
    assignedTo: "u-seller-2",
    lastMessageAt: hr(1),
    unread: 1,
    tags: ["financiamento"],
    carros: { modelo: "Toyota Corolla XEi", ano: "2024", financiamento: "60x" },
  },
  {
    id: "l4",
    name: "Patrícia Almeida",
    phone: "+55 41 99654-7890",
    avatar: "https://i.pravatar.cc/150?img=29",
    niche: "imobiliaria",
    stage: "novo",
    assignedTo: "u-seller-2",
    lastMessageAt: min(45),
    unread: 4,
    tags: ["primeira-compra"],
    imobiliaria: { tipo: "Casa 4 dorm.", bairro: "Curitiba, Batel", valor: "R$ 2M+" },
  },
  {
    id: "l5",
    name: "Henrique Oliveira",
    phone: "+55 11 98000-1122",
    avatar: "https://i.pravatar.cc/150?img=11",
    niche: "carros",
    stage: "ganho",
    assignedTo: "u-seller-1",
    lastMessageAt: hr(8),
    unread: 0,
    tags: ["fechado"],
    carros: { modelo: "Honda Civic Touring", ano: "2024", financiamento: "À vista" },
  },
  {
    id: "l6",
    name: "Larissa Fernandes",
    phone: "+55 51 98222-3344",
    avatar: "https://i.pravatar.cc/150?img=24",
    niche: "clinica",
    stage: "qualificacao",
    assignedTo: "u-seller-2",
    lastMessageAt: hr(2),
    unread: 0,
    tags: ["odonto"],
    clinica: { procedimento: "Implante dentário", convenio: "Unimed" },
  },
  {
    id: "l7",
    name: "Diego Ramos",
    phone: "+55 11 97777-8888",
    avatar: "https://i.pravatar.cc/150?img=33",
    niche: "imobiliaria",
    stage: "negociacao",
    assignedTo: "u-seller-1",
    lastMessageAt: hr(4),
    unread: 0,
    tags: ["investidor"],
    imobiliaria: { tipo: "Sala comercial", bairro: "Vila Olímpia, SP", valor: "R$ 800k" },
  },
  {
    id: "l8",
    name: "Sofia Martins",
    phone: "+55 11 96543-2100",
    avatar: "https://i.pravatar.cc/150?img=49",
    niche: "carros",
    stage: "perdido",
    assignedTo: "u-seller-2",
    lastMessageAt: hr(48),
    unread: 0,
    tags: ["frio"],
    carros: { modelo: "Jeep Compass", ano: "2023", financiamento: "Indeciso" },
  },
];

export const MOCK_MESSAGES: Record<string, Message[]> = {
  l1: [
    { id: "m1", leadId: "l1", from: "lead", type: "text", content: "Oi! Vi o anúncio do apto em Pinheiros, ainda está disponível?", at: min(28) },
    { id: "m2", leadId: "l1", from: "agent", type: "text", content: "Olá Carlos! Sim, está disponível. Posso te enviar mais fotos e o tour virtual.", at: min(26), status: "read" },
    { id: "m3", leadId: "l1", from: "lead", type: "audio", content: "audio.ogg", duration: 14, transcription: "Perfeito, gostaria também de saber sobre as condições de financiamento e se aceita FGTS na entrada.", at: min(12) },
    { id: "m4", leadId: "l1", from: "agent", type: "text", content: "Aceitamos FGTS sim. Quer agendar uma visita pra essa semana?", at: min(10), status: "read" },
    { id: "m5", leadId: "l1", from: "lead", type: "text", content: "Quinta de tarde funciona pra mim 🙌", at: min(3) },
  ],
  l2: [
    { id: "m1", leadId: "l2", from: "lead", type: "text", content: "Boa tarde, gostaria de saber sobre o pacote de harmonização.", at: hr(2) },
    { id: "m2", leadId: "l2", from: "agent", type: "text", content: "Olá Juliana! Te envio agora o orçamento personalizado.", at: hr(2), status: "read" },
    { id: "m3", leadId: "l2", from: "agent", type: "text", content: "Pacote completo: R$ 4.800 em até 6x sem juros. Inclui retorno em 30 dias.", at: min(20), status: "read" },
    { id: "m4", leadId: "l2", from: "lead", type: "text", content: "Perfeito, vou conversar com meu marido e retorno!", at: min(15) },
  ],
  l3: [
    { id: "m1", leadId: "l3", from: "lead", type: "text", content: "Oi! O Corolla XEi 2024 prata ainda tem disponível?", at: hr(3) },
    { id: "m2", leadId: "l3", from: "agent", type: "text", content: "Tem sim Eduardo! Quer simular o financiamento?", at: hr(3), status: "read" },
    { id: "m3", leadId: "l3", from: "lead", type: "audio", content: "audio.ogg", duration: 22, transcription: "Quero sim, dou 30 mil de entrada e queria parcelar o resto em 60 vezes. Você consegue uma parcela mais baixa?", at: hr(2) },
    { id: "m4", leadId: "l3", from: "agent", type: "text", content: "Conseguimos parcela de R$ 2.190 em 60x. Posso reservar?", at: hr(1), status: "delivered" },
  ],
};

export const MOCK_METRICS = {
  newLeads: { value: 142, delta: 18.2 },
  conversion: { value: 24.5, delta: 3.4 },
  avgResponse: { value: 2.1, delta: -12.5 }, // minutes
  revenue: { value: 487000, delta: 22.7 },
};

export const MOCK_CHART_FUNNEL = [
  { stage: "Novos", leads: 142 },
  { stage: "Qualif.", leads: 96 },
  { stage: "Proposta", leads: 58 },
  { stage: "Negoc.", leads: 34 },
  { stage: "Ganhos", leads: 22 },
];

export const MOCK_CHART_DAILY = [
  { day: "Seg", atendimentos: 28, fechados: 4 },
  { day: "Ter", atendimentos: 36, fechados: 6 },
  { day: "Qua", atendimentos: 42, fechados: 8 },
  { day: "Qui", atendimentos: 31, fechados: 5 },
  { day: "Sex", atendimentos: 48, fechados: 11 },
  { day: "Sáb", atendimentos: 22, fechados: 3 },
  { day: "Dom", atendimentos: 14, fechados: 2 },
];
