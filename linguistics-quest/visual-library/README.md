# Personal Visual Library

Standalone library within Linguistics Quest. An AES-GCM encrypted personal book bundle is prepared but its public deployment awaits owner approval. `book-access.js` keeps the bundled-book entry disabled until then. The current app supports local study-pack import. Its random 128-bit unlock code is delivered separately and must never be committed. PBKDF2-SHA256 derives the decryption key locally; the code is not transmitted. After unlocking, IndexedDB stores the decrypted study pack on the device. Manual JSON import remains available. IndexedDB holds packs and per-learner practice records. The existing family profile IDs are read from the parent game; its save format is not modified.

## First pack

The personal study pack is delivered separately. It retains all 126 PDF pages and indexes 2,287 individual entries across 109 content pages. Introduction, contents, and divider pages remain browsable. The 89 previously prepared cards keep their IDs and progress. Additional entries use source-page illustrations, outlined label locations where detected, and 1,632 extracted definition regions. Shared diagrams remain intact to avoid misidentifying the object at a pointer's end. There are 72 labels without a reliable detected location. Automatically extracted definitions and locations require review; this is not a claim that every label has been independently verified. Publication-era geography is retained as source material, not current reference information.

## Append future uploads

Follow the version-1 format in `model.js`. Give each part a stable pack ID; give pages and cards stable IDs within that part. A new pack is added. A revised pack replaces that pack transactionally and retains card progress by stable ID. Keep existing cards and pages in revised packs unless intentionally removing them. Overlapping pages across different part IDs are not automatically deduplicated: the preparer must reconcile overlapping scans. Never commit a user's pack or scan to the public repository.

Pages: `id`, `number` (uploaded PDF page, not necessarily printed folio), `title`, `chapter`, `image` (JPEG/PNG data URL), and `ocr`. Cards: `id`, `pageId`, `chapter`, `term`, `meaning`, `example`, `notice`. Root: `format: visual-library-pack`, `version: 1`, `id`, `title`, `pages`, `cards`. Optional card fields: `parentId` (same-pack topic link), `image` (extracted JPEG/PNG), and `sourceDefinition` (checked against the scan). Cycles and dangling parent links are rejected. Optional `note` and source hash preserve provenance.

## Learning

Recall prompt → optional labeled picture hint → meaning, example, picture → independent meaning question without picture. A miss offers reteaching. Correct answers schedule review after 1, 3, 7, 14, or 30 days; a miss resets the interval. These are practice records, not proof of mastery. Library browsing does not award credit. Progress is saved per answer, and reopening resumes with the next unattempted card. Imported pack updates preserve existing progress. Backups preserve newer answers on restore.

On another device, first restore the parent Linguistics Quest family backup so profile IDs match, then import study packs and restore the separate library progress backup. Packs and progress are stored in this browser, not cloud accounts. Keep downloaded packs and backups; browser storage can be cleared or evicted. The app shell requires a connection on first load and is not advertised as an offline-installed app.

## Test

Provide jsdom and fake-indexeddb through `JSDOM_MODULE` and `IDB_MODULE`, then run `node --test tests/*.test.mjs` from the parent directory. Set `STUDY_PACK` to a local personal pack only for full-pack validation. Public test fixtures contain synthetic content only.

Source cards use `sourceMode: "scan"`, optional `labelBox`, `crop`, and `definitionCrop` rectangles in `page.layout` coordinates. Rectangles reference the retained page image without duplicating image bytes. Missing definitions fall back to source inspection and skip the quiz. `needsReview` marks unverified extraction.

## In-app entry and learning

Linguistics Quest opens `#visual-library` as an embedded study area in the existing app. A fresh device shows in-app file setup until the bundled book is approved; when enabled, it shows one-time book unlock. Successful unlock saves the pack and starts teaching immediately. Cards show their explanations first; related words and full source diagrams are expandable. Opening a word continues through the other words on that page. Global study/review clears stale page filters. Page images use reusable object URLs to avoid repeating large base64 strings throughout the DOM.
