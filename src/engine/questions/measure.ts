import type { Difficulty, Question, Visual } from '../types';
import type { Rng } from '../rng';
import type { Generator } from './context';
import { nextQuestionId } from './context';
import { lab, labn } from '../label';

/**
 * Measurement, taught as a loop: what are we measuring → which unit → which tool → what does each
 * mark mean → estimate → read → convert → check. Every question is a picture of the tool or the thing.
 *  ruler     — read a metric ruler in mm (numbered marks are cm, small marks are mm); harder: object not at zero
 *  inches    — read a tape between the inch numbers: eighths, then sixteenths
 *  dial      — read a dial (kitchen scale in g, tyre gauge in psi): work out one mark, count from the label below
 *  temp      — read a thermometer, or find the change in temperature
 *  time      — elapsed time between two clock faces, in minutes
 *  estimate  — judge a length against a familiar reference (a door is about 2 m); tolerance applies
 *  convert   — same thing, different unit: linear, square and cubic units drawn as a line, a tiled square, a cube
 *  shape     — around (perimeter) or inside (area)? Fence metres vs tile squares
 *  all       — mixed
 */
export type MeasureKind = 'compare' | 'ruler' | 'inches' | 'dial' | 'temp' | 'time' | 'estimate' | 'convert' | 'shape' | 'all';
export const MEASURE_KINDS: { id: MeasureKind; label: string; short: string }[] = [
  { id: 'all', label: 'Mixed measuring', short: 'Mixed' },
  { id: 'compare', label: 'Longer or shorter?', short: 'Compare' },
  { id: 'ruler', label: 'Read the ruler (mm)', short: 'Ruler' },
  { id: 'inches', label: 'Fractions of an inch', short: 'Inches' },
  { id: 'dial', label: 'Read the dial', short: 'Dial' },
  { id: 'temp', label: 'Thermometer', short: 'Temp' },
  { id: 'time', label: 'Elapsed time', short: 'Time' },
  { id: 'estimate', label: 'Estimate it', short: 'Estimate' },
  { id: 'convert', label: 'Change the unit', short: 'Convert' },
  { id: 'shape', label: 'Around or inside?', short: 'Perimeter/area' },
];

/** The measurement path: the stages of the K–12 sequence, and which are in the game now. */
export const MEASURE_PATH: { stage: string; grades: string; teach: string; inGame: string[] }[] = [
  { stage: 'Compare and count', grades: 'K–1', teach: 'Longer/shorter, heavier/lighter; measure with equal units; start at zero; hours and half-hours.', inGame: ['compare', 'ruler', 'time'] },
  { stage: 'Rulers, tapes and clocks', grades: '2–3', teach: 'cm, m, in, ft; estimate then measure; fractional inches; perimeter vs area; mass and capacity; elapsed time.', inGame: ['inches', 'estimate', 'shape', 'dial', 'volume'] },
  { stage: 'Change the unit', grades: '4–5', teach: 'Conversions within a system; mixed units; angles; decimals and metric prefixes; unit cubes and volume.', inGame: ['convert', 'temp', 'volume'] },
  { stage: 'Rates and circles', grades: '6–7', teach: 'Ratios and rates; US ↔ metric; diameter and circumference; scale drawings; surface area; cylinders; measurement error.', inGame: [] },
  { stage: 'Precision', grades: '8–9', teach: 'Pythagoras; tolerances and fit; calipers; density; speed and flow rate; significant figures.', inGame: [] },
  { stage: 'Build and inspect', grades: '10–12', teach: 'Trigonometry and slope; pipe offsets; force, torque, pressure, power; calibration; drawings and inspection sheets.', inGame: [] },
];

const OBJECTS = ['bolt', 'nail', 'brass pin', 'screw', 'washer stack', 'gear shaft', 'key', 'hinge'];

function make(skillId: string, subtopic: string, prompt: string, expression: string, answer: number, unit: string, difficulty: Difficulty, hint: string, steps: string[], visual: Visual, extra: Partial<Question> = {}): Question {
  return {
    id: nextQuestionId('meas'), masterySkillId: skillId, topic: 'Measurement', subtopic, difficulty, mode: 'applied',
    prompt, expression, answer, unit, hint, solutionSteps: steps, explanation: steps, visual, visualFirst: true, prerequisites: ['add.basic'],
    engineeringApplication: 'Every part that fits, every tank that fills and every pipe that reaches was measured first.', ...extra,
  };
}

