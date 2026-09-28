# Reality Quest: Electronics Lab (v0.34.0)

Reality Quest turns a real object into a lab. The first lab is the learner's own **ELEGOO UNO R3 starter kit**.
Everything runs virtually: the bench simulates the parts closely enough that the first real build should feel familiar.

## Where it lives

- The **LAB** tab in the bottom bar (it replaced Map). World Map moved to **More → World Map**.
- The older lab-stations screen is now **More → Projects**.

## Tabs

| Tab | What it does |
|---|---|
| Missions | Dashboard: missions done, and skills learned, in progress, needing review or not started. Also the mission path M01–M10 plus the boss (each unlocks after its prerequisites), and a "Create a new lab (coming later)" placeholder. |
| My kit | The kit-lid photo with 35 tappable tiles (zoom, or a list view). Each opens a component card: what it does, how it works inside (an animated in → inside → out strip), aliases, pins, safety, uses, missions and your checks. "Doesn't match my kit?" records a kit correction. |
| Free bench | Place any simulated part, run wires, plug in USB, pick a sketch, edit its highlighted values, Upload, and use the test station (light, temperature, distance, knob, button) and the Serial Monitor. "Start from a build" loads any mission circuit. |
| Notebook | The error book (every miss with why; retry with a fresh variant clears it), predict-vs-observe records, saved inventions, and notes per mission. |
| Mastery | Every skill with its required checks (recognize, explain, predict, apply, debug, transfer) and each part's checks. |

## Missions

| # | Title | Main skills |
|---|---|---|
| M01 | Kit explorer | Input → controller → output roles |
| M02 | Paths and power | Closed loops, breadboard strips and rails |
| M03 | Light a safe LED | Limiting current (I = V ÷ R), polarity, Blink |
| M04 | Button logic | Digital input, INPUT_PULLUP, floating pins |
| M05 | Read a knob | analogRead 0–1023, PWM brightness |
| M06 | Light detector | Voltage dividers, thresholds |
| M07 | Temperature reporter | DHT11 module vs thermistor |
| M08 | Sound alarm | Active vs passive buzzers, tone() |
| M09 | Motion output | Servo angles, power vs signal |
| M10 | Echo ranger | Distance = speed of sound × time ÷ 2 |
| ★ | Boss quest: invent from this kit | Choose sensor, output and threshold; predict; test at two conditions; record a failure, a fix and a limitation. A model answer unlocks after you submit. |

Stage types: teach, find it on the kit, quiz, sort by role, breadboard strips, guided build, predict then observe, code (edit, then Upload), debug (watch, diagnose, fix, check), and invent.
Questions draw fresh variants on every retry.

## Mastery rule

A skill is **learned** only when every check it needs has passed (100%). Recognizing a part never counts on its own.
An open error-book entry puts the skill in **needs review** until you retry it correctly.

## The simulator

- Breadboard: 30 columns, strips a–e and f–j, split rails; the UNO's digital, power and analog headers.
- Nodal DC solver: LEDs with forward voltage by colour, resistors, a potentiometer, photoresistor and thermistor dividers, buttons across the gap, active and passive buzzers, a servo, an ultrasonic sensor and a DHT11.
- Real consequences: an LED over-current for more than 300 ms burns out; a pin over 40 mA warns; the USB fuse trips at 500 mA; unconnected inputs float. You must unplug USB before changing the wiring.
- Sketches are real Arduino C++ (Copy puts them on the clipboard for the real UNO later), with a behaviour model that drives the simulated pins.

## Accuracy notice

Component cards are **label-confirmed**: named from the printed lid, not yet checked against the physical parts.
When the real kit is opened, mark any part that differs; the wiring cards should be verified against the real parts before the first physical build.

## Code map

- `src/engine/reality/`: `kit01.ts` (photo, hotspots, 35 cards), `circuit.ts` (nets and solver), `runtime.ts` (bench and sketches runtime), `sketches.ts`, `recipes.ts` (builds, faults, boss), `missions.ts`, `progress.ts`.
- `src/game/reality/`: `RealityScreen.tsx`, `MissionPlayer.tsx`, `Invent.tsx`, `CircuitMat.tsx`, `LabPanels.tsx`, `Kit.tsx`, `useBench.ts`, `reality.css`.
- Tests: `src/engine/__tests__/reality-*.test.ts`.
