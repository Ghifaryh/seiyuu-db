FROM oven/bun:1-alpine

WORKDIR /app

COPY package.json bun.lock tsconfig.base.json tsconfig.json ./
COPY apps/api ./apps/api

RUN bun install

ENV PORT=3001
ENV NODE_ENV=production
EXPOSE 3001

CMD ["bun", "run", "apps/api/src/index.ts"]
