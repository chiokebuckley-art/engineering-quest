import type { Difficulty, Question } from '../types';
import type { Rng } from '../rng';
import type { Generator } from './context';
import { pictureQuestion, approx, num, r2 } from './picture';
import { lab } from '../label';

/** A unit as label text (labels hold letters only): '°C' → 'degrees'. */
const uw = (unit: string) => (unit === '°C' ? 'degrees' : unit);

/**
 * Precision and fit, the mechanical-tools stage:
 *  caliper    — read a vernier caliper (main scale mm + the vernier line that lines up, 0.1 mm)
 *  micrometer — read a micrometer (sleeve 0.5 mm + thimble 0.01 mm)
 *  tolerance  — nominal ± tolerance: the limits, and how far a part is out
 *  feeler     — a gap is the sum of the blades that fit it
 *  thread     — pitch from threads counted over 10 mm; threads per inch
 *  wrench     — a bolt's thread size and the wrench for its head are different numbers
 *  stackup    — tolerances add up along a stack of parts
 *  error      — absolute and percent error against a known standard
 *  sigfig     — significant figures and scientific notation
 *  runout     — a dial indicator: reading, and runout = highest − lowest
 *  calibrate  — a gauge that reads high or low; the mean of repeated readings
 */
export type FitKind = 'caliper' | 'micrometer' | 'tolerance' | 'feeler' | 'thread' | 'wrench' | 'stackup' | 'error' | 'sigfig' | 'runout' | 'calibrate' | 'all';
export const FIT_KINDS: { id: FitKind; label: string; short: string; desc: string }[] = [
  { id: 'all', label: 'Mixed precision', short: 'Mixed', desc: 'Calipers, micrometers, tolerances, feeler gauges, threads, wrenches, stack-up, error, sig figs, dial indicators, calibration.' },
  { id: 'caliper', label: 'Vernier caliper', short: 'Caliper', desc: 'Main scale to the vernier zero, then the one vernier line that lines up: tenths of a mm.' },
  { id: 'micrometer', label: 'Micrometer', short: 'Micrometer', desc: 'Sleeve in 0.5 mm steps, thimble in 0.01 mm. Add them.' },
  { id: 'tolerance', label: 'Tolerance', short: 'Tolerance', desc: 'Nominal ± tolerance gives two limits. Inside them the part fits.' },
  { id: 'feeler', label: 'Feeler gauges', short: 'Feeler', desc: 'Stack blades until they just fit: the gap is their sum.' },
  { id: 'thread', label: 'Thread pitch', short: 'Thread', desc: 'Pitch = mm from one crest to the next; TPI = threads per inch.' },
  { id: 'wrench', label: 'Bolt vs wrench', short: 'Wrench', desc: 'M8 means an 8 mm thread; its head takes a 13 mm wrench.' },
  { id: 'stackup', label: 'Tolerance stack-up', short: 'Stack-up', desc: 'Four parts at ±0.1 can be off by ±0.4 together.' },
  { id: 'error', label: 'Measurement error', short: 'Error', desc: 'Error = measured − true; percent error = error ÷ true × 100.' },
  { id: 'sigfig', label: 'Significant figures', short: 'Sig figs', desc: 'Round to the digits you can trust; 4.5 × 10⁴ is 45 000.' },
  { id: 'runout', label: 'Dial indicator', short: 'Runout', desc: 'Read 0.01 mm; runout is highest minus lowest as the part turns.' },
  { id: 'calibrate', label: 'Calibration', short: 'Calibrate', desc: 'Check the tool against a known standard; correct by the offset.' },
];

const T = 'Precision & fit';
const mk = (skill: string, sub: string, o: Parameters<typeof pictureQuestion>[4]) => pictureQuestion('fit', T, skill, sub, o);

export function caliperQuestion(value: number, d: Difficulty, rng: Rng, skill = 'fit.caliper'): Question {
  const whole = Math.floor(value); const tenths = Math.round((value - whole) * 10);
  const thing = rng.pick(['bolt', 'shaft', 'bearing', 'pin', 'spacer', 'bore']);
  return mk(skill, 'Vernier caliper', {
    prompt: `Read the caliper measuring this ${thing}, in mm.`, expression: 'main + vernier = ? mm', answer: r2(value), unit: 'mm', difficulty: d, decimal: true,
    hint: 'Main scale: the last mm line before the vernier zero. Vernier: the one line that lines up exactly.',
    steps: [`Main scale: the vernier's 0 has passed the ${whole} mm line, so the reading is ${whole}.something.`, `Vernier: exactly one of its lines sits directly under a main-scale line. That is line ${tenths}, so add ${tenths} tenths: 0.${tenths} mm.`, `${lab(whole, 'main scale, mm')} + ${lab(`0.${tenths}`, 'vernier, mm')} = ${lab(num(value, 1), 'reading, mm')}.`],
    visual: { type: 'caliper', value: r2(value) },
  });
}

