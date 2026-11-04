# Image du frontend : build de production Angular, servi par Caddy, qui est
# aussi le reverse proxy HTTPS (certificat Let's Encrypt automatique) et
# transmet /api au backend. Voir Caddyfile.

FROM node:24-alpine AS construction
WORKDIR /construction
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=construction /construction/dist/saes-frontend/browser /srv
