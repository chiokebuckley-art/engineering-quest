# Science Quest · Discovery Islands

**Play:** https://chiokebuckley-art.github.io/engineering-quest/science-quest/

An original science adventure built from the Science Quest developer handoff. Version 1.39 is a playable early-access release, with 71 guided investigations across six research regions, plus high-school motion-data, observed-climate, energy-model construction and energy-design capstone activities. It is not a complete or validated K–12 curriculum.

## Version 1.39 additions

The main IndexedDB save path now checks the revision and snapshot inside the same write transaction. A stale tab cannot silently replace a newer save, import over it or delete its evidence. Rejected gameplay events remain available in that tab’s backup export, with persistent recovery guidance. Profile removal saves the remaining explorers and deletes the removed explorer’s events atomically. Failed saves prevent update-triggered reloads. A real Chrome two-tab test verified conflict detection, download and recovery import without losing the newer explorer. The localStorage fallback still needs equivalent cross-tab coordination; broader device acceptance remains pending.

## Version 1.38 additions

Museum Return Lane and Harbor Parcel Lane are complete Stopping Zone variants with distinct entry speeds, receiving bays, independent progress, native animated carrier scenes and four executed transfer tasks. Saved measurement records show distance and speed through the stop. Transfer setup previews now carry the supplied configuration without exposing an unrun calculation.

## Version 1.37 additions

Five chemistry investigations cover first-18-element shell configurations, molar limiting reactants and product recovery, first-order reaction rates, catalysts and reversible equilibrium, and ideal strong acid–base neutralization. Native diagrams and saved calculation tables accompany each lesson. The chemistry route remains partial; orbital bonding, empirical kinetics, equilibrium shifts and weak-acid/buffer calculations remain open.

## Version 1.36 additions

Three food-web investigations now trace carbon through six pools, explore the decomposer return route, and keep a separate conserved energy account through feeding, waste and thermal transfer. Native diagrams and saved transfer tables expose every modeled quantity. The rates are fictional teaching inputs, and the lessons explicitly distinguish matter cycling from energy transfer.

## Version 1.35 additions

