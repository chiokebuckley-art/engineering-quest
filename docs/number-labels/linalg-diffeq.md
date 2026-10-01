# Number labels: Linear Algebra & Differential Equations

Audit of every teach card and question builder in `src/engine/academy/content/linalg.ts` and `diffeq.ts` against the number-label standard (320 surfaces: 161 fixed, 159 not applicable, 0 blocked).

| Surface (file · card title or question builder) | Original issue | Correction | Status (fixed / not applicable / blocked) | Verification |
|---|---|---|---|---|
| linalg.ts · teach: An arrow is its components | None: Coordinates read from the picture are named in prose (3 across, 2 up; A = …, B = …) | None needed | not applicable | Reviewed; no change |
| linalg.ts · teach: Add tip to tail, scale by stretching | None: Pure component arithmetic; vectors named u, v, 2u | None needed | not applicable | Reviewed; no change |
| linalg.ts · teach: Length is Pythagoras | Story numbers (3 east, 4 north) and lengths unlabelled in steps | Legs 3 (east), 4 (north); results (length), (path length), (distance) | fixed | tsc; teach-cards test (working + arithmetic, labels stripped); label-shape scan |
| linalg.ts · teach: Mix two arrows | None: Pure component arithmetic on named vectors | None needed | not applicable | Reviewed; no change |
| linalg.ts · teach: Span: everywhere you can reach | None: Abstract; every number sits in a named vector | None needed | not applicable | Reviewed; no change |
| linalg.ts · teach: Weights come from equations | Solved weights a, b unnamed | 3 (weight on u), 2 (weight on v) | fixed | tsc; teach-cards test (working + arithmetic, labels stripped); label-shape scan |
| linalg.ts · teach: Multiply matching parts, then add | Results not named | Results labelled (dot product) | fixed | tsc; teach-cards test (working + arithmetic, labels stripped); label-shape scan |
| linalg.ts · teach: The sign tells the angle | Dot product, lengths, cosine and angle unnamed | (dot product), (length), (cosine of the angle), 45° (angle) | fixed | tsc; teach-cards test (working + arithmetic, labels stripped); label-shape scan |
| linalg.ts · teach: Shadows: projection | u·v, v·v and the 10 ÷ 5 factor unnamed | (dot product), (squared length of v), 2 (scale factor) | fixed | tsc; teach-cards test (working + arithmetic, labels stripped); label-shape scan |
| linalg.ts · teach: Rows, then columns | None: Entry positions named in prose (row 2, column 3: 7) | None needed | not applicable | Reviewed; no change |
| linalg.ts · teach: Add matching entries | None: Pure entry-by-entry arithmetic | None needed | not applicable | Reviewed; no change |
| linalg.ts · teach: Transpose: rows become columns | None: Sizes and entries named in prose | None needed | not applicable | Reviewed; no change |
| linalg.ts · teach: Columns are where the basis goes | None: Abstract; images named Ae₁, Ae₂ | None needed | not applicable | Reviewed; no change |
| linalg.ts · teach: Matrix times vector | None: Pure row-times-column arithmetic | None needed | not applicable | Reviewed; no change |
| linalg.ts · teach: The four moves | None: Pure arithmetic; each line is named by its move | None needed | not applicable | Reviewed; no change |
| linalg.ts · teach: Row times column | None: Pure row-times-column arithmetic; each line names its entry | None needed | not applicable | Reviewed; no change |
| linalg.ts · teach: A product is a chain of warps | None: Pure arithmetic; results named Bv, A(Bv) | None needed | not applicable | Reviewed; no change |
| linalg.ts · teach: Order matters | None: Entries named by position (top right, column 1) | None needed | not applicable | Reviewed; no change |
| linalg.ts · teach: One system, three views | None: Abstract system; x = 2, y = 1 named | None needed | not applicable | Reviewed; no change |
| linalg.ts · teach: The augmented matrix | None: Coefficient rows, named in prose | None needed | not applicable | Reviewed; no change |
| linalg.ts · teach: One, none, or infinitely many | None: Abstract lines; x, y named | None needed | not applicable | Reviewed; no change |
| linalg.ts · teach: Three legal moves | None: Pure row arithmetic | None needed | not applicable | Reviewed; no change |
| linalg.ts · teach: Clear below each pivot | Multiplier step bare: m = 3 ÷ 1 = 3 | 3 (entry to clear) ÷ 1 (pivot) = 3 (multiplier) | fixed | tsc; teach-cards test (working + arithmetic, labels stripped); label-shape scan |
| linalg.ts · teach: Read the last row | None: Rows read as equations; y = 2 named | None needed | not applicable | Reviewed; no change |
| linalg.ts · teach: ad − bc is an area | det result and area-factor step unnamed | 5 (determinant); 1 (unit square area) × 5 (area factor) = 5 (new area) | fixed | tsc; teach-cards test (working + arithmetic, labels stripped); label-shape scan |
| linalg.ts · teach: The sign is orientation | det results unnamed | Each det result labelled (determinant) | fixed | tsc; teach-cards test (working + arithmetic, labels stripped); label-shape scan |
| linalg.ts · teach: 3 × 3 by cofactors | Final det unnamed | = 1 (determinant) | fixed | tsc; teach-cards test (working + arithmetic, labels stripped); label-shape scan |
| linalg.ts · teach: Undo the warp | None: Pure row-times-column arithmetic; I and x named | None needed | not applicable | Reviewed; no change |
| linalg.ts · teach: Swap, negate, divide | det and the divisor unnamed | 2 (determinant) at both uses | fixed | tsc; teach-cards test (working + arithmetic, labels stripped); label-shape scan |
| linalg.ts · teach: No inverse when det = 0 | det results unnamed | 6 (determinant), 0 (determinant) | fixed | tsc; teach-cards test (working + arithmetic, labels stripped); label-shape scan |
| linalg.ts · teach: Independent means no passengers | det result unnamed | 5 (determinant) | fixed | tsc; teach-cards test (working + arithmetic, labels stripped); label-shape scan |
| linalg.ts · teach: Subspaces, basis and dimension | det result unnamed | 5 (determinant) | fixed | tsc; teach-cards test (working + arithmetic, labels stripped); label-shape scan |
| linalg.ts · teach: Rank and null space | 2 pivots + 2 free = 4 columns: counts unlabelled | 2 (pivots) + 2 (free columns) = 4 (columns); 2 (nullity) | fixed | tsc; teach-cards test (working + arithmetic, labels stripped); label-shape scan |
| linalg.ts · teach: Arrows that stay on their line | λ values unnamed | λ = 3 (eigenvalue), λ = 1 (eigenvalue) | fixed | tsc; teach-cards test (working + arithmetic, labels stripped); label-shape scan |
| linalg.ts · teach: The characteristic equation | Trace, det and roots unnamed | 4 (trace), 3 (determinant), (eigenvalues) | fixed | tsc; teach-cards test (working + arithmetic, labels stripped); label-shape scan |
| linalg.ts · teach: Where engineers meet them | λ unnamed in worked steps | λ = 3 (eigenvalue); Markov λ = 1 (eigenvalue) | fixed | tsc; teach-cards test (working + arithmetic, labels stripped); label-shape scan |
| linalg.ts · teach: Trial rules | None: Rules text; counts written as words | None needed | not applicable | Reviewed; no change |
| diffeq.ts · teach: The unknown is a function | Height and slope values bare | 2.72 (height); 0.5 (rate) × y = 0.5 × 2.72 (height) ≈ 1.36 (slope) | fixed | tsc; teach-cards test (working + arithmetic, labels stripped); label-shape scan |
| diffeq.ts · teach: Order counts derivatives | None: Abstract ODE; y(0) = 1, y′(0) = 0 named | None needed | not applicable | Reviewed; no change |
| diffeq.ts · teach: Check by substituting | Table-row sums not named | 3 (slope) + 1 (y value) = 4 (left side), … = 4 (right side) | fixed | tsc; teach-cards test (working + arithmetic, labels stripped); label-shape scan |
| diffeq.ts · teach: Dashes are slopes | 0.5 × 1.5 = 0.75 unlabelled | 0.5 (step right) × 1.5 (slope) = 0.75 (rise) | fixed | tsc; teach-cards test (working + arithmetic, labels stripped); label-shape scan |
| diffeq.ts · teach: Equilibria are flat lines | Rates bare | −2 (rate), 2 (rate) | fixed | tsc; teach-cards test (working + arithmetic, labels stripped); label-shape scan |
| diffeq.ts · teach: Stable or unstable | Sign-check results bare | 5 (rate), −4 (rate), 5 (rate) | fixed | tsc; teach-cards test (working + arithmetic, labels stripped); label-shape scan |
| diffeq.ts · teach: Walk the tangent | Euler updates bare | (y now), (step size h), (slope), (new y) | fixed | tsc; teach-cards test (working + arithmetic, labels stripped); label-shape scan |
| diffeq.ts · teach: The recipe | Euler updates bare | (y now), (slope), (step size h), (new y), (true value) | fixed | tsc; teach-cards test (working + arithmetic, labels stripped); label-shape scan |
| diffeq.ts · teach: Smaller steps, smaller error | Exact, Euler and error values bare | (true value), (Euler), (error), (step size h) | fixed | tsc; teach-cards test (working + arithmetic, labels stripped); label-shape scan |
| diffeq.ts · teach: Separate the variables | Check values bare | 8.15 (height), 16.3 (slope) | fixed | tsc; teach-cards test (working + arithmetic, labels stripped); label-shape scan |
| diffeq.ts · teach: Where the constant goes | None: Abstract; A and slope named in prose | None needed | not applicable | Reviewed; no change |
| diffeq.ts · teach: Some solutions blow up | None: Abstract; t and y named | None needed | not applicable | Reviewed; no change |
| diffeq.ts · teach: Rate proportional to amount | 50 g, 0.1 per hour, 10 h used bare in equations | 0.1 (rate per hour) × 50 (grams) = 5 (grams per hour); 10 (hours); results (grams) | fixed | tsc; teach-cards test (working + arithmetic, labels stripped); label-shape scan |
| diffeq.ts · teach: Half-life | Amounts, drops and k bare | 16 (amount), 8 (left), 8 (drop), 1 (half-life), 0.693 (decay rate) | fixed | tsc; teach-cards test (working + arithmetic, labels stripped); label-shape scan |
| diffeq.ts · teach: Newton's law of cooling | Temperatures, gap and k bare in steps | 0.35 (cooling rate); 90 (start in degrees) − 20 (room in degrees) = 70 (gap in degrees); (degrees per minute), (minutes), (gap), (degrees) | fixed | tsc; teach-cards test (working + arithmetic, labels stripped); label-shape scan |
| diffeq.ts · teach: Standard form | None: Abstract coefficients; p = 3, q = 2 named | None needed | not applicable | Reviewed; no change |
| diffeq.ts · teach: The integrating factor | None: Abstract; μ, C, q/k named | None needed | not applicable | Reviewed; no change |
| diffeq.ts · teach: Rate in − rate out | Flow, concentration, volume used with units only | 5 (flow in L/min) × 2 (brine in g/L) = 10 (salt in, g/min); 100 (tank in L); 200 (salt in g); (g/min) | fixed | tsc; teach-cards test (working + arithmetic, labels stripped); label-shape scan |
| diffeq.ts · teach: Growth with brakes | Rates bare | Results labelled (growth rate) | fixed | tsc; teach-cards test (working + arithmetic, labels stripped); label-shape scan |
| diffeq.ts · teach: Two equilibria | Rates bare | Results labelled (growth rate) | fixed | tsc; teach-cards test (working + arithmetic, labels stripped); label-shape scan |
| diffeq.ts · teach: The S-curve | Rates bare | 2.5 (growth rate), 1.6 (growth rate) | fixed | tsc; teach-cards test (working + arithmetic, labels stripped); label-shape scan |
| diffeq.ts · teach: Guess eʳᵗ | None: Abstract; roots named r = | None needed | not applicable | Reviewed; no change |
| diffeq.ts · teach: Three kinds of roots | None: Abstract; roots named r = | None needed | not applicable | Reviewed; no change |
| diffeq.ts · teach: Roots decide the shape | Envelope and period from the trace bare | 0.04 (envelope), 3.2 (period) | fixed | tsc; teach-cards test (working + arithmetic, labels stripped); label-shape scan |
| diffeq.ts · teach: Mass, damper, spring | m, k, c used bare in equations | 4 (spring constant) ÷ 1 (mass in kg) = 2 (natural frequency in rad/s); 4 (critical damper); 1 (damper) | fixed | tsc; teach-cards test (working + arithmetic, labels stripped); label-shape scan |
| diffeq.ts · teach: Three ways back | 4 × 1 × 4 with m, k in a trailing bracket | 4 × 1 (mass in kg) × 4 (spring constant) = 16 | fixed | tsc; teach-cards test (working + arithmetic, labels stripped); label-shape scan |
| diffeq.ts · teach: Circuits are springs | ω₀ and critical R results bare | 10 (natural frequency in rad/s), 10 (critical resistance in ohms) | fixed | tsc; teach-cards test (working + arithmetic, labels stripped); label-shape scan |
| diffeq.ts · teach: Free plus forced | None: Abstract; A and yₚ named | None needed | not applicable | Reviewed; no change |
| diffeq.ts · teach: Guess the shape | None: Abstract; A named | None needed | not applicable | Reviewed; no change |
| diffeq.ts · teach: Resonance | Envelope readings bare | 8 (time) ÷ 4 = 2 (swing height); 3.7 (swing height) | fixed | tsc; teach-cards test (working + arithmetic, labels stripped); label-shape scan |
| diffeq.ts · teach: Two coupled rates | None: Abstract state; x′, y′ named | None needed | not applicable | Reviewed; no change |
| diffeq.ts · teach: Eigenvalues rule | None: Abstract; trace =, det =, λ = name each value | None needed | not applicable | Reviewed; no change |
| diffeq.ts · teach: A saddle | None: Abstract; x, y and λ named | None needed | not applicable | Reviewed; no change |
| diffeq.ts · teach: An integral that eats derivatives | None: Abstract transform; areas named in prose | None needed | not applicable | Reviewed; no change |
| diffeq.ts · teach: The table | None: Table lookups; b and b² named | None needed | not applicable | Reviewed; no change |
| diffeq.ts · teach: Solve in s, come back | None: Abstract; poles named s = | None needed | not applicable | Reviewed; no change |
| diffeq.ts · teach: Trial rules | None: Rules text; counts written as words | None needed | not applicable | Reviewed; no change |
| linalg.ts · vecAddStep | None: Abstract vectors; sums are pure component arithmetic, result named u + v | None needed | not applicable | Reviewed; no change |
| linalg.ts · scalarStep | Scalar used bare in worked step | k (scalar) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| linalg.ts · displacementStep | None: Coordinates named A, B; result named AB→ (end minus start) | None needed | not applicable | Reviewed; no change |
| linalg.ts · lengthStep | Length result bare | r (length) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| linalg.ts · lengthProbeStep | Cable pulls in N only in prompt; steps bare; "less than p + q" unlabelled | (force in N), (combined pull in N), (N if pulls just added) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| linalg.ts · vec3Step | None: Abstract vectors, no units | None needed | not applicable | Reviewed; no change |
| linalg.ts · hikerPathStep | km distance result bare | Total displacement in km; r (distance in km) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| linalg.ts · combStep | None: Abstract mix; named u, v, result by its combination | None needed | not applicable | Reviewed; no change |
| linalg.ts · weightsStep | Solved weights bare (shared weightsSteps) | a (weight on u), b (weight on v) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| linalg.ts · spanKindStep | None: Abstract; multiple k named "v = k u" | None needed | not applicable | Reviewed; no change |
| linalg.ts · inSpanStep | Stretch factor c bare | c (stretch factor) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| linalg.ts · alloyStep | Copper/tin totals and bar counts bare | (kg copper needed), (kg tin needed), (A bars), (B bars); a, b defined first | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| linalg.ts · thrusterStep | Weights are seconds of firing but unnamed | a (seconds, thruster one), b (seconds, thruster two) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| linalg.ts · dotChooseStep | Result bare | (dot product) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| linalg.ts · dotTypedStep | Result bare | (dot product) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| linalg.ts · perpStep | None: Abstract; w named | None needed | not applicable | Reviewed; no change |
| linalg.ts · angleStep | Dot product and angle bare | (dot product), θ° (angle between the struts) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| linalg.ts · angleTypeStep | Dot product bare | (dot product) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| linalg.ts · zeroDotStep | None: Only 0 and 90°, both named in prose | None needed | not applicable | Reviewed; no change |
| linalg.ts · projPlotStep | u·v and v·v bare (shared projSteps) | (dot product), (squared length of v) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| linalg.ts · projChooseStep | u·v, v·v, \|v\| bare | (dot product), (squared length of v), (length of v) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| linalg.ts · workStep | Force/distance products and work bare (only "J" at end) | Per-axis (newtons) × (metres) = (joules); W (work in J) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| linalg.ts · rampStep | Weight, dot product, \|d\| and pull bare | (newtons), (dot product), (length of d), (N down the ramp) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| linalg.ts · entryStep | None: Gauge reading named "its entry in column j is …" | None needed | not applicable | Reviewed; no change |
| linalg.ts · sizeStep | None: Sizes named in prose (rows, columns) | None needed | not applicable | Reviewed; no change |
| linalg.ts · addTableStep | None: Pure entry-by-entry arithmetic | None needed | not applicable | Reviewed; no change |
| linalg.ts · sumDefinedStep | None: Sizes named in prose | None needed | not applicable | Reviewed; no change |
| linalg.ts · transposeTableStep | None: Pure rearrangement | None needed | not applicable | Reviewed; no change |
| linalg.ts · transposePickStep | None: Pure rearrangement | None needed | not applicable | Reviewed; no change |
| linalg.ts · inventoryStep | s, d, o and result bare | (in stock), (delivered), (ordered); result (part at depot) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| linalg.ts · basisImageStep | None: Abstract; columns named | None needed | not applicable | Reviewed; no change |
| linalg.ts · buildMatrixStep | None: Abstract; images of e₁, e₂ named | None needed | not applicable | Reviewed; no change |
| linalg.ts · matVecStep | None: Pure column-mix arithmetic, result A·v | None needed | not applicable | Reviewed; no change |
| linalg.ts · whatDoesItDoStep | None: Abstract; images named | None needed | not applicable | Reviewed; no change |
| linalg.ts · whichMatrixStep | None: Abstract; images named | None needed | not applicable | Reviewed; no change |
| linalg.ts · moveImageStep | None: Pure matrix-times-point, result named | None needed | not applicable | Reviewed; no change |
| linalg.ts · linearOrNotStep | None: Symbolic | None needed | not applicable | Reviewed; no change |
| linalg.ts · cadStep | None: Result named "New x = …"; shear entries abstract | None needed | not applicable | Reviewed; no change |
| linalg.ts · dishStep | Result position had no unit | Result named "the new horn position in m" | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| linalg.ts · productEntryStep | None: Row-times-column arithmetic; entry named (AB)ᵢⱼ | None needed | not applicable | Reviewed; no change |
| linalg.ts · productTableStep | None: Row-times-column arithmetic | None needed | not applicable | Reviewed; no change |
| linalg.ts · productPickStep | None: Pure manipulation | None needed | not applicable | Reviewed; no change |
| linalg.ts · prodSizeStep | None: Sizes named in prose | None needed | not applicable | Reviewed; no change |
| linalg.ts · composeOrderStep | None: Symbolic; matrices named F, G | None needed | not applicable | Reviewed; no change |
| linalg.ts · composePlotStep | None: Pure arithmetic; Bv, A(Bv) named | None needed | not applicable | Reviewed; no change |
| linalg.ts · partsStep | Order counts and parts-per-unit bare | (gearboxes) × (bolts each) + (winches) × (bolts each) = (bolts) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| linalg.ts · augmentedStep | None: Coefficients copied into rows, named by column header | None needed | not applicable | Reviewed; no change |
| linalg.ts · checkSolutionStep | None: Abstract; equation sides named by substitution | None needed | not applicable | Reviewed; no change |
| linalg.ts · intersectStep | Prompt "… = 3 (teal)" would render teal as a label on the number | Reworded: "Teal: … Orange: …" | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| linalg.ts · substituteStep | None: Abstract "beam loads" with no units; x, y named | None needed | not applicable | Reviewed; no change |
| linalg.ts · howManyStep | None: Abstract; multiple k named | None needed | not applicable | Reviewed; no change |
| linalg.ts · circuitStep | Currents bare; prompt "= 4 (amps)" would label the right side as amps | I (current in A); check sums (right side of loop one/two); prompt reworded "with the currents in amps" | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| linalg.ts · mixtureStep | Litres, acid fractions and results bare | x, y defined; (total litres), (acid per litre), (litres of pure acid), (litres of weaker/stronger stock) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| linalg.ts · nextOpStep | Multiplier step bare | (entry to clear) / (pivot) = (multiplier) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| linalg.ts · fillRowStep | None: Pure row arithmetic; each line names its column (x:, b:), m given in hint | None needed | not applicable | Reviewed; no change |
| linalg.ts · backSubStep | None: Abstract; each value named x =, y = | None needed | not applicable | Reviewed; no change |
| linalg.ts · readEndStep | None: Rows read as equations | None needed | not applicable | Reviewed; no change |
| linalg.ts · solveTableStep | Hint "row 2 (right side too)" would render as a label on 2 | Reworded "right side included"; row arithmetic is pure manipulation | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| linalg.ts · secondPivotStep | Multiplier step bare | (entry to clear) / (second pivot) = (multiplier) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| linalg.ts · swapStep | None: No calculations | None needed | not applicable | Reviewed; no change |
| linalg.ts · chemStep | None: Coefficients named with their molecules (2 O₂) | None needed | not applicable | Reviewed; no change |
| linalg.ts · det2ChooseStep | Result bare | (determinant) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| linalg.ts · areaStep | det and area bare | (determinant), (area in square units) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| linalg.ts · orientationStep | det bare | (determinant) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| linalg.ts · cofactorStep | Final det bare (shared cofactorSteps) | (determinant) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| linalg.ts · det3TypedStep | Final det bare (shared cofactorSteps) | (determinant) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| linalg.ts · zeroDetStep | None: Abstract; k named | None needed | not applicable | Reviewed; no change |
| linalg.ts · scalingStep | dets, area factor and areas bare | (det A) × (det B) = (det AB); (area factor) × (area before in m²) = (area after in m²) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| linalg.ts · volumeStep | det and volumes bare | (determinant); (volume factor) × (volume in, m³) = (volume out, m³) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| linalg.ts · surveyStep | det and areas bare | (determinant); (parallelogram area in hm²) ÷ 2 = (triangle area in hm²) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| linalg.ts · inverseTableStep | det bare (shared invSteps) | (determinant) in both det lines | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| linalg.ts · inversePickStep | det bare (shared invSteps) | (determinant) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| linalg.ts · invertiblePickStep | None: dets named "det [..] = …" | None needed | not applicable | Reviewed; no change |
| linalg.ts · detFactorStep | det and k bare | (determinant), k (scale factor) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| linalg.ts · solveInverseStep | det bare (invSteps line) | (determinant) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| linalg.ts · checkInverseStep | None: Pure product; AB named | None needed | not applicable | Reviewed; no change |
| linalg.ts · cipherStep | None: det K = 1 named; codes named p | None needed | not applicable | Reviewed; no change |
| linalg.ts · cameraStep | det bare; result unnamed | (determinant); result named "the true rivet point" | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| linalg.ts · independentStep | None: det named in prose | None needed | not applicable | Reviewed; no change |
| linalg.ts · rankStep | None: Rank named in prose | None needed | not applicable | Reviewed; no change |
| linalg.ts · rowComboStep | None: Weights named a =, b = | None needed | not applicable | Reviewed; no change |
| linalg.ts · nullityStep | n − r bare | (columns) − (rank) = (free variables) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| linalg.ts · nullVectorStep | None: Abstract | None needed | not applicable | Reviewed; no change |
| linalg.ts · depWeightsStep | None: Weights named a =, b = | None needed | not applicable | Reviewed; no change |
| linalg.ts · basisStep | None: det named in prose | None needed | not applicable | Reviewed; no change |
| linalg.ts · trussFreeStep | n − r bare | (unknown forces) − (rank) = (free forces) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| linalg.ts · sensorRankStep | None: Channels named c₁…; rank named | None needed | not applicable | Reviewed; no change |
| linalg.ts · subspaceStep | None: Symbolic | None needed | not applicable | Reviewed; no change |
| linalg.ts · dimSpanStep | None: Abstract; named v₁… | None needed | not applicable | Reviewed; no change |
| linalg.ts · nullSpaceKindStep | None: det named | None needed | not applicable | Reviewed; no change |
| linalg.ts · isEigenStep | λ bare | (eigenvalue) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| linalg.ts · charPolyStep | trace and det bare | (trace), (determinant) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| linalg.ts · aMinusLamStep | det and λ bare | (determinant), (eigenvalue) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| linalg.ts · avLandStep | λ bare | (eigenvalue) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| linalg.ts · eigenvaluesTableStep | trace, det, λ bare (shared eigSteps) | (trace), (determinant), (eigenvalue); sum/product check spelled out | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| linalg.ts · eigChooseStep | λ bare (shared eigSteps) | (eigenvalue), (trace), (determinant) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| linalg.ts · eigenvectorStep | None: Pure manipulation; check line names A·v | None needed | not applicable | Reviewed; no change |
| linalg.ts · powerStep | λⁿ bare | (total stretch) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| linalg.ts · markovStep | Probabilities and result bare | (breakdown chance), (repair chance), (fraction of days running) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| linalg.ts · markovTableStep | Percent-to-decimal jump unexplained; shares bare | "20% is 0.2 (share leaving A daily)"; (long-run share at A/B) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| linalg.ts · vibrationStep | None: λ named in prose ("λ = … belongs to …") | None needed | not applicable | Reviewed; no change |
| linalg.ts · practice (SPAN, inline) | Weights bare (weightsSteps) | (weight on u), (weight on v) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| linalg.ts · practice (MATRICES, inline) | None: Entries named a =, b = | None needed | not applicable | Reviewed; no change |
| linalg.ts · practice (TRANSFORM, inline) | None: matVecSteps pure arithmetic | None needed | not applicable | Reviewed; no change |
| linalg.ts · practice (SYSTEMS, inline) | None: Abstract; solution named (x, y) | None needed | not applicable | Reviewed; no change |
| linalg.ts · practice (DET, inline) | det bare | (determinant) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| linalg.ts · practice (INVERSE, inline) | det bare (invSteps) | (determinant) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| linalg.ts · practice (EIGEN, inline) | λ bare (eigSteps) | (eigenvalue), (trace), (determinant) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · orderStep | None: Orders are counts named in prose | None needed | not applicable | Reviewed; no change |
| diffeq.ts · verifyTableStep | Row totals bare | Each row total (left side) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · verifySolutionVerdictStep | Row totals bare (shared rowSteps) | (left side) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · whichSolvesStep | None: Symbolic | None needed | not applicable | Reviewed; no change |
| diffeq.ts · secondOrderCheckStep | None: Symbolic | None needed | not applicable | Reviewed; no change |
| diffeq.ts · constantBalanceStep | None: Abstract; C named | None needed | not applicable | Reviewed; no change |
| diffeq.ts · slopeAtStep | Slope result bare | (slope at this point) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · orderTransfer | None: Symbolic | None needed | not applicable | Reviewed; no change |
| diffeq.ts · pendulumTransfer | ω result bare | ω (swing frequency) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · dragRateTransfer | Speed, drag term, 10 and result bare | (speed in m/s), (drag in m/s²), 10 (gravity in m/s²), (acceleration in m/s²) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · whichFieldStep | None: Slopes named in prose ("the slope is …") | None needed | not applicable | Reviewed; no change |
| diffeq.ts · equilibriumStep | None: Abstract; y = e named | None needed | not applicable | Reviewed; no change |
| diffeq.ts · stabilityStep | None: Abstract; signs only | None needed | not applicable | Reviewed; no change |
| diffeq.ts · phaseLineStep | None: Abstract; equilibria named y = | None needed | not applicable | Reviewed; no change |
| diffeq.ts · solutionCurveStep | None: Abstract picture choice | None needed | not applicable | Reviewed; no change |
| diffeq.ts · tankLevelTransfer | Inflow and depth bare | (inflow in m³/h), h (steady depth in m) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · eulerTableStep | Slopes, h and new y bare | (slope at this point), (step size h), (Euler step) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · eulerOneStep | Slope, y, h bare | (slope at this point), (y now), (step size h), (Euler step) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · eulerPlotStep | Slope and move bare | (slope at this point), 1 (step size h), (rise) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · eulerErrorStep | "(slope n)" pseudo-bracket; estimate/true bare | (start value) + 1 (step size h) × (starting slope) = (Euler estimate); (true value) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · halveStepStep | Errors bare | (error now) ÷ 2 ≈ (new error) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · bioFilterEulerTransfer | Rate, population, feed bare | (growth rate per hour) × (bacteria) + (fed per hour) = (bacteria per hour); 1 (hour) step | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · dragEulerTransfer | Slopes, h, speeds bare | (m/s²), (step in s), (speed in m/s) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · isSeparableStep | None: Symbolic | None needed | not applicable | Reviewed; no change |
| diffeq.ts · separateStep | None: Symbolic | None needed | not applicable | Reviewed; no change |
| diffeq.ts · solveSepStep | None: Symbolic | None needed | not applicable | Reviewed; no change |
| diffeq.ts · ivpSepStep | "y = 10 (positive, like the start)" would render as a label | Reworded "y = 10: positive, like the start" | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · sepTableStep | None: Abstract fin coordinates (no units); C and x, y named | None needed | not applicable | Reviewed; no change |
| diffeq.ts · sepConstantStep | None: Abstract; C named | None needed | not applicable | Reviewed; no change |
| diffeq.ts · blowupStep | None: Abstract; C and t named | None needed | not applicable | Reviewed; no change |
| diffeq.ts · torricelliTransfer | Start depth, C, drain constant, time bare | (start depth in m), (constant C), (drain constant), (minutes to empty) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · boatTransfer | Start speed, time, speed bare | (start speed in m/s), (seconds), (speed in m/s) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · reactionSepTransfer | None: Symbolic | None needed | not applicable | Reviewed; no change |
| diffeq.ts · halfLifeTableStep | Arrow chain with only final "mg" | One step per half-life: (hours), (mg at start), (mg left) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · halfLifeTypedStep | Times and amounts bare | (hours) ÷ (hours per half-life) = (half-lives); (mg at start), (mg left) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · rateFromHalfLifeStep | Half-life and k bare | (years, one half-life), (decay rate per year) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · doublingStep | 0.7 and k bare | 0.7 (about ln two) ÷ k (growth rate per day) = (days to double) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · growthModelStep | None: Symbolic | None needed | not applicable | Reviewed; no change |
| diffeq.ts · coolingStep | Temperatures, gap, time bare | (beam temperature), (hall temperature), (gap in degrees), (minutes), (halvings) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · coolingLinearStep | Gap readings with ° only | (gap in degrees), (minutes), (room in degrees), (degrees) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · coolingSliderStep | Target, hall, gaps, time bare | (target reading), (hall), (gap in degrees), (starting gap), (halvings), (min per halving), (minutes) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · halfLifePlotStep | Days and grams bare | (days) ÷ (days per half-life) = (half-lives); (g at start), (g left) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · coolingGapPlotStep | Minutes and gap bare | (minutes) ÷ (minutes per halving) = (halvings); (starting gap), (gap in degrees), (degrees) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · decayGraphStep | None: Picture choice; temperatures in prose with ° units | None needed | not applicable | Reviewed; no change |
| diffeq.ts · dosageTransfer | Hours and mg bare | (hours), (hours per half-life), (half-lives), (mg taken), (mg left) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · carbonTransfer | Fraction, count, years bare | (fraction left), (half-lives) × 5730 (years per half-life) = (years old) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · bacteriaTransfer | Minutes and counts bare | (minutes) ÷ (min per doubling) = (doublings); (bacteria at start), (bacteria) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · standardFormStep | None: Abstract; p named | None needed | not applicable | Reviewed; no change |
| diffeq.ts · integratingFactorStep | None: Symbolic | None needed | not applicable | Reviewed; no change |
| diffeq.ts · steadyStateStep | Result bare | (steady state) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · linearSolveStep | None: Abstract; C named | None needed | not applicable | Reviewed; no change |
| diffeq.ts · icTableStep | None: Abstract; y∞, C named | None needed | not applicable | Reviewed; no change |
| diffeq.ts · linearLimitStep | Limit bare | (steady state) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · mixingDEStep | Flow, concentration, volume with units only | (flow in L/min) × (brine in g/L) = (salt in, g/min); (tank in L) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · mixingRateStep | Out rate via Q/τ unexplained; values bare | Out = (L/min) × (g of salt) ÷ (L in tank) = (g/min out); in; (change in g/min) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · mixingEqStep | Inflow, V, result bare | (salt in, g/min), (tank in L), (salt in g), (g/L) × (litres) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · mixingEulerTable | Q/τ unexplained; rate and new Q bare | Out rate built from (L/min), (g now), (L in tank); (g/min in) − (g/min out); 1 (minute) step; (g after one minute) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · mixingGraphStep | Settle value bare | (g/L) × (litres) = (g of salt) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · terminalVelocityTransfer | Weight, drag, speed bare | (weight in N) ÷ (drag coefficient) = (terminal speed in m/s) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · rcChargeTransfer | Time, gap, voltage bare | (ms) ÷ (ms per halving) = (halvings); (volts at start), (volts of gap), (target volts), (volts) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · lakeTransfer | In/out terms bare | (m³/day) × (kg/m³) = (kg/day in); (kg of silt) ÷ (m³ of lake) = (kg/day out); (kg/day) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · logisticRateStep | P, K, room, rate bare | (population), (capacity), (room left), (rate per day), (growth per day) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · logisticKBalance | None: Result named "the carrying capacity K" | None needed | not applicable | Reviewed; no change |
| diffeq.ts · logisticEqLine | K bare; "0 (P rises)" would render as a label | (carrying capacity); reworded "so P rises" | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · logisticTableStep | Room and rate bare | (room left), (growth rate) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · inflectionStep | None: Values named P = | None needed | not applicable | Reviewed; no change |
| diffeq.ts · maxGrowthSlider | None: Values named P =, dP/dt = | None needed | not applicable | Reviewed; no change |
| diffeq.ts · logisticCurveStep | None: Picture choice | None needed | not applicable | Reviewed; no change |
| diffeq.ts · rumorTransfer | Counts and rate bare | (robots), (patched), (unpatched), (spread constant), (robots per hour) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · harvestTransfer | K/2 and catch bare | (fish), (rate per year), 1/2 (room left), (fish per year) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · epidemicTransfer | N and N/2 bare | (whole town), (infected) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · charEqStep | None: Symbolic | None needed | not applicable | Reviewed; no change |
| diffeq.ts · rootsTableStep | None: Roots named r = | None needed | not applicable | Reviewed; no change |
| diffeq.ts · rootsNumberlineStep | None: Root named r = | None needed | not applicable | Reviewed; no change |
| diffeq.ts · rootTypeStep | Discriminant bare | (discriminant) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · generalSolStep | None: Roots named r =; expression "(repeated)" left as is (expression strings are out of scope) | None needed | not applicable | Reviewed; no change |
| diffeq.ts · complexTableStep | Discriminant bare | (discriminant) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · ivpSecondTable | None: C₁, C₂ named | None needed | not applicable | Reviewed; no change |
| diffeq.ts · charRootTyped | None: Roots named r = | None needed | not applicable | Reviewed; no change |
| diffeq.ts · charParabolaStep | None: Roots named r = | None needed | not applicable | Reviewed; no change |
| diffeq.ts · oscParabolaPick | None: Picture choice; α, β named | None needed | not applicable | Reviewed; no change |
| diffeq.ts · whichGraphSecond | None: Picture choice | None needed | not applicable | Reviewed; no change |
| diffeq.ts · buildingSwayTransfer | Discriminant bare | (discriminant) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · shaftTransfer | β bare | (ringing rate in rad/s) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · naturalFreqStep | k, m, ω₀ bare | (spring constant in N/m) ÷ (mass in kg); (natural frequency in rad/s) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · dampingTypeStep | c, m, k and discriminant bare | (damper), (mass in kg), (spring constant), (discriminant) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · criticalSlider | m, k and critical c bare | (mass in kg), (spring constant), (critical damper in Ns/m) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · fastestDamperStep | k and critical c bare | (spring constant), (critical damper) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · springRootsTable | None: Roots named r = | None needed | not applicable | Reviewed; no change |
| diffeq.ts · dampingGraphStep | None: Static reasons, each value named (c² = 1 < 4mk = 16) | None needed | not applicable | Reviewed; no change |
| diffeq.ts · rlcTypeStep | 4L/C inputs and discriminant bare | (L in H), (C in F), (discriminant) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · rlcFreqStep | L, C, ω₀ bare | (L in H), (C in F), (natural frequency in rad/s) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · rlcRootsTable | None: Roots named r = | None needed | not applicable | Reviewed; no change |
| diffeq.ts · rlcCriticalSlider | L, C, R bare | (L in H), (C in F), (critical resistance in ohms) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · rlcTuneSlider | Target ω, C, L bare | (target in rad/s), (C in F), (inductance in H) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · suspensionTransfer | m, k, critical c, c bare | (mass in kg), (spring in N/m), (critical damping), (shock setting) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · lcRadioTransfer | L, C, ω₀ bare | (L in H), (C in F), (tuned frequency in rad/s) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · towerFreqTransfer | k, m, ω₀ bare | (stiffness in N/m) ÷ (mass in kg); (natural frequency in rad/s) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · guessFormStep | None: Symbolic | None needed | not applicable | Reviewed; no change |
| diffeq.ts · guessResonantFormStep | None: Wrapper of guessFormStep; symbolic | None needed | not applicable | Reviewed; no change |
| diffeq.ts · constantForcingBalance | None: Abstract; A and yₚ named | None needed | not applicable | Reviewed; no change |
| diffeq.ts · expForcingBalance | None: Abstract coefficients named per term | None needed | not applicable | Reviewed; no change |
| diffeq.ts · linearForcingTable | None: Abstract; A, B named | None needed | not applicable | Reviewed; no change |
| diffeq.ts · cosForcingTyped | None: Abstract; A named | None needed | not applicable | Reviewed; no change |
| diffeq.ts · resonanceStep | None: ω₀ named | None needed | not applicable | Reviewed; no change |
| diffeq.ts · resonanceSlider | k, m, ω₀ bare | (spring constant) ÷ (mass in kg) = (natural frequency in rad/s) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · resonanceGraph | None: Picture choice; static text | None needed | not applicable | Reviewed; no change |
| diffeq.ts · fullSolutionStep | None: Abstract; yₕ, yₚ named | None needed | not applicable | Reviewed; no change |
| diffeq.ts · washerTransfer | k, m, ω₀ bare | (mount stiffness in N/m) ÷ (mass in kg); (resonant speed in rad/s) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · bridgeTransfer | k/m step omitted k and m | (stiffness in N/m) ÷ (mass in kg); (resonant frequency in rad/s) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · dcCircuitTransfer | C, V, q bare | (capacitance in F) × (volts); (charge in coulombs) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · traceDetTable | Trace, det, λ bare | (trace), (determinant), (eigenvalue) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · eigenTable | λ bare | (eigenvalue) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · classifyStep | None: Symbolic | None needed | not applicable | Reviewed; no change |
| diffeq.ts · portraitPick | None: Picture choice | None needed | not applicable | Reviewed; no change |
| diffeq.ts · eigenvectorLine | None: Abstract; v and slope m named | None needed | not applicable | Reviewed; no change |
| diffeq.ts · equilibriumSystemPlot | None: "Coupled tanks" with no units; x =, y = named | None needed | not applicable | Reviewed; no change |
| diffeq.ts · convertStep | None: Symbolic | None needed | not applicable | Reviewed; no change |
| diffeq.ts · eigenTyped | Trace, det, λ bare | (trace), (determinant), (eigenvalue) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · coupledTanksTransfer | λ bare | (eigenvalue) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · predatorTransfer | None: λ named; no units | None needed | not applicable | Reviewed; no change |
| diffeq.ts · drugCompartmentTransfer | None: No units given; x =, y = named | None needed | not applicable | Reviewed; no change |
| diffeq.ts · tableLookupStep | None: Table lookup; a, b named | None needed | not applicable | Reviewed; no change |
| diffeq.ts · transformValueTable | None: A, B named | None needed | not applicable | Reviewed; no change |
| diffeq.ts · laplaceAreaStep | None: Symbolic integral | None needed | not applicable | Reviewed; no change |
| diffeq.ts · derivRuleStep | None: Symbolic | None needed | not applicable | Reviewed; no change |
| diffeq.ts · ivpLaplaceTable | None: A, B named | None needed | not applicable | Reviewed; no change |
| diffeq.ts · inverseStep | None: Symbolic | None needed | not applicable | Reviewed; no change |
| diffeq.ts · secondOrderLaplace | None: Symbolic | None needed | not applicable | Reviewed; no change |
| diffeq.ts · poleStep | None: Pole named s = | None needed | not applicable | Reviewed; no change |
| diffeq.ts · polePlaneStep | None: Poles named s = | None needed | not applicable | Reviewed; no change |
| diffeq.ts · laplaceSteadyTyped | None: A named; settle value named "y →" | None needed | not applicable | Reviewed; no change |
| diffeq.ts · controlPoleTransfer | None: Poles named | None needed | not applicable | Reviewed; no change |
| diffeq.ts · capacitorInverseTransfer | None: Result carries "volts" in prose | None needed | not applicable | Reviewed; no change |
| diffeq.ts · shiftTransfer | None: Symbolic | None needed | not applicable | Reviewed; no change |
| diffeq.ts · runawayVatTransfer | Equilibrium temperature bare | (equilibrium temperature) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · batteryStabilityTransfer | Charging rate and steady charge bare | (charging rate), (steady charge) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
| diffeq.ts · fieldsSlope | Wrapper of slopeAtStep | (slope at this point) | fixed | tsc; teach-cards + label tests; ACADEMY academies test; generated-text scan (12 seeds, all labels match the renderer shape) |
