import type { Difficulty, Question } from '../types';
import type { Rng } from '../rng';
import type { Generator } from './context';
import { pictureQuestion, approx, num, r2, PI, eqSign } from './picture';
import { lab, labn } from '../label';

/**
 * Plumbing measurement, in the order a plumber learns it:
 *  nominal  — a "½ inch" pipe is not ½ inch across: nominal size vs outside vs inside diameter, wall thickness
 *  cut      — cut length from centre-to-centre, minus each fitting's take-off
 *  route    — total pipe for a run of segments, plus waste
 *  pslope   — fall over a run: mm per metre, ¼ in per foot, percent
 *  capacity — litres inside a pipe from its inside diameter and length
 *  flowtime — fill time from tank size and flow; flow from a timed bucket
 *  head     — pressure from height of water; flow and pressure are different quantities
 *  offset   — 45° offsets: travel = offset × 1.414
 */
export type PipeKind = 'nominal' | 'cut' | 'route' | 'pslope' | 'capacity' | 'flowtime' | 'head' | 'offset' | 'all';
export const PIPE_KINDS: { id: PipeKind; label: string; short: string; desc: string }[] = [
  { id: 'all', label: 'Mixed plumbing', short: 'Mixed', desc: 'Pipe sizes, cut lengths, routes, slope, capacity, flow, head, offsets.' },
  { id: 'nominal', label: 'Nominal vs actual', short: 'Nominal', desc: 'A ½ in pipe is 21.3 mm outside and 15.8 mm inside. Which dimension matters?' },
  { id: 'cut', label: 'Cut lengths', short: 'Cut', desc: 'Centre-to-centre minus the take-off of each fitting.' },
  { id: 'route', label: 'Pipe for a route', short: 'Route', desc: 'Add the segments; allow for waste.' },
  { id: 'pslope', label: 'Slope and fall', short: 'Fall', desc: 'Drains need fall: 20 mm per metre, or ¼ in per foot.' },
  { id: 'capacity', label: 'Water in the pipe', short: 'Capacity', desc: 'Use the inside diameter: π r² × length.' },
  { id: 'flowtime', label: 'Fill and flow', short: 'Flow', desc: 'Time a bucket to get L/min; tank ÷ rate = fill time.' },
  { id: 'head', label: 'Head pressure', short: 'Head', desc: 'Height makes pressure: about 10 kPa per metre. Flow is separate.' },
  { id: 'offset', label: '45° offsets', short: 'Offset', desc: 'Travel = offset × 1.414 for a 45° offset.' },
];

const T = 'Plumbing';
const mk = (skill: string, sub: string, o: Parameters<typeof pictureQuestion>[4]) => pictureQuestion('pipe', T, skill, sub, o);

