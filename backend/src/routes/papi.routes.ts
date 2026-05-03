import { Router } from 'express';
import { PapiService } from '../services/papi.service';
import { supabase } from '../lib/supabase';
import { cacheGet, cacheSet, cacheDel } from '../lib/redis';

// URL pública do CRM onde a PAPI vai enviar os eventos
// Em produção: defina WEBHOOK_PUBLIC_URL no .env com a URL do seu servidor
const CRM_WEBHOOK_URL = process.env.WEBHOOK_PUBLIC_URL
  ? `${process.env.WEBHOOK_PUBLIC_URL}/api/webhook`
  : null;

const router = Router();

// Listar instâncias (para debug ou admin)
router.get('/instances', async (req, res) => {
  try {
    const data = await PapiService.listInstances();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Buscar uma instância específica — com cache Redis (10s)
router.get('/instances/:id', async (req, res) => {
  const { id } = req.params;
  const key = `papi:instance:${id}`;

  // Verifica cache primeiro
  const cached = await cacheGet(key);
  if (cached) return res.json(cached);

  console.log(`[BACKEND] Buscando detalhes da instância: ${id}`);
  try {
    const data = await PapiService.getInstance(id);
    await cacheSet(key, data, 10); // cache por 10 segundos
    return res.json(data);
  } catch (error: any) {
    // Se a instância não existe na PAPI, tenta recriar (Auto-healing)
    if (error.response?.status === 404) {
      console.warn(`[BACKEND] Instância ${id} não encontrada na PAPI ao buscar detalhes. Tentando recriar...`);
      try {
        const newData = await PapiService.createInstance(id);
        await cacheSet(key, newData, 10);
        return res.json(newData);
      } catch (createError: any) {
        console.error(`[BACKEND] Falha ao recriar instância ${id} em segundo plano:`, createError.message);
        return res.status(404).json({ error: "Instância inexistente na PAPI." });
      }
    }

    console.error(`[BACKEND] Erro ao buscar instância ${id}:`, error.message);
    return res.status(500).json({ error: error.message });
  }
});

// Buscar QR Code de uma instância específica
router.get('/instances/:id/qr', async (req, res) => {
  const { id } = req.params;
  console.log(`[BACKEND] Solicitando QR Code para instância: ${id}`);
  try {
    const data = await PapiService.getQrCode(id);
    res.json(data);
  } catch (error: any) {
    // Se a instância não existe na PAPI, tenta recriar (Auto-healing)
    if (error.response?.status === 404) {
      console.warn(`[BACKEND] Instância ${id} não encontrada na PAPI. Tentando recriar automaticamente...`);
      try {
        await PapiService.createInstance(id);
        // Tenta buscar o QR novamente após criar
        const data = await PapiService.getQrCode(id);
        return res.json(data);
      } catch (createError: any) {
        console.error(`[BACKEND] Falha ao recriar instância ${id}:`, createError.message);
        return res.status(404).json({ error: "Instância inexistente na PAPI e não pôde ser recriada." });
      }
    }

    console.error(`[BACKEND] Erro ao buscar QR na PAPI:`, error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// Sincronizar Webhook manualmente
router.post('/instances/:id/webhook', async (req, res) => {
  const { id } = req.params;
  
  if (!CRM_WEBHOOK_URL) {
    return res.status(400).json({ 
      error: "WEBHOOK_PUBLIC_URL não definida no .env. Configure o domínio do seu servidor para receber mensagens." 
    });
  }

  try {
    const webhookUrl = `${CRM_WEBHOOK_URL}/${id}`;
    const data = await PapiService.configureWebhook(id, webhookUrl);
    console.log(`[BACKEND] Webhook sincronizado manualmente para ${id}: ${webhookUrl}`);
    res.json(data);
  } catch (error: any) {
    console.error(`[BACKEND] Erro ao sincronizar webhook para ${id}:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Buscar configurações da instância
router.get('/instances/:id/settings', async (req, res) => {
  try {
    const data = await PapiService.getSettings(req.params.id);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar configurações da instância
router.post('/instances/:id/settings', async (req, res) => {
  try {
    const data = await PapiService.updateSettings(req.params.id, req.body);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Criar nova instância e vincular à organização
router.post('/instances', async (req, res) => {
  try {
    const { instanceId, orgId } = req.body;
    let papiData;

    try {
      // 1. Tentar criar na PAPI
      papiData = await PapiService.createInstance(instanceId);
      console.log(`Instância ${instanceId} criada com sucesso.`);
    } catch (error: any) {
      // Se o erro for que já existe (400 ou 500 dependendo da API), vamos tentar apenas listar
      console.log(`Instância ${instanceId} já pode existir ou erro na criação. Verificando...`);
      const instances = await PapiService.listInstances();
      const existing = instances.find((i: any) => i.id === instanceId);
      
      if (existing) {
        papiData = existing;
        console.log(`Instância ${instanceId} encontrada, prosseguindo com o vínculo.`);
      } else {
        throw error; // Se não existe e deu erro, repassa o erro
      }
    }

    // 2. Vincular no Supabase (Sempre garante o vínculo)
    const { error: dbError } = await supabase
      .from('organizations')
      .update({ papi_instance_id: instanceId })
      .eq('id', orgId);

    if (dbError) throw dbError;

    // 3. Configurar webhook automático na PAPI (se URL pública estiver definida)
    let webhookResult = null;
    if (CRM_WEBHOOK_URL) {
      try {
        const webhookUrl = `${CRM_WEBHOOK_URL}/${instanceId}`;
        webhookResult = await PapiService.configureWebhook(instanceId, webhookUrl);
        console.log(`[BACKEND] Webhook configurado automaticamente: ${webhookUrl}`);
      } catch (webhookErr: any) {
        console.warn(`[BACKEND] Não foi possível configurar webhook automático:`, webhookErr.message);
      }
    } else {
      console.warn(`[BACKEND] WEBHOOK_PUBLIC_URL não definida no .env — configure manualmente em Configurações > WhatsApp.`);
    }

    res.json({ success: true, data: papiData, webhook: webhookResult });
  } catch (error: any) {
    console.error("Erro final na rota de instâncias:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Deletar instância e desvincular da organização
router.delete('/instances/:id', async (req, res) => {
  try {
    const instanceId = req.params.id;
    const { orgId } = req.query;

    console.log(`[BACKEND] Solicitando exclusão da instância ${instanceId} na PAPI...`);
    
    // 1. Tentar deletar na PAPI
    try {
      await PapiService.deleteInstance(instanceId);
      console.log(`[BACKEND] Instância ${instanceId} deletada na PAPI com sucesso.`);
    } catch (papiError) {
      console.warn(`[BACKEND] Não foi possível deletar na PAPI, prosseguindo com limpeza.`);
    }
    
    // 2. Desvincular no Supabase
    const { error: dbError } = await supabase
      .from('organizations')
      .update({ papi_instance_id: null })
      .eq('id', orgId as string);

    if (dbError) throw dbError;

    // 3. Limpar cache Redis da instância e da org
    await cacheDel(`papi:instance:${instanceId}`);
    await cacheDel(`org:by_instance:${instanceId}`);

    res.json({ success: true });
  } catch (error: any) {
    console.error(`[BACKEND] Erro ao deletar instância:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Ler webhook atual de uma instância
router.get('/instances/:id/webhook', async (req, res) => {
  try {
    const data = await PapiService.getWebhook(req.params.id);
    return res.json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Configurar (ou reconfigurar) webhook de uma instância
router.post('/instances/:id/webhook', async (req, res) => {
  const { id } = req.params;
  const { webhookUrl } = req.body;

  // Se o usuário não passou URL, usa a padrão do CRM
  const finalUrl = webhookUrl
    ? `${webhookUrl}/api/webhook/${id}`
    : CRM_WEBHOOK_URL
      ? `${CRM_WEBHOOK_URL}/${id}`
      : null;

  if (!finalUrl) {
    return res.status(400).json({
      error: 'Nenhuma URL de webhook configurada. Defina WEBHOOK_PUBLIC_URL no .env do backend.',
    });
  }

  try {
    const data = await PapiService.configureWebhook(id, finalUrl);
    console.log(`[BACKEND] Webhook reconfigurado para ${id}: ${finalUrl}`);
    return res.json({ success: true, webhook: data, url: finalUrl });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Enviar Imagem
router.post('/instances/:id/send-image', async (req, res) => {
  try {
    const { id } = req.params;
    const { jid, url, base64, caption } = req.body;
    const data = await PapiService.sendImage(id, jid, { url, base64, caption });
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Enviar Vídeo
router.post('/instances/:id/send-video', async (req, res) => {
  try {
    const { id } = req.params;
    const { jid, url, base64, caption } = req.body;
    const data = await PapiService.sendVideo(id, jid, { url, base64, caption });
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Enviar Áudio
router.post('/instances/:id/send-audio', async (req, res) => {
  try {
    const { id } = req.params;
    const { jid, url, base64, ptt } = req.body;
    const data = await PapiService.sendAudio(id, jid, { url, base64, ptt });
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Enviar Documento
router.post('/instances/:id/send-document', async (req, res) => {
  try {
    const { id } = req.params;
    const { jid, url, filename, mimetype } = req.body;
    const data = await PapiService.sendDocument(id, jid, { url, filename, mimetype });
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
