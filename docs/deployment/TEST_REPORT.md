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

## External blockers

- `tuanai.site` and `api.tuanai.site` currently resolve to `127.0.0.1` through `verification-hold.suspended-domain.com`. HTTPS issuance and real public routing are blocked until the domain is restored and DNS records are changed.
- A newly rotated MongoDB Atlas URI has not been supplied. The old URI is intentionally not used. Atlas must allow `157.66.100.124/32`.
- End-to-end production auth, feed, chat, and BullMQ verification remains blocked until Atlas connectivity is configured.
