# Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Strict Ownership & Identity Integrity**:
   - Every character document at `/users/{userId}/characters/{characterId}` belongs exclusively to `request.auth.uid == userId`.
   - `data.ownerId` MUST equal `request.auth.uid` and `userId`, and `data.id` MUST equal `characterId`.
   - Verified email (`request.auth.token.email_verified == true`) is required for all writes.
   - No PII (`email`, `phone`, `address`) is stored in character documents.
2. **Path Variable & Volumetric Hardening**:
   - `userId` and `characterId` match `^[a-zA-Z0-9_\-]+$` with length `1..128` (`characterId` `1..64`).
   - `name` is a non-empty string `1..40` chars.
   - Bounded lists: `ownedEquipment.size() <= 10`, `ownedArtifacts.size() <= 60`, `claimedQuestIds.size() <= 50`.
3. **Progression & Difficulty Bounds**:
   - `playerLevel` in `1..99`, `playerXp` in `0..10000000`, `gestureMasteryLevel` in `1..10`.
   - `highestUnlockedStage`, `unlockedStageD1`, `unlockedStageD2` in `1..5`.
   - `highestUnlockedDifficulty` in `1..4`, and `selectedDifficulty` in `1..highestUnlockedDifficulty`.
4. **Temporal & Immutable Field Integrity**:
   - On `create`: `createdAt == request.time` and `updatedAt == request.time`.
   - On `update`: `createdAt == resource.data.createdAt`, `ownerId == resource.data.ownerId`, `id == resource.data.id`, and `updatedAt == request.time`.

## 2. The "Dirty Dozen" Payloads (Rejected with `PERMISSION_DENIED`)
1. **Unauthenticated Write**: `auth = null` attempting `create` on `/users/u1/characters/c1`.
2. **Unverified Email Spoof**: `auth = { uid: 'u1', token: { email_verified: false } }` attempting `create`.
3. **Cross-User Identity Spoofing**: `auth.uid = 'u2'` attempting `create` or `get` on `/users/u1/characters/c1`.
4. **Payload Owner Mismatch**: `auth.uid = 'u1'` on `/users/u1/characters/c1` with `data.ownerId = 'u2'`.
5. **Shadow / Ghost Field Injection**: Payload containing `isAdmin: true` or `unlistedField: 123`.
6. **ID Poisoning**: `characterId` containing spaces, slashes, or `> 64` characters.
7. **Oversized Name String**: `name` with `> 40` characters or empty string `""`.
8. **Unbounded Array Exhaustion**: `ownedArtifacts` array with `> 60` items or non-string first element `[123]`.
9. **Out-of-Range Difficulty / Stage Shortcutting**: `selectedDifficulty: 2` while `highestUnlockedDifficulty: 1`, or `highestUnlockedStage: 9`.
10. **Client Timestamp Forgery on Create**: `createdAt` set to a past or future timestamp `!= request.time`.
11. **Immutable Field Mutation on Update**: Updating `createdAt` or `ownerId` during `update`.
12. **Blanket List Scraping**: Listing `/users/u1/characters` as user `u2` or without matching `resource.data.ownerId == request.auth.uid`.
