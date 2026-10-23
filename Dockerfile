FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

# Install PostgreSQL client (for health check)
RUN apk add --no-cache libpq

WORKDIR /app

# Install deps (production only)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy build artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/drizzle ./drizzle
COPY -b /app/scripts ./scripts

# Create uploads directory with proper permissions
RUN mkdir -p /app/public/uploads && chmod -R 777 /app/public/uploads

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTH_CHECK_CMD wget -q -O- http://localhost:3000/api/health || exit 1
HEALTH_CHECK_TIMEOUT 5s
HEALTH_CHECK_INTERVAL 30s
HEALTH_CHECK_RETRIES 3

CMD ["node", "dist/server/entry.js"]
