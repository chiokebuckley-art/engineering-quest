# Writing an academy

Engineering Quest's Play mode is a ladder of academies: Arithmetic → Pre-Algebra → Algebra 1 → Geometry →
Algebra 2 → Trigonometry → Pre-Calculus → Calculus → Linear Algebra → Differential Equations. Each academy is
one file in `content/` that exports an `AcademyDef` made with `defineAcademy`. The engine, screens, mastery
gates, unlock chain, Arcade practice and tests are shared; an academy is **only content**.

The Arithmetic Academy (`content/arithmetic.ts` + `questions.ts`) is the reference: read two of its chapters
before you start. Kids play this on phones. The players are children and teens working up through school math
toward engineering; the fantasy is an Engineering Apprentice restoring a Mathematical Engine with NPCs
Professor Vector (math), Ada (mechanic/surveyor), Brick (mine foreman), Dr. Catalyst (chemistry), Volt
(electrical), Newton (physics). Story frames are engineering: bridges, pumps, circuits, reactors, cranes,
locks, gears, tanks, trajectories.

## The shape of an academy

```ts
import { defineAcademy, type ChapterSpec } from '../defs';
import { academySkill, mkq, typed, choose, pickModel, model, wave, times, mixOf, conceptFrom, oneOf, rint, pick, rnz, fmt, fracStr, polyStr, coefTerm, fmtSigned, nearMisses, type Rng, type AskStep } from '../kit';

const ID = 'prealgebra';
const S = (key: string) => academySkill(ID, key);          // 'acad.prealgebra.<key>'

// ---- builders: each returns ONE AskStep, fresh from the rng ----
function addIntegersStep(rng: Rng): AskStep {
  const a = rnz(rng, -9, 9); const b = rnz(rng, -9, 9);
  const q = mkq(S('integers'), 'add', {
    prompt: `The reactor gauge reads ${fmt(a)}°. It changes by ${fmt(b)}°. Hop along the line.`,
    expression: `${fmt(a)} + (${fmt(b)}) = ?`,
    answer: a + b,
    hint: `Start at ${fmt(a)}. A negative change hops left.`,
    steps: [`Start at ${fmt(a)}.`, `${b < 0 ? 'Hop left' : 'Hop right'} ${Math.abs(b)}.`, `${fmt(a)} + (${fmt(b)}) = ${fmt(a + b)}.`],
    visual: { type: 'numline', min: -20, max: 20, points: [{ x: a, label: 'start' }] },
  });
  return model(q, { kind: 'numberline', start: a, min: -20, max: 20, label: `Start at ${fmt(a)}` }, [String(a + b)], `Start at ${fmt(a)} and hop ${fmt(b)}. Tap where you land.`);
}

const CHAPTERS: ChapterSpec[] = [
  {
    key: 'integers', title: 'Integers & the Number Line', wing: 'gate', wingName: 'City Gate Thermometers',
    goal: 'Place, compare, add and subtract positive and negative numbers on a number line.',
    misconception: 'Thinking −7 is bigger than −2; subtracting a negative as if it were subtracting.',
    teach: [ { title: '…', text: '…', visual: …, model?: … }, … ],          // 2–3 cards
    quests: [
      { id: 'aq.prealg.integers.gate', name: 'Frozen Gate', giver: 'volt', guided: true,
        hook: 'Volt: "…"', change: 'The gate thermometers read true again.',
        waves: [ wave('Hop the line', times(3, addIntegersStep)), wave('…', mixOf([…])), wave('…', times(2, …)) ] },
      { id: 'aq.prealg.integers.vents', name: '…', giver: 'catalyst', hook: '…', change: '…', waves: [ …3 waves… ] },
    ],
    concept: conceptFrom([addIntegersStep, compareIntegersStep, whichExpressionStep]),   // 3 model-ish items
    transfer: oneOf([integerWordStep, elevationStep]),                                    // new situations
    practice: (rng) => addIntegersStep(rng).question,                                     // typed numeric, for the Arcade
  },
  // … 7–11 more chapters …
  { key: 'trial', title: 'Mastery Trial', … quests: [rehearsal (guided), keeper], … },   // MUST be last
];

export const PREALGEBRA = defineAcademy({
  id: ID, name: 'Pre-Algebra Academy', short: 'Pre-Algebra', tier: 'Foundational',
  blurb: '…', icon: 'book', home: 'algebra-city',
  wings: { gate: { name: 'City Gate', icon: 'unlock' }, … },
  chapters: CHAPTERS,
  trial: (rng) => [ { name: 'Integers', items: [ … ] }, { name: '…', items: [ … ] }, … ],   // 20–32 asks, 3+ phases
  trialIntro: '…', coreName: 'The Variable Core', coreLine: '…', coreColor: '#a78bfa', title: 'Pre-Algebra Graduate',
});
```

