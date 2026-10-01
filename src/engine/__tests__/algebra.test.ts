import { describe, it, expect } from 'vitest';
import { generateQuestion, checkAnswer } from '../questions';
import { createRng } from '../rng';
import { oneStepQuestion, evaluateQuestion } from '../questions/algebra';

describe('Pre-algebra generators', () => {
  it('one-step equations have the stated solution and a balance visual', () => {
    const rng = createRng(8);
    for (let i = 0; i < 200; i++) {
      const q = generateQuestion('prealg.equations', {}, { rng, difficulty: (i % 5 + 1) as 1 | 2 | 3 | 4 | 5 });
      const [lhs, rhs] = q.expression.split(' = ');
      const letter = /[a-z]/.exec(lhs)![0];
      // Evaluate the left side with the answer substituted.
      const expr = lhs.replace(new RegExp(`(\\d)${letter}`), `$1*${letter}`).replace(letter, `(${q.answer})`).replace('−', '-').replace('÷', '/');
      // eslint-disable-next-line no-new-func
      const value = Function(`return ${expr}`)();
      expect(value, q.expression).toBe(Number(rhs));
      expect(q.visual.type).toBe('balance');
      expect(q.explanation.length).toBeGreaterThan(2);
      expect(checkAnswer(q, String(q.answer))).toBe(true);
    }
  });

  it('evaluated expressions follow order of operations', () => {
    expect(evaluateQuestion(3, 2, 4, '+').answer).toBe(14);
    expect(evaluateQuestion(2, 5, 6, '−').answer).toBe(7);
    expect(evaluateQuestion(1, 0, 9, '+').expression).toBe('x, x = 9');
    const rng = createRng(2);
    for (let i = 0; i < 100; i++) {
      const q = generateQuestion('prealg.expressions', {}, { rng, difficulty: 3 });
      expect(q.answer).toBeGreaterThanOrEqual(0);
    }
    const div = oneStepQuestion('div', 24, 4);
    expect(div.expression).toBe('x ÷ 4 = 6');
    expect(div.answer).toBe(24);
  });
});
