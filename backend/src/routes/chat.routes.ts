import { Router, Response } from 'express';
import { supabase } from '../lib/supabase';
import { PapiService } from '../services/papi.service';
import { enqueueRotation } from '../queues/rotation.queue';
import { scheduleFollowUp } from '../queues/follow-up.queue';

const router = Router();

// Clientes SSE conectados: { orgId: Response[] }
const sseClients: Map<string, Response[]> = new Map();

/** Broadcast de evento para todos os clientes de uma org */
export function broadcastToOrg(orgId: string, event: string, data: any) {
  const clients = sseClients.get(orgId) ?? [];
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  clients.forEach((res) => {
    try { res.write(payload); } catch (_) {}
  });
}

/** SSE — frontend conecta aqui para receber mensagens em tempo real */
router.get('/sse/:orgId', (req, res) => {
  const orgId = String(req.params.orgId);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  // Heartbeat a cada 20s para manter conexão viva
  const heartbeat = setInterval(() => {
    try { res.write(': ping\n\n'); } catch (_) {}
  }, 20000);

  // Registra o cliente
  if (!sseClients.has(orgId)) sseClients.set(orgId, []);
  sseClients.get(orgId)!.push(res);
  console.log(`[SSE] Cliente conectado para org ${orgId}. Total: ${sseClients.get(orgId)!.length}`);

  // Remove ao desconectar
  req.on('close', () => {
    clearInterval(heartbeat);
    const list = sseClients.get(orgId) ?? [];
    sseClients.set(orgId, list.filter((c) => c !== res));
    console.log(`[SSE] Cliente desconectado da org ${orgId}.`);
  });
});

/** Lista conversas de uma organização */
router.get('/conversations', async (req, res) => {
  const { orgId } = req.query;
  if (!orgId) return res.status(400).json({ error: 'orgId obrigatório' });

  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('org_id', orgId as string)
      .order('last_message_at', { ascending: false });

    if (error) throw error;
    return res.json(data ?? []);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/** Busca mensagens de uma conversa */
router.get('/conversations/:conversationId/messages', async (req, res) => {
  const { conversationId } = req.params;

  try {
    // Zera o contador de não lidas
    await supabase
      .from('conversations')
      .update({ unread_count: 0 })
      .eq('id', conversationId);

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return res.json(data ?? []);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/** Envia mensagem via PAPI e salva no banco */
router.post('/send', async (req, res) => {
  const { conversationId, instanceId, jid, content, type = 'text', mediaUrl, orgId } = req.body;

  if (!conversationId || !instanceId || !jid || (!content && !mediaUrl)) {
    return res.status(400).json({ error: 'Dados insuficientes para enviar mensagem' });
  }

  try {
    let papiResponse;

    const mediaBase64 = mediaUrl?.includes('base64,') ? mediaUrl.split('base64,')[1] : mediaUrl;

    // 1. Envia via PAPI de acordo com o tipo
    switch (type) {
      case 'image':
        papiResponse = await PapiService.sendImage(instanceId, jid, { base64: mediaBase64, caption: content });
        break;
      case 'video':
        papiResponse = await PapiService.sendVideo(instanceId, jid, { base64: mediaBase64, caption: content });
        break;
      case 'audio':
        papiResponse = await PapiService.sendAudio(instanceId, jid, { base64: mediaBase64, ptt: true });
        break;
      case 'document':
        papiResponse = await PapiService.sendDocument(instanceId, jid, { base64: mediaBase64, filename: req.body.filename || 'arquivo' });
        break;
      default:
        papiResponse = await PapiService.sendText(instanceId, jid, content);
    }

    // 2. Salva no banco como mensagem enviada
    const { data: savedMsg, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        org_id: orgId,
        content: content || (type !== 'text' ? `[Mídia: ${type}]` : ''),
        media_url: mediaUrl,
        is_from_me: true,
        type: type,
        status: 2, // enviado
        papi_message_id: papiResponse?.messageId
      })
      .select()
      .single();

    if (error) throw error;

    // 3. Atualiza preview da conversa e desativa IA por intervenção humana
    await supabase
      .from('conversations')
      .update({
        last_message_preview: content || `[Mídia: ${type}]`,
        last_message_at: new Date().toISOString(),
        ai_enabled: false // Desativa IA ao detectar intervenção humana
      })
      .eq('id', conversationId);

    if (savedMsg) {
      broadcastToOrg(orgId, 'new_message', {
        message: savedMsg,
        conversation: {
          id: conversationId,
          last_message_preview: content || `[Mídia: ${type}]`,
          last_message_at: new Date().toISOString(),
          ai_enabled: false
        }
      });
    }

    return res.json({ ok: true, message: savedMsg });
  } catch (error: any) {
    console.error('[CHAT] Erro ao enviar mensagem:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

/** Atualiza dados da conversa (etiquetas, status, etc) */
router.patch('/conversations/:conversationId', async (req, res) => {
  const { conversationId } = req.params;
  const updates = req.body;

  try {
    const { data, error } = await supabase
      .from('conversations')
      .update(updates)
      .eq('id', conversationId)
      .select()
      .single();

    if (error) throw error;
    return res.json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/** Atribui a um atendente ou envia para rodízio */
router.post('/conversations/:conversationId/assign', async (req, res) => {
  const { conversationId } = req.params;
  const { userId, orgId, contactName, mode } = req.body; // mode: 'manual' | 'rotation'

  try {
    if (mode === 'rotation') {
      await enqueueRotation(orgId, conversationId, contactName);
      return res.json({ ok: true, message: 'Enviado para fila de rodízio' });
    }

    const { error } = await supabase
      .from('conversations')
      .update({ 
        assigned_to: userId,
        status: 'atendimento'
      })
      .eq('id', conversationId);

    if (error) throw error;

    broadcastToOrg(orgId, 'lead_assigned', {
      conversationId,
      sellerId: userId
    });

    return res.json({ ok: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/** Deleta uma conversa e suas mensagens */
router.delete('/conversations/:conversationId', async (req, res) => {
  const { conversationId } = req.params;

  try {
    // 1. Deleta mensagens primeiro (foreign key)
    await supabase.from('messages').delete().eq('conversation_id', conversationId);
    
    // 2. Deleta a conversa
    const { error } = await supabase.from('conversations').delete().eq('id', conversationId);

    if (error) throw error;
    return res.json({ ok: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
