# API Conventions

## Authentication

- Access token: `Authorization: Bearer <token>`.
- Refresh and signout use the `HttpOnly` refresh cookie plus `X-CSRF-Intent: auth`.
- Admin routes require a valid access token and `ADMIN` or `SUPER_ADMIN` role.

## Responses

Successful responses preserve existing resource keys such as `post`, `comment`, `conversation`, and `user`.
New validation and error responses use:

```json
{
  "success": false,
  "message": "...",
  "errors": [{ "field": "body.title", "message": "..." }]
}
```

## Status codes

- `200`: successful read/update/delete.
- `201`: resource created.
- `400`: malformed input or invalid ID.
- `401`: missing or invalid authentication.
- `403`: authenticated but not authorized.
- `404`: resource not found.
- `409`: duplicate resource.
- `503`: required runtime dependency unavailable.
- `500`: unexpected server error.

## Validation and authorization

Validate body and Mongo IDs at route boundaries. Controllers must still enforce ownership and participant checks against the database. Client-supplied sender IDs are ignored for Socket.IO messages.

## Pagination

Paginated endpoints use positive `page` and bounded `limit`; responses expose `pagination` where already supported.

## Naming

Use resource nouns in route paths and HTTP methods for the action. Keep existing paths for compatibility.
