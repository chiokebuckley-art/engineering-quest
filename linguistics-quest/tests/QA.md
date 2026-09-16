# Release checks

- Engine and data: 9 passing tests covering all 294 entries, quiz answer integrity, three-date mastery, same-day exclusion, hint/lapse repair, beginner selection, save validation, exact reference counts, and licenses.
- DOM gameplay: 2 passing end-to-end tests covering missions, results, XP, repair, word retrieval, diagnostic isolation, profile isolation, dictionary search/add/practice, Unicode lookup, pause/resume, and double-submit protection.
- Run DOM checks with `JSDOM_MODULE=/path/to/jsdom node --test tests/ui.test.mjs`, or with jsdom available in the parent repository.
- `mobile.html` is a development-only inspection page with a 390px iframe; it does not add product behavior or data.
