# ENGINEERING QUEST — Architecture

Educational logic lives in `src/engine` (pure TypeScript, no DOM, unit-tested). Rendering lives in
`src/game` (React). Content — dialogue, lessons, missions — lives in `src/content`. The only bridge is
the root reducer (`src/engine/state/reducer.ts`), which the React store dispatches actions into.

```
UI (React screens)  ──dispatch(Action)──▶  gameReducer  ──▶  GameState  ──▶  autosave (SaveSystem)
                                              │
      QuestionGenerator ◀── CombatEngine ◀────┤──▶ MasteryEngine ──▶ SpacedRepetitionEngine
      CurriculumEngine  ◀── QuestEngine  ◀────┤──▶ DifficultyEngine
      InventorySystem   ◀─────────────────────┘──▶ XP / achievements
```

## Core data model (`src/engine/types.ts`)

| Type | Purpose |
|---|---|
| `World`, `Skill`, `Region` | The curriculum spine. Skills have prerequisites (`{skillId, mastery}`), an optional list of atomic `facts`, a `generator` id and a `targetTimeMs` for fluency. Regions have skill/quest requirements and a map position. |
| `Question` | One generated problem: `masterySkillId`, optional `factId`, difficulty 1–6, `mode` pure/applied, prompt, expression, answer, hint, `solutionSteps`, `explanation` (first principles), `visual`, prerequisites, `engineeringApplication`. |
| `MasteryRecord` | Per fact **or** per skill: attempts, correct, streak, last-12 history, recent times, mastery 0–100, `srs` schedule. |
| `EnemyDef`, `BattleState` | Enemies draw questions from `skills`; bosses add `bossRules` (question count, max misses). |
| `QuestDef`, `QuestState` | Objectives are typed (`talk`, `lesson`, `defeat`, `mastery`, `drill`, `mission`, `collect`, `depth`, `boss`…) and progressed by `GameEvent`s. |
| `GameState` | Everything persisted: character, mastery map, adaptive map, quests, inventory, achievements, answer log (last 2000), stats (incl. per-day), world (unlocked regions, gallery progress, lab), settings, plus transient battle / session / lesson / dungeon / dialogue state. |

Fact ids are canonical strings: `fact:mult:6x7` (smaller factor first, so 6×7 and 7×6 share a record),
`fact:div:42/6`. Table skill mastery = mean of its 12 facts; the umbrella `mult` skill = mean of the 12
tables plus missing-factor and applied skills.

## Mastery formula (`mastery/MasteryEngine.ts`)

1. **Recency-weighted accuracy** over the last 12 answers (weight 0.85^age).
2. **Confidence** = min(1, attempts / 6) — a single correct answer scores ~48 (Developing), never Mastered.
3. `base = accuracy × (40 + 50 × confidence)` → at most 90.
4. If recent accuracy < 85 %, the score is capped at 84 (Competent at best).
5. Otherwise **speed** adds up to +11: fluent at or under the skill's target time, nothing at 2× target.
   Base is capped at 89 until speed is demonstrated, so *Mastered (90+) requires accuracy AND speed*.
6. A miss on a mastered fact drops it noticeably (one wrong in twelve ≈ −15) and schedules it in 10 minutes.
7. **Decay**: overdue reviews subtract up to 15 points from the *effective* mastery used for gating and
   selection, so nothing can be abandoned permanently.

Bands: 0–39 Learning · 40–69 Developing · 70–84 Competent · 85–89 Nearly Mastered · 90–100 Mastered.

## Spaced repetition (`srs/SpacedRepetitionEngine.ts`)

Interval ladder: 10 min, 1, 3, 7, 14, 30, 60 days. Correct with mastery ≥ 70 climbs one rung; wrong drops
two rungs, counts a lapse and comes back in 10 minutes. Items with lapses climb 20–40 % slower.
`selectionWeight` drives every generator: unseen facts 2.5, mastered ≈ 0.4, mastery-0 ≈ 5.4, +3 when due,
+1.5 per recent miss. Tests assert a weak fact appears > 20 % of the time in a 12-fact table (uniform = 8 %).

