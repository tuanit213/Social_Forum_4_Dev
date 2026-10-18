# Production environment

Create `/opt/social-forum/shared/.env` on the VPS with mode `0600`. Never commit the real values.

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | yes | Newly rotated Atlas connection string for the production database |
| `JWT_SECRET` | yes | Newly generated random secret, minimum 32 characters |
| `CLIENT_ORIGIN` | yes | `https://tuanai.site,https://www.tuanai.site` |
| `DNS_SERVERS` | no | DNS resolvers for Atlas SRV resolution |
| `REDIS_CONNECT_TIMEOUT_MS` | no | Redis connection timeout |
| `REDIS_MAX_RETRIES` | no | Startup retry limit |
| `VITE_API_URL` | yes at build | `https://api.tuanai.site/api` |
| `VITE_SOCKET_URL` | yes at build | `https://api.tuanai.site` |

Generate a JWT secret on the VPS without printing it into shell history:

```bash
umask 077
JWT_SECRET=$(openssl rand -hex 48)
```

Atlas must allow the VPS egress IP `157.66.100.124/32`. Do not use `0.0.0.0/0`.