/* ---------------- compare (K–1) ---------------- */
export function compareQuestion(a: { label: string; len: number }, b: { label: string; len: number }, mode: 'count' | 'diff', d: Difficulty, skill = 'measure.compare'): Question {
  if (mode === 'count') return make(skill, 'Longer or shorter?', `Each block under the ${a.label} is 1 unit long, laid end to end with no gaps. How many units long is the ${a.label}?`, 'length = ? units', a.len, 'units', d,
    'Count the blocks. They must start at the end and touch each other.', [`Measuring with units means laying equal blocks end to end, starting at one end, with no gaps or overlaps.`, `Count them: ${labn(a.len, `unit along the ${a.label}`, `units along the ${a.label}`)}.`], { type: 'compare', a, b, unit: 'units', units: true });
  const longer = a.len >= b.len ? a : b; const shorter = a.len >= b.len ? b : a;
  return make(skill, 'Longer or shorter?', `The ${a.label} is ${a.len} cm and the ${b.label} is ${b.len} cm. How much longer is the ${longer.label} than the ${shorter.label}?`, `${longer.len} − ${shorter.len} = ?`, longer.len - shorter.len, 'cm', d,
    'Line them up at one end; the extra bit is the difference.', [`Line both up at the same end so you compare fairly.`, `The ${longer.label} sticks out by ${lab(longer.len, `${longer.label} length in cm`)} − ${lab(shorter.len, `${shorter.label} length in cm`)} = ${lab(longer.len - shorter.len, 'difference in cm')}.`], { type: 'compare', a, b, unit: 'cm' });
}

/* ---------------- ruler (mm) ---------------- */
export function rulerQuestion(startMm: number, endMm: number, difficulty: Difficulty, rng: Rng, skillId = 'measure.ruler'): Question {
  const obj = rng.pick(OBJECTS); const len = endMm - startMm; const rulerCm = endMm > 100 ? 15 : 10;
  const cm = (mm: number) => (mm / 10).toFixed(1).replace(/\.0$/, '');
  const whole = Math.floor(endMm / 10);
  const steps = startMm === 0
    ? [`The numbered marks are centimetres. Between them are 10 small marks, so each small mark is 1 mm.`, `The ${obj} starts at 0 and ends at ${cm(endMm)} cm: ${whole} cm and ${endMm % 10} mm.`, ...(endMm % 10 === 0 ? [`${lab(whole, 'whole cm')} × ${lab(10, 'mm in each cm')} = ${lab(len, 'length in mm')}.`] : [`${lab(whole, 'whole cm')} × ${lab(10, 'mm in each cm')} = ${lab(whole * 10, 'mm in the whole cm')}.`, `${lab(whole * 10, 'mm in the whole cm')} + ${lab(endMm % 10, 'extra mm')} = ${lab(len, 'length in mm')}.`])]
    : [`Careful: the ${obj} does not start at 0. Read both ends.`, `Start: ${lab(cm(startMm), 'start in cm')} × ${lab(10, 'mm in each cm')} = ${lab(startMm, 'start in mm')}.`, `End: ${lab(cm(endMm), 'end in cm')} × ${lab(10, 'mm in each cm')} = ${lab(endMm, 'end in mm')}.`, `Length = end − start = ${lab(endMm, 'end in mm')} − ${lab(startMm, 'start in mm')} = ${lab(len, 'length in mm')}.`];
  const prompt = startMm === 0 ? `Read the ruler. How long is the ${obj}, in millimetres?` : `The ${obj} was not lined up at 0. How long is it, in millimetres?`;
  return make(skillId, 'Read the ruler', prompt, difficulty <= 2 ? 'Length = ? mm' : startMm === 0 ? '? mm' : 'end − start = ? mm', len, 'mm', difficulty,
    startMm === 0 ? 'Numbered marks are cm; each small mark is 1 mm.' : 'Read where it starts and where it ends, then subtract.', steps, { type: 'ruler', unit: 'cm', length: rulerCm, start: startMm, end: endMm, label: obj });
}

