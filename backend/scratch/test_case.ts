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
  const ids = ['Atendimentoo', 'atendimentoo'];
  for (const id of ids) {
    console.log(`--- Testando ID: ${id} ---`);
    try {
      const res = await papiClient.get(`/api/instances/${id}`);
      console.log('GET Status:', res.data);
      
      const qrRes = await papiClient.get(`/api/instances/${id}/qr`);
      console.log('GET QR:', qrRes.data);
    } catch (error: any) {
      console.error('ERRO:', error.response?.data || error.message);
    }
  }
}

test();
