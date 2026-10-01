/**
 * Electronics Kit 01 missions. The spine: SEE → NAME → EXPLAIN → PREDICT → CONNECT → BUILD → DEBUG → INVENT.
 * Every question is a generator (fresh variant per attempt, same causal rule); every wrong choice names its
 * misconception so the error book can target it. Builds, tests and debugging run on the simulator.
 */
import type { Rng } from '../rng';
import type { MasteryStage } from './types';
import type { SimResult, Env } from './circuit';
import type { Slots } from './runtime';

/* ---------------- stage types ---------------- */

export interface Quiz {
  prompt: string;
  choices: string[];
  answer: number;
  /** Why the right answer is right (shown after any attempt). */
  why: string;
  /** Per wrong choice: the targeted explanation and misconception tag. */
  wrong: Record<number, { why: string; tag: string }>;
  show?: TeachShow;
}
export interface Hunt { prompt: string; targets: string[]; why: string }
export type TeachShow =
  | { kind: 'io'; component: string }                 // input → principle → output strip
  | { kind: 'strips' }                                  // breadboard strips diagram
  | { kind: 'loop' }                                    // source → part → return
  | { kind: 'formula'; lines: string[] }                // a worked calculation card
  | { kind: 'photo'; tile: string }                     // a crop of the lid photo
  | { kind: 'jobs' }                                    // input → controller → output, with an example
  | { kind: 'recipe'; recipe: string };                 // the reviewed wiring card
export type Control = 'light' | 'temp' | 'distance' | 'knob' | 'button';

export type Stage =
  | { kind: 'teach'; title: string; text: string; show?: TeachShow }
  /** Meet the parts: one part per screen, in plain words, before any question asks about them. Not scored. */
  | { kind: 'tour'; title: string; text: string; parts: string[] }
  | { kind: 'hunt'; skill: string; gen: (rng: Rng) => Hunt }
  | { kind: 'quiz'; skill: string; stage: MasteryStage; component?: string; gen: (rng: Rng) => Quiz }
  | { kind: 'sort'; skill: string; items: string[] }
  | { kind: 'strips'; skill: string }
  | { kind: 'build'; skill: string; recipe: string; intro: string }
  /** Predict first, then run the circuit on the test station until the goal happens. */
  | { kind: 'observe'; skill: string; recipe: string; control: Control; gen: (rng: Rng) => Quiz; task: string; goal: (r: SimResult, env: Env, serial: string[]) => boolean; seen: (r: SimResult, env: Env, serial: string[]) => string }
  | { kind: 'code'; skill: string; recipe: string; task: string; hint: string; check: (s: Slots) => string | null }
  | { kind: 'debug'; skill: string; recipe: string; faults: string[] }
  | { kind: 'invent' };

export interface Mission {
  id: string;
  n: number;
  title: string;
  goal: string;
  /** Exit evidence, as in the handoff. */
  exit: string;
  /** Recommended earlier missions (the learner may still open this one). */
  prereq: string[];
  components: string[];
  /** Skills this mission builds; a skill is mastered when all its required checks across missions pass. */
  skills: string[];
  /** Academy chapters with the same maths. */
  maths?: { label: string; academy: string; chapter: string }[];
  stages: Stage[];
}

export const SKILLS: Record<string, { name: string; about: string }> = {
  roles: { name: 'Input, controller, output', about: 'Every device senses, decides and acts; support parts connect and power it.' },
  loop: { name: 'Closed loops', about: 'Current flows only around a complete path from + back to −.' },
  breadboard: { name: 'Breadboard strips and rails', about: 'Which holes are joined inside the board.' },
  'current-limit': { name: 'Limiting current', about: 'A resistor sets the current: I = V ÷ R.' },
  polarity: { name: 'Polarity', about: 'LEDs, buzzers and modules have a + and a −.' },
  'digital-input': { name: 'Digital inputs', about: 'A pin reads HIGH or LOW; a pull-up stops it floating.' },
  'analog-input': { name: 'Analog inputs', about: 'analogRead turns 0–5 V into 0–1023.' },
  pwm: { name: 'PWM brightness', about: 'analogWrite switches fast; 0–255 sets the on-time.' },
  divider: { name: 'Voltage dividers', about: 'Two resistances share 5 V; a sensor changes the share.' },
  'digital-sensor': { name: 'Digital sensor modules', about: 'A module like the DHT11 sends numbers over one data wire.' },
  sound: { name: 'Making sound', about: 'Active buzzers beep on DC; passive ones need tone().' },
  motion: { name: 'Servo motion', about: 'Signal sets the angle; the motor’s power comes from 5 V.' },
  echo: { name: 'Echo timing', about: 'Distance = speed of sound × time ÷ 2 (out and back).' },
  design: { name: 'Designing a device', about: 'Choose sensor, controller, output and power; test and fix.' },
};

/* ---------------- question helpers ---------------- */

type W = [text: string, why: string, tag: string];
/** Shuffle a right answer among wrong ones, keeping each wrong choice's targeted feedback. */
export function mk(rng: Rng, prompt: string, right: string, why: string, wrongs: W[], show?: TeachShow): Quiz {
  const all = rng.shuffle([{ t: right, ok: true, why: '', tag: '' }, ...wrongs.map(([t, w, tag]) => ({ t, ok: false, why: w, tag }))]);
  const wrong: Quiz['wrong'] = {};
  all.forEach((c, i) => { if (!c.ok) wrong[i] = { why: c.why, tag: c.tag }; });
  return { prompt, choices: all.map((c) => c.t), answer: all.findIndex((c) => c.ok), why, wrong, show };
}
const pool = <T>(items: ((rng: Rng) => T)[]) => (rng: Rng) => rng.pick(items)(rng);
const hunt = (prompt: string, targets: string[], why: string): ((rng: Rng) => Hunt) => () => ({ prompt, targets, why });
const huntPool = (items: [string, string[], string][]) => (rng: Rng): Hunt => { const [p, t, w] = rng.pick(items); return { prompt: p, targets: t, why: w }; };

/* ---------------- missions ---------------- */

