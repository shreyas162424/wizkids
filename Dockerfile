# ============================================================
# Gurukul WizKids — Dockerfile
# Multi-stage build: install native deps, then copy lean image.
# ============================================================

# ── Stage 1: build (has Python + gcc needed by better-sqlite3) ──────────────
FROM node:20-alpine AS builder

# better-sqlite3 is a native Node add-on — needs build tools
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Install dependencies (ci = exact versions from package-lock.json)
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

# ── Stage 2: runtime (lean image, no build tools) ────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Copy compiled node_modules from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy application source
COPY . .

# Create the DB persistence directory.
# This directory is volume-mounted at runtime so the SQLite file
# survives container restarts.
RUN mkdir -p /app/db

# App listens on 3000
EXPOSE 3001

# Env defaults (can be overridden in docker-compose or docker run -e)
ENV NODE_ENV=production \
    PORT=3001 \
    DB_DIR=/app/db

CMD ["node", "server/index.js"]
