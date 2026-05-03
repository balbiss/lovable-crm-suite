import axios from 'axios';

async function test() {
  const instanceId = 'Atendimentoo';
  console.log(`Testando rota de QR Code no backend para: ${instanceId}`);
  try {
    const res = await axios.get(`http://localhost:3001/api/papi/instances/${instanceId}/qr`);
    console.log('Sucesso:', res.data);
  } catch (error: any) {
    console.error('ERRO 500 detectado:', error.response?.data || error.message);
  }
}

test();
