# ---- Base ----------------------------------------------------------------
FROM node:20-alpine AS base
WORKDIR /usr/src/app

# ---- Dependencies ----------------------------------------------------------
FROM base AS deps
COPY package*.json ./
RUN npm ci --omit=dev

# ---- Production image -------------------------------------------------------
FROM base AS production
ENV NODE_ENV=production

# Run as a non-root user for security
RUN addgroup -S nodejs && adduser -S cloudvault -G nodejs

COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .

RUN chown -R cloudvault:nodejs /usr/src/app
USER cloudvault

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', r => process.exit(r.statusCode===200?0:1)).on('error', () => process.exit(1))"

CMD ["node", "server.js"]
