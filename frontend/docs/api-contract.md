# Invory API contract (v1)

Base path: `/api/v1`. JSON request and response bodies use camelCase. IDs are opaque strings; clients must not infer ownership or role from them. Timestamps are UTC ISO 8601 (`2026-11-05T10:15:00.000Z`); `acquiredOn` is a `YYYY-MM-DD` date. Login and registration return a short-lived JWT `accessToken` and set a separate HttpOnly, Secure, SameSite refresh cookie named `invory_refresh`. The frontend keeps the access token in memory and sends `Authorization: Bearer <accessToken>` for protected endpoints. On reload or an expired access token it calls `POST /auth/refresh` with `credentials: include`, receives a new access token, and retries an interrupted request once. Logout revokes the refresh session and clears the cookie and in-memory token. No real token is stored in browser storage. The mock uses an opaque, memory-only demo Bearer token with the same response field and validates it against its own session map; the demo identity in `sessionStorage` only restores the selected fictional account after a reload. The real backend must never accept that demo identity as authentication.

Every list uses `page` (default 1) and `pageSize` (default 20, maximum 100) and responds with `{ "items": [...], "pagination": { "page": 1, "pageSize": 20, "totalItems": 1, "totalPages": 1 } }`. Empty lists have `totalPages: 0`. The frontend may fetch multiple pages for small selectors. Text search is case insensitive. `POST` returns 201 and the saved record, `PATCH` returns 200 and the saved record, `GET` returns 200, and membership deletion and logout return 204. Asset archival and invitation revocation return the updated record (200) so clients can show its final state.

Role is scoped to a register or subregister. `owner` applies to a register and its subregisters; `participant` and `guest` apply only to accepted subregister memberships. Register and subregister responses include `role` and `permissions`: owner `read, manage, share, decide`; participant `read, check, request`; guest `read`. A user may own one register and be a guest in another. The real backend must validate JWT signature, issuer, audience, and expiry, derive user identity from its subject, then authorize every read and write against the requested scope, including list filtering. A supplied `subregisterId` narrows reads; it never grants access. A participant or guest cannot list a whole register or read another scope by guessing an ID. Refresh cookies require server-side rotation/revocation; for cross-origin deployment configure credentialed CORS for the exact frontend origin and cookie attributes appropriate to HTTPS. Do not accept role or owner fields from the client.

## Endpoints

| Method and path | Purpose and access | Request | Success response |
|---|---|---|---|
| `POST /auth/register` | Create account; public, future real backend | JSON: required `name` (1–120), `email`, `password`; browser includes credentials for refresh cookie | 201 `Session`, sets refresh cookie |
| `POST /auth/login` | Start session; public | JSON: required `email`, `password`; browser includes credentials for refresh cookie | 200 `Session`, sets refresh cookie |
| `GET /auth/me` | Current account; authenticated | No fields | 200 `User` |
| `POST /auth/refresh` | Renew access using valid refresh cookie; no Bearer token required | No fields; browser includes credentials | 200 `Session`, rotates refresh cookie |
| `POST /auth/logout` | End session; authenticated with Bearer token | No fields; browser includes credentials | 204 empty, revokes and clears refresh cookie |
| `GET /registers` | Owned registers; owner | Pagination | 200 `List<Register>` |
| `POST /registers` | Create owned register; authenticated | Required `name` (1–100); optional `description` (0–300) | 201 `Register`; owner is session user |
| `GET /registers/{registerId}` | Owned register details; owner | Path ID | 200 `Register` |
| `PATCH /registers/{registerId}` | Edit register; owner | One or both of `name`, `description` | 200 `Register` |
| `GET /registers/{registerId}/assets` | Search/filter assets; owner or subregister member | Required `subregisterId` for non-owner; optional `search`, `status`, `location`, `custodian`, `includeArchived=true`, pagination | 200 `List<Asset>` |
| `POST /registers/{registerId}/assets` | Add canonical asset; owner | Required `name`, `inventoryNumber`, `location`, `quantity`; optional `custodian`, `acquiredOn`, `unit`, `status`, `sourceDocument` | 201 `Asset` |
| `GET /registers/{registerId}/assets/{assetId}` | Asset detail; owner or member whose subregister contains it | Non-owner requires `subregisterId` query | 200 `Asset` |
| `PATCH /registers/{registerId}/assets/{assetId}` | Edit any asset field; owner | One or more asset fields, optional `expectedVersion` | 200 `Asset` |
| `DELETE /registers/{registerId}/assets/{assetId}` | Archive asset; owner | Path IDs | 200 archived `Asset` |
| `GET /registers/{registerId}/subregisters` | List child scopes; owner | Pagination | 200 `List<Subregister>` |
| `POST /registers/{registerId}/subregisters` | Create child scope; owner | Required `name` (1–100) | 201 `Subregister` |
| `GET /registers/{registerId}/subregisters/{subregisterId}` | Scope details; owner or member | Path IDs | 200 `Subregister` |
| `PATCH /registers/{registerId}/subregisters/{subregisterId}` | Rename scope or replace its asset selection; owner | `name` and/or `assetIds` (array of existing parent asset IDs), optional `expectedVersion` | 200 `Subregister` |
| `GET /registers/{registerId}/subregisters/{subregisterId}/invitations` | List links; owner | Pagination | 200 `List<Invitation>` |
| `POST /registers/{registerId}/subregisters/{subregisterId}/invitations` | Generate link; owner | Required `role` (`participant` or `guest`), future UTC `expiresAt` | 201 `Invitation` |
| `DELETE /invitations/{invitationId}` | Revoke link; owner of linked register | Path ID | 200 `Invitation` with `revokedAt` |
| `POST /invitations/{token}/accept` | Accept link as current account; authenticated | Opaque token in path; empty request | 200 accessible `Subregister` |
| `GET /invited-scopes` | List accepted subregisters; participant or guest | Pagination | 200 `List<Subregister>` |
| `GET /registers/{registerId}/subregisters/{subregisterId}/memberships` | List members; owner | Pagination | 200 `List<Membership>` |
| `PATCH /registers/{registerId}/subregisters/{subregisterId}/memberships/{userId}` | Change member role; owner | Required `role` (`participant` or `guest`) | 200 `Membership` |
| `DELETE /registers/{registerId}/subregisters/{subregisterId}/memberships/{userId}` | Remove access; owner | Path IDs | 204 empty |
| `GET /requests` | Incoming owner requests or own participant submissions | Required `view=incoming\|submitted` (defaults incoming); optional `registerId`, `subregisterId`, `status`, pagination | 200 `List<ChangeRequest>` |
| `POST /registers/{registerId}/requests` | Submit inventory result/proposal; participant in selected scope | Required `subregisterId`, `assetId`, `assetVersion`, `kind`; required `note` for discrepancy/disposal; required `location` for location kind | 201 `ChangeRequest` |
| `PATCH /requests/{requestId}` | Decide pending request; register owner | Required `status=approved\|rejected`; `reason` required on rejection | 200 resolved `ChangeRequest` |
| `GET /registers/{registerId}/history` | Permitted history; owner or subregister member | Non-owner requires `subregisterId`; pagination | 200 `List<HistoryEvent>` |

