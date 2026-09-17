# Personal Visual Library

Standalone library within Linguistics Quest. The public application contains no uploaded book pages or dictionary extracts. Users import a prepared JSON study pack locally. IndexedDB holds packs and per-learner practice records. The existing family profile IDs are read from the parent game; its save format is not modified.

## First pack

`visual-dictionary-part-01.study.json` is delivered separately for personal import. It has all 126 scanned PDF pages, OCR search text, and 89 prepared entries: 60 starter meaning cards (20 each for astronomy, Earth, and plants), plus all 29 topic and item entries on PDF page 122. The page-122 entries have extracted pictures, transcribed source definitions, plain-language explanations, and parent links. Grain industry → Grain plants → Buckwheat is directly navigable and searchable. Animals has only its opening page in this upload. Other roadmap topics await later uploads. Page 122 is fully itemized; the other pages are not yet fully itemized. The original book text remains visible in page images; card explanations and examples are paraphrased. OCR is explicitly uncorrected and must not be presented as authoritative definitions. Historical source facts are not represented as a current fact-check.

## Append future uploads

Follow the version-1 format in `model.js`. Give each part a stable pack ID; give pages and cards stable IDs within that part. A new pack is added. A revised pack replaces that pack transactionally and retains card progress by stable ID. Keep existing cards and pages in revised packs unless intentionally removing them. Overlapping pages across different part IDs are not automatically deduplicated: the preparer must reconcile overlapping scans. Never commit a user's pack or scan to the public repository.

Pages: `id`, `number` (uploaded PDF page, not necessarily printed folio), `title`, `chapter`, `image` (JPEG/PNG data URL), and `ocr`. Cards: `id`, `pageId`, `chapter`, `term`, `meaning`, `example`, `notice`. Root: `format: visual-library-pack`, `version: 1`, `id`, `title`, `pages`, `cards`. Optional card fields: `parentId` (same-pack topic link), `image` (extracted JPEG/PNG), and `sourceDefinition` (checked against the scan). Cycles and dangling parent links are rejected. Optional `note` and source hash preserve provenance.

## Learning

Recall prompt → optional labeled picture hint → meaning, example, picture → independent meaning question without picture. A miss offers reteaching. Correct answers schedule review after 1, 3, 7, 14, or 30 days; a miss resets the interval. These are practice records, not proof of mastery. Library browsing does not award credit. Progress is saved per answer, and reopening resumes with the next unattempted card. Imported pack updates preserve existing progress. Backups preserve newer answers on restore.

On another device, first restore the parent Linguistics Quest family backup so profile IDs match, then import study packs and restore the separate library progress backup. Packs and progress are stored in this browser, not cloud accounts. Keep downloaded packs and backups; browser storage can be cleared or evicted. The app shell requires a connection on first load and is not advertised as an offline-installed app.

## Test

Provide jsdom and fake-indexeddb through `JSDOM_MODULE` and `IDB_MODULE`, then run `node --test tests/*.test.mjs` from the parent directory. Set `STUDY_PACK` to a local personal pack only for full-pack validation. Public test fixtures contain synthetic content only.
