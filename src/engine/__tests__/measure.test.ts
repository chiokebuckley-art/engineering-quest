import { describe, it, expect } from 'vitest';
import { rulerQuestion, inchesQuestion, dialQuestion, tempQuestion, timeQuestion, estimateQuestion, convertQuestion, shapeQuestion, measureQuestion, CONVERSIONS, MEASURE_PATH } from '../questions/measure';
import { createRng } from '../rng';
import { checkAnswer, generateQuestion } from '../questions';
import { parseSelection, drawSeeded, blitzStars } from '../state/arcade';
import { lessonById } from '../../content/lessons';
import { skillById, componentSkills } from '../curriculum/skills';
import { variantsFor } from '../notebook/notebook';
import { stripLabels } from '../label';

describe('Measurement', () => {
  it('reads a ruler in mm, and subtracts the start when the object is not at zero', () => {
    const rng = createRng(1);
    const q = rulerQuestion(0, 47, 2, rng);
    expect(q.answer).toBe(47); expect(q.unit).toBe('mm'); expect(q.visualFirst).toBe(true);
    expect(q.explanation.join(' ')).toContain('each small mark is 1 mm');
    const off = rulerQuestion(20, 67, 4, rng);
    expect(off.answer).toBe(47); expect(stripLabels(off.explanation.join(' '))).toContain('67 − 20 = 47');
  });

  it('counts eighths and sixteenths past the inch number', () => {
    const rng = createRng(2);
    const q = inchesQuestion(2, 3, 8, 2, rng);
    expect(q.answer).toBe(3); expect(q.expression).toBe('2 and ?/8 in'); expect(q.explanation.join(' ')).toContain('2 and 3/8 in');
    const half = inchesQuestion(1, 4, 8, 2, rng);
    expect(stripLabels(half.explanation.join(' '))).toContain('4/8 = 1/2');
    const s = inchesQuestion(0, 11, 16, 4, rng);
    expect(s.answer).toBe(11); expect((s.visual as { end: number }).end).toBe(11);
  });

  it('reads dials and thermometers by working out one mark', () => {
    const rng = createRng(3);
    const dial = { max: 1000, major: 100, divisions: 5, unit: 'g', what: 'kitchen scale', things: ['flour'] };
    const q = dialQuestion(dial, 340, 3, rng);
    expect(q.answer).toBe(340); expect(stripLabels(q.explanation.join(' '))).toContain('300 + 2 × 20 = 340');
    const t = tempQuestion(22, null, 2, rng);
    expect(t.answer).toBe(22);
    const c = tempQuestion(34, 20, 3, rng);
    expect(c.answer).toBe(14); expect(stripLabels(c.explanation.join(' '))).toContain('34 − 20 = 14');
    const f = tempQuestion(10, 18, 3, rng);
    expect(f.answer).toBe(8); expect(f.prompt).toContain('fall');
  });

  it('counts elapsed time across the hour', () => {
    const q = timeQuestion(155, 200, 3, createRng(4));
    expect(q.answer).toBe(45);
    expect(q.explanation.join(' ')).toContain('2:35 → 3:00 is 25 minutes');
    expect(stripLabels(q.explanation.join(' '))).toContain('25 + 20 = 45');
  });

  it('accepts estimates within the tolerance', () => {
    const q = estimateQuestion({ name: 'a door', size: 2, unit: 'm' }, 3, 2, createRng(5));
    expect(q.answer).toBe(3); expect(q.tolerance).toBe(1);
    expect(checkAnswer(q, '3')).toBe(true); expect(checkAnswer(q, '4')).toBe(true); expect(checkAnswer(q, '2')).toBe(true);
    expect(checkAnswer(q, '5')).toBe(false); expect(checkAnswer(q, '1')).toBe(false);
    const big = estimateQuestion({ name: 'a bus', size: 12, unit: 'm' }, 36, 4, createRng(6));
    expect(big.tolerance).toBe(7); expect(checkAnswer(big, '30')).toBe(true); expect(checkAnswer(big, '28')).toBe(false);
  });

  it('converts linear, square and cubic units and says the thing did not change', () => {
    const ft = CONVERSIONS.find((c) => c.big === 'ft' && c.small === 'in')!;
    const q = convertQuestion(ft, 3, true, 2);
    expect(q.answer).toBe(36); expect(q.explanation.join(' ')).toContain('did not change');
    const back = convertQuestion(ft, 4, false, 3);
    expect(back.prompt).toBe('48 in is how many ft?'); expect(back.answer).toBe(4);
    const sq = convertQuestion(CONVERSIONS.find((c) => c.big === 'ft²')!, 2, true, 4);
    expect(sq.answer).toBe(288); expect(stripLabels(sq.explanation.join(' '))).toContain('12 × 12 = 144');
    const cu = convertQuestion(CONVERSIONS.find((c) => c.big === 'ft³')!, 1, true, 5);
    expect(cu.answer).toBe(1728); expect(stripLabels(cu.explanation.join(' '))).toContain('12 × 12 × 12 = 1728');
    expect((cu.visual as { dims: number }).dims).toBe(3);
  });

  it('keeps perimeter and area apart', () => {
    const rng = createRng(7);
    expect(shapeQuestion(6, 4, 'perimeter', 2, rng).answer).toBe(20);
    const a = shapeQuestion(6, 4, 'area', 2, rng);
    expect(a.answer).toBe(24); expect(a.unit).toBe('m²'); expect(a.explanation.join(' ')).toContain('Perimeter would be');
  });

  it('every generated question is consistent with its picture', () => {
    const rng = createRng(42);
    for (let i = 0; i < 400; i++) {
      const q = measureQuestion('all', ((i % 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6, rng);
      expect(q.topic).toBe('Measurement'); expect(q.visualFirst).toBe(true);
      expect(checkAnswer(q, String(q.answer))).toBe(true);
      expect(Number.isInteger(q.answer)).toBe(true); expect(q.answer).toBeGreaterThanOrEqual(0);
      const v = q.visual;
      if (v.type === 'ruler') { expect(v.end).toBeLessThanOrEqual(v.length * (v.unit === 'cm' ? 10 : v.divisions ?? 8)); if (v.unit === 'cm') expect(q.answer).toBe(v.end - v.start); else expect(q.answer).toBe(v.end % (v.divisions ?? 8)); }
      else if (v.type === 'dial') { expect(q.answer).toBe(v.value); expect(v.value).toBeLessThan(v.max); expect(v.value % (v.major / v.divisions)).toBe(0); }
      else if (v.type === 'thermometer') { expect(v.value).toBeLessThanOrEqual(v.max); expect(v.value % 2).toBe(0); }
      else if (v.type === 'clocks') { expect(q.answer).toBe(v.end - v.start); expect(q.answer).toBeGreaterThan(0); }
      else if (v.type === 'refbar') { expect(q.answer).toBe(v.target); expect(q.tolerance).toBeGreaterThanOrEqual(1); }
      else if (v.type === 'units') { expect([q.answer % v.n === 0, q.unit === v.big]).toContain(true); }
      else if (v.type === 'rect') { expect([v.w * v.h, 2 * (v.w + v.h)]).toContain(q.answer); }
      else if (v.type === 'compare') { expect([v.a.len, Math.abs(v.a.len - v.b.len)]).toContain(q.answer); }
      else throw new Error(`unexpected visual ${v.type}`);
    }
  });

  it('is wired into skills, the arcade, blitz stars, lessons, the path and the notebook', () => {
    expect(skillById('measure')?.generator).toBe('measure');
    expect(componentSkills('measure')).toHaveLength(9);
    expect(generateQuestion('measure.dial', {}, { rng: createRng(3), difficulty: 2 }).subtopic).toBe('Read the dial');
    const sel = parseSelection('measure', 'measure:time');
    expect(sel.skillIds).toEqual(['measure.time']);
    expect(drawSeeded(sel, 7, 0).subtopic).toBe('Elapsed time');
    expect(drawSeeded(sel, 7, 0).answer).toBe(drawSeeded(sel, 7, 0).answer);
    expect(blitzStars(7, 60_000, 'measure')).toBe(2);
    for (const id of ['l.measure-what', 'l.measure-marks', 'l.measure-zero', 'l.measure-convert', 'l.measure-around', 'l.measure-timetemp', 'l.measure-loop']) expect(lessonById(id)).toBeTruthy();
    expect(MEASURE_PATH).toHaveLength(6); expect(MEASURE_PATH[0].inGame).toContain('ruler');
    const q = rulerQuestion(0, 63, 3, createRng(8));
    const { variations, twist } = variantsFor(q, createRng(9));
    expect(variations.length).toBeGreaterThan(0);
    for (const v of variations) expect(v.subtopic).toBe('Read the ruler');
    expect(twist.topic).toBe('Measurement');
  });
});