export function micrometerQuestion(value: number, d: Difficulty, rng: Rng, skill = 'fit.micrometer'): Question {
  const sleeve = Math.floor(value * 2) / 2; const thimble = Math.round((value - sleeve) * 100);
  const thing = rng.pick(['shim', 'sheet', 'wire', 'washer', 'blade', 'gasket']);
  return mk(skill, 'Micrometer', {
    prompt: `Read the micrometer on this ${thing}, in mm.`, expression: 'sleeve + thimble = ? mm', answer: r2(value), unit: 'mm', difficulty: d, decimal: true,
    hint: 'Sleeve lines are 0.5 mm each (the lower ones are the halves). Thimble lines are 0.01 mm.',
    steps: [`Sleeve: the last line uncovered is ${num(sleeve, 1)} mm${sleeve % 1 ? ' (a half-mm line below the axis)' : ''}.`, `Thimble: the line on the axis reads ${thimble}, which is ${thimble} hundredths: 0.${String(thimble).padStart(2, '0')} mm.`, `${lab(num(sleeve, 1), 'sleeve, mm')} + ${lab(`0.${String(thimble).padStart(2, '0')}`, 'thimble, mm')} = ${lab(num(value, 2), 'reading, mm')}.`],
    visual: { type: 'micrometer', value: r2(value) },
  });
}

export function toleranceQuestion(nominal: number, tol: number, measured: number | null, ask: 'max' | 'min' | 'out', d: Difficulty, rng: Rng, skill = 'fit.tolerance'): Question {
  const thing = rng.pick(['shaft', 'pin', 'bore', 'spacer', 'plate']); const hi = r2(nominal + tol); const lo = r2(nominal - tol);
  if (ask === 'max') return mk(skill, 'Tolerance', { prompt: `A ${thing} is specified ${num(nominal, 2)} mm ± ${num(tol, 2)}. What is the largest size that still passes?`, expression: 'nominal + tol = ?', answer: hi, unit: 'mm', difficulty: d, decimal: true, hint: 'Upper limit = nominal + tolerance.', steps: [`± means the part may be that much bigger or smaller than nominal.`, `Upper limit: ${lab(num(nominal, 2), 'nominal, mm')} + ${lab(num(tol, 2), 'tolerance, mm')} = ${lab(num(hi, 2), 'upper limit, mm')}. Lower limit: ${num(lo, 2)} mm.`], visual: { type: 'fit', nominal, tol, unit: 'mm' } });
  if (ask === 'min') return mk(skill, 'Tolerance', { prompt: `A ${thing} is specified ${num(nominal, 2)} mm ± ${num(tol, 2)}. What is the smallest size that still passes?`, expression: 'nominal − tol = ?', answer: lo, unit: 'mm', difficulty: d, decimal: true, hint: 'Lower limit = nominal − tolerance.', steps: [`Lower limit: ${lab(num(nominal, 2), 'nominal, mm')} − ${lab(num(tol, 2), 'tolerance, mm')} = ${lab(num(lo, 2), 'lower limit, mm')}.`, `Anything from ${num(lo, 2)} to ${num(hi, 2)} mm fits.`], visual: { type: 'fit', nominal, tol, unit: 'mm' } });
  const m = measured!; const out = m > hi ? r2(m - hi) : m < lo ? r2(lo - m) : 0;
  return mk(skill, 'Tolerance', { prompt: `Spec: ${num(nominal, 2)} mm ± ${num(tol, 2)}. The ${thing} measures ${num(m, 2)} mm. By how much is it outside the limits? (0 if it passes)`, expression: 'distance past the nearest limit = ?', answer: out, unit: 'mm', difficulty: d, decimal: true, hint: 'Find both limits first, then see where the measurement sits.', steps: [`Limits: ${num(lo, 2)} to ${num(hi, 2)} mm.`, out === 0 ? `${num(m, 2)} is inside the limits: it passes, so 0.` : m > hi ? `${lab(num(m, 2), 'measured, mm')} − ${lab(num(hi, 2), 'upper limit, mm')} = ${lab(num(out, 2), 'mm too big')}: it will be tight or will not fit.` : `${lab(num(lo, 2), 'lower limit, mm')} − ${lab(num(m, 2), 'measured, mm')} = ${lab(num(out, 2), 'mm too small')}: it will be loose.`], visual: { type: 'fit', nominal, tol, measured: m, unit: 'mm' } });
}

