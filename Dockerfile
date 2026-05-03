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

# Em sistemas SSR, às vezes as dependências de build são necessárias no runtime
COPY --from=build /app ./

EXPOSE 3000

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Usa o comando oficial do TanStack Start/Vinxi
CMD ["npx", "vinxi", "start"]
