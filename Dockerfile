# Dockerfile para o novo Microsserviço de Storage

FROM node:20-alpine

WORKDIR /app

# Copia os arquivos de dependência
COPY package*.json ./

# Instala TODAS as dependências (incluindo as de desenvolvimento como @nestjs/cli)
RUN npm install

# Copia todo o resto do código-fonte para o container
COPY . .

# Expõe a porta que a nossa aplicação vai usar
EXPOSE 3003

# Comando para iniciar a aplicação em modo de desenvolvimento
CMD ["npm", "run", "start:dev"]