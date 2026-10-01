import type { Difficulty, Question } from '../types';
import type { Rng } from '../rng';
import type { Generator } from './context';
import { pictureQuestion, approx, num, PI } from './picture';
import { lab } from '../label';

/**
 * Shapes and angles, every question a picture:
 *  protractor — read an angle on a protractor (inner scale, from the baseline)
 *  angles     — the missing angle on a line (180), around a point (360), in a triangle (180), in a right angle (90)
 *  circle     — radius ↔ diameter; circumference ≈ 3.14 × d; a wheel's travel per turn
 *  pythag     — right triangle: hypotenuse from the legs, or a leg from the hypotenuse (ramps, braces, ladders)
 *  slope      — rise over run as a percent, or the rise for a given run
 *  surface    — surface area of a box (paint, sheet metal); open-top tanks at higher levels
 *  cylinder   — base area π r² and volume π r² h (tanks, pipes, cans)
 *  scale      — scale drawings: drawing ↔ real size at 1:n
 */
export type GeoKind = 'protractor' | 'angles' | 'circle' | 'pythag' | 'slope' | 'surface' | 'cylinder' | 'scale' | 'all';
export const GEO_KINDS: { id: GeoKind; label: string; short: string; desc: string }[] = [
  { id: 'all', label: 'Mixed shapes', short: 'Mixed', desc: 'Angles, circles, right triangles, slope, surface area, cylinders, scale drawings.' },
  { id: 'protractor', label: 'Read the protractor', short: 'Protractor', desc: 'Baseline on 0, follow the inner scale to the other ray. Acute or obtuse? Check.' },
  { id: 'angles', label: 'Missing angle', short: 'Angles', desc: 'A line is 180°, a point is 360°, a triangle is 180°, a right angle is 90°.' },
  { id: 'circle', label: 'Circles and wheels', short: 'Circles', desc: 'd = 2r. Circumference ≈ 3.14 × d: how far a wheel rolls in one turn.' },
  { id: 'pythag', label: 'Right triangles', short: 'Pythagoras', desc: 'a² + b² = c². Ramps, braces and ladders.' },
  { id: 'slope', label: 'Slope', short: 'Slope', desc: 'Rise ÷ run. As a percent: × 100. Ramps, roofs, drains.' },
  { id: 'surface', label: 'Surface area', short: 'Surface', desc: 'Every face of a box: 2(lw + lh + wh). Paint and sheet metal.' },
  { id: 'cylinder', label: 'Cylinders', short: 'Cylinder', desc: 'Base π r², volume π r² h. Tanks, pipes and cans.' },
  { id: 'scale', label: 'Scale drawings', short: 'Scale', desc: '1:50 means real = drawing × 50. Plans and models.' },
];

const T = 'Shapes & angles';
const mk = (skill: string, sub: string, o: Parameters<typeof pictureQuestion>[4]) => pictureQuestion('geo', T, skill, sub, o);

export function protractorQuestion(angle: number, d: Difficulty, skill = 'geo.protractor'): Question {
  const kind = angle < 90 ? 'acute (less than 90°)' : angle === 90 ? 'a right angle' : 'obtuse (more than 90°)';
  return mk(skill, 'Read the protractor', {
    prompt: 'One ray lies on the baseline at 0. Read the angle between the rays, in degrees.', expression: '? °', answer: angle, unit: '°', difficulty: d,
    hint: 'Start from the ray on 0 and follow that same scale to the other ray.',
    steps: [`The baseline ray sits on 0 of the inner scale, so read the inner scale.`, `Follow it round to the other ray: ${angle}°.`, `Check with your eyes: the angle is ${kind}, so ${angle}° makes sense${angle !== 90 ? ` and ${180 - angle}° would not` : ''}.`],
    visual: { type: 'protractor', angle },
  });
}