const BLADES = [0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.40, 0.50, 0.60, 0.80, 1.00];
export function feelerQuestion(blades: number[], d: Difficulty, rng: Rng, skill = 'fit.feeler'): Question {
  const gap = r2(blades.reduce((a, b) => a + b, 0)); const thing = rng.pick(['valve clearance', 'spark plug gap', 'bearing end-play', 'gap under the straightedge', 'gap at the guide']);
  return mk(skill, 'Feeler gauges', {
    prompt: `Blades of ${blades.map((b) => num(b, 2)).join(' + ')} mm stacked together just slide into the ${thing} with a slight drag. What is the gap?`, expression: `${blades.map((b) => num(b, 2)).join(' + ')} = ?`, answer: gap, unit: 'mm', difficulty: d, decimal: true,
    hint: 'The gap equals the total thickness of the blades that fit.',
    steps: [`A feeler gauge measures a gap by filling it. Stacked blades add.`, `${blades.map((b) => lab(num(b, 2), 'blade, mm')).join(' + ')} = ${lab(num(gap, 2), 'gap, mm')}.`, `Slight drag means it just fits; if it slides freely the gap is bigger.`],
    visual: { type: 'feeler', blades },
  });
}

const PITCHES: { size: string; pitch: number }[] = [{ size: 'M4', pitch: 0.7 }, { size: 'M5', pitch: 0.8 }, { size: 'M6', pitch: 1.0 }, { size: 'M8', pitch: 1.25 }, { size: 'M10', pitch: 1.5 }, { size: 'M12', pitch: 1.75 }, { size: 'M16', pitch: 2.0 }];
export function threadQuestion(mode: 'pitch' | 'tpi' | 'count', p: number, d: Difficulty, rng: Rng, skill = 'fit.thread'): Question {
  if (mode === 'pitch') { const threads = Math.round(10 / p); return mk(skill, 'Thread pitch', { prompt: `${threads} thread crests fit in ${num(threads * p, 2)} mm along this bolt. What is the pitch (mm from one crest to the next)?`, expression: `${num(threads * p, 2)} ÷ ${threads} = ?`, answer: p, unit: 'mm', difficulty: d, decimal: true, hint: 'Pitch = length ÷ number of threads in it.', steps: [`Pitch is the distance from one crest to the next.`, `${lab(num(threads * p, 2), 'mm of thread')} ÷ ${lab(threads, 'threads')} = ${lab(num(p, 2), 'pitch, mm')}.`, `That is the standard coarse pitch for ${PITCHES.find((x) => x.pitch === p)?.size ?? 'this size'}.`], visual: { type: 'thread', pitch: p, length: threads * p, unit: 'mm' } }); }
  if (mode === 'count') { const len = rng.pick([10, 20, 25]); return mk(skill, 'Thread pitch', { prompt: `A thread has a pitch of ${num(p, 2)} mm. How many crests are there in ${len} mm?`, expression: `${len} ÷ ${num(p, 2)} = ?`, answer: Math.round(len / p), unit: 'threads', difficulty: d, hint: 'Length ÷ pitch.', steps: [`${lab(len, 'mm of thread')} ÷ ${lab(num(p, 2), 'pitch, mm')} = ${lab(num(len / p, 1), 'threads')}.`], visual: { type: 'thread', pitch: p, length: len, unit: 'mm' } }); }
  const tpi = rng.pick([13, 16, 18, 20, 24]); const tenth = tpi;
  return mk(skill, 'Thread pitch', { prompt: `An inch thread shows ${tpi} crests in exactly 1 inch. What is its TPI (threads per inch)?`, expression: 'crests in 1 in = ? TPI', answer: tenth, unit: 'TPI', difficulty: d, hint: 'US threads are counted per inch, not measured in mm.', steps: [`Inch threads are named by threads per inch: ${tpi} crests in 1 in is ${tpi} TPI.`, `The pitch would be 25.4 (mm in an inch) ÷ ${lab(tpi, 'threads per inch')} = ${lab(num(25.4 / tpi, 2), 'pitch, mm')}. A metric pitch gauge will not match it.`], visual: { type: 'thread', pitch: 25.4 / tpi, length: 25.4, unit: 'in' } });
}

