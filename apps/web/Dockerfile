# MATAL web — production image. Build context is the repo ROOT:
#   docker build -f apps/web/Dockerfile -t matal-web .
#
# Vite bakes VITE_* values at build time. The default empty VITE_API_URL makes
# the client talk to its own origin (same host as nginx), which then proxies
# /api and /socket.io to the API — see nginx.conf. Override the build arg only
# if the API is served from a different origin.

# ── Builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

COPY . .
RUN npm ci && npm run build --workspace @matal/web

# ── Runner (static files via nginx) ──────────────────────────────────
FROM nginx:1.27-alpine AS runner
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
