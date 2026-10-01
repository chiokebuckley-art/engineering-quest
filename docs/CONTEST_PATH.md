# Contest Path: AMC 8–style grade tracks

> AMC 8–style practice inspired by common contest skills. Not affiliated with, endorsed by, or an official product of the
> Mathematical Association of America (MAA) or Art of Problem Solving. Every item is original.

Three calm practice tracks, one per child, opened from **More → Contest Path**:

| Track | For | Minutes | Numbers | Clock |
|---|---|---|---|---|
| **Signal Cubes** · Grade 1 Foundation | contest habits and picture thinking | 10–12 | to 20, no percent | never |
| **Gear Trail** · Grade 3 Bridge | two-step stories, early fractions, perimeter, bar charts, small counting | 12–18 | to 1,000, percent only "out of 100" | only if the child says yes (last 4 puzzles) |
| **Tariff Trials** · Grade 5 Contest Ramp | first serious AMC 8–style training | 15–20 | any | only if the child says yes (mini-mock) |

Each profile keeps its own grade. The next grade up can be previewed (3 puzzles) without changing the grade.

## A session

Warm-up (2–3) → one **teach card** (a worked example on a picture, read aloud for Grade 1) → mixed play (5–8) → victory card
(puzzles done, right first try, calm and timed minutes, a lantern on the week strip) → one **Notebook glance** ("Fix it now").

Day themes follow the parent plan: Mon number · Tue picture/space · Wed stories · Thu logic/count · Fri mix (Grade 5: the
10-item **mini-mock**, skill bars, never a score) · Sat free play (Plaza, Dice Workshop, Tycoon) · Sun rest (a short one if they
want it). Grade 1 taps big answer buttons and hears every question; Grade 5 may skip and come back. A session survives a
reload, and every answer feeds mastery, the answer log and the wrong-answer Notebook.

## The seven new games

All are Arcade picture games too (game:kind, difficulty 1–2 = Grade 1, 3–4 = Grade 3, 5–6 = Grade 5), each with 3–4 lessons.

| Game | Kinds | Grades |
|---|---|---|
| **Pattern Lab** | shape and colour trains · growing figures · number patterns · function machines · the 10th term | 1, 3, 5 |
| **Spatial Blocks** | count the cubes · hidden cubes · layer by layer · fill the box · painted cubes | 1, 3, 5 |
| **Counting Paths** | outfits · menus · line-ups · grid routes · handshakes and pairs | 1, 3, 5 |
| **Charts & Venn** | pictographs and tallies · bar charts · pie charts · Venn diagrams · mean and middle | 1, 3, 5 |
| **Logic Lite** | true, false or can't tell · who has what · who is first · must, might or can't · truth-tellers and fibbers | 1, 3, 5 |
| **Multi-step %** | out of 100 · discount then tariff · two cuts in a row · percent of a percent · up then down | 3, 5 |
| **Mirror & Grid** | mirror the picture · lines of symmetry · area by counting · perimeter on the grid · tangram pieces | 1, 3, 5 |

Plus a Market Tariff sequel teach card in the Arithmetic Academy: **Discount, then tariff**.

The picture never shows the answer (a finished picture appears only in "Show me how"). Wrong tap options come from real
mistakes, and tests check that a child cannot guess from the options alone (no runs of consecutive numbers, no "pick the one
whose double is offered"). Every number in hints and worked steps carries a plain-language label.

## Grade caps on the rest of the game

With a grade set (and caps on), the Arcade lists only that grade's games and kinds and plays them at the grade's size. Grade 1
has no Blitz, Speed, Conquer, Rocket, Stud, Weakest Gear or Count Lab. Grades 3 and 5 are asked before any clock. Millionaire
stops at the grade's rung, Plaza and Tycoon start at the grade's level, friends' rooms follow the caps, and the Learn screen
shows the lessons on the child's path. A grown-up can tap **Show everything** (one tap turns caps back on).

## For grown-ups

The parent card (Contest Path hub and Stats) shows the 4-day plan, this week's sessions and calm vs timed minutes, weak spots,
and the weekly checklist: default to Calm; clear one old Notebook card; celebrate process, not score; if there are tears, drop
Thursday logic and shorten to 8 minutes; never use real contest papers with young children. More logic puzzles live in
[Logic Quest](https://chiokebuckley-art.github.io/logic-quest/).

## Code

- `src/engine/contest/` — grade profiles and caps (`grades.ts`), sessions (`track.ts`), mini-mock (`mock.ts`), parent plan
  (`plan.ts`), Grade 1 picture stories (`stories.ts`), save slice (`state.ts`), picture types (`visuals.ts`).
- `src/engine/questions/{patterns,spatialBlocks,countingPaths,dataLite,logicLite,percentMulti,gridShapes}.ts` and lessons in
  `src/content/contest/`. Pictures in `src/game/components/contest/`.
- `src/game/screens/ContestTrackScreen.tsx`. Tap choices and **Read to me** live in `MathChallenge`.
- `?gallery=<game>&kind=<kind>&d=<1-6>&n=<count>&seed=<n>` shows live questions with their answers and worked solutions.
- Tests: one file per game (answers recomputed independently from the picture over thousands of seeds), `contestTrack.test.ts`,
  `gradeCaps.test.ts` (every allowed selection for every grade drawn against the caps).
