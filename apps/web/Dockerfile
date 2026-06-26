FROM node:22-alpine AS build

WORKDIR /app

COPY package.json ./
COPY apps/web/package.json ./apps/web/

RUN cd apps/web && npm install --legacy-peer-deps

COPY tsconfig.base.json ./
COPY apps/web ./apps/web

WORKDIR /app/apps/web
RUN npm run build

FROM node:22-alpine

WORKDIR /app

COPY --from=build /app/apps/web/dist ./dist
COPY --from=build /app/apps/web/node_modules ./node_modules
COPY apps/web/package.json ./package.json

ENV HOST=0.0.0.0
ENV PORT=4321
EXPOSE 4321

CMD ["node", "dist/server/entry.mjs"]
