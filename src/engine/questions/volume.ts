import type { Difficulty, Question, Visual } from '../types';
import type { Rng } from '../rng';
import type { Generator } from './context';
import { nextQuestionId } from './context';
import { lab, labn } from '../label';

/**
 * Measuring volume, taught through pictures of the thing being measured:
 *  cubes     — count unit cubes in a stack: cubes in one layer × number of layers
 *  prism     — a labelled box (tank, crate, cooler): V = length × width × height
 *  liquid    — read the water line on a measuring jug: work out what each mark is worth
 *  displace  — water displacement: drop an object in, volume = after − before
 *  missing   — the volume and two sides are known; find the third side by dividing
 *  all       — mixed
 */
export type VolumeKind = 'cubes' | 'prism' | 'liquid' | 'displace' | 'missing' | 'composite' | 'subtract' | 'stairs' | 'all';
export const VOLUME_KINDS: { id: VolumeKind; label: string; short: string }[] = [
  { id: 'all', label: 'Mixed volume', short: 'Mixed' },
  { id: 'cubes', label: 'Count the cubes', short: 'Cubes' },
  { id: 'prism', label: 'Length × width × height', short: 'l × w × h' },
  { id: 'liquid', label: 'Read the jug', short: 'Jug' },
  { id: 'displace', label: 'Water displacement', short: 'Displace' },
  { id: 'missing', label: 'Find the missing side', short: 'Missing side' },
  { id: 'composite', label: 'Break apart a figure', short: 'Break apart' },
  { id: 'subtract', label: 'Fill in and subtract', short: 'Subtract' },
  { id: 'stairs', label: 'Staircase figures', short: 'Stairs' },
];

const OBJECTS = ['fish tank', 'shipping crate', 'toolbox', 'water tank', 'gear box', 'cooler', 'planter box', 'storage bin'];
const DROPS = ['bolt', 'rock', 'gear', 'marble', 'brass key', 'lump of ore', 'spanner head'];

function make(skillId: string, subtopic: string, prompt: string, expression: string, answer: number, unit: string, difficulty: Difficulty, hint: string, steps: string[], visual: Visual): Question {
  return {
    id: nextQuestionId('vol'), masterySkillId: skillId, topic: 'Volume', subtopic, difficulty, mode: 'applied',
    prompt, expression, answer, unit, hint, solutionSteps: steps, explanation: steps, visual, visualFirst: true, prerequisites: ['mult'],
    engineeringApplication: 'Engineers measure volume to size tanks, mix concrete, pour metal and know how much a container holds.',
  };
}

/** Count unit cubes stacked into a box shape. */
export function cubesQuestion(l: number, w: number, h: number, difficulty: Difficulty, skillId = 'volume.cubes'): Question {
  const layer = l * w; const v = layer * h;
  const steps = [
    `Count one layer: ${labn(l, 'row')} × ${labn(w, 'cube per row', 'cubes per row')} = ${labn(layer, 'cube in the bottom layer', 'cubes in the bottom layer')}.`,
    `Count the layers going up: ${labn(h, 'layer')}.`,
    `${labn(layer, 'cube per layer', 'cubes per layer')} × ${labn(h, 'layer')} = ${labn(v, 'cube')}. Volume = ${v} cubic units.`,
  ];
  return make(skillId, 'Count the cubes', `Each block is 1 cubic unit. How many cubes make this stack?`, 'Volume = ? cubes', v, 'cubes', difficulty,
    'Count the bottom layer, then multiply by the number of layers.', steps, { type: 'cubes', l, w, h });
}

