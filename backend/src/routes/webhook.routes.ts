import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { cacheGet, cacheSet } from '../lib/redis';
import { enqueueRotation } from '../queues/rotation.queue';
import { broadcastToOrg } from './chat.routes';

const router = Router();

/** Webhook — PAPI envia eventos aqui */
router.post('/:instanceId', async (req: Request, res: Response) => {
  const { instanceId } = req.params;
  const payload = req.body;

  console.log(`[WEBHOOK] Evento recebido para ${instanceId}:`, JSON.stringify(payload, null, 2));

  const type = payload?.type || payload?.event;
  if (!type) {
    return res.status(200).json({ ok: true, message: 'Payload sem tipo identificado' });
  }

  try {
    // Processa eventos de status de mensagem (entregue, lida, etc)
    if (type === 'message_status') {
      const { id: papiMessageId, status } = payload.data;
      console.log(`[WEBHOOK] Status de mensagem ${papiMessageId}: ${status}`);
      
      const { data: updatedMsg } = await supabase
        .from('messages')
        .update({ status: status })
        .eq('papi_message_id', papiMessageId)
        .select()
        .single();
      
      if (updatedMsg) {
        broadcastToOrg(updatedMsg.org_id, 'message_status_update', {
          messageId: updatedMsg.id,
          status: status
        });
      }
      return res.json({ ok: true });
    }

    // Só processa eventos de mensagem recebida
    if (!['messages', 'message'].includes(type)) {
      return res.json({ ok: true });
    }

    const msgData = payload.data;
    const jid: string = msgData?.key?.remoteJid ?? '';
    const fromMe: boolean = msgData?.key?.fromMe ?? false;
    
    // Suporte a mídia (Base64)
    let content: string = '';
    let type: string = 'text';
    let mediaUrl: string | null = null;

    if (msgData?.media?.base64) {
      type = msgData.media.mimetype?.split('/')[0] || 'document';
      content = msgData.message?.imageMessage?.caption 
        || msgData.message?.videoMessage?.caption 
        || `[${type}]`;
      // No futuro, podemos fazer upload do base64 para o Supabase Storage e salvar a URL em mediaUrl
    } else {
      content = msgData?.message?.conversation
        || msgData?.message?.extendedTextMessage?.text
        || '';
    }

    const contactName: string = msgData?.pushName || jid.split('@')[0];
    const papiMsgId: string = msgData?.key?.id ?? '';

    if (!jid || jid.includes('@g.us')) {
      return res.json({ ok: true }); // ignora grupos
    }

    // Descobre a org pelo instanceId — com cache Redis (TTL: 5min)
    const normalizedId = String(instanceId).toLowerCase();
    const cacheKey = `org:by_instance:${normalizedId}`;
    let orgId = await cacheGet<string>(cacheKey);

    if (!orgId) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('papi_instance_id', normalizedId)
        .single();

      if (!org) {
        console.warn(`[WEBHOOK] Nenhuma org encontrada para instância ${instanceId}`);
        return res.json({ ok: true });
      }
      orgId = org.id;
      await cacheSet(cacheKey, orgId, 300); // cache por 5 minutos
    }

    // Upsert da conversa
    const { data: conv } = await supabase
      .from('conversations')
      .upsert(
        {
          org_id: orgId,
          jid,
          contact_name: contactName,
          contact_phone: jid.replace('@s.whatsapp.net', ''),
          last_message_preview: content,
          last_message_at: new Date().toISOString(),
          unread_count: fromMe ? 0 : 1,
        },
        { onConflict: 'org_id,jid', ignoreDuplicates: false }
      )
      .select()
      .single();

    if (!conv) return res.json({ ok: true });

    // Incrementa unread se não for do agente
    if (!fromMe) {
      const { error: rpcError } = await supabase.rpc('increment_unread', { conv_id: conv.id });
      if (rpcError) {
        // Fallback: atualiza diretamente
        await supabase.from('conversations')
          .update({ unread_count: (conv.unread_count ?? 0) + 1 })
          .eq('id', conv.id);
      }
    }

    // Salva a mensagem
    const { data: savedMsg } = await supabase
      .from('messages')
      .insert({
        conversation_id: conv.id,
        papi_message_id: papiMsgId,
        org_id: orgId,
        content,
        is_from_me: fromMe,
        type: type,
        status: fromMe ? 2 : 1,
      })
      .select()
      .single();

    // Broadcast em tempo real via SSE
    if (savedMsg && orgId) {
      broadcastToOrg(orgId, 'new_message', {
        message: savedMsg,
        conversation: {
          ...conv,
          last_message_preview: content,
          last_message_at: new Date().toISOString(),
        },
      });

      // Se for mensagem nova de contato (não do agente), enfileira rodízio
      if (!fromMe && !conv.assigned_to) {
        enqueueRotation(orgId, conv.id, contactName).catch((err: Error) =>
          console.warn('[WEBHOOK] Rodízio não enfileirado:', err.message)
        );
      }
    }

    return res.json({ ok: true });
  } catch (error: any) {
    console.error('[WEBHOOK] Erro ao processar:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