export const BOLTS: { size: string; thread: number; flats: number }[] = [{ size: 'M4', thread: 4, flats: 7 }, { size: 'M5', thread: 5, flats: 8 }, { size: 'M6', thread: 6, flats: 10 }, { size: 'M8', thread: 8, flats: 13 }, { size: 'M10', thread: 10, flats: 17 }, { size: 'M12', thread: 12, flats: 19 }, { size: 'M16', thread: 16, flats: 24 }, { size: 'M20', thread: 20, flats: 30 }];
export function wrenchQuestion(b: (typeof BOLTS)[number], ask: 'flats' | 'thread', d: Difficulty, skill = 'fit.wrench'): Question {
  if (ask === 'flats') return mk(skill, 'Bolt vs wrench', { prompt: `An ${b.size} bolt: the thread is ${b.thread} mm across. Measure the head across the flats in the picture. Which wrench size (mm) fits it?`, expression: 'across flats = ? mm', answer: b.flats, unit: 'mm', difficulty: d, hint: 'The wrench size is the head, not the thread.', steps: [`${b.size} names the thread diameter: ${b.thread} mm.`, `The head is measured across its flat sides: ${b.flats} mm. That is the wrench size.`, `Two different measurements on one bolt. Never pick a wrench from the M number.`], visual: { type: 'bolt', thread: b.thread, flats: b.flats, hide: 'thread' } });
  return mk(skill, 'Bolt vs wrench', { prompt: `This bolt head takes a ${b.flats} mm wrench. Measure the thread diameter in the picture. What is the M size number?`, expression: 'thread diameter = M?', answer: b.thread, unit: 'mm', difficulty: d, hint: 'M size = thread diameter in mm, not the head.', steps: [`Read the thread diameter: ${b.thread} mm, so it is ${b.size}.`, `The ${b.flats} mm head is a separate measurement (across flats).`], visual: { type: 'bolt', thread: b.thread, flats: b.flats, hide: 'flats' } });
}

export function stackupQuestion(parts: { nominal: number; tol: number }[], ask: 'tol' | 'max' | 'min', d: Difficulty, skill = 'fit.stackup'): Question {
  const nom = r2(parts.reduce((a, p) => a + p.nominal, 0)); const tol = r2(parts.reduce((a, p) => a + p.tol, 0));
  const desc = parts.map((p) => `${num(p.nominal, 1)} ± ${num(p.tol, 2)}`).join(', ');
  if (ask === 'tol') return mk(skill, 'Tolerance stack-up', { prompt: `${parts.length} spacers are stacked: ${desc} mm. What is the tolerance of the whole stack (± ? mm)?`, expression: parts.map((p) => num(p.tol, 2)).join(' + ') + ' = ±?', answer: tol, unit: 'mm', difficulty: d, decimal: true, hint: 'Worst case: every tolerance adds up in the same direction.', steps: [`Each part can be off by its own tolerance, and in the worst case they all lean the same way.`, `${parts.map((p) => lab(num(p.tol, 2), 'part tolerance, mm')).join(' + ')} = ±${lab(num(tol, 2), 'stack tolerance, mm')} on a stack of ${num(nom, 2)} mm.`, `That is why long stacks need tighter parts, or an adjustable shim.`], visual: { type: 'stack', parts } });
  const v = ask === 'max' ? r2(nom + tol) : r2(nom - tol);
  return mk(skill, 'Tolerance stack-up', { prompt: `Spacers ${desc} mm are stacked. What is the ${ask === 'max' ? 'longest' : 'shortest'} the stack could be?`, expression: `${num(nom, 2)} ${ask === 'max' ? '+' : '−'} ${num(tol, 2)} = ?`, answer: v, unit: 'mm', difficulty: d, decimal: true, hint: 'Add the nominals, add the tolerances, then combine.', steps: [`Nominal total: ${parts.map((p) => num(p.nominal, 1)).join(' + ')} = ${lab(num(nom, 2), 'nominal stack, mm')}.`, `Tolerance total: ±${lab(num(tol, 2), 'stack tolerance, mm')}.`, `${ask === 'max' ? 'Longest' : 'Shortest'}: ${lab(num(nom, 2), 'nominal stack, mm')} ${ask === 'max' ? '+' : '−'} ${lab(num(tol, 2), 'stack tolerance, mm')} = ${lab(num(v, 2), `${ask === 'max' ? 'longest' : 'shortest'} stack, mm`)}.`], visual: { type: 'stack', parts } });
}

