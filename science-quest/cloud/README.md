# Science Quest cloud service

Status: implemented and locally tested; **not deployed**. The player UI is not connected yet. This service owns a separate namespace from Word Raiders and Engineering Quest.

## Deployment

From the Science Quest directory, using an authenticated Cloudflare account:

```sh
npx wrangler deploy --config cloud/wrangler.toml
```

The configuration creates a SQLite-backed Durable Object namespace automatically on first deploy. Record the returned HTTPS origin for the client integration. Do not put API credentials in this repository or in the game. The deployment dry run passed with Wrangler 4.92.0. Live runtime, account provisioning and cross-device checks remain pending.

## Protocol

`/v1/sync` accepts a random 256-bit private key in an Authorization Bearer header. The object name is the SHA-256 digest of the key; the raw key is not persisted. Anyone with the key can read or delete the associated save. There is no public lookup, profile listing, chat or leaderboard. Origin allowlisting is an additional browser boundary, not authentication.

- GET returns revision, snapshot, append-only events and up to ten prior snapshots.
- PUT takes `operationId`, `baseRevision`, `snapshot` and `events`. An exact retry returns its original revision. A stale revision returns HTTP 409 with the current save for explicit conflict recovery. Conflicting content under the same evidence ID is rejected. State updates use a storage transaction.
- DELETE explicitly removes the cloud object’s stored data. Local device data is separate.

Requests are capped at 2 MB, incoming events at 10,000 and retained events at 20,000. The last 100 upload operation identities are retained. Older retries are safely rejected by revision mismatch. Event capacity exhaustion requires archival; it never silently discards evidence. Current operations retain full payloads for exact retry comparison; before broad-scale release, replace this with collision-resistant content digests to reduce storage growth.

`src/cloud-client.js` prepares stable retry payloads and returns conflicts to callers. A player UI must retain pending operation payloads through retries, reconcile explicitly using conflict-preserving imports, and only update local revision after successful response. That integration is still pending.

## Verification

`node --test tests/cloud.test.mjs` covers retry idempotence, stale revisions, divergent event IDs, snapshot recovery, authorization headers, origin rejection, preflight and durable-handler storage behavior with a test double. It does not prove deployed storage isolation or live concurrency.

Implementation references: [Cloudflare SQLite-backed storage](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/) and [Durable Objects storage practices](https://developers.cloudflare.com/durable-objects/best-practices/access-durable-objects-storage/).
