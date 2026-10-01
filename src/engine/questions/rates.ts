import type { Difficulty, Question } from '../types';
import type { Rng } from '../rng';
import type { Generator } from './context';
import { pictureQuestion, approx, num, PI, eqSign } from './picture';
import { lab, labn } from '../label';

/**
 * Rates and conversions:
 *  ratio     — mix ratios (cement : sand : gravel), scaling a recipe
 *  usmetric  — US ↔ metric with the same length drawn twice (1 in = 25.4 mm)
 *  speed     — distance, time, speed: find the third
 *  flow      — litres per minute: volume, time and rate
 *  density   — mass ÷ volume, in g/mL
 *  chain     — dimensional analysis: units cancel step by step
 *  rpm       — turns per minute × circumference = distance
 */
export type RatesKind = 'ratio' | 'usmetric' | 'speed' | 'flow' | 'density' | 'chain' | 'rpm' | 'all';
export const RATES_KINDS: { id: RatesKind; label: string; short: string; desc: string }[] = [
  { id: 'all', label: 'Mixed rates', short: 'Mixed', desc: 'Ratios, US ↔ metric, speed, flow, density, unit chains, rpm.' },
  { id: 'ratio', label: 'Mix ratios', short: 'Ratio', desc: '1 : 2 : 3 concrete. Scale every part by the same number.' },
  { id: 'usmetric', label: 'US ↔ metric', short: 'US↔metric', desc: '1 in = 25.4 mm, 1 mi ≈ 1.61 km, 1 kg ≈ 2.2 lb, 1 gal ≈ 3.79 L.' },
  { id: 'speed', label: 'Speed', short: 'Speed', desc: 'speed = distance ÷ time. Cover one, find the other two.' },
  { id: 'flow', label: 'Flow rate', short: 'Flow', desc: 'L/min. Volume = rate × time; time = volume ÷ rate.' },
  { id: 'density', label: 'Density', short: 'Density', desc: 'g/mL = mass ÷ volume. Steel 7.8, aluminium 2.7, water 1.' },
  { id: 'chain', label: 'Units that cancel', short: 'Chain', desc: 'Multiply by 1 written as a fraction; cross out matching units.' },
  { id: 'rpm', label: 'Turns and travel', short: 'rpm', desc: 'rpm × minutes = turns; turns × circumference = distance.' },
];

const T = 'Rates & conversions';
const mk = (skill: string, sub: string, o: Parameters<typeof pictureQuestion>[4]) => pictureQuestion('rate', T, skill, sub, o);

const MIXES: { name: string; parts: { label: string; n: number }[] }[] = [
  { name: 'concrete', parts: [{ label: 'cement', n: 1 }, { label: 'sand', n: 2 }, { label: 'gravel', n: 3 }] },
  { name: 'mortar', parts: [{ label: 'cement', n: 1 }, { label: 'sand', n: 3 }] },
  { name: 'two-stroke fuel', parts: [{ label: 'oil', n: 1 }, { label: 'petrol', n: 50 }] },
  { name: 'coolant', parts: [{ label: 'antifreeze', n: 1 }, { label: 'water', n: 1 }] },
  { name: 'weedkiller', parts: [{ label: 'concentrate', n: 1 }, { label: 'water', n: 20 }] },
  { name: 'plaster', parts: [{ label: 'plaster', n: 2 }, { label: 'water', n: 1 }] },
];
export function ratioQuestion(mix: (typeof MIXES)[number], knownIdx: number, askIdx: number, mult: number, d: Difficulty, skill = 'rates.ratio'): Question {
  const k = mix.parts[knownIdx]; const a = mix.parts[askIdx]; const unit = mix.name.includes('fuel') || mix.name === 'coolant' || mix.name === 'weedkiller' ? 'L' : 'buckets';
  const known = k.n * mult; const ans = a.n * mult;
  const parts = (p: { label: string; n: number }) => labn(p.n, `part ${p.label}`, `parts ${p.label}`);
  const perPart = lab(mult, `${unit} per part`);
  return mk(skill, 'Mix ratios', {
    prompt: `${mix.name[0].toUpperCase() + mix.name.slice(1)} is mixed ${mix.parts.map(parts).join(' : ')}. You have ${known} ${unit} of ${k.label}. How much ${a.label} do you need?`,
    expression: `${known} ÷ ${k.n} × ${a.n} = ?`, answer: ans, unit, difficulty: d, hint: 'Find the size of one part first: known amount ÷ its number of parts.',
    steps: [`${k.label[0].toUpperCase() + k.label.slice(1)} is ${k.n} part${k.n === 1 ? '' : 's'}, so one part = ${lab(known, `${unit} of ${k.label}`)} ÷ ${parts(k)} = ${perPart}.`, `${a.label[0].toUpperCase() + a.label.slice(1)} is ${a.n} part${a.n === 1 ? '' : 's'}: ${parts(a)} × ${perPart} = ${lab(ans, `${unit} of ${a.label}`)}.`, `Every part scales by the same number, so the mix stays the same.`],
    visual: { type: 'ratio', parts: mix.parts, unit, known: { label: k.label, amount: known }, ask: a.label },
  });
}