export function anglesQuestion(shape: 'line' | 'point' | 'triangle' | 'right', known: number[], d: Difficulty, skill = 'geo.angles'): Question {
  const total = shape === 'line' ? 180 : shape === 'point' ? 360 : shape === 'triangle' ? 180 : 90;
  const sum = known.reduce((a, b) => a + b, 0); const ans = total - sum;
  const whole = shape === 'line' ? 'straight line' : shape === 'point' ? 'full turn' : shape === 'triangle' ? 'triangle total' : 'right angle';
  const name = shape === 'line' ? 'Angles on a straight line add to 180°' : shape === 'point' ? 'Angles around a point add to 360°' : shape === 'triangle' ? 'The angles of a triangle add to 180°' : 'The two parts of a right angle add to 90°';
  return mk(skill, 'Missing angle', {
    prompt: `${shape === 'triangle' ? 'A triangular brace.' : shape === 'right' ? 'A square corner is split by a strut.' : shape === 'line' ? 'A strut meets a straight beam.' : 'Struts meet at a point.'} Find the missing angle.`,
    expression: `${total} − ${known.join(' − ')} = ?`, answer: ans, unit: '°', difficulty: d, hint: `${name}.`,
    steps: [`${name}.`, `Known angles: ${known.map((k) => lab(`${k}°`, 'known angle')).join(' + ')} = ${lab(`${sum}°`, 'known total')}.`, `${lab(`${total}°`, whole)} − ${lab(`${sum}°`, 'known total')} = ${lab(`${ans}°`, 'missing angle')}.`],
    visual: { type: 'angles', shape, known },
  });
}

export function circleQuestion(r: number, ask: 'd' | 'r' | 'c' | 'travel' | 'turns', d: Difficulty, rng: Rng, skill = 'geo.circle'): Question {
  const dia = 2 * r; const c = PI * dia;
  if (ask === 'd') return mk(skill, 'Circles and wheels', { prompt: `The radius of this wheel is ${r} cm. What is its diameter?`, expression: '2 × r = ?', answer: dia, unit: 'cm', difficulty: d, hint: 'The diameter goes all the way across: twice the radius.', steps: [`Radius is centre to edge; diameter is edge to edge through the centre.`, `d = 2 × ${lab(r, 'radius, cm')} = ${lab(dia, 'diameter, cm')}.`], visual: { type: 'circle', r, unit: 'cm', show: 'r', wheel: true } });
  if (ask === 'r') return mk(skill, 'Circles and wheels', { prompt: `The diameter of this pipe is ${dia} cm. What is its radius?`, expression: 'd ÷ 2 = ?', answer: r, unit: 'cm', difficulty: d, hint: 'Half the diameter.', steps: [`Radius = diameter ÷ 2.`, `${lab(dia, 'diameter, cm')} ÷ 2 = ${lab(r, 'radius, cm')}.`], visual: { type: 'circle', r, unit: 'cm', show: 'd' } });
  if (ask === 'c') { const a = approx(c, 1); return mk(skill, 'Circles and wheels', { prompt: `This wheel has a diameter of ${dia} cm. What is its circumference (the distance around)? Use π ≈ 3.14.`, expression: '3.14 × d = ?', ...a, unit: 'cm', difficulty: d, decimal: true, hint: 'Circumference = π × diameter.', steps: [`Circumference = π × d. Use 3.14.`, `3.14 (pi) × ${lab(dia, 'diameter, cm')} = ${lab(num(c), 'circumference, cm')}.`, `Check: a circle is a bit more than 3 diameters around.`], visual: { type: 'circle', r, unit: 'cm', show: 'd', wheel: true } }); }
  if (ask === 'travel') { const a = approx(c, 1); return mk(skill, 'Circles and wheels', { prompt: `A wheel ${dia} cm across rolls one full turn. How far does it travel? (π ≈ 3.14)`, expression: 'one turn = 3.14 × d = ?', ...a, unit: 'cm', difficulty: d, decimal: true, hint: 'One turn rolls out exactly one circumference.', steps: [`One turn lays the whole circumference on the ground.`, `3.14 (pi) × ${lab(dia, 'diameter, cm')} = ${lab(num(c), 'cm per turn')}.`], visual: { type: 'circle', r, unit: 'cm', show: 'd', wheel: true } }); }
  const turns = rng.int(5, 40); const dist = c * turns; const a = approx(dist / 100, 1);
  return mk(skill, 'Circles and wheels', { prompt: `A wheel ${dia} cm across makes ${turns} turns. How many metres does it travel? (π ≈ 3.14)`, expression: `turns × 3.14 × d = ? m`, ...a, unit: 'm', difficulty: d, decimal: true, hint: 'Distance = turns × circumference, then cm → m.', steps: [`One turn = 3.14 (pi) × ${lab(dia, 'diameter, cm')} = ${lab(num(c), 'cm per turn')}.`, `${lab(turns, 'turns')} × ${lab(num(c), 'cm per turn')} = ${lab(num(dist), 'cm travelled')}.`, `${lab(num(dist), 'cm travelled')} ÷ 100 (cm per metre) = ${lab(num(dist / 100), 'metres travelled')}.`], visual: { type: 'circle', r, unit: 'cm', show: 'd', wheel: true } });
}

