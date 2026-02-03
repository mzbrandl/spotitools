# =============================================================
# Stage 1: Build React client
# =============================================================
FROM node:20-alpine AS client-builder

WORKDIR /client
COPY client/package*.json ./
# Clean install (includes the new 'sass' package)
RUN npm ci

COPY client/ ./
# node-sass was the only thing holding us back on Node 18.
# Now that we use 'sass', we can build on Node 20.
RUN npm run build


# =============================================================
# Stage 2: Production Node server
# =============================================================
FROM node:20-slim AS server

WORKDIR /app

# Install production deps
COPY package*.json ./
RUN npm ci --production

# Copy server code
COPY server.js ./
COPY db/index.js ./db/
COPY migration/migrate.js ./migration/

# Copy built client
COPY --from=client-builder /client/build ./client/build

EXPOSE 3001

# Use non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser
USER appuser

CMD ["node", "server.js"]


# =============================================================
# Stage 3: Nginx
# =============================================================
FROM nginx:alpine AS webserver

COPY --from=client-builder /client/build /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80 443