/* ---------------- inches ---------------- */
export function inchesQuestion(whole: number, num: number, divisions: 8 | 16, difficulty: Difficulty, rng: Rng, skillId = 'measure.inches'): Question {
  const obj = rng.pick(OBJECTS); const name = divisions === 8 ? 'eighths' : 'sixteenths';
  const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
  const g = gcd(num, divisions); const simple = g > 1 ? `, and ${lab(`${num}/${divisions}`, 'inch')} = ${lab(`${num / g}/${divisions / g}`, 'inch')}` : '';
  const steps = [
    `Between one inch number and the next there are ${lab(divisions, 'spaces per inch')}, so each mark is ${lab(`1/${divisions}`, 'inch')}.`,
    `The ${obj} ends past the ${whole} inch mark. Count marks past it: ${labn(num, 'mark')}.`,
    `So it is ${whole} and ${num}/${divisions} in: ${labn(whole, 'whole inch', 'whole inches')} and ${lab(`${num}/${divisions}`, 'inch')}${simple}.`,
  ];
  return make(skillId, 'Fractions of an inch', `Read the tape. The ${obj} ends between ${whole} and ${whole + 1} inches. How many ${name} past the ${whole} inch mark?`, `${whole} and ?/${divisions} in`, num, name, difficulty,
    `Each small space is ${lab(`1/${divisions}`, 'inch')}. Count the marks past ${labn(whole, 'whole inch', 'whole inches')}.`, steps, { type: 'ruler', unit: 'in', length: 3, start: 0, end: whole * divisions + num, divisions, label: obj });
}

/* ---------------- dial ---------------- */
const DIALS: { max: number; major: number; divisions: number; unit: string; what: string; things: string[] }[] = [
  { max: 200, major: 50, divisions: 5, unit: 'g', what: 'kitchen scale', things: ['flour', 'sugar', 'a handful of bolts', 'sand'] },
  { max: 500, major: 100, divisions: 4, unit: 'g', what: 'kitchen scale', things: ['rice', 'gravel', 'a bag of washers', 'clay'] },
  { max: 1000, major: 100, divisions: 5, unit: 'g', what: 'kitchen scale', things: ['a brick', 'a jar of nails', 'a gear', 'a bag of ore'] },
  { max: 60, major: 10, divisions: 5, unit: 'psi', what: 'tyre gauge', things: ['the front tyre', 'the wheelbarrow tyre', 'the bike tyre'] },
  { max: 100, major: 20, divisions: 4, unit: 'psi', what: 'pressure gauge', things: ['the air tank', 'the water line', 'the pump'] },
];
export function dialQuestion(dial: (typeof DIALS)[number], value: number, difficulty: Difficulty, rng: Rng, skillId = 'measure.dial'): Question {
  const thing = rng.pick(dial.things); const step = dial.major / dial.divisions;
  const below = Math.floor(value / dial.major) * dial.major; const marks = Math.round((value - below) / step);
  const u = dial.unit; const reading = u === 'g' ? 'mass in g' : 'pressure in psi';
  const steps = [
    `Labels go up by ${dial.major} ${u} with ${dial.divisions} spaces between, so one mark is ${lab(dial.major, `${u} between labels`)} ÷ ${lab(dial.divisions, 'spaces')} = ${lab(step, `${u} per mark`)}.`,
    marks === 0 ? `The needle points straight at the ${below} label: ${lab(value, reading)}.` : `The needle is ${marks} mark${marks === 1 ? '' : 's'} past the ${below} label: ${lab(below, `${u} at the label`)} + ${labn(marks, 'mark')} × ${lab(step, `${u} per mark`)} = ${lab(value, reading)}.`,
  ];
  return make(skillId, 'Read the dial', `Read the ${dial.what}. ${dial.unit === 'g' ? `What is the mass of ${thing}` : `What is the pressure in ${thing}`}, in ${dial.unit}?`, `? ${dial.unit}`, value, dial.unit, difficulty,
    'What is one mark worth? Then count marks from the label below the needle.', steps, { type: 'dial', max: dial.max, major: dial.major, divisions: dial.divisions, value, unit: dial.unit });
}

