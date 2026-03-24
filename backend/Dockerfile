FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

FROM node:20-alpine
RUN apk add --no-cache netcat-openbsd
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY app.js ./
COPY wait-for-db.sh ./
RUN chmod +x wait-for-db.sh
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
EXPOSE 3000
CMD ["./wait-for-db.sh"]
