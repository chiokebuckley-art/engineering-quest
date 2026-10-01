/**
 * Plain-language teaching for Reality Quest: first meetings with each part (shown before any question asks
 * about it) and a glossary for every technical word the missions use. Written for a young beginner: one idea
 * per sentence, an everyday comparison, and no word used before it is explained.
 */

export type Job = 'input' | 'controller' | 'output' | 'support';
export const JOB_LABEL: Record<Job, { name: string; does: string }> = {
  input: { name: 'Input', does: 'It senses something and tells the UNO.' },
  controller: { name: 'Controller', does: 'It decides what to do.' },
  output: { name: 'Output', does: 'It does something you can see, hear or feel.' },
  support: { name: 'Support', does: 'It connects or powers the other parts.' },
};

export interface PartIntro { job: Job; plain: string; like: string; look: string }

/** First meeting with a part: what it does in plain words, what it is like, and how to spot it. */
export const PART_INTRO: Record<string, PartIntro> = {
  uno: { job: 'controller', plain: 'The brain of every build. It runs the program you write: it reads the inputs, decides what to do, and turns the outputs on and off.', like: 'Like your brain deciding to pull your hand away from something hot.', look: 'A blue board with rows of black sockets along the edges and a big USB socket.' },
  breadboard: { job: 'support', plain: 'A board full of holes for building circuits without glue or solder. Hidden metal strips under the holes join some holes together, so parts pushed into joined holes are connected.', like: 'Like a LEGO baseplate for electronics: push parts in, pull them out, try again.', look: 'A long white board covered in tiny holes, with red and blue lines along the edges.' },
  jumpers: { job: 'support', plain: 'Short wires with a pin on each end. They carry electricity from one hole to another.', like: 'Like roads between houses.', look: 'A bundle of coloured wires.' },
  'fm-wires': { job: 'support', plain: 'Wires with a pin on one end and a socket on the other. They plug onto a module’s pins, so the module can sit away from the breadboard.', like: 'Like an extension lead.', look: 'A ribbon of coloured wires with little black sockets on one end.' },
  'usb-cable': { job: 'support', plain: 'Plugs the UNO into a computer. It brings power to the board and carries your program into it.', like: 'Like a charging cable that also delivers messages.', look: 'A cable with a flat plug on one end and a square plug on the other.' },
  resistor: { job: 'support', plain: 'Slows down the flow of electricity so a part like an LED gets just enough and doesn’t burn out. Its coloured stripes tell you how strongly it slows the flow.', like: 'Like a narrow pipe that only lets a little water through.', look: 'A tiny tan tube with coloured stripes and a wire out of each end.' },
  led: { job: 'output', plain: 'A tiny light. It glows when electricity flows through it, but only one way round: into the long leg and out of the short leg.', like: 'Like a one-way door that lights up when you walk through.', look: 'A small coloured bulb with two legs, one longer than the other.' },
  'rgb-led': { job: 'output', plain: 'Three tiny lights (red, green and blue) in one bulb. Mix them to make other colours.', like: 'Like mixing paint colours, but with light.', look: 'A cloudy bulb with four legs.' },
  button: { job: 'input', plain: 'Press it and it joins two wires together; let go and they come apart. That tells the UNO “someone pressed me!”', like: 'Like a doorbell button.', look: 'A small black square with a round top and four legs.' },
  potentiometer: { job: 'input', plain: 'A knob you turn. As you turn it, it lets through a little or a lot of voltage, so the UNO can tell how far it is turned.', like: 'Like the volume knob on a speaker.', look: 'A round knob on a small base with three legs.' },
  photoresistor: { job: 'input', plain: 'Senses light. In bright light electricity passes through it easily; in the dark, hardly at all.', like: 'Like an eye that can only tell bright from dark.', look: 'A tiny disc with a wiggly line on its face and two legs.' },
  thermistor: { job: 'input', plain: 'Senses heat. The warmer it gets, the more easily electricity passes through it.', like: 'Like a thermometer that gives no numbers, just more or less.', look: 'A small black bead on two legs.' },
  dht11: { job: 'input', plain: 'A little blue box that measures how warm the air is and how damp it is (the humidity), and sends both to the UNO as numbers.', like: 'Like a tiny weather station.', look: 'A blue box with holes in the front and three or four pins.' },
  ultrasonic: { job: 'input', plain: 'Measures how far away something is. One “eye” sends out a squeak too high for people to hear; the other listens for the echo. The longer the echo takes to come back, the farther away the thing is.', like: 'Like a bat finding its way in the dark.', look: 'A blue board with two silver “eyes” and four pins.' },
  'active-buzzer': { job: 'output', plain: 'Beeps as soon as it gets power. It has its own beeping circuit inside, so it only knows one sound.', like: 'Like the beep of a smoke alarm.', look: 'A small black cylinder with a sticker on top.' },
  'passive-buzzer': { job: 'output', plain: 'A tiny speaker. It only makes sound when the UNO switches the power on and off very fast, and it can play different notes.', like: 'Like the speaker in a toy keyboard.', look: 'A small black cylinder with a green circuit board showing underneath.' },
  servo: { job: 'output', plain: 'A small motor that turns its arm to exactly the angle you choose, like 0°, 90° or 180°, and holds it there.', like: 'Like the arm of a railway crossing gate.', look: 'A small blue box with a white arm on top and a three-coloured wire.' },
};