/* ---------------- thermometer ---------------- */
export function tempQuestion(reading: number, from: number | null, difficulty: Difficulty, rng: Rng, skillId = 'measure.temp'): Question {
  const scale = { min: 0, max: 50, major: 10, divisions: 5 };
  const thing = rng.pick(['the workshop', 'the water tank', 'the greenhouse', 'the engine bay', 'the cold store']);
  if (from === null) {
    const below = Math.floor(reading / scale.major) * scale.major; const marks = (reading - below) / 2;
    const perMark = `${lab(10, 'degrees between labels')} ÷ ${lab(5, 'spaces')} = ${lab(2, 'degrees per mark')}`;
    return make(skillId, 'Thermometer', `Read the thermometer in ${thing}. What is the temperature, in °C?`, '? °C', reading, '°C', difficulty, `Labels every 10 °C with 5 spaces: ${perMark}.`,
      [`Labels go up by 10 °C with 5 spaces between, so ${perMark}.`, marks === 0 ? `The top of the red line sits on the ${below} label: ${lab(reading, 'temperature in degrees C')}.` : `The line is ${marks} mark${marks === 1 ? '' : 's'} above the ${below} label: ${lab(below, 'degrees at the label')} + ${labn(marks, 'mark')} × ${lab(2, 'degrees per mark')} = ${lab(reading, 'temperature in degrees C')}.`], { type: 'thermometer', ...scale, value: reading, unit: '°C' });
  }
  const change = reading - from;
  return make(skillId, 'Thermometer', `This morning ${thing} was ${from} °C. Read the thermometer now. By how many degrees did it ${change >= 0 ? 'rise' : 'fall'}?`, `now − ${from} = ?`, Math.abs(change), '°C', difficulty,
    'Read the thermometer first, then subtract the morning temperature.',
    [`Each mark is 2 °C. The thermometer now reads ${reading} °C.`, `A change is a difference: ${labn(reading, 'degree C now', 'degrees C now')} − ${labn(from, 'degree C this morning', 'degrees C this morning')} = ${lab(change, 'change in degrees C')}. It ${change >= 0 ? 'rose' : 'fell'} by ${Math.abs(change)} °C.`, `Temperature and change in temperature are different quantities, even though both use °C.`], { type: 'thermometer', ...scale, value: reading, unit: '°C' });
}

/* ---------------- elapsed time ---------------- */
const hhmm = (m: number) => { const h = Math.floor(m / 60) % 12 || 12; return `${h}:${String(m % 60).padStart(2, '0')}`; };
export function timeQuestion(start: number, end: number, difficulty: Difficulty, rng: Rng, skillId = 'measure.time'): Question {
  const thing = rng.pick(['the pump', 'the kiln', 'the mixer', 'the charger', 'the test run']);
  const total = end - start; const nextHour = Math.ceil(start / 60) * 60; const lastHour = Math.floor(end / 60) * 60;
  const Thing = thing[0].toUpperCase() + thing.slice(1);
  let steps: string[];
  if (Math.floor(start / 60) === Math.floor(end / 60)) {
    steps = [`Both times are in the same hour, so subtract the minutes: ${lab(end % 60, 'end minutes')} − ${lab(start % 60, 'start minutes')} = ${lab(total, 'minutes running')}.`, `${Thing} ran for ${total} minutes.`];
  } else {
    // Count up: to the next o'clock, then whole hours, then on to the end time. Each leg is only shown when it is there.
    const legs: { text: string; n: number; label: string }[] = [];
    if (nextHour > start) legs.push({ text: `${hhmm(start)} → ${hhmm(nextHour)} is ${nextHour - start} minutes.`, n: nextHour - start, label: 'minutes to the hour' });
    if (lastHour > nextHour) { const h = (lastHour - nextHour) / 60; legs.push({ text: `${hhmm(nextHour)} → ${hhmm(lastHour)} is ${labn(h, 'hour')} × ${lab(60, 'minutes in an hour')} = ${lab(h * 60, 'minutes')}.`, n: h * 60, label: 'minutes of whole hours' }); }
    if (end > lastHour) legs.push({ text: `${hhmm(lastHour)} → ${hhmm(end)} is ${end - lastHour} minutes.`, n: end - lastHour, label: 'minutes after the hour' });
    steps = legs.map((l, i) => (i === 0 ? `Count the distance, like subtraction: ${l.text}` : l.text));
    steps.push(legs.length > 1 ? `${legs.map((l) => lab(l.n, l.label)).join(' + ')} = ${lab(total, 'minutes running')}.` : `Total: ${lab(total, 'minutes running')}.`);
  }
  return make(skillId, 'Elapsed time', `${Thing} started at the first clock and stopped at the second. How many minutes did it run?`, 'end − start = ? min', total, 'min', difficulty,
    'Count up to the next hour, then on to the end time.', steps, { type: 'clocks', start, end });
}