const TRIPLES: [number, number, number][] = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17], [12, 16, 20], [7, 24, 25], [15, 20, 25], [10, 24, 26], [20, 21, 29], [9, 40, 41], [30, 40, 50]];
export function pythagQuestion(t: [number, number, number], hide: 'a' | 'b' | 'c', d: Difficulty, rng: Rng, skill = 'geo.pythag'): Question {
  const ctx = rng.pick(['ramp', 'brace', 'ladder'] as const);
  // A ramp runs further than it rises; a ladder is the other way round.
  const [a, b, c] = ctx === 'ramp' && t[1] > t[0] ? [t[1], t[0], t[2]] : ctx === 'ladder' && t[0] > t[1] ? [t[1], t[0], t[2]] : t;
  const names = ctx === 'ramp' ? ['run', 'rise', 'ramp surface'] : ctx === 'brace' ? ['bottom rail', 'post', 'diagonal brace'] : ['distance from the wall', 'height on the wall', 'ladder'];
  const ans = hide === 'a' ? a : hide === 'b' ? b : c;
  const [other, otherName] = hide === 'a' ? [b, names[1]] : [a, names[0]];
  const hidName = names[hide === 'a' ? 0 : hide === 'b' ? 1 : 2];
  const steps = hide === 'c'
    ? [`In a right triangle a² + b² = c², where c is the longest side (opposite the right angle).`, `Square the legs: ${lab(a, `${names[0]}, m`)} squared is ${a * a}; ${lab(b, `${names[1]}, m`)} squared is ${b * b}.`, `${a * a} + ${b * b} = ${lab(c * c, `${names[2]} squared`)}.`, `c = √${c * c} = ${lab(c, `${names[2]}, m`)}.`]
    : [`a² + b² = c², so the missing leg² = c² − (other leg)².`, `${lab(c, `${names[2]}, m`)} squared is ${c * c}; ${lab(other, `${otherName}, m`)} squared is ${other * other}.`, `${c * c} − ${other * other} = ${lab(ans * ans, `${hidName} squared`)}.`, `√${ans * ans} = ${lab(ans, `${hidName}, m`)}.`];
  return mk(skill, 'Right triangles', {
    prompt: `A ${ctx}: the ${names[0]} is ${hide === 'a' ? '?' : a + ' m'}, the ${names[1]} is ${hide === 'b' ? '?' : b + ' m'}, the ${names[2]} is ${hide === 'c' ? '?' : c + ' m'}. Find the missing length.`,
    expression: hide === 'c' ? `√(${a}² + ${b}²) = ?` : `√(${c}² − ${hide === 'a' ? b : a}²) = ?`, answer: ans, unit: 'm', difficulty: d, hint: 'Square the two you know; add for the long side, subtract for a short side; then square-root.',
    steps, visual: { type: 'rtri', a, b, c, hide, unit: 'm', context: ctx },
  });
}

