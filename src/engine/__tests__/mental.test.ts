import { describe, it, expect } from 'vitest';
import { workAdd, workSub, mentalQuestion, type MentalKind } from '../questions/mental';
import { createRng } from '../rng';
import { checkAnswer, generateQuestion } from '../questions';
import { parseSelection, drawSeeded, blitzStars } from '../state/arcade';
import { lessonById } from '../../content/lessons';

const evalExpr = (e: string) => { const m = /^(\d+) ([+−]) (\d+) = \?$/.exec(e); return m ? (m[2] === '+' ? +m[1] + +m[3] : +m[1] - +m[3]) : undefined; };

describe('Mental addition & subtraction', () => {
  it('picks the move from the notes for each worked example', () => {
    expect(workAdd(43, 25)).toMatchObject({ strategy: 'Break apart', visual: { type: 'jumps', from: 43, jumps: [20, 5] } });
    expect(workSub(76, 24)).toMatchObject({ strategy: 'Break apart', visual: { from: 76, jumps: [-20, -4] } });
    expect(workAdd(47, 38)).toMatchObject({ strategy: 'Round & compensate', visual: { from: 47, jumps: [40, -2] } });
    expect(workSub(68, 29)).toMatchObject({ strategy: 'Round & compensate', visual: { from: 68, jumps: [-30, 1] } });
    expect(workAdd(58, 27)).toMatchObject({ strategy: 'Make a ten', visual: { from: 58, jumps: [2, 25] } });
    expect(workSub(83, 47)).toMatchObject({ strategy: 'Count the distance', visual: { from: 47, jumps: [3, 30, 3] } });
    expect(workAdd(47, 30)).toMatchObject({ strategy: 'Tens first' });
    expect(workAdd(57, 36)).toMatchObject({ strategy: 'Make a ten', visual: { from: 57, jumps: [3, 33] } });
    expect(workAdd(46, 29).steps.join(' ')).toContain('46 + 30 = 76');
  });

  it('every worked path lands on the right answer, for all two-digit pairs', () => {
    for (let a = 10; a <= 99; a++) for (let b = 1; b <= 99; b++) {
      const w = workAdd(a, b); let v = w.visual.type === 'jumps' ? w.visual.from + w.visual.jumps.reduce((s, j) => s + j, 0) : NaN;
      expect(v, `add ${a}+${b}`).toBe(a + b);
      if (b < a) { const s = workSub(a, b); const end = s.visual.type === 'jumps' ? s.visual.from + s.visual.jumps.reduce((x, j) => x + j, 0) : NaN;
        expect(end, `sub ${a}-${b} (${s.strategy})`).toBe(s.strategy === 'Count the distance' ? a : a - b); }
    }
  });

  it('generates checkable questions for every kind and difficulty', () => {
    for (const kind of ['tens', 'next10', 'split', 'round', 'make10', 'distance', 'all'] as MentalKind[]) for (const d of [1, 2, 3, 4] as const) for (let s = 0; s < 40; s++) {
      const q = mentalQuestion(kind, d, createRng(s * 7 + d));
      expect(checkAnswer(q, String(q.answer))).toBe(true);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      if (kind === 'next10') { const m = /^(\d+) \+ \? = (\d+)$/.exec(q.expression)!; expect(+m[2] - +m[1]).toBe(q.answer); expect(+m[2] % 10).toBe(0); }
      else expect(evalExpr(q.expression), q.expression).toBe(q.answer);
      if (kind === 'round') expect(q.subtopic).toBe('Round & compensate');
      if (kind === 'make10') expect(q.subtopic).toBe('Make a ten');
      if (kind === 'distance') expect(q.subtopic).toBe('Count the distance');
      if (kind === 'tens') expect(q.subtopic).toBe('Tens first');
      if (kind !== 'all') expect(q.masterySkillId).toBe(`mental.${kind}`);
      expect(q.explanation[0]).toMatch(/^Best move: /);
    }
    expect(generateQuestion('mental', {}, { difficulty: 2 }).topic).toBe('Mental addition & subtraction');
  });

  it('is wired into the arcade and lessons', () => {
    expect(parseSelection('mental', 'mental:round').skillIds).toEqual(['mental.round']);
    expect(parseSelection('mental', 'mental:nope').key).toBe('mental:all');
    const sel = parseSelection('mental', 'mental:distance');
    expect(Array.from({ length: 6 }, (_, i) => drawSeeded(sel, 9, i).expression)).toEqual(Array.from({ length: 6 }, (_, i) => drawSeeded(sel, 9, i).expression));
    expect(blitzStars(28, 60_000, 'mental')).toBe(3);
    for (const id of ['l.mental-tens', 'l.mental-make10', 'l.mental-distance']) expect(lessonById(id)).toBeTruthy();
  });
});