/* ---------------- estimate ---------------- */
const REFS: { name: string; size: number; unit: 'cm' | 'm' }[] = [
  { name: 'a door', size: 2, unit: 'm' }, { name: 'a bed', size: 2, unit: 'm' }, { name: 'a car', size: 4, unit: 'm' }, { name: 'a bus', size: 12, unit: 'm' },
  { name: 'a pencil', size: 18, unit: 'cm' }, { name: 'a water bottle', size: 22, unit: 'cm' }, { name: 'a sheet of paper', size: 30, unit: 'cm' }, { name: 'a coin', size: 2, unit: 'cm' }, { name: 'a brick', size: 20, unit: 'cm' },
];
const TARGETS = ['plank', 'pipe', 'rope', 'beam', 'cable', 'rail', 'strip of tape', 'steel bar'];
export function estimateQuestion(ref: (typeof REFS)[number], target: number, difficulty: Difficulty, rng: Rng, skillId = 'measure.estimate'): Question {
  const t = rng.pick(TARGETS); const ratio = target / ref.size; const tol = Math.max(1, Math.round(target * 0.2));
  const ratioText = ratio >= 1 ? `about ${Number.isInteger(ratio) ? ratio : ratio.toFixed(1)} times` : `about ${ratio.toFixed(2).replace(/0$/, '')} of`;
  return make(skillId, 'Estimate it', `${ref.name[0].toUpperCase() + ref.name.slice(1)} is about ${ref.size} ${ref.unit} long. About how long is the ${t}? Estimate; close counts.`, `≈ ? ${ref.unit}`, target, ref.unit, difficulty,
    'Compare: how many of the top bar fit along the bottom one?',
    [ratio === 1 ? `Use the reference. The ${t} is about as long as ${ref.name}.` : `Use the reference. The ${t} is ${ratioText} the length of ${ref.name}.`, `${lab(Number.isInteger(ratio) ? ratio : ratio >= 1 ? ratio.toFixed(1) : ratio.toFixed(2).replace(/0$/, ''), ratio === 1 ? 'same length' : ratio > 1 ? 'times as long' : 'of the reference')} × ${lab(ref.size, `${ref.name.replace(/^an? /, '')} length in ${ref.unit}`)} ≈ ${lab(target, `${t} length in ${ref.unit}`)}.`, `An estimate does not have to be exact: anything from ${target - tol} to ${target + tol} ${ref.unit} counts. Always estimate before you measure, so a wrong reading looks wrong.`],
    { type: 'refbar', ref: ref.size, refLabel: `${ref.name}: ${ref.size} ${ref.unit}`, target, targetLabel: t, unit: ref.unit }, { tolerance: tol });
}