const M01: Mission = {
  id: 'm01', n: 1, title: 'Kit explorer', goal: 'Find the key parts on your kit and sort them by the job they do.',
  exit: 'Explain each part’s role; find a part from its function, not only its name.',
  prereq: [], components: ['uno', 'breadboard', 'led', 'resistor', 'button', 'ultrasonic', 'active-buzzer', 'servo'], skills: ['roles'],
  stages: [
    { kind: 'teach', title: 'Your kit is a lab', text: 'This box is your own electronics lab. The picture on the lid shows every part inside, and in this game you can tap any of them to learn about it. Nobody expects you to know these parts yet: this mission introduces them one at a time.', show: { kind: 'photo', tile: 'A1' } },
    { kind: 'teach', title: 'Every gadget has three jobs', text: 'Think of a night light. Something has to notice that it got dark: that part is the input. Something has to decide “it’s dark, so turn on”: that part is the controller. Something has to do the work and glow: that part is the output. Almost every gadget works this way, from a doorbell to a robot. A few more parts, called support parts, just connect everything and bring power.', show: { kind: 'jobs' } },
    { kind: 'tour', title: 'Meet the parts', text: 'Here are the parts you will use most. For each one: what it does, what it is like, and where it is on your kit. Take your time; there are no questions yet.',
      parts: ['uno', 'button', 'photoresistor', 'ultrasonic', 'dht11', 'led', 'active-buzzer', 'servo', 'breadboard', 'resistor', 'usb-cable'] },
    { kind: 'hunt', skill: 'roles', gen: huntPool([
      ['Tap the brain of every build: the board that runs your code.', ['uno'], 'The UNO R3 reads inputs, runs your program and switches outputs.'],
      ['Tap the board full of holes that holds parts without soldering.', ['breadboard'], 'The 830-point breadboard: metal strips inside join the holes.'],
      ['Tap the part that measures distance with sound.', ['ultrasonic'], 'The ultrasonic sensor’s two “eyes” are a speaker and a microphone for 40 kHz sound.'],
    ]) },
    { kind: 'hunt', skill: 'roles', gen: huntPool([
      ['Tap the parts that give out light.', ['led', 'rgb-led'], 'LEDs (light-emitting diodes) glow when current flows through them the right way.'],
      ['Tap the part that limits current so an LED stays safe.', ['resistor'], 'Resistors have coloured bands that give their value in ohms.'],
      ['Tap the part you press to send a signal.', ['button'], 'A push button joins two metal contacts while you press it.'],
    ]) },
    { kind: 'hunt', skill: 'roles', gen: huntPool([
      ['Tap the part that turns an arm to an exact angle.', ['servo'], 'The SG90 servo has a motor, gears and a sensor, so it can hold an angle.'],
      ['Tap the part that beeps as soon as it gets 5 V.', ['active-buzzer'], 'An active buzzer has its own oscillator inside.'],
      ['Tap the part that senses how bright it is.', ['photoresistor'], 'A photoresistor’s resistance drops in bright light.'],
      ['Tap the part that reports temperature and humidity as numbers.', ['dht11'], 'The DHT11 module measures both and sends them down one data wire.'],
    ]) },
    { kind: 'sort', skill: 'roles', items: ['uno', 'ultrasonic', 'button', 'photoresistor', 'led', 'active-buzzer', 'servo', 'breadboard', 'resistor', 'usb-cable'] },
    { kind: 'quiz', skill: 'roles', stage: 'explain', gen: pool([
      (rng) => mk(rng, 'A robot must stop before it bumps into a wall. Which part notices the wall?', 'The ultrasonic sensor', 'Noticing is an input job. The ultrasonic sensor measures how far away the wall is.',
        [['The servo', 'The servo is an output: it moves, it doesn’t sense.', 'role-confusion'], ['The UNO', 'The UNO decides what to do, but it needs a sensor to notice the wall.', 'controller-senses'], ['The breadboard', 'The breadboard only connects parts.', 'role-confusion']]),
      (rng) => mk(rng, 'A night light should turn on when the room gets dark. Which part notices the darkness?', 'The photoresistor', 'Sensing light is an input job; the photoresistor’s resistance changes with light.',
        [['The LED', 'The LED is the output that lights up.', 'role-confusion'], ['The resistor', 'A fixed resistor always has the same value; it cannot sense light.', 'role-confusion'], ['The USB cable', 'The cable brings power and code, not information about light.', 'role-confusion']]),
      (rng) => mk(rng, 'In a doorbell, which part is the controller?', 'The UNO, running the program', 'The controller reads the input (the button) and decides to switch the output (the buzzer).',
        [['The button', 'The button is the input: it only tells the UNO it was pressed.', 'role-confusion'], ['The buzzer', 'The buzzer is the output.', 'role-confusion'], ['The jumper wires', 'Wires are support parts: they carry signals, they don’t decide.', 'role-confusion']]),
    ]) },
    { kind: 'quiz', skill: 'roles', stage: 'transfer', gen: pool([
      (rng) => mk(rng, 'A plant waterer: when the soil is dry, a pump runs. Which is the OUTPUT?', 'The pump', 'The pump acts on the world, so it is the output. A soil sensor is the input; a controller decides.',
        [['The soil sensor', 'The sensor notices dryness: an input.', 'role-confusion'], ['The controller', 'The controller decides; it doesn’t water anything.', 'role-confusion'], ['The dry soil', 'The soil is what is being measured, not a part of the device.', 'role-confusion']]),
      (rng) => mk(rng, 'A car’s parking beeper: which chain is right?', 'Distance sensor → controller → beeper', 'Input senses, controller decides, output acts, in that order.',
        [['Beeper → controller → distance sensor', 'The information flows from the sensor to the output, not the other way.', 'signal-flow'], ['Controller → distance sensor → beeper', 'The controller needs the sensor’s reading first.', 'signal-flow'], ['Distance sensor → beeper, no controller', 'Something has to decide when “close” is close enough.', 'controller-skipped']]),
    ]) },
  ],
};

const M02: Mission = {
  id: 'm02', n: 2, title: 'Paths and power', goal: 'Trace the path current takes, learn which breadboard holes are joined, and close a loop.',
  exit: 'Predict open vs closed circuits; locate a missing connection.',
  prereq: ['m01'], components: ['breadboard', 'jumpers', 'usb-cable', 'uno'], skills: ['loop', 'breadboard'],
  stages: [
    { kind: 'tour', title: 'Parts for this mission', text: 'You met these in Mission 1. Here is a closer look at the three that carry electricity around.', parts: ['breadboard', 'jumpers', 'usb-cable'] },
    { kind: 'teach', title: 'Current needs a loop', text: 'Current flows out of the 5 V pin, through the parts, and back into GND. If the path is broken anywhere, nothing flows anywhere: the loop is open. Think of it as a circle, not a one-way street.', show: { kind: 'loop' } },
    { kind: 'teach', title: 'Inside the breadboard', text: 'Under the holes are metal strips. In each numbered column, holes a–e are joined, and f–j are joined; the gap in the middle keeps them apart. The long rails along the edges run the whole length: red + for power, blue − for ground.', show: { kind: 'strips' } },
    { kind: 'strips', skill: 'breadboard' },
    { kind: 'strips', skill: 'breadboard' },
    { kind: 'quiz', skill: 'loop', stage: 'predict', gen: pool([
      (rng) => mk(rng, 'Which of these lights the LED?', '5V → resistor → LED long leg … short leg → GND', 'Only this one is a complete loop from + back to −.',
        [['5V → resistor → LED long leg; short leg in an empty column', 'The short leg goes nowhere: the loop is open.', 'open-circuit'], ['5V → LED → 5V', 'Both ends at 5 V: there is no difference in voltage to push current.', 'no-return'], ['GND → resistor → LED → GND', 'There is no source: both ends are at 0 V.', 'no-source']]),
    ]) },
    { kind: 'quiz', skill: 'breadboard', stage: 'explain', gen: pool([
      (rng) => mk(rng, 'The LED’s long leg is in e12 and the resistor ends in c12. Are they connected?', 'Yes: c12 and e12 are in the same strip (a–e of column 12)', 'Holes a–e of one column share a metal strip.',
        [['No: they are in different rows', 'Rows c and e are joined within one column.', 'breadboard-rows'], ['Only if a wire joins them', 'The strip inside already joins them.', 'breadboard-rows'], ['Yes, because every hole in row 12 is joined', 'Columns, not the whole board: column 12 a–e only.', 'breadboard-rows']]),
      (rng) => mk(rng, 'The resistor ends in c12, the LED’s long leg is in f12. Are they connected?', 'No: the middle gap separates a–e from f–j', 'The gap splits each column into two separate strips.',
        [['Yes: same column', 'Same column number, but across the gap is a different strip.', 'breadboard-gap'], ['Yes: all holes near each other are joined', 'Only the holes in one strip are joined.', 'breadboard-rows'], ['Only when power is on', 'The strips are always joined or not; power doesn’t change it.', 'breadboard-gap']]),
    ]) },
    { kind: 'build', skill: 'loop', recipe: 'path', intro: 'Build the loop step by step. The last wire closes it.' },
    { kind: 'debug', skill: 'loop', recipe: 'path', faults: ['gap', 'gapjump'] },
    { kind: 'quiz', skill: 'loop', stage: 'transfer', gen: pool([
      (rng) => mk(rng, 'A torch doesn’t light. The bulb and battery are both fine. What could still stop it?', 'A contact inside is bent away, so the loop is open', 'Any single gap in the loop stops all the current.',
        [['The battery is too big', 'A too-strong battery would make it brighter, not dark.', 'open-circuit'], ['The switch is ON', 'ON should close the loop.', 'open-circuit'], ['Current only flows when you shake it', 'Current flows whenever the loop is complete.', 'open-circuit']]),
      (rng) => mk(rng, 'Why does the UNO need a GND wire to your circuit, not just a 5V wire?', 'The current has to return to the UNO to complete the loop', 'Current goes out through 5V and must come back through GND.',
        [['GND adds extra power', 'GND is the return path at 0 V; it doesn’t add power.', 'no-return'], ['Only for safety', 'Without it, no current flows at all.', 'no-return'], ['It doesn’t: one wire is enough', 'One wire can’t make a loop.', 'no-return']]),
    ]) },
  ],
};

