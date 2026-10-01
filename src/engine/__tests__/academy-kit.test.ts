import { describe, it, expect } from 'vitest';
import { createRng } from '../rng';
import { mkq, model, choose, typed, academySkill, polyStr, coefTerm, fmtSigned, fracStr } from '../academy/kit';
import { judge, modelProblem, rightAnswer } from '../academy/judge';
const S = academySkill('x', 'y');
describe('kit smoke', () => {
  it('models judge and solve', () => {
    const q = (answer: number) => mkq(S, 't', { prompt: 'p', expression: 'e', answer, hint: 'h', steps: ['s'] });
    const bal = model(q(4), { kind: 'balance', a: 3, b: 5, c: 1, d: 13 }, ['4'], 'solve');
    expect(modelProblem(bal)).toBeNull(); expect(judge(bal, '4')).toBe(true); expect(judge(bal, '5')).toBe(false);
    const badBal = model(q(5), { kind: 'balance', a: 3, b: 5, c: 1, d: 13 }, ['5'], 'solve');
    expect(modelProblem(badBal)).toContain('x = 4');
    const line = model(q(0), { kind: 'plot', range: [-5, 5, -5, 5], count: 2, label: 'l' }, undefined, 'draw', { rule: { kind: 'on-line', m: 2, b: 1 } });
    expect(modelProblem(line)).toBeNull(); expect(judge(line, rightAnswer(line))).toBe(true); expect(judge(line, '0,1;1,4')).toBe(false); expect(judge(line, '1,3;-1,-1')).toBe(true);
    const set = model(q(0), { kind: 'plot', range: [-5, 5, -5, 5], count: 2, label: 'roots' }, undefined, 'tap', { rule: { kind: 'set', items: ['-2,0', '3,0'] } });
    expect(judge(set, '3,0;-2,0')).toBe(true); expect(judge(set, '3,0;2,0')).toBe(false); expect(modelProblem(set)).toBeNull();
    const pt = model(q(0), { kind: 'plot', range: [-5, 5, -5, 5], count: 1, label: 'p' }, ['2,-3'], 'tap');
    expect(modelProblem(pt)).toBeNull(); expect(judge(pt, '2, -3')).toBe(true);
    const off = model(q(0), { kind: 'plot', range: [-5, 5, -5, 5], count: 1, label: 'p' }, ['7,1'], 'tap');
    expect(modelProblem(off)).not.toBeNull();
    const ang = model(q(135), { kind: 'angle', max: 180, step: 5, label: 'a' }, ['135'], 'turn'); expect(modelProblem(ang)).toBeNull();
    const uc = model(q(150), { kind: 'unitcircle', label: 'u' }, ['150'], 'tap'); expect(modelProblem(uc)).toBeNull();
    const uc2 = model(q(100), { kind: 'unitcircle', label: 'u' }, ['100'], 'tap'); expect(modelProblem(uc2)).not.toBeNull();
    const tb = model(q(0), { kind: 'table', rows: [[1, 2], [null, null]] }, ['-3,1/2'], 'fill'); expect(modelProblem(tb)).toBeNull(); expect(judge(tb, '−3, 1/2')).toBe(true);
    // table entries match by value, not spelling; a wrong value still fails
    const tv = model(q(0), { kind: 'table', rows: [[null, null, null]] }, ['0.5,0.45,2'], 'fill');
    expect(judge(tv, '1/2,.45,2.0')).toBe(true); expect(judge(tv, '0.50,0.450,2')).toBe(true); expect(judge(tv, '0.5,0.46,2')).toBe(false); expect(judge(tv, '0.5,0.45')).toBe(false);
    // choices naming the same number collapse, so exactly one is right
    const cv = choose(createRng(2), q(0.5), '1/2', ['0.5', '.50', '2', '1/4']); expect(cv.choices!.length).toBe(3); expect(cv.choices!.filter((x) => judge(cv, x)).length).toBe(1);
    const sl = model(q(2.5), { kind: 'slider', min: 0, max: 5, step: 0.5, label: 's' }, ['2.5'], 'slide'); expect(modelProblem(sl)).toBeNull();
    const nl = model(q(-3), { kind: 'numberline', start: 2, min: -10, max: 10, label: 'n' }, ['-3'], 'hop'); expect(modelProblem(nl)).toBeNull(); expect(judge(nl, '−3')).toBe(true);
    const c = choose(createRng(1), q(0), 'x = 4', ['x = 5', 'x=4', 'x = −4']); expect(c.choices!.length).toBe(3); expect(c.choices!.filter((x) => judge(c, x)).length).toBe(1);
    const t = typed(mkq(S, 't', { prompt: 'p', expression: 'e', answer: 0.75, fraction: true, hint: 'h', steps: ['s'] }));
    expect(judge(t, '3/4')).toBe(true); expect(judge(t, '0.75')).toBe(true);
    expect(t.question.masterySkillId).toBe('acad.x.y');
  });
  it('formatting', () => {
    expect(polyStr([1, -3, 2])).toBe('2x² − 3x + 1'); expect(polyStr([0, 1])).toBe('x'); expect(polyStr([-4, 0, -1])).toBe('−x² − 4');
    expect(coefTerm(-1, 'x')).toBe('−x'); expect(fmtSigned(-3)).toBe('− 3'); expect(fracStr(-6, 8)).toBe('−3/4'); expect(fracStr(8, 4)).toBe('2');
  });
});
