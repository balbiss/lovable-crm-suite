# Stage 1: Build
FROM oven/bun:1 AS build

WORKDIR /app

# Instala dependências
COPY package*.json bun.lockb ./
RUN bun install

# Copia o código e faz o build
COPY . .
RUN bun run build

# Stage 2: Runtime (Nginx + Bun)
FROM oven/bun:1-slim

# Instala o Nginx
RUN apt-get update && apt-get install -y nginx && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copia o build do estágio anterior
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./

# Configuração do Nginx para servir assets e fazer proxy para o Bun
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /app/dist/client; \
    index index.html; \
    location /assets/ { \
        alias /app/dist/client/assets/; \
        expires 1y; \
        add_header Cache-Control "public"; \
    } \
    location / { \
        proxy_pass http://localhost:3000; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
    } \
}' > /etc/nginx/sites-available/default

EXPOSE 80

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Inicia o Nginx e o Bun juntos
CMD ["sh", "-c", "nginx && bun run dist/server/index.js"]