const M03: Mission = {
  id: 'm03', n: 3, title: 'Light a safe LED', goal: 'Choose the resistor, get the polarity right, light an LED, then blink it from pin 13.',
  exit: 'Explain why current needs a limit and why reversed orientation matters.',
  prereq: ['m02'], components: ['led', 'resistor', 'breadboard', 'uno'], skills: ['current-limit', 'polarity'],
  maths: [{ label: 'Ohm’s law, I = V ÷ R', academy: 'algebra1', chapter: 'formulas' }],
  stages: [
    { kind: 'tour', title: 'Parts for this mission', text: 'Two parts you met in Mission 1, which always work as a team: the LED makes light and the resistor keeps it safe.', parts: ['led', 'resistor'] },
    { kind: 'teach', title: 'An LED is a one-way light', text: 'An LED only lets current through from its long leg (+, anode) to its short leg (−, cathode). Backwards, it stays dark. Forwards, it uses about 2 V and would let far too much current through, so we add a resistor to set the current.', show: { kind: 'io', component: 'led' } },
    { kind: 'teach', title: 'Choosing the resistor', text: 'The resistor gets whatever voltage the LED doesn’t use: 5 (supply volts) − 2 (LED volts) = 3 (resistor volts). Ohm’s law gives the current: I = V ÷ R. With 220 Ω: 3 (resistor volts) ÷ 220 (resistance in ohms) ≈ 0.014 (current in amps). One amp is 1000 mA, so that is 14 mA: bright and safe (LEDs like 10–20 mA).', show: { kind: 'formula', lines: ['Resistor gets 5 (supply volts) − 2 (LED volts) = 3 (resistor volts)', 'I = V ÷ R = 3 (resistor volts) ÷ 220 (resistance in ohms)', 'I ≈ 0.014 (current in amps) × 1000 (mA per amp) = 14 (current in mA)', '✓ Safe: under 20 mA'] } },
    { kind: 'hunt', skill: 'current-limit', gen: hunt('Tap the part that limits the current.', ['resistor'], 'Resistors: 120 of them in your kit, in ten values.') },
    { kind: 'quiz', skill: 'current-limit', stage: 'explain', gen: pool([
      (rng) => mk(rng, 'Why does the LED need a resistor?', 'Without it, far too much current flows and the LED burns out', 'The LED itself barely limits current; the resistor sets it.',
        [['To make the LED dimmer and save power', 'Dimmer is a side effect; the real job is keeping the current safe.', 'resistor-dims'], ['To change the colour', 'The LED’s material sets its colour.', 'resistor-colour'], ['To store electricity for later', 'That would be a capacitor or battery.', 'resistor-stores']]),
      (rng) => mk(rng, 'Does it matter if the resistor goes before or after the LED in the loop?', 'No: in a single loop the same current flows through both', 'In a series loop the current is the same everywhere, so either order limits it.',
        [['Yes: it must come before, to stop the current first', 'Current isn’t “used up” along the way; it’s the same all round the loop.', 'current-used-up'], ['Yes: it must come after, to catch the leftover', 'There’s no leftover current: it’s the same all round.', 'current-used-up'], ['Only for red LEDs', 'The same rule holds for every colour.', 'current-used-up']]),
    ]) },
    { kind: 'quiz', skill: 'current-limit', stage: 'predict', gen: (rng) => {
      const [r, ma] = rng.pick([[220, 14], [330, 9], [150, 20], [1000, 3]] as const);
      return mk(rng, `5 V supply, the LED uses 2 V, and the resistor is ${r} Ω. About how much current flows?`, `${ma} mA`, `The resistor gets the 3 V the LED doesn’t use. I = 3 (resistor volts) ÷ ${r} (resistance in ohms) ≈ ${(3 / r).toFixed(3)} (current in amps) ≈ ${ma} (current in mA).`,
        [[`${Math.round((5 / r) * 1000)} mA`, 'That uses 5 V, but the LED takes about 2 V; the resistor only gets 3 V.', 'forgot-led-drop'], [`${Math.round((2 / r) * 1000)} mA`, 'That uses the LED’s 2 V; the resistor gets the other 3 V.', 'voltage-swap'], [`${r * 3} mA`, 'Divide volts by ohms, don’t multiply.', 'ohms-law-inverted']], { kind: 'formula', lines: ['I = V ÷ R'] });
    } },
    { kind: 'build', skill: 'current-limit', recipe: 'led', intro: 'Build it step by step: power rails first, then the resistor, the LED the right way round, and the path back to ground. Then plug in the USB cable.' },
    { kind: 'code', skill: 'polarity', recipe: 'blink', task: 'The red wire now comes from pin 13, so code decides when the LED gets 5 V. Make it blink twice as fast as the factory Blink (on and off for 500 ms or less each), then Upload.', hint: 'Change both delays.',
      check: (s) => (Number(s.on) <= 500 && Number(s.off) <= 500 ? null : 'Both delays need to be 500 ms or less for twice as fast.') },
    { kind: 'debug', skill: 'polarity', recipe: 'led', faults: ['reversed', 'bypass', 'bigR'] },
    { kind: 'quiz', skill: 'polarity', stage: 'transfer', gen: pool([
      (rng) => mk(rng, 'A bike light: a 3 V battery and an LED that uses 2 V. What voltage must its resistor take?', '1 V', 'Whatever the LED doesn’t use, the resistor takes: 3 (battery volts) − 2 (LED volts) = 1 (resistor volts).',
        [['3 V', 'The LED uses 2 of the 3 volts.', 'forgot-led-drop'], ['2 V', 'That is the LED’s share.', 'voltage-swap'], ['5 V', 'The battery only has 3 V to share.', 'forgot-led-drop']]),
      (rng) => mk(rng, 'Your friend’s LED stays dark. It’s wired 5V → 220 Ω → short leg … long leg → GND. What’s wrong?', 'It’s backwards: the long leg must face the + side', 'Current only flows from the long leg (+) to the short leg (−).',
        [['The resistor is too big', '220 Ω is right for 14 mA.', 'resistor-dims'], ['It needs code', 'Wired from 5 V, it needs no code.', 'code-needed'], ['The LED is too cold', 'LEDs work at room temperature.', 'led-polarity']]),
    ]) },
  ],
};

