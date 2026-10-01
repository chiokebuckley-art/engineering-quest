# Number labels audit: Arithmetic Academy

Every teach card and question builder in the Arithmetic Academy, checked against the number-label standard. Checks: TC = `teach-cards.test.ts`, AC = `academy.test.ts`, AA = `ACADEMY=arithmetic academies.test.ts`, PG = `percent-gradient.test.ts`, S = a scripted sample of 149 seeds per builder that checks label shape, singular/plural and the arithmetic once labels are stripped.

| Surface (file · card title or generator/template id) | Original issue | Correction | Status (fixed / not applicable / blocked) | Verification |
|---|---|---|---|---|
| arithmetic.ts · Ch1 "One tap, one crystal" | `1 + … = 6` had no labels. The example counted 6 but the model pile has 7 | Counts to 7 to match the model: `1 + … = 7 (crystals)`, "7 (crystals), is how many there are" | fixed | TC, reviewed |
| arithmetic.ts · Ch1 "See it at a glance" | `3 + 2 = 5` had no labels | `3 (dots seen at once) + 2 (dots seen at once) = 5 (dots in the set)`. The counting list 1–5 is left as it is | fixed | TC |
| arithmetic.ts · Ch1 "More, less, same" | `7 − 4 = 3` had no labels, and the steps said pile B = 4 when the picture shows 5 | Steps now match the picture: `7 (crystals in A) − 5 (crystals in B) = 2 (more crystals in A)`, "5 (pairs)" | fixed | TC, reviewed |
| arithmetic.ts · Ch2 "Tens plates and ones plates" | `4 × 10 + 3 × 1 = 40 + 3 = 43` had no labels | Split into `4 (tens plates) × 10 (per tens plate) = 40 (from tens)`, then the ones, then `40 (from tens) + 3 (from ones) = 43 (in all)` | fixed | TC |
| arithmetic.ts · Ch2 "Ten ones is one ten" | `10 × 1 = 10` and `10 + 4 = 1 ten` had no labels | `10 (ones plates) × 1 (per ones plate) = 10 (in all)`, `14 (loose ones) = 10 (ones to bundle) + 4 (ones left)` | fixed | TC |
| arithmetic.ts · Ch2 "The digit's job" | `2 × 10 + 7 = 20 + 7 = 27` had no labels | `2 (tens) × 10 (per ten) = 20 (from tens)`, `20 (from tens) + 7 (ones) = 27`, "the 2 (tens digit) is worth 20" | fixed | TC |
| arithmetic.ts · Ch3 "Joining is adding" (text, steps, next) | `5 + 3 = 8` and the try-next `7 + 4` had no labels | `5 (first cart) + 3 (second cart) = 8 (in both carts)`, and the hop steps are labelled. Try-next: `7 (first cart) + 4 (second cart)` | fixed | TC |
| arithmetic.ts · Ch3 "Part, part, whole" | `6 + ? = 10`, `10 − 6 = 4` had no labels | `(bolts in)`, `(bolts missing)` and `(bolts needed)` on every step | fixed | TC |
| arithmetic.ts · Ch3 "Order does not matter" | `3 + 8 = 11` had no labels | `3 (small cart) + 8 (big cart) = 11 (in all)` and the swapped version. The hop step is labelled | fixed | TC |
| arithmetic.ts · Ch4 "Taking away" (text, steps, next) | `9 − 4 = 5` had no labels | `9 (starting amount) − 4 (drained out) = 5 (left in the pump)`. Try-next is labelled the same way | fixed | TC |
| arithmetic.ts · Ch4 "Comparing" | `12 − 7 = 5` in the text had no labels | `12 (cart A weight) − 7 (cart B weight) = 5 (how much heavier A is)` | fixed | TC |
| arithmetic.ts · Ch4 "Addition checks it" | Fact family with no labels | Roles only: `(whole)`, `(known part)`, `(missing part)` | fixed | TC |
| arithmetic.ts · Ch5 "Equal groups" | `4 + 4 + 4 = 12`, `3 × 4 = 12 gears` | `3 (crates) × 4 (gears per crate) = 12 (gears)`, and each 4 is labelled `(gears)` | fixed | TC |
| arithmetic.ts · Ch5 "Arrays" | `3 × 4 = 12 squares` | `3 (rows) × 4 (squares per row) = 12 (squares in the grid)` | fixed | TC |
| arithmetic.ts · Ch5 "Area" | `3 wide × 4 long = 12 cells` | `3 (cells wide) × 4 (cells long) = 12 (cells)`, and the repeated-addition line is labelled | fixed | TC |
| arithmetic.ts · Ch6 "Fair share" | `12 ÷ 3 = 4` | `12 (crystals) ÷ 3 (crates) = 4 (crystals per crate)` | fixed | TC |
| arithmetic.ts · Ch6 "How many groups" | `12 ÷ 4 = 3` | `12 (crystals) ÷ 4 (crystals per crate) = 3 (crates)` | fixed | TC |
| arithmetic.ts · Ch6 "Division undoes multiplication" (text, next) | `12 ÷ 3 = 4 because 3 × 4 = 12` and try-next `35 ÷ 5` | Crystals, crates and crystals per crate on both facts and on the try-next | fixed | TC |
| arithmetic.ts · Ch7 "Swap pads" | `3 × 7 = 21` | `3 (rows) × 7 (crystals per row) = 21 (crystals)` and the turned array. The try-next `6 × 8 = 48` is a bare fact | fixed | TC |
| arithmetic.ts · Ch7 "Split attack" | `7 × 8 = 7 × 5 + 7 × 3 = …` had no labels | Split into labelled steps with `(rows)`, `(columns)` and `(crystals)`. The picture's `highlightRows: 5` marks 5 of 7 rows, which does not match a split of the 8 columns, and it is a visual field | fixed (follow-up) | TC. Follow-up: picture now shades the 5 split columns (`highlightCols: 5`, commit f295fde) |
| arithmetic.ts · Ch7 "Inverse pairs" | `24 ÷ 6 = 4` | Roles: `(total)`, `(groups)`, `(per group)` | fixed | TC |
| arithmetic.ts · Ch8 "Equal parts of one whole" | `1/4 + 1/4 + 1/4 = 3/4` | `1/4 (one piece) …= 3/4 (of the plank lit)`, and "3/4 means 3 (lit pieces) out of 4 (equal pieces)" | fixed | TC |
| arithmetic.ts · Ch8 "Same length, different cuts" | `4 × 2 = 8`, `3 × 2 = 6` | `4 (quarters) × 2 (halves per quarter) = 8 (pieces)`, `3 (lit quarters) × 2 … = 6 (lit pieces)` | fixed | TC |
| arithmetic.ts · Ch8 "Adding pieces" | The fraction sums had no count labels | `1 (quarter) + 2 (quarters) = 3 (quarters), so 1/4 + 2/4 = 3/4`, and the same for `2/4 + 1/4` | fixed | TC |
| arithmetic.ts · Ch8 "Taking "of"" | `8 ÷ 4 = 2, then 2 × 3 = 6` | `(whole amount)`, `(equal parts)`, `(in each part)`, `(parts taken)`. The try-next `1/4 of 12` is bare | fixed | TC |
| arithmetic.ts · Ch9 "Part to part" | `2 + 3 = 5 cups` | `2 (cups of oil) + 3 (cups of coolant) = 5 (cups in the whole mix)`, `2/5 (of the whole mix)` | fixed | TC |
| arithmetic.ts · Ch9 "Ratio tables" | `4 ÷ 2 = 2`, `3 × 2 = 6` | `(cups of oil)`, `(cups of oil, first row)`, `(scale factor)`, `(cups of coolant)` | fixed | TC |
| arithmetic.ts · Ch9 "Unit rate" | `20 ÷ 4 = 5`, `7 × 5 = 35` | `20 (crates) ÷ 4 (barges) = 5 (crates per barge)`, `7 (barges) × 5 (crates per barge) = 35 (crates)` | fixed | TC |
| arithmetic.ts · Ch10 "Equivalent ratios" (steps, next) | `3 × 2 = 6 and 8 × 2 = 16` | `(resin)`, `(hardener)`, `(scale factor)` on both scalings and on the try-next | fixed | TC |
| arithmetic.ts · Ch10 "Scale factor" | `4 cm × 5 = 20 cm`. The 5 was not explained before the calculation | "1 : 5 means 1 (cm drawn) stands for 5 (cm built)", then `4 (drawn length in cm) × 5 (scale factor) = 20 (real length in cm)` | fixed | TC |
| arithmetic.ts · Ch10 "Why cross products work" | `2 × 6 = 3 × 4 = 12` | Roles: `(first top)`, `(second bottom)`, `(first bottom)`, `(second top)`, `(each cross product)` | fixed | TC |
| arithmetic.ts · Ch11 "Percent means out of 100" | `100 ÷ 5 = 20` had no labels | `100 (small pieces wanted) ÷ 5 (fifths) = 20 (small pieces per fifth)`, `2 (shaded fifths) × 20 … = 40 (shaded small pieces)`, `40% (shaded share)`. The fraction chain keeps its structure | fixed | TC |
| arithmetic.ts · Ch11 "Make the bottom 100" | `100 ÷ 5 = 20, so 5 × 20 = 100` in the text | Labelled in the text. The picture's card lines (`5 × ? = 100`) are visual fields and render as plain text | fixed (text) / not applicable (visual) | TC |
| arithmetic.ts · Ch11 "Same amount, new name" | `2 × 20 = 40`, `0.40` | `2 (shaded fifths) × 20 (small pieces per fifth) = 40 (shaded small pieces)`, `40% (shaded share)`, `0.40 (decimal share)` | fixed | TC |
| arithmetic.ts · Ch11 "Percent of" | none: this card is the reference | Left as it is | not applicable | TC, reviewed |
| arithmetic.ts · Ch11 "Up and down" | `0.2 × 50 = 10`, and 0.2 was not explained | Added `20 (percent number) ÷ 100 (per hundred) = 0.2 (decimal share)`, then `(coins before)`, `(coins of change)`, `(coins after)` | fixed | TC |
| arithmetic.ts · Ch12 "Repeated multiplication" | Abstract `2^5` | Roles: "2 (base) to the power 5 (exponent)" | fixed | TC |
| arithmetic.ts · Ch12 "Powers of ten" | Abstract `10^3 = 1000` | Added `10 × 10 × 10`, "10 (base) multiplied 3 (exponent) times". The try-next is bare | fixed | TC |
| arithmetic.ts · Ch12 "Order on the gauge" | Abstract order of operations with no story quantities | No change: roles would not help | not applicable | TC |
| arithmetic.ts · Ch13 "Side from area" | `7 × 7 = 49` | `7 (side) × 7 (side) = 49 (area)`, `√49 = 7 (side)` | fixed | TC |
| arithmetic.ts · Ch13 "Perfect squares first" | The grid line had no labels | `6 (squares per side) × 6 (squares per side) = 36 (squares)`, and the √49 line uses side and area. The list of squares is an abstract fact list | fixed | TC |
| arithmetic.ts · Ch13 "Between two perfects" | Abstract √50 estimate | No change: pure number facts | not applicable | TC |
| arithmetic.ts · Ch14 "Four detective questions" | `12 ÷ 3 = 4 bolts each` | `12 (bolts) ÷ 3 (crews) = 4 (bolts per crew)`. The bar picture [5, 8, 8, 8] does not match this story, and it is a visual field | fixed (follow-up) | TC. Follow-up: bar picture now shows 12 bolts in 3 equal parts (f295fde) |
| arithmetic.ts · Ch14 "Multi-step repairs" | 5, 8 and 12 were not explained before `(5 × 8) − 12`, and the steps had no labels | The text now says "5 crates hold 8 parts each, and 12 parts get used". Steps use `(crates)`, `(parts per crate)`, `(parts used)`, `(parts left)` | fixed | TC |
| arithmetic.ts · Ch14 "The whole stack" | `40 ÷ 4 = 10`, `0.25 × 40`, `25 ÷ 100 × 40` | `(whole amount)`, `(equal parts)`, `(decimal share)`, `(percent number)`, `(per hundred)`, `(the part)` | fixed | TC |
| arithmetic.ts · Ch15 "Trial rules" | Rules text only ("80%") | No change | not applicable | reviewed |
| arithmetic-decimals.ts · "Cut one into tenths" | "the same 3 pieces are now 30 of 100" | `3 (lit tenths) × 10 (hundredths per tenth) = 30 (lit hundredths) out of 100 (hundredths)` | fixed | TC |
| arithmetic-decimals.ts · "Friendly fractions" | "multiply by 25" was not explained | `100 (hundredths) ÷ 4 (equal parts) = 25 (hundredths per part)`, then the rename | fixed | TC |
| arithmetic-decimals.ts · "Places after the point" | `2.47 = 2 + 0.4 + 0.07`, `50 > 45` | `2 (two ones) + 0.4 (four tenths) + 0.07 (seven hundredths)`, `50 (hundredths) > 45 (hundredths)` | fixed | TC |
| arithmetic-decimals.ts · "Line up the point, shift the digits" | Abstract examples (2.75 + 1.4, 3.5 × 10, 45 ÷ 1000) | No change: no story quantities | not applicable | TC |
| arithmetic-decimals.ts · "Round, then repeat" | `3 × 0.4 = 12 tenths = 1.2` | "0.4 is 4 (tenths), so 3 (repeats) × 4 (tenths) = 12 (tenths), which is 1.2". The rounding part is abstract | fixed | TC |
| questions.ts · countStep (acad-count) | Final count had no label | `The last number you said, N (ore crystals)`, using the chosen object. The counting list is left as it is | fixed | AC, AA, S |
| questions.ts · subitizeStep (acad-subit) | "There are N." | `There are N (object).` | fixed | AC, AA, S |
| questions.ts · compareStep (acad-compare) | "Pile B has b." had no noun, and the steps had no labels | The prompt names the object for pile B. Steps: `Pile A: a (object)` | fixed | AC, AA, S |
| questions.ts · buildNumberStep (acad-pv) | Hint and steps had no labels | Hint: `n is t (ten/tens) and o (one/ones)`. Steps: `(tens plates) × 10 (per tens plate) = (from tens)`, `+ (from ones) = (in all)` | fixed | AC, AA, S |
| questions.ts · tensOnesStep (acad-pvq) | Hint and steps had no labels | `n (dial reading) = t (tens) × 10 (per ten) + o (ones)`, and the answer is labelled with the right singular or plural | fixed | AC, AA, S |
| questions.ts · bundleStep (acad-bundle) | `31 = 3 tens and 1 ones` | `31 (loose ones) = 3 (tens) × 10 (ones per ten) + 1 (one left over)`, `3 (full bundles), so 3 (tens plates)` | fixed | AC, AA, S |
| questions.ts · joinStep (acad-join) | Hint and steps had no labels, and "cart two has b" had no noun | `(in cart one)`, `(in cart two)`, `= (object in all)`. Prompt: "b more" | fixed | AC, AA, S |
| questions.ts · partWholeStep (acad-pw) | Hint and steps had no labels | `(bolts in)`, `? (bolts missing)`, `(bolts needed)`, with the right singular or plural | fixed | AC, AA, S |
| questions.ts · swapAddStep (acad-swap) | Steps had no labels | `a (first cart) + b (second cart) = (in all)`, and the swapped line. The prompt names "a cart of a and a cart of b" | fixed | AC, AA, S |
| questions.ts · addTypedStep (acad-add) | Bare fact "Join a and b", `a + b = ?` | No change | not applicable | AA |
| questions.ts · takeAwayStep (acad-take) | Hint and steps had no labels | `(object at the start)`, `(object drained out)`, `(object left)`, with the right singular or plural | fixed | AC, AA, S |
| questions.ts · differenceStep (acad-diff) | "The gap is x" | `b (cart B weight) + ? (gap) = a (cart A weight)`, `a − b = x (how much heavier A is)`. The story gives no weight unit, so none was invented | fixed | AC, AA, S |
| questions.ts · inverseCheckStep (acad-inv) | Fact family with no labels | Roles `(whole)`, `(known part)`, `(missing part)` in the prompt and the steps | fixed | AC, AA, S |
| questions.ts · subTypedStep (acad-sub) | Bare fact | No change | not applicable | AA |
| questions.ts · buildArrayStep (acad-array) | Hint and product had no labels | `(rows)`, `(object per row)`, `= (object)` | fixed | AC, AA, S |
| questions.ts · groupsStep (acad-groups) | Hint and product had no labels | `(crates)`, `(object per crate)`, `= (object)` | fixed | AC, AA, S |
| questions.ts · factStep / divFactStep | Bare fact drills built in questions/multiplication.ts and division.ts, which are outside this area | No change here | not applicable | AA |
| questions.ts · areaPlateStep (acad-plate) | `a rows of b = n cells` | `a (rows) × b (cells per row) = n (cells)`, and the hint is labelled | fixed | AC, AA, S |
| questions.ts · shareStep (acad-share) | `d × ? = total` | `d (crates) × ? (object per crate) = total (object)` | fixed | AC, AA, S |
| questions.ts · divArrayStep (acad-divarray) | Steps had no labels | `(rows)`, `(object per row)`, `(object)` on both facts | fixed | AC, AA, S |
| questions.ts · groupingStep (acad-grouping) | "n crates." with no equation | `total (object) ÷ per (object per crate) = n (crates)` | fixed | AC, AA, S |
| questions.ts · divCheckStep (acad-divcheck) | Abstract division check | Roles `(dividend)`, `(divisor)`, `(quotient)` in the prompt and step, matching the hint. The choices were not changed | fixed | AC, AA, S |
| questions.ts · remainderStep (acad-rem) | Hint and steps had no labels | `(full boxes) × (bolts per box) = (bolts packed)`, `(bolts) − … = (bolts left over)` | fixed | AC, AA, S |
| questions.ts · swapPadStep (acad-swappad) | Products had no labels | `(rows) × (columns) = (dots)`, and "turned on its side" | fixed | AA, S |
| questions.ts · splitAttackStep (acad-split) | One long chain with no labels | Four steps with `(columns)`, `(rows)`, `(dots)`, `(dots in all)`. The picture highlights rows, which is a visual field (see the Split attack card) | fixed (follow-up) | AA, S. Follow-up: picture now shades columns to match (f295fde) |
| questions.ts · inverseOpsStep (acad-invops) | Abstract | Roles `(groups)`, `(per group)`, `(total)`, as on the Inverse pairs card | fixed | AA, S |
| questions.ts · whichEqualStep (acad-equal) | Product had no labels | `(rows) × (columns) = (dots)`. The expression choices were not changed | fixed | AA, S |
| questions.ts · shadeFractionStep (acad-shade) | "n planks lit is n/d" | `n (lit plank/planks) out of d (equal planks) is n/d` | fixed | AC, AA, S |
| questions.ts · equivalentStep (acad-equiv) | Hint and steps had no labels | `(planks) × (pieces per plank) = (pieces)`, `(lit planks) × … = (lit pieces)`, `(of the deck)` | fixed | AC, AA, S |
| questions.ts · whichFractionStep (acad-whichfrac) | Digits in brackets in the hint | `(equal planks)` and `(lit plank/planks)` | fixed | AC, AA, S |
| questions.ts · compareFractionsStep (acad-cmpfrac) | Steps had no labels | `(equal pieces)`, `(of the log)` | fixed | AA, S |
| questions.ts · addSameDenomStep (acad-fracadd) | "a pieces + b pieces". The sum was also shown twice when it could be simplified | `(mossy piece/pieces) + (muddy …) = (pieces either)`, `… (of the path)`. Now shows `a+b/d = simplified` | fixed | AA, S |
| questions.ts · fractionOfStep (acad-fracof) | Hint and steps had no labels | `(mushrooms) ÷ (equal groups) = (mushrooms per group)`, `(groups taken) × … = (mushrooms to forage)` | fixed | AA, S |
| questions.ts · unlikeDenomStep (acad-unlike) | Hint and steps had no labels | `(of the stones)` on the fractions, and a count line in `(eighths)`, `(sixths)`, `(fourths)` | fixed | AA, S |
| questions.ts · ratioTableStep (acad-ratiotab) | Hint and steps had no labels | `(cups of x, first row)`, `(cups of x)`, `(scale factor)`, singular for 1 cup. The unit is cups because the picture says cups | fixed | AA, S |
| questions.ts · partPartWholeStep (acad-ppw) | `Whole = a + b = n` | `(cups of x) + (cups of y) = (cups in the whole mix)`, and the part:part or part:whole line is labelled | fixed | AA, S |
| questions.ts · unitRateStep (acad-unitrate) | Divisor and dividend had no labels | `(crates) ÷ (barges) = (crates per barge)` | fixed | AA, S |
| questions.ts · scaleRecipeStep (acad-scale) | "resin 12, hardener 9" | `(cups of resin per batch) × (batches) = (cups of resin)`, and the same for hardener | fixed | AA, S |
| questions.ts · crossProductStep (acad-cross) | Abstract proportion with no labels | Roles `(first top)`, `(second top)`, `(first bottom)`, `(second bottom)`, `(scale factor)`, `(cross product)`. The hint still shows the missing number, as it did before | fixed | AA, S |
| questions.ts · scaleDrawingStep (acad-scaledraw) | `drawn × scale = n cm`. The scale was not explained | "1 : s means 1 (cm drawn) stands for s (cm for real)", then `(drawn length in cm) × (scale factor) = (real length in cm)` | fixed | AA, S |
| questions.ts · percentBridgeWave (acad-pct-bottom / -top / -read) | Prompts, hints and steps had no labels | `(equal pieces)`, `(hundredths)`, `(hundredths per piece)`, `(painted piece/pieces)`, `(painted hundredths)` | fixed | PG, AA, S |
| questions.ts · fracToPercentStep + percentIndependentWave (acad-frac2pct), shared percentRenameSteps | Rename steps had no labels | Same labels, with `polished`/`painted`/`shaded` following the story. The fraction chain keeps its structure and ends in `p% (polished)` | fixed | PG, AA, S |
| questions.ts · percentOfStep (acad-pctof) | none: already at the reference standard | Left as it is | not applicable | PG, S |
| questions.ts · percentChangeStep (acad-pctchange) | `…= 10 coins of change`, `50 + 10 = 60 coins` | `(coins before)`, `(coins of change)`, `(coins after)`, `(of the old tariff)` | fixed | PG, AA, S |
| questions.ts · percentPracticeQuestion | Reuses the three builders above | Covered by them. The prompt regex was not changed | not applicable | PG |
| questions.ts · writePowerStep (acad-power) | "base appears exp times" | `b (base) appears e times, so e (exponent)` | fixed | AA, S |
| questions.ts · evaluatePowerStep, powerOfTenStep (acad-evalpow, acad-pow10) | Abstract evaluation. The prompt already defines base and exponent in words | No change | not applicable | AA |
| questions.ts · sideFromAreaStep (acad-root) | `s × s = s²` | `s (side) × s (side) = n (area)`, `s^2 = n (area)` | fixed | AA, S |
| questions.ts · estimateRootStep, squareCheckStep (acad-estroot, acad-sq) | Abstract squares and roots with no story quantities | No change | not applicable | AA |
| questions.ts · cubeTeaserStep (acad-cube) | `s × s × s = n` | `(edge) × (edge) × (edge) = n (unit cubes)` | fixed | AA, S |
| questions.ts · wordStep / transferFor | wordStep reuses questions/wordproblems.ts, which is outside this area (its steps already carry labels). transferFor only picks another builder | No change here | not applicable | AA |
| generator.ts · typedShade | Digits in brackets in the explanation. The steps had no labels | `(lit plank/planks) out of (equal planks)`. The explanation names both numbers with labels | fixed | AC, S |
| generator.ts · typedEquiv | Hint and steps had no labels | `(planks before) × (planks per old plank) = (planks now)`, `(lit planks …)` | fixed | S, `arcade-frac-ratio.test.ts` |
| generator.ts · genAcademy / POOLS | Only picks a question | No change | not applicable | AC |
| arithmetic-decimals.ts · tenthsBarStep | Result had no label | `d (of the tank/beam/hopper) is n (tenths)`, `light n (pieces)` | fixed | AA, S |
| arithmetic-decimals.ts · hundredthsBuildStep | `t tenths + o hundredths = 40 + 7 = 47` | `(tenths digit)`, `(hundredths digit)`, `(tenths) × 10 (hundredths per tenth) = (hundredths)`, `+ … = (hundredths in all)` | fixed | AA, S |
| arithmetic-decimals.ts · decToFracStep | Unit was dropped | `0.8 (cm) is 8 tenths, so 0.8 = 8/10 (cm)` | fixed | AA, S |
| arithmetic-decimals.ts · renameStep (benchmarkStep, sliderFracStep bench, fracToDecTypedStep bench) | The multiplier was not explained | `d (equal parts) × k (multiplier) = (smaller parts)`, then the rename. Results are `(of the way open)`, `(open)` or `(of the field drained)` | fixed | AA, S |
| arithmetic-decimals.ts · sliderFracStep (hund / words) | Result had no label | Result is `(open)`. The place words are left as prose | fixed | AA, S |
| arithmetic-decimals.ts · digitValueStep | `d tenths = 0.d` | `the d (tenths digit) is worth d (tenths) × 0.1 (per tenth) = 0.d` | fixed | AA, S |
| arithmetic-decimals.ts · compareStep (trap / zeros / longer) + compareTrapStep | Tenths counts had no labels | `(kg)` on the masses, `(tenths)`/`(tenth)`, `(hundredths)` | fixed | AA, S |
| arithmetic-decimals.ts · orderStep | Rod lengths had no unit | `0.60 (metres), …` | fixed | AA, S |
| arithmetic-decimals.ts · sliderBetweenStep | Result had no label | `5 (hundredths) along: 0.55 (needle setting)`, `(gauge setting)` | fixed | AA, S |
| arithmetic-decimals.ts · tenthMoreStep | `9 + 1 = 10 tenths = 1 whole` | `9 (tenths) + 1 (tenth) = 10 (tenths), which make 1 (whole)`, `(old reading) + (tick) = (new reading)` | fixed | AA, S |
| arithmetic-decimals.ts · numlinePickStep | Prose already names each number (tenths, hundredths) | No change | not applicable | AA |
| arithmetic-decimals.ts · columnTableStep | Column sum had no labels | `(first piece / pipe in metres) ± (second piece / cut off in metres) = (total / left in metres)` | fixed | AA, S |
| arithmetic-decimals.ts · alignChoiceStep | Sum had no labels | `(bracket in kg) + (hinge in kg) = (total in kg)` | fixed | AA, S |
| arithmetic-decimals.ts · moneyChangeStep | Subtraction had no labels | `$20.00 (paid) − $3.69 (gauge price) = $16.31 (change)` | fixed | AA, S |
| arithmetic-decimals.ts · addSubTypedStep | Result had only a bare "m" | `(first run / board in metres)`, `(more cable / sawn off in metres)`, `(total / left in metres)` | fixed | AA, S |
| arithmetic-decimals.ts · shiftStep, shiftTypedStep (shared shiftSteps) | `a × f = r` had no labels | Labels follow each story: `(model part in cm) × (times as long) = (real part in cm)`, `(kg of seed) ÷ (sacks) = (kg per sack)`, `(grams per bolt) × (bolts) = (grams in all)`, `(litres of oil) ÷ (cans) = (litres per can)` | fixed | AA, S |
| arithmetic-decimals.ts · shiftTableStep | Row had no labels | `(metres)` on each scaled beam. `(kg of sand) → (kg per bag)` | fixed | AA, S |
| arithmetic-decimals.ts · whyShiftStep | `t tenths × 10 = t ones` | `t (tenths) × 10 = 10t (tenths), which make t (ones)` | fixed | AA, S |
| arithmetic-decimals.ts · roundLineStep | Bounds and result had no labels | `(metres)`, `(metre)`, `(whole metres)` | fixed | AA, S |
| arithmetic-decimals.ts · roundTenthSliderStep | Bounds and result had no labels | `(grams)`, `(grams, to the nearest tenth)` | fixed | AA, S |
| arithmetic-decimals.ts · roundChooseStep (chain / last / carry) | Readings and results had no labels | `(tonnes)`, `(tonne)` | fixed | AA, S |
| arithmetic-decimals.ts · roundTypedStep | Result had no label | `x (litres) ≈ r (whole litres)` | fixed | AA, S |
| arithmetic-decimals.ts · multFracbarStep | `n × t tenths = …` | `(scoops) × (tenths per scoop) = (tenths), which is … (of the hopper)` | fixed | AA, S |
| arithmetic-decimals.ts · multChooseStep | Estimate and product had no labels | `(brackets) × (kg each, rounded) = (kg)`, `(tenths/hundredths of a kg …)`, `… (kg)` | fixed | AA, S |
| arithmetic-decimals.ts · multTypedStep | `n × c = … cents` | `(fuses) × (cents each) = (cents), which is $… (total)` | fixed | AA, S |
| arithmetic-decimals.ts · fracToDecTypedStep (tenths / hund) | Result had no label | `(of the field drained)` | fixed | AA, S |
| arithmetic-decimals.ts · thermometerStep | `1 ÷ 5 = 0.2 °C`, `below + m × 0.2` | `(degree between labels) ÷ (spaces) = (degrees per mark)`, `(degrees at the label) + (mark/marks) × … = (degrees Celsius)` | fixed | AA, S |
| arithmetic-decimals.ts · unitConvertStep (m-cm / cm-m / kg-g / g-kg) | Conversion factor had no label | `(cm per metre)` or `(grams per kg)`, with a unit label on both sides | fixed | AA, S |
| arithmetic-decimals.ts · raceTimeStep | Times had no unit label | `(seconds)` | fixed | AA, S |
| arithmetic-decimals.ts · fuelLogStep | Column sum had no labels | `(litres, run one/two/three) = (litres in all)` | fixed | AA, S |
| arithmetic-decimals.ts · dialStep | Marks had no labels | `(kg)` on each mark, `5 (hundredths)` | fixed | AA, S |
| arithmetic-decimals.ts · rulerStep | No equation | Added `whole (cm) + n (small marks) × 0.1 (cm per mark) = … (cm)` | fixed | AA, S |
| AcademyEngine.ts · feedbackFor / safeHint / hook texts | Generic text with no story numbers ("The answer was …" plus the first step, which is now labelled) | No change | not applicable | AC |
| judge.ts, kit.ts | No learner-facing contextual numbers | No change | not applicable | reviewed |
| All builders · `expression`, `answerText`, `choices`, `accept`, `ask` lines, model `label`s, visual card lines | Other code compares these, or they render as plain text without the label renderer | No change, as the rules require | not applicable | AA |
