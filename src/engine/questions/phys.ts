import type { Difficulty, Question } from '../types';
import type { Rng } from '../rng';
import type { Generator } from './context';
import { pictureQuestion, approx, num, r2, eqSign } from './picture';
import { lab } from '../label';

/**
 * Forces, energy and electricity, with the instrument in the picture:
 *  force      — weight = mass × 10 N/kg (and back)
 *  torque     — torque = force × arm; torque wrench units (N·m, lbf·ft, lbf·in)
 *  lever      — F₁ × d₁ = F₂ × d₂
 *  pressure   — pressure = force ÷ area; psi ↔ kPa; head of water
 *  work       — work = force × distance (J)
 *  power      — power = work ÷ time (W); kWh = kW × h and what it costs
 *  electric   — V = I × R and P = V × I on a low-voltage circuit
 *  expansion  — a bar grows α × L × ΔT (µm per metre per °C)
 */
export type PhysKind = 'force' | 'torque' | 'lever' | 'pressure' | 'work' | 'power' | 'electric' | 'expansion' | 'all';
export const PHYS_KINDS: { id: PhysKind; label: string; short: string; desc: string }[] = [
  { id: 'all', label: 'Mixed forces', short: 'Mixed', desc: 'Force, torque, levers, pressure, work, power, circuits, thermal expansion.' },
  { id: 'force', label: 'Weight and mass', short: 'Force', desc: 'Weight is a force: about 10 N for every kilogram.' },
  { id: 'torque', label: 'Torque', short: 'Torque', desc: 'Torque = force × arm. N·m, lbf·ft, lbf·in: read the wrench spec in the right unit.' },
  { id: 'lever', label: 'Levers', short: 'Lever', desc: 'Force × distance balances force × distance.' },
  { id: 'pressure', label: 'Pressure', short: 'Pressure', desc: 'Force ÷ area. kPa, bar, psi. Ten metres of water is about one bar.' },
  { id: 'work', label: 'Work', short: 'Work', desc: 'Work = force × distance, in joules.' },
  { id: 'power', label: 'Power and energy', short: 'Power', desc: 'Power = work ÷ time (W). kWh = kW × hours.' },
  { id: 'electric', label: 'Volts, amps, ohms', short: 'Electric', desc: 'V = I × R. P = V × I. Low-voltage circuits.' },
  { id: 'expansion', label: 'Thermal expansion', short: 'Expansion', desc: 'Steel grows 12 µm per metre per °C. Pipes and rails need room.' },
];

const T = 'Forces & power';
const mk = (skill: string, sub: string, o: Parameters<typeof pictureQuestion>[4]) => pictureQuestion('phys', T, skill, sub, o);
const G = 10;

export function forceQuestion(mass: number, ask: 'weight' | 'mass', d: Difficulty, rng: Rng, skill = 'phys.force'): Question {
  const thing = rng.pick(['engine block', 'sack of cement', 'toolbox', 'water drum', 'steel beam']); const w = mass * G;
  if (ask === 'weight') return mk(skill, 'Weight and mass', { prompt: `${/^[aeiou]/.test(thing) ? 'An' : 'A'} ${thing} has a mass of ${mass} kg. What is its weight, in newtons? (use 10 N per kg)`, expression: `${mass} × 10 = ?`, answer: w, unit: 'N', difficulty: d, hint: 'Weight is the pull of gravity on a mass: about 10 N for each kg.', steps: [`Mass (kg) is how much stuff; weight (N) is the force gravity pulls it with.`, `${lab(mass, 'mass in kg')} × ${lab(10, 'newtons per kg')} = ${lab(w, 'weight in newtons')}.`, `On Earth the true figure is 9.8 N/kg; 10 is close enough for estimates.`], visual: { type: 'hang', mass, unit: 'kg', show: 'mass' } });
  return mk(skill, 'Weight and mass', { prompt: `The hook scale reads ${w} N for this ${thing}. What is its mass in kg? (10 N per kg)`, expression: `${w} ÷ 10 = ?`, answer: mass, unit: 'kg', difficulty: d, hint: `Newtons ÷ ${lab(10, 'newtons per kg')} gives kilograms.`, steps: [`Gravity pulls about 10 N on each kg, so weight = mass × ${lab(10, 'newtons per kg')} and mass = weight ÷ ${lab(10, 'newtons per kg')}.`, `${lab(w, 'weight in newtons')} ÷ ${lab(10, 'newtons per kg')} = ${lab(mass, 'mass in kg')}.`], visual: { type: 'hang', mass, unit: 'N', show: 'weight' } });
}