/** A labelled box: V = l × w × h. Higher difficulty asks for millilitres (1 cm³ = 1 mL). */
export function prismQuestion(l: number, w: number, h: number, difficulty: Difficulty, rng: Rng, skillId = 'volume.prism'): Question {
  const obj = rng.pick(OBJECTS); const v = l * w * h;
  const asMl = difficulty >= 4 && rng.chance(0.4);
  const steps = [
    `Volume of a box = length × width × height.`,
    `${lab(l, 'length in cm')} × ${lab(w, 'width in cm')} = ${lab(l * w, 'base area in cm²')}.`,
    `${lab(l * w, 'base area in cm²')} × ${lab(h, 'height in cm')} = ${lab(v, 'volume in cm³')}.`,
    asMl ? `1 cm³ holds 1 mL, so ${lab(v, 'volume in cm³')} = ${lab(v, 'water in mL')}.` : `Volume = ${v} cm³, cubic centimetres: ${v} one-centimetre cubes would fill it.`,
  ];
  const prompt = asMl
    ? `This ${obj} is ${l} cm long, ${w} cm wide and ${h} cm tall. How many millilitres of water does it hold? (1 cm³ = 1 mL)`
    : `This ${obj} is ${l} cm long, ${w} cm wide and ${h} cm tall. What is its volume?`;
  return make(skillId, 'Length × width × height', prompt, difficulty <= 2 ? `${l} × ${w} × ${h} = ?` : 'V = l × w × h = ?', v, asMl ? 'mL' : 'cm³', difficulty,
    'Multiply the three sides: length × width × height.', steps, { type: 'box', l, w, h, unit: 'cm' });
}

/** Read a measuring jug: labels every `major` mL, `divisions` spaces between labels. */
export function liquidQuestion(capacity: number, major: number, divisions: number, level: number, difficulty: Difficulty, skillId = 'volume.liquid'): Question {
  const step = major / divisions;
  const below = Math.floor(level / major) * major; const marksUp = Math.round((level - below) / step);
  const steps = [
    `The labels go up by ${major} mL, and there are ${divisions} spaces between labels.`,
    `So each small mark is worth ${lab(major, 'mL between labels')} ÷ ${lab(divisions, 'spaces')} = ${lab(step, 'mL per mark')}.`,
    marksUp === 0 ? `The water line sits exactly on the ${below} mL label. Volume = ${below} mL.` : `The water line is ${marksUp} mark${marksUp === 1 ? '' : 's'} above the ${below} mL label: ${lab(below, 'mL at the label')} + ${labn(marksUp, 'mark')} × ${lab(step, 'mL per mark')} = ${lab(level, 'water in mL')}.`,
  ];
  return make(skillId, 'Read the jug', difficulty <= 2 ? `Read the water line. Each small mark is ${step} mL. How much water is in the jug?` : 'Read the water line. Work out what each small mark is worth first. How much water is in the jug?',
    'Water = ? mL', level, 'mL', difficulty, `Labels every ${major} mL with ${divisions} spaces between them: what is one mark worth?`, steps, { type: 'beaker', capacity, major, divisions, level, unit: 'mL' });
}

/** Water displacement: the object's volume is the rise in the water line. */
export function displaceQuestion(capacity: number, major: number, divisions: number, before: number, after: number, difficulty: Difficulty, rng: Rng, skillId = 'volume.displace'): Question {
  const obj = rng.pick(DROPS); const v = after - before;
  const steps = [
    `Water displacement: an object pushes aside exactly its own volume of water.`,
    `Before: ${before} mL. After dropping in the ${obj}: ${after} mL.`,
    `${lab(after, 'water after in mL')} − ${lab(before, 'water before in mL')} = ${lab(v, `${obj} volume in mL`)}. The ${obj} has a volume of ${v} mL, which is ${v} cm³.`,
  ];
  const prompt = difficulty <= 2
    ? `The jug held ${before} mL. After the ${obj} was dropped in, it read ${after} mL. What is the volume of the ${obj}?`
    : `Read both jugs. The ${obj} was dropped into the water. What is the volume of the ${obj}?`;
  return make(skillId, 'Water displacement', prompt, difficulty <= 2 ? `${after} − ${before} = ?` : 'after − before = ?', v, 'mL', difficulty,
    'The water rises by exactly the volume of the object: after − before.', steps, { type: 'displace', capacity, major, divisions, before, after, unit: 'mL' });
}

