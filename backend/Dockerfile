# Multi-stage production build for HAPS Backend API
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

COPY . .

# Final minimal runtime image
FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

COPY --from=builder --chown=appuser:appgroup /app /app

ENV NODE_ENV=production
ENV PORT=5050

EXPOSE 5050

CMD ["node", "src/server.js"]