export function errorQuestion(trueV: number, measured: number, ask: 'abs' | 'pct', unit: string, d: Difficulty, rng: Rng, skill = 'fit.error'): Question {
  const err = r2(Math.abs(measured - trueV)); const pct = (err / trueV) * 100; const thing = unit === 'g' ? rng.pick(['reference weight', 'calibration mass']) : unit === 'mL' ? rng.pick(['volumetric flask', 'calibrated measure']) : rng.pick(['gauge block', 'calibrated rod']);
  if (ask === 'abs') return mk(skill, 'Measurement error', { prompt: `A ${thing} is exactly ${num(trueV, 2)} ${unit}. Your tool reads ${num(measured, 2)} ${unit}. What is the error (ignore the sign)?`, expression: '|measured − true| = ?', answer: err, unit, difficulty: d, decimal: true, hint: 'Error = measured − true.', steps: [`Error = measured − true = ${lab(num(measured, 2), `reading, ${uw(unit)}`)} − ${lab(num(trueV, 2), `true value, ${uw(unit)}`)} = ${measured >= trueV ? '+' : '−'}${lab(num(err, 2), `error, ${uw(unit)}`)}.`, `The tool reads ${measured >= trueV ? 'high' : 'low'} by ${num(err, 2)} ${unit}.`], visual: { type: 'card', title: 'Known standard', lines: [`true value: ${num(trueV, 2)} ${unit}`, `reading: ${num(measured, 2)} ${unit}`] } });
  const a = approx(pct, 1);
  return mk(skill, 'Measurement error', { prompt: `A ${thing} is exactly ${num(trueV, 2)} ${unit}; the tool reads ${num(measured, 2)} ${unit}. What is the percent error?`, expression: 'error ÷ true × 100 = ? %', ...a, unit: '%', difficulty: d, decimal: true, hint: 'Percent error compares the error with the true value.', steps: [`Error = ${lab(num(measured, 2), 'reading')} − ${lab(num(trueV, 2), 'true value')} = ${lab(num(err, 2), `error, ${uw(unit)}`)} (ignoring the sign).`, `${lab(num(err, 2), 'error')} ÷ ${lab(num(trueV, 2), 'true value')} × 100 = ${lab(`${num(pct, 1)}%`, 'percent error')}.`, `A small error on a small part can be a large percent.`], visual: { type: 'card', title: 'Known standard', lines: [`true value: ${num(trueV, 2)} ${unit}`, `reading: ${num(measured, 2)} ${unit}`] } });
}