/** Volume and two sides known; find the third by dividing. */
export function missingQuestion(l: number, w: number, h: number, hide: 'l' | 'w' | 'h', difficulty: Difficulty, rng: Rng, skillId = 'volume.missing'): Question {
  const obj = rng.pick(OBJECTS); const v = l * w * h;
  const known = hide === 'l' ? [w, h] : hide === 'w' ? [l, h] : [l, w];
  const ans = hide === 'l' ? l : hide === 'w' ? w : h;
  const name = hide === 'l' ? 'long' : hide === 'w' ? 'wide' : 'tall';
  const side = { l: 'length in cm', w: 'width in cm', h: 'height in cm' };
  const knownNames = hide === 'l' ? [side.w, side.h] : hide === 'w' ? [side.l, side.h] : [side.l, side.w];
  const others = hide === 'l' ? `${w} cm wide and ${h} cm tall` : hide === 'w' ? `${l} cm long and ${h} cm tall` : `${l} cm long and ${w} cm wide`;
  const steps = [
    `Volume = length × width × height, so the missing side = volume ÷ (the two known sides multiplied).`,
    `${lab(known[0], knownNames[0])} × ${lab(known[1], knownNames[1])} = ${lab(known[0] * known[1], 'face area in cm²')}.`,
    `${lab(v, 'volume in cm³')} ÷ ${lab(known[0] * known[1], 'face area in cm²')} = ${lab(ans, side[hide])}. The ${obj} is ${ans} cm ${name}.`,
  ];
  return make(skillId, 'Find the missing side', `This ${obj} holds ${v} cm³. It is ${others}. How ${name} is it?`, difficulty <= 3 ? `${v} ÷ (${known[0]} × ${known[1]}) = ?` : '? cm', ans, 'cm', difficulty,
    'Multiply the two sides you know, then divide the volume by that.', steps, { type: 'box', l, w, h, unit: 'cm', hide });
}

const JUGS: { capacity: number; major: number; divisions: number }[] = [
  { capacity: 100, major: 20, divisions: 2 }, { capacity: 100, major: 25, divisions: 5 }, { capacity: 200, major: 50, divisions: 5 },
  { capacity: 500, major: 100, divisions: 4 }, { capacity: 500, major: 100, divisions: 5 }, { capacity: 1000, major: 200, divisions: 4 }, { capacity: 1000, major: 250, divisions: 5 },
];

