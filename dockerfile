# Etapa 1: Construir a aplicação (imagem de build)
FROM node:18 AS build

# Diretório de trabalho no container
WORKDIR /app

# Copiar apenas o package.json e package-lock.json para instalar as dependências
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar o diretório src (código-fonte), index.html e arquivos necessários
COPY . .

# Construir os arquivos para produção
RUN npm run build

# Etapa 2: Servir a aplicação com um servidor leve (imagem de produção)
FROM nginx:alpine

# Criar diretório de trabalho para o Nginx
RUN mkdir -p /usr/share/nginx/html

# Copiar os arquivos de build do container anterior para o diretório padrão do Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Criar diretórios de cache do Nginx e dar permissões genéricas para todo o sistema de arquivos
RUN mkdir -p /var/cache/nginx && \
    mkdir -p /var/cache/nginx/client_temp && \
    mkdir -p /var/run/nginx && \
    chmod -R 777 /var/cache/nginx /var/run/nginx /usr/share/nginx/html

# Expor a porta 80 para o Nginx
EXPOSE 80

# Iniciar o Nginx como root
USER root
CMD ["nginx", "-g", "daemon off;"]
