# Number labels audit: academy model captions and step ask lines

Every number taken from a situation or picture should carry a plain-language label right after it, like "40 (total coins) ÷ 20 (equal segments) = 2 (coins per segment)". Two academy surfaces now go through `labeled()`: the caption of a hands-on model (`model.label` for the `numberline`, `plot`, `angle`, `unitcircle`, `table` and `slider` kinds, drawn as `.model-ask`, plus teach-card models and `aid` models) and the step's `ask` line (`.verb-ask`). This register covers every caption and ask that shows a digit, in `src/engine/academy/content/*.ts` and `src/engine/academy/questions.ts`. Only display text changed. Answers, accept lists, `answerText`, choices, `expression` strings, numeric model fields, ids and scoring were not touched. The unit-word `label` of counter, percent and plank (fracbar) models was also left alone. The three arithmetic teach pictures that did not match their text are fixed here too.

Pure maths (equations, coordinates, matrices, special-angle values, sequence rules) is left without labels, because a label adds nothing to "y = 2x + 1" or "(3, 4)". Three bracketed asides that sat right after a number would now be drawn as labels by mistake, so they were reworded.

"Scan" means a throwaway script built every quest, concept check, transfer set and Mastery Trial of every academy with 16 seeds (38,340 caption and ask texts). It checked that each text had no "undefined" or "NaN", that every bracket after a number parses as a label, and that "1 (…)" is singular and other counts are plural. It found 0 problems. "Tests" means `tsc --noEmit`, `teach-cards.test.ts`, `label.test.ts` and `academies.test.ts` for all ten academies, all passing.

