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
| Backend image build | PASS - production dependencies report 0 advisories |
| Frontend container | PASS - healthy on `127.0.0.1:18080` |
| Redis container | PASS - healthy, AOF enabled, `noeviction`, no public port |
| Nginx virtual hosts | PASS - config valid and reloaded without replacing existing sites |
| Frontend Host smoke | PASS - `Host: tuanai.site` returns HTTP 200 |
| SPA reload smoke | PASS - `/profile` returns HTTP 200 through the host proxy |
| Existing LogiRoute services | PASS - all five remain active after deployment |
| Isolated stack restart | PASS - frontend and Redis recovered healthy; Redis returned `PONG` and AOF status remained `ok` |
| Post-fix Redis log | PASS - no memory-overcommit warning after restart |
| Backend container | BLOCKED - image built but container intentionally not started without a rotated Atlas URI |
| HTTPS | BLOCKED - domain suspension and incorrect DNS prevent certificate issuance |

## External blockers

- `tuanai.site` and `api.tuanai.site` currently resolve to `127.0.0.1` through `verification-hold.suspended-domain.com`. HTTPS issuance and real public routing are blocked until the domain is restored and DNS records are changed.
- A newly rotated MongoDB Atlas URI has not been supplied. The old URI is intentionally not used. Atlas must allow `157.66.100.124/32`.
- End-to-end production auth, feed, chat, and BullMQ verification remains blocked until Atlas connectivity is configured.
