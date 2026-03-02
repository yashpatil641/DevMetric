# ── Stage 1: Build the Go binary ─────────────────────────────────
FROM golang:1.25-alpine AS builder

# Install CA certs (needed at runtime for HTTPS calls to GitHub / Firebase)
RUN apk add --no-cache ca-certificates

WORKDIR /build

# Cache module downloads before copying source
COPY go.mod go.sum ./
RUN go mod download

# Copy source and build a fully-static binary
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-s -w" -o /gateway .

# ── Stage 2: Minimal distroless runtime ──────────────────────────
FROM gcr.io/distroless/static-debian12:nonroot

LABEL maintainer="yashpatil"
LABEL description="DevMetric Gateway — Go / Gin"

WORKDIR /app

# Copy CA certs and the binary
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /gateway .

# Expects these at runtime:
#   FIREBASE_CREDENTIALS_PATH  (mounted or baked-in)
#   AI_SERVICE_URL
#   PORT

EXPOSE 8080

# distroless/nonroot already runs as uid 65534
ENTRYPOINT ["/app/gateway"]
