# =============================================================================
# FRONTEND DOCKER BUILD - Multi-stage Dockerfile
# =============================================================================
# Build: docker build -t frontend:latest --build-arg VITE_API_BASE_URL=http://api:8080/api .
# Run:   docker run -p 80:80 frontend:latest
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Build
# -----------------------------------------------------------------------------
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install dependencies
RUN npm ci --silent

# Copy source code
COPY . .

# Build arguments for environment variables (injected at build time)
ARG VITE_API_BASE_URL
ARG VITE_PROMETHEUS_URL
ARG VITE_GRAFANA_URL
ARG VITE_EUREKA_URL
ARG VITE_KAFKA_UI_URL

# Set environment variables for build
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_PROMETHEUS_URL=$VITE_PROMETHEUS_URL
ENV VITE_GRAFANA_URL=$VITE_GRAFANA_URL
ENV VITE_EUREKA_URL=$VITE_EUREKA_URL
ENV VITE_KAFKA_UI_URL=$VITE_KAFKA_UI_URL

# Build the application (skip TypeScript checking for CI/CD)
RUN npm run build:docker

# -----------------------------------------------------------------------------
# Stage 2: Production Runtime
# -----------------------------------------------------------------------------
FROM nginx:alpine AS production

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
