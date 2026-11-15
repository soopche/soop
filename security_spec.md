# Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Strict Ownership & Identity Integrity (`/users/{userId}/characters/{characterId}`)**:
   - Every character document belongs exclusively to `request.auth.uid == userId`.
   - `data.ownerId == request.auth.uid && data.ownerId == userId && data.id == characterId`.
   - Verified email (`request.auth.token.email_verified == true`) is required for writes.
2. **Player Code Profiles (`/player_profiles/{profileId}`)**:
   - Direct document reads (`get`) and writes require valid `profileId` (`^[a-zA-Z0-9_\-]+$`, `1..64`), strict schema validation, bounded strings/lists, and `request.time` timestamps.
   - `allow list: if false;` prevents collection scraping.
3. **Multiplayer Rooms (`/rooms/{roomId}` & Subcollections)**:
   - Direct `get` by `roomId` (`allow list: if false;` on `/rooms/{roomId}` prevents room enumeration).
   - Every subcollection (`players`, `enemies`, `events`, `world_events`) validates `isValidCharId(roomId)` and `resource.data.roomId == roomId` on `list`, and enforces strict key allowlists (`hasAll` + `hasOnly`), numerical bounds, string length bounds, and server timestamps (`request.time`).
   - Events in `/rooms/{roomId}/events/{eventId}` are immutable (`allow update: if false;`) and constrained to `kind in ['spell_cast', 'player_hit']`.

## 2. The "Dirty Dozen" Payloads (Rejected with `PERMISSION_DENIED`)
1. **Unauthenticated Character Write**: `auth = null` attempting `create` on `/users/u1/characters/c1`.
2. **Unverified Email Spoof**: `auth = { uid: 'u1', token: { email_verified: false } }` attempting `create` on `/users/u1/characters/c1`.
3. **Cross-User Identity Spoofing**: `auth.uid = 'u2'` attempting `get` or `create` on `/users/u1/characters/c1`.
4. **Shadow / Ghost Field Injection**: Any payload on `characters`, `player_profiles`, or `rooms` containing an unlisted field (e.g., `isAdmin: true`).
5. **Collection Scraping on Rooms or Player Profiles**: `list` query on `/rooms` or `/player_profiles`.
6. **ID Poisoning**: Document IDs with spaces, slashes, or length `> 64`.
7. **Out-of-Range Coordinates or HP**: `RoomPlayer` with `hp: 9999999` or `x: 999999`.
8. **Invalid Room Mode**: `GameRoom` with `labyrinthMode: "hacked"` instead of `'shared'` or `'parallel'`.
9. **Event Tampering**: Attempting `update` on `/rooms/{roomId}/events/{eventId}`.
10. **Client Timestamp Forgery**: `createdAt` or `updatedAt` `!= request.time`.
11. **Immutable Key Mutation**: Changing `roomId`, `id`, `profileKey`, or `createdAt` on `update`.
12. **Out-of-Range Difficulty / Stage Shortcutting**: `selectedDifficulty: 2` when `highestUnlockedDifficulty: 1`, or `labyrinthStage: 99`.
