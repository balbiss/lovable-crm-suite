import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0'),
  maxRetriesPerRequest: null,
  lazyConnect: true,
  retryStrategy: (times: number) => {
    if (times > 5) {
      console.error('[Redis] Não foi possível conectar após 5 tentativas. Desativando Redis.');
      return null; // para de tentar
    }
    return Math.min(times * 500, 3000);
  }
};

// Conexão principal — usada pelo BullMQ
export const redisConnection = new IORedis(redisConfig);

// Conexão separada para cache/estado (BullMQ exige conexão exclusiva)
export const redisCache = new IORedis(redisConfig);

redisConnection.on('connect', () => console.log('[Redis] Conexão principal estabelecida.'));
redisConnection.on('error', (err) => console.warn('[Redis] Erro na conexão:', err.message));

redisCache.on('connect', () => console.log('[Redis] Conexão de cache estabelecida.'));
redisCache.on('error', (err) => console.warn('[Redis] Erro no cache:', err.message));

// Flag global de disponibilidade
let _redisAvailable = false;
redisConnection.on('connect', () => { _redisAvailable = true; });
redisConnection.on('close', () => { _redisAvailable = false; });
export const isRedisAvailable = () => _redisAvailable;

// ─── Helpers de Cache ──────────────────────────────────────────────

const DEFAULT_TTL = 60; // segundos

/** Salva um valor no cache Redis com TTL */
export async function cacheSet(key: string, value: any, ttlSeconds = DEFAULT_TTL): Promise<void> {
  if (!_redisAvailable) return; // Redis offline: skip sem erro
  try {
    await redisCache.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (err) {
    console.warn(`[Redis] Falha ao salvar cache '${key}':`, err);
  }
}

/** Lê um valor do cache Redis */
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!_redisAvailable) return null; // Redis offline: retorna null (fallback para DB)
  try {
    const raw = await redisCache.get(key);
    return raw ? JSON.parse(raw) as T : null;
  } catch (err) {
    console.warn(`[Redis] Falha ao ler cache '${key}':`, err);
    return null;
  }
}

/** Remove uma chave do cache Redis */
export async function cacheDel(key: string): Promise<void> {
  if (!_redisAvailable) return;
  try {
    await redisCache.del(key);
  } catch (err) {
    console.warn(`[Redis] Falha ao deletar cache '${key}':`, err);
  }
}

// ─── Rodízio Round-Robin ────────────────────────────────────────────

/** Retorna o próximo índice round-robin para uma org */
export async function getNextRotationIndex(orgId: string, total: number): Promise<number> {
  const key = `rotation:last_index:${orgId}`;
  try {
    const lastStr = await redisCache.get(key);
    const next = lastStr !== null ? (parseInt(lastStr) + 1) % total : 0;
    await redisCache.set(key, next.toString());
    return next;
  } catch {
    return 0; // fallback se Redis falhar
  }
}

export default redisCache;
