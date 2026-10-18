#!/usr/bin/env bash
set -euo pipefail

ROOT=/opt/social-forum
TARGET=${1:?Usage: rollback.sh /opt/social-forum/releases/TIMESTAMP}

case "$TARGET" in
  "$ROOT"/releases/*) ;;
  *) echo "Target must be a release under $ROOT/releases" >&2; exit 1 ;;
esac

test -d "$TARGET"
test -f "$ROOT/shared/.env"
ln -sfn "$ROOT/shared/.env" "$TARGET/deploy/social-forum/.env"

cd "$TARGET"
docker compose -f deploy/social-forum/compose.yaml up -d --build
ln -sfn "$TARGET" "$ROOT/current"
curl -fsS http://127.0.0.1:18080/healthz
curl -fsS http://127.0.0.1:15000/health/ready
