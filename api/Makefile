# DFD Agency API — developer tasks.
#
# Go 1.27.4 is pinned in go.mod; GOTOOLCHAIN is pinned here so every
# contributor and CI job uses the exact same toolchain.

GOTOOLCHAIN := go1.27.4
export GOTOOLCHAIN

.PHONY: all build run test vet fmt tidy migrate migrate-down clean

all: fmt vet build

build:
	go build ./...

run:
	go run ./cmd/api

test:
	go test ./...

vet:
	go vet ./...

fmt:
	gofmt -w .

tidy:
	go mod tidy

migrate:
	go run ./cmd/api migrate

migrate-down:
	go run ./cmd/api migrate-down

clean:
	go clean ./...
