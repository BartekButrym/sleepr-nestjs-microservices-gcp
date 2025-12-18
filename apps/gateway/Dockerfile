FROM node:alpine AS development

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.json tsconfig.json
COPY nest-cli.json nest-cli.json

COPY apps/gateway apps/gateway
COPY libs libs

RUN npm install

RUN npm run build gateway

RUN npm prune --omit=dev

FROM node:alpine AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./
COPY --from=development /usr/src/app/node_modules ./node_modules
COPY --from=development /usr/src/app/dist ./dist

CMD ["node", "dist/apps/gateway/main.js"]