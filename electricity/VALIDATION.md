# Foundations release validation

Date: October 19, 2026.

Passed: 20 automated test cases using Node's test runner. Coverage includes LED open/closed/threshold states, resistor calculations and changing color bands, probe polarity, reference changes, metric conversions, fictional meter bounds, breadboard groups, charge conservation, all 12 lesson/model mappings and 60 question keys, source/vocabulary references, backup validation, and independent-versus-assisted scoring.

The jsdom integration test walks through a complete lesson, saves an explanation and note, answers checks, completes practice, revisits a hinted question to verify its assisted status persists, exercises all experiment renderers, changes probe nodes and charge counts, searches the glossary, and verifies learner separation. It also verifies that the skip link focuses the current lesson without changing routes.

The adapted sync suite tests native fetch receiver compatibility, compressed saves, two simulated clients, offline retry, concurrent edits, revision conflicts, recovery backups, invalid payloads, storage failure, and activity deferral.

Live checks passed:

- GitHub Pages deployment succeeded and the published app loaded at https://chiokebuckley-art.github.io/engineering-quest/electricity/.
- Rendered Chrome desktop checks covered prediction locking, switch interaction, resistance changes, explanation entry, and assessment feedback.
- The real app rendered and remained interactive in a 390 px iframe, including the lesson model, controls, current readout, and assessment. This checks responsive CSS, not physical-device emulation. `tests/responsive.html` provides the repeatable viewport fixture.
- A synthetic learner created a cloud save from the hosted browser app and showed "Up to date", verifying the deployed origin's CORS and service compatibility.
- `node scripts/smoke-live-sync.mjs` passed against the deployed service: create, second-client join, upload, download, concurrent-edit conflict detection, and recovery. Only synthetic data was used; access codes are not printed.

Remaining validation and future scope:

- Actual iPhone/Safari hardware, screen-reader and audio-output testing, and a full accessibility audit have not been completed.
- Independent educational review and learner pilots remain future work.
- The other 208 lesson scripts/media, a general circuit solver, and verified physical-hardware labs are future work. This release contains 12 interactive foundations lessons, not all 220 mapped lessons.