export function sigfigQuestion(mode: 'round' | 'count' | 'sci' | 'unsci', v: number, n: number, d: Difficulty, skill = 'fit.sigfig'): Question {
  if (mode === 'round') { const mag = Math.floor(Math.log10(Math.abs(v))); const f = 10 ** (n - 1 - mag); const r = Math.round(v * f) / f; return mk(skill, 'Significant figures', { prompt: `A calculator shows ${v}. Your tool is only good to ${n} significant figures. Write the value to ${n} s.f.`, expression: `${v} → ? (${n} s.f.)`, answer: r, unit: '', difficulty: d, decimal: true, hint: 'Count digits from the first non-zero digit, then round.', steps: [`Significant figures start at the first non-zero digit.`, `Keep ${n} digits and round the rest: ${v} → ${r}.`, `Reporting more digits than the tool can measure is a lie about precision.`], visual: { type: 'digits', value: String(v), sig: n } }); }
  if (mode === 'count') { const s = String(v); const digits = s.replace('.', '').replace(/^0+/, ''); const count = s.includes('.') ? digits.length : digits.replace(/0+$/, '').length; return mk(skill, 'Significant figures', { prompt: `How many significant figures in ${s}?`, expression: `s.f. in ${s} = ?`, answer: count, unit: '', difficulty: d, hint: 'Leading zeros never count; zeros after a decimal point at the end do.', steps: [`Leading zeros only place the decimal point: they do not count.`, `${s.includes('.') ? 'Trailing zeros after a decimal point count: they were measured.' : 'Trailing zeros without a decimal point are ambiguous; here we treat them as placeholders.'}`, `${s} has ${count} significant figure${count === 1 ? '' : 's'}.`], visual: { type: 'digits', value: s, sig: count } }); }
  if (mode === 'sci') { const exp = Math.floor(Math.log10(v)); const mant = v / 10 ** exp; return mk(skill, 'Significant figures', { prompt: `Write ${v.toLocaleString('en-US')} in scientific notation: ${num(mant, 2)} × 10 to what power?`, expression: `${v.toLocaleString('en-US')} = ${num(mant, 2)} × 10^?`, answer: exp, unit: '', difficulty: d, hint: 'Count how many places the decimal point moves.', steps: [`Move the decimal point until one non-zero digit is in front: ${num(mant, 2)}.`, `It moved ${exp} places to the left, so the power is ${exp}.`, `${num(mant, 2)} × 10^${exp} = ${v.toLocaleString('en-US')}.`], visual: { type: 'digits', value: v.toLocaleString('en-US'), sig: 0 } }); }
  const exp = n; const mant = v; const full = mant * 10 ** exp;
  return mk(skill, 'Significant figures', { prompt: `A datasheet says ${num(mant, 2)} × 10^${exp}. Write it out as an ordinary number.`, expression: `${num(mant, 2)} × 10^${exp} = ?`, answer: full, unit: '', difficulty: d, decimal: !Number.isInteger(full), hint: `Move the decimal point ${exp} places to the right.`, steps: [`10^${exp} is 1 followed by ${exp} zeros.`, `${num(mant, 2)} × 10^${exp} = ${full.toLocaleString('en-US')}.`], visual: { type: 'digits', value: `${num(mant, 2)} × 10^${exp}`, sig: 0 } });
}

export function runoutQuestion(mode: 'read' | 'runout', readings: number[], d: Difficulty, rng: Rng, skill = 'fit.runout'): Question {
  const thing = rng.pick(['shaft', 'brake disc', 'pulley', 'flange', 'wheel rim']);
  if (mode === 'read') { const v = readings[0]; return mk(skill, 'Dial indicator', { prompt: `The dial indicator on this ${thing} is graduated in 0.01 mm (100 divisions per turn). Read it, in mm.`, expression: '? mm', answer: r2(v), unit: 'mm', difficulty: d, decimal: true, hint: 'Each division is 0.01 mm; the labels are hundredths.', steps: [`Labels every 10 divisions with 10 spaces: each mark is 0.01 mm.`, `The needle points to ${Math.round(v * 100)} hundredths: ${num(v, 2)} mm.`], visual: { type: 'dial', max: 1, major: 0.1, divisions: 10, value: r2(v), unit: 'mm' } }); }
  const hi = Math.max(...readings); const lo = Math.min(...readings); const run = r2(hi - lo);
  return mk(skill, 'Dial indicator', { prompt: `Turning the ${thing} one full revolution, the indicator reads ${readings.map((r) => num(r, 2)).join(', ')} mm. What is the runout?`, expression: 'highest − lowest = ?', answer: run, unit: 'mm', difficulty: d, decimal: true, hint: 'Runout is the total wobble: max reading minus min reading.', steps: [`Highest: ${num(hi, 2)}. Lowest: ${num(lo, 2)}.`, `Runout = ${lab(num(hi, 2), 'highest, mm')} − ${lab(num(lo, 2), 'lowest, mm')} = ${lab(num(run, 2), 'runout, mm')}.`, `A bent or off-centre part shows as runout; a true one reads the same all the way round.`], visual: { type: 'card', title: 'Indicator readings, one turn', lines: readings.map((r, i) => `${i * (360 / readings.length)}°: ${num(r, 2)} mm`) } });
}

