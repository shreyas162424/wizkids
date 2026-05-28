# ============================================================
# Gurukul WizKids — Production-ready Dockerfile
# Lean Node 22 image (using built-in node:sqlite).
# ============================================================

FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev --no-audit --no-fund

# Copy application code
COPY . .

# [DEMO-READY] Bake the API key for Zero-Config "Pull & Run"
# WARNING: Keep your Docker Hub repository PRIVATE to protect your key!
COPY .env /app/.env

# Create DB directory for SQLite
RUN mkdir -p /app/db

# Expose port 3000
EXPOSE 3000

# Environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    DB_DIR=/app/db

# Start the server
CMD ["node", "server/index.js"]
