# ENGINEERING QUEST

*An RPG that takes you from multiplication facts to the mathematics of chemical engineering,
electrical engineering and physics.*

You are an Engineering Apprentice in a world whose Mathematical Engine has fallen silent.
Every mathematical discipline restores one power core. Version 1 is the first, playable
vertical slice: **World 1 — Arithmetic**, focused on multiplication facts 1–12, with
division foundations.

## Run it

```bash
cd engineering-quest
npm install
npm run dev        # http://localhost:5190
```

Other commands:

| Command | What it does |
|---|---|
| `npm test` | Engine tests (question generation, mastery, spaced repetition, combat, quests, save/load) |
| `npm run typecheck` | TypeScript strict check |
| `npm run build` | Typecheck + production build into `dist/` (static, deploy anywhere) |
| `npm run preview` | Serve the production build |
| `node scripts/fetch-icons.mjs` | Re-download the CC BY icons from game-icons.net |
| `node scripts/build-asset-manifest.mjs` | Regenerate `ASSET_LICENSES.md` and `public/assets/manifest.json` |
| `node scripts/check-assets.mjs` | Verify every asset referenced in `src/` exists |

Works on desktop, tablet and phone (on touch devices a numeric keypad appears under every problem).
Progress is saved automatically in the browser (`localStorage`) and can be exported/imported as JSON
from Settings / the main menu.

## Play it anywhere (hosted)

The Command Center server serves the game at **`/quest`** (e.g. `https://<your-command-center-url>/quest`),
behind the same login. The root `npm run build` builds the game with `QUEST_BASE=/quest/` and
`server/server.mjs` mounts `engineering-quest/dist` there, so every Railway deploy of `main` ships the
latest game. On a phone, open the URL and use "Add to Home Screen" — the web-app manifest makes it launch
full-screen like an app. Progress is stored per browser; use Settings → Export to move it between devices.

`npm run build:single` produces `dist-single/engineering-quest.html`, a one-file offline copy.

## Arcade and Versus

The **Arcade** tab holds fast practice for every operation: the 1–12 times-table chart (pick a table,
several, or one fact), division facts (÷2–÷12), addition and subtraction (to 20 / 100 / 1000), Number Bonds
(make 5 / 10 / 50 / 100), pre-algebra (evaluate expressions, one-step equations), **word problems** (addition,
subtraction, multiplication, division, two-step or mixed) and an everything-mixed set.
Each has Practice, Blitz (30 / 60 / 90 / 120 s, bests kept per length) and Conquer modes.

**Word problems** are generated with their *structure* attached (put together, add to, take away, compare,
missing part, equal groups, times as many, rows, rate, fair share, how many groups, and two-step combinations).
Every question carries the operation, the layout (`(5 × 8) − 12`), a plain-language reason, the clue words and
three decoy layouts. In Practice the "why" box shows the structure → operation → layout once the answer is right.
The lessons *Word Problem Detective* and *Two-step Stories* teach the four detective questions and the bar model.
Generator: `src/engine/questions/wordproblems.ts`; skills `word`, `word.add|sub|mult|div|twostep`.

**Math tricks** (Arcade → Math tricks) drills three mental-math shortcuts, each generated with a digit-by-digit
explanation: multiply by 11 (split the digits, sums in the middle, carries handled for two- and three-digit numbers),
squares ending in 5 (n × (n + 1) then attach 25) and same tens with units that make 10 (t × (t + 1) | u × u as two
digits). Three lessons teach them with the classic examples (43 × 11, 574 × 11, 75², 86 × 84).
Generator: `src/engine/questions/tricks.ts`; skills `tricks`, `trick.11|sq5|same10`.

**Mental + and −** (Arcade → Mental + and −) drills two-digit addition and subtraction as *moves*: add/subtract
tens, distance to the next ten, break apart, round & compensate, make a ten, and count the distance (subtract by
counting up). Mixed mode picks the best move for each pair and every explanation names it and draws the hops on a
number line. Three lessons (Tens First, Make a Ten, Count the Distance) teach the moves and when to use each.
Generator: `src/engine/questions/mental.ts`; skills `mental`, `mental.tens|next10|split|round|make10|distance`.

