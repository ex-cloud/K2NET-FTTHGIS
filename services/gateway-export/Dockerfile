FROM golang:1.25-alpine AS builder
WORKDIR /app

# 1. Copy only shared and gateway-export dependency definitions
COPY shared/go.mod shared/go.sum ./shared/
COPY gateway-export/go.mod gateway-export/go.sum ./gateway-export/

# 2. Initialize isolated Go workspace for just shared + gateway-export
RUN go work init ./shared ./gateway-export

# 3. Download dependencies with BuildKit module cache
RUN --mount=type=cache,target=/go/pkg/mod \
    cd gateway-export && go mod download

# 4. Copy source code
COPY shared/ ./shared/
COPY gateway-export/ ./gateway-export/

# 5. Build binary with BuildKit module cache and Go compiler build cache
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/bin/service ./gateway-export/cmd/main.go

FROM alpine:3.20
RUN apk --no-cache add ca-certificates curl
WORKDIR /app
COPY --from=builder /app/bin/service /app/service
RUN mkdir -p /app/fonts /app/templates
EXPOSE 5007
ENTRYPOINT ["/app/service"]