const M04: Mission = {
  id: 'm04', n: 4, title: 'Button logic', goal: 'Read a button with a steady input, and control the LED with code.',
  exit: 'Explain when the input reads pressed; debug a floating or miswired input.',
  prereq: ['m03'], components: ['button', 'uno', 'led', 'resistor'], skills: ['digital-input'],
  stages: [
    { kind: 'tour', title: 'Parts for this mission', text: 'This mission is about the button: how the UNO can tell when it is pressed.', parts: ['button', 'led'] },
    { kind: 'teach', title: 'Inside a button', text: 'A tactile button has four legs in two joined pairs. Pressing joins the two pairs. It sits across the breadboard’s middle gap so each pair lands in its own strip.', show: { kind: 'io', component: 'button' } },
    { kind: 'teach', title: 'Don’t let the pin float', text: 'An input pin reads HIGH (near 5 V) or LOW (near 0 V). If it’s connected to nothing, it “floats” and reads random noise. INPUT_PULLUP switches on a resistor inside the UNO that holds the pin HIGH, and the button pulls it LOW when pressed. So pressed = LOW.', show: { kind: 'formula', lines: ['Not pressed: pull-up holds pin 2 at 5 V → HIGH', 'Pressed: button joins pin 2 to GND → LOW'] } },
    { kind: 'hunt', skill: 'digital-input', gen: hunt('Tap the part you press to send a signal.', ['button'], 'Your kit has 5 buttons.') },
    { kind: 'quiz', skill: 'digital-input', stage: 'predict', gen: pool([
      (rng) => mk(rng, 'With INPUT_PULLUP and the button to GND, what does digitalRead give when NOT pressed?', 'HIGH (1)', 'The internal pull-up resistor holds the pin at 5 V.',
        [['LOW (0)', 'LOW is what you read while pressing.', 'pullup-inverted'], ['A random value', 'That happens only without a pull-up: floating.', 'floating'], ['512', 'digitalRead only gives 0 or 1; analogRead gives 0–1023.', 'digital-vs-analog']]),
      (rng) => mk(rng, 'With INPUT_PULLUP and the button to GND, what does digitalRead give WHILE pressed?', 'LOW (0)', 'Pressing joins the pin to GND.',
        [['HIGH (1)', 'That is the released reading.', 'pullup-inverted'], ['It flickers', 'Pressed, it is firmly joined to GND.', 'floating'], ['1023', 'digitalRead only gives 0 or 1.', 'digital-vs-analog']]),
    ]) },
    { kind: 'build', skill: 'digital-input', recipe: 'button', intro: 'Pin 13 drives the LED; pin 2 reads the button. The code is already on the board: plug in and press.' },
    { kind: 'observe', skill: 'digital-input', recipe: 'button', control: 'button',
      gen: (rng) => mk(rng, 'Predict: when you hold the button, what will the LED do?', 'Turn on', 'The code turns the LED on while pin 2 reads LOW (pressed).', [['Turn off', 'The code lights it when pressed.', 'pullup-inverted'], ['Blink', 'There’s no blinking in this code.', 'code-reading'], ['Nothing', 'Pressing changes pin 2, and the code reacts.', 'code-reading']]),
      task: 'Hold the button and watch pin 2 and the LED.', goal: (r) => r.pins.D2?.reading === 0 && Object.values(r.parts).some((p) => (p.brightness ?? 0) > 0.5), seen: (r) => `Pin 2 reads ${r.pins.D2?.reading === 0 ? 'LOW' : r.pins.D2?.reading === 1 ? 'HIGH' : 'floating'}; LED ${Object.values(r.parts).some((p) => (p.brightness ?? 0) > 0.5) ? 'on' : 'off'}` },
    { kind: 'debug', skill: 'digital-input', recipe: 'button', faults: ['floating', 'rotated', 'pin3'] },
    { kind: 'quiz', skill: 'digital-input', stage: 'transfer', gen: pool([
      (rng) => mk(rng, 'A door alarm: a switch is closed while the door is shut and opens when the door opens. It’s on pin 2 with INPUT_PULLUP to GND. What does pin 2 read when the door opens?', 'HIGH', 'Open switch: nothing pulls the pin down, so the pull-up holds it HIGH.',
        [['LOW', 'LOW means the switch is closed (door shut).', 'pullup-inverted'], ['Floating', 'The pull-up prevents floating.', 'floating'], ['It depends on the LED', 'The LED doesn’t affect the input.', 'code-reading']]),
      (rng) => mk(rng, 'Someone wires a button to pin 7 with plain INPUT and no resistor. What will they see?', 'Random readings when it’s not pressed', 'An input with nothing holding it floats and picks up noise.',
        [['Always HIGH', 'Nothing holds it HIGH without a pull-up.', 'floating'], ['Always LOW', 'Nothing holds it LOW either.', 'floating'], ['The UNO will be damaged', 'Floating is harmless; it’s just unreliable.', 'floating']]),
    ]) },
  ],
};

