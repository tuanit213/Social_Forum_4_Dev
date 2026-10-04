# Backend Architecture

Backend uses Express, Mongoose, Socket.IO, Redis, and BullMQ.

## Runtime flow

1. `server.js` loads environment configuration.
2. MongoDB connects.
3. Redis connects and responds to `PING`.
4. BullMQ queue and feed worker start.
5. HTTP and Socket.IO start listening.

Startup fails when a required dependency fails. Shutdown stops Socket.IO before HTTP, then closes the worker, queue, Redis, and MongoDB.

## Layers

- `routes/`: route and request-boundary validation.
- `middlewares/`: authentication, admin authorization, validation, and errors.
- `controllers/`: REST resource operations.
- `models/`: Mongoose schemas and indexes.
- `config/`: MongoDB, Redis, and BullMQ lifecycle.
- `workers/`: asynchronous feed ranking jobs.
- `server.js`: process lifecycle and Socket.IO authorization.
- `app.js`: testable Express application and health endpoints.

## Health

- `GET /health/live`: process liveness only.
- `GET /health/ready`: MongoDB, Redis, BullMQ queue, and worker readiness.