**Volume** (Arcade → Volume) teaches how to measure volume, and every question is a picture of the thing being
measured: an isometric stack of unit cubes (count one layer, multiply by the layers), a labelled tank or crate
(length × width × height in cm³, or mL since 1 cm³ = 1 mL), a measuring jug with a scale (work out what one small
mark is worth, then read up from the label below the water line), two jugs before and after an object is dropped in
(displacement: after − before), and a box with one side hidden (volume ÷ the two known sides). Pictures show before
the answer in every layout, including the Stud table and Weakest Gear. Three lessons (Fill It With Cubes, Read the
Jug, Sides and Missing Sides). Available in Practice, Blitz and Conquer, as a Naval Blitz level, and at the Stud and
Weakest Gear tables; misses go to the notebook with same-kind variations.

**Breaking apart a figure** extends volume to solids that are not one plain box, the way a fifth-grade sheet does:
an L-shaped or stepped figure to cut into rectangular prisms and add, a U-shaped block with a notch to fill in and
subtract, and a staircase to slice into upright slabs. The figure is drawn isometrically with each piece in its own
colour and a legend of `l × w × h` per piece; the notch is drawn as a dashed ghost so the "fill the gap" move is
visible. Every explanation gives **both** routes — break it apart and add, or enclose and subtract — shows they agree,
and closes on the unit: a volume answer is cm³, never cm. Lesson: *Breaking Apart a Figure*.
Generator: `src/engine/questions/volume.ts`; visuals `cubes|box|beaker|displace|solid` in `MathVisual.tsx`; skills
`volume`, `volume.cubes|prism|liquid|displace|missing|composite|subtract|stairs`.

**Measuring** (Arcade → Measuring) teaches measurement as a loop, with every question a picture of the tool or the
thing: read a metric ruler in mm (numbered marks are cm, small marks are mm; harder levels put the object off zero so
you must subtract the start), fractions of an inch on a tape (eighths, then sixteenths), a dial (kitchen scale in g,
tyre gauge in psi: work out one mark, count from the label below the needle), a thermometer (reading, then change in
temperature), elapsed time between two clock faces (count to the next hour, then on), estimating against a familiar
reference (a door is about 2 m; answers within ±20 % count, via `Question.tolerance`), unit conversion drawn as a
line, a tiled square or a gridded cube (1 ft = 12 in, 1 ft² = 144 in², 1 ft³ = 1728 in³; metric prefixes; cups,
pints, quarts, gallons; time), and perimeter vs area (fence around vs tiles inside). Seven lessons follow the ten
steps (quantity → unit → tool → mark → estimate → read → convert → accuracy → apply → check) and end with the
engineer's loop on a real job (a shelf that must fit an alcove: estimate → measure → calculate → build → check →
explain). The Arcade panel shows the measurement path (K–12 stages) and which stages are in the game. Available in
Practice, Blitz and Conquer, as a Naval Blitz level, at the Stud and Weakest Gear tables, and in the notebook.
Generator: `src/engine/questions/measure.ts`; visuals `ruler|dial|thermometer|clocks|refbar|units|rect`; skills
`measure`, `measure.ruler|inches|dial|temp|time|estimate|convert|shape`.

**The engineering path** (Arcade → Shapes & angles, Rates & conversions, Precision & fit, Forces & power,
Plumbing) continues the measurement sequence through grade 12, every question a picture of the tool or the thing,
registered in `src/engine/questions/games.ts` so each game plugs into Practice/Blitz/Conquer, Naval Blitz levels,
the Stud and Weakest Gear tables, skills, achievements and the notebook the same way:

- **Shapes & angles** (`geo.ts`): protractor reading, missing angles (line 180, point 360, triangle 180, right
  angle 90), radius/diameter/circumference and wheel travel, Pythagoras on ramps, braces and ladders, slope as rise ÷
  run, surface area of boxes (open-top at higher levels), cylinder base and volume, scale drawings 1:n.
- **Rates & conversions** (`rates.ts`): mix ratios (1 : 2 : 3 concrete), US ↔ metric with the same length drawn twice
  (1 in = 25.4 mm), speed / distance / time, flow rate, density (g/mL by material), dimensional-analysis chains drawn
  with the units cancelling, rpm × circumference.