export function torqueQuestion(force: number, armM: number, ask: 'torque' | 'force' | 'arm' | 'ftin' | 'nmft', d: Difficulty, rng: Rng, skill = 'phys.torque'): Question {
  const tq = r2(force * armM);
  if (ask === 'torque') return mk(skill, 'Torque', { prompt: `You push with ${force} N at the end of a ${num(armM, 2)} m wrench. What torque is on the bolt?`, expression: 'F × arm = ?', answer: tq, unit: 'N·m', difficulty: d, decimal: true, hint: 'Torque = force × distance from the pivot.', steps: [`Torque = force × arm (the distance from the bolt to where you push, at right angles).`, `${lab(force, 'force in newtons')} × ${lab(num(armM, 2), 'arm in m')} = ${lab(num(tq, 2), 'torque in newton-metres')}.`, `A longer wrench gives more torque for the same push.`], visual: { type: 'torque', force, arm: armM, unit: 'N·m' } });
  if (ask === 'force') return mk(skill, 'Torque', { prompt: `A wheel nut needs ${num(tq, 2)} N·m. Your wrench is ${num(armM, 2)} m long. How hard must you push?`, expression: 'torque ÷ arm = ?', answer: force, unit: 'N', difficulty: d, decimal: true, hint: 'Force = torque ÷ arm.', steps: [`Torque = force × arm, so force = torque ÷ arm.`, `${lab(num(tq, 2), 'torque in newton-metres')} ÷ ${lab(num(armM, 2), 'arm in m')} = ${lab(force, 'force in newtons')}.`], visual: { type: 'torque', force, arm: armM, unit: 'N·m', hide: 'force' } });
  if (ask === 'arm') return mk(skill, 'Torque', { prompt: `You can push with ${force} N and the bolt needs ${num(tq, 2)} N·m. How long a wrench do you need, in metres?`, expression: 'torque ÷ force = ?', answer: armM, unit: 'm', difficulty: d, decimal: true, hint: 'Arm = torque ÷ force.', steps: [`Torque = force × arm, so arm = torque ÷ force.`, `${lab(num(tq, 2), 'torque in newton-metres')} ÷ ${lab(force, 'force in newtons')} = ${lab(num(armM, 2), 'arm in m')}.`], visual: { type: 'torque', force, arm: armM, unit: 'N·m', hide: 'arm' } });
  if (ask === 'ftin') { const ft = rng.int(5, 40); return mk(skill, 'Torque', { prompt: `A manual specifies ${ft} lbf·ft. Your torque wrench is marked in lbf·in. What setting?`, expression: `${ft} × 12 = ?`, answer: ft * 12, unit: 'lbf·in', difficulty: d, hint: '1 ft = 12 in, so 1 lbf·ft = 12 lbf·in.', steps: [`Torque units are force × length. 1 ft = 12 in, so 1 lbf·ft = 12 lbf·in.`, `${lab(ft, 'torque in pound-feet')} × ${lab(12, 'inches in a foot')} = ${lab(ft * 12, 'torque in pound-inches')}.`, `Setting a lbf·in wrench to just ${lab(ft, 'the pound-feet number')} would under-tighten by 12 times.`], visual: { type: 'card', title: 'Torque spec', lines: [`${ft} lbf·ft`, 'wrench scale: lbf·in'] } }); }
  const nm = rng.int(10, 120); const a = approx(nm * 0.7376, 1);
  return mk(skill, 'Torque', { prompt: `A spec says ${nm} N·m. Your wrench reads lbf·ft (1 N·m ≈ 0.7376 lbf·ft). What setting?`, expression: `${nm} × 0.7376 = ?`, ...a, unit: 'lbf·ft', difficulty: d, decimal: true, hint: `Multiply N·m by ${lab(0.7376, 'pound-feet per newton-metre')}.`, steps: [`1 N·m ≈ 0.7376 lbf·ft, the factor given in the question (a newton is smaller than a pound-force, a metre bigger than a foot).`, `${lab(nm, 'torque in newton-metres')} × ${lab(0.7376, 'pound-feet per newton-metre')} ${eqSign(nm * 0.7376, num(nm * 0.7376, 1))} ${lab(num(nm * 0.7376, 1), 'torque in pound-feet')}.`], visual: { type: 'card', title: 'Torque spec', lines: [`${nm} N·m`, 'wrench scale: lbf·ft'] } });
}