/** PVC schedule 40, mm. */
export const PIPES: { nominal: string; od: number; id: number }[] = [
  { nominal: '½ in', od: 21.3, id: 15.8 }, { nominal: '¾ in', od: 26.7, id: 20.9 }, { nominal: '1 in', od: 33.4, id: 26.6 },
  { nominal: '1¼ in', od: 42.2, id: 35.1 }, { nominal: '1½ in', od: 48.3, id: 40.9 }, { nominal: '2 in', od: 60.3, id: 52.5 },
];
/** The nominal size in inches, for the note that the trade name is not a measurement. */
const NOMINAL_IN: Record<string, number> = { '½ in': 0.5, '¾ in': 0.75, '1 in': 1, '1¼ in': 1.25, '1½ in': 1.5, '2 in': 2 };
export function nominalQuestion(p: (typeof PIPES)[number], ask: 'wall' | 'od' | 'id', d: Difficulty, skill = 'pipe.nominal'): Question {
  const wall = r2((p.od - p.id) / 2);
  const lOd = lab(p.od, 'outside diameter in mm'); const lId = lab(p.id, 'inside diameter in mm');
  if (ask === 'wall') return mk(skill, 'Nominal vs actual', { prompt: `A "${p.nominal}" PVC pipe measures ${p.od} mm outside and ${p.id} mm inside. How thick is the wall?`, expression: '(OD − ID) ÷ 2 = ?', answer: wall, unit: 'mm', difficulty: d, decimal: true, hint: 'The wall appears twice across a diameter.', steps: [`Outside diameter minus inside diameter counts the wall on both sides.`, `(${lOd} − ${lId}) ÷ ${lab(2, 'walls across the pipe')} = ${lab(num(wall, 2), 'wall thickness in mm')}.`, `The nominal "${p.nominal}" is a trade name, not a measurement.`], visual: { type: 'pipesection', od: p.od, id: p.id, nominal: p.nominal, ask } });
  if (ask === 'od') return mk(skill, 'Nominal vs actual', { prompt: `Read the cutaway. What is the outside diameter of this "${p.nominal}" pipe, in mm? (Note: ${p.nominal} would be ${num((NOMINAL_IN[p.nominal] ?? 0.5) * 25.4, 2)} mm, at 25.4 mm per inch, and neither dimension matches it.)`, expression: 'OD = ? mm', answer: p.od, unit: 'mm', difficulty: d, decimal: true, hint: 'Outside edge to outside edge.', steps: [`Outside diameter: ${lOd}. Inside: ${lId}.`, `Fittings grip the outside, so OD decides which fitting fits.`], visual: { type: 'pipesection', od: p.od, id: p.id, nominal: p.nominal, ask } });
  return mk(skill, 'Nominal vs actual', { prompt: `Read the cutaway. What is the inside diameter of this "${p.nominal}" pipe, in mm?`, expression: 'ID = ? mm', answer: p.id, unit: 'mm', difficulty: d, decimal: true, hint: 'Inside edge to inside edge: the water sees this one.', steps: [`Inside diameter: ${lId}.`, `Capacity and flow depend on the inside diameter, not the label.`], visual: { type: 'pipesection', od: p.od, id: p.id, nominal: p.nominal, ask } });
}

export function cutQuestion(cc: number, takeoffs: [number, number], d: Difficulty, rng: Rng, skill = 'pipe.cut'): Question {
  const cut = cc - takeoffs[0] - takeoffs[1]; const f = rng.pick(['elbow', 'tee', 'coupling', 'valve']);
  return mk(skill, 'Cut lengths', {
    prompt: `Two fittings are ${cc} mm apart centre to centre. Each ${f} takes off ${takeoffs[0] === takeoffs[1] ? takeoffs[0] + ' mm' : takeoffs[0] + ' and ' + takeoffs[1] + ' mm'} (centre to the bottom of its socket). What length of pipe do you cut?`,
    expression: `${cc} − ${takeoffs[0]} − ${takeoffs[1]} = ?`, answer: cut, unit: 'mm', difficulty: d, hint: 'Centre-to-centre minus both take-offs.',
    steps: [`Measure centre to centre; the pipe never reaches the centres because the fittings are there.`, `Take-off = fitting centre-to-face minus the depth the pipe slides into the socket. Subtract one for each end.`, `${lab(cc, 'centre to centre in mm')} − ${lab(takeoffs[0], 'first take-off in mm')} − ${lab(takeoffs[1], 'second take-off in mm')} = ${lab(cut, 'cut length in mm')}. Cut long, then trim: you cannot cut short.`],
    visual: { type: 'piperoute', cc, takeoffs },
  });
}