[Read Earth’s Temperature Record](https://chiokebuckley-art.github.io/engineering-quest/science-quest/?activity=climate-data) uses an archived NASA GISTEMP v4 global annual record for 1880–2025. Learners interpret the baseline, calculate decade means and signed differences, compare a short interval with the long record, and critique uncertainty and model limits. The original CSV, source date and checksum keep scoring reproducible. This is analyzed observational evidence, not synthetic simulator output.

## Version 1.34 additions

[Power an Island Outpost](https://chiokebuckley-art.github.io/engineering-quest/science-quest/?activity=energy-capstone) adds a two-brief high-school design capstone. Learners test working and failing plans, compare all 80 allowed configurations, minimize fictional cost subject to bounded energy, power, reserve and mass constraints, and defend a revised design for a longer night. The saved ledger, mass/cost plot, full table, explanation and help history remain separate from guided-mission mastery. External review is pending.

## Version 1.32 additions

Library Return Route and Greenhouse Seed Delivery are full Rover Rescue variants with distinct cargo, fixed lane resistance, bay targets, height limits, separate progress and four fresh executed transfer designs. All three routes link to one another after completion. The 48 adapter registrations include these two configurations of the existing ramp law; they are not two new physical models.

## Progress toward the full handoff

The full objective remains active. [Completion audit](docs/COMPLETION_AUDIT.md) records the original requirements and remaining verification without narrowing them to the existing release. Version 1.1 adds durable answer/review checkpoints, learner-selected evidence pairs, executed reference-mission transfer designs, atomic fallback/import persistence, and non-destructive recovery for unreadable saves.

## Version 1.14 additions

Five Earth/space investigations add rainfall conversion, accumulated plate separation, half-life accounting, ideal planetary radiation balance and equal-radius stellar luminosity. The lessons emphasize measurement limits and distinguish ideal-model results from real-world inference.

## Version 1.13 additions

Five biology investigations add photosynthesis and respiration atom ledgers, a coding-sequence reader, logistic population trajectories and deterministic natural selection. All have model records and explicit limits. The biology course links them while continuing to list missing course areas. Browser verification is still unavailable; the latest tool check reports a locked Mac and browser startup failure.

## Version 1.12 additions

Restore the Route now requires an executed, connected three-step design: ramp, braking lane and stopping cushion. Predictions, controlled pairs, explanations and final constraint checks are saved. Older completed saves keep their earned discovery and can open the new route build. The model distinguishes average cushion force from unmodeled peak force.

## Version 1.11 additions

The twelve Motion Harbor missions now each have their original context plus two named assessment contexts, with model-consistent retry questions for six checks. Revealed items remain supported when a finite bank cycles; repeated exposure cannot erase the hint flag. Attempt records carry item/context identifiers. These banks are not educator-reviewed yet and do not replace full replayable mission variants.

## Version 1.10 additions

Five chemistry investigations cover melting, size separation, isotope counting, discrete reaction ratios and bond-energy bookkeeping. Each has a domain-specific diagram and equivalent accounting table, with explicit simplifications. [Science references](docs/SCIENCE_REFERENCES.md) document the principles and boundaries. The grade routes identify remaining chemistry gaps.

## Version 1.9 additions

Private-room server and client flows are implemented for two to four invited players. Server-controlled turns and roles, hidden individual answers, shared simulations, rotating jobs and idempotent journal imports are locally tested. The room setup page is available, but online play is **not live** until the separate cloud service is deployed and verified.

## Version 1.8 additions

Device-sync controls support durable upload retries, explicit conflict-preserving imports and recovery exports. The separate cloud service passes local tests but is not deployed: Cloudflare authentication is pending. The game still works locally without sync. No live sync or private-room availability is claimed.

## Version 1.7 additions

Three advanced energy investigations model interval loads, an explicit delivered-energy reserve, power-limited service and bounded efficiency/demand uncertainty. Native charts and accessible interval ledgers distinguish planning deficits from physical remaining energy. The integrated research route links the new sequence. These are fictional teaching scenarios, with science review pending.

## Version 1.6 additions

The journal now retains each scored attempt, including question text, chosen answer, content version, hint status and linked trials. Optional prediction reasoning and adult discussion notes preserve the evidence seen at review time. Adult notes do not change mastery. Older saves keep their earned evidence without fabricated historical attempts.

## Version 1.5 additions

Reading preferences now belong to each explorer: learning band, text size, motion, theme, picture cues and narration speed. Each solo response has a separate listen control, and mission narration includes choices. Four early-years prediction questions have authored picture cues for every option; this is partial picture coverage, not a complete non-reader pathway.

## Version 1.4 additions

[Content Studio](author/) provides local JSON draft editing, simulation previews, rubric/source checks, revision-bound human review records and reviewed release packet exports. It does not automatically publish drafts or verify reviewer identity.

## Version 1.3 additions

Shared-device sessions now require individual predictions and explanations from two to four explorers, preserve each response and hint flag in its owner’s journal, and rotate jobs between rounds. Eighteen permanent island upgrades and six earned decorations make discoveries visible. Shared-session backups preserve conflicting copies and remap player ownership.

## Version 1.2 additions

Eight new investigations cover light transmission, vibration amplitude, buoyancy, water warming, simple circuits, Mendelian inheritance, membrane diffusion, and shadow geometry. Thirteen linked grade routes organize available lessons and explicitly list areas still in development. A content validator rejects broken mission references, undefined vocabulary, prerequisite cycles, off-grid settings and unsolvable targets. These structural checks do not constitute science or educator sign-off.

## Included

- All 12 Motion Harbor missions, including the specified Rover Rescue model, controlled trials, two transfer checks and a harbor capstone.
- Three introductory investigations in each of Matter Workshop, Living Valley, Earthwatch Ridge, Signal Coast and Orbital Station.
- A 45-adapter Free Lab with reusable inventions, plant replicates and daily records, energy ledgers, wave and orbit models, and model assumptions.
- Four untimed arcade challenges: Cargo Catch, Signal Sprint, Habitat Balance and Build-Off. Unprepared explorers can use a supported preview without earning scores.
- Six separate independent-evidence checks; assisted answers do not certify a skill. Mission completion is separate from mastery. Later-session review becomes available after 24 hours.
- Up to 12 separate local profiles, IndexedDB autosave, append-only evidence events, JSON backup/import, conflict-preserving imported profiles, and a localStorage fallback.
- Shared-device lab roles, read-aloud with device voices, keyboard/native form controls, reduced motion, larger text, a technical theme, and responsive layouts.
- Scoped, versioned offline caching after the first successful online load. A pending update is activated at an explicit save checkpoint.

## Run and verify

```sh
npm ci
npm run check
npm run validate:content
npm test
npm start
```

Open `http://localhost:5187`. No production build, API key or backend is required. All runtime source is native browser ES modules. The development-only dependencies support deterministic model, DOM-flow and IndexedDB tests.

## Structure

- `src/models.js`: deterministic science adapters, SI units, versioned outputs.
- `src/content.js`: region registry, 64 missions, questions, transfers, glossary.
- `src/controller.js`: durable mission steps, answer checkpoints, evidence selection and additive migration.
- `src/transfers.js`: executed new-trolley and sorting-ramp transfer contexts.
- `src/learning.js`: independent evidence and skill states.
- `src/storage.js`: atomic IndexedDB checkpoints and evidence events, backup primitives.
- `src/visuals.js`: native SVG experiment diagrams and charts from model results.
- `src/app.js`: mission steps, navigation, profiles, labs, journal, arcade and accessibility settings.
- `assets/islands.webp`: generated decorative environment; all scientific measurements and controls are live code.

## Deployment

Publish this folder unchanged at `science-quest/` in `chiokebuckley-art/engineering-quest` on its existing `gh-pages` GitHub Pages deployment, and retain the same source folder on `main`. The game owns only that folder and its service-worker scope. Existing games are not modified. The source, test suite and documentation are included in the public folder for reproducibility.

## Release boundaries

Educator review, child usability studies and physical Android/iPad/laptop checks remain pending. Browser visual verification was blocked by the desktop browser tool's unavailable administrator-policy check during this build; automated DOM testing is not a replacement for device and visual testing. No formal standards coverage or efficacy claims are made. These teaching models are simplified and should not be used for real equipment design.

The full future K–12 course sequence, complete chemistry/biology/Earth-science curricula, account sync, private online co-op, live teacher review, are not included. This release implements the playable game framework and introductory investigations; the handoff describes those larger systems as later production stages.

See [release checks](docs/RELEASE.md) and [art provenance](docs/ART.md).

The [coverage and review ledger](coverage/) maps the handoff’s seven selected NGSS expectations to current activities, draft criteria and transfer tasks, with explicit remaining work and no claimed expert sign-off.

## Interactive Motion Harbor — 1.40

Motion Harbor now opens a usable district board above its existing guided discoveries. Choose Harbor Lab / Ramp Bay (Rover Rescue and the real ramp Free Lab), Cargo Crane (First Move), or Rover Route (Restore the Route and resume Rover Rescue). Each site derives Needs discovery, In progress, or Restored from the existing profile's mission runs and durable world upgrades. Completed discoveries restore the illustration; independent mastery remains separately recorded in the Journal. No new currency or duplicate progression is introduced.

Mission completion offers a return to the harbor, with a brief restoration highlight and Pip report. Free Lab and the connected route capstone also have direct return buttons. The route can replay an actual saved successful Rover Rescue delivery, without simulating a new trial or awarding evidence. All guided missions remain available. Native buttons, a linear facility list, large-text layout, mobile stacking and reduced-motion handling support different ways of playing. Walking avatars and expansion of district boards to the other five islands remain optional later work.
