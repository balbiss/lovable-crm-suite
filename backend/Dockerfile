FROM node:20-alpine

WORKDIR /app

# Copia os arquivos de configuração de dentro da pasta backend
COPY backend/package*.json ./
RUN npm install

# Copia todo o conteúdo da pasta backend
COPY backend/ .

RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
