import { it, expect } from 'vitest';
import { wordProblem } from '../questions/wordproblems';
import { violatesCaps } from '../contest/grades';
import { createRng } from '../rng';
it('grade 1 word problems at difficulty 1 stay within 20', () => {
  const r = createRng(4);
  for (const k of ['add', 'sub'] as const) for (let i = 0; i < 2000; i++) { const q = wordProblem(k, 1, r); expect(violatesCaps('g1', q), `${q.prompt} ${q.expression} = ${q.answer}`).toBeNull(); expect(q.answer).toBeGreaterThan(0); }
});