Keep the id, name, short, tier, icon, home, coreName, coreColor and title already in your placeholder file.
Remove `draft: true`.

## Rules the tests enforce (`ACADEMY=<id> npx vitest run src/engine/__tests__/academies.test.ts`)

* 8–12 chapters **plus** a final chapter with key `'trial'`. Chapter keys are short kebab-case and unique.
* Every chapter: `goal`, `misconception`, 2–3 teach cards (trial chapter: 1+), two quests; the first quest has
  `guided: true` (it shows the teach cards first). Each quest: **three waves**, 7–10 asks in all (trial-chapter
  quests: 2+ waves, 6+ asks). Quest ids are globally unique: `aq.<short-academy>.<chapter>.<slug>`.
* Every question in chapter K records under `academySkill(ID, K)` (pass `S(K)` to `mkq`). Trial items reuse
  chapter builders, so they carry their chapter's skill.
* **Every quest has 2+ non-typing asks** (choose, pickmodel or a model) and **every chapter has at least one
  hands-on model verb** (numberline, balance, plot, angle, unitcircle, table, slider, fracbar, array, …).
  Aim for 3–4 model asks per quest: the spec is "the player does the math as a verb".
* `choose`: exactly one choice is accepted and no two choices normalise to the same text. Use
  `choose(rng, q, right, wrongs)`: it dedupes for you. Distractors must be the **real mistakes** (sign slip,
  forgot to distribute, added exponents instead of multiplying, used sin for cos, forgot +C, …), not random.
* `pickmodel`: exactly one option label is accepted; labels distinct.
* Model steps: `model(q, spec, accept, askLine)`; the model must be able to produce the accepted answer (the
  test checks ranges, steps, formats; see the table below). `askLine` tells the player what to build.
* Typed answers are numbers the keypad can type: integers, decimals, fractions `3/4`, negatives. Set
  `fraction: true` for fraction answers (the answer field is still the number, e.g. `0.75`), `negative: true`
  or a negative answer shows the minus key, decimals set themselves. Irrational results: ask "to 2 decimal
  places" and set `tolerance` (e.g. 0.01), or use `choose` with the exact form (`'2√3'`, `'π/3'`).
* **Symbolic answers (expressions, equations, intervals, radians with π, vectors) must be `choose` or
  `pickmodel`**, never typed.
* No `undefined`, `NaN` or `Infinity` in any text. Hints never state the answer. `steps` are a correct worked
  solution: first line is shown after a final miss, so make it the key idea.
* `concept(rng)` returns exactly 3 asks (use `conceptFrom([...3+ builders])`): model-based understanding
  checks, not speed facts. `transfer(rng)` returns one ask in a **new situation** (different story frame or
  representation than the quests). `practice(rng)` returns a `Question` with a plain numeric answer (it feeds
  the Arcade and fluency; recommended for every chapter).
* The trial: 20–32 asks across 3–5 named phases spanning every chapter, plus 1–2 transfer items.
* Builders use only the `rng` passed in (never `Math.random`), so a seed reproduces a quest exactly.
* Numbers are chosen so answers are clean (integers, simple fractions, terminating decimals) unless the
  chapter is about estimation/rounding. Check every generated parameter range for degenerate cases: division
  by zero, slope of a vertical line, a quadratic with no real roots when the question expects roots, a
  triangle that violates the triangle inequality, log of a non-positive number, 0 coefficients printed as
  "0x", "1x", "+ −3" (use `coefTerm`, `fmtSigned`, `polyStr`).

## Imports

