# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Garante que temos uma pasta unificada para o runtime, seja .output ou dist
RUN if [ -d ".output" ]; then mv .output build_output; \
    elif [ -d "dist" ]; then mv dist build_output; \
    else mkdir build_output && echo "Nenhuma pasta de build encontrada" > build_output/error.txt; fi

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

# Copia apenas o necessário para rodar
COPY --from=build /app/package*.json ./
RUN npm install --production

# Copia o build unificado
COPY --from=build /app/build_output ./build_output

EXPOSE 3000

# Tenta rodar o server de onde ele estiver
CMD ["node", "build_output/server/index.js"]
