# Stage 1: install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Stage 2: final lean image
FROM node:20-alpine

# Install netcat for wait-for-db.sh (busybox nc is available by default on alpine)
RUN apk add --no-cache netcat-openbsd

WORKDIR /app

# Copy deps from stage 1
COPY --from=deps /app/node_modules ./node_modules

# Copy source
COPY app.js ./
COPY wait-for-db.sh ./
RUN chmod +x wait-for-db.sh

# Non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3000

# wait-for-db ensures MySQL is ready before the app starts
ENTRYPOINT ["./wait-for-db.sh", "db", "3306", "--"]
CMD ["node", "app.js"]
