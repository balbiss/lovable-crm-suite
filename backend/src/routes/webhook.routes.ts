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

    // Só processa eventos de mensagem (messages.upsert, messages.update, etc)
    if (!type.startsWith('messages') && type !== 'message') {
      return res.json({ ok: true });
    }

    const msgData = payload.data?.message;
    if (!msgData) return res.json({ ok: true });

    const jid: string = payload.data?.key?.remoteJid || '';
    const fromMe: boolean = payload.data?.key?.fromMe || false;
    const papiMsgId: string = payload.data?.key?.id || '';
    
    // Suporte a conteúdo e mídia
    let content: string = '';
    let messageType: string = 'text';
    let mediaUrl: string | null = null;

    // Extrai o conteúdo (texto ou legenda)
    const rawMessage = payload.data?.message;
    if (rawMessage) {
      if (rawMessage.conversation) {
        content = rawMessage.conversation;
        messageType = 'text';
      } else if (rawMessage.imageMessage) {
        content = rawMessage.imageMessage.caption || '';
        messageType = 'image';
      } else if (rawMessage.videoMessage) {
        content = rawMessage.videoMessage.caption || '';
        messageType = 'video';
      } else if (rawMessage.audioMessage) {
        messageType = 'audio';
      } else if (rawMessage.documentMessage) {
        content = rawMessage.documentMessage.title || '';
        messageType = 'document';
      } else if (rawMessage.extendedTextMessage) {
        content = rawMessage.extendedTextMessage.text || '';
      }
    }

    // Se houver mídia em base64, gera a Data URI
    if (payload.data?.media?.base64) {
      const mime = payload.data.media.mimetype || 'image/jpeg';
      mediaUrl = `data:${mime};base64,${payload.data.media.base64}`;
      
      // Se for mídia e não tiver conteúdo de texto, coloca um placeholder
      if (!content && messageType !== 'text') {
        content = `[Mídia: ${messageType}]`;
      }
    }

    const contactName: string = payload.data?.pushName || jid.split('@')[0];

    if (!jid || jid.includes('@g.us')) {
      return res.json({ ok: true }); // ignora grupos
    }

    // Descobre a org pelo instanceId — com cache Redis (TTL: 5min)
    const normalizedId = String(instanceId).toLowerCase();
    const cacheKey = `org:by_instance:${normalizedId}`;
    let orgId = await cacheGet<string>(cacheKey);

    if (!orgId) {
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .eq('papi_instance_id', normalizedId)
        .single();

      if (orgError) {
        console.error('[WEBHOOK] Erro ao buscar org por instância:', orgError.message);
        return res.json({ ok: true });
      }

      if (!org) {
        console.warn(`[WEBHOOK] Nenhuma org encontrada para instância ${instanceId}`);
        return res.json({ ok: true });
      }
      orgId = org.id;
      await cacheSet(cacheKey, orgId, 300); // cache por 5 minutos
    }

    // Upsert da conversa
    const { data: conv, error: convError } = await supabase
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

    if (convError) {
      console.error('[WEBHOOK] Erro ao dar upsert na conversa:', convError.message);
      return res.json({ ok: true });
    }

    if (!conv) return res.json({ ok: true });

    // Incrementa unread se não for do agente
    if (!fromMe) {
      const { error: rpcError } = await supabase.rpc('increment_unread', { conv_id: conv.id });
      if (rpcError) {
        console.warn('[WEBHOOK] Erro no RPC increment_unread:', rpcError.message);
        // Fallback: atualiza diretamente
        await supabase.from('conversations')
          .update({ unread_count: (conv.unread_count ?? 0) + 1 })
          .eq('id', conv.id);
      }
    }

    // Salva a mensagem
    const { data: savedMsg, error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conv.id,
        papi_message_id: papiMsgId,
        org_id: orgId,
        content,
        media_url: mediaUrl,
        is_from_me: fromMe,
        type: messageType,
        status: fromMe ? 2 : 1,
      })
      .select()
      .single();

    if (msgError) {
      console.error('[WEBHOOK] Erro ao salvar mensagem no Supabase:', msgError.message);
      return res.json({ ok: true });
    }

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
