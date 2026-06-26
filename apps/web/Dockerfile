FROM node:22-alpine

WORKDIR /app

COPY apps/web/package.json ./
RUN npm install --legacy-peer-deps

COPY apps/web ./
RUN npm run build

ENV HOST=0.0.0.0
ENV PORT=4321
ENV API_URL=http://api:3001
EXPOSE 4321

CMD ["node", "dist/server/entry.mjs"]