/* ---------------- convert ---------------- */
interface Conv { big: string; small: string; n: number; dims: 1 | 2 | 3; quantity: string; min: Difficulty }
const CONVS: Conv[] = [
  { big: 'cm', small: 'mm', n: 10, dims: 1, quantity: 'length', min: 1 }, { big: 'm', small: 'cm', n: 100, dims: 1, quantity: 'length', min: 1 }, { big: 'km', small: 'm', n: 1000, dims: 1, quantity: 'length', min: 2 },
  { big: 'ft', small: 'in', n: 12, dims: 1, quantity: 'length', min: 1 }, { big: 'yd', small: 'ft', n: 3, dims: 1, quantity: 'length', min: 1 }, { big: 'yd', small: 'in', n: 36, dims: 1, quantity: 'length', min: 3 }, { big: 'mi', small: 'ft', n: 5280, dims: 1, quantity: 'length', min: 5 },
  { big: 'kg', small: 'g', n: 1000, dims: 1, quantity: 'mass', min: 2 }, { big: 'lb', small: 'oz', n: 16, dims: 1, quantity: 'weight', min: 3 }, { big: 't', small: 'kg', n: 1000, dims: 1, quantity: 'mass', min: 4 },
  { big: 'L', small: 'mL', n: 1000, dims: 1, quantity: 'capacity', min: 2 }, { big: 'gal', small: 'qt', n: 4, dims: 1, quantity: 'capacity', min: 1 }, { big: 'qt', small: 'pt', n: 2, dims: 1, quantity: 'capacity', min: 1 }, { big: 'pt', small: 'cups', n: 2, dims: 1, quantity: 'capacity', min: 1 }, { big: 'gal', small: 'cups', n: 16, dims: 1, quantity: 'capacity', min: 3 }, { big: 'cup', small: 'fl oz', n: 8, dims: 1, quantity: 'capacity', min: 2 },
  { big: 'h', small: 'min', n: 60, dims: 1, quantity: 'time', min: 1 }, { big: 'min', small: 's', n: 60, dims: 1, quantity: 'time', min: 1 }, { big: 'day', small: 'h', n: 24, dims: 1, quantity: 'time', min: 2 }, { big: 'week', small: 'days', n: 7, dims: 1, quantity: 'time', min: 1 },
  { big: 'ft²', small: 'in²', n: 144, dims: 2, quantity: 'area', min: 4 }, { big: 'yd²', small: 'ft²', n: 9, dims: 2, quantity: 'area', min: 3 }, { big: 'm²', small: 'cm²', n: 10000, dims: 2, quantity: 'area', min: 4 }, { big: 'cm²', small: 'mm²', n: 100, dims: 2, quantity: 'area', min: 3 },
  { big: 'ft³', small: 'in³', n: 1728, dims: 3, quantity: 'volume', min: 5 }, { big: 'yd³', small: 'ft³', n: 27, dims: 3, quantity: 'volume', min: 4 }, { big: 'cm³', small: 'mm³', n: 1000, dims: 3, quantity: 'volume', min: 4 },
];
export const CONVERSIONS = CONVS;
const root = (c: Conv) => Math.round(Math.pow(c.n, 1 / c.dims));
/** Unit words for labels. Metric symbols read well in a label ("length in cm"); US and time units are spelled out ("inches in each foot"). */
const UNIT_WORDS: Record<string, [string, string]> = {
  in: ['inch', 'inches'], ft: ['foot', 'feet'], yd: ['yard', 'yards'], mi: ['mile', 'miles'], lb: ['pound', 'pounds'], oz: ['ounce', 'ounces'],
  gal: ['gallon', 'gallons'], qt: ['quart', 'quarts'], pt: ['pint', 'pints'], cup: ['cup', 'cups'], cups: ['cup', 'cups'], 'fl oz': ['fluid ounce', 'fluid ounces'],
  h: ['hour', 'hours'], min: ['minute', 'minutes'], s: ['second', 'seconds'], day: ['day', 'days'], days: ['day', 'days'], week: ['week', 'weeks'], t: ['tonne', 'tonnes'],
  'in²': ['square inch', 'square inches'], 'ft²': ['square foot', 'square feet'], 'yd²': ['square yard', 'square yards'],
  'in³': ['cubic inch', 'cubic inches'], 'ft³': ['cubic foot', 'cubic feet'], 'yd³': ['cubic yard', 'cubic yards'],
};
const uOne = (u: string) => UNIT_WORDS[u]?.[0] ?? u;
const uMany = (u: string) => UNIT_WORDS[u]?.[1] ?? u;
export function convertQuestion(c: Conv, count: number, toSmall: boolean, difficulty: Difficulty, skillId = 'measure.convert'): Question {
  const r = root(c); const side = uMany(c.small.replace(/[²³]/, '')); const each = `${uMany(c.small)} in each ${uOne(c.big)}`;
  const base = c.dims === 1 ? `1 ${c.big} = ${c.n} ${c.small}` : c.dims === 2 ? `1 ${c.big} is ${lab(r, `${side} long`)} × ${lab(r, `${side} wide`)} = ${lab(c.n, each)}` : `1 ${c.big} is ${lab(r, `${side} long`)} × ${lab(r, `${side} wide`)} × ${lab(r, `${side} high`)} = ${lab(c.n, each)}`;
  const bigs = uMany(c.big);
  const lin = c.dims > 1 ? `The linear fact is 1 ${c.big.replace(/[²³]/, '')} = ${r} ${c.small.replace(/[²³]/, '')}; a ${c.dims === 2 ? 'square' : 'cube'} needs it ${c.dims === 2 ? 'twice' : 'three times'}.` : '';
  const answer = toSmall ? count * c.n : count;
  const steps = toSmall
    ? [`${base}.${lin ? ' ' + lin : ''}`, `${lab(count, `${c.quantity} in ${bigs}`)} × ${lab(c.n, each)} = ${lab(answer, `${c.quantity} in ${uMany(c.small)}`)}.`, `The ${c.quantity} did not change; only the unit did.`]
    : [`${base}.${lin ? ' ' + lin : ''}`, `${lab(count * c.n, `${c.quantity} in ${uMany(c.small)}`)} ÷ ${lab(c.n, each)} = ${lab(answer, `${c.quantity} in ${bigs}`)}.`, `Going to a bigger unit means fewer of them: divide.`];
  const prompt = toSmall ? `${count} ${c.big} is how many ${c.small}?` : `${count * c.n} ${c.small} is how many ${c.big}?`;
  const expr = toSmall ? `${count} ${c.big} = ? ${c.small}` : `${count * c.n} ${c.small} = ? ${c.big}`;
  return make(skillId, 'Change the unit', prompt, expr, answer, toSmall ? c.small : c.big, difficulty, toSmall ? `1 ${c.big} = ${c.n} ${c.small}. Smaller unit, more of them: multiply.` : `1 ${c.big} = ${c.n} ${c.small}. Bigger unit, fewer of them: divide.`, steps,
    { type: 'units', big: c.big, small: c.small, n: c.n, dims: c.dims });
}

