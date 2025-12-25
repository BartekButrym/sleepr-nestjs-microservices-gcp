FROM node:alpine AS development

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.json tsconfig.json
COPY nest-cli.json nest-cli.json
COPY apps/auth/package*.json ./apps/auth/

RUN npm install

COPY apps/auth apps/auth
COPY libs libs

RUN cd apps/auth && npx prisma generate

RUN npm run build auth

FROM node:alpine AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --only=production

COPY --from=development /usr/src/app/dist ./dist
COPY --from=development /usr/src/app/apps/auth/prisma ./apps/auth/prisma
COPY --from=development /usr/src/app/apps/auth/prisma.config.ts ./apps/auth/prisma.config.ts
COPY --from=development /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=development /usr/src/app/node_modules/@prisma ./node_modules/@prisma

CMD ["npm", "run", "start:prod", "dist/apps/auth/main.js"]