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

# Copia TUDO do build (necessário para o Vinxi/SSR)
COPY --from=build /app ./

EXPOSE 3000

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Tenta rodar o index.mjs, se não existir tenta o index.js
CMD ["sh", "-c", "if [ -f .output/server/index.mjs ]; then node .output/server/index.mjs; else node .output/server/index.js; fi"]
