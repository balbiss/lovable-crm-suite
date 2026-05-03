import { Queue, Worker } from 'bullmq';
import dotenv from 'dotenv';
import { supabase } from '../lib/supabase';
import { redisConnection } from '../lib/redis';
import { AIService } from '../services/ai.service';
import { PapiService } from '../services/papi.service';
import { broadcastToOrg } from '../routes/chat.routes';
import { enqueueRotation } from './rotation.queue';

dotenv.config();

// ─── Fila de Processamento de IA ────────────────────────────────────

export const aiQueue = new Queue('ai_processing', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    removeOnComplete: { count: 100 },
  },
});

// ─── Worker ────────────────────────────────────────────────────────

export const aiWorker = new Worker(
  'ai_processing',
  async (job) => {
    const { orgId, conversationId, contactName, content, jid, instanceId, globalAiEnabled } = job.data;

    console.log(`[IA-Worker] Processando resposta para: ${contactName}`);

    // 1. Simulação de Leitura (3s) e Digitação (6s)
    await new Promise(resolve => setTimeout(resolve, 3000));
    PapiService.sendPresence(instanceId, jid, 'composing').catch(() => {});
    await new Promise(resolve => setTimeout(resolve, 6000));

    // 2. Busca o prompt, tom de voz e histórico
    const { data: orgData } = await supabase.from('organizations').select('ai_prompt, ai_tone').eq('id', orgId).single();
    const { data: historyMsgs } = await supabase.from('messages').select('content, is_from_me').eq('conversation_id', conversationId).order('created_at', { ascending: false }).limit(50);

    const systemPrompt = orgData?.ai_prompt || 'Você é um assistente virtual da InoovaWeb.';
    const aiTone = orgData?.ai_tone || 'Amigável';
    
    const fullPrompt = `Tom de Voz: ${aiTone}\n\nInstruções Principais:\n${systemPrompt}`;

    const historyText = historyMsgs?.reverse().map(m => m.content).join('\n') || '';

    // 3. Geração da Resposta
    let aiReply = await AIService.generateResponse(fullPrompt, historyText, content);

    if (aiReply) {
      if (aiReply.includes('[TRANSBORDO]')) {
        aiReply = aiReply.replace('[TRANSBORDO]', '').trim();
        await supabase.from('conversations').update({ ai_enabled: false }).eq('id', conversationId);
        enqueueRotation(orgId, conversationId, contactName).catch(() => {});
      }

      const sendRes = await PapiService.sendText(instanceId, jid, aiReply);
      if (sendRes) {
        const { data: savedAiMsg } = await supabase.from('messages').insert({
          conversation_id: conversationId,
          papi_message_id: sendRes.key?.id || `ai_${Date.now()}`,
          org_id: orgId,
          content: aiReply,
          is_from_me: true,
          type: 'text',
          status: 2
        }).select().single();

        if (savedAiMsg) {
          broadcastToOrg(orgId, 'new_message', {
            message: savedAiMsg,
            conversation: { id: conversationId, last_message_preview: aiReply, last_message_at: new Date().toISOString() }
          });
        }
      }
    }
  },
  { connection: redisConnection }
);
