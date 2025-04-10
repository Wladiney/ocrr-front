# Etapa 1: Construir a aplicação (imagem de build)
FROM node:18 AS build

# Diretório de trabalho no container
WORKDIR /app

# Copiar apenas o package.json e package-lock.json para instalar as dependências
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar apenas o diretório src (código-fonte) e arquivos necessários
COPY src ./src
COPY vite.config.js .

# Construir os arquivos para produção
RUN npm run build

# Etapa 2: Servir a aplicação com um servidor leve (imagem de produção)
FROM nginx:alpine

# Criar um usuário no container (sem permissões de root)
RUN adduser -D -g '' appuser

# Criar diretório de trabalho para o Nginx e dar permissão para o usuário
RUN mkdir -p /usr/share/nginx/html && chown -R appuser:appuser /usr/share/nginx/html

# Copiar os arquivos de build do container anterior para o diretório padrão do Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Alterar para o usuário não-root
USER appuser

# Expor a porta 80 para o Nginx
EXPOSE 80

# Iniciar o Nginx
CMD ["nginx", "-g", "daemon off;"]
