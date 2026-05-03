# Stage 1: Build
FROM oven/bun:1 AS build

WORKDIR /app

# Instala dependências
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

# ARRANJO DE PASTAS: O Vinxi espera que os assets fiquem em uma pasta acessível
# Vamos garantir que dist/client seja linkado como a pasta de arquivos estáticos
RUN mkdir -p .output && \
    ln -s ../dist/server .output/server && \
    ln -s ../dist/client .output/public

EXPOSE 3000

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Rodamos a partir do link que criamos para manter a compatibilidade
CMD ["bun", "run", ".output/server/index.js"]
