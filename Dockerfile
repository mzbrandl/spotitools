# =============================================================
# Stage 1: Build React client
# node-sass 7 requires python/make/g++ and is limited to Node 18
# =============================================================
FROM node:18-alpine AS client-builder

RUN apk add --no-cache python3 make g++

WORKDIR /client
COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build
# Output: /client/build/


# =============================================================
# Stage 2: Production Node server
# =============================================================
FROM node:18-slim AS server

WORKDIR /app

# Install production deps (better-sqlite3 has prebuilts for slim/debian)
COPY package*.json ./
RUN npm ci --production

# Copy server code
COPY server.js ./
COPY db/index.js ./db/
COPY migration/migrate.js ./migration/

# Copy built client as fallback static serving
COPY --from=client-builder /client/build ./client/build

EXPOSE 3001

# Use non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser
USER appuser

CMD ["node", "server.js"]


# =============================================================
# Stage 3: Nginx — serves static files, proxies API to Node
# =============================================================
FROM nginx:alpine AS webserver

# Copy built static files from Stage 1
COPY --from=client-builder /client/build /usr/share/nginx/html

# Nginx config will be mounted as a volume at runtime
# (so it can be edited without rebuilding)
COPY nginx/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80 443
