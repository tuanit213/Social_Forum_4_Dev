# Week 1 Test Plan

## Backend

- Install dependencies with `npm ci`.
- Parse every backend JavaScript file with `node --check`.
- Run `npm test` against isolated MongoDB and Redis test services.
- Run `npm audit` without exposing environment values.
- Exercise profile pagination, validation, ownership, follow edge cases, auth intent, feed, post, reaction, comment, search, Socket.IO, and chat regression paths.

## Frontend

- Install dependencies with `npm ci`.
- Run `npm run lint`.
- Run `NODE_OPTIONS=--max-old-space-size=4096 npm run build`.
- Run `npm audit`.
- Run authenticated profile smoke checks at 375, 768, and 1440 pixels, including mobile menu behavior and overflow detection.

## Repository hygiene

- Confirm `Backend/.env` exists locally, is ignored, and is not tracked.
- Confirm no `node_modules` path is tracked.
- Confirm generated graph, Playwright, and screenshot output is ignored.
- Run `git diff --check` before commit.

## Acceptance matrix

| ID | Scenario | Result |
| --- | --- | --- |
| T01 | Clean setup and health foundation | PASS |
| T02 | Register, login, refresh, signout | PASS |
| T03 | Owner edit and visitor authorization | PASS |
| T04 | Save profile and reload | PASS |
| T05 | Unknown user, invalid input, and UI fallback | PASS |
| T06 | Follow, unfollow, self-follow, and repeated requests | PASS |
| T07 | Followers/following bounded pagination | PASS |
| T08 | Empty, loading, error, disabled, and retry states | PASS |
| T09 | Responsive shell and mobile navigation | PASS |
| T10 | Session isolation and unauthorized mutations | PASS |
| T11 | Feed, Search, Socket.IO, and Chat regression | PASS |
| T12 | Docs, syntax, tests, lint, build, PR, and CI | PASS on PR #2 CI run 37205886587 |
