FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --production && npm install @nestjs/cli

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
