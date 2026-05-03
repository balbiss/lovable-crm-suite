import { Queue, Worker } from 'bullmq';
import dotenv from 'dotenv';
import { supabase } from '../lib/supabase';
import { redisConnection, getNextRotationIndex } from '../lib/redis';
import { broadcastToOrg } from '../routes/chat.routes';

dotenv.config();

// ─── Fila de Rodízio ───────────────────────────────────────────────

export const rotationQueue = new Queue('lead_rotation', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

// ─── Worker ────────────────────────────────────────────────────────

export const rotationWorker = new Worker(
  'lead_rotation',
  async (job) => {
    const { orgId, conversationId, contactName } = job.data;
    console.log(`[Rodízio] Processando lead: ${contactName} (Org: ${orgId})`);

    // 1. Busca vendedores da organização (fallback: todos os membros)
    let { data: sellers, error } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('org_id', orgId)
      .eq('role', 'vendedor');

    // Fallback: se não houver vendedores, usa todos os membros da org (incluindo admins)
    if (error || !sellers || sellers.length === 0) {
      console.warn(`[Rodízio] Nenhum vendedor na org ${orgId}, usando todos os membros como fallback`);
      const fallback = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('org_id', orgId);
      sellers = fallback.data || [];
    }

    if (!sellers || sellers.length === 0) {
      console.warn(`[Rodízio] Nenhum membro encontrado para a org ${orgId}. Lead não atribuído.`);
      return { skipped: true };
    }

    console.log(`[Rodízio] ${sellers.length} membro(s) disponível(is):`, sellers.map(s => s.full_name).join(', '));

    // 2. Round-Robin via Redis
    const nextIndex = await getNextRotationIndex(orgId, sellers.length);
    const assignedSeller = sellers[nextIndex];

    // 3. Atualiza a conversa no Supabase
    const { error: updateError } = await supabase
      .from('conversations')
      .update({
        assigned_to: assignedSeller.id,
        status: 'atendimento',
      })
      .eq('id', conversationId);

    if (updateError) throw updateError;

    // 4. Notifica em tempo real via SSE (substitui Socket.io)
    broadcastToOrg(orgId, 'lead_assigned', {
      conversationId,
      sellerId: assignedSeller.id,
      sellerName: assignedSeller.full_name,
      contactName,
    });

    console.log(`[Rodízio] ✅ Lead "${contactName}" atribuído a ${assignedSeller.full_name}`);
    return { sellerId: assignedSeller.id };
  },
  { connection: redisConnection }
);

rotationWorker.on('completed', (job) => {
  console.log(`[Rodízio] Job ${job.id} concluído.`);
});

rotationWorker.on('failed', (job, err) => {
  console.error(`[Rodízio] Job ${job?.id} falhou:`, err.message);
});

console.log('[Rodízio] BullMQ Queue e Worker inicializados.');

// ─── Helper público ────────────────────────────────────────────────

/** Adiciona um lead na fila de rodízio */
export async function enqueueRotation(orgId: string, conversationId: string, contactName: string) {
  await rotationQueue.add('assign_lead', { orgId, conversationId, contactName });
}
