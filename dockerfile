# Imagem base com Node.js
FROM node:18

# Diretório de trabalho dentro do container
WORKDIR /app

# Copiar apenas os arquivos de dependência para instalar mais rápido no cache
COPY package*.json ./


# Instalar dependências
RUN npm install -g npm@11.3.0

# Copiar o restante do projeto
COPY . .

# Adicionar permissão correta para o diretório /app
RUN chown -R node:node /app

# Define o usuário para o container (se não estiver rodando como root)
USER node

# Expor a porta padrão do Vite
EXPOSE 5173

# Comando para rodar o servidor de desenvolvimento
CMD ["npm", "run", "dev", "--", "--host"]