export function leverQuestion(f1: number, d1: number, f2: number, d2: number, hide: 'f1' | 'd1' | 'f2' | 'd2', d: Difficulty, rng: Rng, skill = 'phys.lever'): Question {
  const thing = rng.pick(['crowbar', 'seesaw', 'lever bar', 'wheelbarrow handle', 'pry bar']);
  const ans = hide === 'f1' ? f1 : hide === 'd1' ? d1 : hide === 'f2' ? f2 : d2;
  const isF = hide === 'f1' || hide === 'f2';
  const leftKnown = hide === 'f2' || hide === 'd2';
  const kF = leftKnown ? lab(f1, 'left force in N') : lab(f2, 'right force in N'); const kD = leftKnown ? lab(num(d1, 2), 'left distance in m') : lab(num(d2, 2), 'right distance in m');
  const kT = lab(num(leftKnown ? f1 * d1 : f2 * d2, 2), 'torque in newton-metres');
  const other = hide === 'f1' ? lab(num(d1, 2), 'left distance in m') : hide === 'd1' ? lab(f1, 'left force in N') : hide === 'f2' ? lab(num(d2, 2), 'right distance in m') : lab(f2, 'right force in N');
  const found = lab(num(ans, 2), { f1: 'left force in N', d1: 'left distance in m', f2: 'right force in N', d2: 'right distance in m' }[hide]);
  return mk(skill, 'Levers', {
    prompt: `A ${thing} balances on its pivot. Left: ${hide === 'f1' ? '?' : f1 + ' N'} at ${hide === 'd1' ? '?' : num(d1, 2) + ' m'}. Right: ${hide === 'f2' ? '?' : f2 + ' N'} at ${hide === 'd2' ? '?' : num(d2, 2) + ' m'}. Find the missing value.`,
    expression: 'F₁ × d₁ = F₂ × d₂', answer: ans, unit: isF ? 'N' : 'm', difficulty: d, decimal: !Number.isInteger(ans), hint: 'The two sides have equal torque about the pivot.',
    steps: [`Balance means torque left = torque right: F₁ × d₁ = F₂ × d₂.`, `Known side: ${kF} × ${kD} = ${kT}.`, `${isF ? 'Force' : 'Distance'} = ${kT} ÷ ${other} = ${found}.`, `A small force far from the pivot balances a big force close to it.`],
    visual: { type: 'lever', f1, d1, f2, d2, hide },
  });
}

