FROM node:22 AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npm run build



FROM node:22

WORKDIR /app
USER node

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/images ./images
COPY --from=builder /app/templates ./templates

# instalar puppeteer y dependencias
RUN npx puppeteer browsers install chrome

RUN apt-get update && apt-get install -y --no-install-recommends libnss3 libnss3-dev libgdk-pixbuf2.0-dev libgtk-3-dev libxss-dev libasound2

COPY deployment/docker-entrypoint.sh .
RUN chmod +x docker-entrypoint.sh && \
    chown node:node docker-entrypoint.sh

# Start the node process
CMD ["./docker-entrypoint.sh"]
