# Analytical Adventure

A self-contained, touch-friendly investigation game built from `analytical_thinking_game_blueprint.pdf` and `analytical_adventure_developer_specification.pdf` (v1.0, October 17, 2026).

## Play

Open `index.html` through an HTTP static server. No build, dependencies, accounts, API keys, external fonts, analytics, or asset services are required. ES modules require HTTP hosting; double-clicking the file is not supported by most browsers.

Published path: `/engineering-quest/analytical-adventure/`.

## Implemented scope

The specific developer specification narrows the broader curriculum blueprint to one complete investigation and a transfer probe. This build implements that slice:

- Original responsive island scenes rendered as SVG, with tap and keyboard inspection controls.
- Lighthouse Starter (visible disconnect) and Investigator (hidden open cable, stale report).
- Greenhouse transfer case: an empty tank rather than a failed connection; distinct source and connection tests.
- Brief → inspect → hypothesis → prediction commitment → deterministic test → comparison/revision → conclusion → repair → debrief.
- Evidence notebook with source, time, type classification, player interpretation, and supports/conflicts/non-discriminating links.
- Explicit one-fault assumption, reliable authored tests, and causal dependency rules.
- Structured six-dimension 0/1/2 rubric; corrective feedback and targeted hints cap the affected dimension at 1. Free text never determines mastery.
- Direct-test, elimination, and single-component intervention justification paths.
- Completion separate from provisional independent mastery. A correct repair alone is insufficient. Replays and switching the same case's variants are practice, not fresh independent evidence.
- Immutable committed prediction/event history, safe repeat tests, and local save/resume after actions.
- Preferences and difficulty selection stored separately from assessment records. Each mission/variant can be resumed independently.
- Optional pass-and-play Explorer/Tester/Explainer roles and partner predictions before discussion. Scores belong to the shared session; partner entries are not individual assessments.
- Optional browser speech synthesis, scalable text, visible focus, no dragging, no timer, reduced-motion support, and written labels for all states.

## Files

- `content.js`: versioned authored mission definitions and answer rationales.
- `engine.js`: deterministic simulation, transitions, evidence, event recording, scoring.
- `app.js`: screens, interaction, local persistence, optional narration.
- `scene.js`: original SVG scene artwork, component state visuals.
- `style.css`: responsive interface and accessibility styling.
- `tests.mjs`: acceptance coverage; run `node --test tests.mjs` (Node 20+).

## Educational and simulation boundaries

All tests examine the original components, so retesting after a replacement reproduces the original evidence. Repairs change current component state separately. An output works only when all modeled necessary components work; the switch/valve is fixed on. These are authored teaching rules, not real equipment procedures. The 11–13 V battery rule is fictional and does not generalize to battery diagnosis.

Scoring checks whether a prediction follows from the player's stated hypothesis, not whether it matches the hidden fault. A coherent prediction that is contradicted by observation can earn full prediction credit. Evidence relations depend on the explicit exactly-one-fault model.

Mastery requires all six dimensions at 2 without targeted help on first exposure. These are proposed pilot thresholds, not validated cut scores or claims of general analytical ability. Completing Starter then choosing Investigator does not create an unseen assessment. The larger eight-layer curriculum, 24-mission campaign, quantitative capstone, and delayed transfer schedule are future work following the spec's pilot-first expansion boundary.

## Persistence and privacy

`analytical-adventure-v1` contains anonymous local mission sessions, reasoning events and archived replays. `analytical-adventure-preferences-v1` contains accessibility/difficulty preferences. No progress data is transmitted. No collection of names, birthdays, recordings, or contact details. Keep personal information out of optional notes. Browser speech processing depends on device/browser voices; all content remains available in text.

There is no cross-device sync, online multiplayer, server analytics, automatic free-text grader, or offline installation promise. Browser storage may be cleared or unavailable; a visible warning reports save failures. Sessions are versioned; future content changes should provide explicit save migration.

## Verification

Run `node --test tests.mjs` and `node --check app.js`. Automated tests cover every authored test outcome, invalid transitions, immutable prediction history, direct and elimination routes, different transfer fault, unsupported guesses, failed repairs, one-fault dependencies, hint caps, save/resume serialization, repeat actions, and practice/mastery separation.

Browser QA could not run in the build environment: the managed preview service failed with `bwrap: Can't mount proc on /newroot/proc: Operation not permitted`. No visual, mobile, screen-reader, or speech-device verification is claimed. Mixed-age pilot testing and observation remain human evaluation milestones.

## Suggested pilot

Observe separate younger and adult players plus one pair. Ask players to explain a prediction before pressing Run. Look for confusion between a report and a current measurement, unsupported repairs, and difficulty keeping the tested hypothesis separate from a revised hypothesis. Observe greenhouse transfer before offering hints. Use only consented, appropriately reviewed study procedures if collecting research data outside the app.