interface UM { a: string; b: string; f: number; quantity: string; min: Difficulty }
export const US_METRIC: UM[] = [
  { a: 'in', b: 'mm', f: 25.4, quantity: 'length', min: 1 }, { a: 'in', b: 'cm', f: 2.54, quantity: 'length', min: 1 }, { a: 'ft', b: 'm', f: 0.3048, quantity: 'length', min: 2 },
  { a: 'mi', b: 'km', f: 1.609, quantity: 'distance', min: 2 }, { a: 'yd', b: 'm', f: 0.9144, quantity: 'length', min: 3 },
  { a: 'lb', b: 'kg', f: 0.4536, quantity: 'mass', min: 2 }, { a: 'oz', b: 'g', f: 28.35, quantity: 'mass', min: 3 },
  { a: 'gal', b: 'L', f: 3.785, quantity: 'capacity', min: 2 }, { a: 'fl oz', b: 'mL', f: 29.57, quantity: 'capacity', min: 4 }, { a: 'qt', b: 'L', f: 0.946, quantity: 'capacity', min: 3 },
];
/** US unit names spelled out for labels ("length in inches", "mm per inch"): "in" inside a label reads badly. */
const US_ONE: Record<string, string> = { in: 'inch', ft: 'foot', mi: 'mile', yd: 'yard', lb: 'pound', oz: 'ounce', gal: 'gallon', 'fl oz': 'fluid ounce', qt: 'quart' };
const US_MANY: Record<string, string> = { in: 'inches', ft: 'feet', mi: 'miles', yd: 'yards', lb: 'pounds', oz: 'ounces', gal: 'gallons', 'fl oz': 'fluid ounces', qt: 'quarts' };
export function usMetricQuestion(c: UM, n: number, toB: boolean, d: Difficulty, skill = 'rates.usmetric'): Question {
  const value = toB ? n * c.f : n / c.f; const places = value >= 100 ? 0 : value >= 10 ? 1 : 2; const a = approx(value, places);
  const factor = lab(c.f, `${c.b} per ${US_ONE[c.a] ?? c.a}`); const inA = `${c.quantity} in ${US_MANY[c.a] ?? c.a}`; const inB = `${c.quantity} in ${c.b}`;
  return mk(skill, 'US ↔ metric', {
    prompt: toB ? `${n} ${c.a} is how many ${c.b}? (1 ${c.a} = ${c.f} ${c.b})` : `${n} ${c.b} is how many ${c.a}? (1 ${c.a} = ${c.f} ${c.b})`,
    expression: toB ? `${n} × ${c.f} = ?` : `${n} ÷ ${c.f} = ?`, ...a, unit: toB ? c.b : c.a, difficulty: d, decimal: true,
    hint: toB ? `Multiply by ${factor}.` : `Divide by ${factor}.`,
    steps: [`The same ${c.quantity} can be described in either unit. The standard conversion factor (given in the question) is 1 ${c.a} = ${c.f} ${c.b}.`, toB ? `${lab(n, inA)} × ${factor} ${eqSign(value, num(value, places))} ${lab(num(value, places), inB)}.` : `${lab(n, inB)} ÷ ${factor} ${eqSign(value, num(value, places))} ${lab(num(value, places), inA)}.`, `Check the size: ${c.f > 1 ? `${c.b} are smaller units, so there are more of them` : `${c.b} are bigger units, so there are fewer of them`}.`],
    visual: { type: 'pairrule', a: { unit: c.a, n: 1 }, b: { unit: c.b, n: c.f } },
  });
}

