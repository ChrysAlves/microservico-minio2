# Dockerfile para o Microsserviço de Storage (VERSÃO FINAL)

FROM node:20-alpine

# Define o diretório de trabalho
WORKDIR /app

# Define o ambiente como 'development' ANTES de instalar.
# Isso força o npm a instalar TODAS as dependências, incluindo as de desenvolvimento.
ENV NODE_ENV=development

# Copia os arquivos de manifesto de pacotes
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia o resto do código-fonte
COPY . .

# Expõe a porta
EXPOSE 3003

# Comando para iniciar a aplicação
CMD ["npm", "run", "start:dev"]