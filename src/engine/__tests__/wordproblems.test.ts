import { describe, it, expect } from 'vitest';
import { wordProblem, type WordKind, DETECTIVE } from '../questions/wordproblems';
import { createRng } from '../rng';
import { checkAnswer, generateQuestion } from '../questions';
import { parseSelection, drawSeeded, startArcade, arcadeAnswer, blitzStars } from '../state/arcade';
import { startMillionaire, pickOption, nextRung, walkAway, useLifeline, correctIndex, LADDER, safeAmount, askAdvice } from '../state/millionaire';
import { gameReducer } from '../state/reducer';
import { initialState } from '../state/initialState';
import { lessonById } from '../../content/lessons';

/** Evaluate a layout string such as "(5 × 8) − 12". */
function evalLayout(layout: string): number {
  const js = layout.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
  if (!/^[\d\s+\-*/().]+$/.test(js)) throw new Error(`bad layout ${layout}`);
  return Function(`return (${js})`)() as number;
}

const KINDS: WordKind[] = ['add', 'sub', 'mult', 'div', 'twostep', 'mixed'];

describe('Word problems', () => {
  it('every layout computes the answer; decoys are three distinct wrong setups', () => {
    for (const kind of KINDS) for (const d of [1, 2, 3, 4, 5, 6] as const) for (let seed = 1; seed <= 40; seed++) {
      const q = wordProblem(kind, d, createRng(seed * 101 + d));
      const w = q.word!;
      expect(evalLayout(w.layout), `${kind} d${d} ${w.layout}`).toBe(q.answer);
      expect(Number.isInteger(q.answer) && q.answer >= 0).toBe(true);
      expect(w.distractors.length).toBe(3);
      expect(new Set([w.layout, ...w.distractors]).size).toBe(4);
      for (const dl of w.distractors) expect(evalLayout(dl), `decoy ${dl} vs ${w.layout}`).not.toBe(q.answer);
      expect(checkAnswer(q, String(q.answer))).toBe(true);
      expect(q.prompt.length).toBeGreaterThan(10);
      expect(q.expression.endsWith('?')).toBe(true);
      expect(w.why.length).toBeGreaterThan(20);
      if (kind !== 'mixed' && kind !== 'twostep') { expect(w.op).toBe(kind); expect(q.masterySkillId).toBe(`word.${kind}`); }
      if (kind === 'twostep') { expect(w.ops.length).toBeGreaterThan(1); expect(q.masterySkillId).toBe('word.twostep'); }
    }
  });

  it('is deterministic for a seed', () => {
    const a = wordProblem('mixed', 3, createRng(9)); const b = wordProblem('mixed', 3, createRng(9));
    expect(a.prompt).toBe(b.prompt); expect(a.word!.layout).toBe(b.word!.layout);
  });

  it('is registered as a skill generator and covers all four operations in mixed mode', () => {
    const ops = new Set<string>();
    for (let i = 0; i < 60; i++) ops.add(generateQuestion('word', {}, { rng: createRng(i), difficulty: 2 }).word!.op);
    expect(ops.size).toBe(4);
    expect(generateQuestion('word.div', {}, { difficulty: 2 }).word!.op).toBe('div');
    expect(DETECTIVE.map((d) => d.op)).toEqual(['add', 'sub', 'mult', 'div']);
    expect(lessonById('l.word-detective')).toBeTruthy();
    expect(lessonById('l.word-twostep')).toBeTruthy();
  });

  it('arcade: word selections, seeded draws and a generous conquer clock', () => {
    expect(parseSelection('word', 'word:sub').skillIds).toEqual(['word.sub']);
    expect(parseSelection('word', 'word:nonsense').key).toBe('word:mixed');
    const sel = parseSelection('word', 'word:mult');
    const a = Array.from({ length: 10 }, (_, i) => drawSeeded(sel, 5, i));
    expect(a.map((q) => q.prompt)).toEqual(Array.from({ length: 10 }, (_, i) => drawSeeded(sel, 5, i).prompt));
    expect(a.every((q) => q.word!.op === 'mult')).toBe(true);
    let st = startArcade('word', 'conquer', 'word:add', {}, 0, createRng(1));
    expect(st.remaining.length).toBe(12);
    const out = arcadeAnswer(st, true, 20_000); // 20 s is fine for a story
    expect(out.state.conquered.length).toBe(1);
    expect(blitzStars(9, 60_000, 'word')).toBe(3);
    expect(blitzStars(9, 60_000, 'mult')).toBe(0);
  });
});

