# Imagem base com Node.js
FROM node:18

# Diretório de trabalho dentro do container
WORKDIR /app

# Copiar apenas os arquivos de dependência para instalar mais rápido no cache
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar o restante do projeto
COPY . .

# Expor a porta padrão do Vite
EXPOSE 5173

# Comando para rodar o servidor de desenvolvimento
CMD ["npm", "run", "dev", "--", "--host"]