export function slopeQuestion(rise: number, run: number, ask: 'percent' | 'rise' | 'ratio', d: Difficulty, rng: Rng, skill = 'geo.slope'): Question {
  const thing = rng.pick(['ramp', 'roof', 'driveway', 'drain pipe', 'conveyor']);
  const pct = (rise / run) * 100;
  if (ask === 'percent') { const a = approx(pct, 1); return mk(skill, 'Slope', { prompt: `This ${thing} rises ${rise} m over a run of ${run} m. What is its slope as a percent?`, expression: 'rise ÷ run × 100 = ? %', ...a, unit: '%', difficulty: d, decimal: true, hint: 'Slope = rise ÷ run. Percent means × 100.', steps: [`Slope = rise ÷ run = ${lab(rise, 'rise, m')} ÷ ${lab(run, 'run, m')} = ${lab(num(rise / run, 3), 'rise per metre of run')}.`, `As a percent: ${num(rise / run, 3)} × 100 = ${lab(`${num(pct, 1)}%`, 'slope')}.`, `A 100 % slope rises as much as it runs (45°).`], visual: { type: 'slope', rise, run, unit: 'm' } }); }
  if (ask === 'rise') return mk(skill, 'Slope', { prompt: `A ${thing} has a ${num(pct, 1)} % slope. Over a run of ${run} m, how much does it rise?`, expression: `${num(pct, 1)} % × ${run} = ?`, answer: rise, unit: 'm', difficulty: d, decimal: true, hint: 'Percent ÷ 100 gives rise per metre of run; multiply by the run.', steps: [`${num(pct, 1)} % = ${num(pct / 100, 3)} m of rise per metre of run.`, `${lab(num(pct / 100, 3), 'rise per metre of run')} × ${lab(run, 'run, m')} = ${lab(rise, 'rise, m')}.`], visual: { type: 'slope', rise, run, unit: 'm', hide: 'rise' } });
  const gcd = (x: number, y: number): number => (y ? gcd(y, x % y) : x);
  const g = gcd(rise, run);
  return mk(skill, 'Slope', { prompt: `This ${thing} rises ${rise} m over ${run} m. Written as 1 in N (1 unit of rise for every N of run), what is N?`, expression: `run ÷ rise = 1 in ?`, answer: run / rise, unit: '', difficulty: d, decimal: true, hint: 'Divide the run by the rise.', steps: [`Rise : run = ${rise} : ${run}${g > 1 ? ` = ${rise / g} : ${run / g}` : ''}.`, `1 in N means N = run ÷ rise = ${lab(run, 'run, m')} ÷ ${lab(rise, 'rise, m')} = ${lab(num(run / rise), 'run per unit of rise')}.`], visual: { type: 'slope', rise, run, unit: 'm' } });
}

export function surfaceQuestion(l: number, w: number, h: number, open: boolean, d: Difficulty, rng: Rng, skill = 'geo.surface'): Question {
  const thing = rng.pick(open ? ['open-top tank', 'planter box', 'tray'] : ['crate', 'metal box', 'cabinet', 'cooler']);
  const top = l * w; const front = l * h; const side = w * h; const total = open ? top + 2 * front + 2 * side : 2 * (top + front + side);
  return mk(skill, 'Surface area', {
    prompt: `${open ? 'An' : 'A'} ${thing} is ${l} cm long, ${w} cm wide and ${h} cm tall. How much sheet metal covers ${open ? 'it (five faces, no top)' : 'all six faces'}? Answer in cm².`,
    expression: open ? 'lw + 2lh + 2wh = ?' : '2(lw + lh + wh) = ?', answer: total, unit: 'cm²', difficulty: d, hint: open ? 'Bottom once, and each of the four sides.' : 'Three pairs of faces: top/bottom, front/back, two ends.',
    steps: [`Top or bottom: ${lab(l, 'length, cm')} × ${lab(w, 'width, cm')} = ${lab(top, 'top, cm²')}.`, `Front or back: ${lab(l, 'length, cm')} × ${lab(h, 'height, cm')} = ${lab(front, 'front, cm²')}.`, `Each end: ${lab(w, 'width, cm')} × ${lab(h, 'height, cm')} = ${lab(side, 'end, cm²')}.`, open ? `Bottom + 2 fronts + 2 ends = ${top} + ${2 * front} + ${2 * side} = ${lab(total, 'sheet metal, cm²')}.` : `Two of each: 2 × (${top} + ${front} + ${side}) = ${lab(total, 'sheet metal, cm²')}.`, `Surface area is measured in square units: it is a covering, not a filling.`],
    visual: { type: 'box', l, w, h, unit: 'cm' },
  });
}