export function calibrateQuestion(mode: 'offset' | 'correct' | 'mean', standard: number, readings: number[], unit: string, d: Difficulty, rng: Rng, skill = 'fit.calibrate'): Question {
  const tool = unit === 'kg' ? 'scale' : unit === '°C' ? 'thermometer' : rng.pick(['gauge', 'caliper']);
  if (mode === 'offset') { const off = r2(readings[0] - standard); return mk(skill, 'Calibration', { prompt: `A ${standard} ${unit} standard is put on the ${tool}. It reads ${num(readings[0], 2)} ${unit}. What is the ${tool}'s offset (reading − true)? Use a minus sign if it reads low.`, expression: 'reading − true = ?', answer: off, unit, difficulty: d, decimal: true, hint: 'Offset is how far the tool reads from the truth.', steps: [`Offset = reading − true = ${lab(num(readings[0], 2), `reading, ${uw(unit)}`)} − ${lab(standard, `standard, ${uw(unit)}`)} = ${off >= 0 ? '+' : ''}${lab(num(off, 2), `offset, ${uw(unit)}`)}.`, `The ${tool} reads ${off >= 0 ? 'high' : 'low'} by ${num(Math.abs(off), 2)} ${unit}. Until it is adjusted, correct every reading by that much.`], visual: { type: 'card', title: 'Calibration check', lines: [`standard: ${standard} ${unit}`, `${tool} reads: ${num(readings[0], 2)} ${unit}`] } }); }
  if (mode === 'correct') { const off = r2(readings[0] - standard); const raw = readings[1]; const trueV = r2(raw - off); return mk(skill, 'Calibration', { prompt: `The ${tool} reads ${num(readings[0], 2)} ${unit} on a ${standard} ${unit} standard. Later it reads ${num(raw, 2)} ${unit} on a part. What is the part's true value?`, expression: 'reading − offset = ?', answer: trueV, unit, difficulty: d, decimal: true, hint: 'Find the offset from the standard, then take it off the new reading.', steps: [`Offset = ${lab(num(readings[0], 2), 'reading on the standard')} − ${lab(standard, 'standard')} = ${off >= 0 ? '+' : ''}${lab(num(off, 2), `offset, ${uw(unit)}`)}.`, `True = reading − offset = ${lab(num(raw, 2), 'part reading')} − (${off >= 0 ? '+' : ''}${num(off, 2)}) = ${lab(num(trueV, 2), `true value, ${uw(unit)}`)}.`], visual: { type: 'card', title: 'Calibration check', lines: [`standard: ${standard} ${unit}`, `${tool} reads: ${num(readings[0], 2)} ${unit}`, `part reads: ${num(raw, 2)} ${unit}`] } }); }
  const mean = readings.reduce((a, b) => a + b, 0) / readings.length; const a = approx(mean, 2);
  return mk(skill, 'Calibration', { prompt: `You measure the same part ${readings.length} times: ${readings.map((r) => num(r, 2)).join(', ')} ${unit}. What is the mean (average)?`, expression: 'sum ÷ count = ?', ...a, unit, difficulty: d, decimal: true, hint: 'Add them up, divide by how many.', steps: [`Sum: ${readings.map((r) => num(r, 2)).join(' + ')} = ${lab(num(readings.reduce((x, y) => x + y, 0), 2), 'sum of readings')}.`, `Mean: ${lab(num(readings.reduce((x, y) => x + y, 0), 2), 'sum of readings')} ÷ ${lab(readings.length, 'readings')} = ${lab(num(mean, 2), `mean, ${uw(unit)}`)}.`, `Repeated readings average out random error; they cannot remove a calibration offset.`], visual: { type: 'card', title: 'Repeated readings', lines: readings.map((r, i) => `#${i + 1}: ${num(r, 2)} ${unit}`) } });
}