Content files import only from `'../kit'`, `'../defs'`, `'../types'`, `'../fn'` and types from `'../../rng'`
or `'../../types'`. **Never import `'../../questions'` (the index)**: it creates an import cycle. You may reuse
generators from specific files in `'../../questions/…'` (e.g. `precalc.ts`, `geo.ts`, `rates.ts`, `algebra.ts`)
if you re-skill them: `{ ...q, masterySkillId: S(key) }`.

## Kit (`../kit`)

| helper | what it does |
|---|---|
| `mkq(skill, subtopic, {prompt, expression, answer, hint, steps, visual?, difficulty?, answerText?, fraction?, decimal?, negative?, tolerance?, unit?, app?})` | a Question. `expression` is the big line. `app` = one line on where engineers meet it. |
| `typed(q)` | typed numeric answer |
| `choose(rng, q, right, wrongs[])` | multiple choice, exactly one right, shuffled, deduped |
| `pickModel(rng, q, [{visual, label}], rightLabel)` | pick the matching picture (graphs, diagrams) |
| `model(q, spec, accept[], askLine, extra?)` | hands-on model; `extra.rule` for `on-line`/`set` judging |
| `ask(q, verb, extra)` | anything else, e.g. `{ aid: spec }` to show a helper above a typed answer |
| `wave(name, build)`, `times(k, builder)`, `mixOf([builders])` | waves |
| `conceptFrom([builders])`, `oneOf([builders])` | concept checks (3 items), transfer (1 item) |
| `rint`, `rnz` (non-zero), `pick` | random ints / picks from the rng |
| `fmt(n)` → `'−3'`, `fmtSigned(-3)` → `'− 3'`, `coefTerm(-1,'x')` → `'−x'`, `polyStr([1,-3,2])` → `'2x² − 3x + 1'`, `fracStr(6,8)` → `'3/4'`, `gcd`, `lcm`, `simplify` | formatting |
| `nearMisses(rng, answer, spread, count, step)` | numeric distractors near the answer |
| `evalFn`, `slopeAt`, `riemann` | evaluate a function spec (`../fn`) |

## Hands-on models (`ModelSpec`) and what they produce

| kind | spec | the player… | produces (accept) |
|---|---|---|---|
| `numberline` | `{start, min?, max, label}` integer ticks min..max (keep span ≤ 40) | taps where they land | `'-3'` |
| `balance` | `{a, b, c, d, variable?, label?}` for a·x + b = c·x + d, integers, a ≠ c | applies inverse operations to both sides until x is alone | `String(x)` e.g. `'4'`, `'-2.5'` |
| `plot` | `{range:[x0,x1,y0,y1], count:1|2, label, layers?, arrows?}` integer lattice; keep each span ≤ 12–16 | taps 1 or 2 lattice points | `'2,-3'` or `'0,1;2,5'` (use `rule: {kind:'on-line', m, b}` to accept any two points on a line, `rule: {kind:'set', items:['-2,0','3,0']}` for unordered points) |
| `angle` | `{max:180|360, step, label}` | turns a dial | `'135'` (multiple of step) |
| `unitcircle` | `{label, showCoords?}` | taps one of the 16 special angles | degrees `'0'…'330'` |
| `table` | `{cols?, rowLabels?, rows: (number|string|null)[][], label?, bracket?}` null = input; `bracket` draws a matrix | fills blanks | blanks in reading order joined by commas: `'5,-2,1/2'` |
| `slider` | `{min, max, step, label, unit?, range?, layers?}` optional plot with a moving vertical line | slides | the value `'2.5'` |
| `fracbar` | `{pieces, label}` | lights planks | `'3/8'` (denominator = pieces) |
| `array` | `{rows, cols}` | taps a corner | `'3x4'` |
| `ratiotable` | `{labels:[a,b], rows}` | fills blanks | `'12'` / `'12,15'` |
| `percent` | `{of, label}` 5% segments | shades | the amount `'15'` |
| `power` | `{bases[], exps[]}` | picks base and exponent | `'2^5'` |
| `root` | `{area, cube?}` sides 1..12 | picks a side | `'7'` |
| `counters`, `placevalue` | arithmetic only | | |

