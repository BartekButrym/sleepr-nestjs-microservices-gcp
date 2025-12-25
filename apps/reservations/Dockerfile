FROM node:alpine AS development

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.json tsconfig.json
COPY nest-cli.json nest-cli.json

RUN npm install

COPY apps/reservations apps/reservations
COPY libs libs

RUN cd apps/reservations && npx prisma generate

RUN npm run build reservations

FROM node:alpine AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --only=production

COPY --from=development /usr/src/app/dist ./dist
COPY --from=development /usr/src/app/apps/reservations/prisma ./apps/reservations/prisma
COPY --from=development /usr/src/app/apps/reservations/prisma.config.ts ./apps/reservations/prisma.config.ts
COPY --from=development /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=development /usr/src/app/node_modules/@prisma ./node_modules/@prisma

CMD ["npm", "run", "start:prod", "dist/apps/reservations/main.js"]