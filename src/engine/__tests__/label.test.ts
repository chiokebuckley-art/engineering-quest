import { describe, expect, it } from 'vitest';
import { LABELED, lab, labn, stripLabels, unit } from '../label';
import { arithmeticSlips } from '../academy/teachMath';

const labels = (s: string) => [...s.matchAll(new RegExp(LABELED.source, 'g'))].map((m) => `${m[1]}|${m[2]}`);
describe('number labels', () => {
  it('finds a label right after a number, never maths brackets', () => {
    expect(labels('40 (total coins) ÷ 20 (equal segments) = 2 (coins per segment)')).toEqual(['40|total coins', '20|equal segments', '2|coins per segment']);
    expect(labels('25% (share to take) of 40 (coins) is ? (coins)')).toEqual(['25%|share to take', '40|coins', '?|coins']);
    expect(labels('5 (length in cm²) and 3/4 (of the plank)')).toEqual(['5|length in cm²', '3/4|of the plank']);
    expect(labels('10π (circumference in cm), 4√3 (long leg in m), 4π/3 (radians), √2 (diagonal)')).toEqual(['10π|circumference in cm', '4√3|long leg in m', '4π/3|radians', '√2|diagonal']);
    expect(labels('2 × (x + 3) = (2 × 20)/(5 × 20), f(2) = 7, 3 (x), e^(ln 2)')).toEqual([]);
  });
  it('strips labels for the maths checks, so wrong arithmetic is still caught', () => {
    expect(stripLabels('40 (total coins) ÷ 20 (equal segments) = 2 (coins per segment)')).toBe('40 ÷ 20 = 2');
    expect(arithmeticSlips('40 (total coins) ÷ 20 (equal segments) = 2 (coins per segment)')).toEqual([]);
    expect(arithmeticSlips('40 (total coins) ÷ 20 (equal segments) = 3 (coins per segment)')).toHaveLength(1);
  });
  it('writes labels with the right singular or plural', () => {
    expect([unit(1, 'coin'), unit(2, 'coin'), unit(3, 'box', 'boxes')]).toEqual(['coin', 'coins', 'boxes']);
    expect([lab(40, 'total coins'), labn(1, 'coin'), labn(4, 'coin'), labn(1, 'coin per segment', 'coins per segment')]).toEqual(['40 (total coins)', '1 (coin)', '4 (coins)', '1 (coin per segment)']);
  });
});
