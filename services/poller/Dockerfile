FROM golang:1.25-alpine AS builder
WORKDIR /app
COPY go.work go.work.sum ./
COPY shared/go.mod shared/go.sum ./shared/
COPY map-gateway/go.mod map-gateway/go.sum ./map-gateway/
COPY notification-gateway/go.mod notification-gateway/go.sum ./notification-gateway/
COPY payment-gateway/go.mod payment-gateway/go.sum ./payment-gateway/
COPY poller/go.mod poller/go.sum ./poller/
COPY storage-gateway/go.mod storage-gateway/go.sum ./storage-gateway/
RUN go work sync
COPY shared/ ./shared/
COPY poller/ ./poller/
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/bin/service ./poller/cmd/main.go

FROM alpine:3.20
RUN apk --no-cache add ca-certificates curl
WORKDIR /app
COPY --from=builder /app/bin/service /app/service
EXPOSE 5010
ENTRYPOINT ["/app/service"]
