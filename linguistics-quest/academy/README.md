# Small Common Word Academy

A standalone entry within Linguistics Quest, sharing its device-local family save and profile IDs.

## Scope

- 60 selected common-word uses and phrases, each practiced with 50 distinct named and drawn objects: exactly 3,000 scene/sentence pairs.
- Ten expeditions of 300 scenes; each contains six units of 50 scenes. Five contexts per use occur in each expedition, so learners revisit the uses with new objects.
- The number 3,000 counts illustrated practice contexts, not distinct definitions, hand-painted artworks, or every English grammatical use. The academy is not a full K–12 curriculum and does not reproduce the referenced book's contents or scope.
- All explanatory text, object drawings, scene geometry, and quiz content are original. Grammar reference links are listed in `content.js` and the in-game explanation.

## Art and precision

`art.js` contains 50 original vector object drawings and explicit relationship diagrams. `sceneAt()` deterministically generates the 3,000 scene specifications. SVGs are composed on demand in the browser, avoiding thousands of network requests and a large image download. Every scene is selectable in Picture library and downloadable as an SVG. This is a shared vector illustration system, not 3,000 separately hand-drawn images.

Position, motion, quantity and sequence are encoded by geometry. Examples include an object contacting a supporting shelf, start/end positions and arrows, equal groups, container boundaries, and numbered event panels. Abstract reference and ownership uses also rely on explanatory labels. Diagrams are schematic, not photographs. No third-party book illustrations, traced pages, or unlicensed stock images are bundled.

## Learning and saves

Teach → guided picture practice → independent picture selection → independent meaning selection. Incorrect answers return to teaching. Only passing both independent checks completes the scene and grants 10 XP, once per scene. Guided responses grant no learning-record credit. Checkpoints persist at each action; scenes unlock sequentially, and completed scenes can be reviewed. All library previews remain freely accessible and award no completion.

Independent attempts enter per-use records under `academy.<use-id>` in the shared profile. The review notebook shows practice dates and due reviews. Scene completion is distinct from retention over time; these are transparent game rules, not validated vocabulary mastery estimates.

`profile.academy` is optional for backward compatibility and validated by the parent engine. It holds version 1, a map of completed scene IDs to dates, and an optional checkpoint. Profiles share the existing `linguistics-quest.family.v1` storage key. Export/import works through Linguistics Quest → Profiles. No cloud sign-in, tracking, paid service or API key is added.

## Verification

From the parent game directory, with jsdom available:

```
JSDOM_MODULE=/path/to/jsdom node --test tests/*.test.mjs
```

Academy tests cover all 3,000 unique sentences/SVGs, all contrasts, distinct accessible descriptions, 60×50 coverage, ordered progression through the entire journey, no duplicate XP, backup validation, wrong-answer reteaching, reload checkpoints, sibling isolation, and free library exploration.

Representative geometry for all 60 uses was rendered and visually reviewed during development. This is not a claim of an independent linguistic audit of every scene. Future edits should review both the correct and contrast drawings and ensure that every meaning question has only one defensible answer.
