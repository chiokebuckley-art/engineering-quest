import { describe, it, expect } from 'vitest';
import { evaluate, outs, startStud, studChoose, studAnswer, studReveal, studCollect, payoutQuestion, studNet, stake, HAND_NAMES, PAYS, type Card } from '../state/stud';
import { oddsQuestion } from '../questions/odds';
import { createRng } from '../rng';
import { gameReducer } from '../state/reducer';
import { initialState } from '../state/initialState';
import { checkAnswer, generateQuestion } from '../questions';
import { lessonById } from '../../content/lessons';

const C = (s: string): Card => { const r = s.slice(0, -1); const suit = '♠♥♦♣'.indexOf(s.slice(-1)); return { r: r === 'A' ? 14 : r === 'K' ? 13 : r === 'Q' ? 12 : r === 'J' ? 11 : Number(r), s: suit }; };
const H = (...cs: string[]) => cs.map(C);

describe('Stud Math', () => {
  it('ranks hands by the Mississippi Stud paytable', () => {
    expect(evaluate(H('10♠', 'J♠', 'Q♠', 'K♠', 'A♠'))).toBe(11);
    expect(evaluate(H('5♥', '6♥', '7♥', '8♥', '9♥'))).toBe(10);
    expect(evaluate(H('A♠', '2♠', '3♠', '4♠', '5♠'))).toBe(10);
    expect(evaluate(H('9♠', '9♥', '9♦', '9♣', '2♠'))).toBe(9);
    expect(evaluate(H('9♠', '9♥', '9♦', '2♣', '2♠'))).toBe(8);
    expect(evaluate(H('2♦', '7♦', '9♦', 'J♦', 'K♦'))).toBe(7);
    expect(evaluate(H('5♥', '6♠', '7♥', '8♣', '9♥'))).toBe(6);
    expect(evaluate(H('A♠', '2♦', '3♠', '4♠', '5♥'))).toBe(6);
    expect(evaluate(H('9♠', '9♥', '9♦', '3♣', '2♠'))).toBe(5);
    expect(evaluate(H('9♠', '9♥', '3♦', '3♣', '2♠'))).toBe(4);
    expect(evaluate(H('J♠', 'J♥', '3♦', '4♣', '2♠'))).toBe(3);
    expect(evaluate(H('7♠', '7♥', '3♦', '4♣', '2♠'))).toBe(2);
    expect(evaluate(H('4♠', '4♥', '3♦', 'K♣', '2♠'))).toBe(1);
    expect(evaluate(H('4♠', '9♥', '3♦', 'K♣', '2♠'))).toBe(0);
    expect(evaluate(H('7♠', '7♥'))).toBe(2); expect(evaluate(H('K♠', 'K♥', 'K♦'))).toBe(5);
    expect(PAYS[7]).toBe(6); expect(HAND_NAMES[8]).toBe('Full house');
  });

  it('counts outs from the notes: two sevens give 2 of 50 = 4%', () => {
    const o = outs(H('7♠', '7♥'));
    expect(o).toMatchObject({ outs: 2, unseen: 50, percent: 4 });
    const k = outs(H('9♠', 'K♥')); // three kings → paying pair; nines → low pair (also a rank increase)
    expect(k.unseen).toBe(50); expect(k.outs).toBe(6);
    const q = oddsQuestion(6, 47); expect(q.answer).toBe(13); expect(checkAnswer(q, '13')).toBe(true); expect(checkAnswer(q, '12')).toBe(true); expect(checkAnswer(q, '20')).toBe(false);
    expect(generateQuestion('prob.outs', {}, { difficulty: 2 }).masterySkillId).toBe('prob.outs');
  });

  it('plays a hand: raises gated by questions, wrong answers drop to 1×, payout must be computed', () => {
    let st = startStud({ game: 'mult', key: 'mult:all' }, 200, createRng(3));
    expect(st.hole.length).toBe(2); expect(st.community.length).toBe(3); expect(st.status).toBe('decide');
    st = studChoose(st, 3, {}, createRng(1)); expect(st.status).toBe('question'); expect(st.pending!.mult).toBe(3);
    st = studAnswer(st, true, String(st.pending!.question.answer)); expect(st.bets).toEqual([30]); expect(st.status).toBe('reveal'); expect(st.earned).toBe(15); expect(st.lastFeedback).toContain('+15 gears');
    st = studReveal(st); expect(st.revealed).toBe(1); expect(st.status).toBe('decide');
    st = studChoose(st, 2, {}, createRng(2)); st = studAnswer(st, false, '0'); expect(st.bets).toEqual([30, 10]);
    st = studReveal(st); st = studChoose(st, 1, {}, createRng(3)); st = studAnswer(st, true, '1'); st = studReveal(st);
    expect(st.revealed).toBe(3); expect(stake(st)).toBe(60);
    expect(['collect', 'done']).toContain(st.status);
    if (st.status === 'collect') { const q = payoutQuestion(st); expect(q.answer).toBe(60 * st.result!.pays); st = studCollect(st, true, String(q.answer)); expect(studNet(st)).toBe(60 * st.result!.pays + 20); }
    else expect(studNet(st)).toBe((st.result!.rank === 2 ? 0 : -60) + 20);
    // Folding loses the stake so far.
    let f = startStud('odds', 200, createRng(9)); f = studChoose(f, 'fold', {}); expect(f.status).toBe('done'); expect(studNet(f)).toBe(-10);
    // Odds mode asks the outs question with the live numbers.
    let od = startStud('odds', 200, createRng(11)); od = studChoose(od, 2, {}); expect(od.pending!.question.expression).toContain('percent');
  });

  it('reducer: bankroll moves with bets, wins and loans; stats and achievements update', () => {
    let s = gameReducer(initialState(), { type: 'CREATE_CHARACTER', name: 'Zed', avatar: 'a', specialization: 'undecided' });
    expect(s.stats.stud.gears).toBe(200);
    s = gameReducer(s, { type: 'STUD_START', selection: { game: 'bonds', key: 'bonds:10' } });
    expect(s.stats.stud.gears).toBe(190); expect(s.screen).toBe('stud');
    for (let street = 0; street < 3; street++) {
      s = gameReducer(s, { type: 'STUD_CHOOSE', choice: 3 });
      s = gameReducer(s, { type: 'STUD_ANSWER', given: String(s.stud!.pending!.question.answer) });
      s = gameReducer(s, { type: 'STUD_REVEAL' });
    }
    expect(stake(s.stud!)).toBe(100); expect(s.stud!.earned).toBe(45); // three correct 3× answers pay 15 each
    if (s.stud!.status === 'collect') s = gameReducer(s, { type: 'STUD_COLLECT', given: String(payoutQuestion(s.stud!).answer) });
    expect(s.stud!.status).toBe('done');
    expect(s.stats.stud.hands).toBe(1);
    expect(s.stats.stud.gears).toBe(100 + 45 + (s.stud!.result!.collected ?? 0));
    expect(s.stats.totalAnswered).toBe(3);
    // Broke players cannot deal; a Gear Blitz pays 5 per correct answer plus 20 per star and returns to the table.
    s = { ...s, stud: null, stats: { ...s.stats, stud: { ...s.stats.stud, gears: 4 } } };
    s = gameReducer(s, { type: 'STUD_START', selection: 'odds' });
    expect(s.stud).toBeNull(); expect(s.stats.stud.gears).toBe(4); expect(s.toasts.at(-1)!.text).toContain('Gear Blitz');
    s = gameReducer(s, { type: 'ARCADE_START', game: 'bonds', mode: 'blitz', selection: 'bonds:10', durationMs: 60_000, reward: 'gears' });
    expect(s.arcade!.reward).toBe('gears');
    for (let i = 0; i < 4; i++) { s = gameReducer(s, { type: 'ARCADE_ANSWER', given: String(s.arcade!.question.answer) }); s = gameReducer(s, { type: 'ARCADE_NEXT' }); }
    s = gameReducer(s, { type: 'ARCADE_TIMEOUT' });
    expect(s.stats.stud.gears).toBe(4 + 4 * 5);
    s = gameReducer(s, { type: 'ARCADE_EXIT' }); expect(s.screen).toBe('stud');
    // Stopping a Gear Blitz early cashes out instead of discarding the run.
    s = gameReducer(s, { type: 'ARCADE_START', game: 'bonds', mode: 'blitz', selection: 'bonds:10', durationMs: 60_000, reward: 'gears' });
    for (let i = 0; i < 2; i++) { s = gameReducer(s, { type: 'ARCADE_ANSWER', given: String(s.arcade!.question.answer) }); s = gameReducer(s, { type: 'ARCADE_NEXT' }); }
    s = gameReducer(s, { type: 'ARCADE_EXIT' });
    expect(s.arcade!.status).toBe('finished'); expect(s.stats.stud.gears).toBe(4 + 4 * 5 + 2 * 5);
    s = gameReducer(s, { type: 'ARCADE_EXIT' }); expect(s.screen).toBe('stud'); expect(s.arcade).toBeNull();
    expect(lessonById('l.stud-outs')).toBeTruthy(); expect(lessonById('l.stud-ev')).toBeTruthy();
  });
});
