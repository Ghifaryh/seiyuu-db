FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock ./
COPY apps/web ./apps/web
RUN npm install --legacy-peer-deps --production --ignore-scripts 2>/dev/null || true
RUN cd apps/web && npm install --legacy-peer-deps --production 2>/dev/null || true

FROM base AS build
RUN corepack enable && corepack prepare bun@1 --activate
COPY package.json bun.lock tsconfig.base.json tsconfig.json ./
COPY apps/web ./apps/web
RUN bun install --frozen-lockfile
WORKDIR /app/apps/web
RUN bun run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/apps/web/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
COPY apps/web/package.json ./package.json

ENV HOST=0.0.0.0
ENV PORT=4321
EXPOSE 4321

CMD ["node", "dist/server/entry.mjs"]