export function speedQuestion(dist: number, time: number, ask: 'speed' | 'distance' | 'time', d: Difficulty, rng: Rng, skill = 'rates.speed'): Question {
  const speed = dist / time; const thing = rng.pick(['a delivery van', 'a conveyor', 'a train', 'a drone', 'a cyclist']);
  const a = ask === 'speed' ? approx(speed, 1) : ask === 'distance' ? { answer: dist, tolerance: 0 } : { answer: time, tolerance: 0 };
  return mk(skill, 'Speed', {
    prompt: ask === 'speed' ? `${thing[0].toUpperCase() + thing.slice(1)} covers ${dist} km in ${time} h. What is its speed in km/h?` : ask === 'distance' ? `${thing[0].toUpperCase() + thing.slice(1)} travels at ${num(speed, 1)} km/h for ${time} h. How far does it go?` : `${thing[0].toUpperCase() + thing.slice(1)} travels ${dist} km at ${num(speed, 1)} km/h. How long does it take, in hours?`,
    expression: ask === 'speed' ? 'd ÷ t = ?' : ask === 'distance' ? 's × t = ?' : 'd ÷ s = ?', ...a, unit: ask === 'speed' ? 'km/h' : ask === 'distance' ? 'km' : 'h', difficulty: d, decimal: true,
    hint: 'Cover the one you want on the triangle: d on top, s and t below.',
    steps: [`speed = distance ÷ time; distance = speed × time; time = distance ÷ speed.`, ask === 'speed' ? `${lab(dist, 'distance in km')} ÷ ${lab(time, 'time in hours')} = ${lab(num(speed, 1), 'speed in km/h')}.` : ask === 'distance' ? `${lab(num(speed, 1), 'speed in km/h')} × ${lab(time, 'time in hours')} = ${lab(dist, 'distance in km')}.` : `${lab(dist, 'distance in km')} ÷ ${lab(num(speed, 1), 'speed in km/h')} = ${lab(time, 'time in hours')}.`, `km/h means kilometres for every one hour.`],
    visual: { type: 'ftri', top: 'd', left: 's', right: 't', known: ask === 'speed' ? { d: `${dist} km`, t: `${time} h` } : ask === 'distance' ? { s: `${num(speed, 1)} km/h`, t: `${time} h` } : { d: `${dist} km`, s: `${num(speed, 1)} km/h` }, ask: ask === 'speed' ? 's' : ask === 'distance' ? 'd' : 't' },
  });
}

