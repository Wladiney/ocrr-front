# Etapa 1: Construir a aplicação (imagem de build)
FROM node:18 AS build

# Diretório de trabalho no container
WORKDIR /app

# Copiar o package.json e package-lock.json para instalar as dependências
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar o restante do código da aplicação
COPY . .

# Construir os arquivos para produção
RUN npm run build

# Etapa 2: Servir a aplicação com um servidor leve (imagem de produção)
FROM nginx:alpine

# Copiar os arquivos de build do container anterior para o diretório padrão do Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Expor a porta 80 para o Nginx
EXPOSE 80

# Iniciar o Nginx
CMD ["nginx", "-g", "daemon off;"]
