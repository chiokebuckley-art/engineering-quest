# Sentence Forge 1.0

A playable sentence-building factory in the Eng Quest family. Open `index.html` through an HTTP server, or play the published game at https://chiokebuckley-art.github.io/engineering-quest/sentence-forge/ .

## Play

Start a production order from the factory. Tap word tiles to place them on the belt; tap placed tiles to return them. Drag tiles to reorder, or focus a placed tile and use Alt+Left/Right. Run the line, then pass the meaning inspection. Paragraph orders use full sentences as parts. Restore a factory wing by completing three of its orders.

The release includes:

- **93 curated orders in nine playable districts**: core statements, identification, relationships, verb patterns, connectors, scope/punctuation, references, paragraphs, and evidence.
- **Nine guided lessons**, the complete jar sentence with a 15-part contextual inspector, and the five-sentence jar repair report.
- **277 contextual catalog entries** covering common function words, connectors, contractions, and a phrasal verb. Entries may repeat a word in different roles. Catalog coverage is broader than the assessed mission bank; this is not an exhaustive reading curriculum.
- **Eight arcade modes**: untimed Practice, timed Conveyor Blitz, 10-order Conquer, paired Meaning Switch, Repair Rush, Rocket Routes, Meaning Millionaire, and two-player pass-and-play Factory Duel.
- **Profiles**, local autosave, JSON export/import, optional read-aloud, sound, reduced-motion support, and an offline service worker. The app can be added to a phone's home screen. Voices depend on the device. First loading/caching requires internet; gameplay subsequently works offline. There is no account or paid API dependency.

Factory Duel is local pass-and-play, not online multiplayer. It gives both players the same seeded five-order queue, scores accuracy, and records mastery only for Player 1/the active profile.

## Learning rules

Comprehension mastery follows Eng Quest's recent-accuracy/review pattern, with **no speed gate**. It combines recency-weighted first-attempt accuracy, repeated attempts, and distinct examples. A single repeated item cannot prove transfer or reach Mastered. Some narrowly sampled skills therefore remain below Mastered until more examples are added. Completion with hints or retries is saved separately from independent mastery. Arcade points and local factory rewards are motivational, not standardized assessment results.

Misses enter a repair bench. A repair run contains the original, three distinct related variations (same skill when enough exist; otherwise the same district), and one separate twist. All four core items must be independent successes for a clean repair; the twist reports transfer but does not block that repair. Three clean reviews, scheduled now, three days later, and seven days after that review, clear a card. Early practice does not advance the spaced-repair count. A lapse resets it. Timed modes do not classify an unfinished order as a comprehension error.

Build tasks use explicitly accepted arrangements, not a general-purpose grammar checker. A mismatch is described as not matching the order; it is not automatically called ungrammatical. In this release, tasks normally have one authored assembly. The data model supports additional valid arrangements through `solutions`. Some questions explicitly reward recognizing ambiguity or insufficient evidence.

## Source and integration

The canonical source is kept in Command Center at `engineering-quest/public/sentence-forge/`. Vite's existing public-directory copy carries it into Eng Quest's production output. Relative assets and the service-worker scope keep it usable at `/quest/sentence-forge/` or `/engineering-quest/sentence-forge/`, with its own save key. Published copies live in the public `engineering-quest` repository under `sentence-forge/`. No existing math game state or screen was modified.

This is a self-contained browser module with zero package dependencies. The same architectural boundaries as Eng Quest are preserved:

- `content.js`: authored lessons, question metadata, answer sets, catalog and sources.
- `engine.js`: pure grading, practice selection, mastery, review and save validation.
- `app.js`: interface, session flow, profile controls and answer events.
- `scene.js`: original procedural Canvas factory, robot, spatial and jar scenes, and rocket feedback. Scenes never award points or grade answers.
- `style.css` and `fonts.css`: responsive interface and local fonts.
- `sw.js`: application-scoped offline caching. Update its cache version whenever changing released assets.

```sh
cd engineering-quest/public/sentence-forge
npm test
npm start
```

`npm start` serves the folder on port 5195 through Python 3. For browser checks, install Playwright and its Chromium browser in your development environment and run `node tests/browser.mjs`. The browser harness also accepts `PLAYWRIGHT_MODULE`, `CHROME_PATH`, and `QA_DIR` environment variables. Browser checks use an isolated local HTTP server and test the same nested URL structure used in deployment.

## Content references and assets

Practice wording and illustrations are original. Grammar references:

- [Cambridge: A/an and the](https://dictionary.cambridge.org/grammar/british-grammar/a-an-and-the)
- [Cambridge: Determiners](https://dictionary.cambridge.org/grammar/british-grammar/determiners-the-my-some-this)
- [Cambridge: English Grammar Today](https://dictionary.cambridge.org/grammar/british-grammar/)
- [Reading Rockets: Reading comprehension](https://www.readingrockets.org/reading-101/reading-and-writing-basics/reading-comprehension)

DM Sans and Space Grotesk are locally bundled under the SIL Open Font License. Their notices are in `fonts/OFL-DM-Sans.txt` and `fonts/OFL-Space-Grotesk.txt`. No analytics, advertising, or external runtime scripts are used.


## Pawprint Trail and Read & Rescue Rally (2.0)

Open `#adventure` for an original Scout-guided dog adventure: 12 grade-level chapters, two stories per chapter, and five evidence-backed comprehension questions per story. The 24 stories progress from simple connected text to complex arguments. This is a practice path, not a complete K–12 curriculum or standardized grade assessment.

- Word Camp introduces 12 blending, spelling-pattern, and word-part examples with optional whole-word speech synthesis. Individual sounds should be modeled by a grown-up.
- Four of five correct helps a dog. Two independent passes unlock the next chapter. Listening or reviewing the passage earns supported practice; there is no adventure speed requirement.
- `#reading` offers every grade for solo or two-player pass-and-play. Both players use the same story. WPM counts the passage's word tokens divided by elapsed reading minutes; questions are untimed. It is self-timed and does not measure oral accuracy. A run needs 80% comprehension, at least one second of reading, and no assistance/interruption to qualify. The faster qualifying player wins; equal rounded WPM ties. Player 2 is a guest; only Player 1 updates the active profile's rally best.
- Answers stay hidden between players. Review shows selected answers, correct answers, and supporting excerpts after both have finished.
- Pausing, hiding the tab, or opening Profiles makes a run practice. Paused time is excluded from displayed reading time. Leaving a mode discards the current unfinished attempt.
- Progress, previous attempts, and per-story bests remain profile-specific, work offline after caching, and round-trip through existing export/import. Rereads are identified by previous-attempt counts. Speech voices depend on the device.

Run `npm test`, `node tests/browser.mjs`, and `node tests/trail-browser.mjs` for engine, existing-game regression, and reading-mode browser coverage. Browser environment overrides documented above apply to both harnesses.

Reading skill references: [IES foundational reading skills](https://ies.ed.gov/ncee/wwc/PracticeGuide/21), [grade 1 literature](https://www.thecorestandards.org/ELA-Literacy/RL/1/), and [grades 11–12 literature](https://www.thecorestandards.org/ELA-Literacy/RL/11-12/).
