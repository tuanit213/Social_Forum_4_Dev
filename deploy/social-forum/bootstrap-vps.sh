#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y docker.io docker-compose-v2 git curl ca-certificates certbot python3-certbot-nginx
systemctl enable --now docker

# Redis background persistence requires memory overcommit, especially on this
# small VPS where swap may already be in use during image builds.
cat >/etc/sysctl.d/99-social-forum-redis.conf <<'EOF'
vm.overcommit_memory = 1
EOF
sysctl --system >/dev/null

if ! swapon --show --noheadings | grep -q .; then
  if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
  fi
  swapon /swapfile
  grep -q '^/swapfile ' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

install -d -m 0755 /opt/social-forum/releases /opt/social-forum/shared

docker --version
docker compose version
sysctl vm.overcommit_memory
free -h
