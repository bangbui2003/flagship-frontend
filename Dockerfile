# syntax=docker/dockerfile:1

# Sử dụng Node 22 (phiên bản LTS mới nhất) làm base image
ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-alpine AS base

# --- STAGE 1: Cài đặt thư viện ---
FROM base AS deps
# Cài đặt libc6-compat (cần thiết cho một số thư viện native trên Alpine Linux)
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Sử dụng mount bind để mượn file package.json mà không làm tăng dung lượng image
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci

# --- STAGE 2: Build dự án ---
FROM deps AS builder
WORKDIR /app
COPY . .
# Chạy build (Next.js sẽ tạo ra folder .next/standalone)
RUN npm run build

# --- STAGE 3: Production Runner ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Tạo user/group
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs --ingroup nodejs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./ 
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# LƯU Ý: Debug
RUN ls -la 

# Cấp quyền cho user nextjs và chuyển sang user đó
RUN chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]