- **Precision & fit** (`fit.ts`): vernier caliper and micrometer pictures read to 0.1 and 0.01 mm, tolerance bands
  (limits and how far out), feeler-gauge stacks, thread pitch and TPI, bolt thread size vs wrench size (M8 → 13 mm),
  tolerance stack-up, absolute and percent error, significant figures and scientific notation, dial-indicator
  runout, calibration offsets and means.
- **Forces & power** (`phys.ts`): weight = mass × 10 N/kg, torque = force × arm with wrench-unit conversions
  (lbf·ft ↔ lbf·in ↔ N·m), levers, pressure = force ÷ area with psi ↔ kPa and water head, work, power and kWh,
  V = I × R and P = V × I, thermal expansion in µm.
- **Plumbing** (`pipe.ts`): nominal vs actual (Sch 40 PVC OD/ID table), cut length = centre-to-centre − take-offs,
  route totals with waste, fall per metre / ¼ in per ft / percent, litres inside a pipe from its ID, bucket flow
  tests and fill times, head pressure, 45° offsets (travel = offset × 1.414).

Answers that involve π or unit factors are rounded and accepted within a tolerance; the keypad shows a decimal
point when a question needs one (`Question.allowDecimal`). Twenty-six lessons cover the five games and ten **build
projects** (picture frame, storage box, scale floor plan, wheel travel, model plumbing route, ramp and brace, fill
time, pipe offset and bracket, leverage and a low-voltage circuit, and the capstone gravity-fed water station),
each walking estimate → measure → calculate → build → check → explain. The Learn screen groups lessons by unit.

**Speed practice** (Arcade → Speed) runs a set of 20 questions, each on its own clock (15, 10, 7, 5 or 3 seconds;
the goal is 3). Each answer's feedback shows its time and whether it beat the clock; a set passes at 90 % right
and 90 % on time, and a pass offers the next tighter clock. Every first answer in any arcade mode is filed under
its fact (`fact:mult:6x7`) or, for open-ended games, its skill, in `stats.speed.facts` (tries, correct, average,
best, last, the ten most recent times), and every speed set is logged in `stats.speed.runs` (clock, on-time,
correct, average, median, best). The **Speed data** panel under the mode cards shows the current selection's facts
slowest first, a 12 × 12 heat grid of recent averages for times tables and division, the run history, and copies
or downloads everything as CSV. Engine: `src/engine/state/speed.ts`.

**Progress ledger** (`src/engine/state/ledger.ts`) keeps statistics for every arcade answer and every run. Each first
attempt in Practice, Blitz, Speed and Conquer is filed by day, by game (the math), by mode and by the number it was
about (`6 × 7`, `42 ÷ 7`, or the skill for open-ended games), with lifetime totals per number; every run is logged
with its clock (the Blitz length or the Speed per-question clock), right, wrong, score and how long it took — a run
stopped early is logged too. Misses go to the wrong-answer notebook as before. The **Progress** panel on the arcade
(under the mode cards) shows the current selection filtered by mode and range (7 / 30 / 90 days / all): answered,
right, wrong, accuracy and average time; a right-vs-wrong-by-day chart; a breakdown by table or divisor, then by fact
or skill weakest first; by mode; the run history with clocks; and CSV export. The Stats screen carries the same view
across all games, broken down by game, with the numbers that keep going wrong. Days older than 180 days are pruned
(totals and runs are kept), so the ledger stays small.

**Probability lab** (Arcade → Probability lab; `src/engine/questions/prob.ts`) is a nine-stage path from odds to a
predictive model, sixteen kinds each with its own picture: odds and ratios, counting (nPr, nCr), sample spaces (dice
grid), event rules (trees), conditional probability (two-way table), Bayes with a 1000-case tree, mean/variance/SD
(dot plot), sampling error and the law of large numbers, z-tests, binomial and Poisson (bar charts), normal and t
(bell curves), linear and logistic regression, vectors, matrices and Elo, Markov chains, random walks and Monte
Carlo, expected value, Kelly and risk of ruin. Ten lessons (one per stage plus a capstone) and the **Model
Workshop** (More menu, `src/game/screens/WorkshopScreen.tsx`): define an outcome and base rate, add weighted factors
into a logistic model, blend with an Elo gap, simulate a best-of series (10 000 seeded runs checked against the exact
binomial), price it (fair odds, implied probability, EV, Kelly, half Kelly) and score past predictions with a Brier
score. The workshop model persists in localStorage.