/* ---------------- perimeter vs area ---------------- */
export function shapeQuestion(w: number, h: number, ask: 'perimeter' | 'area', difficulty: Difficulty, rng: Rng, skillId = 'measure.shape'): Question {
  const place = rng.pick(['garden', 'yard', 'workshop floor', 'chicken pen', 'patio', 'storeroom']);
  if (ask === 'perimeter') {
    return make(skillId, 'Around or inside?', `A fence goes all the way around this ${place}, ${w} m by ${h} m. How many metres of fence?`, difficulty <= 2 ? `${w} + ${h} + ${w} + ${h} = ?` : 'perimeter = ? m', 2 * (w + h), 'm', difficulty,
      'Around the outside: add all four sides.',
      [`Perimeter is the distance around: it is measured in plain metres, like a piece of string.`, `Two sides of ${w} m and two sides of ${h} m: ${lab(w, 'length in m')} + ${lab(h, 'width in m')} + ${lab(w, 'length in m')} + ${lab(h, 'width in m')} = ${lab(2 * (w + h), 'perimeter in m')}.`, `Shortcut: ${lab(2, 'sides of each size')} × ${lab(w + h, 'length plus width in m')} = ${lab(2 * (w + h), 'perimeter in m')}.`], { type: 'rect', w, h, unit: 'm', ask, grid: difficulty <= 2 });
  }
  return make(skillId, 'Around or inside?', `Square tiles, 1 m on a side, cover this ${place}, ${w} m by ${h} m. How many tiles? (That is the area in m².)`, difficulty <= 2 ? `${w} × ${h} = ?` : 'area = ? m²', w * h, 'm²', difficulty,
    'Inside: rows × columns of squares.',
    [`Area is the space inside, counted in squares: square metres, m².`, `${h} rows of ${w} tiles: ${lab(w, 'length in m')} × ${lab(h, 'width in m')} = ${lab(w * h, 'area in m²')}.`, `Perimeter would be the fence around it: ${lab(2, 'sides of each size')} × ${lab(w + h, 'length plus width in m')} = ${lab(2 * (w + h), 'perimeter in m')}. Different question, different unit.`], { type: 'rect', w, h, unit: 'm', ask, grid: difficulty <= 2 });
}

