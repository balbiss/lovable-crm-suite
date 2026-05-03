import papiClient from '../lib/papi';

export class PapiService {
  /**
   * Envia uma mensagem de texto via PAPI
   */
  static async sendText(instanceId: string, jid: string, text: string) {
    const id = instanceId.toLowerCase();
    try {
      const response = await papiClient.post(`/api/instances/${id}/send-text`, {
        jid,
        text
      });
      return response.data;
    } catch (error: any) {
      console.error(`Error sending text to ${jid}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Obtém o QR Code de uma instância
   */
  static async getQrCode(instanceId: string) {
    const id = instanceId.toLowerCase();
    try {
      const response = await papiClient.get(`/api/instances/${id}/qr`);
      return response.data;
    } catch (error: any) {
      console.error(`Error getting QR for ${id}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Lista todas as instâncias e seus status
   */
  static async listInstances() {
    try {
      const response = await papiClient.get('/api/instances');
      return response.data;
    } catch (error: any) {
      console.error('Error listing instances:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Obtém uma instância específica por ID
   */
  static async getInstance(instanceId: string) {
    const id = instanceId.toLowerCase();
    try {
      const response = await papiClient.get(`/api/instances/${id}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error getting instance ${id}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Cria uma nova instância
   */
  static async createInstance(instanceId: string) {
    const id = instanceId.toLowerCase();
    try {
      const response = await papiClient.post('/api/instances', {
        id,
        name: id
      });
      return response.data;
    } catch (error: any) {
      console.error(`Error creating instance ${id}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Obtém as configurações da instância
   */
  static async getSettings(instanceId: string) {
    const id = instanceId.toLowerCase();
    try {
      const response = await papiClient.get(`/api/instances/${id}/settings`);
      return response.data;
    } catch (error: any) {
      console.error(`Error getting settings for ${id}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Atualiza as configurações da instância
   */
  static async updateSettings(instanceId: string, settings: any) {
    const id = instanceId.toLowerCase();
    try {
      const response = await papiClient.post(`/api/instances/${id}/settings`, settings);
      return response.data;
    } catch (error: any) {
      console.error(`Error updating settings for ${id}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Configura o webhook de uma instância na PAPI
   */
  static async configureWebhook(instanceId: string, webhookUrl: string, events = ['messages', 'message_status', 'message_reaction', 'presence', 'contacts', 'history_sync']) {
    const id = instanceId.toLowerCase();
    try {
      const response = await papiClient.post(`/api/instances/${id}/webhook`, {
        url: webhookUrl,
        enabled: true,
        events,
      });
      return response.data;
    } catch (error: any) {
      console.error(`Error configuring webhook for ${id}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Obtém a configuração atual do webhook de uma instância
   */
  static async getWebhook(instanceId: string) {
    const id = instanceId.toLowerCase();
    try {
      const response = await papiClient.get(`/api/instances/${id}/webhook`);
      return response.data;
    } catch (error: any) {
      console.error(`Error getting webhook for ${id}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Deleta uma instância na PAPI
   */
  static async deleteInstance(instanceId: string) {
    const id = instanceId.toLowerCase();
    try {
      const response = await papiClient.delete(`/api/instances/${id}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error deleting instance ${id}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Envia uma imagem
   */
  static async sendImage(instanceId: string, jid: string, data: { url?: string; base64?: string; caption?: string }) {
    const id = instanceId.toLowerCase();
    try {
      const response = await papiClient.post(`/api/instances/${id}/send-image`, {
        jid,
        ...data
      });
      return response.data;
    } catch (error: any) {
      console.error(`Error sending image to ${jid}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Envia um vídeo
   */
  static async sendVideo(instanceId: string, jid: string, data: { url?: string; base64?: string; caption?: string }) {
    const id = instanceId.toLowerCase();
    try {
      const response = await papiClient.post(`/api/instances/${id}/send-video`, {
        jid,
        ...data
      });
      return response.data;
    } catch (error: any) {
      console.error(`Error sending video to ${jid}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Envia um áudio
   */
  static async sendAudio(instanceId: string, jid: string, data: { url?: string; base64?: string; ptt?: boolean }) {
    const id = instanceId.toLowerCase();
    try {
      const response = await papiClient.post(`/api/instances/${id}/send-audio`, {
        jid,
        ...data
      });
      return response.data;
    } catch (error: any) {
      console.error(`Error sending audio to ${jid}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Envia um documento (PDF, DOC, etc)
   */
  static async sendDocument(instanceId: string, jid: string, data: { url?: string; base64?: string; filename?: string; mimetype?: string }) {
    const id = instanceId.toLowerCase();
    try {
      const response = await papiClient.post(`/api/instances/${id}/send-document`, {
        jid,
        ...data
      });
      return response.data;
    } catch (error: any) {
      console.error('Error sending document:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Envia uma localização
   */
  static async sendLocation(instanceId: string, jid: string, data: { latitude: number; longitude: number; name?: string; address?: string }) {
    const id = instanceId.toLowerCase();
    try {
      const response = await papiClient.post(`/api/instances/${id}/send-location`, {
        jid,
        ...data
      });
      return response.data;
    } catch (error: any) {
      console.error(`Error sending location to ${jid}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Envia botões interativos
   */
  static async sendButtons(instanceId: string, jid: string, data: { text: string; footer?: string; buttons: any[] }) {
    const id = instanceId.toLowerCase();
    try {
      const response = await papiClient.post(`/api/instances/${id}/send-buttons`, {
        jid,
        ...data
      });
      return response.data;
    } catch (error: any) {
      console.error(`Error sending buttons to ${jid}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Envia uma lista interativa
   */
  static async sendList(instanceId: string, jid: string, data: { title?: string; body: string; footer?: string; buttonText: string; sections: any[] }) {
    const id = instanceId.toLowerCase();
    try {
      const response = await papiClient.post(`/api/instances/${id}/send-list`, {
        jid,
        ...data
      });
      return response.data;
    } catch (error: any) {
      console.error(`Error sending list to ${jid}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Desconecta a instância (logout)
   */
  static async logout(instanceId: string) {
    const id = instanceId.toLowerCase();
    try {
      const response = await papiClient.post(`/api/instances/${id}/logout`);
      return response.data;
    } catch (error: any) {
      console.error(`Error logging out instance ${id}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Verifica se um número existe no WhatsApp
   */
  static async checkNumber(instanceId: string, phone: string) {
    const id = instanceId.toLowerCase();
    try {
      const response = await papiClient.get(`/api/instances/${id}/check-number/${phone}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error checking number ${phone} on ${id}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Obtém a foto de perfil de um contato ou grupo
   */
  static async getProfilePicture(instanceId: string, jid: string) {
    const id = instanceId.toLowerCase();
    try {
      const response = await papiClient.get(`/api/instances/${id}/profile-picture/${jid}`);
      return response.data?.url || null;
    } catch (error: any) {
      console.error(`Error getting profile picture for ${jid}:`, error.response?.data || error.message);
      return null;
    }
  }
}
