import { describe, it, expect } from 'vitest';
import { generateQuestion, checkAnswer } from '../questions';
import { createRng } from '../rng';
import { startArcade, arcadeAnswer, arcadeNext, parseSelection, BLITZ_MS } from '../state/arcade';
import { gameReducer } from '../state/reducer';
import { initialState } from '../state/initialState';
import { bondFacts } from '../curriculum/facts';
import { BOND_TARGETS, skillById } from '../curriculum/skills';
import { bondExplanation } from '../questions/bonds';

describe('Number bonds generator', () => {
  it('produces correct missing-part questions for every target', () => {
    const rng = createRng(4);
    for (const t of [5, 10, 50, 100]) {
      for (let i = 0; i < 40; i++) {
        const q = generateQuestion(`bonds.${t}`, {}, { rng, difficulty: i % 6 === 0 ? 5 : 3 });
        const m1 = /^(\d+) \+ \? = (\d+)$/.exec(q.expression); const m2 = /^\? \+ (\d+) = (\d+)$/.exec(q.expression); const m3 = /^(\d+) − (\d+) = \?$/.exec(q.expression);
        const m = m1 ?? m2 ?? m3; expect(m, q.expression).toBeTruthy();
        const a = m3 ? Number(m3[2]) : Number(m![1]); const total = m3 ? Number(m3[1]) : Number(m![2]);
        expect(total).toBe(t);
        expect(q.answer).toBe(t - a);
        expect(checkAnswer(q, String(t - a))).toBe(true);
      }
    }
    expect(bondFacts(10).length).toBe(6);
    expect(bondFacts(100).length).toBe(11);
    // The second-grade ladder: 5, 10, then every five to 100. Up to 20 every number is a fact; past 20 the bonds go by fives.
    expect(BOND_TARGETS).toEqual([5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100]);
    expect(bondFacts(15).map((f) => f.split(':').pop())).toEqual(['0', '1', '2', '3', '4', '5', '6', '7']);
    expect(bondFacts(35).map((f) => f.split(':').pop())).toEqual(['0', '5', '10', '15']);
    for (const t of BOND_TARGETS) {
      expect(skillById(`bonds.${t}`)?.facts?.length, `bonds.${t}`).toBeGreaterThan(2);
      expect(parseSelection('bonds', `bonds:${t}`).skillIds).toEqual([`bonds.${t}`]);
      for (let i = 0; i < 12; i++) {
        const q = generateQuestion(`bonds.${t}`, {}, { rng: createRng(t * 100 + i), difficulty: (i % 6 + 1) as never });
        expect(q.answer + Number(/(\d+) \+ \? = |\? \+ (\d+) = |− (\d+) = \?/.exec(q.expression)?.slice(1).find(Boolean) ?? NaN), `${t}: ${q.expression}`).toBe(t);
        expect(q.subtopic).toBe(`Make ${t}`);
      }
    }
    expect(generateQuestion('bonds.35', {}, { rng: createRng(1), difficulty: 5 }).prompt.length).toBeGreaterThan(0);
    expect(bondExplanation(8, 15).join(' ')).toContain('Make ten first');
    expect(bondExplanation(27, 60).join(' ')).toContain('Jump to the next ten first: 27 → 30');
  });
});

describe('Arcade', () => {
  it('parses selections', () => {
    expect(parseSelection('mult', 'mult:6').facts.length).toBe(12);
    expect(parseSelection('mult', 'mult:6,7').skillIds).toEqual(['mult.6', 'mult.7']);
    expect(parseSelection('mult', 'mult:fact:7x6').factId).toBe('fact:mult:6x7');
    expect(parseSelection('bonds', 'bonds:50').skillIds).toEqual(['bonds.50']);
  });

  it('conquer: fast correct answers clear facts, slow or wrong ones go to the back', () => {
    let a = startArcade('mult', 'conquer', 'mult:3', {}, 0, createRng(1));
    expect(a.remaining.length).toBe(12);
    const first = a.remaining[0];
    let out = arcadeAnswer(a, false, 1000); // miss → moves to back
    expect(out.state.remaining[out.state.remaining.length - 1]).toBe(first);
    a = arcadeNext(out.state, {}, 1100, createRng(2)); // retry same question
    expect(a.attempts).toBe(1);
    out = arcadeAnswer(a, true, 1500); // retry correct: no conquest
    expect(out.state.conquered.length).toBe(0);
    a = arcadeNext(out.state, {}, 2000, createRng(3));
    out = arcadeAnswer(a, true, 2000 + 9000); // too slow → back of the line
    expect(out.state.conquered.length).toBe(0);
    let t = 12000; let guard = 0;
    while (out.state.status === 'active' && guard++ < 60) {
      a = arcadeNext(out.state, {}, t, createRng(guard)); t += 1000;
      expect(a.question.factId).toBe(a.remaining[0]);
      out = arcadeAnswer(a, true, t); t += 100;
    }
    expect(out.state.status).toBe('finished');
    expect(out.state.conquered.length).toBe(12);
  });

  it('blitz ends at the deadline and records a best score with XP', () => {
    let s = gameReducer(initialState(), { type: 'NEW_GAME' });
    s = gameReducer(s, { type: 'SEEN_INTRO' });
    s = gameReducer(s, { type: 'CREATE_CHARACTER', name: 'T', avatar: '', specialization: 'undecided' });
    s = gameReducer(s, { type: 'DIALOGUE_CLOSE' });
    s = gameReducer(s, { type: 'ARCADE_START', game: 'bonds', mode: 'blitz', selection: 'bonds:10' });
    expect(s.arcade?.deadlineAt).toBeGreaterThan(Date.now() + BLITZ_MS - 2000);
    const xpBefore = s.character!.xp;
    for (let i = 0; i < 8; i++) {
      s = gameReducer(s, { type: 'ARCADE_ANSWER', given: String(s.arcade!.question.answer) });
      s = gameReducer(s, { type: 'ARCADE_NEXT' });
    }
    expect(s.arcade!.score).toBeGreaterThan(0);
    expect(s.arcade!.combo).toBe(8);
    s = gameReducer(s, { type: 'ARCADE_TIMEOUT' });
    expect(s.arcade!.status).toBe('finished');
    expect(s.stats.arcade.bests['bonds:10@60'].correct).toBe(8);
    expect(s.stats.arcade.runs).toBe(1);
    expect(s.character!.xp).toBeGreaterThan(xpBefore);
    expect(Object.keys(s.mastery).some((k) => k.startsWith('fact:bond:10'))).toBe(true);
  });
});
