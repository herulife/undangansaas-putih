FROM golang:1.25-bookworm AS build

WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /out/api ./cmd/api

FROM debian:bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates webp \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=build /out/api /app/api

EXPOSE 8088
CMD ["/app/api"]