export function measureQuestion(kind: MeasureKind, difficulty: Difficulty, rng: Rng, skillId?: string): Question {
  const k: Exclude<MeasureKind, 'all'> = kind === 'all' ? rng.pick(['compare', 'ruler', 'inches', 'dial', 'temp', 'time', 'estimate', 'convert', 'shape', 'ruler', 'convert'] as const) : kind;
  const sid = skillId ?? (kind === 'all' ? 'measure' : `measure.${k}`);
  if (k === 'compare') {
    const names = rng.shuffle(['pencil', 'spanner', 'plank', 'ribbon', 'bolt', 'crayon', 'stick', 'strap']);
    if (difficulty <= 1 || (difficulty <= 2 && rng.chance(0.5))) return compareQuestion({ label: names[0], len: rng.int(2, 9) }, { label: names[1], len: rng.int(2, 9) }, 'count', difficulty, sid);
    return compareQuestion({ label: names[0], len: rng.int(3, difficulty <= 3 ? 20 : 60) }, { label: names[1], len: rng.int(3, difficulty <= 3 ? 20 : 60) }, 'diff', difficulty, sid);
  }
  if (k === 'ruler') {
    const maxMm = difficulty <= 3 ? 95 : 145;
    const end = difficulty <= 1 ? rng.int(2, 9) * 10 : difficulty <= 2 ? rng.int(3, 18) * 5 : rng.int(15, maxMm);
    const start = difficulty >= 4 && rng.chance(0.6) ? rng.int(1, Math.floor((maxMm - end) / 5)) * 5 : 0;
    const s = Math.min(start, maxMm - end);
    return rulerQuestion(s, s + end, difficulty, rng, sid);
  }
  if (k === 'inches') {
    const divisions = difficulty <= 2 ? 8 : 16;
    const num = rng.int(1, divisions - 1);
    return inchesQuestion(rng.int(0, 2), num, divisions, difficulty, rng, sid);
  }
  if (k === 'dial') {
    const pool = difficulty <= 2 ? DIALS.slice(0, 2) : difficulty <= 3 ? DIALS.slice(0, 3) : DIALS;
    const d = rng.pick(pool); const step = d.major / d.divisions; const n = d.max / step;
    return dialQuestion(d, rng.int(1, n - 1) * step, difficulty, rng, sid);
  }
  if (k === 'temp') {
    const reading = rng.int(1, 24) * 2;
    if (difficulty <= 2) return tempQuestion(reading, null, difficulty, rng, sid);
    const from = Math.max(0, Math.min(50, reading + (rng.chance(0.6) ? -1 : 1) * rng.int(3, 15)));
    return tempQuestion(reading, from === reading ? reading - 4 : from, difficulty, rng, sid);
  }
  if (k === 'time') {
    const step = difficulty <= 1 ? 30 : difficulty <= 2 ? 15 : 5;
    const start = rng.int(0, 11) * 60 + rng.int(0, 60 / step - 1) * step;
    const dur = difficulty <= 2 ? rng.int(1, 4) * step : rng.int(4, difficulty <= 4 ? 18 : 30) * step;
    return timeQuestion(start, start + dur, difficulty, rng, sid);
  }
  if (k === 'estimate') {
    const ref = rng.pick(REFS);
    const ratio = rng.pick(difficulty <= 2 ? [2, 3, 4, 0.5] : [1.5, 2, 2.5, 3, 4, 5, 0.5, 0.25, 0.75]);
    const target = Math.max(1, Math.round(ref.size * ratio));
    return estimateQuestion(ref, target, difficulty, rng, sid);
  }
  if (k === 'convert') {
    const pool = CONVS.filter((c) => c.min <= difficulty);
    const c = rng.pick(pool); const toSmall = difficulty <= 2 ? true : rng.chance(0.6);
    const count = c.n >= 1000 ? rng.int(1, 9) : c.n >= 100 ? rng.int(1, 12) : rng.int(2, 12);
    return convertQuestion(c, count, toSmall, difficulty, sid);
  }
  const max = difficulty <= 2 ? 6 : difficulty <= 4 ? 12 : 25;
  return shapeQuestion(rng.int(2, max), rng.int(2, Math.min(max, 12)), rng.chance(0.5) ? 'perimeter' : 'area', difficulty, rng, sid);
}

/** Generator: params.kind = ruler | inches | dial | temp | time | estimate | convert | shape | all. */
export const genMeasure: Generator = (skillId, params, ctx) => measureQuestion(String(params?.kind ?? 'all') as MeasureKind, ctx.difficulty, ctx.rng, skillId);