`Asset` input limits: `name` 1–150, `inventoryNumber` 1–60, `location` 1–120, `custodian` 0–120, `unit` 0–12 (defaults `бр.`), `sourceDocument` 0–200, positive finite `quantity`. `status` is `Активен`, `За ремонт`, or `Бракуван`; new assets default to `Активен`. Inventory numbers are unique case insensitively within a register, including archived records. `PATCH` accepts the same editable fields and rejects empty updates. `expectedVersion` guards against stale edits (`409 STALE_RECORD`). Subregister `assetIds` is a set of references to the parent register's assets; no asset is copied. The server rejects foreign, unknown, or duplicate IDs. Archived assets already selected can remain referenced for history, while default asset lists exclude them.

`kind` is `present`, `missing`, `location`, or `disposal`. `present` records a completed inventory check with status `approved`, `decidedAt=createdAt`, `decidedBy=null`, and no canonical asset change. Other kinds start `pending`. The participant submits the current `assetVersion`; the server snapshots `originalLocation`, `originalStatus`, and `originalAssetVersion`. A pending duplicate from the same participant, asset, subregister, and kind returns 409. Approval requires the asset still has its snapshotted version, is not archived, and remains selected. For `location` it sets `asset.location`; for `disposal` it sets `asset.status` to `Бракуван`. For `missing`, approval acknowledges the discrepancy without altering the asset. Rejection leaves the asset unchanged. The decision, optional asset edit, and generated history are one transaction. A second decision returns 409 and cannot apply twice. History is written by these operations; there is no history-create endpoint.

The invitation token is an opaque secret that identifies stored role, scope, expiry, and revocation state. The URL contains only the token (`#accept/{token}` in this frontend); URL query changes cannot alter rights. Acceptance requires authentication. The same user can accept an active token again without changing an administrator's subsequent role edit. If that user's membership was removed, the old token cannot restore it. Revocation stops future acceptance; it does not remove already accepted memberships. The administrator removes those through memberships. Links can be accepted by more than one account until expiry/revocation. The token must be generated with cryptographic randomness and protected in logs and analytics.

Provisional removal policy: `DELETE` archives an asset (`archivedAt` UTC timestamp) and retains its record, subregister references, requests, and history. Approved disposal is the retained status `Бракуван`; it is not archival. This may be refined with the backend team before production data migration.

## Exact response examples

`User` and `Session`:

```json
{"id":"accounting","name":"Елена · Счетоводство","email":"elena@example.test"}
```