const M05: Mission = {
  id: 'm05', n: 5, title: 'Read a knob', goal: 'Turn the potentiometer, read it with analogRead (0–1023), and set LED brightness with PWM (0–255).',
  exit: 'Predict values as the knob turns; tell the input signal from the output behaviour.',
  prereq: ['m03'], components: ['potentiometer', 'uno', 'led'], skills: ['analog-input', 'pwm'],
  maths: [{ label: 'Scaling 1023 → 255 is a ratio', academy: 'arithmetic', chapter: 'ratio' }],
  stages: [
    { kind: 'tour', title: 'Parts for this mission', text: 'A new part: the knob. The UNO can tell exactly how far you have turned it.', parts: ['potentiometer', 'led'] },
    { kind: 'teach', title: 'A knob is a voltage divider', text: 'The potentiometer’s outer legs go to 5 V and GND; the middle leg (wiper) slides along a resistive track. At one end it sits at 0 V, at the other 5 V, in the middle 2.5 V. analogRead measures that voltage as a number from 0 to 1023.', show: { kind: 'io', component: 'potentiometer' } },
    { kind: 'teach', title: 'PWM: fast on-off', text: 'A digital pin can only give 5 V or 0 V. analogWrite switches it on and off about 500 times a second; the value 0–255 sets how much of each cycle is on. Your eye averages it into brightness. 1023 (top analogRead value) ÷ 4 ≈ 255 (top analogWrite value), so reading ÷ 4 fits.', show: { kind: 'formula', lines: ['analogRead: 0 V → 0 (reading) … 5 V → 1023 (reading)', 'analogWrite: 0 = off … 255 = always on', '1023 (top reading) ÷ 4 ≈ 255 (top brightness)'] } },
    { kind: 'hunt', skill: 'analog-input', gen: hunt('Tap the knob you turn to make a changing voltage.', ['potentiometer'], 'A 10 kΩ potentiometer.') },
    { kind: 'quiz', skill: 'analog-input', stage: 'predict', gen: (rng) => {
      const [frac, word] = rng.pick([[0.25, 'a quarter'], [0.5, 'halfway'], [0.75, 'three quarters']] as const);
      const v = Math.round(frac * 1023);
      return mk(rng, `The knob is turned ${word} of the way from the GND end toward the 5 V end. About what does analogRead show?`, `About ${v}`, `${word} of 5 V is ${(5 * frac).toFixed(2)} V; ${(5 * frac).toFixed(2)} (wiper volts) ÷ 5 (full-scale volts) × 1023 (top reading) ≈ ${v} (reading).`,
        [[`About ${Math.round(frac * 255)}`, '255 is the top of analogWrite; analogRead goes to 1023.', 'read-vs-write-range'],
          frac === 0.5 ? ['About 1023', 'That is the 5 V end; halfway is half of 1023.', 'divider-direction'] : [`About ${Math.round((1 - frac) * 1023)}`, 'That would be measured from the 5 V end.', 'divider-direction'],
          [`${(5 * frac).toFixed(1)} (the voltage)`, 'That’s the voltage; analogRead turns it into 0–1023.', 'volts-vs-counts']]);
    } },
    { kind: 'build', skill: 'analog-input', recipe: 'knob', intro: 'The LED is on pin 9 (a ~ PWM pin). The knob’s wiper goes to A0.' },
    { kind: 'observe', skill: 'pwm', recipe: 'knob', control: 'knob',
      gen: (rng) => mk(rng, 'Predict: as you turn the knob toward the 5 V end, what happens?', 'The reading rises and the LED gets brighter', 'Higher voltage → higher reading → bigger analogWrite value → longer on-time.',
        [['The reading rises and the LED gets dimmer', 'The code writes reading ÷ 4: bigger reading, brighter LED.', 'pwm-inverted'], ['The LED blinks faster', 'PWM changes brightness, not blink speed.', 'pwm-blink'], ['Nothing, until you upload again', 'The loop keeps reading the knob.', 'code-reading']]),
      task: 'Turn the knob until the Serial Monitor shows more than 800.', goal: (r) => (r.pins.A0?.analog ?? 0) > 800, seen: (r) => `A0 = ${r.pins.A0?.analog ?? '–'}, pin 9 duty ≈ ${Math.floor((r.pins.A0?.analog ?? 0) / 4)}` },
    { kind: 'debug', skill: 'pwm', recipe: 'knob', faults: ['wiper', 'div1'] },
    { kind: 'quiz', skill: 'analog-input', stage: 'transfer', gen: pool([
      (rng) => mk(rng, 'A volume knob works the same way. It reads 614 out of 1023. About what fraction of full volume is that?', 'About 60 %', '614 (reading) ÷ 1023 (top reading) ≈ 0.6 (fraction of full volume), which is 60 %.',
        [['About 6 %', '614 is most of 1023, not a small part.', 'ratio'], ['About 24 %', '614 (reading) ÷ 255 (top analogWrite value) isn’t the right ratio; use 1023 (top reading).', 'read-vs-write-range'], ['Exactly 614 %', 'A fraction of full scale can’t be over 100 %.', 'ratio']]),
      (rng) => mk(rng, 'Which is the INPUT signal and which is the OUTPUT behaviour in the knob dimmer?', 'Input: the voltage on A0. Output: the LED’s brightness', 'The knob makes a voltage the UNO reads; the UNO sets the LED’s on-time.',
        [['Input: the LED. Output: the knob', 'The knob is turned by you; the LED responds.', 'signal-flow'], ['Both are inputs', 'The LED is driven by the UNO: an output.', 'signal-flow'], ['Input: pin 9. Output: A0', 'A0 reads; pin 9 writes.', 'signal-flow']]),
    ]) },
  ],
};

const M06: Mission = {
  id: 'm06', n: 6, title: 'Light detector', goal: 'Turn a changing resistance into a readable voltage, and switch an LED at dusk.',
  exit: 'Explain why a changing resistance becomes a readable voltage; invert the rule.',
  prereq: ['m05'], components: ['photoresistor', 'resistor', 'uno', 'led'], skills: ['divider'],
  maths: [{ label: 'Dividers are fractions: V = 5 (supply volts) × R₂ ÷ (R₁ + R₂)', academy: 'arithmetic', chapter: 'frac' }],
  stages: [
    { kind: 'tour', title: 'Parts for this mission', text: 'The light sensor, and the resistor that helps the UNO read it.', parts: ['photoresistor', 'resistor', 'led'] },
    { kind: 'teach', title: 'Light changes resistance', text: 'A photoresistor’s resistance falls when light hits it: tens of kΩ in the dark, about 1 kΩ in bright light. The UNO can’t measure resistance directly, but it can measure voltage.', show: { kind: 'io', component: 'photoresistor' } },
    { kind: 'teach', title: 'The voltage divider', text: 'Put the photoresistor from 5 V to the A0 point, and a 10 kΩ resistor from A0 to GND. They share the 5 V in proportion to their resistance. Bright: the photoresistor is small, so A0 sits near 5 V. Dark: it’s big, so A0 drops toward 0 V.', show: { kind: 'formula', lines: ['V(A0) = 5 (supply volts) × 10 (fixed kilohms) ÷ (R_light + 10 (fixed kilohms))', 'Bright: R_light ≈ 1 (sensor kilohms) → ≈ 4.5 (volts at the analog pin) → ≈ 930 (reading)', 'Dark: R_light ≈ 100 (sensor kilohms) → ≈ 0.45 (volts at the analog pin) → ≈ 93 (reading)'] } },
    { kind: 'hunt', skill: 'divider', gen: hunt('Tap the part whose resistance changes with light.', ['photoresistor'], 'The photoresistor (photocell): a squiggly track on its face.') },
    { kind: 'quiz', skill: 'divider', stage: 'predict', gen: pool([
      (rng) => mk(rng, 'Photoresistor from 5 V to A0, 10 kΩ from A0 to GND. The room gets darker. What does the A0 reading do?', 'It goes down', 'Darker → larger photoresistor resistance → it takes more of the 5 V → less is left across the 10 kΩ at A0.',
        [['It goes up', 'That would be true with the two parts swapped.', 'divider-direction'], ['It stays the same', 'The divider exists exactly so the reading changes.', 'divider'], ['It becomes random', 'The divider holds A0 at a definite voltage.', 'floating']]),
      (rng) => mk(rng, 'Now swap them: 10 kΩ from 5 V to A0, photoresistor from A0 to GND. The room darkens. The reading…', 'Goes up', 'Now the photoresistor is on the ground side: when it grows, A0 gets a bigger share of 5 V.',
        [['Goes down', 'That was the other arrangement.', 'divider-direction'], ['Stays the same', 'It still changes, just the other way.', 'divider'], ['Goes to exactly 512', 'Only when both resistances are equal.', 'divider']]),
    ]) },
    { kind: 'build', skill: 'divider', recipe: 'light', intro: 'The divider goes on the right, the LED on pin 13 on the left.' },
    { kind: 'observe', skill: 'divider', recipe: 'light', control: 'light',
      gen: (rng) => mk(rng, 'Predict: the code turns the LED on when the reading is below 300. What must happen to the light?', 'It must get dark', 'Dark → low reading → below 300 → LED on.', [['It must get brighter', 'Brighter raises the reading.', 'divider-direction'], ['Nothing: it’s always on', 'It only switches below the threshold.', 'code-reading'], ['The knob must turn', 'There’s no knob in this circuit.', 'code-reading']]),
      task: 'Dim the room until the LED switches on.', goal: (r) => Object.values(r.parts).some((p) => (p.brightness ?? 0) > 0.5), seen: (r, env) => `Light ${env.light} % → A0 = ${r.pins.A0?.analog ?? '–'}` },
    { kind: 'code', skill: 'divider', recipe: 'light', task: 'Invert the rule: make the LED come on when it is BRIGHT (a “too sunny” warning) instead of dark. Change the comparison and pick a sensible threshold, then Upload.', hint: 'Bright light reads high, around 900.',
      check: (s) => (s.cmp !== '>' ? 'Flip the comparison so it fires above the threshold.' : Number(s.threshold) < 400 || Number(s.threshold) > 900 ? 'Pick a threshold between 400 and 900 so normal light doesn’t trigger it.' : null) },
    { kind: 'debug', skill: 'divider', recipe: 'light', faults: ['swap', 'nodivider'] },
    { kind: 'quiz', skill: 'divider', stage: 'transfer', gen: pool([
      (rng) => mk(rng, 'Why can’t you just wire the photoresistor between 5 V and A0 alone?', 'With nothing to ground, A0 is pulled to 5 V whatever the light', 'A divider needs two parts: the second one gives the voltage somewhere to drop to.',
        [['It would burn out', 'The current would be tiny; it’s just useless, not dangerous.', 'divider'], ['A0 can’t read photoresistors', 'A0 reads voltages; the divider makes the voltage.', 'divider'], ['It would work perfectly', 'The reading would sit near 1023.', 'divider']]),
      (rng) => mk(rng, 'A greenhouse fan should switch on when it’s hot. Which parts make the sensing half?', 'A thermistor and a fixed resistor in a divider to an analog pin', 'Temperature changes the thermistor’s resistance; the divider turns it into a voltage.',
        [['A photoresistor alone', 'That senses light, and alone it doesn’t make a divider.', 'role-confusion'], ['A button', 'Someone would have to press it.', 'role-confusion'], ['The fan itself', 'The fan is the output.', 'role-confusion']]),
    ]) },
  ],
};

