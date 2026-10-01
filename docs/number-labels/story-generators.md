# Number labels audit: shared story and picture question generators

Every number taken from a situation or picture should carry a plain-language label right after it, like "40 (total coins) ÷ 20 (equal segments) = 2 (coins per segment)". This register covers the shared generators in `src/engine/questions/` (word problems, applied scenarios, rates, measurement, volume, plumbing, forces) that feed the Arcade, battles, drills, missions, the Notebook and the academies. Only display text changed (prompt, hint, worked steps, explanation, `word.why`); answers, `expression` strings, choice layouts, visuals, ids and skills are untouched.

"Sanity script" means every template was generated at difficulties 1–6 with 60 seeds each, and every line was checked for malformed labels, "1 (…s)" plurals and arithmetic that no longer holds once labels are stripped; samples were also read by eye.

| Surface (file · generator/template id) | Original issue | Correction | Status | Verification |
|---|---|---|---|---|
| wordproblems.ts · `wordProblem()` steps and explanation (all templates) | `Set it up: 24 + 18`, `24 + 18 = 42 bolts`: no labels | New `setup`/`work`/`result` per template; steps show `12 (Maya's bolts) + 8 (Leo's bolts) = 20 (bolts altogether)`; two-step problems get one labelled line per step so intermediate answers keep their label. `layout` and decoys unchanged | fixed | wordproblems.test (layout still evaluates to the answer), sanity script |
| wordproblems.ts · THEMES container names | `th.box.replace(/es$\|s$/, '')` turned "crates" into "crat" in prompts and `why` | Explicit singular `boxOne`/`itemOne` per theme | fixed | sanity script |
| wordproblems.ts · add v0 "Put together" | `a + b = total` unlabelled | `a (Maya's bolts) + b (Leo's bolts) = total (bolts altogether)` | fixed | sanity script |
| wordproblems.ts · add v1 "Add to" | unlabelled | `a (starting bolts) + b (bolts Leo brought) = c (bolts Maya has now)` | fixed | sanity script |
| wordproblems.ts · add v2 "Put together" (three days) | unlabelled | `(bolts on Monday) + (… on Tuesday) + (… on Wednesday) = (bolts used in all)` | fixed | sanity script |
| wordproblems.ts · sub v0 "Take away" | unlabelled | `t (starting …) − b (… used) = (… left)` | fixed | sanity script |
| wordproblems.ts · sub v1 "Compare" | unlabelled | `t (Maya's …) − b (Leo's …) = (more … for Maya)` | fixed | sanity script |
| wordproblems.ts · sub v2 "Missing part" | unlabelled | `t (… needed) − b (… on hand) = (… still needed)` | fixed | sanity script |
| wordproblems.ts · mult v0 "Equal groups" | unlabelled; "crat" singular | `g (crates) × p (gears per crate) = (gears in all)` | fixed | sanity script |
| wordproblems.ts · mult v1 "Times as many" | steps and `why` ("7 equal groups of 34") unlabelled | `7 (times as many) × 34 (Kai's solar cells) = 238 (Zoe's solar cells)`; `why` labelled | fixed | sanity script |
| wordproblems.ts · mult v2 "Rows (array)" | unlabelled | `g (rows) × p (panels per row) = (panels in the array)` | fixed | sanity script |
| wordproblems.ts · mult v3 "Rate (per)" drone | unlabelled | `g (seconds) × p (metres per second) = (metres flown)` | fixed | sanity script |
| wordproblems.ts · div v0 "Fair share" | unlabelled | `t (total …) ÷ g (boxes) = p (… per box)` | fixed | sanity script |
| wordproblems.ts · div v1 "How many groups" | unlabelled | `t (total …) ÷ p (… per pump) = g (pumps)` | fixed | sanity script |
| wordproblems.ts · div v2 "Rate (per)" cart | unlabelled | `t (metres travelled) ÷ g (seconds) = p (metres per second)` | fixed | sanity script |
| wordproblems.ts · twostep v0 "Equal groups, then take away" | `(g × p) − c = …` | Two labelled steps: `… = 90 (LED lights bought)`, `90 (LED lights bought) − 51 (LED lights used) = 39 (LED lights left)` | fixed | sanity script |
| wordproblems.ts · twostep v1 "Equal groups, then add" | unlabelled | `… = (new …)`, then `c (starting …) + (new …) = (… Zoe has now)` | fixed | sanity script |
| wordproblems.ts · twostep v2 "Fair share, then add" | unlabelled | `t (total …) ÷ g (robots) = (… per robot from sharing)`, then `+ c (extra … per robot) = (… per robot now)` | fixed | sanity script |
| wordproblems.ts · twostep v3 "Two sets of groups" | unlabelled; rivets theme said "3 bags … and 4 bags" with no way to tell them apart | Three labelled steps; second set labelled "other bags" and the prompt says "more bags" when the theme's containers are bags | fixed | sanity script |
| wordproblems.ts · hint "Clue words … Structure …" | no numbers | none needed | not applicable | read |
| wordproblems.ts · `word.layout` shown by ArcadeScreen / NotebookScreen (`{layout} = {answer}`) | screens print the plain layout | `layout` must stay plain (Millionaire choices, Notebook decoy matching). Added `word.setup` and `word.result` (labelled) for the screens to show; screens are outside this area | fixed (follow-up) | needs the screen owner to render `setup = result`. Follow-up: Arcade, Millionaire and Notebook now render the labelled `setup = result` (90b58ad) |
| applied.ts · SCENARIOS "support assemblies" (build/share) | prose already names every number; "1 support assemblies", "1 bolts" when a fact has a 1 | Singular/plural from the count | fixed | sanity script (g, p = 1) |
| applied.ts · "copper gears / crates" | "1 crates", "1 gears" | singular/plural | fixed | sanity script |
| applied.ts · "solar panels / watts" | "1 solar panels", "1 watts" | singular/plural | fixed | sanity script |
| applied.ts · "pipe runs / metres" | "1 pipe runs", "1 metres" | singular/plural | fixed | sanity script |
| applied.ts · "conveyor sections / rollers" | "1 sections" | singular/plural | fixed | sanity script |
| applied.ts · "battery packs / cells" | "1 battery packs" | singular/plural | fixed | sanity script |
| applied.ts · "gear wheels / teeth" | "1 identical gear wheels", "1 teeth" | "1 gear wheel", "1 tooth" | fixed | sanity script |
| applied.ts · "work shifts / hours" | "1 work shifts" | singular/plural | fixed | sanity script |
| applied.ts · "robots / motors" | "1 robots" | singular/plural | fixed | sanity script |
| applied.ts · "reactor tanks / litres" | "1 reactor tanks" | singular/plural | fixed | sanity script |
| applied.ts · "lamp posts / lanterns" | "1 lamp posts" | singular/plural | fixed | sanity script |
| applied.ts · "rail carts / kilograms of ore" | "1 rail carts leave" | "1 rail cart leaves" | fixed | sanity script |
| applied.ts · worked steps for these scenarios | built in multiplication.ts / division.ts | outside this area | not applicable | owned by the multiplication/division audit |
| context.ts · `GenContext`, `nextQuestionId`, `fmt` | no display text | none | not applicable | read |
| picture.ts · `pictureQuestion()` builder | passes text through; rounded results were shown with "=" | Added `eqSign()` so steps show "≈" when a shown number was rounded | not applicable | tsc; the builder itself shows no numbers |
| rates.ts · ratio (`ratioQuestion`) | `mixed 1 : 2 : 3 (cement : sand : gravel)` put the names far from the numbers; steps unlabelled | `1 (part cement) : 2 (parts sand) : 3 (parts gravel)`; `10 (buckets of sand) ÷ 2 (parts sand) = 5 (buckets per part)`, `3 (parts gravel) × 5 (buckets per part) = 15 (buckets of gravel)` | fixed | engineering.test, sanity script |
| rates.ts · US ↔ metric (`usMetricQuestion`) | hint "Multiply by 25.4." and steps unlabelled | Factor stated as the standard conversion given in the question; `5 (length in inches) × 25.4 (mm per inch) = 127 (length in mm)`; "≈" when rounded | fixed | engineering.test (`US_METRIC` round trip), sanity script |
| rates.ts · speed (`speedQuestion`) | unlabelled | `(distance in km) ÷ (time in hours) = (speed in km/h)` and the other two forms | fixed | sanity script |
| rates.ts · flow (`flowQuestion`) | unlabelled | `(volume in L) ÷ (flow rate in L/min) = (time in minutes)` and the other two forms | fixed | engineering.test, sanity script |
| rates.ts · density (`densityQuestion`) | unlabelled; "(that is water)" parenthesis after a unit | `(mass in g) ÷ (volume in mL) = (density in g/mL), which matches water` | fixed | engineering.test, sanity script |
| rates.ts · unit chains (`chainQuestion`) | "Numbers: 240 km." gave only the result; factors' source never said; h → km and h → L chains used a rate (60 km/h, 5 L/min) the question never mentioned and called it "equal to 1" | Prompt now states the rate; a "Where the factors come from" step; `4 (time in hours) × 60 (km per h) = 240 (distance in km)`, `× 1000 (m per km) ÷ 3600 (s per h) ≈ 1.4 (speed in m/s)` | fixed | engineering.test (literal chain without the new optional fields), sanity script |
| rates.ts · rpm turns | unlabelled; "1 minutes" | `90 (turns per minute) × 7 (minutes) = 630 (turns)`; singular minute | fixed | sanity script |
| rates.ts · rpm per turn | `3.14 × 20 = 62.8 cm` | `3.14 (pi, rounded) × 20 (diameter in cm) = 62.8 (cm per turn)` | fixed | sanity script |
| rates.ts · rpm distance | cm → m step used an unexplained 100 and "=" on a rounded value | `… ÷ 100 (cm per metre) ≈ 593 (distance in m)` with "There are 100 cm in a metre" | fixed | sanity script |
| measure.ts · compare (count) | "Count them: 9 units." | `9 (units along the stick)` | fixed | measure.test, sanity script |
| measure.ts · compare (difference) | `23 − 10 = 13 cm` | `23 (pencil length in cm) − 10 (strap length in cm) = 13 (difference in cm)` | fixed | measure.test, sanity script |
| measure.ts · ruler from 0 | `5 cm = 50 mm, plus 4 mm = 54 mm` | `5 (whole cm) × 10 (mm in each cm) = 50 (mm in the whole cm)`, `+ 4 (extra mm) = 54 (length in mm)` | fixed | measure.test (stripped `67 − 20 = 47`), sanity script |
| measure.ts · ruler not at 0 | `Start: 2 cm = 20 mm`, `67 − 20 = 47 mm` | Each end converted with `× 10 (mm in each cm)`; `67 (end in mm) − 20 (start in mm) = 47 (length in mm)` | fixed | measure.test |
| measure.ts · inches | "Count marks past the 2: 3." and `4/8 = 1/2` unlabelled | `8 (spaces per inch)`, `1/8 (inch)`, `3 (marks)`, `2 (whole inches) and 4/8 (inch) = 1/2 (inch)`; singular "1 (whole inch)"; prompt says "past the 2 inch mark" | fixed | measure.test, sanity script |
| measure.ts · dial | `100 ÷ 5 = 20 g`, `300 + 2 × 20 = 340 g` | `100 (g between labels) ÷ 5 (spaces) = 20 (g per mark)`, `300 (g at the label) + 2 (marks) × 20 (g per mark) = 340 (mass in g)`; psi dials say "pressure in psi" | fixed | measure.test |
| measure.ts · thermometer read | "each mark is 2 °C" never shown as a division; `below + marks × 2` unlabelled | `10 (degrees between labels) ÷ 5 (spaces) = 2 (degrees per mark)` in hint and steps; labelled reading | fixed | measure.test |
| measure.ts · thermometer change | `34 − 20 = 14` | `34 (degrees C now) − 20 (degrees C this morning) = 14 (change in degrees C)`, singular "1 (degree C …)" | fixed | measure.test |
| measure.ts · elapsed time | sum unlabelled; wrong working when the end is on the hour ("0 − 45 = 15") or the run spans whole hours ("30 − 0 = 150") | Count-up legs, whole hours as `1 (hour) × 60 (minutes in an hour) = 60 (minutes)`, then `25 (minutes to the hour) + 20 (minutes after the hour) = 45 (minutes running)` | fixed | measure.test (`2:35 → 3:00 is 25 minutes`, stripped `25 + 20 = 45`), sanity script |
| measure.ts · estimate | `3 times × 2 m ≈ 6 m`, "0.5 of × 2 m", "about 1 times" | `3 (times as long) × 2 (door length in m) ≈ 6 (plank length in m)`; ratio 1 reads "about as long as" | fixed | measure.test, sanity script |
| measure.ts · convert | `3 ft = 3 × 12 = 36 in`, `12 × 12 = 144` | `3 (length in feet) × 12 (inches in each foot) = 36 (length in inches)`; `12 (inches long) × 12 (inches wide) = 144 (square inches in each square foot)`; the unit fact stays as plain prose | fixed | measure.test (stripped `12 × 12 = 144`) |
| measure.ts · shape perimeter | `5 + 3 + 5 + 3 = 2 × (5 + 3) = 16 m` | Sides labelled length/width in m, `= 16 (perimeter in m)`; shortcut `2 (sides of each size) × 8 (length plus width in m)` | fixed | measure.test, sanity script |
| measure.ts · shape area | `5 × 3 = 15 m²` and perimeter aside unlabelled | `5 (length in m) × 3 (width in m) = 15 (area in m²)`; aside labelled | fixed | measure.test (`Perimeter would be`) |
| volume.ts · cubes | `6 cubes per layer × 3 layers = 18 cubes` | `3 (rows) × 2 (cubes per row) = 6 (cubes in the bottom layer)`, `6 (cubes per layer) × 3 (layers) = 18 (cubes)`, singular for 1 | fixed | volume.test (assertion updated) |
| volume.ts · prism | `6 × 4 = 24 (the base), then 24 × 3 = 72` | `(length in cm) × (width in cm) = (base area in cm²)`, `× (height in cm) = (volume in cm³)`; mL step labelled | fixed | volume.test |
| volume.ts · liquid (jug) | `50 ÷ 5 = 10 mL`, `100 + 3 × 10 = 130 mL` | `50 (mL between labels) ÷ 5 (spaces) = 10 (mL per mark)`, `100 (mL at the label) + 3 (marks) × 10 (mL per mark) = 130 (water in mL)` | fixed | volume.test (assertions updated) |
| volume.ts · displacement | `65 − 40 = 25` | `65 (water after in mL) − 40 (water before in mL) = 25 (marble volume in mL)` | fixed | volume.test |
| volume.ts · missing side | `6 × 4 = 24`, `120 ÷ 24 = 5` | `(length in cm) × (width in cm) = (face area in cm²)`, `(volume in cm³) ÷ (face area in cm²) = (height in cm)` | fixed | volume.test |
| volume.ts · composite (break apart, both ways) | `4 × 3 × 5 = 60 cm³`, `105 − 27 = 78` | Every side, piece, whole box and missing piece labelled (`60 (volume of A in cm³)`, `105 (whole box in cm³) − 27 (missing piece in cm³) = 78 (total volume in cm³)`); inches spelled out ("length in inches", "cubic inches") | fixed | spiral.test (assertion updated to `Both ways give 78 (total volume in cm³)`) |
| volume.ts · notch (fill in and subtract) | unlabelled; the add route crammed three pieces in one line | Labelled whole box, notch and total; the add route is one labelled line per piece, then the sum | fixed | spiral.test (`The other way`) |
| volume.ts · stairs | unlabelled | Each slab and the sum labelled | fixed | spiral.test |
| pipe.ts · nominal wall | `(26.7 − 20.9) ÷ 2 = 2.9 mm` | `(26.7 (outside diameter in mm) − 20.9 (inside diameter in mm)) ÷ 2 (walls across the pipe) = 2.9 (wall thickness in mm)` | fixed | sanity script |
| pipe.ts · nominal OD | Note said ¾ in, 1¼ in and 1½ in were 12.7, 25.4 and 25.4 mm (parse of "¾"); steps unlabelled | Correct nominal size (19.05, 31.75, 38.1 mm) with "at 25.4 mm per inch"; labelled OD/ID | fixed | sanity script |
| pipe.ts · nominal ID | unlabelled | `15.8 (inside diameter in mm)` | fixed | sanity script |
| pipe.ts · cut length | `400 − 12 − 12 = 376 mm` | `400 (centre to centre in mm) − 12 (first take-off in mm) − 12 (second take-off in mm) = 376 (cut length in mm)` | fixed | sanity script |
| pipe.ts · route | segments and waste multiplier (1.1) unexplained | Segments labelled; `100% (the run) + 10% (waste) = 110% (pipe to order)`, `1.1 (run plus waste)`, `13.8 (metres to order)` | fixed | sanity script |
| pipe.ts · slope (mm per m) | `15 mm/m × 4 m = 60 mm` | `15 (fall in mm per metre) × 4 (run in m) = 60 (total fall in mm)` | fixed | sanity script |
| pipe.ts · slope (¼ in per ft) | `0.25 × 12 = 3 in`; "0.25 ÷ 12 ≈ 2.1 %" skipped the × 100 | ¼ = 0.25 stated; labelled fall; `0.25 (inch of fall) ÷ 12 (inches in a foot of run) × 100 (to make a percent) ≈ 2.1% (slope)` | fixed | sanity script |
| pipe.ts · slope (percent) | hint "÷ 1000 … × 100" unexplained | "A metre is 1000 mm" first; `20 (fall in mm) ÷ 1000 (mm of run) = 0.02 (fall per mm of run)`, `× 100 (to make a percent) = 2% (slope)` | fixed | sanity script |
| pipe.ts · capacity | one line mixing mm, cm, cm², cm³ and L; `0.79²` | Radius, mm → cm, `3.14 (pi, rounded) × r × r`, m → cm, cm³ → L each on its own labelled step, "≈" when rounded | fixed | sanity script |
| pipe.ts · flow (bucket) | `× 60` unexplained; "1 litres" | `(bucket in litres) ÷ (time in seconds) ≈ (litres per second)`, `× 60 (seconds in a minute)` | fixed | sanity script |
| pipe.ts · flow (fill time) | unlabelled | `(tank in litres) ÷ (flow in L/min) ≈ (time in minutes)` | fixed | sanity script |
| pipe.ts · head (kPa) | `2 × 9.81 = 20 kPa (about 0.2 bar)` | `2 (height in m) × 9.81 (kPa per metre of water) ≈ 20 (pressure in kPa)`, `÷ 100 (kPa in a bar)`; source of 9.81 given | fixed | sanity script |
| pipe.ts · head (psi) | unlabelled | `(height in ft) × 0.433 (psi per foot of water) ≈ (pressure in psi)` | fixed | sanity script |
| pipe.ts · head (height) | hint "kPa ÷ 9.81" unlabelled | Hint and step labelled | fixed | sanity script |
| pipe.ts · 45° offset travel | "× 1.414 (√2)" looked like a label but was not one | "√2 ≈ 1.414" explained by Pythagoras; `175 (offset in mm) × 1.414 (square root of two) ≈ 247 (travel in mm)` | fixed | sanity script |
| pipe.ts · 45° offset run | unlabelled; 30° factors unexplained | `(run in mm)`; `1.732 (run factor at thirty degrees)`, `2 (travel factor at thirty degrees)` | fixed | sanity script |
| phys.ts · force (weight) | `72 kg × 10 N/kg = 720 N`; "A engine block" | `72 (mass in kg) × 10 (newtons per kg) = 720 (weight in newtons)`; "An engine block" | fixed | sanity script |
| phys.ts · force (mass) | hint and steps unlabelled | `10 (newtons per kg)` in hint and steps | fixed | sanity script |
| phys.ts · torque (torque / force / arm) | unlabelled | `(force in newtons) × (arm in m) = (torque in newton-metres)` and rearrangements | fixed | sanity script |
| phys.ts · torque lbf·ft → lbf·in | unlabelled | `(torque in pound-feet) × 12 (inches in a foot) = (torque in pound-inches)` | fixed | sanity script |
| phys.ts · torque N·m → lbf·ft | hint "× 0.7376" unlabelled | Factor labelled "pound-feet per newton-metre", source stated, "≈" | fixed | sanity script |
| phys.ts · lever | `Known side: 35 × 2 = 70 N·m` | `35 (right force in N) × 2 (right distance in m) = 70 (torque in newton-metres)`, then `÷ 70 (left force in N) = 1 (left distance in m)` for each hidden value | fixed | sanity script |
| phys.ts · pressure (force ÷ area) | unlabelled | `(force in newtons) ÷ (area in m²) ≈ (pressure in pascals)` | fixed | sanity script |
| phys.ts · pressure (psi → kPa) | hint "about 6.9" unlabelled | `6.895 (kPa per psi)`, source stated, "≈" | fixed | sanity script |
| phys.ts · pressure (kPa → psi) | factor never stated in the steps | Factor stated, then labelled division | fixed | sanity script |
| phys.ts · pressure (head) | unlabelled; bar conversion unexplained | Labelled, `÷ 100 (kPa in a bar)` | fixed | sanity script |
| phys.ts · work | unlabelled | `(force in newtons) × (distance in m) = (work in joules)` and rearrangements | fixed | sanity script |
| phys.ts · power (W) | unlabelled | `(work in joules) ÷ (time in seconds) ≈ (power in watts)` | fixed | sanity script |
| phys.ts · power (kWh) | unlabelled | `(power in kW) × (time in hours) = (energy in kWh)` | fixed | sanity script |
| phys.ts · power (cost) | unlabelled | `(energy in kWh) × (price per kWh) = (cost)` | fixed | sanity script |
| phys.ts · power (time) | unlabelled | `(work in joules) ÷ (power in watts) ≈ (time in seconds)` | fixed | sanity script |
| phys.ts · electric (V, I, R, P) | unlabelled; "=" where the current was rounded (6 ÷ 48 = 0.13) | Volts, amps, ohms, watts labelled; "≈" when the rounded current is used | fixed | sanity script |
| phys.ts · thermal expansion | unlabelled; µm → mm shown with "=" on a rounded value | `(micrometres per metre per degree) × (length in m) × (temperature rise in degrees C) = (growth in micrometres)`, `÷ 1000 (micrometres in a mm)` | fixed | sanity script |
| all files · `expression` strings (`400 − 12 − 12 = ?`, `d ÷ t = ?`) | numbers without labels | Other code compares them; left as is by rule | not applicable | read |
| all files · `visual` numeric fields and card lines (`refLabel`, cylinder `label`) | picture text | Numeric visual fields are out of scope; unchanged | not applicable | read |
