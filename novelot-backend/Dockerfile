FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci 

COPY tsconfig.json ./
COPY src/ ./src/

EXPOSE 1714

CMD ["npm", "run", "start"]

