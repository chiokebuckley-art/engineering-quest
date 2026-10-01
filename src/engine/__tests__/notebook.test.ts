import { describe, it, expect } from 'vitest';
import { classify, evalLayout, addMiss, variantsFor, startRun, runAnswer, runNext, applyRun, activeEntries, dueEntries, REVIEW_LADDER_MS, CLEAN_TO_CLEAR } from '../notebook/notebook';
import { pureMultQuestion } from '../questions/multiplication';
import { pureDivQuestion } from '../questions/division';
import { wordProblem } from '../questions/wordproblems';
import { mentalQuestion } from '../questions/mental';
import { createRng } from '../rng';
import { checkAnswer } from '../questions';
import { gameReducer } from '../state/reducer';
import { initialState } from '../state/initialState';

describe('Wrong-answer notebook', () => {
  it('evaluates layouts safely and classifies mistakes', () => {
    expect(evalLayout('(5 × 8) − 12')).toBe(28); expect(evalLayout('24 + 18')).toBe(42); expect(evalLayout('48 ÷ 6')).toBe(8); expect(evalLayout('alert(1)')).toBeUndefined();
    const m = pureMultQuestion(7, 8, createRng(1));
    expect(classify(m, '15')).toBe('operation'); expect(classify(m, '54')).toBe('arithmetic'); expect(classify(m, '63')).toBe('arithmetic'); expect(classify(m, '65')).toBe('arithmetic'); expect(classify(m, '')).toBe('blank'); expect(classify(m, '12', true)).toBe('timeout'); expect(classify(m, '120')).toBe('unknown');
    const w = wordProblem('add', 2, createRng(3)); const decoy = w.word!.distractors[0];
    expect(classify(w, decoy)).toBe('operation'); expect(classify(w, String(evalLayout(decoy)))).toBe('operation');
    expect(classify(pureDivQuestion(56, 7), '49')).toBe('operation');
  });

  it('adds cards, merges repeats as lapses, and orders by due date', () => {
    const q = pureMultQuestion(6, 7, createRng(1));
    let book = addMiss([], q, '36', 'battle', 1000);
    expect(book.length).toBe(1); expect(book[0].kind).toBe('arithmetic'); expect(book[0].dueAt).toBe(1000);
    book = addMiss(book, pureMultQuestion(6, 7, createRng(2)), '13', 'drill', 2000);
    expect(book.length).toBe(1); expect(book[0].lapses).toBe(1); expect(book[0].kind).toBe('operation');
    book = addMiss(book, pureDivQuestion(48, 6), '42', 'drill', 3000);
    expect(activeEntries(book).length).toBe(2); expect(dueEntries(book, 3000).length).toBe(2);
  });

  it('variations keep the structure and the twist changes it, for every question family', () => {
    const cases = [pureMultQuestion(6, 7, createRng(1)), pureDivQuestion(48, 6), wordProblem('mult', 2, createRng(4)), wordProblem('twostep', 4, createRng(5)), mentalQuestion('round', 2, createRng(6))];
    for (const q of cases) {
      const { variations, twist } = variantsFor(q, createRng(9));
      expect(variations.length, q.expression).toBe(3);
      for (const v of variations) { expect(checkAnswer(v, String(v.answer))).toBe(true); expect(v.expression + v.prompt).not.toBe(q.expression + q.prompt); }
      expect(checkAnswer(twist, String(twist.answer))).toBe(true);
    }
    const w = wordProblem('sub', 2, createRng(11)); const v = variantsFor(w, createRng(2));
    expect(v.variations.every((x) => x.subtopic === w.subtopic && x.word!.op === 'sub')).toBe(true); expect(v.twist.word!.op).toBe('add');
    const m = variantsFor(pureMultQuestion(6, 7, createRng(1)), createRng(3));
    expect(m.variations.every((x) => x.factId!.startsWith('fact:mult:') && x.factId !== 'fact:mult:6x7')).toBe(true); expect(m.twist.expression).toMatch(/^42 ÷ [67] = \?$/);
    const r = variantsFor(mentalQuestion('round', 2, createRng(6)), createRng(1)); expect(r.variations.every((x) => x.subtopic === 'Round & compensate')).toBe(true);
  });

  it('a run is clean only when the original and all variations are right; three clean fixes clear the card', () => {
    const q = pureMultQuestion(6, 7, createRng(1));
    let book = addMiss([], q, '36', 'battle', 0);
    const play = (clean: boolean, now: number) => {
      let r = startRun(book[0], now, createRng(now));
      expect(r.questions.length).toBe(5);
      for (let i = 0; i < 5; i++) { const ok = clean || i !== 1; r = runAnswer(r, ok); if (!ok) { r = runNext(r); r = runAnswer(r, true); } r = runNext(r); }
      expect(r.status).toBe('finished');
      const out = applyRun(book, r, now); book = out.book; return out.outcome;
    };
    let o = play(false, 1000); expect(o.clean).toBe(false); expect(book[0].clean).toBe(0); expect(book[0].dueAt).toBe(1000 + REVIEW_LADDER_MS[0]);
    o = play(true, 2000); expect(o.clean).toBe(true); expect(book[0].clean).toBe(1); expect(book[0].dueAt).toBe(2000 + REVIEW_LADDER_MS[1]);
    o = play(true, 3000); expect(book[0].clean).toBe(2); expect(book[0].dueAt).toBe(3000 + REVIEW_LADDER_MS[2]);
    o = play(true, 4000); expect(o.cleared).toBe(true); expect(book[0].clearedAt).toBe(4000); expect(activeEntries(book).length).toBe(0);
    expect(CLEAN_TO_CLEAR).toBe(3);
    // The twist being wrong does not spoil a clean fix.
    let b2 = addMiss([], q, '36', 'battle', 0); let r = startRun(b2[0], 5, createRng(5));
    for (let i = 0; i < 5; i++) { const ok = i !== 4; r = runAnswer(r, ok); if (!ok) { r = runNext(r); r = runAnswer(r, true); } r = runNext(r); }
    expect(applyRun(b2, r, 5).outcome.clean).toBe(true);
  });

  it('reducer: misses in any game fill the notebook, a run records mastery and applies the outcome', () => {
    let s = gameReducer(initialState(), { type: 'CREATE_CHARACTER', name: 'Zed', avatar: 'a', specialization: 'undecided' });
    s = gameReducer(s, { type: 'ARCADE_START', game: 'mult', mode: 'practice', selection: 'mult:6' });
    s = gameReducer(s, { type: 'ARCADE_ANSWER', given: '1' });
    expect(s.notebook.length).toBe(1); expect(s.notebook[0].context).toBe('drill');
    s = gameReducer(s, { type: 'ARCADE_EXIT' });
    s = gameReducer(s, { type: 'NOTEBOOK_START', entryId: s.notebook[0].id });
    expect(s.screen).toBe('notebook'); expect(s.notebookRun!.questions.length).toBe(5);
    const before = s.stats.totalAnswered;
    for (let i = 0; i < 5; i++) { s = gameReducer(s, { type: 'NOTEBOOK_ANSWER', given: String(s.notebookRun!.questions[i].answer) }); s = gameReducer(s, { type: 'NOTEBOOK_NEXT' }); }
    expect(s.notebookRun!.status).toBe('finished'); expect(s.notebookRun!.outcome!.clean).toBe(true);
    expect(s.stats.totalAnswered).toBe(before + 5);
    expect(s.notebook[0].clean).toBe(1); expect(s.notebook.length).toBe(1); // run misses never spawn new cards
    s = gameReducer(s, { type: 'NOTEBOOK_EXIT' }); expect(s.notebookRun).toBeNull(); expect(s.screen).toBe('notebook');
    s = gameReducer(s, { type: 'NOTEBOOK_DROP', entryId: s.notebook[0].id }); expect(s.notebook.length).toBe(0);
  });
});
