# Deployment operations

## First deployment

```bash
bash deploy/social-forum/bootstrap-vps.sh
install -m 0600 deploy/social-forum/.env.example /opt/social-forum/shared/.env
# Edit only /opt/social-forum/shared/.env and replace every placeholder.
bash deploy/social-forum/install-nginx.sh
bash deploy/social-forum/deploy.sh codex/vps-deployment
```

## Update

```bash
cd /opt/social-forum/current
git fetch origin
bash deploy/social-forum/deploy.sh codex/vps-deployment
```

## Status and logs

```bash
cd /opt/social-forum/current
docker compose -f deploy/social-forum/compose.yaml ps
docker compose -f deploy/social-forum/compose.yaml logs --tail=200 backend
docker compose -f deploy/social-forum/compose.yaml logs --tail=200 redis
curl -fsS http://127.0.0.1:15000/health/live
curl -fsS http://127.0.0.1:15000/health/ready
curl -fsS http://127.0.0.1:18080/healthz
```

Redis persistence depends on `vm.overcommit_memory=1`. Confirm the live and
persistent settings after provisioning or a host reboot:

```bash
sysctl vm.overcommit_memory
cat /etc/sysctl.d/99-social-forum-redis.conf
```

## Restart

```bash
cd /opt/social-forum/current
docker compose -f deploy/social-forum/compose.yaml restart backend
```

## Backup and restore

MongoDB backups are managed in Atlas. Redis stores derived feed data and BullMQ state. Back it up without deleting the live volume:

```bash
cd /opt/social-forum/current
docker compose -f deploy/social-forum/compose.yaml exec redis redis-cli BGSAVE
docker run --rm -v social_forum_redis:/data -v /opt/social-forum/backups:/backup alpine \
  tar -czf /backup/redis-$(date -u +%Y%m%d%H%M%S).tar.gz -C /data .
```

Restore only during an approved maintenance window into the existing named volume after stopping the Social Forum stack. Do not modify LogiRoute volumes or services.

## Rollback

List releases and select the previous known-good directory:

```bash
ls -1dt /opt/social-forum/releases/*
bash /opt/social-forum/current/deploy/social-forum/rollback.sh /opt/social-forum/releases/TIMESTAMP
```

Rollback changes containers and code only. It never deletes MongoDB data or the Redis volume.