**Spiral review** (Arcade → Spiral review; `src/engine/questions/spiral.ts`) is the mixed weekly-review sheet, five
kinds with a picture each. *Powers of ten*: `708 ÷ 10³`, drawn on a place-value chart with an arrow per digit, so the
rule learned is "the digits slide, the point stays". *Place-value relationships*: what a digit is worth, and "1/10 of
that value" as one column to the right (`54.293`). *Division area models*: partial quotients drawn as strips, asking
for a missing product, the quotient, or how much is left to divide (`4,992 ÷ 32`). *Which expression equals it?*:
four near-identical products, answered by the ones digit and an estimate rather than by multiplying all four, with the
answer given as an option number. *What the remainder means*: the same division read three ways — round up, round
down, or the leftover itself. Five lessons, and it plays in Practice, Blitz, Conquer, Speed, Versus, Stud and Weakest
Gear like any other game. Visuals `pvchart|areamodel|options`; skills `spiral`,
`spiral.powers|pvalue|areamodel|whichexpr|interpret`.

**Mental Math Academy** (More → Mental Math Academy; `src/engine/mentalmath/`) teaches mental calculation rather than
testing it. Ten worlds run from number building through two- and three-digit addition and subtraction to two-digit,
three-by-one and friendly three-by-two multiplication, ending in strategy mastery and an arena. Forty-five skills each
carry a target time and a speed ladder.

- **Strategy engine** (`strategies.ts`) derives every valid mental route from the numbers themselves — place-value
  chunks, left to right, make a ten, round and compensate, near doubles, friendly pairs, count down, count up,
  constant difference, distribute, round and take back, double and halve, ×11, difference of squares, factor splits —
  each with the full chain of intermediate values, why it is valid, and an `effort` score that estimates mental cost.
  That score drives "which way would you solve it?" and the ordering of "show me another way". A strategy whose steps
  do not reach the true answer is never shown; the test suite checks every strategy over more than 50,000 problems.
- **Mental Workspace** (`MentalWorkspace.tsx`) animates the chain a learner should run in their head: 347 → +200 →
  547 → +80 → 627 → +6 → 633, with place-value blocks and decomposition cards for World 1. It respects reduced motion
  and can be switched off as mastery grows.
- **Guided practice** walks a seven-level scaffolding ladder, from watching the chain worked through, to typing each
  intermediate total (with "holding 547" chips), to choosing the route yourself, to a hint button, to nothing, to a
  per-question clock. Four clean answers remove a level of help; two misses hand it back.
- **Error analysis** (`errors.ts`) classifies a wrong answer instead of marking it wrong: stopped part-way,
  compensation ran the wrong way, carry missed, borrow flipped, place-value slip, fact slip, reversed, near miss,
  working memory. The learner's error profile steers later practice.
- **Progress** (`progress.ts`) holds scaffolding level, speed-ladder step, error counts, personal records, spaced
  review dates and the daily-workout streak; core mastery, XP, the notebook and spaced repetition come from the
  game's existing engines, because every academy answer is recorded as a normal question against a registered skill.
- **Modes**: Learn, Guided, Practice, Speed, Mastery, a phased **world boss**, a personalised **daily workout**, an
  adaptive **placement challenge** that unlocks the worlds a learner already owns, a **visualisation trainer**, free
  practice by operation and size, and **Mental Math Blitz** in the Arcade (also available in Naval Blitz levels and at
  the Stud and Weakest Gear tables). Problems can be read aloud with the browser's own voice.

**Profiles.** Several players share one device, each with their own save slot (`engineering-quest.save.<id>`; the
first profile keeps the original key so old saves carry over). The main menu asks "Who's playing?"; Settings (or a tap
on the HUD avatar) lets you switch, rename, reset (wipes progress, keeps the slot) or delete a profile. No passwords.
Index: `src/engine/save/profiles.ts`; the store swaps the save adapter's key and cancels pending writes when switching.