export function routeQuestion(segs: number[], waste: number, d: Difficulty, skill = 'pipe.route'): Question {
  const total = segs.reduce((a, b) => a + b, 0); const withWaste = Math.ceil(total * (1 + waste / 100) * 10) / 10;
  return mk(skill, 'Pipe for a route', {
    prompt: waste ? `A run has segments of ${segs.join(', ')} m. Allow ${waste} % for cuts and waste. How many metres of pipe do you order? (round up to 0.1 m)` : `A run has segments of ${segs.join(', ')} m. How many metres of pipe in total?`,
    expression: waste ? `(${segs.join(' + ')}) × ${num(1 + waste / 100, 2)} = ?` : `${segs.join(' + ')} = ?`, answer: waste ? withWaste : total, unit: 'm', difficulty: d, decimal: !!waste, tolerance: waste ? 0.11 : 0, hint: 'Add every segment; then add the waste allowance.',
    steps: [`Total run: ${segs.map((x) => lab(x, 'segment in m')).join(' + ')} = ${lab(total, 'total run in m')}.`,
      ...(waste ? [`Waste allowance: ${lab('100%', 'the run')} + ${lab(`${waste}%`, 'waste')} = ${lab(`${100 + waste}%`, 'pipe to order')}, and ${100 + waste}% as a decimal is ${lab(num(1 + waste / 100, 2), 'run plus waste')}.`, `${lab(total, 'total run in m')} × ${lab(num(1 + waste / 100, 2), 'run plus waste')} = ${lab(num(total * (1 + waste / 100), 2), 'pipe in m')}, rounded up to ${lab(withWaste, 'metres to order')}.`] : [`Order that plus something for cuts and mistakes.`]), `Pipe comes in fixed lengths, so also work out how many sticks that is.`],
    visual: { type: 'route', segs },
  });
}

export function pslopeQuestion(mode: 'mm' | 'in' | 'pct', run: number, per: number, d: Difficulty, rng: Rng, skill = 'pipe.pslope'): Question {
  const thing = rng.pick(['drain', 'waste pipe', 'sewer line', 'gutter']);
  if (mode === 'mm') return mk(skill, 'Slope and fall', { prompt: `A ${thing} must fall ${per} mm for every metre. Over a ${run} m run, what is the total fall in mm?`, expression: `${per} × ${run} = ?`, answer: per * run, unit: 'mm', difficulty: d, hint: 'Fall per metre × metres.', steps: [`Slope is fall per unit of run.`, `${lab(per, 'fall in mm per metre')} × ${lab(run, 'run in m')} = ${lab(per * run, 'total fall in mm')}.`, `Too little fall and solids settle; too much and the water outruns them.`], visual: { type: 'slope', rise: per * run / 1000, run, unit: 'm' } });
  if (mode === 'in') { const fall = per * run; return mk(skill, 'Slope and fall', { prompt: `A ${thing} is laid at ¼ inch per foot. Over ${run} ft, what is the fall in inches?`, expression: `0.25 × ${run} = ?`, answer: fall, unit: 'in', difficulty: d, decimal: true, hint: 'A quarter inch for each foot.', steps: [`¼ in per ft is the usual minimum for drains, and ¼ = 0.25.`, `${lab(0.25, 'fall in inches per foot')} × ${lab(run, 'run in ft')} = ${lab(num(fall, 2), 'total fall in inches')}.`, `As a percent: ${lab(0.25, 'inch of fall')} ÷ ${lab(12, 'inches in a foot of run')} × ${lab(100, 'to make a percent')} ≈ ${lab('2.1%', 'slope')}.`], visual: { type: 'slope', rise: fall / 12, run, unit: 'ft' } }); }
  const pct = approx((per / 1000) * 100, 1);
  return mk(skill, 'Slope and fall', { prompt: `A ${thing} falls ${per} mm per metre. What is that as a percent slope?`, expression: `${per} ÷ 1000 × 100 = ?`, ...pct, unit: '%', difficulty: d, decimal: true, hint: `mm per m ÷ ${lab(1000, 'mm in a metre')} gives a fraction; × ${lab(100, 'to make a percent')} for percent.`, steps: [`A metre is 1000 mm, so the fall is ${per} mm for every 1000 mm of run.`, `${lab(per, 'fall in mm')} ÷ ${lab(1000, 'mm of run')} = ${lab(num(per / 1000, 3), 'fall per mm of run')}.`, `${lab(num(per / 1000, 3), 'fall per mm of run')} × ${lab(100, 'to make a percent')} = ${lab(`${num(per / 10, 1)}%`, 'slope')}.`], visual: { type: 'slope', rise: per / 1000 * run, run, unit: 'm' } });
}

