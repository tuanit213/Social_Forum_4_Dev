#!/usr/bin/env bash
set -euo pipefail

SOURCE_CONFIG=${1:-deploy/social-forum/nginx-http.conf}
TARGET=/etc/nginx/sites-available/social-forum

install -m 0644 "$SOURCE_CONFIG" "$TARGET"
ln -sfn "$TARGET" /etc/nginx/sites-enabled/social-forum
nginx -t
systemctl reload nginx
