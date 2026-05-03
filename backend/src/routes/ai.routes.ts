import { Router } from 'express';
import { AIService } from '../services/ai.service';
import { supabase } from '../lib/supabase';
import pdf from 'pdf-parse';
import multer from 'multer';

const router = Router();
const upload = multer();

// Upload de conhecimento (PDF ou TXT)
router.post('/knowledge/upload', upload.single('file'), async (req, res) => {
  try {
    const { orgId, title } = req.body;
    const file = req.file;

    if (!file || !orgId) {
      return res.status(400).json({ error: 'Arquivo ou OrgId faltando' });
    }

    let textContent = '';

    if (file.mimetype === 'application/pdf') {
      const data = await pdf(file.buffer);
      textContent = data.text;
    } else {
      textContent = file.buffer.toString('utf-8');
    }

    const { data, error } = await supabase
      .from('company_knowledge')
      .insert({
        org_id: orgId,
        title: title || file.originalname,
        content: textContent,
        file_type: file.mimetype
      })
      .select();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('[AI] Erro no upload de conhecimento:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Sugerir resposta
router.post('/suggest', async (req, res) => {
  try {
    const { conversationId, orgId } = req.body;

    // 1. Pegar histórico recente
    const { data: messages } = await supabase
      .from('messages')
      .select('content, is_from_me')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!messages || messages.length === 0) {
      return res.status(400).json({ error: 'Sem mensagens para analisar' });
    }

    const lastMessage = messages[0].content;
    const context = messages.reverse().map(m => `${m.is_from_me ? 'Vendedor' : 'Cliente'}: ${m.content}`).join('\n');

    // 2. Pegar conhecimento da empresa
    const { data: knowledgeData } = await supabase
      .from('company_knowledge')
      .select('content')
      .eq('org_id', orgId);

    const knowledge = knowledgeData?.map(k => k.content).join('\n\n');

    // 3. Gerar sugestão
    const suggestion = await AIService.generateSuggestion(context, lastMessage, knowledge);

    res.json({ suggestion });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Resumir conversa
router.post('/summarize', async (req, res) => {
  try {
    const { conversationId } = req.body;

    const { data: messages } = await supabase
      .from('messages')
      .select('content, is_from_me')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(50);

    if (!messages) return res.status(404).json({ error: 'Conversa não encontrada' });

    const summary = await AIService.summarize(messages);

    // Salvar o resumo na conversa para consulta rápida posterior
    await supabase
      .from('conversations')
      .update({ last_summary: summary })
      .eq('id', conversationId);

    res.json({ summary });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