export function capacityQuestion(p: (typeof PIPES)[number], lengthM: number, d: Difficulty, skill = 'pipe.capacity'): Question {
  const rCm = p.id / 20; const areaCm2 = PI * rCm * rCm; const litres = (areaCm2 * lengthM * 100) / 1000; const a = approx(litres, 2);
  return mk(skill, 'Water in the pipe', {
    prompt: `${lengthM} m of "${p.nominal}" pipe (inside diameter ${p.id} mm). How many litres of water does it hold? (π ≈ 3.14; 1 L = 1000 cm³)`,
    expression: '3.14 × r² × L = ? L', ...a, unit: 'L', difficulty: d, decimal: true, hint: 'Use the inside diameter, halve it, work in cm.',
    steps: [`Inside radius: ${lab(p.id, 'inside diameter in mm')} ÷ ${lab(2, 'radius is half')} = ${lab(num(p.id / 2, 2), 'radius in mm')}.`, `In cm: ${lab(num(p.id / 2, 2), 'radius in mm')} ÷ ${lab(10, 'mm in a cm')} = ${lab(num(rCm, 3), 'radius in cm')}.`,
      `Cross-section = π × r × r: ${lab(PI, 'pi, rounded')} × ${lab(num(rCm, 3), 'radius in cm')} × ${lab(num(rCm, 3), 'radius in cm')} ${eqSign(areaCm2, num(areaCm2, 2))} ${lab(num(areaCm2, 2), 'cross-section in cm²')}.`,
      `Length: ${lab(lengthM, 'length in m')} × ${lab(100, 'cm in a metre')} = ${lab(lengthM * 100, 'length in cm')}.`,
      `${lab(num(areaCm2, 2), 'cross-section in cm²')} × ${lab(lengthM * 100, 'length in cm')} ${eqSign(Number(num(areaCm2, 2)) * lengthM * 100, num(areaCm2 * lengthM * 100, 0))} ${lab(num(areaCm2 * lengthM * 100, 0), 'volume in cm³')}.`,
      `1 L = 1000 cm³: ${lab(num(areaCm2 * lengthM * 100, 0), 'volume in cm³')} ÷ ${lab(1000, 'cm³ in a litre')} ${eqSign(Number(num(areaCm2 * lengthM * 100, 0)) / 1000, num(litres, 2))} ${lab(num(litres, 2), 'water in litres')}.`, `The label size would give the wrong answer; only the inside diameter holds water.`],
    visual: { type: 'cylinder', r: rCm, h: lengthM * 100, unit: 'cm', label: `${p.nominal} pipe, ID ${p.id} mm, ${lengthM} m` },
  });
}

export function flowtimeQuestion(mode: 'bucket' | 'fill', a: number, b: number, d: Difficulty, _rng: Rng, skill = 'pipe.flowtime'): Question {
  if (mode === 'bucket') { const rate = approx((a / b) * 60, 1); return mk(skill, 'Fill and flow', { prompt: `A ${a} L bucket fills from the tap in ${b} seconds. What is the flow rate in L/min?`, expression: `${a} ÷ ${b} × 60 = ?`, ...rate, unit: 'L/min', difficulty: d, decimal: true, hint: `Litres per second first, then × ${lab(60, 'seconds in a minute')}.`, steps: [`${lab(a, 'bucket in litres')} ÷ ${lab(b, 'time in seconds')} ${Number(num(a / b, 3)) === a / b ? '=' : '≈'} ${labn(Number(num(a / b, 3)), 'litre per second', 'litres per second')}.`, `A minute is 60 seconds, so a minute fills 60 times as much: ${lab(a, 'bucket in litres')} ÷ ${lab(b, 'time in seconds')} × ${lab(60, 'seconds in a minute')} ${Number(num((a / b) * 60, 1)) === (a / b) * 60 ? '=' : '≈'} ${lab(num((a / b) * 60, 1), 'flow in L/min')}.`, `This is the plumber's flow test: a bucket and a stopwatch.`], visual: { type: 'flowtank', capacity: a, rate: Math.round((a / b) * 600) / 10, minutes: Math.round((b / 60) * 100) / 100, ask: 'rate' } }); }
  const t = approx(a / b, 1);
  return mk(skill, 'Fill and flow', { prompt: `A ${a} L tank fills at ${b} L/min. How many minutes to fill it?`, expression: `${a} ÷ ${b} = ?`, ...t, unit: 'min', difficulty: d, decimal: true, hint: 'Volume ÷ flow rate.', steps: [`Time = volume ÷ rate.`, `${lab(a, 'tank in litres')} ÷ ${lab(b, 'flow in L/min')} ${eqSign(a / b, num(a / b, 1))} ${lab(num(a / b, 1), 'time in minutes')}.`], visual: { type: 'flowtank', capacity: a, rate: b, minutes: Math.round((a / b) * 10) / 10, ask: 'time' } });
}