**Wrong-Answer Notebook** (village hotspot or More → Notebook) is the Chinese 错题本 habit built in: every miss in any
game becomes a card with the question, what you answered, and an auto-classified error kind (wrong operation,
arithmetic slip, ran out of time, left blank, off track). "Fix it" re-asks the original, then three variations of the
same structure (same table neighbours, same word-problem structure, same mental-math move…) and one twist that changes
the structure (the matching division fact, the opposite operation, a two-step). A fix is clean when the original and all
variations are right first time; three clean fixes spaced now → 3 days → 7 days clear the card. Repeat misses become
lapses instead of new cards. Engine: `src/engine/notebook/notebook.ts`.

**Weakest Gear** (Arcade → ⚙ Weakest Gear, village hotspot, or More → Weakest Gear) is a studio quiz for 3–8
contestants: you, pass-and-play friends, and computer players (Apprentice / Technician / Engineer skill). Questions go
round the podiums; each correct answer climbs the chain (10 → 20 → 50 → 100 → 200 → 500 → 1000 gears), BANK locks the
chain into the pot, a miss drops it to zero, and the top of the chain banks automatically. Question difficulty rises
with the chain. When the round clock (90 s, shrinking 10 s per round) runs out, everyone votes off the weakest gear;
ties go to the strongest gear of the round; computer players vote on round stats with a streak of meanness. The last
two play a head-to-head final (five questions each, sudden death on a tie) for the pot. Mastery is recorded only for
the phone's owner. Engine: `src/engine/state/gear.ts`.
**Online rooms** (set-up → "Online room"): the host creates an arena code (or shares an invite link with `&game=gear`),
friends join on their own phones, and the host's device runs every rule and broadcasts the whole game state after each
change; guests send answers, banks and votes, which the host only applies on their turn. A guest who disconnects is
voted out; a finalist who disconnects forfeits. Hook: `src/game/hooks/useGearRoom.ts`.

**Stud Math** (Arcade → 🂡 Stud Math, village hotspot, or More → Stud Math) is Mississippi Stud with gear
tokens: two hole cards, three community cards flipped one at a time. Before each flip the player folds or raises
1×/2×/3× the 10-gear ante; the raise sets the difficulty of the question (any Arcade math, or "Odds" where the
question is the live outs percentage) that must be answered to flip the card, and a wrong answer drops the raise to
1×. Outs and the chance are always shown. Winning hands pay by the Mississippi Stud paytable on the whole stake, and
the player must compute stake × pays to collect the full amount. Every correct street answer pays a bonus of 5 gears per
1× raised, and a 60-second **Gear Blitz** (any Arcade math, 5 gears per correct answer plus 20 per star) is the way to
rebuild a bankroll: below the ante you cannot deal until you earn more.
Lessons "Reading the Deck" (outs → percent) and "Is the Raise Worth It?" (expected value). Engine:
`src/engine/state/stud.ts`; skill `prob.outs`; generator `src/engine/questions/odds.ts`.

**Math Millionaire** (Arcade → 💰 Millionaire, village hotspot, or More → Math Millionaire): a fifteen-rung
ladder of word problems where the player picks the *setup* that solves the story, not the number. Safe havens at
$1,000 and $32,000, three lifelines (50:50, Ask Ada, Swap), walk away any time. Difficulty climbs from single-step
stories to two-step ones. Engine: `src/engine/state/millionaire.ts`.

