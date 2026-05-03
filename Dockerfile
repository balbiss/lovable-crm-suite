# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Verifica onde o build foi gerado (dist ou .output/public) e move para uma pasta padrão
RUN if [ -d ".output/public" ]; then cp -r .output/public dist_temp; \
    elif [ -d "dist" ]; then cp -r dist dist_temp; \
    else mkdir dist_temp && echo "Build output not found" > dist_temp/index.html; fi

# Stage 2: Serve
FROM nginx:alpine

# Remove arquivos padrão do nginx
RUN rm -rf /usr/share/nginx/html/*

# Copia o build e a configuração do nginx
COPY --from=build /app/dist_temp /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