describe('Math Millionaire', () => {
  it('climbs the ladder to the million with correct picks', () => {
    let m = startMillionaire('mixed', 0, 42);
    for (let i = 0; i < LADDER.length; i++) {
      expect(m.level).toBe(i);
      expect(m.options.length).toBe(4);
      expect(new Set(m.options).size).toBe(4);
      m = pickOption(m, correctIndex(m), 1000);
      if (i < LADDER.length - 1) { expect(m.status).toBe('reveal'); m = nextRung(m, 2000); }
    }
    expect(m.status).toBe('won');
    expect(m.winnings).toBe(1_000_000);
    expect(m.correct).toBe(15);
  });

  it('a wrong pick drops to the last safe haven; walking away banks the previous rung', () => {
    let m = startMillionaire('add', 0, 7);
    for (let i = 0; i < 6; i++) { m = pickOption(m, correctIndex(m)); m = nextRung(m); }
    expect(m.level).toBe(6);
    const wrong = m.options.findIndex((_, i) => i !== correctIndex(m));
    const lost = pickOption(m, wrong);
    expect(lost.status).toBe('lost'); expect(lost.winnings).toBe(1000);
    expect(safeAmount(2)).toBe(0); expect(safeAmount(12)).toBe(32000);
    const walked = walkAway(m);
    expect(walked.status).toBe('walked'); expect(walked.winnings).toBe(LADDER[5]);
  });

  it('lifelines: 50:50 keeps the right answer, ask gives advice, swap changes the question once', () => {
    let m = startMillionaire('mixed', 0, 99);
    const before = m.question.prompt;
    m = useLifeline(m, 'fifty');
    expect(m.removed.length).toBe(2); expect(m.removed.includes(correctIndex(m))).toBe(false);
    expect(useLifeline(m, 'fifty').removed.length).toBe(2);
    expect(pickOption(m, m.removed[0]).status).toBe('asking');
    m = useLifeline(m, 'ask'); expect(m.askShown).toBe(true); expect(askAdvice(m.question)).toContain('Ask yourself');
    m = useLifeline(m, 'swap'); expect(m.question.prompt).not.toBe(before); expect(m.removed).toEqual([]);
    expect(m.lifelines).toEqual({ fifty: false, ask: false, swap: false });
  });

  it('reducer: records stats, mastery and XP', () => {
    let s = initialState();
    s = gameReducer(s, { type: 'CREATE_CHARACTER', name: 'Zed', avatar: 'a', specialization: 'undecided' });
    s = gameReducer(s, { type: 'MILL_START', kind: 'mult' });
    expect(s.screen).toBe('millionaire');
    for (let i = 0; i < 5; i++) { s = gameReducer(s, { type: 'MILL_PICK', index: correctIndex(s.millionaire!) }); s = gameReducer(s, { type: 'MILL_NEXT' }); }
    expect(s.millionaire!.level).toBe(5);
    expect(s.mastery['word.mult']?.attempts).toBe(5);
    const wrong = s.millionaire!.options.findIndex((_, i) => i !== correctIndex(s.millionaire!));
    s = gameReducer(s, { type: 'MILL_PICK', index: wrong });
    expect(s.millionaire!.status).toBe('lost');
    expect(s.stats.millionaire.best).toBe(1000); expect(s.stats.millionaire.games).toBe(1); expect(s.stats.millionaire.bestRung).toBe(5);
    expect(s.achievements['mill-1000']).toBeTruthy(); expect(s.achievements['mill-solo']).toBeTruthy();
    expect(s.character!.xp).toBeGreaterThan(0);
    s = gameReducer(s, { type: 'MILL_EXIT' });
    expect(s.millionaire).toBeNull();
  });
});