const M07: Mission = {
  id: 'm07', n: 7, title: 'Temperature reporter', goal: 'Compare a digital sensor module (DHT11) with a variable resistance (thermistor), and print the temperature.',
  exit: 'Predict the sensor trend; tell measured temperature from an on/off decision.',
  prereq: ['m06'], components: ['dht11', 'thermistor', 'uno'], skills: ['digital-sensor', 'divider'],
  stages: [
    { kind: 'tour', title: 'Parts for this mission', text: 'Two different ways to sense heat: a simple part and a ready-made sensor module.', parts: ['thermistor', 'dht11', 'fm-wires'] },
    { kind: 'teach', title: 'Two ways to sense heat', text: 'The thermistor is a resistor whose resistance falls as it warms (10 kΩ at 25 °C). In a divider, that becomes a voltage for analogRead. The DHT11 has its own tiny chip: it measures, then sends the temperature and humidity as numbers down one data wire.', show: { kind: 'io', component: 'dht11' } },
    { kind: 'hunt', skill: 'digital-sensor', gen: hunt('Tap the module that sends temperature AND humidity as numbers.', ['dht11'], 'The blue DHT11 module.') },
    { kind: 'hunt', skill: 'divider', gen: hunt('Tap the part whose resistance falls as it warms.', ['thermistor'], 'The thermistor: a small black bead on two leads.') },
    { kind: 'quiz', skill: 'divider', stage: 'predict', gen: pool([
      (rng) => mk(rng, 'The room warms from 20 °C to 30 °C. What happens to the thermistor’s resistance?', 'It falls', 'It is an NTC thermistor: negative temperature coefficient, so warmer means less resistance.',
        [['It rises', 'That would be a PTC thermistor; yours is NTC.', 'ntc-direction'], ['It stays 10 kΩ', '10 kΩ is only its value at 25 °C.', 'ntc-direction'], ['It becomes zero', 'It falls gradually, not to zero.', 'ntc-direction']]),
      (rng) => mk(rng, 'Thermistor from 5 V to A1, 10 kΩ from A1 to GND. The room warms. The A1 reading…', 'Rises', 'Warmer → thermistor smaller → A1 gets a bigger share of 5 V.',
        [['Falls', 'That would be with the parts swapped.', 'divider-direction'], ['Doesn’t change', 'The divider makes it change.', 'divider'], ['Shows the temperature in °C', 'analogRead gives 0–1023, not degrees.', 'volts-vs-counts']]),
    ]) },
    { kind: 'build', skill: 'digital-sensor', recipe: 'temp', intro: 'DHT11 on the left (data to pin 2), thermistor divider on the right (to A1). The sketch uses the DHT sensor library.' },
    { kind: 'observe', skill: 'digital-sensor', recipe: 'temp', control: 'temp',
      gen: (rng) => mk(rng, 'Predict: if you warm the room to 30 °C, what will the Serial Monitor print for the DHT11?', 'Temp: 30 C', 'The DHT11 sends the temperature as a number; the code prints it.', [['A number from 0 to 1023', 'That’s what the thermistor gives: a raw analog count.', 'digital-vs-analog'], ['HIGH', 'The DHT11 sends numbers, not just HIGH/LOW.', 'digital-vs-analog'], ['Nothing until you press a button', 'It prints every 2 seconds.', 'code-reading']]),
      task: 'Warm the room to at least 30 °C and wait for the next reading.', goal: (_r, env, serial) => env.tempC >= 30 && serial.some((l) => /Temp: (3\d|4\d) C/.test(l)), seen: (_r, _e, serial) => serial.filter((l) => l.startsWith('Temp') || l.startsWith('Failed')).pop() ?? 'waiting for a reading…' },
    { kind: 'debug', skill: 'digital-sensor', recipe: 'temp', faults: ['datapin', 'nognd'] },
    { kind: 'quiz', skill: 'digital-sensor', stage: 'transfer', gen: pool([
      (rng) => mk(rng, 'Which line is a DECISION, not a measurement?', 'if (t > 28) turn the fan on', 'Measuring gives a number; deciding compares it with a rule and acts.',
        [['float t = dht.readTemperature();', 'That measures.', 'measure-vs-decide'], ['Serial.println(t);', 'That reports the measurement.', 'measure-vs-decide'], ['int raw = analogRead(A1);', 'That measures too.', 'measure-vs-decide']]),
      (rng) => mk(rng, 'Why is the DHT11 read only every 2 seconds?', 'It needs time between readings (at least about 1 second)', 'The DHT11 measures slowly; reading too often returns errors.',
        [['To save the batteries', 'It runs from USB here.', 'code-reading'], ['Temperature changes only every 2 seconds', 'Temperature changes smoothly; the sensor is the slow part.', 'code-reading'], ['The Serial Monitor is slow', 'The Monitor can print much faster.', 'code-reading']]),
    ]) },
  ],
};