export function pressureQuestion(mode: 'fa' | 'psikpa' | 'kpapsi' | 'head', a: number, b: number, d: Difficulty, _rng: Rng, skill = 'phys.pressure'): Question {
  if (mode === 'fa') { const p = a / b; const ans = approx(p, 1); return mk(skill, 'Pressure', { prompt: `A ${a} N load rests on a pad of ${num(b, 3)} m². What pressure is that, in pascals (N/m²)?`, expression: 'F ÷ A = ?', ...ans, unit: 'Pa', difficulty: d, decimal: true, hint: 'Pressure = force ÷ area.', steps: [`Pressure = force ÷ area: the same force on a smaller area presses harder.`, `${lab(a, 'force in newtons')} ÷ ${lab(num(b, 3), 'area in m²')} ${eqSign(p, num(p, 1))} ${lab(num(p, 1), 'pressure in pascals')}.`, `1000 Pa = 1 kPa; a car tyre is about 220 kPa.`], visual: { type: 'piston', force: a, area: b } }); }
  if (mode === 'psikpa') { const k = approx(a * 6.895, 0); return mk(skill, 'Pressure', { prompt: `A tyre placard says ${a} psi. What is that in kPa? (1 psi ≈ 6.895 kPa)`, expression: `${a} × 6.895 = ?`, ...k, unit: 'kPa', difficulty: d, decimal: true, hint: `Multiply psi by about ${lab(6.9, 'kPa per psi')}.`, steps: [`1 psi (pound per square inch) ≈ 6.895 kPa, the factor given in the question.`, `${lab(a, 'pressure in psi')} × ${lab(6.895, 'kPa per psi')} ${eqSign(a * 6.895, num(a * 6.895, 0))} ${lab(num(a * 6.895, 0), 'pressure in kPa')}.`], visual: { type: 'dial', max: 60, major: 10, divisions: 5, value: Math.min(58, a), unit: 'psi' } }); }
  if (mode === 'kpapsi') { const k = approx(a / 6.895, 1); return mk(skill, 'Pressure', { prompt: `A gauge reads ${a} kPa. What is that in psi? (1 psi ≈ 6.895 kPa)`, expression: `${a} ÷ 6.895 = ?`, ...k, unit: 'psi', difficulty: d, decimal: true, hint: `Divide kPa by about ${lab(6.9, 'kPa per psi')}.`, steps: [`1 psi ≈ 6.895 kPa, the factor given in the question, so divide.`, `${lab(a, 'pressure in kPa')} ÷ ${lab(6.895, 'kPa per psi')} ${eqSign(a / 6.895, num(a / 6.895, 1))} ${lab(num(a / 6.895, 1), 'pressure in psi')}.`, `100 kPa is about 1 bar, which is about 14.5 psi.`], visual: { type: 'card', title: 'Gauge', lines: [`${a} kPa`, '1 psi ≈ 6.895 kPa'] } }); }
  const kpa = a * 9.81; const ans = approx(kpa, 0);
  return mk(skill, 'Pressure', { prompt: `A water tank sits ${a} m above a tap. What pressure does that height give at the tap, in kPa? (each metre of water ≈ 9.81 kPa)`, expression: `${a} × 9.81 = ?`, ...ans, unit: 'kPa', difficulty: d, decimal: true, hint: 'Head pressure comes only from height, not tank size.', steps: [`Water pressure from height (head) ≈ 9.81 kPa per metre.`, `${lab(a, 'height in m')} × ${lab(9.81, 'kPa per metre of water')} ${eqSign(kpa, num(kpa, 0))} ${lab(num(kpa, 0), 'pressure in kPa')}.`, `100 kPa is 1 bar: ${lab(num(kpa, 0), 'pressure in kPa')} ÷ ${lab(100, 'kPa in a bar')} ≈ ${lab(num(kpa / 100, 2), 'pressure in bar')}. A wider tank does not add pressure; only height does.`], visual: { type: 'head', height: a, unit: 'm' } });
}

export function workQuestion(force: number, dist: number, ask: 'work' | 'force' | 'distance', d: Difficulty, rng: Rng, skill = 'phys.work'): Question {
  const w = force * dist; const thing = rng.pick(['crate', 'trolley', 'sled', 'pallet']);
  const ans = ask === 'work' ? w : ask === 'force' ? force : dist;
  return mk(skill, 'Work', {
    prompt: ask === 'work' ? `You push a ${thing} with ${force} N for ${dist} m. How much work is done, in joules?` : ask === 'force' ? `Moving a ${thing} ${dist} m took ${w} J of work. What force was used?` : `A ${force} N push did ${w} J of work on a ${thing}. How far did it move?`,
    expression: ask === 'work' ? 'F × d = ?' : ask === 'force' ? 'W ÷ d = ?' : 'W ÷ F = ?', answer: ans, unit: ask === 'work' ? 'J' : ask === 'force' ? 'N' : 'm', difficulty: d, hint: 'Work = force × distance moved in the direction of the force.',
    steps: [`Work (J) = force (N) × distance (m). 1 J = 1 N·m.`, ask === 'work' ? `${lab(force, 'force in newtons')} × ${lab(dist, 'distance in m')} = ${lab(w, 'work in joules')}.` : ask === 'force' ? `${lab(w, 'work in joules')} ÷ ${lab(dist, 'distance in m')} = ${lab(force, 'force in newtons')}.` : `${lab(w, 'work in joules')} ÷ ${lab(force, 'force in newtons')} = ${lab(dist, 'distance in m')}.`, `Holding a load still does no work, however heavy it feels.`],
    visual: { type: 'push', force, distance: dist, hide: ask === 'work' ? undefined : ask },
  });
}

