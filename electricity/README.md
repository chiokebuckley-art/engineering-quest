# Electricity

An initial implementation of a visual, first-principles electricity learning app. This is an independent static app: no build step, API key, or desktop filesystem permission is needed to learn.

## Implemented

- 12 interactive lessons (L01.01–L01.06, L02.01–L02.05, L03.01).
- See → predict → experiment → explain → check learning sequence.
- Deterministic SVG circuit, breadboard, voltage-probe, resistor, graph, and charge-counting models; units, proportions, uncertainty, and safety activities.
- 60 answer-keyed checks, including one transfer check per lesson. Hints and prior attempts are excluded from independent-correct totals. An explanation is self-reviewed, not AI-certified.
- Free experiment bench; 33 plain-language glossary entries; lesson notes; optional browser text-to-speech; still mode; touch-friendly controls.
- Separate local learners, autosaved progress, delayed review scheduling, backup import/export, optional cross-device sync via the existing Engineering Quest / WordRaiders service.
- The 220-lesson research map is retained. The remaining 208 lessons are explicitly planned, not empty playable lessons.

## Run locally

Serve this directory with `python3 -m http.server 8000`, then open `http://localhost:8000`. Use an HTTP origin rather than opening index.html directly, since the app uses ES modules.

## Test

Node 24 or later: `npm ci` then `npm test`. The app itself does not depend on npm packages. jsdom is a development-only dependency for DOM integration tests.

Optional live integration check: `node scripts/smoke-live-sync.mjs`. This creates a synthetic cloud save on the existing sync service and checks two-client synchronization and recovery. It is not run by `npm test`.

## GitHub placement and publication

The source is in `electricity/` on `main` in `chiokebuckley-art/engineering-quest`. The runtime files are published from the matching directory on its existing `gh-pages` branch. The source is also retained under `electricity/` in `chiokebuckley-art/command-center`. Existing app entry points and deployment settings are preserved. Future releases must update both the source and the published runtime files.

App URL: https://chiokebuckley-art.github.io/engineering-quest/electricity/

To make a standalone repository, copy this directory to the repository root. Serve the root from GitHub Pages, or use the included GitHub Actions workflow after enabling Pages with the GitHub Actions source. That workflow runs tests and uploads only runtime files. When nested in command-center, the workflow is intentionally not active.

All imports and asset paths are relative, so the application can also be hosted at a subdirectory such as `/electricity/`. Hash-based navigation avoids deep-route 404s.

## Progress and sync

Progress is saved to browser localStorage under `electricity.progress.v1`. A storage failure is shown, and another tab's change blocks stale writes. Exports omit sync access codes. Import adds learners instead of replacing existing work.

Sync is optional. The learner creates an `EL` code or connects an existing Electricity code in Profile & sync. It uses the same optimistic-revision service as the existing Mentalist Memory and Engineering Quest apps. No progress is uploaded before the learner opts in. Anyone holding the code can read or change that learner's cloud save; it is a bearer access code, not an account login. Do not store sensitive notes. Conflict resolution preserves a recovery copy before applying a choice. Sync defers during lessons and reviews. A sync failure leaves local learning available.

The sync implementation was adapted from the user's Mentalist Memory repository (`sync.js` blob b36dd33746141ff962a565fda3e6a9369f170191 and `sync-ui.js` blob e0e4368d08e0c88a4d818f56d6b134f7b18d4465).

## Models and limits

The LED circuit uses a declared 1.8 V fixed forward-drop approximation. The Ohm's law and graph activities use a separate ideal linear resistor. Breadboard connectivity models eight terminal rows, not real board power rails. Atom visuals count charge; they are not literal atom geometry. The meter uncertainty specification is fictional and labeled. All activities are simulation-only: no hardware qualification is awarded.

Practice completion, independent-correct items, and delayed review are separate. The app does not certify mastery or expert competence. The 18-component research drafts were adapted into concise interactive sessions; this is not a claim of independent educational review or a learner efficacy study.

## Evidence and follow-up

The research was supplied in Electricity Curriculum Batches 1–4 and the Research and Build Blueprint. `sources.js` retains source IDs and URLs. `research/` contains the correction log, app research requirements, and the broader analytic cases. Broader cases are specifications for future engines, not claims that this limited engine implements all of them.

See `VALIDATION.md` for completed checks and the limits of this foundations release. The remaining 208 planned lessons are not part of this initial release.
