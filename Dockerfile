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

# Garante que a pasta de saída seja sempre .output (mesmo que venha como dist)
RUN if [ -d "dist" ] && [ ! -d ".output" ]; then ln -s dist .output; fi

EXPOSE 3000

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Comando flexível que tenta mjs e depois js
CMD ["sh", "-c", "if [ -f .output/server/index.mjs ]; then node .output/server/index.mjs; elif [ -f .output/server/index.js ]; then node .output/server/index.js; else echo 'ERRO: Servidor nao encontrado em .output/server/'; ls -R .output; exit 1; fi"]