export function cylinderQuestion(r: number, h: number, ask: 'base' | 'volume' | 'litres', d: Difficulty, rng: Rng, skill = 'geo.cylinder'): Question {
  const thing = rng.pick(['tank', 'drum', 'can', 'pipe section', 'silo']);
  const base = PI * r * r; const vol = base * h;
  if (ask === 'base') { const a = approx(base, 1); return mk(skill, 'Cylinders', { prompt: `This ${thing} has a radius of ${r} cm. What is the area of its circular base? (π ≈ 3.14)`, expression: '3.14 × r² = ?', ...a, unit: 'cm²', difficulty: d, decimal: true, hint: 'Area of a circle = π × r × r.', steps: [`Base area = π r² = 3.14 (pi) × ${lab(r, 'radius, cm')} × ${lab(r, 'radius, cm')}.`, `${r}² = ${r * r}; 3.14 × ${r * r} = ${lab(num(base), 'base area, cm²')}.`], visual: { type: 'cylinder', r, h, unit: 'cm' } }); }
  if (ask === 'volume') { const a = approx(vol, 0); return mk(skill, 'Cylinders', { prompt: `This ${thing} has radius ${r} cm and height ${h} cm. What is its volume? (π ≈ 3.14)`, expression: '3.14 × r² × h = ?', ...a, unit: 'cm³', difficulty: d, decimal: true, hint: 'Base area × height, like layers of a box.', steps: [`Base = 3.14 (pi) × ${r}² = ${lab(num(base), 'base area, cm²')}.`, `Volume = base × height = ${lab(num(base), 'base area, cm²')} × ${lab(h, 'height, cm')} = ${lab(num(vol, 0), 'volume, cm³')}.`], visual: { type: 'cylinder', r, h, unit: 'cm' } }); }
  const a = approx(vol / 1000, 1);
  return mk(skill, 'Cylinders', { prompt: `A ${thing} has radius ${r} cm and height ${h} cm. How many litres does it hold? (π ≈ 3.14, 1000 cm³ = 1 L)`, expression: '3.14 × r² × h ÷ 1000 = ? L', ...a, unit: 'L', difficulty: d, decimal: true, hint: 'Volume in cm³, then ÷ 1000.', steps: [`Base = 3.14 (pi) × ${r}² = ${lab(num(base), 'base area, cm²')}.`, `Volume = ${lab(num(base), 'base area, cm²')} × ${lab(h, 'height, cm')} = ${lab(num(vol, 0), 'volume, cm³')}.`, `${lab(num(vol, 0), 'volume, cm³')} ÷ 1000 (cm³ per litre) = ${lab(num(vol / 1000), 'litres')}.`], visual: { type: 'cylinder', r, h, unit: 'cm' } });
}

export function scaleQuestion(scale: number, drawCm: number, ask: 'real' | 'drawing', d: Difficulty, rng: Rng, skill = 'geo.scale'): Question {
  const thing = rng.pick(['room', 'workshop', 'garden bed', 'garage', 'deck']);
  const realCm = drawCm * scale; const realM = realCm / 100;
  if (ask === 'real') return mk(skill, 'Scale drawings', { prompt: `A plan of a ${thing} is drawn at 1:${scale}. On the drawing one wall is ${drawCm} cm long. How long is the real wall, in metres?`, expression: `${drawCm} × ${scale} cm = ? m`, answer: realM, unit: 'm', difficulty: d, decimal: true, hint: 'Real = drawing × scale, then cm → m.', steps: [`1:${scale} means every 1 cm on paper is ${scale} cm in real life.`, `${lab(drawCm, 'drawing, cm')} × ${lab(scale, 'scale factor')} = ${lab(realCm, 'real length, cm')}.`, `${lab(realCm, 'real length, cm')} ÷ 100 (cm per metre) = ${lab(num(realM), 'real length, m')}.`], visual: { type: 'plan', w: drawCm, h: Math.max(1, Math.round(drawCm * 0.6)), scale, unit: 'cm' } });
  return mk(skill, 'Scale drawings', { prompt: `A ${thing} wall is ${num(realM)} m long. At a scale of 1:${scale}, how long should it be on the drawing, in cm?`, expression: `${realCm} cm ÷ ${scale} = ?`, answer: drawCm, unit: 'cm', difficulty: d, decimal: true, hint: 'Drawing = real ÷ scale. Put the real size in cm first.', steps: [`${num(realM)} m = ${lab(realCm, 'real length, cm')}.`, `Drawing = real ÷ scale = ${lab(realCm, 'real length, cm')} ÷ ${lab(scale, 'scale factor')} = ${lab(drawCm, 'drawing, cm')}.`], visual: { type: 'plan', w: drawCm, h: Math.max(1, Math.round(drawCm * 0.6)), scale, unit: 'cm', hide: true } });
}