**Naval Blitz** is a ten-level match (3, 5 or 10 levels; each level's math is picked in the set-up card, with
Ramp / All my pick / All mixed presets). Winning a level grows your ship by 8% and promotes its class (patrol boat →
corvette → frigate → … → leviathan); standings show levels won. Any captain, host or guest, can call the next level or
a new match: guests send a request over the room and the host's device starts it for everyone.
It runs a Blitz as a match on identical, seeded
questions:
- *Pass & Play* — 2–6 players take turns on one device; podium at the end.
- *Online Room* — one player hosts and shares a 4-letter code; friends join on their own phones and
  everyone plays at the same moment with a live scoreboard. Online rooms use WebRTC via
  [PeerJS](https://peerjs.com) (MIT), loaded on demand from jsDelivr, with the free public PeerJS
  signalling server. Self-host by setting `window.__EQ_PEER_SERVER__ = { host, port, path, secure }`
  before the game loads. Only the device owner's answers feed their mastery in a match.

The match is an animated 3D naval battle. Correct answers retain the existing Blitz scoring:
10 base points, 5 extra for an answer under 3 seconds, plus 2 × the streak (capped at 10).
Each cumulative 10 points launches one shell, rotating evenly through rival ships. Incoming
shells reduce displayed hull by 3%, with a 10% minimum during play so no player is eliminated
early. Once all results arrive, the highest score stays afloat; most correct answers breaks a
score tie. Exact ties share victory. All other ships sink. Hull is visual battle feedback, not
a second win condition. Pass & Play resolves after every captain's turn.

- Original Three.js warships have rotating guns, arcing shells, water splashes, explosions,
  damage smoke, animated waves and a sinking finale. No external 3D assets are fetched.
- A persistent touch keypad and desktop answer field keep the math controls separate from
  the action. Simple view and automatic WebGL fallback retain ship status and all controls.
  Game/system reduced motion disables decorative motion; sound follows existing settings.
- Fleet IDs determine targets, colours and positions consistently across phones. Round-tagged,
  cumulative scores ignore old packets and local echoes. The fleet locks at launch; unfinished
  disconnects withdraw from the result, while submitted final results are preserved. Both
  players use the host's shared deadline. All online players must use the updated game (room
  protocol v2). PeerJS signalling and connectivity still require internet; Pass & Play works offline.
- Source: `src/game/naval/` owns battle projection, rendering and the gunnery console. The scene
  never changes scores. Tests cover two simulated connected clients, rematches, disconnects,
  ties, duplicate packets, viewport framing, resource disposal, and controls without WebGL.

**Rocket Game** (Arcade → 🚀 Rocket Game, or More → Rocket Game): steer a rocket under the right answer with
◀ ▶ (arrow keys or tap a lane) and hit BOOST before the clock runs out; a wrong lane or a timeout drops a bomb.
Three lives per mission, seven missions from the Launch Pad to the Moon Landing with harder tables and faster
clocks. Points accumulate across flights and unlock the next mission. Engine: `src/engine/state/rocket.ts`.

The rocket screen now presents a **Moon Expedition** with a locally bundled Three.js scene: a launch
complex, animated expedition craft and exhaust, clouds, a stylised Earth, satellite flyby, drifting
rocks and a cratered lunar surface. Mission order and correct-answer progress drive the scenery;
boost/hit/win states drive flight feedback and landing gear. The mission selector includes a direct
button for the next available flight. Math rules, deadlines, mission unlocks and scoring are unchanged.

- **Controls:** tap an answer lane or use left/right arrows, then BOOST (space, Enter or up arrow when
  focus is outside a button). Focused buttons keep their native keyboard behaviour.
- **Fallback:** the existing 2D craft and all answer controls remain available while the 3D module
  loads, if WebGL fails, or after context loss. Use the 2D/3D view button to switch manually.
- **Motion/performance:** respects the game and system reduced-motion settings; decorative motion
  stops when reduced motion is requested. Rendering pauses in hidden tabs, uses a capped pixel ratio,
  and disposes the renderer, geometry and materials on exit. All meshes are original procedural geometry;
  no remote textures, CDN scripts or new image assets are required. The single-file build embeds Three.js.
- **Source:** `src/game/screens/RocketScene3D.tsx` owns the canvas lifecycle; `rocketWorld.ts` builds and
  animates the scene; `src/styles/rocket-expedition.css` scopes the presentation. Neither scene file
  changes or dispatches game state.
- **Checks:** scene tests cover lane alignment across viewport shapes, every mission/status combination
  and resource disposal; screen tests cover WebGL failure and keyboard/button control behaviour.


## What Version 1 contains

- **Main menu, story intro, character creation** (name, six avatars, optional engineering specialization).
- **Arithmetic Village** — home base with five NPC teachers (Professor Vector, Dr. Catalyst, Engineer Volt,
  Professor Newton, Mechanic Ada), Foreman Brick at the mines, the Lecture Hall, Training Grounds, your
  Laboratory and the Inn.
- **Multiplication Mines** — eight galleries, each guarded by a creature bound to a table
  (Ore Slime ×2 → Tunnel Goblin ×3/×4 → Rust Bat ×5/×10 → Stone Golem ×6 → Fire Beast ×7 →
  Shadow Knight ×8 → Crystal Wraith ×9 → Gear Sentinel ×11/×12).
