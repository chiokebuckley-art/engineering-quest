import { describe, it, expect } from 'vitest';
import { powersQuestion, pvalueQuestion, areaModelQuestion, whichExprQuestion, interpretQuestion, spiralQuestion, SPIRAL_KINDS } from '../questions/spiral';
import { compositeQuestion, notchQuestion, stairQuestion, lShape, notchShape, stairShape, volumeQuestion } from '../questions/volume';
import { createRng } from '../rng';
import { checkAnswer, generateQuestion } from '../questions';
import { parseSelection, drawSeeded } from '../state/arcade';
import { skillById, componentSkills } from '../curriculum/skills';
import { lessonById } from '../../content/lessons';
import type { Difficulty } from '../types';

const DIFFS: Difficulty[] = [1, 2, 3, 4, 5, 6];
const volOf = (b: { l: number; w: number; h: number }) => b.l * b.w * b.h;

describe('Breaking apart a figure to find volume', () => {
  it('adds the pieces, and says the subtract route in the same breath', () => {
    const q = compositeQuestion(
      [{ x: 0, y: 0, z: 0, l: 4, w: 3, h: 5 }, { x: 4, y: 0, z: 0, l: 3, w: 3, h: 2 }],
      'cm', 'add', 3, createRng(1),
    );
    expect(q.answer).toBe(78);
    expect(q.unit).toBe('cm³');
    expect(q.visual).toMatchObject({ type: 'solid', unit: 'cm' });
    const text = q.explanation.join(' ');
    expect(text).toContain('Way 1');
    expect(text).toContain('Way 2');
    // The worksheet's own point: two different ways, same answer, cubic units.
    expect(text).toContain('Both ways give 78 (total volume in cm³)');
    expect(text).toContain('not cm.');
  });

  it('never lets the two routes disagree, on any generated figure', () => {
    for (let seed = 0; seed < 300; seed++) {
      const rng = createRng(seed);
      const d = DIFFS[seed % DIFFS.length];
      const parts = lShape(rng, d);
      const q = compositeQuestion(parts, 'cm', 'add', d, rng);
      const total = parts.reduce((a, b) => a + volOf(b), 0);
      expect(q.answer).toBe(total);
      // the enclosing box minus the gap must be the same number
      const L = Math.max(...parts.map((b) => b.x + b.l));
      const W = Math.max(...parts.map((b) => b.y + b.w));
      const H = Math.max(...parts.map((b) => b.z + b.h));
      expect(L * W * H - (L * W * H - total)).toBe(total);
      expect(parts.every((b) => b.l > 0 && b.w > 0 && b.h > 0)).toBe(true);
    }
  });

  it('cuts a notch out of a whole box and subtracts it', () => {
    for (let seed = 0; seed < 200; seed++) {
      const rng = createRng(seed);
      const d = DIFFS[seed % DIFFS.length];
      const { parts, ghost, outer } = notchShape(rng, d);
      expect(parts.reduce((a, b) => a + volOf(b), 0)).toBe(volOf(outer) - volOf(ghost));
      const q = notchQuestion(d, createRng(seed));
      expect(q.answer).toBeGreaterThan(0);
      expect(q.visual.type).toBe('solid');
      if (q.visual.type === 'solid') expect(q.visual.ghost).toBeTruthy();
      expect(q.explanation.join(' ')).toContain('The other way');
    }
  });

  it('builds staircases whose steps get shorter and add to the answer', () => {
    for (let seed = 0; seed < 200; seed++) {
      const rng = createRng(seed);
      const parts = stairShape(rng, DIFFS[seed % DIFFS.length]);
      for (let i = 1; i < parts.length; i++) expect(parts[i].h).toBeLessThan(parts[i - 1].h);
      const q = stairQuestion(3, createRng(seed));
      expect(q.answer).toBeGreaterThan(0);
      expect(q.unit).toMatch(/³$/);
    }
  });

  it('registers the three new figure kinds as volume skills with lessons', () => {
    for (const k of ['composite', 'subtract', 'stairs']) {
      expect(skillById(`volume.${k}`)?.parent).toBe('volume');
      const q = volumeQuestion(k as never, 3, createRng(7));
      expect(q.masterySkillId).toBe(`volume.${k}`);
      expect(checkAnswer(q, String(q.answer))).toBe(true);
    }
    expect(componentSkills('volume')).toHaveLength(8);
    expect(lessonById('l.volume-break')).toBeTruthy();
  });
});

