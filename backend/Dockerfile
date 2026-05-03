FROM node:20-alpine

WORKDIR /app

# Copia os arquivos de configuração
COPY package*.json ./
RUN npm install

# Copia todo o conteúdo
COPY . .

RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