export function powerQuestion(mode: 'power' | 'kwh' | 'cost' | 'time', a: number, b: number, price: number, d: Difficulty, _rng: Rng, skill = 'phys.power'): Question {
  if (mode === 'power') { const p = a / b; const ans = approx(p, 0); return mk(skill, 'Power and energy', { prompt: `A hoist does ${a} J of work in ${b} s. What is its power, in watts?`, expression: 'W ÷ t = ?', ...ans, unit: 'W', difficulty: d, decimal: true, hint: 'Power = work ÷ time. 1 W = 1 J per second.', steps: [`Power is how fast work is done: joules per second, watts.`, `${lab(a, 'work in joules')} ÷ ${lab(b, 'time in seconds')} ${eqSign(p, num(p, 0))} ${lab(num(p, 0), 'power in watts')}.`], visual: { type: 'ftri', top: 'W', left: 'P', right: 't', known: { W: `${a} J`, t: `${b} s` }, ask: 'P' } }); }
  if (mode === 'kwh') { const e = r2(a * b); return mk(skill, 'Power and energy', { prompt: `A ${num(a, 1)} kW heater runs for ${b} hours. How many kilowatt-hours does it use?`, expression: 'kW × h = ?', answer: e, unit: 'kWh', difficulty: d, decimal: true, hint: 'Energy = power × time.', steps: [`Energy (kWh) = power (kW) × time (h).`, `${lab(num(a, 1), 'power in kW')} × ${lab(b, 'time in hours')} = ${lab(num(e, 1), 'energy in kWh')}.`, `A kWh is what the meter counts; a kW is how fast you are using it right now.`], visual: { type: 'card', title: 'Electricity meter', lines: [`${num(a, 1)} kW`, `${b} h`] } }); }
  if (mode === 'cost') { const e = r2(a * b); const c = approx(e * price, 2); return mk(skill, 'Power and energy', { prompt: `A ${num(a, 1)} kW machine runs ${b} h at ${num(price, 2)} per kWh. What does it cost?`, expression: 'kW × h × price = ?', ...c, unit: '', difficulty: d, decimal: true, hint: 'kWh first, then × price.', steps: [`Energy: ${lab(num(a, 1), 'power in kW')} × ${lab(b, 'time in hours')} = ${lab(num(e, 1), 'energy in kWh')}.`, `Cost: ${lab(num(e, 1), 'energy in kWh')} × ${lab(num(price, 2), 'price per kWh')} = ${lab(num(e * price, 2), 'cost')}.`], visual: { type: 'card', title: 'Electricity meter', lines: [`${num(a, 1)} kW`, `${b} h`, `${num(price, 2)} per kWh`] } }); }
  const t = a / b; const ans = approx(t, 1);
  return mk(skill, 'Power and energy', { prompt: `A ${b} W pump must do ${a} J of work. How many seconds does it take?`, expression: 'W ÷ P = ?', ...ans, unit: 's', difficulty: d, decimal: true, hint: 'Time = work ÷ power.', steps: [`Power = work ÷ time, so time = work ÷ power.`, `${lab(a, 'work in joules')} ÷ ${lab(b, 'power in watts')} ${eqSign(t, num(t, 1))} ${lab(num(t, 1), 'time in seconds')}.`], visual: { type: 'ftri', top: 'W', left: 'P', right: 't', known: { W: `${a} J`, P: `${b} W` }, ask: 't' } });
}