/* ---------------- glossary ---------------- */

export interface Term { key: string; re: string; flags?: string; def: string }
/**
 * Every technical word the lessons use, in plain words. `re` is matched on word boundaries; longer terms are
 * tried first so “INPUT_PULLUP” wins over “INPUT”.
 */
export const GLOSSARY: Term[] = [
  // electricity
  { key: 'voltage', re: 'voltages?|volts?', flags: 'i', def: 'How hard electricity is being pushed. More volts, more push. The UNO gives 5 volts (5 V).' },
  { key: 'V', re: '\\d+(?:\\.\\d+)?\\s?V', def: 'V means volts: how hard electricity is pushed. 5 V is the UNO’s power; 0 V is ground.' },
  { key: 'current', re: 'current', flags: 'i', def: 'How much electricity is flowing, like how much water flows through a pipe each second.' },
  { key: 'mA', re: '(?:\\d+(?:\\.\\d+)?\\s?)?mA', def: 'mA (milliamps) measures current. 1000 mA is 1 amp. An LED likes about 10–20 mA.' },
  { key: 'resistance', re: 'resistances?', flags: 'i', def: 'How hard a part makes it for electricity to flow. Measured in ohms (Ω).' },
  { key: 'Ω', re: '(?:\\d+(?:\\.\\d+)?\\s?)?k?Ω|ohms?', def: 'Ω (ohms) measures resistance. kΩ means a thousand ohms, so 10 kΩ is 10,000 Ω.' },
  { key: 'loop', re: 'loops?|closed loop|open loop', flags: 'i', def: 'A complete path for electricity: out of the + side, through the parts, and back to the − side. If there is a gap anywhere, nothing flows.' },
  { key: 'GND', re: 'GND|ground', def: 'Ground: the 0 V side, where electricity returns to finish its loop.' },
  { key: '5V', re: '5V', def: 'The UNO pin that gives out 5 volts of power.' },
  { key: 'series', re: 'in series|series', flags: 'i', def: 'Parts one after another in a single path, so the same current flows through all of them.' },
  { key: 'polarity', re: 'polarity|anode|cathode', flags: 'i', def: 'Which way round a part goes. The anode is the + leg (long leg on an LED); the cathode is the − leg (short leg).' },
  { key: 'divider', re: 'voltage divider|dividers?', flags: 'i', def: 'Two parts in a row between 5 V and ground. They share the 5 V, and the point between them gets a voltage the UNO can read. A sensor changes the share.' },
  { key: 'wiper', re: 'wiper', flags: 'i', def: 'The middle leg of a knob (potentiometer). It slides along inside as you turn, picking up a voltage between 0 V and 5 V.' },
  { key: 'oscillator', re: 'oscillator', flags: 'i', def: 'A tiny circuit that switches on and off by itself very fast, which makes a steady beep.' },
  { key: 'kHz', re: '(?:\\d+\\s?)?k?Hz', def: 'Hz (hertz) means times per second. 40 kHz is 40,000 times a second: far too high for people to hear.' },
  { key: 'pitch', re: 'pitch', flags: 'i', def: 'How high or low a sound is. Faster wiggles make a higher note.' },
  { key: 'µs', re: '\\d+\\s?µs|microseconds?', def: 'µs means microseconds: millionths of a second. 1000 µs is 1 millisecond.' },
  { key: 'ms', re: '\\d+\\s?ms|milliseconds?', def: 'ms means milliseconds: thousandths of a second. 1000 ms is 1 second.' },
  { key: 'humidity', re: 'humidity', flags: 'i', def: 'How much water vapour is in the air: how damp it is.' },
  { key: 'echo', re: 'echoes|echo', def: 'Sound that bounces off something and comes back.' },
  // breadboard
  { key: 'rail', re: 'rails?', flags: 'i', def: 'The long rows along the edges of the breadboard. The red + rail carries power and the blue − rail is ground, all along the board.' },
  { key: 'strip', re: 'strips?', flags: 'i', def: 'A hidden metal strip inside the breadboard. It joins five holes (a–e or f–j) of one column, so anything in those holes is connected.' },
  { key: 'gap', re: 'middle gap', flags: 'i', def: 'The groove down the middle of the breadboard. Holes on opposite sides of it are NOT joined.' },
  // the board and code
  { key: 'UNO', re: 'UNO', def: 'The Arduino UNO: the blue controller board, the “brain” that runs your program.' },
  { key: 'pin', re: 'pins?', flags: 'i', def: 'A numbered socket on the UNO. The program can switch it to 5 V or 0 V, or read what voltage it sees.' },
  { key: 'A0', re: 'A[0-5]', def: 'An analog pin (A0–A5): it can measure any voltage from 0 V to 5 V, not just on or off.' },
  { key: 'USB', re: 'USB', def: 'The cable from the computer: it powers the UNO and carries your program into it.' },
  { key: 'HIGH', re: 'HIGH', def: 'On: the pin is at 5 V.' },
  { key: 'LOW', re: 'LOW', def: 'Off: the pin is at 0 V.' },
  { key: 'INPUT_PULLUP', re: 'INPUT_PULLUP|pull-ups?|pull-downs?', def: 'A setting that connects the pin gently to 5 V inside the UNO, so it reads HIGH until a button pulls it down to 0 V. It stops the pin “floating”.' },
  { key: 'INPUT', re: 'INPUT', def: 'A pin setting: the pin listens (reads a voltage) instead of giving one out.' },
  { key: 'OUTPUT', re: 'OUTPUT', def: 'A pin setting: the pin gives out 5 V or 0 V to power something like an LED.' },
  { key: 'float', re: 'floats?|floating', flags: 'i', def: 'A pin connected to nothing reads random HIGHs and LOWs, like a radio between stations. That is “floating”.' },
  { key: 'digitalRead', re: 'digitalRead(?:\\(\\))?', def: 'A command that asks a pin: are you HIGH or LOW?' },
  { key: 'digitalWrite', re: 'digitalWrite(?:\\(\\))?', def: 'A command that switches a pin HIGH (5 V) or LOW (0 V).' },
  { key: 'analogRead', re: 'analogRead(?:\\(\\))?', def: 'A command that measures the voltage on an A pin and gives a number: 0 for 0 V up to 1023 for 5 V.' },
  { key: 'analogWrite', re: 'analogWrite(?:\\(\\))?', def: 'A command that makes a ~ pin flicker on and off very fast. 0 is always off, 255 is always on, in between is dimmer.' },
  { key: 'PWM', re: 'PWM', def: 'Switching a pin on and off so fast your eyes see it as dimmer or brighter. The ~ pins can do it.' },
  { key: 'pinMode', re: 'pinMode(?:\\(\\))?', def: 'A command that tells a pin whether to listen (INPUT) or to give out power (OUTPUT).' },
  { key: 'delay', re: 'delay\\(\\)', def: 'A command that makes the program wait, in milliseconds.' },
  { key: 'tone', re: 'tone\\(\\)', def: 'A command that wiggles a pin on and off at a chosen speed so a passive buzzer plays that note.' },
  { key: 'readTemperature', re: 'readTemperature\\(\\)', def: 'A command from the DHT library that asks the DHT11 for the temperature.' },
  { key: 'write', re: 'servo\\.write\\(\\d*\\)|write\\(\\)', def: 'A servo command: servo.write(90) turns the arm to 90°.' },
  { key: 'threshold', re: 'thresholds?', flags: 'i', def: 'The dividing line your program uses to decide: “if the reading is below 300, turn the light on”.' },
  { key: 'Serial Monitor', re: 'Serial Monitor', def: 'A window that shows the messages your program prints, so you can see its numbers.' },
  { key: 'upload', re: 'upload(?:ed|ing|s)?', flags: 'i', def: 'Sending your program from the computer into the UNO through the USB cable.' },
  { key: 'sketch', re: 'sketch(?:es)?', flags: 'i', def: 'An Arduino program is called a sketch.' },
  { key: 'signal', re: 'signals?', flags: 'i', def: 'Information carried by a wire, like “pressed” or “turn to 90°”.' },
  { key: 'pulse', re: 'pulses?', flags: 'i', def: 'A quick on-then-off on a wire.' },
  { key: 'module', re: 'modules?', flags: 'i', def: 'A small ready-made board with a sensor and its helper parts already joined up.' },
  { key: 'VCC', re: 'VCC', def: 'The + power pin on a module. It connects to 5 V.' },
  { key: 'Trig', re: 'Trig', def: 'The ultrasonic sensor pin that says “send a squeak now”.' },
  { key: 'Echo', re: 'Echo(?= pin| stays| to)', def: 'The ultrasonic sensor pin that stays HIGH while the sensor waits for the echo to return.' },
  { key: 'DHT11', re: 'DHT11|DHT', def: 'The blue temperature-and-humidity sensor module.' },
  { key: 'SG90', re: 'SG90', def: 'The model name of the small servo motor in your kit.' },
  { key: 'NTC', re: 'NTC|PTC', def: 'NTC: a thermistor whose resistance goes DOWN as it warms (yours). PTC goes up instead.' },
  { key: 'LED', re: 'LEDs?', def: 'Light-emitting diode: a tiny light that only works one way round (long leg to +).' },
  { key: 'input', re: 'inputs?', flags: 'i', def: 'A part that senses something and tells the controller, like a button or a light sensor.' },
  { key: 'output', re: 'outputs?', flags: 'i', def: 'A part that does something you can see, hear or feel, like a light, a buzzer or a motor.' },
  { key: 'controller', re: 'controllers?', flags: 'i', def: 'The part that decides what to do: the UNO running your program.' },
];

const compiled = GLOSSARY.map((t) => ({ t, re: new RegExp(`^(?:${t.re})$`, t.flags ?? '') }));
const ordered = [...GLOSSARY].sort((a, b) => b.re.length - a.re.length);
/**
 * Finds candidate terms (case-insensitive, on word boundaries; a term may start with a digit, as in “5 V”).
 * termFor() then applies each term's own case rule, so “low” is not taken for LOW.
 */
export const GLOSSARY_RE = new RegExp(`(?<![\\w.])(${ordered.map((t) => `(?:${t.re})`).join('|')})(?!\\w)`, 'gi');
export function termFor(text: string): Term | null {
  return compiled.find((c) => c.re.test(text))?.t ?? null;
}
