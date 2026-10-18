#!/usr/bin/env bash
set -euo pipefail

REPOSITORY=${REPOSITORY:-https://github.com/tuanit213/Social_Forum_4_Dev.git}
REF=${1:-codex/vps-deployment}
ROOT=/opt/social-forum
RELEASE="$ROOT/releases/$(date -u +%Y%m%d%H%M%S)"
SHARED_ENV="$ROOT/shared/.env"

wait_for_url() {
  local url=$1
  local attempts=${2:-45}

  for ((attempt = 1; attempt <= attempts; attempt++)); do
    if curl -fsS "$url"; then
      return 0
    fi
    sleep 2
  done

  echo "Timed out waiting for $url" >&2
  return 1
}

test -f "$SHARED_ENV" || { echo "Missing $SHARED_ENV" >&2; exit 1; }

git clone --filter=blob:none --branch "$REF" "$REPOSITORY" "$RELEASE"
ln -s "$SHARED_ENV" "$RELEASE/deploy/social-forum/.env"

cd "$RELEASE"
docker compose -f deploy/social-forum/compose.yaml config >/dev/null
docker compose -f deploy/social-forum/compose.yaml up -d --build

wait_for_url http://127.0.0.1:18080/healthz
wait_for_url http://127.0.0.1:15000/health/ready
ln -sfn "$RELEASE" "$ROOT/current"

find "$ROOT/releases" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' \
  | sort -nr | tail -n +4 | cut -d' ' -f2- | xargs -r rm -rf
