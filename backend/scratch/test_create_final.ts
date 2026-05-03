import axios from 'axios';

async function testCreate() {
  try {
    const res = await axios.post('http://localhost:3001/api/papi/instances', {
      instanceId: 'crm',
      orgId: '76101c70-7467-4638-8924-a3f12ccda2cc' // Exemplo
    });
    console.log('Sucesso na criação:', res.data);
  } catch (error: any) {
    console.error('Erro na criação:', error.response?.data || error.message);
  }
}

testCreate();
