# Development Setup

## Requirements

- Node.js 20+
- npm 10+
- MongoDB Atlas or local MongoDB
- Redis 6+

## Install

```powershell
git clone https://github.com/tuanit213/Social_Forum_4_Dev.git
cd Social_Forum_4_Dev
cd Backend
npm ci
cd ..\Frontend
npm ci
```

## Configure

```powershell
Copy-Item Backend\.env.example Backend\.env
```

Set a real `MONGODB_URI`, Redis settings, and a random `JWT_SECRET` in `Backend/.env`.
Never commit `Backend/.env`.

## Run

Start Redis first, then run each app in its own terminal:

```powershell
cd Backend
npm run dev
```

```powershell
cd Frontend
npm run dev
```

Backend checks:

```powershell
Invoke-RestMethod http://localhost:5000/health/live
Invoke-RestMethod http://localhost:5000/health/ready
```

`/health/ready` returns HTTP 503 until MongoDB, Redis, BullMQ queue, and worker are ready.

## Test

```powershell
cd Backend
npm test
npm run syntax
```