export function headQuestion(mode: 'kpa' | 'psi' | 'height', h: number, d: Difficulty, skill = 'pipe.head'): Question {
  if (mode === 'kpa') { const a = approx(h * 9.81, 0); return mk(skill, 'Head pressure', { prompt: `The water level in a header tank is ${h} m above the tap. What pressure does that head give at the tap, in kPa? (≈ 9.81 kPa per metre)`, expression: `${h} × 9.81 = ?`, ...a, unit: 'kPa', difficulty: d, decimal: true, hint: 'Pressure from height only.', steps: [`Head pressure ≈ 9.81 kPa per metre of water (the weight of a metre-tall column of water on each square metre).`, `${lab(h, 'height in m')} × ${lab(9.81, 'kPa per metre of water')} ${eqSign(h * 9.81, num(h * 9.81, 0))} ${lab(num(h * 9.81, 0), 'pressure in kPa')}.`, `100 kPa is 1 bar: ${lab(num(h * 9.81, 0), 'pressure in kPa')} ÷ ${lab(100, 'kPa in a bar')} ≈ ${lab(num(h * 9.81 / 100, 2), 'pressure in bar')}.`, `Pressure is force per area; flow is litres per minute. A tall thin tank has the same pressure as a tall wide one.`], visual: { type: 'head', height: h, unit: 'm' } }); }
  if (mode === 'psi') { const a = approx(h * 0.433, 1); return mk(skill, 'Head pressure', { prompt: `A tank is ${h} ft above the outlet. Head pressure in psi? (≈ 0.433 psi per foot)`, expression: `${h} × 0.433 = ?`, ...a, unit: 'psi', difficulty: d, decimal: true, hint: 'About 0.43 psi for each foot of height.', steps: [`Each foot of water gives 0.433 psi (the figure given in the question).`, `${lab(h, 'height in ft')} × ${lab(0.433, 'psi per foot of water')} ${eqSign(h * 0.433, num(h * 0.433, 1))} ${lab(num(h * 0.433, 1), 'pressure in psi')}.`], visual: { type: 'head', height: h, unit: 'ft' } }); }
  const kpa = Math.round(h * 9.81); const a = approx(kpa / 9.81, 1);
  return mk(skill, 'Head pressure', { prompt: `A shower needs ${kpa} kPa. How many metres above the shower head must the tank's water level be? (9.81 kPa per metre)`, expression: `${kpa} ÷ 9.81 = ?`, ...a, unit: 'm', difficulty: d, decimal: true, hint: `kPa ÷ ${lab(9.81, 'kPa per metre of water')} gives metres.`, steps: [`Each metre of water gives 9.81 kPa, so height = pressure ÷ 9.81.`, `${lab(kpa, 'pressure in kPa')} ÷ ${lab(9.81, 'kPa per metre of water')} ${eqSign(kpa / 9.81, num(kpa / 9.81, 1))} ${lab(num(kpa / 9.81, 1), 'height in m')}.`, `If the roof space is lower than that, gravity alone will not do; you need a pump.`], visual: { type: 'head', height: h, unit: 'm', hide: true } });
}