export function geoQuestion(kind: GeoKind, d: Difficulty, rng: Rng, skillId?: string): Question {
  const k: Exclude<GeoKind, 'all'> = kind === 'all' ? rng.pick(['protractor', 'angles', 'circle', 'pythag', 'slope', 'surface', 'cylinder', 'scale'] as const) : kind;
  const sid = skillId ?? (kind === 'all' ? 'geo' : `geo.${k}`);
  if (k === 'protractor') return protractorQuestion(d <= 2 ? rng.int(1, 17) * 10 : rng.int(2, 35) * 5, d, sid);
  if (k === 'angles') {
    const shape = d <= 2 ? rng.pick(['line', 'right'] as const) : rng.pick(['line', 'point', 'triangle', 'right'] as const);
    if (shape === 'line') return anglesQuestion('line', [rng.int(2, 16) * 10 + (d >= 3 ? rng.int(0, 9) : 0)].map((v) => Math.min(170, v)), d, sid);
    if (shape === 'right') return anglesQuestion('right', [rng.int(1, 8) * 10 + (d >= 3 ? rng.int(0, 9) : 0)].map((v) => Math.min(85, v)), d, sid);
    if (shape === 'triangle') { const a = rng.int(25, 90); const b = rng.int(20, 150 - a); return anglesQuestion('triangle', [a, b], d, sid); }
    const a = rng.int(60, 150); const b = rng.int(60, 150); return anglesQuestion('point', [a, b], d, sid);
  }
  if (k === 'circle') {
    const ask = d <= 1 ? rng.pick(['d', 'r'] as const) : d <= 3 ? rng.pick(['d', 'r', 'c', 'travel'] as const) : rng.pick(['c', 'travel', 'turns'] as const);
    return circleQuestion(rng.int(2, d <= 2 ? 12 : 40), ask, d, rng, sid);
  }
  if (k === 'pythag') { const t = rng.pick(d <= 2 ? TRIPLES.slice(0, 4) : TRIPLES); return pythagQuestion(t, d <= 2 ? 'c' : rng.pick(['a', 'b', 'c'] as const), d, rng, sid); }
  if (k === 'slope') {
    const run = rng.pick([4, 5, 8, 10, 12, 16, 20, 25, 40, 50]); const rise = rng.pick([1, 2, 3, 4, 5].filter((r) => r < run));
    return slopeQuestion(rise, run, d <= 2 ? 'percent' : rng.pick(['percent', 'rise', 'ratio'] as const), d, rng, sid);
  }
  if (k === 'surface') return surfaceQuestion(rng.int(2, d <= 2 ? 6 : 12), rng.int(2, d <= 2 ? 6 : 10), rng.int(2, d <= 2 ? 6 : 10), d >= 4 && rng.chance(0.5), d, rng, sid);
  if (k === 'cylinder') return cylinderQuestion(rng.int(1, d <= 2 ? 5 : 12), rng.int(2, d <= 2 ? 10 : 30), d <= 2 ? 'base' : d <= 4 ? 'volume' : rng.pick(['volume', 'litres'] as const), d, rng, sid);
  const scale = rng.pick(d <= 2 ? [10, 20, 50, 100] : [20, 25, 50, 100, 200]); const drawCm = rng.int(2, 12);
  return scaleQuestion(scale, drawCm, d <= 2 ? 'real' : rng.pick(['real', 'drawing'] as const), d, rng, sid);
}

export const genGeo: Generator = (skillId, params, ctx) => geoQuestion(String(params?.kind ?? 'all') as GeoKind, ctx.difficulty, ctx.rng, skillId);