export function flowQuestion(capacity: number, rate: number, ask: 'time' | 'volume' | 'rate', d: Difficulty, rng: Rng, skill = 'rates.flow'): Question {
  const minutes = capacity / rate; const thing = rng.pick(['tank', 'barrel', 'trough', 'header tank', 'bath']);
  const a = ask === 'time' ? approx(minutes, 1) : ask === 'volume' ? { answer: capacity, tolerance: 0 } : approx(rate, 1);
  return mk(skill, 'Flow rate', {
    prompt: ask === 'time' ? `A tap fills at ${rate} L/min. How many minutes to fill a ${capacity} L ${thing}?` : ask === 'volume' ? `A pump runs at ${rate} L/min for ${num(minutes, 1)} minutes. How many litres did it move?` : `A ${capacity} L ${thing} filled in ${num(minutes, 1)} minutes. What was the flow rate in L/min?`,
    expression: ask === 'time' ? 'volume ÷ rate = ? min' : ask === 'volume' ? 'rate × time = ? L' : 'volume ÷ time = ? L/min', ...a, unit: ask === 'time' ? 'min' : ask === 'volume' ? 'L' : 'L/min', difficulty: d, decimal: true,
    hint: 'Flow rate is litres for every one minute.',
    steps: [`Flow rate = volume ÷ time, so volume = rate × time and time = volume ÷ rate.`, ask === 'time' ? `${lab(capacity, 'volume in L')} ÷ ${lab(rate, 'flow rate in L/min')} = ${lab(num(minutes, 1), 'time in minutes')}.` : ask === 'volume' ? `${lab(rate, 'flow rate in L/min')} × ${lab(num(minutes, 1), 'time in minutes')} = ${lab(capacity, 'volume in L')}.` : `${lab(capacity, 'volume in L')} ÷ ${lab(num(minutes, 1), 'time in minutes')} = ${lab(num(rate, 1), 'flow rate in L/min')}.`, `Flow is how much passes per minute; pressure is a different quantity.`],
    visual: { type: 'flowtank', capacity, rate, minutes: Math.round(minutes * 10) / 10, ask },
  });
}

export const MATERIALS: { name: string; rho: number }[] = [{ name: 'water', rho: 1 }, { name: 'oak', rho: 0.7 }, { name: 'ice', rho: 0.92 }, { name: 'PVC', rho: 1.4 }, { name: 'concrete', rho: 2.4 }, { name: 'aluminium', rho: 2.7 }, { name: 'steel', rho: 7.8 }, { name: 'copper', rho: 8.9 }, { name: 'gold', rho: 19.3 }];
export function densityQuestion(m: (typeof MATERIALS)[number], volume: number, ask: 'density' | 'mass' | 'volume', d: Difficulty, skill = 'rates.density'): Question {
  const mass = m.rho * volume;
  const a = ask === 'density' ? approx(m.rho, 2) : ask === 'mass' ? approx(mass, 1) : approx(volume, 1);
  return mk(skill, 'Density', {
    prompt: ask === 'density' ? `A block has a mass of ${num(mass, 1)} g and a volume of ${volume} mL. What is its density in g/mL?` : ask === 'mass' ? `A ${volume} mL block of ${m.name} (density ${m.rho} g/mL). What is its mass in grams?` : `A ${m.name} part has a mass of ${num(mass, 1)} g (density ${m.rho} g/mL). What is its volume in mL?`,
    expression: ask === 'density' ? 'm ÷ V = ?' : ask === 'mass' ? 'ρ × V = ?' : 'm ÷ ρ = ?', ...a, unit: ask === 'density' ? 'g/mL' : ask === 'mass' ? 'g' : 'mL', difficulty: d, decimal: true,
    hint: 'Density = mass ÷ volume. Water is 1 g/mL; heavier things sink.',
    steps: [`density = mass ÷ volume (g per mL). mass = density × volume. volume = mass ÷ density.`, ask === 'density' ? `${lab(num(mass, 1), 'mass in g')} ÷ ${lab(volume, 'volume in mL')} = ${lab(m.rho, 'density in g/mL')}, which matches ${m.name}.` : ask === 'mass' ? `${lab(m.rho, 'density in g/mL')} × ${lab(volume, 'volume in mL')} = ${lab(num(mass, 1), 'mass in g')}.` : `${lab(num(mass, 1), 'mass in g')} ÷ ${lab(m.rho, 'density in g/mL')} = ${lab(volume, 'volume in mL')}.`, `1 g/mL is the same as 1000 kg/m³.`],
    visual: { type: 'ftri', top: 'm', left: 'ρ', right: 'V', known: ask === 'density' ? { m: `${num(mass, 1)} g`, V: `${volume} mL` } : ask === 'mass' ? { ρ: `${m.rho} g/mL`, V: `${volume} mL` } : { m: `${num(mass, 1)} g`, ρ: `${m.rho} g/mL` }, ask: ask === 'density' ? 'ρ' : ask === 'mass' ? 'm' : 'V' },
  });
}

