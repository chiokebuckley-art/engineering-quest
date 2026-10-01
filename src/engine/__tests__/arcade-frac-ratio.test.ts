import { describe, it, expect } from 'vitest';
import { parseSelection } from '../state/arcade';
import { generateFromSkills, checkAnswer, answerLabel } from '../questions';
import { ARCADE_ACADEMY_KINDS } from '../academy/generator';
import { createRng } from '../rng';

describe('Arcade: Fractions and Ratios', () => {
  for (const game of ['frac', 'ratio'] as const) {
    it(`${game}: every kind and the mix make answerable questions that feed ${game} mastery`, () => {
      const keys = ['all', ...ARCADE_ACADEMY_KINDS[game].map((k) => k.id)];
      for (const k of keys) {
        const sel = parseSelection(game, `${game}:${k}`);
        expect(sel.key).toBe(`${game}:${k}`);
        for (let n = 0; n < 40; n++) {
          const q = generateFromSkills(sel.skillIds, {}, { rng: createRng(n * 13 + 1), difficulty: sel.difficulty });
          expect(q.masterySkillId).toBe(game);
          expect(Number.isFinite(q.answer), `${k}: ${q.expression}`).toBe(true);
          expect(checkAnswer(q, q.answerText ?? String(q.answer)), `${k}: ${q.prompt} → ${answerLabel(q)}`).toBe(true);
          expect(`${q.prompt} ${q.expression}`).not.toMatch(/undefined|NaN/);
        }
      }
    });
  }
  it('an unknown kind falls back to every kind', () => {
    expect(parseSelection('frac', 'frac:nonsense').key).toBe('frac:all');
    expect(parseSelection('ratio', 'ratio:').skillIds).toEqual(['ratio']);
  });
});