export function offsetQuestion(offset: number, ask: 'travel' | 'run', d: Difficulty, skill = 'pipe.offset'): Question {
  const travel = approx(offset * 1.414, 0);
  if (ask === 'travel') return mk(skill, '45° offsets', { prompt: `A pipe must shift sideways by ${offset} mm using two 45° elbows. How long is the diagonal piece, centre to centre (the travel)?`, expression: `${offset} × 1.414 = ?`, ...travel, unit: 'mm', difficulty: d, decimal: true, hint: `For 45°, travel = offset × ${lab(1.414, 'square root of two')}.`, steps: [`A 45° offset makes a right triangle with equal legs: the offset and the run are the same.`, `By Pythagoras the diagonal of equal legs is leg × √2, and √2 ≈ 1.414.`, `Travel = ${lab(offset, 'offset in mm')} × ${lab(1.414, 'square root of two')} ${eqSign(offset * 1.414, num(offset * 1.414, 0))} ${lab(num(offset * 1.414, 0), 'travel in mm')}.`, `Then subtract each elbow's take-off to get the cut length.`], visual: { type: 'offset', offset, angle: 45 } });
  return mk(skill, '45° offsets', { prompt: `A 45° offset shifts a pipe sideways by ${offset} mm. How much does it advance along the original direction (the run)?`, expression: 'run = offset = ?', answer: offset, unit: 'mm', difficulty: d, hint: 'At 45° the run equals the offset.', steps: [`With 45° elbows the two legs are equal: run = offset = ${lab(offset, 'run in mm')}.`, `For 30° elbows the run would be offset × ${lab(1.732, 'run factor at thirty degrees')} and the travel offset × ${lab(2, 'travel factor at thirty degrees')}.`], visual: { type: 'offset', offset, angle: 45, hide: 'run' } });
}

export function pipeQuestion(kind: PipeKind, d: Difficulty, rng: Rng, skillId?: string): Question {
  const k: Exclude<PipeKind, 'all'> = kind === 'all' ? rng.pick(['nominal', 'cut', 'route', 'pslope', 'capacity', 'flowtime', 'head', 'offset'] as const) : kind;
  const sid = skillId ?? (kind === 'all' ? 'pipe' : `pipe.${k}`);
  if (k === 'nominal') return nominalQuestion(rng.pick(PIPES), d <= 2 ? rng.pick(['od', 'id'] as const) : rng.pick(['wall', 'od', 'id'] as const), d, sid);
  if (k === 'cut') { const t = rng.pick([12, 14, 16, 19, 22, 25]); return cutQuestion(rng.int(20, d <= 2 ? 80 : 150) * 10, [t, d <= 2 ? t : rng.pick([12, 14, 16, 19, 22, 25])], d, rng, sid); }
  if (k === 'route') { const n = d <= 2 ? 3 : rng.int(3, 5); const segs = Array.from({ length: n }, () => (d <= 2 ? rng.int(1, 6) : rng.int(2, 24) / 2)); return routeQuestion(segs, d <= 2 ? 0 : rng.pick([5, 10]), d, sid); }
  if (k === 'pslope') { const mode = d <= 2 ? 'mm' : rng.pick(['mm', 'in', 'pct'] as const); if (mode === 'in') return pslopeQuestion('in', rng.int(4, 40), 0.25, d, rng, sid); return pslopeQuestion(mode, rng.int(2, 25), rng.pick([10, 15, 20, 25]), d, rng, sid); }
  if (k === 'capacity') return capacityQuestion(rng.pick(PIPES), rng.int(2, d <= 3 ? 10 : 40), d, sid);
  if (k === 'flowtime') { if (d <= 2 || rng.chance(0.5)) return flowtimeQuestion('fill', rng.int(2, 40) * 25, rng.pick([5, 8, 10, 12, 15, 20]), d, rng, sid); return flowtimeQuestion('bucket', rng.pick([5, 10, 12, 15, 20]), rng.pick([20, 30, 40, 45, 60, 75, 90]), d, rng, sid); }
  if (k === 'head') return headQuestion(d <= 2 ? 'kpa' : rng.pick(['kpa', 'psi', 'height'] as const), rng.int(2, d <= 2 ? 12 : 30), d, sid);
  return offsetQuestion(rng.int(4, 40) * 25, d <= 2 ? 'travel' : rng.pick(['travel', 'run'] as const), d, sid);
}

export const genPipe: Generator = (skillId, params, ctx) => pipeQuestion(String(params?.kind ?? 'all') as PipeKind, ctx.difficulty, ctx.rng, skillId);