export function electricQuestion(v: number, i: number, r: number, ask: 'v' | 'i' | 'r' | 'p', d: Difficulty, skill = 'phys.electric'): Question {
  const p = r2(v * i);
  /** i is rounded to 2 places, so show ≈ when a step uses the rounded current. */
  const eq = Math.abs(i * r - v) < 1e-9 ? '=' : '≈';
  const ans = ask === 'v' ? v : ask === 'i' ? i : ask === 'r' ? r : p;
  return mk(skill, 'Volts, amps, ohms', {
    prompt: ask === 'v' ? `${num(i, 2)} A flows through a ${r} Ω resistor. What voltage is across it?` : ask === 'i' ? `A ${v} V battery drives a ${r} Ω lamp. What current flows, in amps?` : ask === 'r' ? `${v} V pushes ${num(i, 2)} A through a heater. What is its resistance?` : `A ${v} V supply delivers ${num(i, 2)} A to a motor. What power is that, in watts?`,
    expression: ask === 'v' ? 'I × R = ?' : ask === 'i' ? 'V ÷ R = ?' : ask === 'r' ? 'V ÷ I = ?' : 'V × I = ?', answer: ans, unit: ask === 'v' ? 'V' : ask === 'i' ? 'A' : ask === 'r' ? 'Ω' : 'W', difficulty: d, decimal: !Number.isInteger(ans),
    hint: ask === 'p' ? 'Power = volts × amps.' : 'Ohm’s law: V = I × R. Cover the one you want.',
    steps: [ask === 'p' ? `Power (W) = voltage (V) × current (A).` : `Ohm’s law: V = I × R, so I = V ÷ R and R = V ÷ I.`, ask === 'v' ? `${lab(num(i, 2), 'current in amps')} × ${lab(r, 'resistance in ohms')} ${eq} ${lab(v, 'voltage in volts')}.` : ask === 'i' ? `${lab(v, 'voltage in volts')} ÷ ${lab(r, 'resistance in ohms')} ${eq} ${lab(num(i, 2), 'current in amps')}.` : ask === 'r' ? `${lab(v, 'voltage in volts')} ÷ ${lab(num(i, 2), 'current in amps')} ${eq} ${lab(r, 'resistance in ohms')}.` : `${lab(v, 'voltage in volts')} × ${lab(num(i, 2), 'current in amps')} = ${lab(num(p, 2), 'power in watts')}.`, `Volts push, amps flow, ohms resist. A meter in series reads amps; across a part it reads volts.`],
    visual: { type: 'circuit', v, i, r, ask },
  });
}

export const ALPHA: { name: string; a: number }[] = [{ name: 'steel', a: 12 }, { name: 'concrete', a: 12 }, { name: 'copper', a: 17 }, { name: 'aluminium', a: 23 }, { name: 'PVC', a: 70 }];
export function expansionQuestion(m: (typeof ALPHA)[number], lengthM: number, dT: number, unitOut: 'um' | 'mm', d: Difficulty, rng: Rng, skill = 'phys.expansion'): Question {
  const um = m.a * lengthM * dT; const thing = rng.pick(['pipe run', 'rail', 'beam', 'bus bar', 'gutter']);
  const ans = unitOut === 'um' ? { answer: um, tolerance: 0 } : approx(um / 1000, 2);
  return mk(skill, 'Thermal expansion', {
    prompt: `A ${lengthM} m ${m.name} ${thing} warms by ${dT} °C. ${m.name[0].toUpperCase() + m.name.slice(1)} expands ${m.a} µm per metre per °C. How much longer does it get, in ${unitOut === 'um' ? 'µm' : 'mm'}?`,
    expression: `${m.a} × ${lengthM} × ${dT} = ?${unitOut === 'mm' ? ' µm → mm' : ''}`, ...ans, unit: unitOut === 'um' ? 'µm' : 'mm', difficulty: d, decimal: unitOut === 'mm', hint: 'Growth = coefficient × length × temperature change.',
    steps: [`ΔL = α × L × ΔT. α is in µm per metre per °C.`, `${lab(m.a, 'micrometres per metre per degree')} × ${lab(lengthM, 'length in m')} × ${lab(dT, 'temperature rise in degrees C')} = ${lab(um, 'growth in micrometres')}.`, `1000 µm = 1 mm: ${lab(um, 'growth in micrometres')} ÷ ${lab(1000, 'micrometres in a mm')} ${eqSign(um / 1000, num(um / 1000, 2))} ${lab(num(um / 1000, 2), 'growth in mm')}.`, `PVC moves about six times more than steel: long plastic runs need expansion loops.`],
    visual: { type: 'expand', length: lengthM, dT, material: m.name, growth: um },
  });
}