const M08: Mission = {
  id: 'm08', n: 8, title: 'Sound alarm', goal: 'Compare active and passive buzzers and build an alarm pattern.',
  exit: 'Choose the right buzzer for simple on/off sound and debug silence.',
  prereq: ['m04'], components: ['active-buzzer', 'passive-buzzer', 'uno'], skills: ['sound', 'polarity'],
  stages: [
    { kind: 'tour', title: 'Parts for this mission', text: 'Two buzzers that look almost the same but work very differently.', parts: ['active-buzzer', 'passive-buzzer'] },
    { kind: 'teach', title: 'Two buzzers', text: 'The active buzzer has an oscillator inside: give it 5 V and it beeps at its own pitch. The passive buzzer is just the speaker part: it only makes sound when the voltage switches back and forth, which tone(pin, 440) does 440 times a second. Plain 5 V makes it click once.', show: { kind: 'io', component: 'active-buzzer' } },
    { kind: 'hunt', skill: 'sound', gen: huntPool([
      ['Tap the buzzer that beeps on plain 5 V.', ['active-buzzer'], 'Active buzzer: sealed underneath, with a sticker on top.'],
      ['Tap the buzzer that needs tone() to play a note.', ['passive-buzzer'], 'Passive buzzer: you can usually see a small green board underneath.'],
    ]) },
    { kind: 'quiz', skill: 'sound', stage: 'explain', gen: pool([
      (rng) => mk(rng, 'Why does the passive buzzer stay silent with digitalWrite(pin, HIGH)?', 'Steady 5 V doesn’t vibrate it; it needs a switching signal like tone()', 'Sound is vibration; the passive buzzer only vibrates when the voltage keeps changing.',
        [['It needs 9 V', 'It works from 5 V with tone().', 'buzzer-types'], ['It’s broken', 'It just needs the right signal.', 'buzzer-types'], ['It only works on analog pins', 'Any digital pin can use tone().', 'buzzer-types']]),
      (rng) => mk(rng, 'For a doorbell that plays a short tune, which buzzer?', 'The passive buzzer, with tone() at different pitches', 'Only the passive buzzer can change pitch.',
        [['The active buzzer', 'It only has its own fixed pitch.', 'buzzer-types'], ['Either: they’re the same', 'Only one has an oscillator inside.', 'buzzer-types'], ['An LED', 'LEDs don’t make sound.', 'role-confusion']]),
    ]) },
    { kind: 'build', skill: 'sound', recipe: 'buzz', intro: 'The active buzzer’s + leg (longer) faces pin 8. Plug in: it runs the alarm pattern.' },
    { kind: 'code', skill: 'sound', recipe: 'buzz', task: 'Make it urgent: a beep of 150 ms or less with a pause of 150 ms or less, then Upload.', hint: 'Shorter beeps and pauses feel more urgent.',
      check: (s) => (s.how !== 'digitalWrite' ? 'This is the active buzzer: drive it with digitalWrite.' : Number(s.on) <= 150 && Number(s.off) <= 150 ? null : 'Make both the beep and the pause 150 ms or less.') },
    { kind: 'debug', skill: 'sound', recipe: 'buzz', faults: ['passive-dc', 'reversed'] },
    { kind: 'quiz', skill: 'sound', stage: 'transfer', gen: pool([
      (rng) => mk(rng, 'A smoke alarm needs one loud, simple sound. Which buzzer and which code?', 'Active buzzer with digitalWrite HIGH/LOW', 'Simple on/off sound: the active buzzer does it with plain 5 V.',
        [['Passive buzzer with digitalWrite', 'A passive buzzer would only click.', 'buzzer-types'], ['Active buzzer with analogRead', 'analogRead reads inputs; it doesn’t make sound.', 'digital-vs-analog'], ['Passive buzzer with no code', 'It needs a changing signal.', 'buzzer-types']]),
    ]) },
  ],
};

const M09: Mission = {
  id: 'm09', n: 9, title: 'Motion output', goal: 'Command a servo to exact angles, with power and signal wired the right way.',
  exit: 'Explain signal, power and ground, and why a motor can’t be treated like an LED.',
  prereq: ['m05'], components: ['servo', 'uno'], skills: ['motion'],
  stages: [
    { kind: 'tour', title: 'Parts for this mission', text: 'A motor that turns to exactly the angle you choose.', parts: ['servo'] },
    { kind: 'teach', title: 'Three wires, three jobs', text: 'Brown is ground, red is +5 V power for the motor, orange is the signal. The signal is a pulse every 20 ms: 1 ms long means 0°, 2 ms means 180°. A little circuit inside compares the arm’s position with the pulse and drives the motor until they match.', show: { kind: 'io', component: 'servo' } },
    { kind: 'hunt', skill: 'motion', gen: hunt('Tap the part that turns to an exact angle.', ['servo'], 'The SG90 micro servo, with its arms in a bag.') },
    { kind: 'quiz', skill: 'motion', stage: 'explain', gen: pool([
      (rng) => mk(rng, 'Why can’t you power the servo’s red wire from a signal pin like an LED?', 'A motor needs far more current than a pin can give (about 20 mA)', 'Pins are for signals. The motor’s power comes from the 5 V supply.',
        [['It needs 9 V', 'The SG90 runs on 5 V.', 'motor-on-pin'], ['Pins only give 3.3 V', 'UNO pins give 5 V, but only a little current.', 'motor-on-pin'], ['You can: it works fine', 'It may twitch, reset the UNO, or damage the pin.', 'motor-on-pin']]),
      (rng) => mk(rng, 'What does the orange wire carry?', 'The signal: a pulse whose length sets the angle', 'Orange is the control signal; red and brown are power.',
        [['The motor’s power', 'That’s the red wire.', 'servo-wires'], ['Ground', 'That’s the brown wire.', 'servo-wires'], ['The angle as a voltage from 0 to 5 V', 'It’s the pulse length that matters, not a steady voltage.', 'servo-signal']]),
    ]) },
    { kind: 'build', skill: 'motion', recipe: 'servo', intro: 'The servo plug takes three male jumper pins; brown to −, red to +, orange to pin 9.' },
    { kind: 'code', skill: 'motion', recipe: 'servo', task: 'Make the arm swing all the way: from 0° to 180°, then Upload and watch.', hint: 'Set the two angles.',
      check: (s) => (Math.min(Number(s.a1), Number(s.a2)) === 0 && Math.max(Number(s.a1), Number(s.a2)) === 180 ? null : 'One angle should be 0 and the other 180.') },
    { kind: 'debug', skill: 'motion', recipe: 'servo', faults: ['powerpin', 'sigpin'] },
    { kind: 'quiz', skill: 'motion', stage: 'transfer', gen: pool([
      (rng) => mk(rng, 'A model car uses a servo for steering. What does servo.write(90) most likely do?', 'Points the wheels straight ahead (the middle of 0–180°)', '90° is the middle of the servo’s range.',
        [['Spins the wheels at 90 km/h', 'A servo sets an angle, not a speed.', 'servo-signal'], ['Turns fully left', 'That would be one end, 0° or 180°.', 'servo-signal'], ['Turns 90 full circles', 'It moves to an angle and holds.', 'servo-signal']]),
    ]) },
  ],
};

