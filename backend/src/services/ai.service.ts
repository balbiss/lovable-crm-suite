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
  }

  /**
   * Gera uma resposta automática baseada no prompt da organização e histórico
   */
  static async generateResponse(systemPrompt: string, history: string, lastMessage: string) {
    try {
      const response = await openai.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: systemPrompt || 'Você é um assistente virtual. Seja cordial e prestativo.'
          },
          {
            role: 'user',
            content: `Histórico da conversa:\n${history}\n\nCliente disse agora: ${lastMessage}`
          }
        ],
        temperature: 0.7,
      });

      return response.choices[0].message.content;
    } catch (error: any) {
      console.error('[AI] Erro ao gerar resposta:', error.message);
      return null;
    }
  }
}
