# Multi-stage Docker build for Go microservice
FROM golang:1.25-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git ca-certificates tzdata

# Copy workspace and shared packages
COPY services/go.work services/go.work.sum* ./services/
COPY services/shared ./services/shared
COPY services/observability-gateway ./services/observability-gateway

WORKDIR /app/services/observability-gateway

# Build static binary
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/observability-gateway ./cmd/main.go

# Production minimal alpine image
FROM alpine:3.21

RUN apk add --no-cache ca-certificates tzdata curl

WORKDIR /app

COPY --from=builder /app/observability-gateway /app/observability-gateway

EXPOSE 5013

ENTRYPOINT ["/app/observability-gateway"]