const M10: Mission = {
  id: 'm10', n: 10, title: 'Echo ranger', goal: 'Turn a round-trip echo time into a distance, and sound an alarm when something is close.',
  exit: 'Explain the ÷2; tune a threshold; diagnose no echo, a wrong pin, or a false alert.',
  prereq: ['m08'], components: ['ultrasonic', 'active-buzzer', 'uno'], skills: ['echo'],
  maths: [{ label: 'Distance = speed × time', academy: 'prealgebra', chapter: 'rates' }],
  stages: [
    { kind: 'tour', title: 'Parts for this mission', text: 'A sensor that measures distance with sound, like a bat.', parts: ['ultrasonic', 'active-buzzer'] },
    { kind: 'teach', title: 'Seeing with sound', text: 'A 10 µs pulse on Trig makes the sensor send 8 cycles of 40 kHz sound. It bounces off whatever is in front and comes back. Echo stays HIGH for the whole trip, out and back. Sound travels 0.0343 cm every microsecond.', show: { kind: 'io', component: 'ultrasonic' } },
    { kind: 'teach', title: 'Why divide by 2?', text: 'The echo time covers the trip there AND back. For the distance to the object, take half.', show: { kind: 'formula', lines: ['distance = 0.0343 (cm per microsecond) × time ÷ 2 (out and back)', 'Echo 1166 µs: 0.0343 (cm per microsecond) × 1166 (echo microseconds) ≈ 40 (round trip in cm)', '40 (round trip in cm) ÷ 2 (out and back) = 20 (distance in cm)'] } },
    { kind: 'hunt', skill: 'echo', gen: hunt('Tap the part that measures distance.', ['ultrasonic'], 'Two round transducers: one speaks, one listens.') },
    { kind: 'quiz', skill: 'echo', stage: 'predict', gen: pool([
      (rng) => mk(rng, 'An echo returns later than before. Is the object nearer or farther?', 'Farther', 'Longer time → longer round trip → farther away.',
        [['Nearer', 'A near object sends the echo back sooner.', 'echo-direction'], ['The same distance', 'The time changed, so the distance did.', 'echo-direction'], ['It depends on the buzzer', 'The buzzer doesn’t affect the echo.', 'role-confusion']]),
      (rng) => { const cm = rng.pick([10, 20, 30, 50, 100]); const us = Math.round((cm * 2) / 0.0343);
        return mk(rng, `Echo stays HIGH for ${us} µs. About how far away is the object?`, `${cm} cm`, `0.0343 (cm per microsecond) × ${us} (echo microseconds) ≈ ${(0.0343 * us).toFixed(0)} (round trip in cm); ÷ 2 (out and back) ≈ ${cm} (distance in cm).`,
          [[`${cm * 2} cm`, 'That’s the round trip: divide by 2.', 'round-trip'], [`${Math.round(cm / 2)} cm`, 'Divide by 2 once, not twice.', 'round-trip'], [`${us} cm`, 'Microseconds aren’t centimetres: multiply by 0.0343 first.', 'units']], { kind: 'formula', lines: ['distance = 0.0343 (cm per microsecond) × time ÷ 2 (out and back)'] }); },
    ]) },
    { kind: 'build', skill: 'echo', recipe: 'echo', intro: 'Sensor pins: VCC to +, Trig to pin 12, Echo to pin 11, GND to −. The alarm buzzer on pin 8.' },
    { kind: 'observe', skill: 'echo', recipe: 'echo', control: 'distance',
      gen: (rng) => mk(rng, 'Predict: the alarm threshold is 30 cm. When will the buzzer sound?', 'When something comes closer than 30 cm', 'The code sounds it when cm < 30.', [['When something is farther than 30 cm', 'The comparison is “less than”.', 'code-reading'], ['All the time', 'Only below the threshold.', 'threshold'], ['Only exactly at 30 cm', '“Less than” covers everything closer.', 'code-reading']]),
      task: 'Bring your hand closer until the alarm sounds.', goal: (r) => Object.values(r.parts).some((p) => p.sounding), seen: (_r, env, serial) => `${env.distanceCm} cm away · ${serial[serial.length - 1] ?? ''}` },
    { kind: 'code', skill: 'echo', recipe: 'echo', task: 'A parking helper should only warn within 50 cm. Tune the threshold, then Upload.', hint: 'Change the alarm distance.',
      check: (s) => (Number(s.div) !== 2 ? 'Keep the ÷ 2: the echo is a round trip.' : Number(s.near) === 50 ? null : 'Set the alarm distance to 50 cm.') },
    { kind: 'debug', skill: 'echo', recipe: 'echo', faults: ['swap', 'nohalf', 'threshold'] },
    { kind: 'quiz', skill: 'echo', stage: 'transfer', gen: pool([
      (rng) => mk(rng, 'A bat uses echoes too. If a bat hears its echo after 0.02 s and sound goes 343 m/s, how far is the moth?', 'About 3.4 m', '343 (metres per second) × 0.02 (seconds) = 6.86 (round trip in metres); ÷ 2 (out and back) = 3.43 (distance in metres).',
        [['About 6.9 m', 'That’s there and back.', 'round-trip'], ['About 17 m', 'Multiply, then halve: 343 (metres per second) × 0.02 (seconds) ÷ 2 (out and back).', 'units'], ['About 0.02 m', 'That’s the time, not the distance.', 'units']]),
    ]) },
  ],
};

const BOSS: Mission = {
  id: 'boss', n: 11, title: 'Boss quest: invent from this kit', goal: 'Build a device that notices an approaching person (or light, or heat) and responds.',
  exit: 'Choose sensor, controller, output and power; predict; test at two conditions; record one failure and fix.',
  prereq: ['m06', 'm09', 'm10'], components: ['ultrasonic', 'photoresistor', 'thermistor', 'uno', 'active-buzzer', 'led', 'servo'], skills: ['design', 'roles'],
  stages: [
    { kind: 'teach', title: 'Your challenge', text: 'Design a device that notices someone (or something) coming and responds. You choose the sensor, the output and the threshold. Draw the block diagram, predict what it will do, then test it at two different conditions. Record one thing that went wrong and how you fixed it. A model answer unlocks after you submit.' },
    { kind: 'invent' },
  ],
};

export const MISSIONS: Mission[] = [M01, M02, M03, M04, M05, M06, M07, M08, M09, M10, BOSS];
export const missionById = (id: string) => MISSIONS.find((m) => m.id === id);

/** The mastery checks a skill needs: every (skill, stage) pair that appears in any mission. */
export function requiredChecks(): Record<string, MasteryStage[]> {
  const out: Record<string, Set<MasteryStage>> = {};
  const add = (skill: string, st: MasteryStage) => (out[skill] ??= new Set()).add(st);
  for (const m of MISSIONS) for (const s of m.stages) {
    if (s.kind === 'hunt') add(s.skill, 'recognize');
    else if (s.kind === 'quiz') add(s.skill, s.stage);
    else if (s.kind === 'sort') add(s.skill, 'explain');
    else if (s.kind === 'strips') add(s.skill, 'recognize');
    else if (s.kind === 'build' || s.kind === 'code') add(s.skill, 'apply');
    else if (s.kind === 'observe') add(s.skill, 'predict');
    else if (s.kind === 'debug') add(s.skill, 'debug');
    else if (s.kind === 'invent') { add('design', 'apply'); add('design', 'transfer'); }
  }
  return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, [...v]]));
}
/** The mastery stage a stage records. */
export function stageMastery(s: Stage): { skill: string; stage: MasteryStage } | null {
  switch (s.kind) {
    case 'hunt': case 'strips': return { skill: s.skill, stage: 'recognize' };
    case 'quiz': return { skill: s.skill, stage: s.stage };
    case 'sort': return { skill: s.skill, stage: 'explain' };
    case 'build': case 'code': return { skill: s.skill, stage: 'apply' };
    case 'observe': return { skill: s.skill, stage: 'predict' };
    case 'debug': return { skill: s.skill, stage: 'debug' };
    case 'invent': return { skill: 'design', stage: 'transfer' };
    default: return null;
  }
}
