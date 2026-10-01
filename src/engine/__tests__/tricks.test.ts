import { describe, it, expect } from 'vitest';
import { times11Question, square5Question, same10Question, trickQuestion } from '../questions/tricks';
import { createRng } from '../rng';
import { checkAnswer, generateQuestion } from '../questions';
import { parseSelection, drawSeeded, blitzStars } from '../state/arcade';
import { lessonById } from '../../content/lessons';

describe('Math tricks', () => {
  it('×11 matches the worked examples, carries included', () => {
    expect(times11Question(43).answer).toBe(473);
    expect(times11Question(68).answer).toBe(748);
    expect(times11Question(68).explanation.join(' ')).toContain('carry the 1');
    expect(times11Question(352).answer).toBe(3872);
    const q = times11Question(574);
    expect(q.answer).toBe(6314);
    expect(q.explanation.join(' ')).toContain('carry 1 left');
    expect(q.explanation.at(-1)).toContain('6 3 1 4');
    for (let n = 10; n <= 999; n++) expect(times11Question(n).answer).toBe(n * 11);
  });

  it('squares ending in 5 and same-tens products match the video', () => {
    expect(square5Question(75).answer).toBe(5625);
    expect(square5Question(35).answer).toBe(1225);
    expect(square5Question(105).answer).toBe(11025);
    expect(same10Question(4, 4).answer).toBe(2024); // 44 × 46
    expect(same10Question(6, 7).answer).toBe(4221); // 67 × 63
    expect(same10Question(8, 6).answer).toBe(7224); // 86 × 84
    const q = same10Question(2, 1); // 21 × 29 = 609: right part must be two digits
    expect(q.answer).toBe(609);
    expect(q.explanation.join(' ')).toContain('09');
    for (let t = 1; t <= 12; t++) for (let u = 1; u <= 9; u++) expect(same10Question(t, u).answer).toBe((t * 10 + u) * (t * 10 + 10 - u));
  });

  it('generates valid, checkable questions for every kind and difficulty', () => {
    for (const kind of ['11', 'sq5', 'same10', 'all'] as const) for (const d of [1, 2, 3, 4, 5, 6] as const) for (let s = 0; s < 30; s++) {
      const q = trickQuestion(kind, d, createRng(s + d * 100));
      expect(checkAnswer(q, String(q.answer))).toBe(true);
      const m = /^(\d+) × (\d+) = \?$/.exec(q.expression)!;
      expect(Number(m[1]) * Number(m[2])).toBe(q.answer);
      if (kind !== 'all') expect(q.masterySkillId).toBe(`trick.${kind}`);
    }
    expect(generateQuestion('tricks', {}, { difficulty: 3 }).topic).toBe('Math tricks');
    expect(generateQuestion('trick.sq5', {}, { difficulty: 2 }).expression).toMatch(/5 × \d+5 = \?$/);
  });

  it('arcade wiring: selections, seeded draws, stars; lessons exist', () => {
    expect(parseSelection('tricks', 'tricks:sq5').skillIds).toEqual(['trick.sq5']);
    expect(parseSelection('tricks', 'tricks:bogus').key).toBe('tricks:all');
    const sel = parseSelection('tricks', 'tricks:11');
    const a = Array.from({ length: 8 }, (_, i) => drawSeeded(sel, 3, i).expression);
    expect(a).toEqual(Array.from({ length: 8 }, (_, i) => drawSeeded(sel, 3, i).expression));
    expect(a.every((e) => e.endsWith('× 11 = ?'))).toBe(true);
    expect(blitzStars(18, 60_000, 'tricks')).toBe(3);
    for (const id of ['l.trick-11', 'l.trick-sq5', 'l.trick-same10']) expect(lessonById(id)).toBeTruthy();
  });
});
