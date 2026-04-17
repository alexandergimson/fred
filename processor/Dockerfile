FROM node:20-bookworm

RUN apt-get update && apt-get install -y \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
RUN npm install

COPY server.js ./

ENV PORT=8080
CMD ["npm", "start"]