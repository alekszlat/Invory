# How the Invory website talks to its server

This guide explains every message the Invory website can send to its server and what the server must answer.

There is also a second file, [openapi.yaml](openapi.yaml). It says the same things in a strict format that software tools can read.

## Words you will see

| Word | What it means |
|---|---|
| **Account** | One person's profile: name, email, and password. |
| **Register** | A list of an organisation's assets, such as "Laboratory". The person who creates it is its administrator. |
| **Asset** | One item in a register, such as a monitor. |
| **Inventory number** | The number written on the item itself, such as `INV-008`. A person types it in. |
| **Asset ID** | The number the server gives each asset: 1, 2, 3, and so on. Nobody types it in. It is how the website and server refer to an asset. |
| **Subregister** | A hand-picked part of a register, such as "Room 302". The assets are not copied. It is more like a shortcut to some of them. |
| **Member** | Someone who accepted an invitation to a subregister. |
| **Invitation link** | A secret web link that lets a person join a subregister. |
| **Request** | A member's report about an asset: it is there, it is missing, it has moved, or it should be written off. |
| **Writing off** | Declaring an asset no longer usable. The word on screen is `Бракуван`. |
| **Archiving** | Taking an asset out of everyday lists while keeping its record. Nothing is truly deleted. |
| **History** | The automatic log of what happened and who did it. |
| **Login pass** | A temporary pass the website shows with every message to prove who is asking. It lasts about 30 minutes. Programmers call it an *access token*. |
| **Remember-me cookie** | A small hidden note kept by the browser. It lets the website get a new login pass without asking for the password again. |

## Who is allowed to do what

Everyone starts as a normal account. A person's role depends on the register or subregister they are looking at, so the same person can be the administrator of one register and a guest in another.

| Role | Where it applies | What they can do | Name in the data |
|---|---|---|---|
| **Administrator** | A register and all its subregisters | See and change everything, share access, approve or reject requests | `owner` |
| **Participant** | Only the subregisters they joined | See the assets, check them, send requests | `participant` |
| **Guest** | Only the subregisters they joined | Look and search, nothing else | `guest` |

The server tells the website the person's role with each register and subregister. The role alone decides what they can do.

## How a message is put together

Each message has three parts, a bit like a letter.

**1. The kind of action.** There are only four:

| Word | Meaning |
|---|---|
| `GET` | Show me something. Nothing changes. |
| `POST` | Create something, or do something. |
| `PATCH` | Change part of something that exists. |
| `DELETE` | Remove something. For assets and links this keeps the record and only marks it as archived or cancelled. |

**2. The address.** It says what the message is about. Every address begins with `/api/v1`. Parts in curly brackets are filled in each time, so `/registers/{registerId}/assets/{assetId}` might really be `/api/v1/registers/reg_42/assets/8`.

**3. The contents (only when needed).** Information travels as a simple labelled list called JSON. Each label is written in `camelCase`, meaning words joined together with capitals inside:

```json
{ "name": "Лаборатория", "description": "Етаж 2" }
```

## Rules every message follows

- **Long lists come in pages**, like a book. The website can ask for `page` (starts at 1) and `pageSize` (20 if not given, 100 at most). Every list answer has this shape, and an empty list has `totalPages: 0`:

  ```json
  { "items": [], "pagination": { "page": 1, "pageSize": 20, "totalItems": 0, "totalPages": 0 } }
  ```

