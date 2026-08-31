FROM golang:1.25-alpine AS builder
WORKDIR /app
COPY go.work go.work.sum ./
COPY shared/go.mod shared/go.sum ./shared/
COPY gateway-audit/go.mod gateway-audit/go.sum ./gateway-audit/
COPY gateway-export/go.mod gateway-export/go.sum ./gateway-export/
COPY gateway-olt/go.mod gateway-olt/go.sum ./gateway-olt/
COPY gateway-scheduler/go.mod gateway-scheduler/go.sum ./gateway-scheduler/
COPY gateway-whatsapp/go.mod gateway-whatsapp/go.sum ./gateway-whatsapp/
COPY map-gateway/go.mod map-gateway/go.sum ./map-gateway/
COPY notification-gateway/go.mod notification-gateway/go.sum ./notification-gateway/
COPY payment-gateway/go.mod payment-gateway/go.sum ./payment-gateway/
COPY poller/go.mod poller/go.sum ./poller/
COPY storage-gateway/go.mod storage-gateway/go.sum ./storage-gateway/
COPY gateway-task/go.mod gateway-task/go.sum ./gateway-task/
COPY observability-gateway/go.mod ./observability-gateway/
RUN go work sync
COPY shared/ ./shared/
COPY gateway-whatsapp/ ./gateway-whatsapp/
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/bin/service ./gateway-whatsapp/cmd/main.go

FROM alpine:3.20
RUN apk --no-cache add ca-certificates curl
WORKDIR /app
COPY --from=builder /app/bin/service /app/service
EXPOSE 5005
ENTRYPOINT ["/app/service"]
