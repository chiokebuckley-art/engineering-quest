# Number labels audit: fact generators, mental maths and lessons

Register for the fact/abstract question generators (`src/engine/questions/`), the mental-maths engine (`src/engine/mentalmath/`), missions and lessons (`src/content/`); "scan" = a scratch run printing 20 questions per skill at difficulties 1–6 plus every mission stage, lesson text and mental-maths note, checking each `number (label)` against the shared label shape.

| Surface (file · generator/lesson id) | Original issue | Correction | Status (fixed / not applicable / blocked) | Verification |
|---|---|---|---|---|
| arithmetic.ts · genAdd (prompt, expression) | Bare fact drill ("Compute 27 + 21"): no situation. | None needed. | not applicable | Read by eye |
| arithmetic.ts · genAdd (hint, steps, explanation) | Split-the-tens strategy used bare parts: "27 + 20 = 47, then add 1". | Role labels: 21 (the number we split) = 20 (tens part) + 1 (ones part); 47 (running total); 48 (sum). | fixed | tsc + full vitest (492/492); scan |
| arithmetic.ts · genSub (steps) | Check step "25 + 13 = 38" did not say which number is found. | 25 + 13 (missing part) = 38; result 13 (difference). Number-line prose already names steps. | fixed | tsc + full vitest (492/492); scan |
| bonds.ts · bondQuestion variants 0–2 ("What makes 10?") | Bar and check lines bare; make-ten line read "13 → 10 (that's 0)" for parts ≥ 10; jump line put digits in brackets ("then to 100 (30)"). | Role labels total / known part / missing part; jumps labelled (first jump, second jump, partner to make ten, more to reach the total); parts ≥ 10 get their own line. | fixed | tsc + full vitest (492/492); scan |
| bonds.ts · bondQuestion variant 3 scenes (hand, battery rack, bolt crate, tank, marble box) | Story numbers bare in steps and checks. | Each scene carries labels, e.g. 10 (rack spaces) − 7 (batteries in) = 3 (more batteries). | fixed | tsc + full vitest (492/492); scan |
| multiplication.ts · baseQuestion / pureMultQuestion (prompt, expression, steps) | Bare fact drill "7 × 8 = ?". | None needed. | not applicable | Read by eye |
| multiplication.ts · multStrategy (hints and explanations of every × and ÷ fact) | Partial products unlabelled ("70, minus 7 = 63"); "(turn the array on its side)" sat in brackets after a number, so it would render as a label. | Partial products say what they hold: 70 (ten sevens) − 7 (one seven) = 63 (nine sevens); the array aside moved out of brackets. | fixed | tsc + full vitest (492/492); scan |
| multiplication.ts · multExplanation (pure facts) | Abstract "a groups of b" wording names its numbers in prose. | Unchanged; strategy lines carry role labels. | not applicable | Read by eye |
| multiplication.ts · missingFactor | Division-in-disguise line bare. | 48 (product) ÷ 6 (known factor) = 8 (missing factor). | fixed | tsc + full vitest (492/492); scan |
| multiplication.ts · appliedProblem (all 12 scenarios in applied.ts) | Hint, steps and explanation bare; hint said "1 rail carts". | Labels built from the scenario: 6 (support assemblies) × 8 (bolts per support assembly) = 48 (total bolts); multExplanation takes the same labels; singular/plural via unit(). | fixed | tsc + full vitest (492/492); scan |
| multiplication.ts · multiStep variant 0 (stock) | Intermediate total reused without a label. | 44 (cells needed) − 24 (cells in stock) = 20 (cells still to get). | fixed | tsc + full vitest (492/492); scan |
| multiplication.ts · multiStep variant 1 (spares) | Same. | 50 (watts for the job) + 5 (spare watts) = 55 (total watts). | fixed | tsc + full vitest (492/492); scan |
| multiplication.ts · multiStep variant 2 (two deliveries) | Deliveries bare; prompt said "1 support assemblies". | First/second delivery labelled; total labelled; prompt plural fixed. | fixed | tsc + full vitest (492/492); scan |
| division.ts · base / pureDivQuestion | Bare fact drill "56 ÷ 7". | Only the check step gets a role: 7 × 8 (missing factor) = 56. | fixed | tsc + full vitest (492/492); scan |
| division.ts · divExplanation (pure) | Abstract grouping sentence; names its numbers. | Unchanged (strategy line is labelled via multStrategy). | not applicable | Read by eye |
| division.ts · appliedDivision (all 12 scenarios) | Total, groups and share bare. | 108 (total motors) ÷ 12 (robots) = 9 (motors per robot) in hint, steps and a labelled divExplanation. | fixed | tsc + full vitest (492/492); scan |
| tricks.ts · times11Question (two digits) | Digit sum and carry bare. | 4 (tens digit) + 3 (ones digit) = 7 (digit sum); 6 (front digit) + 1 (carry) = 7 (new front digit). Test strings kept. | fixed | tsc + full vitest (492/492); scan |
| tricks.ts · times11Question (three digits) | Neighbour sums bare. | Left/right middle sums labelled; positional read-off unchanged. | fixed | tsc + full vitest (492/492); scan |
| tricks.ts · square5Question | Front × next bare. | 7 (front number) × 8 (next number) = 56 (front part). | fixed | tsc + full vitest (492/492); scan |
| tricks.ts · same10Question | Parts bare; hint put "(as two digits)" in brackets after a number. | Ones digits, shared front number, left and right parts labelled; hint reworded. | fixed | tsc + full vitest (492/492); scan |
| mental.ts · Tens first | "47 + 30 → 4 tens + 3 tens" names its numbers. | None needed. | not applicable | Read by eye |
| mental.ts · Next ten | Complement bare. | 8 (partner to make ten); 8 (jump to the next ten). | fixed | tsc + full vitest (492/492); scan |
| mental.ts · Break apart (add and subtract) | Split parts bare. | Number we split, tens part, ones part, running total, sum/difference. | fixed | tsc + full vitest (492/492); scan |
| mental.ts · Round & compensate (add and subtract) | Correction bare; `when` text had "(it is almost a ten)" after a number. | 2 (extra), running total labelled; "46 + 30 = 76" kept (test); `when` reworded. | fixed | tsc + full vitest (492/492); scan |
| mental.ts · Make a ten | Complement and remainder bare. | Partner to make ten, left to add, round ten. | fixed | tsc + full vitest (492/492); scan |
| mental.ts · Count the distance | Hops bare; zero hops shown ("40 → 40 is 0"). | Hop to the next ten, tens hop, last hop, distance; zero hops dropped. | fixed | tsc + full vitest (492/492); scan |
| questions/mentalmath.ts · questionFromProblem (arithmetic) | Steps printed `label = total (note)`: the note rendered as a label of the running total, and partial products read "3 × 7 = 21 = 161". | New stepText: running total / answer labels, partial products as "3 × 7 = 21 → 161 (answer)", note after a dash. | fixed | tsc + full vitest (492/492); scan |
| questions/mentalmath.ts · questionFromProblem (number-sense facts) | Printed "11 = 10" and "So 11 = 10". | Shows the labelled note and "So the answer is 10". | fixed | tsc + full vitest (492/492); scan |
| mentalmath/strategies.ts · StrategyStep.label (all 17 strategies) | Shown bare in choice buttons and hints. | Unchanged: guidedSteps parses these labels into the questions and expected answers of guided practice. | not applicable | Checked guidedSteps / session.ts |
| mentalmath/strategies.ts · step notes: make-ten, compensate, sub-compensate, mul-compensate | Complement, extra and take-back amounts bare. | Partner to make ten, left to add, extra, amount to take back; kept the 'too many' / 'take it back' / 'give it back' / 'counted' phrases that effort and error diagnosis read. | fixed | tsc + full vitest (492/492); scan |
| mentalmath/strategies.ts · other step notes, `why`, `when` | Prose ("hundreds first", "19 is almost 20") or abstract identities. | None needed. | not applicable | Read by eye |
| mentalmath/strategies.ts · explain() | Same `= total. (note)` pattern. | Uses stepText. | fixed | tsc + full vitest (492/492); scan |
| mentalmath/strategies.ts · subCountUp | When the first hop overshoots (43 − 41: "41 → 50") the chain shows "50 → -50: -100 (hop)". | Not changed: the fix alters guided-step expected values (answers), outside display-only scope. Needs an engine fix. | fixed (follow-up) | Seen in scratch print (mm.sub2.countup). Follow-up: fixed the overshoot in the engine: the first hop only goes to the next ten when that ten is on the way; the answer is unchanged and a regression test covers 43 − 41 and a sweep of close pairs (c4bf07f) |
| mentalmath/generator.ts · place-value and expanded-form notes | "so it is worth 300"; "splits into 300 + 40 + 7". | 3 (hundreds) = 300 (ones); 300 (hundreds part) + 40 (tens part) + 7 (ones part). | fixed | tsc + full vitest (492/492); scan |
| mentalmath/generator.ts · halve, make-ten, make-hundred asks, friendly pair | Prose names each number. | None needed. | not applicable | Read by eye |
| mentalmath/curriculum.ts · MM_LESSONS intros: expand, make10, make100, complement, add2 chunks/left/make10/comp/double/friendly, add3 chunks/comp/friendly, sub2 chunks/comp/countup/constant, sub3 chunks/comp/countup, mul dist/by5/by25/doubling/2x1/2x2/comp/11/squares/3x1/3x2 | Worked examples bare. | Role labels: partner to make ten, tens/ones part, running total, extra, first/second hop, ten/five groups, middle/gap squared… | fixed | label scan of every say text and summary; read by eye |
| mentalmath/curriculum.ts · MM_LESSONS intros: place, double, halve, times10, units, mul.facts, mul.dh, mixed, add2/add3/sub2/sub3 mixed, arena, choose | Prose or abstract; numbers already named. | None needed. | not applicable | Read by eye |
| mentalmath/errors.ts · diagnosis messages | Abstract; quote step labels. | None needed. | not applicable | Read by eye |
| mentalmath/session.ts, progress.ts | Feedback repeats step notes (now labelled); no story numbers of their own. | None needed. | not applicable | Read by eye |
| spiral.ts · powersQuestion | Abstract place-value shift; the power is explained before use. | None needed. | not applicable | Read by eye |
| spiral.ts · pvalueQuestion value / tenth | Digit × place bare. | 3 (digit) × 10 (place value) = 30 (what it is worth); 0.2 (value now) ÷ 10 = 0.02 (one tenth of it). | fixed | tsc + full vitest (492/492); scan |
| spiral.ts · pvalueQuestion pick | Steps name each value in prose. | None needed. | not applicable | Read by eye |
| spiral.ts · areaModelQuestion blank / left / quotient | Picture numbers bare. | Divisor, partial quotient, row product, dividend, used so far, left to divide, quotient. | fixed | tsc + full vitest (492/492); scan |
| spiral.ts · whichExprQuestion | Estimate bare. | First/second number rounded, estimate. | fixed | tsc + full vitest (492/492); scan |
| spiral.ts · interpretQuestion (book, vans, bolts, ribbon, eggs) | Story division bare. | 208 (pages) ÷ 23 (pages per day) = 9 (full days) remainder 1 (page left); rounded answers labelled. | fixed | tsc + full vitest (492/492); scan |
| prob.ts · algebra (oddsToP, pToOdds, proportion, rearrange) | Worked steps bare (story numbers, rates, intermediate results). | Labelled: wins, outcomes, losses, goals per match, win rate…. | fixed | tsc + full vitest (492/492); scan |
| prob.ts · count (multiply, perm, comb) | Worked steps bare (story numbers, rates, intermediate results). | Labelled: shirts × trousers × hats, first/second/third place choices, orderings, line-ups. | fixed | tsc + full vitest (492/492); scan |
| prob.ts · sample (dice, coins, complement) | Worked steps bare (story numbers, rates, intermediate results). | Labelled: faces on die one/two, ways, chance of rain / no rain. | fixed | tsc + full vitest (492/492); scan |
| prob.ts · events (independent, exclusive, dependent, atleast) | Worked steps bare (story numbers, rates, intermediate results). | Labelled: chance A/B wins, home win, draw, first/second red as 4/10 (first red), chance all miss. | fixed | tsc + full vitest (492/492); scan |
| prob.ts · conditional (given, joint, marginal) | Worked steps bare (story numbers, rates, intermediate results). | Labelled: home games, home and win, everyone, column total. | fixed | tsc + full vitest (492/492); scan |
| prob.ts · bayes | Worked steps bare (story numbers, rates, intermediate results). | Labelled: with/without a fault, flag rates, true/false/all flags. | fixed | tsc + full vitest (492/492); scan |
| prob.ts · center (mean, variance, sd) | Worked steps bare (story numbers, rates, intermediate results). | Labelled: sum, values, sum of squared gaps, variance, standard deviation. | fixed | tsc + full vitest (492/492); scan |
| prob.ts · sampling (expected, se, margin) | Worked steps bare (story numbers, rates, intermediate results). | Labelled: win rate, games, sample size, standard error; 1.96 (z for ninety-five percent). | fixed | tsc + full vitest (492/492); scan |
| prob.ts · hypothesis (z, sig) | Worked steps bare (story numbers, rates, intermediate results). | Labelled: observed/claimed rate, standard error, z-score, 1.96 (cut-off). | fixed | tsc + full vitest (492/492); scan |
| prob.ts · binomial (exact, atleast) | Worked steps bare (story numbers, rates, intermediate results). | Labelled: patterns, chance of one pattern, chance. | fixed | tsc + full vitest (492/492); scan |
| prob.ts · poisson (exact, atmost) | Worked steps bare (story numbers, rates, intermediate results). | Labelled: λ = 2 (average goals in a match), k (count we want). | fixed | tsc + full vitest (492/492); scan |
| prob.ts · normal (z, tcrit, below, above) | Worked steps bare (story numbers, rates, intermediate results). | Labelled: value, mean, SD, z-score, degrees of freedom, critical t. | fixed | tsc + full vitest (492/492); scan |
| prob.ts · regress (predict, slope, logistic, multi) | Worked steps bare (story numbers, rates, intermediate results). | Labelled: baseline points, points per shot, rise, run, form weight, 5 (intercept). | fixed | tsc + full vitest (492/492); scan |
| prob.ts · vectors (dot, matvec, eloE, eloUpdate) | Worked steps bare (story numbers, rates, intermediate results). | Labelled: weight, feature, A/B rating, 400 (rating gap for ten to one odds), surprise, K factor. | fixed | tsc + full vitest (492/492); scan |
| prob.ts · markov (twostep, steady, walk, mc) | Worked steps bare (story numbers, rates, intermediate results). | Labelled: chance to stay/leave/return, average step, playoff runs, simulated seasons. | fixed | tsc + full vitest (492/492); scan |
| prob.ts · decision (ev, fair, kelly, ruin) | Worked steps bare (story numbers, rates, intermediate results). | Labelled: chance to win/lose, gain, stake lost, edge, payout, bankroll units, risk of ruin. | fixed | tsc + full vitest (492/492); scan |
| prob.ts · prompts and expressions | Prompts name every number in prose; expressions are answer-format strings. | Unchanged. | not applicable | Read by eye |
| odds.ts · oddsQuestion (Stud outs) | Cards and chance bare. | 2 (helpful cards) ÷ 50 (unseen cards) = 0.040 (chance as a decimal) ≈ 4% (chance to improve). | fixed | tsc + full vitest (492/492); scan |
| games.ts · PICTURE_GAMES intros | 3.14 and 1.414 introduced without saying what they are. | 3.14 (pi); 1.414 (travel per unit of offset). Other numbers are named in prose. | fixed | Read by eye |
| games.ts · kinds, labels, lesson lists | No numbers from situations. | None needed. | not applicable | Read by eye |
| fit.ts · caliper | Readings and limits bare in worked steps. | Labelled: 23 (main scale, mm) + 0.4 (vernier, mm) = 23.4 (reading, mm). | fixed | tsc + full vitest (492/492); scan |
| fit.ts · micrometer | Readings and limits bare in worked steps. | Labelled: sleeve, thimble, reading (mm). | fixed | tsc + full vitest (492/492); scan |
| fit.ts · tolerance (max, min, out) | Readings and limits bare in worked steps. | Labelled: nominal, tolerance, upper/lower limit, measured, mm too big/small. | fixed | tsc + full vitest (492/492); scan |
| fit.ts · feeler | Readings and limits bare in worked steps. | Labelled: each blade, gap (mm). | fixed | tsc + full vitest (492/492); scan |
| fit.ts · thread (pitch, count, tpi) | Readings and limits bare in worked steps. | Labelled: mm of thread, threads, pitch; TPI step also corrected from the misleading "1 ÷ 16 = 1.59 mm" to 25.4 (mm in an inch) ÷ 16 (threads per inch). | fixed | tsc + full vitest (492/492); scan |
| fit.ts · stackup (tol, max, min) | Readings and limits bare in worked steps. | Labelled: part tolerance, stack tolerance, nominal stack, longest/shortest stack. | fixed | tsc + full vitest (492/492); scan |
| fit.ts · error (abs, pct) | Readings and limits bare in worked steps. | Labelled: reading, true value, error, percent error. | fixed | tsc + full vitest (492/492); scan |
| fit.ts · runout | Readings and limits bare in worked steps. | Labelled: highest, lowest, runout (mm). | fixed | tsc + full vitest (492/492); scan |
| fit.ts · calibrate (offset, correct, mean) | Readings and limits bare in worked steps. | Labelled: reading, standard, offset, part reading, true value, sum of readings, mean (°C written as degrees). | fixed | tsc + full vitest (492/492); scan |
| fit.ts · wrench | Steps name each size in prose ("thread diameter: 8 mm"). | None needed. | not applicable | Read by eye |
| fit.ts · sigfig | Abstract digit counting. | None needed. | not applicable | Read by eye |
| geo.ts · protractor | Reading named in prose. | None needed. | not applicable | Read by eye |
| geo.ts · angles | Picture measurements bare in worked steps. | Labelled: known angle, known total, straight line / full turn / triangle total / right angle, missing angle. | fixed | tsc + full vitest (492/492); scan |
| geo.ts · circle (d, r, c, travel, turns) | Picture measurements bare in worked steps. | Labelled: radius, diameter, 3.14 (pi), circumference, cm per turn, turns, cm travelled, 100 (cm per metre). | fixed | tsc + full vitest (492/492); scan |
| geo.ts · pythag (ramp, brace, ladder) | Picture measurements bare in worked steps. | Labelled: each side by its role (run, rise, ladder, height on the wall…) and its square. | fixed | tsc + full vitest (492/492); scan |
| geo.ts · slope (percent, rise, ratio) | Picture measurements bare in worked steps. | Labelled: rise, run, rise per metre of run, slope %. | fixed | tsc + full vitest (492/492); scan |
| geo.ts · surface | Picture measurements bare in worked steps. | Labelled: length, width, height, top/front/end, sheet metal (cm²). | fixed | tsc + full vitest (492/492); scan |
| geo.ts · cylinder (base, volume, litres) | Picture measurements bare in worked steps. | Labelled: radius, 3.14 (pi), base area, height, volume, 1000 (cm³ per litre). | fixed | tsc + full vitest (492/492); scan |
| geo.ts · scale (real, drawing) | Picture measurements bare in worked steps. | Labelled: drawing, scale factor, real length (cm, m). | fixed | tsc + full vitest (492/492); scan |
| precalc.ts · frac.add | Common denominator, scale factors bare; scale factors were in digit-only brackets. | Labelled: common denominator, scale factor, new top, common factor ("go into is 6" kept for the test). | fixed | tsc + full vitest (492/492); scan |
| precalc.ts · frac.mul | Cancelled factor and products bare. | Labelled: common factor, new top, new bottom. | fixed | tsc + full vitest (492/492); scan |
| precalc.ts · neg | Size step bare. | Labelled: size of the answer; sign rules stay prose. | fixed | tsc + full vitest (492/492); scan |
| precalc.ts · exp (mul, div, pow, num) | Exponent arithmetic bare. | Labelled: first/second/top/bottom/inner/outer exponent, new exponent, base. | fixed | tsc + full vitest (492/492); scan |
| precalc.ts · exp (zero, negexp) | Abstract identities. | None needed | not applicable | Read by eye |
| precalc.ts · roots (simplify, estimate) | Perfect square and gaps bare. | Labelled: perfect square, what is left, distance above the lower square, gap between the squares. | fixed | tsc + full vitest (492/492); scan |
| precalc.ts · roots (sqrt, cbrt, powroot) | Abstract. | None needed | not applicable | Read by eye |
| precalc.ts · rearrange | Letters only. | None needed | not applicable | Read by eye |
| precalc.ts · evaluate | Each value is paired with its variable letter in the prompt ("Given V = 12, R = 6"); substitution line asserted by precalc.test ('(12) / (6)'). | None needed | not applicable | Read by eye |
| precalc.ts · scinot (toexp, expand) | Abstract. | None needed | not applicable | Read by eye |
| precalc.ts · scinot (mul, div) | Front numbers bare. | Labelled: first/second/new front number. | fixed | tsc + full vitest (492/492); scan |
| precalc.ts · units | Conversion factor bare. | Labelled: × 1000 (m per km), ÷ 3.6 (km/h per m/s) …. | fixed | tsc + full vitest (492/492); scan |
| precalc.ts · func | Function machine on x; abstract. | None needed | not applicable | Read by eye |
| precalc.ts · graph (slope, intercept, value) | Rise, run, intercept bare. | Labelled: rise, run, slope, y-intercept, steps right, change in y. | fixed | tsc + full vitest (492/492); scan |
| precalc.ts · graph (xint) | Abstract. | None needed | not applicable | Read by eye |
| precalc.ts · trig (ratio, side, angle) | Sides and ratio bare. | Labelled: opposite, adjacent, hypotenuse (m), sin/tan of the angle, angle. | fixed | tsc + full vitest (492/492); scan |
| precalc.ts · trig (special) | Table values. | None needed | not applicable | Read by eye |
| algebra.ts · oneStepQuestion, evaluateQuestion | Abstract equations; the letter is defined in the explanation ("x is a number we don't know yet", "here x = 5"). | None needed. | not applicable | Read by eye |
| questions/index.ts | Registry and answer checking; no display text. | None needed. | not applicable | Read by eye |
| missions.ts · m.bridge stages 1–4 | Hints and steps bare ("8 groups of 8", "Posts: 2 × 6 = 12"). | New `labels` per stage; 8 (support assemblies) × 8 (bolts per assembly) = 64 (total bolts); 2 (sides) × 6 (posts on each side) = 12 (posts in total) … | fixed | tsc + full vitest (492/492); scan |
| missions.ts · m.pump stages 1–3 | Shares bare. | 48 (litres in the cistern) ÷ 8 (houses) = 6 (litres per house) … | fixed | tsc + full vitest (492/492); scan |
| missions.ts · m.workshop stages 1–4 | Counts bare. | 8 (timber posts) × 4 (bolts per post) = 32 (bolts for the frame) … | fixed | tsc + full vitest (492/492); scan |
| LessonScreens.tsx | Lesson text rendered raw. | say text, summary points, try intro and card summary go through labeled(); LabelKey shown under a labelled step or summary. | fixed | tsc; read by eye |
| MentalTrainer.tsx | Intro, ask, why, feedback rendered raw. | Wrapped in labeled(); LabelKey in the demo and feedback panels when labels appear. Step labels in choice buttons/hint left raw (parsed labels). | fixed | tsc; read by eye |
| lessons.ts · l.mult-intro | 3 crates of 4 gears added and multiplied bare. | 4 (gears) + … = 12 (gears); 3 (crates) × 4 (gears in each) = 12 (gears). | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.doubling | Doubling chain and battery pack bare. | 14 (two groups) → 28 (four groups); 8 (cells) × 9 (volts per cell), chain labelled in volts. | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.fives-tens-nines | Strategy parts bare. | 80 (ten groups) → 40 (five groups); 70 (ten sevens) − 7 (one seven) = 63 (nine sevens). | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.hard-facts | "5 rows (40) + 2 rows (16)" put digits in brackets. | 40 (five rows of eight) + 16 (two rows of eight) = 56 (seven rows); summary labelled. | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.dozens | Gross and ×11/×12 parts bare. | 12 (boxes) × 12 (bolts per box) = 144 (bolts in a gross); ten/two twelves, sevens. | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.division-link | Pump story division bare. | 24 (litres) ÷ 4 (strokes) = ? (litres per stroke); check labelled. | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.div-strategies | Abstract facts; halving chain bare. | 48 → 24 (half) → 12 (a quarter); facts stay bare. | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.variables | Variable x defined in text; recipe example names each value. | None needed. | not applicable | Read by eye |
| lessons.ts · l.onestep | Abstract balance equations; x defined. | None needed. | not applicable | Read by eye |
| lessons.ts · l.word-detective | Captions were bare story equations. | Captions: 24 (Maya’s bolts) + 18 (Leo’s bolts) = ?, 48 (gears) ÷ 6 (crates) = ? (gears per crate) … | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.word-twostep | Hidden first question and remainder bare. | 5 (boxes) × 8 (bolts per box) = 40 (bolts); 40 (bolts) − 12 (used) = 28 (bolts left); captions too. | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.trick-11 | Digit sums bare. | tens digit, ones digit, middle digit, digit sum, ten/one group, middle sums. | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.trick-sq5 | Front × next bare. | 7 (front number) × 8 (next number) = 56 (front part). | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.trick-same10 | Parts bare. | front number, next number, ones digits, left/right part. | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.mental-tens | Break-apart parts bare. | tens part, ones part, running total. | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.mental-make10 | Complements and corrections bare. | partner to make ten, running total, extra, left to add. | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.mental-distance | Hops bare. | hop to the next ten, tens hop, last hop, distance. | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.volume-cubes | Layer maths bare. | 4 (rows) × 3 (cubes per row) = 12 (cubes per layer) × 2 (layers) = 24 (cubes). | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.volume-jug | Mark value, reading and displacement bare. | 50 (mL between labels) ÷ 5 (spaces) = 10 (mL per mark); after/before/rock. | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.volume-formula | Side products and missing side bare. | cm wide/high/long, cm² per layer, layers. | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.measure-what | Scale mark value implied, not shown. | 100 (g between labels) ÷ 5 (spaces) = 20 (g per mark); 300 + 2 × 20 = 340 (grams). | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.measure-marks | Dial mark value implied. | 50 (g between labels) ÷ 5 (spaces) = 10 (g per mark); reading labelled. | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.measure-zero | End − start bare. | 67 (end, mm) − 20 (start, mm) = 47 (mm long). | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.measure-convert | Conversions bare. | 3 (ft) × 12 (in per ft) = 36 (in); square and cubic inches labelled. | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.measure-around | Perimeter/area results bare. | 20 (m of fence); 4 (rows) × 6 (tiles per row) = 24 (m² of tiles). | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.measure-timetemp | Elapsed time and temperature change bare. | minutes to the hour/after; degrees now/this morning/of rise. | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.measure-loop | Clearance step bare; 10 unexplained. | 5 mm each side, 10 mm in all: 840 (alcove, mm) − 10 (clearance, mm) = 830 (shelf, mm). | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.geo-angles | Missing angle given as prose only. | 180° (straight line) − 110° (known angle) = 70° (missing angle). | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.geo-circles | Wheel and cylinder bare. | 3.14 (pi) × 20 (cm across) = 62.8 (cm per turn); radius squared, cm² of base, cm³. | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.geo-triangles | Squares, slope, scale bare. | run/rise/surface squared; ladder squared; m rise ÷ m run; cm on the plan × scale. | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.rates-ratio | "(2 parts)" in digit brackets; one-part value bare. | 6 (buckets of sand) ÷ 2 (sand parts) = 3 (buckets per part); gravel labelled. | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.rates-chain | Chain product bare. | 2 (ft) × 12 (in per ft) × 2.54 (cm per in) = 60.96 (cm). | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.rates-flow | Fill time, density, rpm bare; 376.8 m jump unexplained. | L ÷ L per minute; g per mL × mL; turns per minute × minutes, cm per turn, 37,680 cm. | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.fit-caliper | Caliper and micrometer sums bare. | main scale / vernier / sleeve / thimble (mm). | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.fit-tolerance | Limits and stack bare. | nominal − tolerance = lower limit; 4 (spacers) × 0.1 (mm each). | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.fit-threads | Pitch and feeler bare. | 10 (mm) ÷ 8 (crests) = 1.25 (mm pitch); blades and gap labelled. | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.fit-error | Error and percent bare. | reading − true = +0.06 (mm); 0.3% (error). | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.phys-torque | Weight, torque, unit and lever maths bare. | kg × N per kg; newton metres; pound-force feet/inches; lever labelled. | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.phys-pressure | Pressure, work, power, kWh bare. | N ÷ m² = Pa; newtons × metres = joules; joules ÷ seconds = watts; kW × hours. | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.phys-electric | Ohm, power, expansion bare. | volts ÷ ohms = amps; volts × amps = watts; micrometres per metre per degree. | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.pipe-size | Capacity chain bare. | 3.14 (pi) × 0.79², cm² inside × cm long = cm³. | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.pipe-route | Offset travel bare. | 300 (mm offset) × 1.414 (travel per unit of offset) = 424 (mm travel). | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.pipe-flow | Fall, flow and head bare. | mm per metre × m; L ÷ s; L ÷ L per minute; m × kPa per metre. | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.proj-frame | Outside size and moulding bare; 16 cm unexplained. | 30 + 4 + 4 = 38 (cm long); 4 (corners) × 4 (cm wide) = 16 (cm extra); 148 → buy 150. | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.proj-box | Volume and sheet sums bare. | cm long/wide/tall; bottom, long sides, short sides, cm² of sheet. | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.proj-plan | Scale conversions bare. | 600 (cm real) ÷ 50 (scale) = 12 (cm on paper); gap labelled. | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.proj-wheel | Circumference and error bare. | 3.14 (pi) × 50 (cm across) = 157 (cm per turn); 10 (turns) × …; error labelled. | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.proj-plumb | Cuts listed bare. | 800 (c-c, mm) − 16 (one take-off) = 784 (cut, mm) …; water volume labelled. | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.proj-ramp | Run and brace bare. | 12 (run per unit of rise) × 0.5 (m rise) = 6 (m run); 1.5 (m brace). | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.proj-fill | Fill time bare. | 72 (litres) ÷ 12 (L per minute) = 6 (minutes). | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.proj-offset | Travel and cut bare. | 250 (mm offset) × 1.414 (…) = 354 (mm travel); 354 − 16 − 16 = 322 (mm diagonal). | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.proj-torque | Lever, wrench and circuit bare. | newtons × metres = newton metres; volts × amps; volts ÷ amps = ohms. | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.proj-water | Head, cuts and flow bare. | m × kPa per metre; 300 − 16 = 284 (mm) …; litres ÷ seconds × 60 (s per minute); drain time. | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.prob-1 | Proportion bare. | 8 (goals) ÷ 5 (matches) = 1.6 (goals per match) × 20 (matches) = 32 (goals). | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.prob-2 | Permutation/combination bare (digits in brackets). | gold/silver/bronze choices, orderings, orders of each trio, line-ups. | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.prob-3 | Dice, and/or, Bayes counts in digit brackets "(100)". | ways to make seven ÷ cells; first/second win; home win + draw; with it, true/false/all flags; caption labelled. | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.prob-4 | Mean, variance, z bare. | total points ÷ games; variance; standard deviation; observed/claimed rate, gap, standard error, z-score. | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.prob-5 | Binomial and Poisson products bare. | 5 (patterns); e to the minus two, two cubed, three factorial; chance. | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.prob-6 | Caption prediction bare. | 10 (baseline) + 2.5 (points per shot) × 12 (shots) = 40 (points). | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.prob-7 | Weights and Elo gaps are named in prose ("200 points up: 76 %"). | None needed. | not applicable | Read by eye |
| lessons.ts · l.prob-8 | Chain routes, drift and Monte Carlo bare. | stay/leave/climb out; step up − step down = drift per step; 6,100 (playoff runs) ÷ 10,000 (seasons). | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.prob-9 | EV, fair payout, Kelly, ruin bare. | win/loss chance, gain, stake, fair payout, of the bankroll, risk of ruin. | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.prob-model | Prior log-odds bare. | ln(0.3 (win rate) ÷ 0.7 (loss rate)) = −0.85 (prior log-odds). | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.stud-outs | Outs ÷ unseen bare. | 2 (helpful cards) ÷ 50 (unseen cards) = 0.04 → 4% (chance). | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.stud-ev | Payout and expected gears bare. | 6 (to one) × 60 (stake) = 360 (gears); × 0.1 (chance) = 36 (gears on average). | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.volume-break | Piece volumes bare. | 60 (piece A) + 18 (piece B) = 78 (cm³); 105 (whole box) − 27 (notch). | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.spiral-powers | Abstract powers of ten; the exponent is explained first. | None needed. | not applicable | Read by eye |
| lessons.ts · l.spiral-place | Digit × place bare. | 2 (digit) × 0.1 (tenths place) = 0.2 (value). | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.spiral-area | Strips and remainder bare. | 32 (divisor) × 100 (partial quotient); 4,992 (dividend) − 3,200 (used) = 1,792 (left); quotient. | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.spiral-which | Estimate bare. | 42,000 (estimate). | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.spiral-remainder | Story division bare. | 208 (pages) ÷ 23 (pages a day) = 9 (full days) remainder 1 (page left). | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.pc-fractions | Abstract fractions; pieces named in prose ("3 + 2 = 5 sixths"). | None needed. | not applicable | Read by eye |
| lessons.ts · l.pc-negatives | Abstract signed numbers. | None needed. | not applicable | Read by eye |
| lessons.ts · l.pc-exponents | Abstract exponent rules. | None needed. | not applicable | Read by eye |
| lessons.ts · l.pc-rearrange | Letters; check example defines V = 12, R = 6. | None needed. | not applicable | Read by eye |
| lessons.ts · l.pc-scinot | Unit chain product bare. | 72 (km/h) × 1000 (m per km) ÷ 3600 (s per h) = 20 (m/s). | fixed | label scan of every say text and summary; read by eye |
| lessons.ts · l.pc-functions | Ladder side bare. | 10 (ladder, m) × sin 30° = 5 (m up the wall); graph points named in prose. | fixed | label scan of every say text and summary; read by eye |