export function volumeQuestion(kind: VolumeKind, difficulty: Difficulty, rng: Rng, skillId?: string): Question {
  const k: Exclude<VolumeKind, 'all'> = kind === 'all' ? rng.pick(['cubes', 'prism', 'liquid', 'displace', 'missing', 'composite', 'subtract', 'stairs', 'prism', 'composite'] as const) : kind;
  const sid = skillId ?? (kind === 'all' ? 'volume' : `volume.${k}`);
  const side = (max: number) => rng.int(1, max);
  if (k === 'cubes') {
    const max = difficulty <= 1 ? 3 : difficulty <= 3 ? 4 : 5;
    const h = difficulty <= 1 ? rng.int(1, 2) : rng.int(2, max);
    return cubesQuestion(rng.int(2, max), rng.int(1, max), h, difficulty, sid);
  }
  if (k === 'prism') {
    const max = difficulty <= 2 ? 6 : difficulty <= 4 ? 10 : 15;
    return prismQuestion(rng.int(2, max), side(max), side(Math.max(2, max - 3)), difficulty, rng, sid);
  }
  if (k === 'liquid') {
    const jug = rng.pick(difficulty <= 2 ? JUGS.slice(0, 3) : JUGS);
    const step = jug.major / jug.divisions; const n = jug.capacity / step;
    const level = rng.int(1, n - 1) * step;
    return liquidQuestion(jug.capacity, jug.major, jug.divisions, level, difficulty, sid);
  }
  if (k === 'displace') {
    const jug = rng.pick(difficulty <= 2 ? JUGS.slice(0, 3) : JUGS.slice(2));
    const step = jug.major / jug.divisions; const n = jug.capacity / step;
    const before = rng.int(Math.max(1, Math.floor(n * 0.2)), Math.floor(n * 0.5)) * step;
    const after = before + rng.int(1, Math.floor(n * 0.35)) * step;
    return displaceQuestion(jug.capacity, jug.major, jug.divisions, before, after, difficulty, rng, sid);
  }
  if (k === 'composite') return compositeQuestion(lShape(rng, difficulty), rng.pick(['cm', 'in', 'ft']), 'add', difficulty, rng, sid);
  if (k === 'subtract') return notchQuestion(difficulty, rng, sid);
  if (k === 'stairs') return stairQuestion(difficulty, rng, sid);
  const max = difficulty <= 3 ? 6 : 10;
  return missingQuestion(rng.int(2, max), rng.int(2, max), rng.int(2, max), rng.pick(['l', 'w', 'h'] as const), difficulty, rng, sid);
}

/** Generator: params.kind = cubes | prism | liquid | displace | missing | all. */
export const genVolume: Generator = (skillId, params, ctx) => volumeQuestion(String(params?.kind ?? 'all') as VolumeKind, ctx.difficulty, ctx.rng, skillId);

/* ------------------------------------------------------------------ */
/* composite solids: breaking apart a figure to find its volume        */
/* ------------------------------------------------------------------ */

export interface Box { x: number; y: number; z: number; l: number; w: number; h: number; label?: string }
const vol = (b: Box) => b.l * b.w * b.h;
const cu = (u: string) => `${u}³`;
/** Unit words for labels: "in" reads badly inside a label ("length in in"), so inches are spelled out. */
const lenU = (u: string) => (u === 'in' ? 'inches' : u);
const cuU = (u: string) => (u === 'in' ? 'cubic inches' : `${u}³`);
/** A box's sides with labels: "4 (length in cm) × 3 (width in cm) × 5 (height in cm)". */
const ldims = (b: Box, u: string) => `${lab(b.l, `length in ${lenU(u)}`)} × ${lab(b.w, `width in ${lenU(u)}`)} × ${lab(b.h, `height in ${lenU(u)}`)}`;
/** A labelled volume: "60 (volume of A in cm³)". */
const lvol = (n: number, what: string, u: string) => lab(n, `${what} in ${cuU(u)}`);

/**
 * A figure made of rectangular prisms. Two valid routes are always given: break it apart and add, or
 * enclose it in one big box and subtract what is missing. Which one is offered as the question depends
 * on the kind; the other is always named in the explanation, because seeing both is the real skill.
 */
