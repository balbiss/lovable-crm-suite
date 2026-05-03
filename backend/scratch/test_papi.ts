import papiClient from '../src/lib/papi';

async function test() {
  try {
    console.log("Listando instâncias...");
    const res = await papiClient.get('/api/instances');
    console.log("Instâncias:", JSON.stringify(res.data, null, 2));
  } catch (error: any) {
    console.error("Erro ao listar:", error.response?.data || error.message);
  }
}

test();
