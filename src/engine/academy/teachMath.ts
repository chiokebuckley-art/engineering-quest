import type { TeachCard } from './defs';
import { stripLabels } from '../label';

/**
 * Checks the plain-number arithmetic in teach cards: every run like "0.25 × 40 = 10" or "(2 × 20)/(5 × 20) = 40/100"
 * whose sides are only numbers and + − × ÷ / ^ ² ³ √ ( ) is evaluated, and each "=" must hold. Anything with a letter,
 * a unit inside the run, or ≈ is skipped: this catches slips in worked arithmetic, not every statement on a card.
 */
function evaluate(side: string): number | null {
  let s = side.trim().replace(/,(?=\d{3}\b)/g, '').replace(/−/g, '-').replace(/×/g, '*').replace(/÷/g, '/').replace(/\^/g, '**').replace(/²/g, '**2').replace(/³/g, '**3');
  s = s.replace(/√\s*(\d+(?:\.\d+)?|\([^()]*\))/g, 'Math.sqrt($1)');
  if (!/^[\d\s.()+\-*/Mathsqrt]+$/.test(s) || !/\d/.test(s)) return null;
  try { const v = Function(`"use strict"; return (${s});`)(); return typeof v === 'number' && Number.isFinite(v) ? v : null; } catch { return null; }
}
/** Words that say an equation is false on purpose ("6 = 5 is impossible"). */
const FALSE_ON_PURPOSE = /\b(false|never|impossible|not|no solution|contradiction|cannot|can’t|can't|wrong|mistake|trap)\b|≠/i;
/** Each numeric equality run in a line, with the sides that do not agree. */
export function arithmeticSlips(raw: string): string[] {
  const out: string[] = []; const line = stripLabels(raw);
  if (FALSE_ON_PURPOSE.test(line)) return out;
  // A power written with superscripts (2⁶) is read as its own run, so a run glued to one is skipped below.
  const re = /[\d(√−-][\d\s.,()+\-−×÷*/^²³√=]*[\d)²³]/g;
  for (let m = re.exec(line); m; m = re.exec(line)) {
    const run = m[0], before = line.slice(0, m.index), after = line.slice(m.index + run.length);
    if (!run.includes('=')) continue;
    // Function notation, logs and inverse trig (f(2), log₂ 32, sin⁻¹(1/2)), or a unit or variable glued on (40%, 30°, 2x): not plain arithmetic.
    if (/[\p{L}′″‴’⁰¹²³⁴⁵⁶⁷⁸⁹⁻₀-₉|∛∜ⁿ]\s?$/u.test(before) || /^[%°\p{L}′⁰¹²³⁴⁵⁶⁷⁸⁹⁻]/u.test(after) || /^\s*(tens?|ones?|hundreds?|thousands?|tenths?|hundredths?)\b/i.test(after)) continue;
    if (/≈/.test(before.slice(-3))) continue;
    // Part of a bigger expression that has a letter in it (x + 3 = 8, 4 cm × 5 = 20 cm, 4/6 = 10/x).
    if (/[+\-−×÷*/^=(,]\s*$/.test(before) || /^\s*[+\-−×÷*/^)]/.test(after)) continue;
    const sides = run.split('=');
    if (sides.some((x) => !x.trim())) continue;
    const vals = sides.map(evaluate);
    if (vals.some((v) => v === null)) continue;
    for (let i = 1; i < vals.length; i++) if (Math.abs(vals[i]! - vals[0]!) > 1e-6 * Math.max(1, Math.abs(vals[0]!))) out.push(`${run.trim()}  (${sides[0].trim()} = ${vals[0]} but ${sides[i].trim()} = ${vals[i]})`);
  }
  return out;
}
export const cardSlips = (card: Pick<TeachCard, 'text' | 'steps'>) => [card.text, ...(card.steps ?? [])].flatMap(arithmeticSlips);
