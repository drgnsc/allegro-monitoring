# Multi-stage build dla React Dashboard
FROM node:18-alpine AS builder

# Ustaw working directory
WORKDIR /app

# Skopiuj package files
COPY package*.json ./

# Instaluj dependencies
RUN npm ci --only=production

# Skopiuj kod źródłowy
COPY . .

# Build aplikacji
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Instalacja serve do serwowania static files
RUN npm install -g serve

# Utwórz non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

WORKDIR /app

# Skopiuj built aplikację
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001 || exit 1

# Start aplikacji
CMD ["serve", "-s", "dist", "-l", "3001"] 