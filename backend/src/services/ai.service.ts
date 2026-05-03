import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = 'gpt-4o-mini';

export class AIService {
  /**
   * Gera uma sugestão de resposta baseada no histórico e conhecimento da empresa
   */
  static async generateSuggestion(context: string, lastMessage: string, knowledge?: string) {
    try {
      const response = await openai.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: `Você é um assistente de vendas profissional. 
            Use o seguinte conhecimento da empresa para responder: 
            ${knowledge || 'Use bom senso profissional.'}
            
            Responda de forma curta, natural e amigável para WhatsApp. 
            Não use emojis em excesso. 
            Apenas dê a sugestão de texto, sem comentários extras.`
          },
          {
            role: 'user',
            content: `Histórico recente:\n${context}\n\nÚltima mensagem do cliente: ${lastMessage}`
          }
        ],
        temperature: 0.7,
      });

      return response.choices[0].message.content;
    } catch (error: any) {
      console.error('[AI] Erro ao gerar sugestão:', error.message);
      throw error;
    }
  }

  /**
   * Gera um resumo da conversa
   */
  static async summarize(messages: any[]) {
    try {
      const text = messages.map(m => `${m.is_from_me ? 'Vendedor' : 'Cliente'}: ${m.content}`).join('\n');
      
      const response = await openai.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: 'Resuma os pontos principais desta conversa em 3 tópicos curtos.'
          },
          {
            role: 'user',
            content: text
          }
        ],
      });

      return response.choices[0].message.content;
    } catch (error: any) {
      console.error('[AI] Erro ao resumir:', error.message);
      throw error;
    }
  }

  /**
   * Transcreve áudio usando Whisper
   */
  static async transcribe(audioBuffer: Buffer) {
    try {
      // Nota: Whisper precisa de um arquivo com nome/extensão para funcionar via API
      const transcription = await openai.audio.transcriptions.create({
        file: await OpenAI.toFile(audioBuffer, 'audio.ogg'),
        model: 'whisper-1',
      });

      return transcription.text;
    } catch (error: any) {
      console.error('[AI] Erro ao transcrever áudio:', error.message);
      throw error;
    }
  /**
   * Gera uma mensagem de follow-up contextual
   */
  static async generateFollowUp(history: string) {
    try {
      const response = await openai.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: `Você é um assistente de vendas. O cliente parou de responder. 
            Analise o histórico e crie uma mensagem curta (máximo 2 frases) para retomar o contato. 
            A mensagem deve ser específica sobre o que foi conversado por último. 
            Não seja invasivo, seja prestativo. Use um tom amigável de WhatsApp.`
          },
          {
            role: 'user',
            content: `Histórico da conversa:\n${history}`
          }
        ],
        temperature: 0.8,
      });

      return response.choices[0].message.content;
    } catch (error: any) {
      console.error('[AI] Erro ao gerar follow-up:', error.message);
      return null;
    }
  }
}
