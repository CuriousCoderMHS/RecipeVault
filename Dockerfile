FROM node:22-bookworm

WORKDIR /app

COPY package*.json ./

ENV NODE_OPTIONS=--max-old-space-size=4096

RUN npm ci

COPY . .

RUN npx prisma generate
RUN ls -la node_modules/.prisma

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]