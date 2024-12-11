# Deploy con docker a VPS

## Configuracion

Este repositorio (backend) contiene configuracion para deployar
el proyecto a cualquier VPS.

## Requisitos del sistema

- Sistema Operativo: Ubuntu 24.04 LTS
- CPU: 1 minimo, 2 recomendado
- RAM: 500MB
  - 300MB backend
  - 100MB frontend admin
  - 100MB frontend shop
  - 100MB Postgres
- Disco: ?? GB
  - S.O. + Docker base: 2 GB
  - Imágenes de docker: ?? GB

## Preconfiguracion

Cosas a hacer antes de automatizar los deploys.
Solo se realiza 1 vez.

### En archivo `docker-compose.yml`

- Configurar nombres de dominio y subdominios
- Configurar routers de traefik en labels

### En el VPS

- Anotar direccion ipv4 del vps
- Instalar clave publica SSH
- Crear usuario
- Instalar Docker y Docker compose
  - https://docs.docker.com/engine/install/ubuntu/
- Configurar UFW, abrir puertos 80 & 443
- Dar permisos de docker al usuario
- Iniciar sesión en Docker Registry privado
- Configurar Traefik:
  - Crear red externa de docker llamada `proxy`
  - Configurar red en docker-compose a `proxy`
  - Configurar plugin de DNS del dominio
  - Configurar claves API para DNS
  - Configurar resolvers de DNS
- Crear carpetas
  - El `docker-compose.yml` esta en esta misma carpeta
  - Colocar `docker-compose.stage.yml`
  - Colocar archivo `.env`

### En DNS del dominio

- Configurar API key para que traefik genere cert. SSL
- Crear registros A/AAAA que apunten al VPS

### En la configuracion del proyecto en github

Agregar secretos:

- STAGE_SERVER_HOST
- STAGE_SSH_PRIVATE_KEY
- STAGE_SSH_USERNAME

Agregar variable:

- SERVICE_NAME : nombre del servicio en el docker-compose

