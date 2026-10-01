import { describe, it, expect } from 'vitest';
import { PRECALC_KINDS, precalcQuestion, fracAddQuestion, fracMulQuestion, negQuestion, expQuestion, rootQuestion, rearrangeQuestion, evaluateQuestion, sciQuestion, unitQuestion, funcQuestion, graphQuestion, trigQuestion, FORMULAS, UNIT_CONVS, fracText, simplify, sup } from '../questions/precalc';
import { createRng } from '../rng';
import { checkAnswer, parseGiven, answerLabel, generateQuestion } from '../questions';
import { parseSelection, drawSeeded } from '../state/arcade';
import { skillById, componentSkills } from '../curriculum/skills';
import { lessonById } from '../../content/lessons';
import { variantsFor } from '../notebook/notebook';
import type { Difficulty } from '../types';

const DIFFS: Difficulty[] = [1, 2, 3, 4, 5, 6];

describe('Answers written as fractions and signed numbers', () => {
  it('parses what a learner types', () => {
    expect(parseGiven('5/6')).toBeCloseTo(5 / 6);
    expect(parseGiven('-3/4')).toBeCloseTo(-0.75);
    expect(parseGiven('−3/4')).toBeCloseTo(-0.75);
    expect(parseGiven('1 1/2')).toBe(1.5);
    expect(parseGiven('10/12')).toBeCloseTo(5 / 6);
    expect(parseGiven('−5')).toBe(-5);
    expect(parseGiven('3/0')).toBeNull();
    expect(parseGiven('abc')).toBeNull();
  });
  it('accepts any fraction equal in value, and shows the answer the way it is written', () => {
    const q = fracAddQuestion(1, 2, 1, 3, '+', 2);
    expect(q.answerText).toBe('5/6'); expect(answerLabel(q)).toBe('5/6');
    expect(checkAnswer(q, '5/6')).toBe(true); expect(checkAnswer(q, '10/12')).toBe(true); expect(checkAnswer(q, '0.8333')).toBe(false); expect(checkAnswer(q, '2/5')).toBe(false);
    expect(q.allowFraction).toBe(true); expect(q.allowDecimal).toBeFalsy();
    const n = negQuestion(-3, -8, '−', 2);
    expect(n.answer).toBe(5); expect(n.answerText).toBe('5'); expect(n.allowNegative).toBe(true);
    expect(checkAnswer(negQuestion(4, -9, '+', 2), '−5')).toBe(true);
    expect(fracText(-7, 6)).toBe('−7/6'); expect(fracText(4, 2)).toBe('2'); expect(simplify(10, -12)).toEqual([-5, 6]); expect(sup(-12)).toBe('⁻¹²');
  });
});

