# Initial build validation

Date: October 19, 2026.

Passed: 19 automated test cases using Node's test runner. Coverage includes LED open/closed/threshold states, resistor calculations, probe polarity, reference changes, metric conversions, fictional meter bounds, breadboard groups, charge conservation, all 12 lesson/model mappings and 60 question keys, source/vocabulary references, backup validation, and independent-versus-assisted scoring.

The jsdom integration test walks through a complete lesson, saves an explanation and note, answers checks, completes practice, revisits a hinted question to verify its assisted status persists, exercises all experiment renderers, changes probe nodes and charge counts, searches the glossary, and verifies learner separation. This is DOM integration testing, not rendered-browser testing.

The adapted sync suite tests native fetch receiver compatibility, compressed saves, two simulated clients, offline retry, concurrent edits, revision conflicts, recovery backups, invalid payloads, storage failure, and activity deferral. It uses a mock service; the existing worker source accepts 12-character uppercase codes including the EL prefix and declares cross-origin support, but its currently deployed behavior and operation on an actual iPhone were not exercised.

Open release gates:

- Rendered browser QA at desktop and phone widths, keyboard focus review, and actual text-to-speech behavior. The available browser could not reach the workspace's local preview.
- Live sync smoke test from the eventual hosted origin, including service namespace/CORS compatibility and an actual iPhone.
- Actual GitHub Pages publication and live-link verification.
- Independent educational review and learner pilot.
- The other 208 lesson scripts/media, a general circuit solver, and verified physical-hardware labs are future work.