export function fitQuestion(kind: FitKind, d: Difficulty, rng: Rng, skillId?: string): Question {
  const k: Exclude<FitKind, 'all'> = kind === 'all' ? rng.pick(['caliper', 'micrometer', 'tolerance', 'feeler', 'thread', 'wrench', 'stackup', 'error', 'sigfig', 'runout', 'calibrate'] as const) : kind;
  const sid = skillId ?? (kind === 'all' ? 'fit' : `fit.${k}`);
  if (k === 'caliper') return caliperQuestion(rng.int(d <= 2 ? 5 : 10, d <= 2 ? 40 : 90) + rng.int(d <= 1 ? 0 : 1, 9) / 10, d, rng, sid);
  if (k === 'micrometer') return micrometerQuestion(rng.int(1, 20) + (d <= 2 ? rng.pick([0, 0.5]) : rng.int(0, 1) * 0.5) + (d <= 1 ? 0 : rng.int(1, 49) / 100), d, rng, sid);
  if (k === 'tolerance') { const nominal = rng.int(5, 60) + (d >= 3 ? rng.int(0, 9) / 10 : 0); const tol = rng.pick(d <= 2 ? [0.1, 0.2, 0.5] : [0.02, 0.05, 0.1, 0.15]); const ask = d <= 2 ? rng.pick(['max', 'min'] as const) : rng.pick(['max', 'min', 'out', 'out'] as const); const measured = r2(nominal + rng.pick([-1.5, -1.2, -0.5, 0, 0.4, 1.1, 1.4, 2]) * tol); return toleranceQuestion(nominal, tol, ask === 'out' ? measured : null, ask, d, rng, sid); }
  if (k === 'feeler') { const n = d <= 2 ? 2 : rng.int(2, 3); const blades = rng.shuffle(BLADES.slice(0, d <= 2 ? 6 : BLADES.length)).slice(0, n); return feelerQuestion(blades, d, rng, sid); }
  if (k === 'thread') { const p = rng.pick(PITCHES).pitch; return threadQuestion(d <= 2 ? 'pitch' : rng.pick(['pitch', 'tpi', 'count'] as const), p, d, rng, sid); }
  if (k === 'wrench') return wrenchQuestion(rng.pick(BOLTS), d <= 2 ? 'flats' : rng.pick(['flats', 'thread'] as const), d, sid);
  if (k === 'stackup') { const n = d <= 2 ? 2 : rng.int(3, 4); const parts = Array.from({ length: n }, () => ({ nominal: rng.int(2, 20) + (d >= 3 ? rng.pick([0, 0.5]) : 0), tol: rng.pick(d <= 2 ? [0.1, 0.2] : [0.05, 0.1, 0.15, 0.2]) })); return stackupQuestion(parts, d <= 2 ? 'tol' : rng.pick(['tol', 'max', 'min'] as const), d, sid); }
  if (k === 'error') { const trueV = rng.pick([10, 20, 25, 50, 100, 200]); const measured = r2(trueV + rng.pick([-3, -2, -1, -0.5, 0.5, 1, 2, 4])); return errorQuestion(trueV, measured, d <= 2 ? 'abs' : 'pct', rng.pick(['mm', 'g', 'mL']), d, rng, sid); }
  if (k === 'sigfig') { const mode = d <= 2 ? rng.pick(['round', 'count'] as const) : rng.pick(['round', 'count', 'sci', 'unsci'] as const); if (mode === 'round') return sigfigQuestion('round', r2(rng.int(1, 999) / rng.pick([7, 11, 13, 17])), rng.int(2, 3), d, sid); if (mode === 'count') return sigfigQuestion('count', rng.pick([0.0045, 0.045, 1.05, 12.30, 0.100, 250.5, 3.007, 0.5]), 0, d, sid); if (mode === 'sci') return sigfigQuestion('sci', rng.pick([4500, 45000, 120000, 3200, 7600000, 810000]), 0, d, sid); return sigfigQuestion('unsci', rng.pick([1.5, 2.25, 4.7, 3.02]), rng.int(2, 5), d, sid); }
  if (k === 'runout') { if (d <= 2) return runoutQuestion('read', [rng.int(1, 99) / 100], d, rng, sid); const base = rng.int(5, 60) / 100; const readings = Array.from({ length: 4 }, () => r2(base + rng.int(0, 12) / 100)); return runoutQuestion('runout', readings, d, rng, sid); }
  const standard = rng.pick([1, 2, 5, 10, 20, 50]); const off = rng.pick([-0.3, -0.2, -0.1, 0.1, 0.2, 0.3, 0.5]); const unit = rng.pick(['kg', 'mm', '°C']);
  if (d <= 2) return calibrateQuestion('offset', standard, [r2(standard + off)], unit, d, rng, sid);
  if (rng.chance(0.5)) return calibrateQuestion('correct', standard, [r2(standard + off), r2(rng.int(2, 9) * standard / 2 + off)], unit, d, rng, sid);
  const readings = Array.from({ length: 4 }, () => r2(standard + rng.int(-4, 4) / 20)); return calibrateQuestion('mean', standard, readings, unit, d, rng, sid);
}

export const genFit: Generator = (skillId, params, ctx) => fitQuestion(String(params?.kind ?? 'all') as FitKind, ctx.difficulty, ctx.rng, skillId);
