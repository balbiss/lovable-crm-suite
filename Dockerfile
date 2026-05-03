# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

# Copia apenas o necessário para rodar o servidor
COPY --from=build /app/package*.json ./
RUN npm install --production

# Copia o build gerado (o TanStack Start gera na pasta .output)
COPY --from=build /app/.output ./.output

EXPOSE 3000

# Comando para iniciar o servidor do TanStack Start
CMD ["node", ".output/server/index.js"]
