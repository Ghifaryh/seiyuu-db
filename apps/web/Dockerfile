FROM oven/bun:1-alpine AS build

WORKDIR /app

COPY package.json bun.lock tsconfig.base.json ./
COPY apps/web ./apps/web

RUN bun install

WORKDIR /app/apps/web
RUN bun run build

FROM node:22-alpine

WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/web/dist ./dist
COPY apps/web/package.json ./package.json

ENV HOST=0.0.0.0
ENV PORT=4321
EXPOSE 4321

CMD ["node", "dist/server/entry.mjs"]