```json
{"user":{"id":"accounting","name":"Елена · Счетоводство","email":"elena@example.test"},"accessToken":"eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJhY2NvdW50aW5nIn0.signature","expiresAt":"2026-11-05T10:45:00.000Z"}
```

`Register` from create/get/update/list item:

```json
{"id":"reg_42","name":"Лаборатория","description":"Етаж 2","owner":{"id":"accounting","name":"Елена · Счетоводство","email":"elena@example.test"},"assetCount":1,"role":"owner","permissions":["read","manage","share","decide"],"createdAt":"2026-11-05T10:00:00.000Z","updatedAt":"2026-11-05T10:00:00.000Z"}
```

`Asset` from create/get/update/archive/list item:

```json
{"id":"asset_8","registerId":"reg_42","name":"Монитор Dell 24″","inventoryNumber":"INV-008","location":"Каб. 302","custodian":"Иван","acquiredOn":"2026-10-01","unit":"бр.","quantity":1,"status":"Активен","sourceDocument":"Протокол 12","archivedAt":null,"version":1,"createdAt":"2026-11-05T10:01:00.000Z","updatedAt":"2026-11-05T10:01:00.000Z"}
```

`Subregister` from create/get/update/invited/list item:

```json
{"id":"sub_5","registerId":"reg_42","name":"Каб. 302","assetIds":["asset_8"],"version":2,"createdAt":"2026-11-05T10:02:00.000Z","updatedAt":"2026-11-05T10:03:00.000Z","registerName":"Лаборатория","memberCount":1,"role":"participant","permissions":["read","check","request"]}
```

`Invitation` from generation/list/revocation. The client builds the share URL from `token`; `acceptedBy` is private and never returned:

```json
{"id":"invite_7","registerId":"reg_42","subregisterId":"sub_5","role":"participant","token":"opaque-random-token","expiresAt":"2026-11-12T10:00:00.000Z","revokedAt":null,"createdAt":"2026-11-05T10:04:00.000Z"}
```

`Membership` from list/update:

```json
{"subregisterId":"sub_5","role":"guest","createdAt":"2026-11-05T10:05:00.000Z","user":{"id":"viewer","name":"Мария · Преглед","email":"maria@example.test"}}
```

`ChangeRequest` from submission/list/decision:

```json
{"id":"req_9","registerId":"reg_42","subregisterId":"sub_5","assetId":"asset_8","kind":"location","note":"Преместен при инвентаризация","location":"Каб. 303","originalLocation":"Каб. 302","originalStatus":"Активен","originalAssetVersion":1,"status":"pending","reason":"","createdAt":"2026-11-05T10:06:00.000Z","decidedAt":null,"register":{"id":"reg_42","name":"Лаборатория"},"subregister":{"id":"sub_5","name":"Каб. 302"},"asset":{"id":"asset_8","name":"Монитор Dell 24″","inventoryNumber":"INV-008"},"requester":{"id":"custodian","name":"Иван · МОЛ","email":"ivan@example.test"},"decidedBy":null}
```

`HistoryEvent` from history list:

```json
{"id":"event_10","registerId":"reg_42","subregisterId":"sub_5","assetId":"asset_8","at":"2026-11-05T10:07:00.000Z","title":"Одобрена заявка","details":"Промяна на местоположение · Монитор Dell 24″","actor":{"id":"accounting","name":"Елена · Счетоводство","email":"elena@example.test"}}
```

For any list, wrap these records as `items` and include `pagination`. Optional values are present as `null` (timestamps, `acquiredOn`, history IDs) or `""` (descriptions, notes, reason) as shown; this avoids response shape changes between operations.

## Errors

Every error returns `{ "error": { "code": "...", "message": "Bulgarian user-facing text", "fields": {}, "traceId": "opaque-id" } }`. Validation uses `fields` as a map from field name to an array of messages, for example:

```json
{"error":{"code":"DUPLICATE_INVENTORY_NUMBER","message":"В този регистър вече има актив с този инвентарен номер.","fields":{"inventoryNumber":["Номерът вече се използва."]},"traceId":"trace_123"}}
```

Relevant codes: 400 `INVALID_JSON`; 401 `LOGIN_REQUIRED` or `INVALID_CREDENTIALS` for login failure; 403 `FORBIDDEN`; 404 `NOT_FOUND`; 409 `DUPLICATE_INVENTORY_NUMBER`, `DUPLICATE_REQUEST`, `STALE_RECORD`, `INVALID_TRANSITION`, `ASSET_ARCHIVED`, `ASSET_UNAVAILABLE`; 410 `INVITATION_UNAVAILABLE`; 422 `VALIDATION_ERROR`. Mock login accepts only the three fictional `.test` accounts with the demo password `demo`; mock registration returns 501 `NOT_IMPLEMENTED` until the real backend is connected. All authenticated endpoints can return 401, scoped operations can return 403/404, writes can return 422, and conflicting writes can return 409. See `openapi.yaml` for the response mapping on each operation.