Aids (no lock-in, shown above a typed/chosen answer via `ask(q, 'type', { aid })` or `choose(..., { aid })`):
`riemann {fn, a, b, ns:[2,4,8,16], rule?, range}`, `secant {fn, x, hs:[1,0.5,0.1,0.01], range}`, and a
`plot`/`slider` spec used as an explorer.

## Visuals (`visual:` on questions, teach cards and pickmodel options)

New for the academies (see `AcademyVisuals.tsx`):

* `{ type: 'plot', range: [x0,x1,y0,y1], layers: PlotLayers }` — graphs. `PlotLayers`:
  `fns: [{fn, label?, color?, dashed?, from?, to?}]`, `points: [{x, y, label?, open?}]`,
  `vectors: [{x, y, from?, label?}]`, `segments: [{a:[x,y], b:[x,y], dashed?, label?}]`,
  `shade: {fn, a, b}` (area under a curve), `rects: {fn, a, b, n, rule}` (Riemann), `tangent: {fn, x}`,
  `field: {a, b, c}` (slope field of dy/dx = a·x + b·y + c), `vlines`/`hlines: [{x|y, label?}]`.
  Colors: `'teal' | 'orange' | 'ask' | 'label' | 'muted'`.
* `{ type: 'unitcircle', angle?, showCoords?, radians? }`
* `{ type: 'numline', min, max, step?, points?: [{x, label?, open?}], ray?: {from, dir:'left'|'right', open}, segment?: {from, to, openLeft?, openRight?}, jumps?: [{from, to}] }` — integers, inequalities, intervals.
* `{ type: 'geo', items: GeoItem[], w?, h? }` — geometry: `{t:'poly', pts, labels?: per-edge labels, fill?}`,
  `{t:'seg', a, b, label?, dashed?, arrow?}`, `{t:'line', a, b}` (infinite), `{t:'circle', c, r, label?}`,
  `{t:'arc', at, from, to, label?, right?}` (angle mark at vertex `at` between rays to `from` and `to`;
  `right: true` draws the square), `{t:'pt', p, label?}`, `{t:'text', p, text}`, `{t:'tick', a, b, n?}`
  (congruence marks). Coordinates are abstract (y up); the diagram scales to fit. Labels containing `?` are
  highlighted as the unknown.
* `{ type: 'mat', mats: [{rows, label?}], ops?: ['×', '='] }` — matrices side by side.

Useful existing ones: `card {title, lines[]}` (text panel for equations/identities), `fracbar`, `bar`,
`balance {left, right, unknown}`, `grid {points, line?:{m,b}, range?}`, `trirat {opp, adj, hyp, theta?}`,
`rtri`, `angles {shape, known}`, `circle {r, unit, show}`, `rect`, `box`, `cylinder`, `cubes`, `ratio`,
`slope {rise, run}`, `table2`, `bars`, `none`.

Function specs (`../fn`): `{kind:'poly', c:[c0,c1,c2…]}`, `{kind:'exp', a, base, k?}`,
`{kind:'log', a, base (0 = ln), h?, k?}`, `{kind:'sin'|'cos'|'tan', amp?, freq?, phase?, shift?, deg?}`,
`{kind:'rational', num:[…], den:[…]}`, `{kind:'abs', a?, h?, k?}`, `{kind:'sqrt', a?, h?, k?}`,
`{kind:'piece', parts:[{from, to, fn}]}`. All plain data.

## Quality bar

* First principles, not tricks: every chapter teaches **why** before speed (teach cards with a model or a
  picture), names its misconception and has a question that catches it.
* Tier-appropriate: Pre-Algebra reads like grade 6–8; Algebra 1/Geometry grade 8–10; Algebra 2/Trig/Pre-Calc
  grade 10–12; Calculus/Linear Algebra/Differential Equations first-year college, still friendly.
* Every number must be right. After writing, run the sampler and re-derive answers by hand:
  `npx vite-node scripts/academy-sample.ts <id> 3 [chapterKey]`.
* Phone-sized: prompts ≤ 2 short sentences; plots with small integer ranges; tables ≤ 4×4.

## Checks before you finish

```
ACADEMY=<id> npx vitest run src/engine/__tests__/academies.test.ts
npx tsc --noEmit -p tsconfig.json 2>&1 | grep 'academy/content/<file>'
npx vite-node scripts/academy-sample.ts <id> 2
```
