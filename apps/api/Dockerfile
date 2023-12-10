FROM golang:1.21-bullseye
WORKDIR /go/src/app
RUN apt-get update && apt-get install -y git
COPY ./apps/api ./
RUN go mod tidy && \
    # VSCode
    go install golang.org/x/tools/gopls@latest && \
    go install github.com/cweill/gotests/gotests@latest && \
    go install github.com/fatih/gomodifytags@latest && \
    go install github.com/josharian/impl@latest && \
    go install github.com/haya14busa/goplay/cmd/goplay@latest && \
    go install github.com/go-delve/delve/cmd/dlv@latest && \
    go install honnef.co/go/tools/cmd/staticcheck@latest && \
    # Hot Reload
    go install github.com/cosmtrek/air@latest