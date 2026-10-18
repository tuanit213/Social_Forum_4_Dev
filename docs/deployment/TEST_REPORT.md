# Deployment verification report

Date: 2026-10-18

## Local verification

| Gate | Result |
| --- | --- |
| Backend install | PASS |
| Backend syntax | PASS |
| Backend tests | PASS - 12/12 |
| Backend production dependency audit | PASS - 0 advisories |
| Frontend install | PASS |
| Frontend lint | PASS with existing warnings, exit code 0 |
| Frontend production build | PASS |
| Frontend audit | REVIEW - build-time dependency advisories remain; no blind force upgrade applied |

## VPS discovery

| Check | Result |
| --- | --- |
| OS | Ubuntu 24.04.5 LTS |
| Capacity | 1 vCPU, about 1 GB RAM, 16 GB disk |
| Existing services | Nginx, five LogiRoute services, ShopeeFood static site |
| Existing listeners | Nginx 80/443; LogiRoute services bound to loopback |
| Isolation | Social Forum uses `/opt/social-forum`, Compose project `social-forum`, loopback ports 15000/18080, and named volume `social_forum_redis` |

## VPS deployment state

| Gate | Result |
| --- | --- |
| Docker Engine / Compose | PASS - Docker 29.1.3, Compose 2.40.3 |
| Swap | PASS - 2 GB active |
| Redis host kernel setting | PASS - `vm.overcommit_memory=1`, persisted in `/etc/sysctl.d/99-social-forum-redis.conf` |
| Frontend image build | PASS |
| Backend image build | PASS - production dependencies report 0 advisories; application files are owned by the non-root `node` user |
| Frontend container | PASS - healthy on `127.0.0.1:18080` |
| Redis container | PASS - healthy, AOF enabled, `noeviction`, no public port |
| Backend container | PASS - healthy on `127.0.0.1:15000` |
| Atlas connectivity | PASS - dedicated production user, VPS IP allowlisted, database state ready |
| Backend readiness | PASS - MongoDB, Redis, BullMQ queue, and BullMQ worker are ready |
| Nginx virtual hosts | PASS - config valid and reloaded without replacing existing sites |
| Public DNS | PASS - root, `www`, and `api` resolve through Cloudflare to the VPS |
| HTTP redirect | PASS - `http://tuanai.site/login` returns HTTP 301 to HTTPS |
| Frontend HTTPS smoke | PASS - root and `www` return HTTP 200 |
| SPA reload smoke | PASS - a deep application route returns HTTP 200 |
| Public API liveness | PASS - `https://api.tuanai.site/health/live` returns HTTP 200 |
| Public API readiness | PASS - `https://api.tuanai.site/health/ready` returns HTTP 200 |
| Database-backed API smoke | PASS - invalid sign-in reaches Atlas-backed auth and returns the expected HTTP 401 |
| Production CORS | PASS - allows `https://tuanai.site` with credentials |
| TLS | PASS - Let's Encrypt certificate installed for root, `www`, and `api`; expires 2027-01-16 |
| Social Forum renewal dry-run | PASS |
| LogiRoute IP certificate renewal dry-run | PASS with its dedicated Certbot 5.8 timer |
| Existing LogiRoute services | PASS - all five remain active after deployment |
| Isolated stack restart | PASS - frontend, backend, and Redis recovered healthy; Redis returned `PONG` and AOF status remained `ok` |
| Post-fix Redis log | PASS - no memory-overcommit warning after restart |

## Production notes

- Secrets are stored only in `/opt/social-forum/shared/.env` with mode `600`; they are not committed to Git.
- The shared VPS keeps separate certificate renewal paths: the system Certbot manages Social Forum domains, while LogiRoute's dedicated Certbot 5.8 timer manages its short-lived IP certificate.
- Cloudflare proxying is enabled for root, `www`, and `api`.
