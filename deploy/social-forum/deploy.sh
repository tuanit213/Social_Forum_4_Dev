#!/usr/bin/env bash
set -euo pipefail

REPOSITORY=${REPOSITORY:-https://github.com/tuanit213/Social_Forum_4_Dev.git}
REF=${1:-codex/vps-deployment}
ROOT=/opt/social-forum
RELEASE="$ROOT/releases/$(date -u +%Y%m%d%H%M%S)"
SHARED_ENV="$ROOT/shared/.env"

test -f "$SHARED_ENV" || { echo "Missing $SHARED_ENV" >&2; exit 1; }

git clone --filter=blob:none --branch "$REF" "$REPOSITORY" "$RELEASE"
ln -s "$SHARED_ENV" "$RELEASE/deploy/social-forum/.env"

cd "$RELEASE"
docker compose -f deploy/social-forum/compose.yaml config >/dev/null
docker compose -f deploy/social-forum/compose.yaml up -d --build

ln -sfn "$RELEASE" "$ROOT/current"
curl -fsS http://127.0.0.1:18080/healthz
curl -fsS http://127.0.0.1:15000/health/live

find "$ROOT/releases" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' \
  | sort -nr | tail -n +4 | cut -d' ' -f2- | xargs -r rm -rf