| Surface | Original issue | Correction | Status | Verification |
|---|---|---|---|---|
| arithmetic.ts · teach "Ten ones is one ten" (picture) | Place-value chart showed 30, but the worked example bundles 14 | `pvchart` value `'14'` (1 ten, 4 ones) | Fixed | teach-cards test, read |
| arithmetic.ts · teach "Split attack" + questions.ts `splitAttackStep` (picture) | Array highlighted the first 5 **rows**, but the text and expression split the 8 **columns** (7 × 8 = 7 × 5 + 7 × 3) | New optional `highlightCols` on the `array` visual (types.ts, MathVisual `ArrayViz`: shades the first N columns and draws a dashed vertical divider). Card and builder use `highlightCols: 5`. Expression and answer unchanged | Fixed | tsc, academies (arithmetic), read |
| arithmetic.ts · teach "Four detective questions" (picture) | Bar `[5, 8, 8, 8]` labelled "?" did not match "12 bolts shared by 3 crews" | Bar `bolts: [?, ?, ?]` with whole 12: three equal unknown shares of 12 | Fixed | teach-cards test, read |
| questions.ts · `placeValueStep` ask | "Build 41." | "Build 41 (in all). …" | Fixed | scan |
| questions.ts · `joinStep` caption + ask | "Start at 8, hop 1" | "Start at 8 (in cart one), hop 1 (in cart two)" | Fixed | scan |
| questions.ts · `takeAwayStep` caption + ask | "Start at 11, hop back 1" | "Start at 11 (starting amount), hop back 1 (drained out)" | Fixed | scan |
| questions.ts · `buildArrayStep` ask | "Build 5 rows of 2." | "Build 5 (rows) of 2 (brass bolts each)." (right singular or plural) | Fixed | scan |
| questions.ts · `divArrayStep` ask | "Build 2 rows that hold 8 in all." | "Build 2 (rows) that hold 8 (brass bolts in all)." | Fixed | scan |
| questions.ts · `shadeFractionStep` ask | "light exactly 1/4 of the deck" | "light exactly 1/4 (of the deck)" | Fixed | scan |
| questions.ts · `equivalentStep` ask | "same amount as 1/3, using 9 planks" | "same amount as 1/3 (of the deck), using 9 (equal planks)" | Fixed | scan |
| questions.ts · `scaleRecipeStep` ask | "Fill the 4-batch row." | "Fill the row for 4 (batches)." | Fixed | scan |
| questions.ts · `percentOfStep` ask | "Shade 20% on the dial…" | "Shade 20% (tariff rate) on the dial…" | Fixed | scan |
| questions.ts · `writePowerStep` ask | "Set base 5 and the right exponent." | "Set the base to 5 (gauge multiplier) and pick the right exponent." | Fixed | scan |
| questions.ts · `sideFromAreaStep` ask | "whose square is 64" | "whose square is 64 (panel area)" | Fixed | scan |
| questions.ts · `cubeTeaserStep` ask | "whose cube is 8" | "whose cube is 8 (unit cubes)" | Fixed | scan |
| arithmetic.ts · teach "Joining is adding" caption | "Start at 5, hop 3" | "Start at 5 (in the first cart), hop 3 (in the second cart)" | Fixed | scan |
| arithmetic.ts · teach "Taking away" caption | "Start at 9, hop back 4" | "Start at 9 (starting amount), hop back 4 (drained out)" | Fixed | scan |
| questions.ts · ratio-table ask "Fill the empty cell so every row keeps the 1:4 mix." | Ratio notation | A ratio is not a count; left as is | N/A (ratio notation) | read |
| arithmetic-decimals.ts · `tenthsBarStep` asks (tank, beam, hopper) | "Light 0.7 of the tank." | "Light 0.7 (of the tank)." (same for beam, hopper) | Fixed | scan |
| arithmetic-decimals.ts · `hundredthsBuildStep` ask | "then 0.57 counted in hundredths" | "then 0.57 (kilograms) counted in hundredths" | Fixed | scan |
| arithmetic-decimals.ts · `sliderFracStep` ask (hundredths, benchmark fraction) | "Slide the valve to 1/5 open." | "Slide the valve to 1/5 (open)." | Fixed | scan |
| arithmetic-decimals.ts · `sliderFracStep` ask (place words) | "3 tenths and 2 hundredths open" | Each number is already followed by its place word | N/A (unit words follow) | read |
| arithmetic-decimals.ts · `roundLineStep` ask | "Find 10.7, then slide…" | "Find 10.7 (metres), then slide…" | Fixed | scan |
| arithmetic-decimals.ts · `multFracbarStep` ask | "Light 3 scoops of 0.1." | "Light 3 (scoops), each 0.1 (of the hopper)." | Fixed | scan |
| arithmetic-decimals.ts · table captions "10 hundredths make 1 tenth.", "Each column is 10 times the one before.", valve caption "valve (0 shut → 1 open)" | General place-value facts; slider range key | Not situation numbers; the valve bracket follows a word, so it does not parse as a label | N/A (general fact) | scan |
| prealgebra.ts · `readStep` ask | "Start at 0. Tap the reading." | "Start at 0 (street level / zero degrees / zero mark). …" (per frame) | Fixed | scan |
| prealgebra.ts · `oppositeStep` caption | "Peg at −9" | "Peg at −9 (first peg)" | Fixed | scan |
| prealgebra.ts · integer-add step caption + ask | "Start at 2 and add −9." | "Start at 2° (start reading) and add −9° (cooling)." (warming when positive) | Fixed | scan |
| prealgebra.ts · `repeatHopStep` caption + ask | "Street level is 0"; "Hop 2 groups of −6 from 0." | "Street level is 0 (metres)"; "Hop 2 (lowerings) of −6 (metres each) from 0 (street level)." | Fixed | scan |
| prealgebra.ts · `orderLineStep` caption + ask | "Start at 5. Make 3 hops of −2…" | "Start at 5 (needle start). Make 3 (hops) of −2 (each hop)…" | Fixed | scan |
| prealgebra.ts · `sliderSolveStep` ask | "Slide n until 2n + 2 = 4." | "… = 4 (target)." | Fixed | scan |
| prealgebra.ts · distribute-parts ask | "Enter what 6 makes of each part." | "Enter what 6 (outside number) makes of each part." | Fixed | scan |
| prealgebra.ts · percent-whole ratio table ask | "Fill in the litres for 100%." | "Fill in the litres for 100% (full tank)." | Fixed | scan |
| prealgebra.ts · teach "Further left is smaller" caption | "Start at −2. Is −7 left or right of you?" | "Start at −2° (warmer reading). Is −7° (colder reading) left or right of you?" | Fixed | scan |
| prealgebra.ts · teach "Adding is a hop" caption | "Start at −3 and add 5" | "Start at −3 (start) and add 5 (hop right)" | Fixed | scan |
| prealgebra.ts · integer-subtract caption + ask "Start at −6. Tap where −6 − (−4) lands." | A chalked expression, not a situation | Pure arithmetic | N/A (abstract) | read |
| prealgebra.ts · inequality captions ("x + 4 < −1"), "Rule: 2x − 3", teach "Rule: 3x + 5", teach "d = 50t", coordinate ask "Tap (2, −6)." | Equations, rules and coordinates | Symbols name the numbers | N/A (abstract) | read |
| algebra1.ts · all captions and asks (line, function, quadratic and system equations; "Slope −1/2 through P"; "Divide by 5 each row"; "Factor pairs of −14…"; area-model tables; "Tap two points on rail 2"; "Tap the point (0, f(0))"; "Fill the blanks (fractions like 1/4 are fine)") | Equations, rule numbers, a rail index, a format hint | No situation numbers; the bracket in "Fill the blanks (…)" follows a word | N/A (abstract) | scan, read |
| geometry.ts · midpoint-line caption | "A at −3, B at 3" | "A at −3 (ruler mark), B at 3 (ruler mark)" | Fixed | scan |
| geometry.ts · `thirdSideStep` caption | "Beams of 10 m and 5 m" | "Beams of 10 (metres) and 5 (metres)" | Fixed | scan |
| geometry.ts · scale-factor plot caption | "Scale by 3 from O" | "Scale by 3 (scale factor) from O" | Fixed | scan |
| geometry.ts · dilate plot caption | "Dilate by 0.5" | "Dilate by 0.5 (scale factor)" | Fixed | scan |
| geometry.ts · `braceSliderStep` ask | "to the nearest 0.1 m" (unit symbol) | "to the nearest tenth of a metre" | Fixed | scan |
| geometry.ts · teach "Can the beams close?" caption | "Beams 4 and 7: the third is between 3 and 11" | "Beams 4 (short beam) and 7 (long beam): the third is between 3 (lower limit) and 11 (upper limit)" | Fixed | scan |
| geometry.ts · "Rotate 90° clockwise" and similar, "45-45-90 triangles", "Cross-multiplied: 4x + 4 = 2x + 10…", "Fill in ∠1, ∠2 and ∠3 in degrees.", teach "Try it: set 135°", "the midpoint of (−4, 1) and (2, 5)", "turn P(4, 1) 90° counterclockwise" | Turn sizes with their unit, a triangle name, equations, angle names, coordinates | Already clear | N/A (abstract / unit shown) | read |
| algebra2.ts · shift-vertex plot caption | "g(x) = (x + 4)² + 4 (parent dashed)" would now draw "4 (parent dashed)" as a label | "g(x) = (x + 4)² + 4, parent dashed" | Fixed | scan (no stray labels) |
| algebra2.ts · `growthTableStep` ask | "Fill in y for x = 0, 1, 2, 3." (x is hours) | "Fill in y for x = 0, 1, 2 and 3 (hours)." | Fixed | scan |
| algebra2.ts · `doublingSliderStep` ask | "Slide t until N = 4." | "Slide t until N = 4 (target count)." | Fixed | scan |
| algebra2.ts · `compoundTableStep` caption + ask | "10% a year"; "after years 1, 2 and 3" | "10% (interest rate) a year"; "after 1 (year), 2 (years) and 3 (years)" | Fixed | scan |
| algebra2.ts · other captions and asks (vertex, polynomial, rational, exponential, log equations; "Build 25 as a power of 5"; "Tap the point for n = 5"; transformation asks; balance asks; "powers of 4"; complex products) | Equations, term index, log gauge value | No situation numbers | N/A (abstract) | read |
| trig.ts · `rampPointStep` caption + ask | "Run 6: where is the top?"; "Tap the point at run 6." | "Run 6 (metres): …"; "Tap the point at run 6 (metres)." | Fixed | scan |
| trig.ts · jib slider ask | "until the tip height reaches 12 m" | "until the tip height reaches 12 (metres)" | Fixed | scan |
| trig.ts · `arcSliderStep` ask | "until s = rθ reaches 7.5 m" | "until s = rθ reaches 7.5 (metres of cable)" | Fixed | scan |
| trig.ts · circle-point plot caption | "Radius 5: tap the tip" | "Radius 5 (metres): tap the tip" | Fixed | scan |
| trig.ts · `radToDegDialStep` angle caption | "23π/12 rad" (unit symbol) | "23π/12 (radians)" | Fixed | scan |
| trig.ts · unit-circle and special-angle captions ("cos θ = √3/2", "(−1/2, √3/2)", "sin⁻¹(1/2)", "2 cos x = √3"), "Terminal side of 135°", "Tip at 2θ", "a = 5, b = 8", "to 1 decimal place", "as fractions over 65", row/gap asks, "Type each missing value (…)" | Exact values, coordinates, named sides, rounding and format instructions | No situation numbers; "π" and "radian" words kept where the unit-circle model looks for them | N/A (abstract) | scan, read |
| precalc.ts · polynomial sign-chart ask | "f(x) < 0 (not a zero)" would now draw "0 (not a zero)" as a label | "Tap any whole number where f(x) < 0; skip the zeros." | Fixed | scan (no stray labels) |
| precalc.ts · exponential `growthTableStep` ask | "Fill in N for t = 1, 2 and 3." (t in hours) | "… t = 1, 2 and 3 (hours)." | Fixed | scan |
| precalc.ts · `paramTableStep` ask | "for t = 1 and t = 2" (seconds) | "for t = 1 (second) and t = 2 (seconds)" | Fixed | scan |
| precalc.ts · other captions and asks ("Zeros at 0, 3, 5", "Critical points 1 and 3", sequence rules, "Sensor log: −5, −7, −9, …", "Inside of row 5", parametric and rational captions, "rover's position at t = 1" (no unit given), direction and unit-circle asks, "Powers of 2: 4 = 2²…" balance asks, teach captions) | Abstract or no unit in the story | No situation numbers with a known meaning | N/A (abstract) | read |
| calculus.ts · `ladderTableStep` caption | "x² + y² = 10²" | "Ladder 10 (metres): x² + y² = 10²" | Fixed | scan |
| calculus.ts · `fenceTableStep` caption | "40 m of fence, three sides" | "40 (metres of fence), three sides" | Fixed | scan |
| calculus.ts · other captions and asks (function, limit, Riemann, chain, FTC, series captions; "(each strip is 2 wide)"; "Slide r until 5/(1 − r) = 4"; slope-of-ln and trig-slope asks) | Abstract functions and strip widths | No situation numbers; the bracket in the Riemann ask follows a word | N/A (abstract) | scan, read |
| linalg.ts · elimination ask | "Fill in the new row 3 (its y, z and b entries)." would now draw "3 (its y, z and b entries)" as a label | "Fill in the new row 3: its y, z and b entries." | Fixed | scan (no stray labels) |
| linalg.ts · other captions and asks (matrices, vectors, row operations, transforms, "P = […] (columns: from A, from B)", "Balance det = 0…") | Matrix and vector entries | Pure linear algebra; the P bracket follows "]" | N/A (abstract) | read |
| diffeq.ts · cooling slider ask | "Slide to the time when T = 40°." | "… T = 40° (target reading)." | Fixed | scan |
| diffeq.ts · mixing Euler table ask | "Fill the rate at t = 0, then Q at t = 1." | "… t = 0 (minutes), then Q at t = 1 (minute)." | Fixed | scan |
| diffeq.ts · RLC tune slider ask | "until the curve reaches 10 rad/s" | "until the curve reaches 10 (radians per second)" | Fixed | scan |
| diffeq.ts · other captions and asks ("Balance 5P = 150", "Fill y′ + 2y for t = 0, 1, 2", "Compare with the right side, 9t", teach "Right side 3t + 4: 4, 7, 10", "Tap (day 1, amount)", "Tap (minute 2, gap)", characteristic-root and equilibrium asks) | Equations; axis names already given in words | No bare situation numbers | N/A (abstract) | read |

**Counts:** 69 surfaces reviewed. 56 Fixed (3 picture fixes, 50 new labels and 3 reworded stray brackets). 13 N/A, most of them groups of pure-maths captions. 0 Blocked.
