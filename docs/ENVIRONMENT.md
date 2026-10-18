# Environment Variables

Required for a running backend:

- `MONGODB_URI`: Atlas or local MongoDB connection string.
- `JWT_SECRET`: signing secret. Production requires at least 32 characters.
- `REDIS_URL`, or `REDIS_HOST` plus `REDIS_PORT`: Redis connection.

Optional:

- `PORT`: HTTP port, default `5000`.
- `NODE_ENV`: `development`, `test`, or `production`.
- `CLIENT_ORIGIN`: comma-separated allowed browser origins.
- `DNS_SERVERS`: comma-separated DNS servers for MongoDB SRV resolution.
- `REDIS_PASSWORD`: Redis password.
- `REDIS_DB`: Redis logical database, default `0`.
- `REDIS_CONNECT_TIMEOUT_MS`: Redis connection timeout, default `5000`.
- `REDIS_MAX_RETRIES`: capped Redis reconnect attempts, default `10`.
- `FEED_WORKER_CONCURRENCY`: BullMQ worker concurrency, default `2`.

Development can use local MongoDB and Redis. Production should use managed MongoDB/Redis over TLS where supported, secret-manager backed values, and an explicit `CLIENT_ORIGIN` allowlist.
