FROM golang:1.25-alpine AS builder
# Install C build tools and libwebp for CGO compilation (required by chai2010/webp)
RUN apk --no-cache add build-base libwebp-dev

WORKDIR /app
COPY go.work go.work.sum ./
COPY shared/go.mod shared/go.sum ./shared/
COPY map-gateway/go.mod map-gateway/go.sum ./map-gateway/
COPY notification-gateway/go.mod notification-gateway/go.sum ./notification-gateway/
COPY payment-gateway/go.mod payment-gateway/go.sum ./payment-gateway/
COPY poller/go.mod poller/go.sum ./poller/
COPY storage-gateway/go.mod storage-gateway/go.sum ./storage-gateway/
COPY gateway-audit/go.mod gateway-audit/go.sum ./gateway-audit/
COPY gateway-export/go.mod gateway-export/go.sum ./gateway-export/
COPY gateway-olt/go.mod gateway-olt/go.sum ./gateway-olt/
COPY gateway-scheduler/go.mod gateway-scheduler/go.sum ./gateway-scheduler/
COPY gateway-whatsapp/go.mod gateway-whatsapp/go.sum ./gateway-whatsapp/
COPY gateway-task/go.mod gateway-task/go.sum ./gateway-task/
COPY observability-gateway/go.mod ./observability-gateway/
RUN go work sync
COPY shared/ ./shared/
COPY storage-gateway/ ./storage-gateway/
# CGO enabled required by chai2010/webp (libwebp C bindings)
RUN CGO_ENABLED=1 GOOS=linux go build -ldflags="-w -s" -o /app/bin/service ./storage-gateway/cmd/main.go

FROM alpine:3.20
# Install libwebp runtime library required by the binary
RUN apk --no-cache add ca-certificates curl libwebp
WORKDIR /app
COPY --from=builder /app/bin/service /app/service
EXPOSE 5004
ENTRYPOINT ["/app/service"]
