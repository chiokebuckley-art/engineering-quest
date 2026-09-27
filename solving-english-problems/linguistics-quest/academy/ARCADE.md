# Common Word Arcade

Arcade adds a practice layer to the existing 3,000-scene Journey. Each meaning unlocks after its first five independent scene completions. Journey drills use only completed scenes. Existing profile and Journey save keys stay in place.

The bank combines 60 meanings, 50 objects and six sentence patterns (18,000 combinations; not 18,000 separate meanings), plus 120 authored everyday situations. A per-meaning varied deck visits 1,252 practice items before repeating. The sixth sentence pattern is reserved for mastery checks. Recall accepts appropriate alternate spatial terms.

Practice is untimed; Blitz offers 30/60/90 seconds; Speed offers 10/20 items and adjusts only after at least 90% unassisted accuracy; Conquer saves a 50-object set and retries misses. Scene Forge requires selecting a repaired picture and checking it. Picture Match Arena has ten items; Meaning Millionaire has fifteen and one-use support options. Hints, skips and 50/50 never count as independent evidence.

Mastery is per meaning: all 50 objects, five practice patterns, five question types, both everyday situations, correct independent answers on at least three UTC dates, a perfect 20-item reserved-pattern check, and twenty latest distinct correct independent responses. A later miss or supported answer removes current mastery until repaired. Scores and crowns are separate. These game criteria are not a standardized language assessment.

Arcade evidence and Conquer progress merge across devices; latest question evidence wins, with failure winning timestamp ties. Existing review records and completed Journey scenes are retained. WordRaiders stores Arcade under the active player's commonWords.arcade and its Academy Sync link opens the main game's player sync settings. The Engineering-hosted Academy includes Arcade in its existing independent AC-code sync. Those two hosts retain their separate save systems and codes.

Checks performed: all 18,000 combinations and answer cardinality; no-repeat deck; unlock boundaries; reachable mastery and hint exclusion; compressed sync and concurrent evidence merge; native WordRaiders parse/merge/transport; mobile and desktop browser flows for modes, stations, timing, reload persistence, and Academy-to-main-game round trips.

Engineering Academy regression command: node --test solving-english-problems/linguistics-quest/academy/*.test.mjs
WordRaiders source regression: src/game/arcade-sync.test.ts (Vitest).
