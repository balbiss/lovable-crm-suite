import { Queue, Worker } from 'bullmq';
import { supabase } from '../lib/supabase';
import { redisConnection } from '../lib/redis';
import { AIService } from '../services/ai.service';
import { PapiService } from '../services/papi.service';
import { broadcastToOrg } from '../routes/chat.routes';

export const followUpQueue = new Queue('follow_up', {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: { count: 100 },
  }
});

export const followUpWorker = new Worker(
  'follow_up',
  async (job) => {
    const { conversationId } = job.data;
    console.log(`[Follow-up] Verificando inatividade: ${conversationId}`);

    // 1. Busca dados da conversa
    const { data: conv, error } = await supabase
      .from('conversations')
      .select('*, organizations(papi_instance_id)')
      .eq('id', conversationId)
      .single();

    if (error || !conv) return;

    // 2. Verifica se a última mensagem ainda é do cliente
    // E se não houve interação humana recente
    const { data: lastMsg } = await supabase
      .from('messages')
      .select('is_from_me, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // 3. Busca histórico recente para contexto
    const { data: messages } = await supabase
      .from('messages')
      .select('content, is_from_me')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(10);

    const history = messages?.reverse().map(m => `${m.is_from_me ? 'Vendedor' : 'Cliente'}: ${m.content}`).join('\n') || '';

    // 4. Se a IA estiver ativa, gera mensagem contextual
    if (conv.ai_enabled) {
      console.log(`[Follow-up] Gerando mensagem via IA...`);
      const followUpText = await AIService.generateFollowUp(history);
      
      if (followUpText) {
        // Enviar via PAPI
        const instanceId = (conv.organizations as any)?.papi_instance_id;
        if (instanceId && conv.jid) {
          const papiRes = await PapiService.sendText(instanceId, conv.jid, followUpText);
          
          // Salva no banco
          const { data: savedMsg } = await supabase.from('messages').insert({
            conversation_id: conv.id,
            org_id: conv.org_id,
            content: followUpText,
            is_from_me: true,
            type: 'text',
            status: 2,
            papi_message_id: papiRes?.messageId
          }).select().single();

          if (savedMsg) {
            broadcastToOrg(conv.org_id, 'new_message', {
              message: savedMsg,
              conversation: conv
            });
          }
        }
      }
    }
  },
  { connection: redisConnection }
);

/** Agenda um follow-up para daqui a X horas */
export async function scheduleFollowUp(conversationId: string, delayMs: number) {
  // Remove jobs pendentes para esta conversa antes de agendar novo
  const jobs = await followUpQueue.getJobs(['delayed', 'waiting']);
  for (const job of jobs) {
    if (job.data.conversationId === conversationId) {
      await job.remove();
    }
  }

  await followUpQueue.add('check_inactivity', { conversationId }, { delay: delayMs });
}
