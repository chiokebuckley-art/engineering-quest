# Number labels: Algebra 2 and Trigonometry

Audit of every teach card and question builder in `src/engine/academy/content/algebra2.ts` and `trig.ts` against the number-label standard ("40 (total coins) ÷ 20 (equal segments) = 2 (coins per segment)"); answers, choices, `expression` strings and visuals were left unchanged (N/A throughout).

| Surface (file · card title or question builder) | Original issue | Correction | Status (fixed / not applicable / blocked) | Verification |
| --- | --- | --- | --- | --- |
| algebra2.ts · card · Parent functions | Abstract parents checked at x = 4; no story quantities. | — | not applicable | reviewed; no change |
| algebra2.ts · card · Inside moves sideways, backwards | Shifts named in prose ("RIGHT 3 and UP 2"). | — | not applicable | reviewed; no change |
| algebra2.ts · card · Flip and stretch | Abstract heights; vertex named in prose. | — | not applicable | reviewed; no change |
| algebra2.ts · card · Vertex form | h and k named in prose ("h = 2 and k = −3"). | — | not applicable | reviewed; no change |
| algebra2.ts · card · Axis of symmetry | Twin-point step "4 − 1 = 3 … 1 − 3 = −2" had unnamed numbers. | 4 (x of P) − 1 (axis) = 3 (units right of the axis); 1 (axis) − 3 (units left) = −2 (x of the twin). | fixed | teach-cards test (working + arithmetic, labels stripped) |
| algebra2.ts · card · Completing the square | Pure manipulation. | — | not applicable | reviewed; no change |
| algebra2.ts · card · Zero product | Pure manipulation. | — | not applicable | reviewed; no change |
| algebra2.ts · card · The quadratic formula | Pure manipulation. | — | not applicable | reviewed; no change |
| algebra2.ts · card · The discriminant | D named at the start of each line. | — | not applicable | reviewed; no change |
| algebra2.ts · card · Meet i | Definitions only. | — | not applicable | reviewed; no change |
| algebra2.ts · card · The complex plane | Each line headed Real parts / Imaginary parts. | — | not applicable | reviewed; no change |
| algebra2.ts · card · Multiply with i² = −1 | Pure manipulation. | — | not applicable | reviewed; no change |
| algebra2.ts · card · End behaviour | Abstract test values x = ±10. | — | not applicable | reviewed; no change |
| algebra2.ts · card · Zeros and multiplicity | Abstract; multiplicity named in prose. | — | not applicable | reviewed; no change |
| algebra2.ts · card · Synthetic division and the remainder | Pure manipulation; remainder named. | — | not applicable | reviewed; no change |
| algebra2.ts · card · Factor, then cancel | Pure manipulation. | — | not applicable | reviewed; no change |
| algebra2.ts · card · Asymptotes and holes | Wall and hole named in prose. | — | not applicable | reviewed; no change |
| algebra2.ts · card · Horizontal asymptotes | Pure manipulation. | — | not applicable | reviewed; no change |
| algebra2.ts · card · Roots are fractional powers | Pure manipulation. | — | not applicable | reviewed; no change |
| algebra2.ts · card · Simplify square roots | Pure manipulation. | — | not applicable | reviewed; no change |
| algebra2.ts · card · Square, solve, then check | Pure manipulation. | — | not applicable | reviewed; no change |
| algebra2.ts · card · Multiply, do not add | Line and curve working (3 + 2 × 3, 3 × 2³) had unlabelled start, step and count. | 3 (start) + 2 (added each step) × 3 (steps) = 9; 3 (start) × 2³ = 3 × 8 (three doublings) = 24, on every line. | fixed | teach-cards test (working + arithmetic, labels stripped) |
| algebra2.ts · card · Growth factors | Story amounts (500, 200, 1000, rates, months) unlabelled. | (starting amount), (growth factor per year), (years), (decay factor), (yearly rate), (months), (rate per month), (periods), results labelled. | fixed | teach-cards test (working + arithmetic, labels stripped) |
| algebra2.ts · card · The number e | Continuous example 100, 5%, 10 years unlabelled. | 100 (starting amount) × e^(0.05 (yearly rate) × 10 (years)) ≈ 164.87 (balance). | fixed | teach-cards test (working + arithmetic, labels stripped) |
| algebra2.ts · card · A log is an exponent | Answers of each log unnamed. | log₂ 32 = 5 (exponent), etc. | fixed | teach-cards test (working + arithmetic, labels stripped) |
| algebra2.ts · card · Mirror of the exponential | Points and coordinates named in prose. | — | not applicable | reviewed; no change |
| algebra2.ts · card · The rules | Pure manipulation of log rules. | — | not applicable | reviewed; no change |
| algebra2.ts · card · Add or multiply | Term-10 working had unnamed first term, steps and d. | 10 − 1 = 9 (steps from the first term), 3 (first term) + 9 (steps) × 4 (common difference) = 3 + 36 = 39; geometric line labelled. | fixed | teach-cards test (working + arithmetic, labels stripped) |
| algebra2.ts · card · Adding a sequence | Pair count and totals unlabelled. | 100 (terms) ÷ 2 = 50 (pairs); 50 (pairs) × 101 (each pair) = 5050 (total); geometric total labelled. | fixed | teach-cards test (working + arithmetic, labels stripped) |
| algebra2.ts · card · Infinite sums | Ratio and limit working unlabelled. | 4 (second term) ÷ 8 (first term) = 1/2 (common ratio); 8 (first term) ÷ (1 − 1/2) = 16 (total). | fixed | teach-cards test (working + arithmetic, labels stripped) |
| algebra2.ts · card · Trial rules | Rules card; no maths. | — | not applicable | reviewed; no change |
| algebra2.ts · builder · vertexShiftStep (shift-vertex) | Shift sizes bare ("moves right 3"). | moves 3 (units right) / 1 (unit down) via shiftX/shiftY helpers (labn, plural-aware). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · shiftWordsStep (shift-words) | Same bare shift sizes. | Same shift labels. | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · reflectPointStep (reflect-point) | Shift variant: bare shift sizes. | Shift labels; flip/stretch variants are coordinate maps (no change). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · flipStep (flip-choose) | Coordinate mirror; no quantities beyond the point. | — | not applicable | reviewed; no change |
| algebra2.ts · builder · transformTableStep (transform-table) | Stretch, shift and table reading unnamed. | (stretch factor), (vertical shift), (pump reading), (new reading). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · evalShiftQ (evaluate-shift) | Pure substitution. | — | not applicable | reviewed; no change |
| algebra2.ts · builder · whichGraphStep (which-graph) | Vertex shifts unnamed. | (units right/left), (units up/down). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · signalDelayStep (transfer-delay) | Delay and pressure drop bare in steps. | (delay in s), (pressure drop in kPa). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · camLogStep (transfer-flowlog) | Delay, change, time and flows bare. | (delay in s), (L/s higher/lower), (time in s), (upstream flow in L/s), (downstream flow in L/s). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · vertexFormTapStep (vertex-form) | Vertex coordinates unnamed. | (axis of symmetry), (lowest y)/(highest y). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · axisStep (axis) | a, b and result unnamed. | (coefficient of x²), (coefficient of x), (axis of symmetry). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · vertexStandardTapStep (vertex-standard) | Axis and height unnamed. | (axis of symmetry), (vertex height). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · mirrorPointStep (mirror) | Distance and mirror x bare. | (units right/left of the axis), (axis), (distance), (mirror x-value). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · convertVertexStep (complete-square) | b and the added square unnamed. | (x-coefficient), (square to add). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · whichParabolaStep (which-parabola) | Vertex read as a coordinate pair. | — | not applicable | reviewed; no change |
| algebra2.ts · builder · minValueQ (extreme-value) | Axis and extreme unnamed. | (axis of symmetry), (minimum value)/(maximum value). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · archWidthStep (transfer-arch) | Feet and width bare ("12 m"). | (ground level), (left foot in m), (right foot in m), (width in m). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · flarePeakStep (transfer-peak) | −5, b, c, time and height bare. | (gravity term), (launch speed in m/s), (launch height in m), (seconds to the peak), (peak height in m). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · zerosTapStep (zeros-plot) | Roots unnamed. | (x-intercept). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · factorSolveStep (factor-solve) | Pure factor-and-solve. | — | not applicable | reviewed; no change |
| algebra2.ts · builder · zeroProductBalanceStep (zero-product) | Pure manipulation. | — | not applicable | reviewed; no change |
| algebra2.ts · builder · nonMonicFactorStep (factor-nonmonic) | Pure manipulation. | — | not applicable | reviewed; no change |
| algebra2.ts · builder · discCountStep (discriminant-count) | D value unnamed. | (discriminant). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · discQ (discriminant) | a, b, c and D unnamed. | (coefficient of x²), (coefficient of x), (constant), (discriminant). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · completeSquareTableStep (complete-square-table) | Square and right side unnamed (match table rows). | (x-coefficient), (square to add), (new right side). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · quadFormulaQ (formula) | D unnamed. | (discriminant). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · irrationalRootsStep (formula-irrational) | D unnamed. | (discriminant). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · flareLandStep (transfer-landing) | Landing time bare ("4 s"). | (ground height in m), (landing time in s). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · panelAreaStep (transfer-panel) | Extra length, area and width bare. | (extra length in m), (area in m²), (width in m). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · iPowerStep (powers-of-i) | Exponent, 4 and remainder unnamed. | (exponent) ÷ (cycle length) leaves (remainder). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · addComplexStep (add-subtract) | Results not named as parts. | (real part), (imaginary part). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · multComplexStep (multiply) | Same. | (real part), (imaginary part). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · productTableStep (multiply-table) | Same. | (real part), (imaginary part). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · productCombineStep (multiply-combine) | Same. | (real part), (imaginary part). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · complexPlotStep (complex-plane) | Same. | (real part), (imaginary part). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · complexRootsStep (complex-roots) | D unnamed. | (discriminant). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · conjugatePlotStep (conjugate-plot) | Coordinate mirror. | — | not applicable | reviewed; no change |
| algebra2.ts · builder · modulusQ (modulus) | a, b and the size of z unnamed. | (real part), (imaginary part), (size of the phasor). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · conjugateStep (conjugate) | Pure manipulation. | — | not applicable | reviewed; no change |
| algebra2.ts · builder · impedanceStep (transfer-current) | Ω, V, A values bare. | (total resistance in ohms), (total reactance in ohms), (impedance size in ohms), (supply in volts), (current in amps). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · rotateStep (transfer-rotate) | Coordinates of a unitless tip. | — | not applicable | reviewed; no change |
| algebra2.ts · builder · endBehaviorStep (end-behaviour) | Degree and sign named in prose. | — | not applicable | reviewed; no change |
| algebra2.ts · builder · zerosMultStep (multiplicity-plot / zeros) | Already reads "multiplicity 2 (even)". | — | not applicable | reviewed; no change |
| algebra2.ts · builder · multiplicityStep (multiplicity) | Multiplicity named in prose. | — | not applicable | reviewed; no change |
| algebra2.ts · builder · syntheticTableStep (synthetic) | Pure manipulation; quotient/remainder named. | — | not applicable | reviewed; no change |
| algebra2.ts · builder · remainderStep (remainder) | P(r) unnamed. | (remainder). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · remainderQ (remainder) | P(r) unnamed. | (remainder). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · factorTheoremStep (factor-theorem) | P(a) = 0 unnamed. | 0 (remainder). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · polyGraphPickStep (which-cubic) | Zeros listed and named. | — | not applicable | reviewed; no change |
| algebra2.ts · builder · boxVolumeStep (transfer-box) | Sheet side and cut bare. | (no cut), (sheet side in cm), (cut size in cm). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · tableRemainderStep (transfer-remainder-log) | Looked-up value unnamed. | (remainder). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · simplifyRationalStep (simplify) | Pure manipulation. | — | not applicable | reviewed; no change |
| algebra2.ts · builder · cancelTermsStep (cancel-terms) | Test value arithmetic only. | — | not applicable | reviewed; no change |
| algebra2.ts · builder · vaHoleStep (asymptote-hole) | Hole/asymptote named in prose. | — | not applicable | reviewed; no change |
| algebra2.ts · builder · asymptoteCrossStep (asymptotes-plot) | Leading-coefficient division unnamed. | (top/bottom leading coefficient), (horizontal asymptote). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · haStep (horizontal-asymptote) | Same. | Same labels. | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · blowupTableStep (near-asymptote) | Table evaluation of 12 ÷ (x − h). | — | not applicable | reviewed; no change |
| algebra2.ts · builder · holeYQ (hole) | Hole height unnamed. | (height of the hole). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · addRationalStep (add) | Pure manipulation. | — | not applicable | reviewed; no change |
| algebra2.ts · builder · parallelResistStep (transfer-parallel-limit) | Limit value bare ("6 Ω"). | (fixed resistor in ohms), (combined resistance in ohms). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · parallelResistStep (transfer-parallel-solve) | R, R₁, R₂ bare. | (target in ohms), (first resistor in ohms), (second resistor in ohms). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · avgCostStep (transfer-average-cost) | F and v bare. | (setup cost in dollars), (cost per part in dollars), (dollars per part). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · ratExpQ (rational-exponent) | Lines headed "Root first" / "Then the power". | — | not applicable | reviewed; no change |
| algebra2.ts · builder · ratExpChooseStep (rational-exponent-choose) | Pure manipulation. | — | not applicable | reviewed; no change |
| algebra2.ts · builder · radToExpStep (radical-to-exponent) | Pure manipulation. | — | not applicable | reviewed; no change |
| algebra2.ts · builder · simplifyRadStep (simplify-root) | Square factor and remainder unnamed. | (largest square factor), (left under the root), (root of the square). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · simplifyRadTableStep (simplify-root-table) | Same (match table rows). | (largest square factor), (left under the root), (its square root). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · radicalSetupStep (radical-square) | Pure manipulation. | — | not applicable | reviewed; no change |
| algebra2.ts · builder · radicalEqBalanceStep (radical-equation) | Pure manipulation. | — | not applicable | reviewed; no change |
| algebra2.ts · builder · fracExpTableStep (exponent-ladder) | Step multiplier unnamed. | (step factor). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · extraneousStep (extraneous) | Checks named in prose. | — | not applicable | reviewed; no change |
| algebra2.ts · builder · tankFaceStep (transfer-tank) | Volume, side, area bare. | (volume in m³), (side in m), (face area in m²). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · pendulumStep (transfer-pendulum) | L, √L, 2, T bare. | (length in m), (root of the length), (rule of thumb factor), (period in s). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · growthTableStep (growth-table) | Start and factor unnamed. | (starting amount), (growth/decay factor per hour). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · linOrExpStep (linear-or-exponential) | Lines headed Differences / Ratios. | — | not applicable | reviewed; no change |
| algebra2.ts · builder · growthFactorStep (growth-factor) | Percents and factor unnamed. | (whole output)/(full charge), (growth per year)/(loss per hour), (growth/decay factor …). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · compoundQ (compound) | Rate, factor, periods, P, A bare. | (yearly rate), (periods per year), (growth factor per …), (years), (starting amount in dollars), (balance in dollars). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · simpleVsCompoundStep (simple-vs-compound) | Factor, P, years, balance bare. | (growth factor per year), (years), (starting amount in dollars), (balance in dollars). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · halfLifeQ (half-life) | Years, half-lives, grams bare. | (years waited), (half-life in years), (half-lives), (starting mass in g), (grams left). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · doublingSliderStep (reach-target) | Start, factor, target, hours bare. | (growth factor per hour), (starting count), (target count), (hours). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · eLimitStep (number-e) | Abstract limit values. | — | not applicable | reviewed; no change |
| algebra2.ts · builder · continuousStep (continuous) | P, r, t, balances bare. | (yearly rate), (years), (starting amount in dollars), (balance in dollars), (dollars). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · expPlotStep (exp-plot) | a, b, y at x = 1 unnamed. | (starting amount), (growth/decay factor), (amount one step later). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · scrubberStep (transfer-scrubber) | Percents, factor, grams bare. | (all the gas), (removed per hour), (kept per hour), (decay factor per hour), (hours), (starting gas in g), (grams left). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · compoundTableStep (compound-table) | Rate, factor, P, simple interest bare. | (yearly rate), (growth factor per year), (starting balance in dollars), (dollars a year), (dollars after three years). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · sensorNetStep (transfer-network) | Months, doublings, nodes bare. | (months), (months per doubling), (doublings), (starting nodes), (nodes). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · logPowerStep (log-as-exponent) | Log value unnamed. | (exponent). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · logQ (evaluate-ln) | Same. | (exponent). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · logQ (evaluate-log) | Same (pos, negative, root, log 1). | (exponent), including −3 and 1/2. | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · logProductStep (log-rules) | Pure rule manipulation. | — | not applicable | reviewed; no change |
| algebra2.ts · builder · expToLogStep (exp-to-log) | Pure manipulation. | — | not applicable | reviewed; no change |
| algebra2.ts · builder · expSetupStep (exponent-equation) | Pure manipulation. | — | not applicable | reviewed; no change |
| algebra2.ts · builder · solveExpBalanceStep (solve-exponential) | Pure manipulation. | — | not applicable | reviewed; no change |
| algebra2.ts · builder · changeBaseQ (change-of-base) | Log values / exponents unnamed. | (log of the number), (log of the base) / (exponent of the number), (exponent of the base). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · inversePlotStep (inverse-plot) | Coordinate swap. | — | not applicable | reviewed; no change |
| algebra2.ts · builder · logGraphPickStep (log-graph) | Asymptote named in prose. | — | not applicable | reviewed; no change |
| algebra2.ts · builder · lnSolveStep (solve-ln) | Rate and time bare ("hours"). | (growth rate per hour), (hours). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · pHStep (transfer-ph) | pH difference and answer unnamed. | (higher pH), (lower pH), (pH steps), (times more acidic). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · decibelStep (transfer-decibel) | Levels, rise, powers bare. | (new/old level in dB), (rise in dB), (powers of ten), (times the intensity). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · doublingTimeStep (transfer-stages) | Log values and answer unnamed. | (log of the target), (log of two), (stages). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · arithTableStep (arithmetic-table) | Steps and d unnamed. | (steps), (common difference). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · geomTableStep (geometric-table) | r unnamed. | (common ratio). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · nthTermStep (nth-term) | a₁, n − 1, aₙ unnamed. | (first term), (steps), (term asked for). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · nthArithQ (nth-term) | Same plus d. | (common difference), (first term), (steps), (term asked for). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · nthTypedGeomStep (nth-term-geometric) | r, a₁, aₙ unnamed. | (common ratio), (first boost), (boost asked for). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · seqTypeStep (sequence-type) | Lines headed Differences / Ratios. | — | not applicable | reviewed; no change |
| algebra2.ts · builder · arithSumQ (arithmetic-sum) | Bolts and panels bare. | (bolts in the first panel), (more panels), (extra bolts per panel), (bolts in the last panel), (panels), (first plus last), (bolts). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · geomSumStep (geometric-sum) | a₁, r, n unnamed. | (first boost), (common ratio), (boosts). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · seqPlotStep (sequence-plot) | a₁ and result unnamed. | (first term), (steps), (height of the point). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · partialSumTableStep (partial-sums) | First hop and limit bare. | (first hop in cm), (limit in cm). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · infiniteSumStep (infinite-sum) | r, a₁, total unnamed. | (common ratio), (first echo), (total). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · pipeStackStep (transfer-pipes) | Rows and totals bare. | (bottom row), (top row), (rows), (bottom plus top), (pipes). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| algebra2.ts · builder · dampingStep (transfer-damping) | Swing and cycles bare. | (cycles), (first swing in mm), (fraction per cycle), (swing in mm). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · card · Name the sides from θ | "adjacent 4, opposite 3, hypotenuse 5" had name before number. | 4 (adjacent), 3 (opposite), 5 (hypotenuse); 25 (hypotenuse squared). | fixed | teach-cards test (working + arithmetic, labels stripped) |
| trig.ts · card · Same angle, same ratio | Ratio working unlabelled. | 3 (opposite) ÷ 5 (hypotenuse) = 0.6 (ratio), etc. | fixed | teach-cards test (working + arithmetic, labels stripped) |
| trig.ts · card · SOH-CAH-TOA | Ratio working unlabelled. | 3 (opposite) ÷ 5 (hypotenuse) = 0.6 on each line. | fixed | teach-cards test (working + arithmetic, labels stripped) |
| trig.ts · card · Pick the ratio, then solve | 20 m, 35°, 0.5736, 11.5 bare in the working. | 35° (given angle), 20 (hypotenuse in m), 0.5736 (sine of the angle), 11.5 (opposite in m). | fixed | teach-cards test (working + arithmetic, labels stripped) |
| trig.ts · card · Ratio back to angle | Rise/run and angle bare. | 3 (rise in m) ÷ 4 (run in m) = 0.75 (tan of the angle); 36.9° (ramp angle). | fixed | teach-cards test (working + arithmetic, labels stripped) |
| trig.ts · card · Up and down from the horizontal | 4, 7, 29.7°, 8.06 bare in the working. | (mast height in m), (distance in m), (angle of elevation), (sight line squared), (sight line in m), (angle of depression). | fixed | teach-cards test (working + arithmetic, labels stripped) |
| trig.ts · card · Half a square | Unit square; sides named in prose. | — | not applicable | reviewed; no change |
| trig.ts · card · Half an equilateral triangle | Short and long leg working unlabelled. | 2 (side) ÷ 2 = 1 (short leg); 3 (long leg squared); 1.73 (long leg). | fixed | teach-cards test (working + arithmetic, labels stripped) |
| trig.ts · card · Read the values | Sides named in prose; exact-value card. | — | not applicable | reviewed; no change |
| trig.ts · card · Standard position | 135° = 90° + 45° unlabelled. | (arm angle), (quarter turn to north), (more into Quadrant II), (full turn), (clockwise turn). | fixed | teach-cards test (working + arithmetic, labels stripped) |
| trig.ts · card · Coterminal angles | Turn arithmetic unlabelled. | (arm angle), (full turn), (half turn). | fixed | teach-cards test (working + arithmetic, labels stripped) |
| trig.ts · card · Reference angles | Subtractions unlabelled. | (half turn)/(full turn), (angle), (reference angle). | fixed | teach-cards test (working + arithmetic, labels stripped) |
| trig.ts · card · What a radian is | Definitions; 57.3° named. | — | not applicable | reviewed; no change |
| trig.ts · card · Converting | Pure conversion. | — | not applicable | reviewed; no change |
| trig.ts · card · Arc length and spin | 3 m × 2 = 6 m style working. | (radius in m), (turn in radians), (cable in m), (spin in rad/s), (cable speed in m/s). | fixed | teach-cards test (working + arithmetic, labels stripped) |
| trig.ts · card · Coordinates are trig | Across/Up products unlabelled. | 1 (hypotenuse), 0.5 (x-coordinate), 0.87 (y-coordinate). | fixed | teach-cards test (working + arithmetic, labels stripped) |
| trig.ts · card · Signs by quadrant | Signs and y ÷ x named; negatives in brackets. | — | not applicable | reviewed; no change |
| trig.ts · card · Any radius | Tip products unlabelled. | 5 (arm length in m), (x-coordinate in m), (y-coordinate in m). | fixed | teach-cards test (working + arithmetic, labels stripped) |
| trig.ts · card · Unroll the circle | Abstract sine values. | — | not applicable | reviewed; no change |
| trig.ts · card · Four dials | Peak/trough/period working unlabelled. | 1 (midline) + 2 (amplitude) = 3 (peak); −1 (trough); 4 (period). | fixed | teach-cards test (working + arithmetic, labels stripped) |
| trig.ts · card · Tangent | Abstract identity values. | — | not applicable | reviewed; no change |
| trig.ts · card · Angle out | Definitions. | — | not applicable | reviewed; no change |
| trig.ts · card · Why the range is restricted | Abstract angles named in prose. | — | not applicable | reviewed; no change |
| trig.ts · card · Finding the others | 180° − 53.1° unlabelled. | (half turn), (calculator angle), (Quadrant II partner), (reference angle). | fixed | teach-cards test (working + arithmetic, labels stripped) |
| trig.ts · card · Pythagoras on the circle | Identity checked at 135° (abstract). | — | not applicable | reviewed; no change |
| trig.ts · card · Reciprocal and quotient | Identity values at 60° (abstract). | — | not applicable | reviewed; no change |
| trig.ts · card · Verifying | Identity checked at 30° (abstract). | — | not applicable | reviewed; no change |
| trig.ts · card · Trig does not distribute | Heights named in prose. | — | not applicable | reviewed; no change |
| trig.ts · card · The sum formulas | Identity checked at 60° + 30°. | — | not applicable | reviewed; no change |
| trig.ts · card · Double angles | Pure formula use. | — | not applicable | reviewed; no change |
| trig.ts · card · Law of sines | 10, 14.1, 7.07 bare in the working. | (angle A/B), (side a in m), (side b in m), (height h in m). | fixed | teach-cards test (working + arithmetic, labels stripped) |
| trig.ts · card · Law of cosines | Abstract a, b, C named as letters. | — | not applicable | reviewed; no change |
| trig.ts · card · The ambiguous case | Height and comparison unlabelled. | 10 (side b), 5 (height h), 6 (side a). | fixed | teach-cards test (working + arithmetic, labels stripped) |
| trig.ts · card · Isolate, reference, place | 180° + 30° unlabelled. | (half turn)/(full turn), (reference angle). | fixed | teach-cards test (working + arithmetic, labels stripped) |
| trig.ts · card · Count on the graph | Same. | (half turn)/(full turn), (reference angle). | fixed | teach-cards test (working + arithmetic, labels stripped) |
| trig.ts · card · Factor, never divide | Pure manipulation. | — | not applicable | reviewed; no change |
| trig.ts · card · Trial rules | Rules card. | — | not applicable | reviewed; no change |
| trig.ts · builder · nameSideStep (name-sides) | "Hypotenuse: 13 m" name-before-number. | (hypotenuse in m), (adjacent in m), (opposite in m). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · writeRatioStep (write-ratio) | Sides listed name-first; ratio bare. | (opposite), (adjacent), (hypotenuse) in list and ratio. | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · similarTableStep (similar) | Row working bare. | (opposite/adjacent/hypotenuse), (same ratio). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · sameRatioStep (same-ratio) | Scale factor bare. | (scale factor). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · rampPointStep (tan-point) | rise = run × tan bare. | (run in m), (tan of the angle), (rise in m). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · ratioValueQ (ratio-value) | n/d unnamed. | (opposite)/(adjacent) ÷ (hypotenuse)/(adjacent) via RATIO_SIDES. | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · whichTriangleStep (which-triangle) | Sides name-first. | Same side labels. | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · ladderStep (transfer-ladder) | Ladder, foot, height bare. | (ladder in m), (foot distance in m), (height up the wall in m), (height in m). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · shadowStep (transfer-shadow) | Mast, shadow, ray bare. | (mast height in m), (shadow in m), (sun ray in m). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · findSideStep (find-side) | Angle, K, ratio value, x bare. | (given angle), (<side> in m), (<f> of the angle), answer (<side> in m). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · setupStep (set-up) | Prose names the number ("40 m is the opposite"); rest are the choice formulas. | — | not applicable | reviewed; no change |
| trig.ts · builder · angleQ (find-angle; also angle dial) | Ratio sides and angle bare. | (rise in m)/(level run in m)/(ramp length in m)/(anchor distance in m)/(cable length in m), (angle with the ground). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · jibSliderStep (jib-slider) | h, L and θ bare. | (tip height in m), (jib length in m), (jib angle). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · inverseSetupStep (inverse-setup) | Resulting angle unnamed. | (angle with the level). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · elevationQ (elevation) | Angle, distance, heights bare. | (angle of elevation), (distance in m), (rise above the instrument in m), (instrument height in m), (height in m). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · elevationQ (depression) | Angle, cliff, distance bare. | (angle of elevation), (cliff height in m), (distance out in m). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · elevDepStep (alt-angles) | Equal angles unnamed. | (angle of depression) = (angle of elevation). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · rampCodeStep (transfer-ramp) | Slope, climb, length bare. | (slope angle), (climb in m), (ramp length in m). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · gradeStep (transfer-grade) | pc/100 and angle bare. | (rise in m), (level run in m), (road angle). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · twoSightStep (transfer-two-sightings) | Angles, walk, x, h bare. | (near/far sighting), (walk in m), (near distance in m), (mast height in m). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · exactValueStep (exact-value) | Sides name-first. | (marked corner), (opposite), (adjacent), (hypotenuse). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · specialSideQ (special-side) | Legs/hypotenuse bare in 4 variants. | (short leg in m), (hypotenuse in m), (leg in m), (long leg in m). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · specialChooseStep (special-exact) | Gate side, legs, brace bare. | (gate side in m), (brace in m), (short leg in m), (long leg in m), (hypotenuse in m). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · acuteCircleStep (acute-from-value) | Aside "(from the special triangle)" parsed as a label. | Reworded to prose: "From the special triangle, …". | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · doubleTrapStep (double-trap) | Abstract exact values. | — | not applicable | reviewed; no change |
| trig.ts · builder · exactTableStep (exact-table) | Static text; ratios named. | — | not applicable | reviewed; no change |
| trig.ts · builder · trussStep (transfer-truss) | Base, legs, height bare. | (truss side in m), (short leg in m), (height in m). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · hexNutStep (transfer-hex-nut) | Side, half side, widths bare. | (side in mm), (half side in mm), (centre to flat in mm), (wrench size in mm). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · coterminalQ (coterminal; also dial) | Turn arithmetic bare. | (turn), (one/two full turns), (pointing angle). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · coterminalChooseStep (coterminal-pick) | 360° and result bare. | (full turn), (beacon angle). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · referenceCase (reference; dial and choose) | Result bare; rule text "θ − 180° (Quadrant III)" parsed as a label on 180°. | (reference angle); quadrant dropped from the rule text (already in the sentence). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · quadrantStep (quadrant) | Whole turns bare. | (one/two full turns), (same terminal side). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · terminalPointStep (terminal-side) | Direction and lattice points. | — | not applicable | reviewed; no change |
| trig.ts · builder · turbineStep (transfer-turbine) | Start, turn, stop bare. | (start angle), (turn), (stopping angle). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · clockHandStep (transfer-clock) | 6° per minute not derived; bare. | 360° (full turn) ÷ 60 (minutes) = 6° (turn per minute); (start at twelve), (minutes), (hand angle). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · toRadiansStep (to-radians) | Degrees/radians unnamed. | (degrees), (radians). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · radToDegDialStep (to-degrees) | Pure conversion. | — | not applicable | reviewed; no change |
| trig.ts · builder · radianSliderStep (radian-size) | Same. | (degrees), (radians). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · arcQ (arc-length, arc-angle) | r, θ, s bare in 3 variants. | (radius in cm), (turn in radians), (turn), (belt in cm), (cable in cm), (rim travel in cm). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · arcTrapStep (arc-trap) | Same. | (turn), (radius in m), (turn in radians), (cable in m). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · angularQ (angular-speed, rpm) | r, ω, θ, t, rpm bare. | (radius in m), (spin in rad/s), (cable speed in m/s), (radians turned), (seconds), (revolutions per minute), (seconds per minute), (angular speed in rad/s). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · bikeWheelStep (transfer-bike) | Turns, radius, distance bare. | (turns), (radius in m), (distance in m). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · piTrapStep (pi-value) | π as a number; no quantity. | — | not applicable | reviewed; no change |
| trig.ts · builder · piTrapStep (pi-arc) | r and belt bare. | (radius in m), (belt in m). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · arcSliderStep (arc-slider) | s, r, θ bare. | (cable in m), (radius in m), (turn in radians). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · minuteArcStep (transfer-clock) | Minutes, fraction, L, s bare. | (minutes), (minutes per turn), (of a turn), (hand length in cm), (tip travel in cm). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · ucCoordStep (coords-to-angle) | Reference angle named in prose. | — | not applicable | reviewed; no change |
| trig.ts · builder · ucValueStep (exact-any) | Same. | — | not applicable | reviewed; no change |
| trig.ts · builder · ucRadValueStep (exact-radians) | Same. | — | not applicable | reviewed; no change |
| trig.ts · builder · axisTableStep (axis-table) | Axis points; cos = x, sin = y named. | — | not applicable | reviewed; no change |
| trig.ts · builder · signQuadrantStep (signs) | Signs only. | — | not applicable | reviewed; no change |
| trig.ts · builder · ucByValueStep (value-to-angle) | Reference angle named in prose. | — | not applicable | reviewed; no change |
| trig.ts · builder · circlePoint (circle-point, unit-circle and identities) | 5 m arm and tip coordinates bare. | (arm length in m), (x-coordinate in m), (y-coordinate in m). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · ucDecimalQ (decimal-value) | Unit-circle coordinate named. | — | not applicable | reviewed; no change |
| trig.ts · builder · crankStep (transfer-crank) | r, angle, height bare. | (crank radius in cm), (crank angle), (pin height in cm). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · ferrisStep (transfer-ferris) | Hub, radius, offset bare. | (cabin angle), (wheel radius in m), (offset from the hub in m), (hub height in m), (cabin height in m). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · ampStep (amplitude) | max/min/midline/amplitude bare. | (peak), (trough), (midline), (amplitude). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · periodQ (period-graph) | Period bare ("4 s"). | (period in s). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · periodEqStep (period-degrees, period-radians) | Parent period and factor bare. | (parent period), (speed-up factor), (period), (period in s). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · peakPlotStep (peak-point) | D ± A working bare. | (midline), (amplitude), (peak height)/(lowest height). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · graphPickStep (which-graph) | Midline/peaks/period named in prose. | — | not applicable | reviewed; no change |
| trig.ts · builder · midlineQ (max-min) | High/low water bare. | (high water in m), (low water in m), (midline in m)/(amplitude in m). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · sliderCycleStep (cycle-slider) | Start + period bare. | (period), (cycle start), (cycle end). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · tanGraphStep (tan-asymptotes, tan-period) | Abstract angles named. | — | not applicable | reviewed; no change |
| trig.ts · builder · tanPickStep (tan-graph) | Abstract angles named. | — | not applicable | reviewed; no change |
| trig.ts · builder · phaseShiftStep (phase-shift) | Shift bare. | (phase shift). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · wheelModelStep (transfer-wheel) | Top, bottom, midline, amplitude, period bare. | (top in m), (bottom in m), (midline in m), (amplitude in m), (period in s). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · acStep (transfer-ac) | Period and frequency bare. | (period in s), (second), (cycles per second). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · invExactStep (inverse-exact) | Abstract exact values. | — | not applicable | reviewed; no change |
| trig.ts · builder · invCircleStep (inverse-circle) | Abstract. | — | not applicable | reviewed; no change |
| trig.ts · builder · invDialStep (inverse-dial) | Abstract. | — | not applicable | reviewed; no change |
| trig.ts · builder · rangeStep (restricted-range) | Ranges only. | — | not applicable | reviewed; no change |
| trig.ts · builder · compositionStep (composition) | Abstract. | — | not applicable | reviewed; no change |
| trig.ts · builder · reciprocalTrapStep (notation) | Abstract. | — | not applicable | reviewed; no change |
| trig.ts · builder · invTypedQ (inverse-decimal) | Abstract ratio in, angle out. | — | not applicable | reviewed; no change |
| trig.ts · builder · obtuseStep (transfer-obtuse) | Angles bare. | (acute angle), (half turn), (joint angle). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · crankReflexStep (transfer-reflex) | Angles bare. | (Quadrant I angle), (full turn), (crank angle). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · pythagQ (pythagorean) | Identity manipulation. | — | not applicable | reviewed; no change |
| trig.ts · builder · nextStepStep (verify-next) | Identity manipulation. | — | not applicable | reviewed; no change |
| trig.ts · builder · squareSumStep (square-sum-test, square-sum) | Identity checked at 45° (abstract). | — | not applicable | reviewed; no change |
| trig.ts · builder · whichIdentityStep (which-identity) | Identity. | — | not applicable | reviewed; no change |
| trig.ts · builder · pythagTableStep (pythag-table) | sin²θ / cos²θ named on each line. | — | not applicable | reviewed; no change |
| trig.ts · builder · reciprocalQ (reciprocal) | Function names the value. | — | not applicable | reviewed; no change |
| trig.ts · builder · pitchStep (transfer-pitch) | sec θ result unexplained. | (rafter length per unit of run). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · forceStep (transfer-force) | F, cos θ, result bare. | (cable pull in kN), (cos of the slope angle), (horizontal pull in kN). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · distributeTrapStep (distribute-trap) | Abstract exact values. | — | not applicable | reviewed; no change |
| trig.ts · builder · formulaStep (formula) | Formula recall. | — | not applicable | reviewed; no change |
| trig.ts · builder · exactSumStep (exact-sum) | Exact-value manipulation. | — | not applicable | reviewed; no change |
| trig.ts · builder · doubleQ (double-value) | Formula manipulation. | — | not applicable | reviewed; no change |
| trig.ts · builder · doubleTrapStep2 (double-trap) | Formula manipulation. | — | not applicable | reviewed; no change |
| trig.ts · builder · doubleTableStep (double-table) | Formula manipulation. | — | not applicable | reviewed; no change |
| trig.ts · builder · doublePlotStep (double-plot) | 5 m and tip bare. | (arm length in m), (x-coordinate in m), (y-coordinate in m). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · sumValueQ (sum-value) | Formula manipulation. | — | not applicable | reviewed; no change |
| trig.ts · builder · sumTableStep (sum-table) | Formula manipulation. | — | not applicable | reviewed; no change |
| trig.ts · builder · collapseStep (transfer-collapse) | Pure double-angle pattern. | — | not applicable | reviewed; no change |
| trig.ts · builder · tanSumStep (transfer-tan-sum) | Result angle unnamed. | (combined ramp angle). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · lawSinesQ (law-sines) | a, angles, b bare. | (side a in m), (angle A), (angle B), (side b in m). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · lawSinesSetupStep (law-sines-setup) | b result bare. | (side b in m); set-up line equals the choice text, left as is. | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · lawSinesAngleQ (law-sines-angle) | b, a, B bare. | (side b in m), (side a in m), (angle B). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · obtusePartnerStep (obtuse-partner) | A + B₂ bare. | (angle A), (obtuse partner), (angle sum). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · lawCosQ (law-cosines) | Stays, angle, gap bare. | (first stay in m), (second stay in m), (angle between), (gap between the ends in m). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · whichLawStep (which-law) | No numbers. | — | not applicable | reviewed; no change |
| trig.ts · builder · cosSignStep (cos-sign) | Correction and c² bare. | (side a in m), (side b in m), (correction), (a squared), (b squared), (c squared in m²). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · sssDialStep (sss-angle) | Members and C bare. | (member in m), (member facing C in m), (angle C). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · ambiguousStep (ambiguous) | b and h bare. | (side b in m), (height in m). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · cosTableStep (cos-table) | 89 and 80 unexplained. | (a² plus b²), (twice a times b). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · riverStep (transfer-river) | Angles, baseline, AP bare. | (angle sum), (angle A/B/P), (baseline AB in m), (distance A to P in m). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · shipsStep (transfer-ships) | Trips, angle, gap bare. | (first/second trip in km), (angle between), (gap in km). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · eqSteps (all-solutions, solve-circle, solve-table) | Reference angle bare. | (reference angle). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · sliderCrossStep (solve-graph) | Reference angle named in prose. | — | not applicable | reviewed; no change |
| trig.ts · builder · countQ (count) | Counts named ("2 solutions"). | — | not applicable | reviewed; no change |
| trig.ts · builder · numericSolveQ (solve-decimal) | Calculator angle bare. | (calculator angle). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · quadraticEqStep (factor) | Aside "(a square root has two signs)" parsed as a label. | Reworded to ": a square root has two signs". | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · multiAngleStep (double-angle-eq) | Abstract angles. | — | not applicable | reviewed; no change |
| trig.ts · builder · tideStep (transfer-tide) | D, A, 30 and t bare. | (mean depth in m), (tide swing in m), (metres from the mean), (tide angle), (degrees per hour), (hours after midnight). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · reservoirStep (transfer-reservoir) | D, A, 30 and t bare. | (mean level in m), (seasonal swing in m), (metres from the mean), (cycle angle), (degrees per month), (months). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
| trig.ts · builder · jointStep (transfer-joint) | Answer angle unnamed. | (elbow angle). | fixed | tsc; ACADEMY academies test; 40-seed text dump (labels parse, no stray brackets) |
