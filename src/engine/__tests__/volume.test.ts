import { describe, it, expect } from 'vitest';
import { cubesQuestion, prismQuestion, liquidQuestion, displaceQuestion, missingQuestion, volumeQuestion } from '../questions/volume';
import { createRng } from '../rng';
import { checkAnswer, generateQuestion } from '../questions';
import { parseSelection, drawSeeded, blitzStars } from '../state/arcade';
import { lessonById } from '../../content/lessons';
import { skillById, componentSkills } from '../curriculum/skills';
import { variantsFor } from '../notebook/notebook';
import { stripLabels } from '../label';

describe('Measuring volume', () => {
  it('counts cubes by layers and shows the picture before answering', () => {
    const q = cubesQuestion(3, 2, 3, 2);
    expect(q.answer).toBe(18);
    expect(q.visualFirst).toBe(true);
    expect(q.visual).toEqual({ type: 'cubes', l: 3, w: 2, h: 3 });
    expect(q.explanation.join(' ')).toContain('6 (cubes per layer) × 3 (layers) = 18 (cubes)');
  });

  it('multiplies the sides of a box, in cm³ or mL', () => {
    const rng = createRng(1);
    const q = prismQuestion(6, 4, 3, 2, rng);
    expect(q.answer).toBe(72); expect(q.unit).toBe('cm³');
    expect(q.visual.type).toBe('box');
    const m = missingQuestion(6, 4, 5, 'h', 2, rng);
    expect(m.answer).toBe(5); expect(m.prompt).toContain('120 cm³'); expect(m.prompt).toContain('How tall');
    expect((m.visual as { hide?: string }).hide).toBe('h');
  });

  it('reads a jug by working out one mark, and displacement is after − before', () => {
    const q = liquidQuestion(200, 50, 5, 130, 3);
    expect(q.answer).toBe(130);
    expect(q.explanation.join(' ')).toContain('50 (mL between labels) ÷ 5 (spaces) = 10 (mL per mark)');
    expect(stripLabels(q.explanation.join(' '))).toContain('100 + 3 × 10 = 130');
    const d = displaceQuestion(100, 20, 2, 40, 65, 3, createRng(2));
    expect(d.answer).toBe(25); expect(d.unit).toBe('mL');
    expect(stripLabels(d.explanation.join(' '))).toContain('65 − 40 = 25');
  });

  it('every generated question is consistent with its picture', () => {
    const rng = createRng(42);
    for (let i = 0; i < 300; i++) {
      const q = volumeQuestion('all', ((i % 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6, rng);
      expect(q.topic).toBe('Volume'); expect(q.visualFirst).toBe(true);
      expect(checkAnswer(q, String(q.answer))).toBe(true);
      const v = q.visual;
      if (v.type === 'cubes') expect(q.answer).toBe(v.l * v.w * v.h);
      else if (v.type === 'box') expect([v.l * v.w * v.h, v.l, v.w, v.h]).toContain(q.answer);
      else if (v.type === 'beaker') { expect(q.answer).toBe(v.level); expect(v.level).toBeGreaterThan(0); expect(v.level).toBeLessThan(v.capacity); expect(v.level % (v.major / v.divisions)).toBe(0); }
      else if (v.type === 'displace') { expect(q.answer).toBe(v.after - v.before); expect(v.after).toBeLessThanOrEqual(v.capacity); expect(v.after).toBeGreaterThan(v.before); }
      else if (v.type === 'solid') {
        // Break-apart figures: the answer is the pieces added, and the enclosing box minus the gap.
        const parts = v.ghost ? [...v.parts] : v.parts;
        const sum = parts.reduce((a, b) => a + b.l * b.w * b.h, 0);
        expect(q.answer).toBe(sum);
        const all = v.ghost ? [...v.parts, v.ghost] : v.parts;
        const box = Math.max(...all.map((b) => b.x + b.l)) * Math.max(...all.map((b) => b.y + b.w)) * Math.max(...all.map((b) => b.z + b.h));
        expect(box).toBeGreaterThanOrEqual(sum);
        expect(q.unit).toMatch(/³$/);
      }
      else throw new Error(`unexpected visual ${v.type}`);
    }
  });

  it('is wired into skills, the arcade, blitz stars, lessons and the notebook', () => {
    expect(skillById('volume')?.generator).toBe('volume');
    expect(componentSkills('volume')).toHaveLength(8);
    expect(generateQuestion('volume.liquid', {}, { rng: createRng(3), difficulty: 2 }).subtopic).toBe('Read the jug');
    const sel = parseSelection('volume', 'volume:displace');
    expect(sel.skillIds).toEqual(['volume.displace']);
    expect(drawSeeded(sel, 7, 0).subtopic).toBe('Water displacement');
    expect(drawSeeded(sel, 7, 0).answer).toBe(drawSeeded(sel, 7, 0).answer);
    expect(parseSelection('volume', 'volume:nope').key).toBe('volume:all');
    expect(blitzStars(10, 60_000, 'volume')).toBe(3); expect(blitzStars(3, 60_000, 'volume')).toBe(0);
    for (const id of ['l.volume-cubes', 'l.volume-jug', 'l.volume-formula']) expect(lessonById(id)).toBeTruthy();
    const q = liquidQuestion(500, 100, 4, 325, 3);
    const { variations, twist } = variantsFor(q, createRng(9));
    expect(variations.length).toBeGreaterThan(0);
    for (const v of variations) expect(v.subtopic).toBe('Read the jug');
    expect(twist.topic).toBe('Volume');
  });
});
