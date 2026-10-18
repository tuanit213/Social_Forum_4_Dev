# VPS deployment architecture

## Topology

- `tuanai.site` and `www.tuanai.site` terminate TLS at the host Nginx and proxy to the frontend container on `127.0.0.1:18080`.
- `api.tuanai.site` terminates TLS at the host Nginx and proxies HTTP and Socket.IO to the backend container on `127.0.0.1:15000`.
- The backend and Redis share the private `social-forum` Compose network. Redis is not published to the host or Internet.
- MongoDB remains in Atlas. Only the backend receives `MONGODB_URI` through `/opt/social-forum/shared/.env`.
- LogiRoute and ShopeeFood remain in their existing directories, services, and Nginx virtual hosts.

## Resource policy

The VPS has 1 vCPU and about 1 GB RAM, so the stack uses one backend process, one embedded BullMQ worker, one Redis instance, and a static Nginx frontend. Compose limits are 320 MB for the backend, 128 MB for Redis, and 64 MB for the frontend. A 2 GB swap file is created only when the VPS has no active swap.

Redis uses AOF persistence with `appendfsync everysec` and `maxmemory-policy noeviction`, as required for BullMQ correctness. The backend starts exactly one feed worker with concurrency `1`.

## Domain records

After the domain suspension is resolved, configure these records while preserving unrelated MX/TXT records:

| Type | Host | Value |
| --- | --- | --- |
| A | `@` | `157.66.100.124` |
| A | `www` | `157.66.100.124` |
| A | `api` | `157.66.100.124` |

Issue TLS only after public DNS resolves to the VPS:

```bash
certbot --nginx -d tuanai.site -d www.tuanai.site -d api.tuanai.site
certbot renew --dry-run
```

## Authentication boundary

- Access tokens remain in frontend memory.
- Refresh tokens remain in a `Secure`, `HttpOnly`, `SameSite=Strict` cookie scoped to `/api/auth` on `api.tuanai.site`.
- Credentialed CORS accepts only `https://tuanai.site` and `https://www.tuanai.site` in production.
- Refresh and sign-out require `X-CSRF-Intent: auth` and an allowed `Origin`.
- Express trusts only the first reverse proxy hop in production.