- **The Dragon's Forge** — boss mastery exam: the Multiplication Dragon, 50 facts from all tables,
  at most 5 misses. Winning recovers Power Core I and unlocks the Division Dungeon and the Measurement Bench.
- **Division Dungeon** — Division Imps (÷2–÷12), with the Division Titan previewed for the next expansion.
- **Dungeon of Forgotten Knowledge** — a review dungeon generated from *your* weak and overdue facts.
- **Six first-principles lessons** (what / why / how / when → demonstrate → try), with array, equal-groups,
  number-line and sharing visuals.
- **Engineering missions** — Repair the Bridge, Pump Failure, Project I: Build a Workshop — where
  applied problems visibly construct things.
- **Quests** — story, training, engineering, rescue, exploration, boss and project quests.
- **Combat** — correct answers fire energy blasts; wrong answers let the enemy strike, show a hint and allow a
  retry; a second miss shows the full solution; missed facts are re-asked later in the same battle and enter
  the review schedule. Streaks multiply damage; speed only counts once a fact is nearly mastered.
- **Mastery tracking per individual fact** (6×7 is its own record; 6×7 and 7×6 share it), five bands
  (Learning → Developing → Competent → Nearly Mastered → Mastered), accuracy before speed.
- **Spaced repetition** — 10 min → 1 → 3 → 7 → 14 → 30 → 60 days, adjusted by lapses; weak and due facts are
  drawn far more often; mastered facts stay in cumulative review.
- **Adaptive difficulty** — six levels per skill (foundations → full table → mixed → missing factors →
  applied → multi-step), moving only after a run of results, never after one answer.
- **Procedural question generator** — unlimited multiplication, division, addition and subtraction problems
  with metadata, hints, step-by-step solutions, first-principles explanations, visuals and engineering context.
- **XP, levels, titles, health, energy, intelligence and engineering skill**; **inventory and equipment**
  (goggles, calipers, gloves, boots, charm), consumables and materials dropped by enemies.
- **Skill tree** for the entire curriculum (15 worlds + advanced regions), with per-skill statistics:
  mastery, questions answered, accuracy, response time, mistakes, last practised, next review, prerequisites.
- **World map** with all future regions visible and readiness meters ("Calculus Frontier: 34% ready").
- **Dashboard** — overall level, per-world percentages, daily training plan, streaks, weakest/strongest facts,
  recommended next lesson and skill, achievements.
- **Diagnostic** (36 mixed facts) that recommends a starting table without ever skipping cumulative review.
- **Sound architecture** — synthesised Web Audio cues, mutable in Settings.
- **Every question has "Explain This."**

## Project layout

```
engineering-quest/
  public/assets/            all artwork, organised by type; each folder has a license manifest
    characters/ enemies/ environments/ machines/ icons/ items/ ui/
  src/
    engine/                 pure TypeScript game logic — no React, fully unit-tested
      curriculum/           worlds, skills (with prerequisites), regions, fact ids, readiness checks
      questions/            QuestionGenerator: registry + multiplication / division / arithmetic generators
      mastery/              MasteryEngine: per-fact records, mastery score, bands, weak-item detection
      srs/                  SpacedRepetitionEngine: interval ladder, selection weights
      adaptive/             DifficultyEngine
      combat/               enemies, mine galleries, CombatEngine (pure functions)
      quests/               quest definitions and QuestEngine (event driven)
      inventory/            items and InventorySystem
      progression/          XP curve, titles, achievements
      save/                 SaveSystem: versioned envelope + storage adapters (localStorage / memory)
      sound/                SoundEngine (Web Audio)
      state/                GameState, actions, the root reducer, selectors (dashboard, daily plan)
    content/                NPCs, dialogue, lessons, missions, lab equipment, story
    game/                   React UI: store (context + autosave), components, screens
    styles/global.css       design tokens, layout, animations, responsive rules
  docs/ARCHITECTURE.md      how the systems fit together and how to add the next world
  ASSET_LICENSES.md         every asset with source, creator, license and URL
```

See `docs/ARCHITECTURE.md` for the data model, the mastery formula and a step-by-step guide to adding
World 2 (fractions) without rewriting anything.
