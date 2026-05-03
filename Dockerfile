# Stage 1: Build
FROM oven/bun:1 AS build

WORKDIR /app

# Instala dependências usando Bun (muito mais rápido)
COPY package*.json bun.lockb ./
RUN bun install

# Copia o código e faz o build
COPY . .
RUN bun run build

# Stage 2: Runtime
FROM oven/bun:1-slim

WORKDIR /app

# Copia TUDO do build
COPY --from=build /app ./

EXPOSE 3000

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# O TanStack Start compilado para Cloudflare/Node roda assim com Bun:
CMD ["bun", "run", "dist/server/index.js"]
