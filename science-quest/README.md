# Science Quest · Discovery Islands

**Play:** https://chiokebuckley-art.github.io/engineering-quest/science-quest/

An original science adventure built from the Science Quest developer handoff. Version 1.9 is a playable early-access release, with 38 guided investigations across six research regions. It is not a complete or validated K–12 curriculum.

## Progress toward the full handoff

The full objective remains active. [Completion audit](docs/COMPLETION_AUDIT.md) records the original requirements and remaining verification without narrowing them to the existing release. Version 1.1 adds durable answer/review checkpoints, learner-selected evidence pairs, executed reference-mission transfer designs, atomic fallback/import persistence, and non-destructive recovery for unreadable saves.

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
- A 25-adapter Free Lab with reusable inventions, plant replicates and daily records, energy ledgers, wave and orbit models, and model assumptions.
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
- `src/content.js`: region registry, 38 missions, questions, transfers, glossary.
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
