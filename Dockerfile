# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Diagnóstico: Lista as pastas para sabermos onde o build foi parar
RUN ls -d .output/public 2>/dev/null || ls -d dist 2>/dev/null || ls -F

# Move o que for encontrado para uma pasta temporária limpa
RUN mkdir /app/final_build && \
    (cp -r .output/public/* /app/final_build/ 2>/dev/null || \
     cp -r dist/* /app/final_build/ 2>/dev/null || \
     echo "<h1>Erro: Pasta de build nao encontrada</h1>" > /app/final_build/index.html)

# Stage 2: Serve
FROM nginx:alpine

# Remove arquivos padrão do nginx
RUN rm -rf /usr/share/nginx/html/*

# Copia o build e a configuração do nginx
COPY --from=build /app/final_build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