export function compositeQuestion(parts: Box[], unit: string, mode: 'add' | 'subtract', difficulty: Difficulty, rng: Rng, skillId = 'volume.composite', thing?: string): Question {
  const total = parts.reduce((a, b) => a + vol(b), 0);
  const name = thing ?? rng.pick(['concrete footing', 'workbench', 'loading dock', 'stone step', 'machine base', 'planter']);
  // The smallest box that encloses every part, for the subtract route.
  const hi = (f: (b: Box) => number) => Math.max(...parts.map(f));
  const L = hi((b) => b.x + b.l); const W = hi((b) => b.y + b.w); const H = hi((b) => b.z + b.h);
  const boxVol = L * W * H;
  const missing = boxVol - total;
  const letter = (i: number) => parts[i].label ?? String.fromCharCode(65 + i);
  const addSteps = parts.map((b, i) => `Piece ${letter(i)}: ${ldims(b, unit)} = ${lvol(vol(b), `volume of ${letter(i)}`, unit)}.`);
  const sum = `${parts.map((b, i) => lvol(vol(b), `volume of ${letter(i)}`, unit)).join(' + ')} = ${lvol(total, 'total volume', unit)}`;
  const whole = `${lab(L, `length in ${lenU(unit)}`)} × ${lab(W, `width in ${lenU(unit)}`)} × ${lab(H, `height in ${lenU(unit)}`)} = ${lvol(boxVol, 'whole box', unit)}`;
  const minus = `${lvol(boxVol, 'whole box', unit)} − ${lvol(missing, 'missing piece', unit)} = ${lvol(total, 'total volume', unit)}`;
  const bothWays = [
    `Way 1 — break it apart: ${sum}.`,
    `Way 2 — fill in the gap and subtract: the whole box would be ${whole}, and the missing piece is ${missing} ${cu(unit)}. ${minus}.`,
    `Both ways give ${lvol(total, 'total volume', unit)}, because you are measuring the same solid. Volume is counted in cubic units, so the answer is ${cu(unit)}, not ${unit}.`,
  ];
  const steps = mode === 'add'
    ? [`Way 1 — break it apart: cut the figure into rectangular prisms that do not overlap.`, ...addSteps, `Add them: ${sum}.`, ...bothWays.slice(1)]
    : [`Way 2 — fill in the gap and subtract: imagine the figure filled in to a full box, ${whole}.`, `The piece that is missing is ${lvol(missing, 'missing piece', unit)}.`, `${minus}.`, bothWays[0], bothWays[2]];
  return make(skillId, mode === 'add' ? 'Break it apart' : 'Fill in and subtract',
    `This ${name} is made of rectangular prisms. What is its volume, in ${cu(unit)}?`,
    mode === 'add' ? 'add the pieces = ?' : 'whole box − missing piece = ?', total, cu(unit), difficulty,
    mode === 'add' ? 'Split it into boxes, find each volume, then add.' : 'Fill the gap to make one big box, then take the gap back off.',
    steps, { type: 'solid', parts: parts.map((b, i) => ({ ...b, label: b.label ?? String.fromCharCode(65 + i) })), unit, showLabels: true });
}

/** Two prisms side by side, or one sitting on a wider base: the classic L and step figures. */
export function lShape(rng: Rng, d: Difficulty): Box[] {
  const max = d <= 2 ? 5 : d <= 4 ? 8 : 12;
  const w = rng.int(2, Math.min(4, max));
  if (rng.chance(0.5)) {
    // Side by side: a tall arm next to a short arm.
    const a = { x: 0, y: 0, z: 0, l: rng.int(2, max), w, h: rng.int(3, max) };
    const b = { x: a.l, y: 0, z: 0, l: rng.int(2, max), w, h: rng.int(1, Math.max(1, a.h - 1)) };
    return [a, b];
  }
  // A step: a slab with a smaller block on top of one end.
  const base = { x: 0, y: 0, z: 0, l: rng.int(4, max + 2), w, h: rng.int(1, 3) };
  const top = { x: 0, y: 0, z: base.h, l: rng.int(2, Math.max(2, base.l - 1)), w, h: rng.int(2, max) };
  return [base, top];
}

/** A U-shaped figure: a block with a notch cut out of the middle of the top. */
export function notchShape(rng: Rng, d: Difficulty): { parts: Box[]; ghost: Box; outer: Box } {
  const max = d <= 2 ? 4 : d <= 4 ? 6 : 9;
  const w = rng.int(2, 4);
  const arm = rng.int(2, max);
  const gap = rng.int(2, max);
  const H = rng.int(3, max + 2);
  const slab = rng.int(1, H - 2);
  const L = arm * 2 + gap;
  const parts: Box[] = [
    { x: 0, y: 0, z: 0, l: L, w, h: slab, label: 'A' },
    { x: 0, y: 0, z: slab, l: arm, w, h: H - slab, label: 'B' },
    { x: arm + gap, y: 0, z: slab, l: arm, w, h: H - slab, label: 'C' },
  ];
  return { parts, ghost: { x: arm, y: 0, z: slab, l: gap, w, h: H - slab, label: 'gap' }, outer: { x: 0, y: 0, z: 0, l: L, w, h: H } };
}