interface Chain {
  start: string; steps: [string, string][]; result: string; value: (n: number) => number; min: Difficulty; places: number;
  /** Display only: what the starting and final numbers are ("time in hours"), where each factor comes from, and a rate the question gives. */
  startLabel?: string; resultLabel?: string; source?: string; given?: string;
}
const CHAINS: Chain[] = [
  { start: 'h', steps: [['60 km', '1 h']], result: 'km', value: (n) => n * 60, min: 1, places: 0, startLabel: 'time in hours', resultLabel: 'distance in km', given: 'A truck drives at a steady 60 km every hour.', source: '60 km in 1 h is the truck’s speed, given in the question.' },
  { start: 'ft', steps: [['12 in', '1 ft'], ['2.54 cm', '1 in']], result: 'cm', value: (n) => n * 12 * 2.54, min: 2, places: 1, startLabel: 'length in ft', resultLabel: 'length in cm', source: '1 ft = 12 in is a US unit fact; 1 in = 2.54 cm exactly, by definition.' },
  { start: 'h', steps: [['60 min', '1 h'], ['5 L', '1 min']], result: 'L', value: (n) => n * 60 * 5, min: 2, places: 0, startLabel: 'time in hours', resultLabel: 'water in L', given: 'A tap runs at 5 L every minute.', source: '1 h = 60 min is a time fact; 5 L in 1 min is the tap’s flow, given in the question.' },
  { start: 'km/h', steps: [['1000 m', '1 km'], ['1 h', '3600 s']], result: 'm/s', value: (n) => (n * 1000) / 3600, min: 3, places: 1, startLabel: 'speed in km/h', resultLabel: 'speed in m/s', source: '1 km = 1000 m (kilo means a thousand); 60 (minutes in an hour) × 60 (seconds in a minute) = 3600 (seconds in an hour).' },
  { start: 'mi', steps: [['5280 ft', '1 mi'], ['12 in', '1 ft']], result: 'in', value: (n) => n * 5280 * 12, min: 4, places: 0, startLabel: 'distance in miles', resultLabel: 'distance in inches', source: '1 mi = 5280 ft and 1 ft = 12 in are US unit facts.' },
  { start: 'gal/min', steps: [['3.785 L', '1 gal'], ['60 min', '1 h']], result: 'L/h', value: (n) => n * 3.785 * 60, min: 4, places: 0, startLabel: 'flow in gal/min', resultLabel: 'flow in L/h', source: '1 US gal ≈ 3.785 L is the standard conversion; 1 h = 60 min.' },
  { start: 'days', steps: [['24 h', '1 day'], ['60 min', '1 h']], result: 'min', value: (n) => n * 24 * 60, min: 2, places: 0, startLabel: 'time in days', resultLabel: 'time in minutes', source: '1 day = 24 h and 1 h = 60 min are time facts.' },
  { start: 'yd', steps: [['3 ft', '1 yd'], ['0.3048 m', '1 ft']], result: 'm', value: (n) => n * 3 * 0.3048, min: 3, places: 2, startLabel: 'length in yd', resultLabel: 'length in m', source: '1 yd = 3 ft is a US unit fact; 1 ft = 0.3048 m exactly, by definition.' },
];
/** One factor as labelled arithmetic: ['60 km', '1 h'] → "× 60 (km per h)"; ['1 h', '3600 s'] → "÷ 3600 (s per h)". */
function factorMath([top, bottom]: [string, string]): string {
  const split = (t: string) => { const i = t.indexOf(' '); return { n: t.slice(0, i), u: t.slice(i + 1) }; };
  const a = split(top); const b = split(bottom);
  return b.n === '1' ? `× ${lab(a.n, `${a.u} per ${b.u}`)}` : `÷ ${lab(b.n, `${b.u} per ${a.u}`)}`;
}
export function chainQuestion(c: Chain, n: number, d: Difficulty, skill = 'rates.chain'): Question {
  const v = c.value(n); const a = approx(v, c.places);
  return mk(skill, 'Units that cancel', {
    prompt: `${c.given ? `${c.given} ` : ''}Convert ${n} ${c.start} to ${c.result}, one factor at a time. ${c.given ? `Write the rate${c.steps.length > 1 ? ' and the unit fact as fractions' : ' as a fraction'} so the units cancel` : 'Each fraction equals 1, so multiplying by it changes the unit, not the amount'}.`,
    expression: `${n} ${c.start} × ${c.steps.map(([t, b]) => `(${t} / ${b})`).join(' × ')} = ?`, ...a, unit: c.result, difficulty: d, decimal: c.places > 0,
    hint: 'Write each fact as a fraction with the unit you want to remove on the bottom.',
    steps: [...(c.source ? [`Where the factors come from: ${c.source}`] : []), `Set it up so units cancel: ${n} ${c.start} × ${c.steps.map(([t, b]) => `${t}/${b}`).join(' × ')}.`, `Every unit except ${c.result} appears once on top and once underneath, so it cancels.`,
      `Numbers: ${lab(n, c.startLabel ?? `amount in ${c.start}`)} ${c.steps.map(factorMath).join(' ')} ${Number(num(v, c.places)) === v ? '=' : '≈'} ${lab(num(v, c.places), c.resultLabel ?? `amount in ${c.result}`)}.`],
    visual: { type: 'chain', start: `${n} ${c.start}`, factors: c.steps, result: `${num(v, c.places)} ${c.result}` },
  });
}

