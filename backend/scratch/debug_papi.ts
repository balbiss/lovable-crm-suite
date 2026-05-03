import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const papiClient = axios.create({
  baseURL: process.env.PAPI_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.PAPI_API_KEY
  }
});

async function test() {
  const instanceId = 'Atendimentoo';
  console.log(`Testando instância: ${instanceId}`);
  try {
    const res = await papiClient.get(`/api/instances/${instanceId}`);
    console.log('Status da Instância:', res.data);
    
    const qrRes = await papiClient.get(`/api/instances/${instanceId}/qr`);
    console.log('Resultado QR:', qrRes.data);
  } catch (error: any) {
    console.error('ERRO:', error.response?.data || error.message);
  }
}

test();
