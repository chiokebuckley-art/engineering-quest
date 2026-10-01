import { describe, it, expect } from 'vitest';
import { evaluate, formatResult } from '../calc';

const v = (s: string, rad = false) => { const r = evaluate(s, rad); if (!r.ok) throw new Error(`${s}: ${r.error}`); return r.value; };

describe('calculator', () => {
  it('follows the order of operations', () => {
    expect(v('2 + 3 × 4')).toBe(14);
    expect(v('(2 + 3) × 4')).toBe(20);
    expect(v('2^3^2')).toBe(512);
    expect(v('−3^2')).toBe(-9);
    expect(v('(−3)^2')).toBe(9);
    expect(v('12 ÷ 4 ÷ 3')).toBe(1);
    expect(v('2 − −3')).toBe(5);
  });
  it('handles implied multiplication and constants', () => {
    expect(v('2π')).toBeCloseTo(2 * Math.PI);
    expect(v('3(4 + 1)')).toBe(15);
    expect(v('(1 + 1)(2 + 3)')).toBe(10);
    expect(v('2e')).toBeCloseTo(2 * Math.E);
  });
  it('does trig in degrees by default and radians on request', () => {
    expect(v('sin 30')).toBeCloseTo(0.5);
    expect(v('12 tan 60')).toBeCloseTo(20.7846, 3);
    expect(v('cos⁻¹(0.5)')).toBeCloseTo(60);
    expect(v('tan⁻¹(7 ÷ 10)')).toBeCloseTo(34.99, 2);
    expect(v('sin(π ÷ 6)', true)).toBeCloseTo(0.5);
    expect(v('2sin 30')).toBeCloseTo(1);
  });
  it('does logs, roots and powers', () => {
    expect(v('ln 3 ÷ 0.4')).toBeCloseTo(2.7465, 3);
    expect(v('log 1000')).toBeCloseTo(3);
    expect(v('ln(50) ÷ ln(7)')).toBeCloseTo(2.0104, 3);
    expect(v('√(16) + √9')).toBe(7);
    expect(v('5000(1.2)^3')).toBeCloseTo(8640);
  });
  it('reports errors instead of throwing', () => {
    for (const bad of ['', '2 +', '(2 + 3', '2 + 3)', '1.2.3', '5 $ 3', 'sin']) expect(evaluate(bad).ok).toBe(false);
    expect(evaluate('√(−1)').ok).toBe(false);
    expect(evaluate('1 ÷ 0').ok).toBe(false);
  });
  it('formats results without float noise', () => {
    expect(formatResult(0.1 + 0.2)).toBe('0.3');
    expect(formatResult(-2.5)).toBe('−2.5');
    expect(formatResult(20.784609690826528)).toBe('20.78461');
    expect(formatResult(1e-15)).toBe('0');
  });
});