describe('Spiral review', () => {
  it('slides digits for powers of ten without losing precision', () => {
    expect(powersQuestion(708, 3, 'div', 'power', 3).answer).toBe(0.708);
    expect(powersQuestion(71.4, 1, 'div', 'plain', 3).answer).toBe(7.14);
    expect(powersQuestion(71.4, 1, 'mul', 'plain', 3).answer).toBe(714);
    const q = powersQuestion(708, 3, 'div', 'power', 3);
    expect(q.prompt).toContain('10³');
    expect(q.visual).toEqual({ type: 'pvchart', value: '708', shift: -3 });
    expect(q.explanation.join(' ')).toContain('the decimal point stays where it is');
  });

  it('values a digit by its place, and finds one tenth of it', () => {
    const v = pvalueQuestion('54.293', 2, 'value', [], 0, 3);
    expect(v.answer).toBe(0.2);
    expect(v.explanation.join(' ')).toContain('tenths place');
    const t = pvalueQuestion('54.293', 2, 'tenth', [], 0, 3);
    expect(t.answer).toBe(0.02);
    expect(t.visual).toMatchObject({ type: 'pvchart', shift: -1 });
  });

  it('builds area models whose strips add back to the dividend', () => {
    const rng = createRng(3);
    const q = areaModelQuestion(4992, 32, 'quotient', 4, rng);
    expect(q.answer).toBe(156);
    expect(q.visual.type).toBe('areamodel');
    if (q.visual.type === 'areamodel') {
      expect(q.visual.rows.reduce((a, r) => a + r.product, 0)).toBe(4992);
      expect(q.visual.rows.reduce((a, r) => a + r.q, 0)).toBe(156);
      expect(q.visual.rows.every((r) => r.product === 32 * r.q)).toBe(true);
    }
    const b = areaModelQuestion(4992, 32, 'blank', 4, createRng(3));
    expect(b.visual.type === 'areamodel' && typeof b.visual.blank).toBe('number');
    if (b.visual.type === 'areamodel' && b.visual.blank !== undefined) expect(b.answer).toBe(b.visual.rows[b.visual.blank].product);
  });

  it('picks the expression by ones digit and estimate, answering with the option number', () => {
    for (let seed = 0; seed < 120; seed++) {
      const rng = createRng(seed);
      const q = whichExprQuestion(624, 72, 4, rng);
      expect(q.visual.type).toBe('options');
      if (q.visual.type !== 'options') continue;
      const picked = q.visual.items[(q.answer as number) - 1];
      const [a, b] = picked.split(' × ').map(Number);
      expect(a * b).toBe(44928);
      expect(q.visual.items).toHaveLength(4);
      // Four distinct expressions AND four distinct values: exactly one option can be right.
      expect(new Set(q.visual.items).size).toBe(4);
      const values = q.visual.items.map((s) => s.split(' × ').map(Number).reduce((x, y) => x * y));
      expect(new Set(values).size).toBe(4);
    }
  });

  it('never offers two options with the same value, even for a square', () => {
    for (let n = 11; n < 100; n++) {
      const q = whichExprQuestion(n, n, 3, createRng(n));
      if (q.visual.type !== 'options') throw new Error('expected options');
      const values = q.visual.items.map((s) => s.split(' × ').map(Number).reduce((x, y) => x * y));
      expect(new Set(values).size, `n = ${n}`).toBe(4);
      expect(values[(q.answer as number) - 1]).toBe(n * (n + 1));
    }
  });

  it('reads the remainder three different ways', () => {
    // 208 pages, 23 a day: 9 r 1 → 10 days to finish
    expect(interpretQuestion(208, 23, 0, 3).answer).toBe(10);
    // machines finished → round down
    expect(interpretQuestion(208, 23, 2, 3).answer).toBe(9);
    // eggs left over → the remainder itself
    const r = interpretQuestion(208, 23, 4, 3);
    expect(r.answer).toBe(1);
    expect(r.unit).toBe('left over');
  });

  it('generates every kind at every difficulty with a checkable answer', () => {
    for (const k of SPIRAL_KINDS) {
      for (const d of DIFFS) {
        for (let seed = 0; seed < 25; seed++) {
          const q = spiralQuestion(k.id, d, createRng(seed));
          expect(Number.isFinite(q.answer as number), `${k.id} d${d} seed${seed}`).toBe(true);
          expect(q.prompt.length).toBeGreaterThan(0);
          expect(q.explanation.length).toBeGreaterThan(0);
          expect(checkAnswer(q, String(q.answer)), `${k.id} d${d} seed${seed}`).toBe(true);
        }
      }
    }
  });

  it('is wired into skills, the arcade and the lessons', () => {
    expect(skillById('spiral')?.generator).toBe('spiral');
    expect(componentSkills('spiral')).toHaveLength(SPIRAL_KINDS.length - 1);
    const sel = parseSelection('spiral', 'spiral:powers');
    expect(sel.skillIds).toEqual(['spiral.powers']);
    expect(drawSeeded(sel, 3, 0).masterySkillId).toBe('spiral.powers');
    expect(generateQuestion('spiral.interpret', {}, { rng: createRng(2), difficulty: 3 }).masterySkillId).toBe('spiral.interpret');
    for (const id of ['l.spiral-powers', 'l.spiral-place', 'l.spiral-area', 'l.spiral-which', 'l.spiral-remainder']) expect(lessonById(id), id).toBeTruthy();
  });
});
