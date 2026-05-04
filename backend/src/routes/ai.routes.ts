import { Router, Request, Response } from 'express';
import { AIService } from '../services/ai.service';
import { supabase } from '../lib/supabase';
import pdf from 'pdf-parse';
import multer from 'multer';

const router = Router();
const upload = multer();

// Interface para estender o Request do Express com o arquivo do Multer
interface RequestWithFile extends Request {
  file?: Express.Multer.File;
}

// Upload de conhecimento (PDF ou TXT)
router.post('/knowledge/upload', upload.single('file'), async (req: RequestWithFile, res: Response) => {
  try {
    const { orgId, title } = req.body;
    const file = req.file;

    if (!file || !orgId) {
      console.warn('[AI] Upload negado: arquivo ou OrgId faltando', { hasFile: !!file, orgId });
      return res.status(400).json({ error: 'Arquivo ou OrgId faltando' });
    }

    console.log(`[AI] Iniciando processamento de arquivo: ${file.originalname} para Org: ${orgId}`);

    let textContent = '';

    if (file.mimetype === 'application/pdf') {
      try {
        const data = await (pdf as any)(file.buffer);
        textContent = data.text;
        console.log(`[AI] PDF processado. Caracteres extraídos: ${textContent.length}`);
      } catch (pdfErr: any) {
        console.error('[AI] Erro ao processar PDF:', pdfErr.message);
        return res.status(500).json({ error: 'Erro ao processar PDF: ' + pdfErr.message });
      }
    } else {
      textContent = file.buffer.toString('utf-8');
      console.log(`[AI] TXT processado. Caracteres extraídos: ${textContent.length}`);
    }

    if (!textContent || textContent.trim().length === 0) {
      return res.status(400).json({ error: 'O arquivo parece estar vazio ou não pôde ser lido.' });
    }

    console.log('[AI] Inserindo no banco de dados...');
    const { data, error } = await supabase
      .from('company_knowledge')
      .insert({
        org_id: orgId,
        title: title || file.originalname,
        content: textContent,
        file_type: file.mimetype
      })
      .select();

    if (error) {
      console.error('[AI] Erro Supabase:', error);
      throw error;
    }

    console.log('[AI] Upload concluído com sucesso!');
    res.json({ success: true, data });
  } catch (error: any) {
    console.error('[AI] Erro fatal no upload:', error.message);
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
