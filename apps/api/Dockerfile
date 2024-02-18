# Base
FROM golang:1.21-bullseye as base
WORKDIR /go/src/app
COPY ./apps/api ./
RUN go mod tidy

# Develop
FROM base as dev
RUN apt-get update && apt-get install -y git
# VSCode
RUN go install golang.org/x/tools/gopls@latest && \
    go install github.com/cweill/gotests/gotests@latest && \
    go install github.com/fatih/gomodifytags@latest && \
    go install github.com/josharian/impl@latest && \
    go install github.com/haya14busa/goplay/cmd/goplay@latest && \
    go install github.com/go-delve/delve/cmd/dlv@latest && \
    go install honnef.co/go/tools/cmd/staticcheck@latest
# Hot Reload
RUN go install github.com/cosmtrek/air@latest

# Build
FROM base as builder
ENV CGO_ENABLED=0
ENV GOOS=linux
ENV GOARCH=amd64
RUN go build main.go

# Runtime
FROM gcr.io/distroless/static-debian12 as prod
WORKDIR /app
COPY --from=builder /go/src/app/main ./
EXPOSE 8080
ENTRYPOINT ["./main"]