- **Times** are in UTC and look like `2026-11-05T10:15:00.000Z`. The date an asset was acquired (`acquiredOn`) is only a date: `2026-10-01`.
- **Empty values are always sent, never left out.** An empty text is `""`. A missing date or link to another record is `null`.
- **Asset IDs are plain numbers** (1, 2, 3) with no quotation marks. They are shared across all registers, so register A may have assets 1 and 3 while register B has asset 2. Every other ID, such as a register's or a person's, is a piece of text that the website only passes along. Nobody should try to work out meaning from an ID.
- **Searching** ignores capital and small letters.
- **Success numbers.** Each answer starts with a number: `200` means done, `201` means created, and `204` means done with nothing to send back. Failures are listed in [When something goes wrong](#when-something-goes-wrong).

## All the messages

"Member" below means a participant or guest of that subregister. "Logged in" means anyone with a valid login pass.

### Accounts and logging in

| What it does | Message | Who can use it | What the website sends | What comes back |
|---|---|---|---|---|
| Create an account and log in | `POST /auth/register` | Anyone | `name` (up to 120 letters), `email`, `password` (8 to 200 characters) | `201`, Session |
| Log in | `POST /auth/login` | Anyone | `email`, `password` | `200`, Session |
| Get a new login pass | `POST /auth/refresh` | Anyone with a valid remember-me cookie | Nothing; the browser includes the cookie | `200`, Session, and a fresh cookie |
| Log out | `POST /auth/logout` | Logged in | Nothing | `204`, and the cookie is cancelled |

### Registers

| What it does | Message | Who can use it | What the website sends | What comes back |
|---|---|---|---|---|
| List my registers | `GET /registers` | Logged in; shows only the ones they run | Page numbers | `200`, list of Registers, each with all its subregisters inside |
| Create a register | `POST /registers` | Logged in; they become its administrator | `name` (1 to 100), optionally `description` (up to 300) | `201`, Register |
| Change a register | `PATCH /registers/{registerId}` | Administrator | `name`, `description`, or both | `200`, Register |

### Assets

| What it does | Message | Who can use it | What the website sends | What comes back |
|---|---|---|---|---|
| List and search assets | `GET /registers/{registerId}/assets` | Administrator or member | Optionally `search`, `status`, `location`, `custodian`, `includeArchived=true`, page numbers. Members must add `subregisterId` | `200`, list of Assets |
| Add an asset | `POST /registers/{registerId}/assets` | Administrator | See [the fields of an asset](#the-fields-of-an-asset) | `201`, Asset |
| See one asset | `GET /registers/{registerId}/assets/{assetId}` | Administrator, or a member whose subregister includes it. Members must add `subregisterId` | Nothing else | `200`, Asset |
| Change an asset | `PATCH /registers/{registerId}/assets/{assetId}` | Administrator | Any fields being changed, at least one | `200`, Asset |
| Archive an asset | `DELETE /registers/{registerId}/assets/{assetId}` | Administrator | Nothing | `200`, the archived Asset |

### Subregisters

| What it does | Message | Who can use it | What the website sends | What comes back |
|---|---|---|---|---|
| Create a subregister | `POST /registers/{registerId}/subregisters` | Administrator | `name` (1 to 100) | `201`, Subregister |
| Rename it, or choose its assets | `PATCH /registers/{registerId}/subregisters/{subregisterId}` | Administrator | `name`, `assetIds` (a list of asset numbers such as `[1, 2, 8]`), or both | `200`, Subregister |

### Invitations and members

| What it does | Message | Who can use it | What the website sends | What comes back |
|---|---|---|---|---|
| List a subregister's links | `GET /registers/{registerId}/subregisters/{subregisterId}/invitations` | Administrator | Page numbers | `200`, list of Invitations |
| Make a new link | `POST /registers/{registerId}/subregisters/{subregisterId}/invitations` | Administrator | `role` (`participant` or `guest`), `expiresAt` (a future time) | `201`, Invitation |
| Cancel a link | `DELETE /invitations/{invitationId}` | Administrator of that register | Nothing | `200`, Invitation showing when it was cancelled |
| Accept a link | `POST /invitations/{token}/accept` | Logged in | Nothing; the secret code is in the address | `200`, the Subregister they joined |
| List subregisters I joined | `GET /invited-scopes` | Logged in | Page numbers | `200`, list of Subregisters |
| List the members | `GET /registers/{registerId}/subregisters/{subregisterId}/memberships` | Administrator | Page numbers | `200`, list of Memberships |
| Change a member's role | `PATCH /registers/{registerId}/subregisters/{subregisterId}/memberships/{userId}` | Administrator | `role` (`participant` or `guest`) | `200`, Membership |
| Remove a member | `DELETE /registers/{registerId}/subregisters/{subregisterId}/memberships/{userId}` | Administrator | Nothing | `204` |

### Requests

| What it does | Message | Who can use it | What the website sends | What comes back |
|---|---|---|---|---|
| List requests | `GET /requests` | Logged in; shows requests for the registers they run and requests they sent themselves, in one list | Optionally `registerId`, `subregisterId`, `status`, page numbers | `200`, list of Requests |
| Send a check or request | `POST /registers/{registerId}/requests` | Participant of that subregister | `subregisterId`, `assetId` (a number), `kind`, plus `note` and `location` where needed; see [how requests work](#how-requests-work) | `201`, Request |
| Approve or reject | `PATCH /requests/{requestId}` | Administrator of that register | `status` (`approved` or `rejected`). `reason` is required when rejecting | `200`, the decided Request |

### History

| What it does | Message | Who can use it | What the website sends | What comes back |
|---|---|---|---|---|
| Read the log | `GET /registers/{registerId}/history` | Administrator or member. Members must add `subregisterId` | Page numbers | `200`, list of History Events |

## The rules behind the messages

### The fields of an asset

| Field | What it is | Required? | Limits |
|---|---|---|---|
| `name` | What the item is called | Yes | 1 to 150 characters |
| `inventoryNumber` | The number on the item | Yes | 1 to 60 characters |
| `location` | Where it is | Yes | 1 to 120 characters |
| `quantity` | How many | Yes | A number above zero |
| `custodian` | Who is responsible for it | No | Up to 120 characters |
| `acquiredOn` | When it was acquired | No | A date, or `null` |
| `unit` | Measured in what | No | Up to 12 characters; `бр.` if left empty |
| `status` | Its condition | No | `Активен` (in use, the default), `За ремонт` (for repair), or `Бракуван` (written off) |
| `sourceDocument` | The paper that backs it up | No | Up to 200 characters |

- Two assets in the same register can never share an inventory number, and capital letters do not make a number different. Archived assets still count.
- A change with no fields in it is refused.

### How subregisters work

A subregister only points at assets from its parent register. The server refuses a list containing an asset from another register, an asset that does not exist, or the same asset twice. An asset that was already chosen and later archived may stay in the list so that its history still makes sense, but normal asset lists hide archived assets.

### How requests work

The `kind` says what the participant found:

| `kind` | Meaning | Needs a `note`? | Needs a `location`? | What happens if approved |
|---|---|---|---|---|
| `present` | "It's here" | No | No | No approval needed. It is recorded straight away as `approved`, with the decision time the same as the creation time and no decider. The asset does not change. |
| `missing` | "I can't find it" | Yes | No | The administrator acknowledges it. The asset does not change. |
| `location` | "It has moved" | Yes | Yes, and it must differ from the current place | The asset's location is updated. |
| `disposal` | "It should be written off" | Yes | No | The asset's status becomes `Бракуван`. It stays in the register. |

Every kind except `present` starts as `pending` (waiting).

- When a request arrives, the server notes the asset's location and status at that moment (`originalLocation`, `originalStatus`) so the administrator can see what it was.
- A person cannot send the same kind of request about the same asset in the same subregister while an earlier one is still waiting.
- A request cannot be sent about an asset that is archived or written off.
- Approval is refused if the asset has since been archived, written off, or removed from the subregister.
- Rejecting a request leaves the asset exactly as it was.
- A decision can only be made once.
- The decision, any change to the asset, and the history entry must be saved together. Either all three happen or none do.
- Nobody can add to the history by hand. It is written only by the actions above.

### How invitation links work

- The link holds only a long secret code (`#accept/{token}` on the website). The role, the subregister, and the end date are stored on the server, so changing anything in the link cannot give someone more rights.
- A person must be logged in to accept. They can create an account on the same page.
- Several people can use the same link until it ends or is cancelled.
- Using a link again does not undo a role the administrator has since changed.
- A person who was removed cannot get back in with an old link. They need a new one.
- Cancelling a link only stops future use. People who already joined stay until the administrator removes them.

### Archiving and writing off

`DELETE` on an asset only archives it: it records the time in `archivedAt` and keeps the asset, its place in subregisters, its requests, and its history. Writing off is different: the asset stays in place with the status `Бракуван`. This behaviour is provisional and may be refined with the team building the server.

## What each record looks like

These are exact examples of what the server sends back. In a list, they appear inside `items`.

**User**, used anywhere a person is shown:

```json
{"id":"user_12","name":"Елена Петрова","email":"elena@example.test"}
```

**Session**, the answer to logging in or signing up. `accessToken` is the login pass:

```json
{"user":{"id":"user_12","name":"Елена Петрова","email":"elena@example.test"},"accessToken":"eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ1c2VyXzEyIn0.signature","expiresAt":"2026-11-05T10:45:00.000Z"}
```

**Register**. Its subregisters come inside it, so the website does not have to ask for them separately:

```json
{"id":"reg_42","name":"Лаборатория","description":"Етаж 2","owner":{"id":"user_12","name":"Елена Петрова","email":"elena@example.test"},"assetCount":1,"role":"owner","subregisters":[{"id":"sub_5","registerId":"reg_42","name":"Каб. 302","assetIds":[8],"createdAt":"2026-11-05T10:02:00.000Z","updatedAt":"2026-11-05T10:03:00.000Z","registerName":"Лаборатория","memberCount":1,"role":"owner"}],"createdAt":"2026-11-05T10:00:00.000Z","updatedAt":"2026-11-05T10:00:00.000Z"}
```

**Asset**. Notice that `id` is a plain number:

```json
{"id":8,"registerId":"reg_42","name":"Монитор Dell 24″","inventoryNumber":"INV-008","location":"Каб. 302","custodian":"Иван","acquiredOn":"2026-10-01","unit":"бр.","quantity":1,"status":"Активен","sourceDocument":"Протокол 12","archivedAt":null,"createdAt":"2026-11-05T10:01:00.000Z","updatedAt":"2026-11-05T10:01:00.000Z"}
```

**Subregister**:

```json
{"id":"sub_5","registerId":"reg_42","name":"Каб. 302","assetIds":[8],"createdAt":"2026-11-05T10:02:00.000Z","updatedAt":"2026-11-05T10:03:00.000Z","registerName":"Лаборатория","memberCount":1,"role":"participant"}
```

**Invitation**. The website builds the link from `token`:

```json
{"id":"invite_7","registerId":"reg_42","subregisterId":"sub_5","role":"participant","token":"long-random-secret-code","expiresAt":"2026-11-12T10:00:00.000Z","revokedAt":null,"createdAt":"2026-11-05T10:04:00.000Z"}
```

**Membership**:

```json
{"subregisterId":"sub_5","role":"guest","createdAt":"2026-11-05T10:05:00.000Z","user":{"id":"user_31","name":"Мария Георгиева","email":"maria@example.test"}}
```

**Request** (called `ChangeRequest` in the technical file):

```json
{"id":"req_9","registerId":"reg_42","subregisterId":"sub_5","assetId":8,"kind":"location","note":"Преместен при инвентаризация","location":"Каб. 303","originalLocation":"Каб. 302","originalStatus":"Активен","status":"pending","reason":"","createdAt":"2026-11-05T10:06:00.000Z","decidedAt":null,"register":{"id":"reg_42","name":"Лаборатория"},"subregister":{"id":"sub_5","name":"Каб. 302"},"asset":{"id":8,"name":"Монитор Dell 24″","inventoryNumber":"INV-008"},"requester":{"id":"user_20","name":"Иван Иванов","email":"ivan@example.test"},"decidedBy":null}
```

**History Event**:

```json
{"id":"event_10","registerId":"reg_42","subregisterId":"sub_5","assetId":8,"at":"2026-11-05T10:07:00.000Z","title":"Одобрена заявка","details":"Промяна на местоположение · Монитор Dell 24″","actor":{"id":"user_12","name":"Елена Петрова","email":"elena@example.test"}}
```

## When something goes wrong

Every failure has the same shape. `message` is the Bulgarian sentence shown to the person. `fields` says which box on the form was wrong. `traceId` is a reference number for finding the problem later.

```json
{"error":{"code":"DUPLICATE_INVENTORY_NUMBER","message":"В този регистър вече има актив с този инвентарен номер.","fields":{"inventoryNumber":["Номерът вече се използва."]},"traceId":"trace_123"}}
```

| Number | In plain words | `code` | When |
|---|---|---|---|
| `400` | "I can't read this message." | `INVALID_JSON` | The contents were garbled. |
| `401` | "I don't know who you are." | `LOGIN_REQUIRED` | No login pass, or it ran out. |
| | | `INVALID_CREDENTIALS` | Wrong email or password. |
| `403` | "I know you, but you can't do that." | `FORBIDDEN` | The person's role does not allow it. |
| `404` | "I can't find that." | `NOT_FOUND` | No such record. |
| `410` | "That link no longer works." | `INVITATION_UNAVAILABLE` | The link has ended or was cancelled. |
| `422` | "I understood you, but I can't accept this." | `VALIDATION_ERROR` | A field is missing, too long, or not allowed. |
| | | `EMAIL_ALREADY_REGISTERED` | Someone already signed up with this email. |
| | | `DUPLICATE_INVENTORY_NUMBER` | This inventory number is already used in the register. |
| | | `DUPLICATE_REQUEST` | The same request is already waiting. |
| | | `ASSET_ARCHIVED` | An archived asset cannot be edited. |
| | | `ASSET_UNAVAILABLE` | The asset is archived, written off, or no longer in the subregister. |
| | | `INVALID_TRANSITION` | The step does not fit: the request is already decided, an administrator is accepting a link to their own register, or a removed person is reusing an old link. |

**There are no "someone else changed this first" errors.** Only the administrator edits records, so two people can never overwrite each other's work. The last save simply stands.

## Checklist for whoever builds the server

The website depends on all of the following. The technical term is in brackets so that it can be looked up.

**Logging in**

- [ ] Give a login pass that lasts a short time (a JWT access token). The website keeps it only in memory and sends it with each message (`Authorization: Bearer <accessToken>`).
- [ ] At login and sign-up, also set the remember-me cookie named `invory_refresh`. Page scripts must not be able to read it, and it must travel only over secure connections (HttpOnly, Secure, SameSite).
- [ ] Each time the cookie is used, replace it with a new one, and make it possible to cancel it (rotation and revocation). Logging out cancels and clears it.
- [ ] When a page is reloaded or a pass runs out, the website calls `POST /auth/refresh` and retries its message once. Nothing secret is saved in browser storage.
- [ ] Store passwords only in scrambled, non-reversible form (a dedicated password hash).

**Checking every message**

- [ ] Check every login pass: signature, issuer, audience, and expiry. Work out who the person is from the pass, never from what the website says.
- [ ] Check the person's role on every read and every change, including what appears in lists.
- [ ] Sending a `subregisterId` only narrows what is shown. It never grants access. A participant or guest cannot list a whole register or reach another subregister by guessing IDs.
- [ ] Never accept a role or an owner sent by the website.

**Invitation codes**

- [ ] Create them with strong randomness (cryptographic randomness).
- [ ] Keep them out of logs and analytics.

**If the website and server live at different addresses**

- [ ] Allow exactly the website's address, with credentials (credentialed CORS), and set the cookie options to suit HTTPS.

**Assets**

- [ ] Number new assets with whole numbers that go up by one and are never reused (an identity column).

## Testing the website before the server exists

Until the real server is ready, the website carries a small stand-in server that runs inside the browser. It answers all the messages above and saves its data in that browser only. Anyone can sign up with made-up details. How to run it is explained in the [README](../README.md).

The stand-in's login passes and its "remembered user" marker exist only for testing. The real server must never accept them as proof of who someone is.