describe('Calculus prep: the worked examples from the syllabus', () => {
  it('1/2 + 1/3 = 5/6, and never adds the bottoms', () => {
    const q = fracAddQuestion(1, 2, 1, 3, '+', 2);
    expect(q.explanation.join(' ')).toContain('go into is 6');
    expect(q.explanation.join(' ')).toContain('not 2/5');
    expect(fracAddQuestion(3, 4, 1, 6, '−', 3).answerText).toBe('7/12');
    expect(fracMulQuestion(2, 3, 3, 4, '×', 3).answerText).toBe('1/2');
    expect(fracMulQuestion(1, 2, 1, 4, '÷', 3).answerText).toBe('2');
    expect(fracMulQuestion(1, 2, 1, 4, '÷', 3).explanation[0]).toContain('flip');
  });
  it('−3 − (−8) = 5, and sign rules for × and ÷', () => {
    const q = negQuestion(-3, -8, '−', 2);
    expect(q.expression).toBe('−3 − (−8) = ?'); expect(q.answer).toBe(5);
    expect(q.explanation[0]).toContain('Subtracting a negative is the same as adding');
    expect(negQuestion(-6, -7, '×', 3).answer).toBe(42); expect(negQuestion(-42, 6, '÷', 3).answer).toBe(-7);
  });
  it('x³x² = x⁵ and the other exponent rules', () => {
    expect(expQuestion('mul', 3, 2, 3).answer).toBe(5); expect(expQuestion('mul', 3, 2, 3).expression).toBe('x³ · x² = x^?');
    expect(expQuestion('div', 7, 3, 3).answer).toBe(4); expect(expQuestion('div', 2, 5, 5).answer).toBe(-3);
    expect(expQuestion('pow', 2, 3, 3).answer).toBe(6); expect(expQuestion('num', 2, 5, 2).answer).toBe(32);
    expect(expQuestion('zero', 7, 3, 4).answer).toBe(1); expect(expQuestion('negexp', 2, 3, 5).answerText).toBe('1/8');
    expect(rootQuestion('sqrt', 12, 0, 2).answer).toBe(12); expect(rootQuestion('cbrt', 3, 0, 2).answer).toBe(3);
    expect(rootQuestion('powroot', 6, 0, 4).answer).toBe(3); expect(rootQuestion('simplify', 5, 2, 5).answer).toBe(5);
    const est = rootQuestion('estimate', 50, 7, 4); expect(est.answer).toBe(7.1); expect(checkAnswer(est, '7.07')).toBe(true);
  });
  it('PV = nRT ⇒ T = PV/(nR), picked from four rearrangements, then used with numbers', () => {
    const gas = FORMULAS[0];
    const q = rearrangeQuestion(gas, 'T', createRng(3), 4);
    expect(q.visual.type).toBe('options');
    if (q.visual.type === 'options') { expect(q.visual.items[(q.answer as number) - 1]).toBe('T = PV / (nR)'); expect(new Set(q.visual.items).size).toBe(4); }
    expect(q.explanation[0]).toContain('Divide both sides by nR');
    const e = evaluateQuestion(gas, 'T', { P: 100, V: 24.9, n: 1, R: 8.3, T: 300 }, 5);
    expect(e.answer).toBe(300); expect(e.unit).toBe('K');
    const ohm = evaluateQuestion(FORMULAS[1], 'I', { V: 12, R: 6, I: 2 }, 2);
    expect(ohm.answer).toBe(2); expect(ohm.unit).toBe('A'); expect(ohm.explanation[1]).toContain('(12) / (6)');
    // every formula's decoys are distinct from the right answer
    for (const f of FORMULAS) for (const v of f.vars) { expect(f.decoys[v]).toHaveLength(3); expect(f.decoys[v]).not.toContain(f.solved[v]); expect(new Set(f.decoys[v]).size).toBe(3); }
  });
  it('scientific notation and unit conversions', () => {
    expect(sciQuestion('toexp', 3.2, 4).answer).toBe(4); expect(sciQuestion('toexp', 3.2, 4).expression).toContain('32,000');
    expect(sciQuestion('toexp', 7.2, -3).answer).toBe(-3); expect(sciQuestion('toexp', 7.2, -3).expression).toContain('0.0072');
    expect(sciQuestion('expand', 4.5, 3).answer).toBe(4500); expect(sciQuestion('expand', 2.5, -2).answer).toBe(0.025);
    expect(sciQuestion('mul', 2, 3, 3, 4).answer).toBe(7); expect(sciQuestion('mul', 4, 3, 5, 2).answer).toBe(6); // 20 × 10⁵ = 2 × 10⁶
    expect(sciQuestion('div', 8, 6, 2, 2).answer).toBe(4);
    const kmh = UNIT_CONVS.find((c) => c.from === 'km/h')!; expect(unitQuestion(kmh, 72, 5).answer).toBe(20);
    const cm2 = UNIT_CONVS.find((c) => c.from === 'cm²')!; expect(unitQuestion(cm2, 3, 5).answer).toBe(300); expect(unitQuestion(cm2, 3, 5).explanation.join(' ')).toContain('squared');
    const mm = UNIT_CONVS.find((c) => c.from === 'mm')!; expect(unitQuestion(mm, 250, 3).answer).toBe(0.25);
  });
  it('functions, lines and SOH CAH TOA', () => {
    expect(funcQuestion('linear', 3, -2, 0, 4, 2).answer).toBe(10);
    expect(funcQuestion('quad', 1, 0, 1, -3, 4).answer).toBe(10);
    expect(funcQuestion('compose', 2, 1, 3, 2, 4).answer).toBe(15); // g(2) = 7, f(7) = 15
    expect(funcQuestion('solve', 3, -2, 0, 4, 3).answer).toBe(4);
    const s = graphQuestion('slope', 2, 1, 0, 3, 0, 2); expect(s.answer).toBe(2); expect(s.prompt).toContain('(0, 1) and (3, 7)');
    const half = graphQuestion('slope', 0.5, 0, 0, 4, 0, 5); expect(half.answerText).toBe('1/2'); expect(checkAnswer(half, '1/2')).toBe(true); expect(checkAnswer(half, '0.5')).toBe(true);
    expect(graphQuestion('intercept', 2, -3, 4, 6, 0, 4).answer).toBe(-3);
    expect(graphQuestion('value', -1, 4, 0, 1, 6, 3).answer).toBe(-2);
    expect(graphQuestion('xint', 2, -6, 0, 1, 0, 6).answer).toBe(3);
    const r = trigQuestion('ratio', 'sin', [3, 4, 5], 0, 2); expect(r.answerText).toBe('3/5'); expect(checkAnswer(r, '6/10')).toBe(true);
    expect(trigQuestion('ratio', 'tan', [6, 8, 10], 0, 2).answerText).toBe('3/4');
    const side = trigQuestion('side', 'sin', [0, 0, 10], 30, 4); expect(side.answer).toBe(5);
    const ang = trigQuestion('angle', 'tan', [3, 4, 5], 0, 5); expect(ang.answer).toBe(37); expect(checkAnswer(ang, '36.9')).toBe(true);
    expect(trigQuestion('special', 'sin', [3, 4, 5], 30, 2).answer).toBe(0.5); expect(trigQuestion('special', 'tan', [3, 4, 5], 45, 2).answer).toBe(1);
  });
});