export function physQuestion(kind: PhysKind, d: Difficulty, rng: Rng, skillId?: string): Question {
  const k: Exclude<PhysKind, 'all'> = kind === 'all' ? rng.pick(['force', 'torque', 'lever', 'pressure', 'work', 'power', 'electric', 'expansion'] as const) : kind;
  const sid = skillId ?? (kind === 'all' ? 'phys' : `phys.${k}`);
  if (k === 'force') return forceQuestion(rng.int(2, d <= 2 ? 30 : 250), d <= 2 ? 'weight' : rng.pick(['weight', 'mass'] as const), d, rng, sid);
  if (k === 'torque') { const arm = rng.pick([0.2, 0.25, 0.3, 0.4, 0.5]); const force = rng.int(2, 30) * 10; const ask = d <= 2 ? 'torque' : rng.pick(['torque', 'force', 'arm', 'ftin', 'nmft'] as const); return torqueQuestion(force, arm, ask, d, rng, sid); }
  if (k === 'lever') { const f1 = rng.int(2, 12) * 10; const d1 = rng.pick([0.2, 0.25, 0.4, 0.5, 1]); const d2 = rng.pick([0.5, 1, 1.5, 2, 2.5].filter((x) => x > d1)); const f2 = r2((f1 * d1) / d2); if (!Number.isInteger(f2 * 2)) return leverQuestion(f1, 1, f1 / 2, 2, d <= 2 ? 'f2' : rng.pick(['f1', 'd1', 'f2', 'd2'] as const), d, rng, sid); return leverQuestion(f1, d1, f2, d2, d <= 2 ? 'f2' : rng.pick(['f1', 'd1', 'f2', 'd2'] as const), d, rng, sid); }
  if (k === 'pressure') { const mode = d <= 2 ? rng.pick(['fa', 'psikpa'] as const) : rng.pick(['fa', 'psikpa', 'kpapsi', 'head'] as const); if (mode === 'fa') return pressureQuestion('fa', rng.int(1, 20) * 100, rng.pick([0.1, 0.2, 0.25, 0.5, 2, 4]), d, rng, sid); if (mode === 'psikpa') return pressureQuestion('psikpa', rng.pick([30, 32, 35, 40, 45, 50]), 0, d, rng, sid); if (mode === 'kpapsi') return pressureQuestion('kpapsi', rng.pick([100, 150, 200, 220, 250, 300, 400]), 0, d, rng, sid); return pressureQuestion('head', rng.int(2, 30), 0, d, rng, sid); }
  if (k === 'work') return workQuestion(rng.int(2, 40) * 10, rng.int(2, 25), d <= 2 ? 'work' : rng.pick(['work', 'force', 'distance'] as const), d, rng, sid);
  if (k === 'power') { const mode = d <= 2 ? rng.pick(['power', 'kwh'] as const) : rng.pick(['power', 'kwh', 'cost', 'time'] as const); if (mode === 'power' || mode === 'time') { const p = rng.int(1, 20) * 50; const t = rng.int(2, 60); return powerQuestion(mode, p * t, mode === 'power' ? t : p, 0, d, rng, sid); } return powerQuestion(mode, rng.pick([0.5, 1, 1.5, 2, 2.5, 3]), rng.int(1, 12), rng.pick([0.2, 0.25, 0.3, 0.4]), d, rng, sid); }
  if (k === 'electric') { const r = rng.pick(d <= 2 ? [2, 3, 4, 6, 12] : [2, 3, 4, 5, 6, 8, 10, 12, 24, 48]); const v = rng.pick([6, 12, 24, 48].filter((x) => x % r === 0 || d >= 3)); const i = r2(v / r); return electricQuestion(v, i, r, d <= 2 ? rng.pick(['i', 'p'] as const) : rng.pick(['v', 'i', 'r', 'p'] as const), d, sid); }
  const m = rng.pick(d <= 2 ? ALPHA.slice(0, 2) : ALPHA); return expansionQuestion(m, rng.int(2, d <= 2 ? 10 : 40), rng.int(5, d <= 2 ? 20 : 60), d <= 2 ? 'um' : rng.pick(['um', 'mm'] as const), d, rng, sid);
}

export const genPhys: Generator = (skillId, params, ctx) => physQuestion(String(params?.kind ?? 'all') as PhysKind, ctx.difficulty, ctx.rng, skillId);
