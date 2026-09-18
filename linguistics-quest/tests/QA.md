# Release checks

- Engine and data: 9 passing tests covering all 294 entries, quiz answer integrity, three-date mastery, same-day exclusion, hint/lapse repair, beginner selection, save validation, exact reference counts, and licenses.
- Course rules: 4 passing tests cover complete/unique coverage, all 13 grade stages, ordered unlocking, no duplicate completion XP, finite grade goals, and old-save/checkpoint validation.
- DOM gameplay: 3 passing end-to-end tests covering missions, results, XP, repair, word retrieval, diagnostic isolation, profile isolation, dictionary search/add/practice, Unicode lookup, pause/resume, and double-submit protection. Course flow additionally covers teaching before checking, no guided XP, reteaching after a miss, resuming the second check after reload, completion unlocking, and separate sibling progress.
- Run DOM checks with `JSDOM_MODULE=/path/to/jsdom node --test tests/ui.test.mjs`, or with jsdom available in the parent repository.
- `mobile.html` is a development-only inspection page with a 390px iframe; it does not add product behavior or data.

- Academy: 3 tests check 3,000 unique scene/sentence pairs and corresponding contrasts, complete journey progression/validation, and DOM teaching, mistakes, reloads, profile isolation, and library access.
- `academy-mobile.html` provides a 390px inspection iframe for the academy.
- Representative original SVG geometry for all 60 uses was rendered and visually reviewed.
