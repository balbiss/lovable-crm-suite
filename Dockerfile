# Stage 1: Build
FROM node:22-alpine AS build

WORKDIR /app

# Instala dependências
COPY package*.json ./
RUN npm install

# Copia o código e faz o build
COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:22-alpine

WORKDIR /app

# Copia TUDO do build
COPY --from=build /app ./

EXPOSE 3000

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# DIAGNÓSTICO: Lista arquivos e tenta rodar, mas não morre imediatamente
CMD ["sh", "-c", "echo '--- CONTEUDO DA PASTA APP ---'; ls -la; echo '--- PROCURANDO BUILD ---'; ls -R .output 2>/dev/null || ls -R dist 2>/dev/null || echo 'Nao achei .output nem dist'; if [ -f .output/server/index.mjs ]; then node .output/server/index.mjs; elif [ -f .output/server/index.js ]; then node .output/server/index.js; elif [ -f dist/server/index.js ]; then node dist/server/index.js; else echo 'ERRO FATAL: Servidor nao encontrado'; fi; sleep 60"]
