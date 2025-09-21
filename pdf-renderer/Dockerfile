# Lightweight image with Debian tools available
FROM node:20-slim

# Install poppler (pdftocairo) and ghostscript
RUN apt-get update && \
    apt-get install -y --no-install-recommends poppler-utils ghostscript && \
    rm -rf /var/lib/apt/lists/*

# App setup
WORKDIR /srv
ENV NODE_ENV=production

# Install deps (no lockfile required)
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

# Copy the rest of the source
COPY . .

# Cloud Run listens on $PORT
ENV PORT=8080
EXPOSE 8080

# Start the server
CMD ["npm", "start"]
