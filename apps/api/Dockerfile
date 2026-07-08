# MATAL API — production image. Build context is the repo ROOT:
#   docker build -f apps/api/Dockerfile -t matal-api .
#
# Multi-stage: the builder installs the whole workspace and compiles; the
# runner carries the built app. The Prisma CLI (a dev dependency) is kept so the
# container can apply migrations on startup — image-size trimming is a possible
# future optimization, but this keeps deploys simple for a small team.

# ── Builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Copy the full workspace, then install. `npm ci` runs the root postinstall
# (build shared packages) and the api postinstall (prisma generate), so the
# shared CJS packages and Prisma client exist before we compile the API.
COPY . .
RUN npm ci && npm run build --workspace @matal/api

# ── Runner ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

# Tini for correct signal handling / graceful shutdown.
RUN apk add --no-cache tini

COPY --from=builder /app ./

EXPOSE 3000
ENTRYPOINT ["/sbin/tini", "--"]
# Apply pending migrations, then boot the API.
CMD ["sh", "-c", "npm run db:migrate:deploy --workspace @matal/api && node apps/api/dist/main.js"]