## Question generation (`questions/`)

`generateQuestion(skillId, mastery, {difficulty, rng, recentFacts})` looks up the skill's generator in the
registry. Generators are pure functions of `(skillId, params, ctx)`; the RNG is seedable for tests.
Difficulty levels for multiplication: 1 small factors · 2 full table · 3 mixed · 4 missing factors
(`? × 7 = 56`) · 5 applied engineering scenarios · 6 multi-step. `questions/applied.ts` holds the scenario
templates (bolts per assembly, watts per panel, litres per tank…). `questionForFact` targets one fact for
the review dungeon. `checkAnswer` is lenient about units and spacing.

**Adding a generator**: implement `Generator` in a new file, register it in `questions/index.ts`, and point
a skill's `generator` field at it. Nothing else changes.

## Combat (`combat/CombatEngine.ts`)

Pure functions: `startBattle`, `submitAnswer`, `advance`, `useHint`, `flee`. Damage = `hitDamage × streak
multiplier (1.25 at 3, 1.5 at 5) × (1 + equipment %) + 5 speed bonus (only if the fact's mastery ≥ 85 and
answered < 4 s)`. First wrong attempt: enemy strikes, hint shown, same question retried; second wrong:
solution shown, question queued to be re-asked every 4th turn. Only first attempts feed mastery. Bosses end
in defeat once misses exceed `bossRules.maxMisses`. Player HP 0 → wake in the village at half HP, no XP loss.

## State & events (`state/reducer.ts`)

Every answer flows through one function, `recordAnswer`: mastery → SRS → adaptive difficulty → answer log →
daily stats → XP → quests (`emit`) → achievements. `emit` routes `GameEvent`s (answer, enemy-defeated,
lesson-completed, mission-completed, depth-cleared, npc-talked, item-collected…) into `QuestEngine.applyEvent`;
completed quests grant rewards (XP, items, regions, lab stations, titles), then `refreshUnlocks` opens any
region or lab station whose requirements are now met.

## Save system (`save/SaveSystem.ts`)

`createSaveSystem(adapter)` wraps a `SaveAdapter` (`load/save/clear`). The envelope is
`{schemaVersion, savedAt, data}`; pass a `migrate(data, fromVersion)` to upgrade old saves. Saves are debounced
(250 ms) and flushed on `pagehide`, `beforeunload` and `visibilitychange`. Cloud sync (`save/sync.ts`, wired in
`game/store.tsx`) sits beside the local save rather than replacing it: a linked profile carries a sync code, the
server keeps one gzipped envelope per code with a revision counter, and `reconcile()` decides pull, push or nothing. Transient screens (battle, drill, lesson) are never resumed on load.

## Adding World 2 (Fractions) — checklist

1. `curriculum/skills.ts`: flip `implemented: true` on `frac`, add sub-skills with `facts` if they are
   fact-like, set `generator` ids.
2. `questions/fractions.ts`: write generators; register them.
3. `curriculum/regions.ts`: set `implemented: true` on `fraction-forest`, give it an environment asset.
4. `combat/enemies.ts`: add Fraction Forest enemies and the Fraction Hydra boss (`bossRules`).
5. `content/lessons.ts`, `content/dialogue.ts`, `content/missions.ts`, `quests/questDefs.ts`: content.
6. `game/components/MathVisual.tsx`: add a `fraction` visual type if needed (`Visual` union in `types.ts`).
7. `content/lab.ts`: the Precision Tools station already waits on `frac ≥ 85`.

The same character, mastery map and world state carry forward; no existing save needs migration for
additive content.

## Testing

`npm test` runs Vitest over the engine: generator correctness for every table and difficulty, answer
checking, mastery banding and decay, weak-fact weighting, SRS scheduling, XP curve, full game flows
(dialogue → quest, lesson, battle with retry, boss pass/fail, drill quest, bridge mission, inventory,
save/load round trip, locked travel, review dungeon).
