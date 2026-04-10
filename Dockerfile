# ---------------------------
# Build Stage
# ---------------------------
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY patches/ ./patches/
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

# ---------------------------
# Runner Stage
# ---------------------------
FROM node:20-alpine AS runner

# docker CLI 설치
RUN apk add --no-cache docker-cli

# nextjs 유저 생성
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

# docker.sock의 group(ping, GID=999)에 nextjs를 추가
RUN addgroup -g 999 ping || true
RUN addgroup nextjs ping

ENV NODE_ENV=production
ENV PORT=8080

WORKDIR /app

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public /public

USER nextjs

EXPOSE 8080
CMD ["node", "server.js"]
