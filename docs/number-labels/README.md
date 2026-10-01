# Number labels: audit register

Every number that comes from a situation or a picture now says what it is, in plain words in brackets right after it,
and the answer is labelled too:

> 40 (total coins) ÷ 20 (equal segments) = 2 (coins per segment)

This folder is the evidence for the audit (developer handoff: *Math Game Number Label Audit*). Each file below is one
area's register, with one row per surface: module/screen/template, original issue, correction, status, verification.

## Counts

| Area | Register | Reviewed | Fixed | Not applicable | Blocked |
|---|---|---|---|---|---|
| Arithmetic Academy (cards, builders, generator) | [arithmetic-academy.md](arithmetic-academy.md) | 140 | 122 | 18 | 0 |
| Pre-Algebra and Algebra 1 | [prealgebra-algebra1.md](prealgebra-algebra1.md) | 297 | 124 | 173 | 0 |
| Geometry | [geometry.md](geometry.md) | 169 | 146 | 23 | 0 |
| Algebra 2 and Trigonometry | [algebra2-trig.md](algebra2-trig.md) | 298 | 181 | 117 | 0 |
| Pre-Calculus and Calculus | [precalc-calculus.md](precalc-calculus.md) | 326 | 143 | 183 | 0 |
| Linear Algebra and Differential Equations | [linalg-diffeq.md](linalg-diffeq.md) | 320 | 161 | 159 | 0 |
| Academy model captions, ask lines and pictures | [model-captions.md](model-captions.md) | 69 | 56 | 13 | 0 |
| Story generators (word problems, rates, measure, volume, pipe, physics) | [story-generators.md](story-generators.md) | 101 | 95 | 6 | 0 |
| Fact generators, mental maths, missions, 77 lessons | [fact-generators-and-lessons.md](fact-generators-and-lessons.md) | 185 | 149 | 36 | 0 |
| Game modes (Dice, Plaza, Tycoon, Count Lab, Reality Lab, Stud, battles, Arcade, Millionaire, Notebook) | [game-modes.md](game-modes.md) | 77 | 59 | 18 | 0 |
| **Total** | | **1,982** | **1,236** | **746** | **0** |

*Not applicable* rows give their reason: a bare fact drill (7 × 8), pure symbolic work (factor x² + 5x + 6), a number
already named in place ("AB = 5 m", "λ = 3"), or a surface with no numbers. Five rows were blocked during the audit and
are now fixed (marked *fixed (follow-up)*):

- three Arithmetic pictures that did not match their worked example (Split attack now shades the 5 columns it splits,
  Ten ones shows 14, the detective bar shows 12 bolts in 3 equal parts);
- the mental-maths count-up steps that hopped past the target (43 − 41 showed "41 → 50"; now one hop of 2);
- the word-problem reveals in Arcade, Millionaire and Notebook, which now show the labelled working.

## The reference lesson: 25% of 40 coins

The *Percent of* teach card is rebuilt as the handoff describes: goal and quantities, the quarter shortcut, where the
20 segments come from (this dial's design, not a rule), 25% ÷ 5% = 5 segments, 5 × 2 = 10 coins, a finished
**Worked example** dial (5 of 20 shaded, "25% of 40 coins = 10 (coins)"), and a separate empty **Your turn** dial that
reads "Your current selection: 0% (0 segments shaded)". The new practice question is 10% of the same 40 coins
(2 segments × 2 = 4 coins).

| | Before | After |
|---|---|---|
| Phone, teach card | [before](screenshots/nl-before-phone-percent-of.png) | [after](screenshots/nl-after-phone-percent-of.png) |
| Phone, "Your turn" with 2 boxes | [before](screenshots/nl-before-phone-percent-yourturn.png) | [after](screenshots/nl-after-phone-percent-yourturn.png) |
| Phone, hint + wrong answer | [before](screenshots/nl-before-phone-choice-miss.png) | [after](screenshots/nl-after-phone-choice-miss.png) |
| Desktop, teach card | [before](screenshots/nl-before-desktop-percent-of.png) | [after](screenshots/nl-after-desktop-percent-of.png) |
| Desktop, "Your turn" | [before](screenshots/nl-before-desktop-percent-yourturn.png) | [after](screenshots/nl-after-desktop-percent-yourturn.png) |
| Desktop, wrong answer | [before](screenshots/nl-before-desktop-choice-miss.png) | [after](screenshots/nl-after-desktop-choice-miss.png) |

## Renderer and template changes

- **`src/engine/label.ts`** (new): the one shared definition of a label. `lab(n, label)`, `labn(n, one, many)` and
  `unit(n, one, many)` write labels with the right singular or plural for generated values; `LABELED` finds them;
  `stripLabels` removes them. A label starts and ends with a letter and holds only letters, spaces and `'’,/-²³`, so maths
  brackets like (x + 3), (2 × 20), f(2) or (ln 2) are never taken for labels. Numbers include money, decimals, fractions,
  %, °, "?", and exact values like 10π, 4√3 and 4π/3.
- **`src/game/components/Labeled.tsx`** (new): `labeled(text)` renders each number and its label as one unbreakable
  unit (`white-space: nowrap`), so a long line wraps at an operator, never between a number and its label. The label is
  smaller, italic and dimmer, so it reads as an explanation, not maths grouping. It is ordinary text, so screen readers
  read it and it is visible by default. `LabelKey` adds the one-line key "Words in (brackets) say what each number is."
- **Rendered with labels:** academy teach cards (text, steps, Try next, chapter panel), question prompts, ask lines,
  feedback, hints and worked solutions, model captions, lesson picture captions, MathChallenge (every mode that uses it),
  the Mental trainer, lessons, missions, Dice Workshop, Equation Plaza score breakdowns, Tycoon, Count Lab, Reality Lab
  (glossary words inside a label are left alone), Stud, battles, Arcade, Millionaire and Notebook.
- **Never parsed:** labels are display text only. Answers, accepted answers, choices, `answerText`, `expression`
  strings, model numbers, ids, scoring and saves are unchanged (checked by diff scans in every area). The teach-card
  maths checker and the tests that rebuild equations call `stripLabels` first, so a wrong sum with labels is still caught.
- **Templates:** generators build labels from their generated values with `lab`/`labn`, so a changed value changes the
  label with it ("1 (coin)", "4 (coins)"), and a label changes when the meaning changes ("(coins per segment)" →
  "(coins)"). Word problems carry a labelled `setup`/`result` next to their plain `layout`.

## Verification

- `npx tsc --noEmit -p .`: clean. `npx vitest run`: 56 files, 492 tests pass, including `label.test.ts` (label finding,
  no false matches on maths brackets, π and surds, stripping, singular/plural) and `teach-cards.test.ts` (every card's
  arithmetic re-checked with labels stripped).
- Every academy's generator test passes (`ACADEMY=<id> academies.test.ts`, all ten academies).
- Each area ran a throwaway scan over many seeds (12 to 149) of every generated question, hint, step and caption:
  every label parses, no "undefined"/"NaN", singular/plural agrees with the value, and the arithmetic still holds once
  labels are stripped. The caption scan alone covered 38,340 texts.
- Phone play-through (Pixel 7) of guided quests in every academy through the real UI: no horizontal overflow, no
  console errors, and every answer still accepted.
- Desktop (1280 × 900) screenshots of the reference lesson and a wrong-answer state.
