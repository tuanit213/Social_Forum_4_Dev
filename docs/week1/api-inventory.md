# Week 1 API Inventory

## Profile and follow endpoints

| Endpoint | Auth | Behavior | Verification |
| --- | --- | --- | --- |
| `GET /api/users/profile` | Bearer token | Returns the current profile. | Backend foundation tests |
| `GET /api/users/me/dashboard` | Bearer token | Loads the editable dashboard profile. | Profile reload test |
| `PUT /api/users/me/dashboard` | Bearer token | Validates and persists dashboard fields. | Invalid-field and persistence tests |
| `GET /api/users/profile/:username` | Bearer token | Loads a public profile and follow metadata. | Authenticated UI smoke |
| `PUT /api/users/profile/:username/follow` | Bearer token | Follows or unfollows a different user and returns `followersCount`. | Edge-case and real runtime smoke |
| `GET /api/users/profile/followers` | Bearer token | Returns paginated follower records. | Page and limit tests |
| `GET /api/users/profile/following` | Bearer token | Returns paginated following records. | Page and limit tests |

## Contract notes

Pagination normalizes invalid page values to `1`, invalid limits to `20`, and caps limits at `50`. Profile update validation rejects unknown fields. Self-follow, unknown profiles, and unauthenticated dashboard access return error statuses instead of mutating state.
