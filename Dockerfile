# https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile
FROM --platform=linux/amd64 public.ecr.aws/docker/library/node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk update && apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm i --frozen-lockfile
# Server depencies are runtime depencies required for running the Node.JS server, bundled separately
# this includes logging dependencies
FROM base AS server_deps
WORKDIR /app

# TODO: Can be further optimized to remove next peer dependency
RUN corepack enable pnpm && pnpm i next-logger@5.0.0 pino@9.2.0 dd-trace@5.12.0

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_DEVELOPER_PORTAL=""
ARG NEXT_PUBLIC_JWT_ISSUER=""
ARG NEXT_PUBLIC_URL=""
ENV NEXT_PUBLIC_DEVELOPER_PORTAL=${NEXT_PUBLIC_DEVELOPER_PORTAL}
ENV NEXT_PUBLIC_JWT_ISSUER=${NEXT_PUBLIC_JWT_ISSUER}
ENV NEXT_PUBLIC_URL=${NEXT_PUBLIC_URL}

RUN corepack enable pnpm && pnpm run build;

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=server_deps --chown=nextjs:nodejs /app/node_modules/. ./node_modules/.
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Source maps are enabled to provide helpful error stacks
ENV NODE_OPTIONS='--enable-source-maps -r dd-trace/init -r next-logger'
ENV NODE_ENV production

# Final config
USER nextjs

EXPOSE 3000

ENV PORT 3000
# set hostname to localhost
ENV HOSTNAME "0.0.0.0"

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["node", "server.js"]