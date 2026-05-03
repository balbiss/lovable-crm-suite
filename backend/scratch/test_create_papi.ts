import papiClient from '../src/lib/papi';

async function test() {
  const instanceId = 'org_e38d691e';
  try {
    console.log(`Tentando criar instância ${instanceId}...`);
    // Enviando name e id, pois algumas APIs usam um ou outro
    const res = await papiClient.post('/api/instances', { 
        id: instanceId,
        name: instanceId 
    });
    console.log("Sucesso:", res.data);
  } catch (error: any) {
    console.error("Erro ao criar:", error.response?.status, error.response?.data || error.message);
  }
}

test();
