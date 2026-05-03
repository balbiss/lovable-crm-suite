import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: '*' }));
app.use(express.json());

// Rotas
import papiRoutes from './routes/papi.routes';
import chatRoutes from './routes/chat.routes';
import webhookRoutes from './routes/webhook.routes';

// Inicializa o Worker de rodízio (Redis/BullMQ) ao subir o servidor
import './queues/rotation.queue';

// Health check
app.get('/health', (_req, res) => res.send('Backend is running!'));

// API PAPI — instâncias, QR, configurações (com cache Redis)
app.use('/api/papi', papiRoutes);

// Chat ao vivo — conversas, mensagens, envio
app.use('/api/chat', chatRoutes);

// Webhook PAPI + SSE — recebe eventos PAPI e broadcasta em tempo real
app.use('/api/webhook', webhookRoutes);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n╔══════════════════════════════════════════════╗`);
  console.log(`║  InoovaWeb CRM Backend — Porta ${PORT}         ║`);
  console.log(`╠══════════════════════════════════════════════╣`);
  console.log(`║  🔌 PAPI API    → /api/papi                 ║`);
  console.log(`║  💬 Chat API    → /api/chat                 ║`);
  console.log(`║  🔗 Webhook     → /api/webhook/:instanceId  ║`);
  console.log(`║  📡 SSE         → /api/chat/sse/:orgId      ║`);  
  console.log(`║  🔴 Redis       → ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}         ║`);
  console.log(`╚══════════════════════════════════════════════╝\n`);
});
