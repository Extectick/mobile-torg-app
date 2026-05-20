FROM node:22-bookworm-slim AS base

ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
  npm config set registry https://registry.npmjs.org/ \
  && npm config set fetch-retries 5 \
  && npm config set fetch-retry-factor 2 \
  && npm config set fetch-retry-mintimeout 20000 \
  && npm config set fetch-retry-maxtimeout 120000 \
  && npm config set fetch-timeout 300000 \
  && for attempt in 1 2 3; do \
    npm ci --no-audit --no-fund --prefer-offline && break; \
    if [ "$attempt" = "3" ]; then exit 1; fi; \
    echo "npm ci failed, retrying in 10s..."; \
    sleep 10; \
  done

FROM deps AS builder

ARG DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mobile_torg?schema=public"
ARG NEXT_PUBLIC_API_URL

ENV DATABASE_URL=$DATABASE_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY . .
RUN npx prisma generate
RUN npm run build

FROM deps AS migrator

COPY prisma ./prisma
COPY prisma.config.ts ./
COPY tsconfig.json ./

CMD ["npx", "prisma", "db", "push"]

FROM base AS runner

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV ERROR_IMAGES_DIR=/app/logs/error-images

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

RUN mkdir -p /app/logs/error-images \
  && chown -R nextjs:nodejs /app/logs

USER nextjs

EXPOSE 3000

CMD ["sh", "-c", "mkdir -p /app/logs/error-images && node server.js 2>&1 | tee -a /app/logs/app.log"]