/** A staircase of equal steps, each one rise taller than the next. */
export function stairShape(rng: Rng, d: Difficulty): Box[] {
  const steps = d <= 2 ? 2 : d <= 4 ? 3 : rng.int(3, 4);
  const run = rng.int(2, 4); const w = rng.int(2, 4); const rise = rng.int(1, 3);
  return Array.from({ length: steps }, (_, i) => ({ x: i * run, y: 0, z: 0, l: run, w, h: rise * (steps - i), label: String.fromCharCode(65 + i) }));
}

/** U-shaped figure asked the subtract way, with the add way spelled out too. */
export function notchQuestion(difficulty: Difficulty, rng: Rng, skillId = 'volume.subtract'): Question {
  const { parts, ghost, outer } = notchShape(rng, difficulty);
  const unit = rng.pick(['cm', 'in', 'ft']);
  const total = parts.reduce((a, b) => a + vol(b), 0);
  const boxVol = vol(outer); const gapVol = vol(ghost);
  const name = rng.pick(['channel block', 'cable tray', 'concrete kerb', 'tool stand']);
  const steps = [
    `Fill the notch in and you have one whole box: ${ldims(outer, unit)} = ${lvol(boxVol, 'whole box', unit)}.`,
    `The notch that was cut out is ${ldims(ghost, unit)} = ${lvol(gapVol, 'notch', unit)}.`,
    `${lvol(boxVol, 'whole box', unit)} − ${lvol(gapVol, 'notch', unit)} = ${lvol(total, 'total volume', unit)}.`,
    `The other way: break it into the base slab and the two arms, then add.`,
    ...parts.map((b) => `${b.label}: ${ldims(b, unit)} = ${lvol(vol(b), `volume of ${b.label}`, unit)}.`),
    `${parts.map((b) => lvol(vol(b), `volume of ${b.label}`, unit)).join(' + ')} = ${lvol(total, 'total volume', unit)}.`,
    `Subtracting is quicker here because the notch is one simple box; adding needs three.`,
  ];
  return make(skillId, 'Fill in and subtract', `This ${name} has a notch cut out of it. What is its volume, in ${cu(unit)}?`,
    'whole box − notch = ?', total, cu(unit), difficulty, 'Fill the notch to make one box, work that out, then take the notch off.',
    steps, { type: 'solid', parts, ghost, unit, showLabels: true });
}

export function stairQuestion(difficulty: Difficulty, rng: Rng, skillId = 'volume.stairs'): Question {
  const parts = stairShape(rng, difficulty);
  const unit = rng.pick(['cm', 'in', 'ft']);
  const total = parts.reduce((a, b) => a + vol(b), 0);
  const steps = [
    `Cut the staircase into upright slabs, one under each step.`,
    ...parts.map((b) => `${b.label}: ${ldims(b, unit)} = ${lvol(vol(b), `volume of ${b.label}`, unit)}.`),
    `${parts.map((b) => lvol(vol(b), `volume of ${b.label}`, unit)).join(' + ')} = ${lvol(total, 'total volume', unit)}.`,
    `You could also cut it into flat layers instead of upright slabs; the total is the same ${total} ${cu(unit)} either way.`,
  ];
  return make(skillId, 'Break it apart', `A staircase of ${parts.length} steps. What is its volume, in ${cu(unit)}?`,
    'add the slabs = ?', total, cu(unit), difficulty, 'One upright slab under each step. Find each, then add.',
    steps, { type: 'solid', parts, unit, showLabels: true });
}
