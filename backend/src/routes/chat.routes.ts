import { Router, Response } from 'express';
import { supabase } from '../lib/supabase';
import { PapiService } from '../services/papi.service';

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
  const { conversationId, instanceId, jid, content, orgId } = req.body;

  if (!conversationId || !instanceId || !jid || !content) {
    return res.status(400).json({ error: 'conversationId, instanceId, jid e content são obrigatórios' });
  }

  try {
    // 1. Envia via PAPI
    await PapiService.sendText(instanceId, jid, content);

    // 2. Salva no banco como mensagem enviada
    const { data: savedMsg, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        org_id: orgId,
        content,
        is_from_me: true,
        type: 'text',
        status: 2, // enviado
      })
      .select()
      .single();

    if (error) throw error;

    // 3. Atualiza preview da conversa
    await supabase
      .from('conversations')
      .update({
        last_message_preview: content,
        last_message_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    return res.json({ ok: true, message: savedMsg });
  } catch (error: any) {
    console.error('[CHAT] Erro ao enviar mensagem:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
