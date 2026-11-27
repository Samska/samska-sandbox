# Web image: builds the single-page application and serves it with nginx. The same image runs behind Caddy
# (Compose, WEB_ACCESS=none) and directly on Railway (WEB_ACCESS=private or none); see docs/DEPLOYMENT.md.
FROM node:24.20.0-slim AS build
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.29-alpine
ENV NGINX_ENVSUBST_FILTER="^(PORT|API_UPSTREAM|API_RESOLVER|LISTEN_IPV6)$"
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --chmod=755 docker-entrypoint.d/15-samska-env.envsh /docker-entrypoint.d/15-samska-env.envsh
COPY --from=build /build/dist /usr/share/nginx/html
EXPOSE 8080