describe('Calculus prep: generation and wiring', () => {
  it('generates every kind at every difficulty with a checkable, self-consistent answer', () => {
    for (const k of PRECALC_KINDS) for (const d of DIFFS) for (let seed = 0; seed < 30; seed++) {
      const q = precalcQuestion(k.id, d, createRng(seed * 7 + d));
      const tag = `${k.id} d${d} seed${seed}: ${q.expression}`;
      expect(Number.isFinite(q.answer), tag).toBe(true);
      expect(q.prompt.length, tag).toBeGreaterThan(0); expect(q.explanation.length, tag).toBeGreaterThan(1);
      expect(checkAnswer(q, answerLabel(q)), tag).toBe(true);
      expect(checkAnswer(q, String(q.answer)), tag).toBe(true);
      if (k.id !== 'all') expect(q.masterySkillId).toBe(`precalc.${k.id}`);
      if (k.id === 'frac.add') { expect(q.answer, tag).not.toBe(0); const mm = /^(\d+)\/(\d+) [+−] (\d+)\/(\d+)/.exec(q.expression)!; expect(simplify(+mm[1], +mm[2]), tag).toEqual([+mm[1], +mm[2]]); }
      if (q.visual.type === 'options') { expect(q.visual.items).toHaveLength(4); expect(q.answer).toBeGreaterThanOrEqual(1); expect(q.answer).toBeLessThanOrEqual(4); }
      if (q.allowFraction && q.answerText && !/^−?\d+$/.test(q.answerText)) expect(q.answerText, tag).toMatch(/^−?\d+\/\d+$/);
    }
  });
  it('is wired into skills, the arcade, the notebook and the lessons', () => {
    expect(skillById('precalc')?.generator).toBe('precalc');
    expect(componentSkills('precalc')).toHaveLength(PRECALC_KINDS.length - 1);
    const sel = parseSelection('precalc', 'precalc:trig');
    expect(sel.skillIds).toEqual(['precalc.trig']);
    expect(drawSeeded(sel, 3, 0).masterySkillId).toBe('precalc.trig');
    expect(generateQuestion('precalc.frac.add', {}, { rng: createRng(2), difficulty: 3 }).masterySkillId).toBe('precalc.frac.add');
    const { variations, twist } = variantsFor(generateQuestion('precalc.neg', {}, { rng: createRng(5), difficulty: 3 }), createRng(9));
    expect(variations.length).toBeGreaterThan(0); expect(variations.every((v) => v.masterySkillId === 'precalc.neg')).toBe(true); expect(twist.topic).toBe('Calculus prep');
    for (const id of ['l.pc-fractions', 'l.pc-negatives', 'l.pc-exponents', 'l.pc-rearrange', 'l.pc-scinot', 'l.pc-functions']) expect(lessonById(id), id).toBeTruthy();
  });
});