export function rpmQuestion(dCm: number, rpm: number, minutes: number, ask: 'turns' | 'perTurn' | 'distance', d: Difficulty, rng: Rng, skill = 'rates.rpm'): Question {
  const circ = PI * dCm; const turns = rpm * minutes; const dist = (circ * turns) / 100;
  const thing = rng.pick(['a bike wheel', 'a conveyor roller', 'a cart wheel', 'a winch drum']);
  const lRpm = lab(rpm, 'turns per minute'); const lMin = labn(minutes, 'minute'); const lTurns = labn(turns, 'turn');
  const lPi = lab(PI, 'pi, rounded'); const lD = lab(dCm, 'diameter in cm'); const lCirc = lab(num(circ), 'cm per turn');
  if (ask === 'turns') return mk(skill, 'Turns and travel', { prompt: `${thing[0].toUpperCase() + thing.slice(1)} spins at ${rpm} rpm for ${minutes} minute${minutes === 1 ? '' : 's'}. How many turns is that?`, expression: 'rpm × minutes = ?', answer: turns, unit: 'turns', difficulty: d, hint: 'rpm is revolutions per minute.', steps: [`rpm = revolutions per minute, so turns = rpm × minutes.`, `${lRpm} × ${lMin} = ${lTurns}.`], visual: { type: 'circle', r: dCm / 2, unit: 'cm', show: 'd', wheel: true } });
  if (ask === 'perTurn') { const a = approx(circ, 1); return mk(skill, 'Turns and travel', { prompt: `${thing[0].toUpperCase() + thing.slice(1)} is ${dCm} cm across. How far does it move in one turn? (π ≈ 3.14)`, expression: '3.14 × d = ?', ...a, unit: 'cm', difficulty: d, decimal: true, hint: 'One turn = one circumference.', steps: [`Distance per turn = circumference = π × d. π is about 3.14.`, `${lPi} × ${lD} = ${lCirc}.`], visual: { type: 'circle', r: dCm / 2, unit: 'cm', show: 'd', wheel: true } }); }
  const a = approx(dist, 0);
  return mk(skill, 'Turns and travel', { prompt: `${thing[0].toUpperCase() + thing.slice(1)} ${dCm} cm across spins at ${rpm} rpm for ${minutes} min. How many metres does it move? (π ≈ 3.14)`, expression: 'rpm × min × 3.14 × d ÷ 100 = ? m', ...a, unit: 'm', difficulty: d, decimal: true, hint: 'Turns first, then × circumference, then cm → m.', steps: [`Turns = ${lRpm} × ${lMin} = ${lTurns}.`, `Per turn: ${lPi} × ${lD} = ${lCirc}.`, `${lTurns} × ${lCirc} ${Number(num(circ * turns, 0)) === Number(num(circ)) * turns ? '=' : '≈'} ${lab(num(circ * turns, 0), 'distance in cm')}.`, `There are 100 cm in a metre: ${lab(num(circ * turns, 0), 'distance in cm')} ÷ ${lab(100, 'cm per metre')} ${Number(num(dist, 0)) * 100 === Number(num(circ * turns, 0)) ? '=' : '≈'} ${lab(num(dist, 0), 'distance in m')}.`], visual: { type: 'circle', r: dCm / 2, unit: 'cm', show: 'd', wheel: true } });
}

