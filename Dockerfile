# syntax=docker/dockerfile:1

# Debian slim rather than Alpine: better-sqlite3 is a native module, and the
# glibc prebuilds are the well-trodden path. Same base in every stage so the
# compiled binary matches the runtime.
ARG NODE_VERSION=22-bookworm-slim

# ---------------------------------------------------------------- deps --------
FROM node:${NODE_VERSION} AS deps
WORKDIR /app

# better-sqlite3 ships prebuilt binaries for linux/amd64 and linux/arm64. These
# are the fallback if prebuild-install can't find one and node-gyp has to
# compile from source.
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
 && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

# --------------------------------------------------------------- build --------
FROM node:${NODE_VERSION} AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# -------------------------------------------------------------- runtime -------
FROM node:${NODE_VERSION} AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    SOON_DB_PATH=/data/soon.db

RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs nextjs

# The standalone bundle carries its own minimal node_modules, including the
# better-sqlite3 native binary that output tracing pulled in.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# If you add a public/ directory later, uncomment:
# COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Owned by nextjs so an empty named volume mounted here inherits that ownership.
RUN mkdir -p /data && chown nextjs:nodejs /data

USER nextjs

# Default only. docker-compose.prod.yml overrides PORT to 3003; the healthcheck
# below reads whatever PORT is set to, so the two never drift apart.
EXPOSE 3000
VOLUME ["/data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
