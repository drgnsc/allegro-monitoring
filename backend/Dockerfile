# Multi-stage build dla PocketBase
FROM golang:1.21-alpine AS builder

# Instalacja dependencies
RUN apk add --no-cache \
    ca-certificates \
    git \
    curl

# Pobierz PocketBase source lub użyj prebuilt binary
WORKDIR /app

# Opcja 1: Pobierz prebuilt binary (szybsze)
RUN wget https://github.com/pocketbase/pocketbase/releases/download/v0.24.0/pocketbase_0.24.0_linux_amd64.zip \
    && unzip pocketbase_0.24.0_linux_amd64.zip \
    && chmod +x pocketbase

# Final stage
FROM alpine:latest

# Instalacja runtime dependencies
RUN apk add --no-cache \
    ca-certificates \
    curl \
    tzdata

# Utwórz non-root user
RUN addgroup -g 1001 -S pocketbase && \
    adduser -S -D -H -u 1001 -h /app -s /sbin/nologin -G pocketbase -g pocketbase pocketbase

WORKDIR /app

# Skopiuj binary z builder stage
COPY --from=builder /app/pocketbase /app/pocketbase

# Skopiuj konfigurację i migracje
COPY pb_migrations/ /app/pb_migrations/
COPY collections-simple.json /app/
COPY *.go /app/ 

# Ustawienia uprawnień
RUN chown -R pocketbase:pocketbase /app
RUN chmod +x /app/pocketbase

# Utwórz katalog danych
RUN mkdir -p /app/pb_data && \
    chown -R pocketbase:pocketbase /app/pb_data

# Switch to non-root user
USER pocketbase

# Expose port
EXPOSE 8090

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8090/api/health || exit 1

# Start PocketBase
CMD ["/app/pocketbase", "serve", "--http=0.0.0.0:8090", "--dir=/app/pb_data"] 