export function ratesQuestion(kind: RatesKind, d: Difficulty, rng: Rng, skillId?: string): Question {
  const k: Exclude<RatesKind, 'all'> = kind === 'all' ? rng.pick(['ratio', 'usmetric', 'speed', 'flow', 'density', 'chain', 'rpm'] as const) : kind;
  const sid = skillId ?? (kind === 'all' ? 'rates' : `rates.${k}`);
  if (k === 'ratio') { const mix = rng.pick(d <= 2 ? MIXES.slice(0, 2) : MIXES); const i = rng.int(0, mix.parts.length - 1); let j = rng.int(0, mix.parts.length - 1); if (j === i) j = (i + 1) % mix.parts.length; return ratioQuestion(mix, i, j, rng.int(2, d <= 2 ? 6 : 12), d, sid); }
  if (k === 'usmetric') { const c = rng.pick(US_METRIC.filter((u) => u.min <= d)); const toB = d <= 2 ? true : rng.chance(0.6); return usMetricQuestion(c, toB ? rng.int(2, 12) : rng.int(2, 9) * (c.f >= 10 ? 10 : 1), toB, d, sid); }
  if (k === 'speed') { const time = rng.int(1, d <= 2 ? 4 : 8); const speed = rng.pick(d <= 2 ? [20, 30, 40, 50, 60, 80, 100] : [15, 25, 35, 45, 55, 65, 75, 90, 110]); return speedQuestion(speed * time, time, d <= 2 ? 'speed' : rng.pick(['speed', 'distance', 'time'] as const), d, rng, sid); }
  if (k === 'flow') { const rate = rng.pick(d <= 2 ? [2, 4, 5, 10, 20] : [3, 6, 8, 12, 15, 25]); const minutes = rng.int(2, d <= 2 ? 10 : 30); return flowQuestion(rate * minutes, rate, d <= 2 ? 'time' : rng.pick(['time', 'volume', 'rate'] as const), d, rng, sid); }
  if (k === 'density') { const m = rng.pick(d <= 2 ? MATERIALS.filter((x) => Number.isInteger(x.rho * 10)) : MATERIALS); const volume = rng.int(2, d <= 2 ? 10 : 50) * (d <= 2 ? 10 : 1); return densityQuestion(m, volume, d <= 2 ? 'mass' : rng.pick(['density', 'mass', 'volume'] as const), d, sid); }
  if (k === 'chain') { const c = rng.pick(CHAINS.filter((x) => x.min <= d)); return chainQuestion(c, rng.int(2, c.min >= 4 ? 5 : 9), d, sid); }
  const dCm = rng.pick([20, 30, 40, 50, 60, 70]); const rpm = rng.pick(d <= 2 ? [10, 20, 30, 60] : [15, 25, 40, 60, 90, 120]); const minutes = rng.int(1, d <= 2 ? 5 : 10);
  return rpmQuestion(dCm, rpm, minutes, d <= 2 ? rng.pick(['turns', 'perTurn'] as const) : rng.pick(['turns', 'perTurn', 'distance'] as const), d, rng, sid);
}

export const genRates: Generator = (skillId, params, ctx) => ratesQuestion(String(params?.kind ?? 'all') as RatesKind, ctx.difficulty, ctx.rng, skillId);
