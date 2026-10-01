import type { Difficulty, MasteryRecord, Question } from '../types';
import type { ArcadeGame } from './types';
import { createRng, type Rng } from '../rng';
import { generateFromSkills, answerLabel } from '../questions';
import { oddsQuestion } from '../questions/odds';
import { nextQuestionId } from '../questions/context';
import { parseSelection } from './arcade';

/**
 * STUD MATH — Mississippi Stud with gear tokens instead of money.
 * Two hole cards, three community cards flipped one at a time. Before each flip the
 * player folds or raises 1×, 2× or 3× the ante; the raise size sets the difficulty of
 * the question that must be answered to flip the card. At showdown a winning hand pays
 * by the paytable, and the player must compute their own winnings to collect them.
 */
export interface Card { r: number; s: number } // rank 2..14 (14 = ace), suit 0..3
export const SUITS = ['♠', '♥', '♦', '♣'];
export const RANKS: Record<number, string> = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
export const cardLabel = (c: Card) => `${RANKS[c.r] ?? c.r}${SUITS[c.s]}`;

export type HandRank = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
export const HAND_NAMES = ['High card', 'Low pair (2–5)', 'Pair of 6s–10s', 'Pair of jacks or better', 'Two pair', 'Three of a kind', 'Straight', 'Flush', 'Full house', 'Four of a kind', 'Straight flush', 'Royal flush'];
/** Profit per 1 staked. Rank 2 pushes (stake returned). */
export const PAYS = [0, 0, 0, 1, 2, 3, 4, 6, 10, 40, 100, 500];
export const ANTE = 10;
export const START_GEARS = 200;
/** Gears paid for a correct street answer, per 1× of the raise (1× → 5, 2× → 10, 3× → 15). */
export const STREET_BONUS = 5;

export function freshDeck(rng: Rng): Card[] {
  const d: Card[] = [];
  for (let s = 0; s < 4; s++) for (let r = 2; r <= 14; r++) d.push({ r, s });
  return rng.shuffle(d);
}

/** Rank any 2–5 cards. Straights and flushes only count with five cards. */
export function evaluate(cards: Card[]): HandRank {
  const counts = new Map<number, number>();
  for (const c of cards) counts.set(c.r, (counts.get(c.r) ?? 0) + 1);
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const [top, second] = groups;
  if (cards.length === 5) {
    const flush = cards.every((c) => c.s === cards[0].s);
    const rs = [...new Set(cards.map((c) => c.r))].sort((a, b) => a - b);
    const wheel = rs.join(',') === '2,3,4,5,14';
    const straight = rs.length === 5 && (rs[4] - rs[0] === 4 || wheel);
    if (straight && flush) return rs[0] === 10 ? 11 : 10;
    if (top[1] === 4) return 9;
    if (top[1] === 3 && second?.[1] === 2) return 8;
    if (flush) return 7;
    if (straight) return 6;
  }
  if (top?.[1] === 4) return 9;
  if (top?.[1] === 3 && second?.[1] === 2) return 8;
  if (top?.[1] === 3) return 5;
  if (top?.[1] === 2 && second?.[1] === 2) return 4;
  if (top?.[1] === 2) return top[0] >= 11 ? 3 : top[0] >= 6 ? 2 : 1;
  return 0;
}

/** Unseen cards that would raise the hand's rank on the next flip. */
export function outs(known: Card[]): { outs: number; unseen: number; percent: number; examples: string[] } {
  const seen = new Set(known.map((c) => `${c.r}-${c.s}`));
  const current = evaluate(known);
  let n = 0; let unseen = 0; const examples: string[] = [];
  for (let s = 0; s < 4; s++) for (let r = 2; r <= 14; r++) {
    if (seen.has(`${r}-${s}`)) continue;
    unseen++;
    if (evaluate([...known, { r, s }]) > current) { n++; if (examples.length < 6) examples.push(cardLabel({ r, s })); }
  }
  return { outs: n, unseen, percent: Math.round((100 * n) / unseen), examples };
}

export type StudStatus = 'decide' | 'question' | 'reveal' | 'showdown' | 'collect' | 'done';
export interface StudState {
  selection: { game: ArcadeGame; key: string } | 'odds';
  seed: number;
  hole: Card[];
  community: Card[];
  /** How many community cards are face up (0–3). */
  revealed: number;
  ante: number;
  /** Raise placed at each street (0 = not yet). */
  bets: number[];
  status: StudStatus;
  /** Multiplier chosen for the current street and the question that must be answered. */
  pending?: { mult: 1 | 2 | 3; question: Question; correct?: boolean; given?: string };
  /** Showdown result. */
  result?: { rank: HandRank; pays: number; stake: number; profit: number; collected?: number; guess?: string; guessRight?: boolean };
  folded?: boolean;
  /** Gears earned from correct street answers this hand. */
  earned: number;
  /** Gears before this hand (for the result panel). */
  gearsBefore: number;
  newBest?: boolean;
  lastFeedback?: string;
}

export interface StudRecord {
  gears: number;
  hands: number;
  wins: number;
  /** Biggest single-hand profit. */
  best: number;
  /** Best hand rank ever made. */
  bestRank: number;
  loans: number;
}
export const initialStud = (): StudRecord => ({ gears: START_GEARS, hands: 0, wins: 0, best: 0, bestRank: 0, loans: 0 });

export const stake = (st: StudState) => st.ante + st.bets.reduce((a, b) => a + b, 0);
export const known = (st: StudState) => [...st.hole, ...st.community.slice(0, st.revealed)];

export function startStud(selection: StudState['selection'], gears: number, rng = createRng()): StudState {
  const seed = Math.floor(rng.next() * 1e9);
  const deck = freshDeck(createRng(seed));
  return { selection, seed, hole: deck.slice(0, 2), community: deck.slice(2, 5), revealed: 0, ante: ANTE, bets: [], status: 'decide', gearsBefore: gears, earned: 0 };
}

const MULT_DIFF: Record<1 | 2 | 3, number> = { 1: 0, 2: 1, 3: 2 };

/** The question that guards this street: harder for a bigger raise. */
export function streetQuestion(st: StudState, mult: 1 | 2 | 3, mastery: Record<string, MasteryRecord>, rng: Rng): Question {
  if (st.selection === 'odds') {
    const o = outs(known(st));
    return oddsQuestion(o.outs, o.unseen, `${st.revealed === 0 ? 'Two cards known' : `${known(st).length} cards known`}. ${o.outs} of the ${o.unseen} unseen cards improve your hand.`);
  }
  const sel = parseSelection(st.selection.game, st.selection.key);
  const difficulty = Math.min(6, sel.difficulty + MULT_DIFF[mult]) as Difficulty;
  return generateFromSkills(sel.skillIds, mastery, { rng, difficulty, recentFacts: [] });
}

export function studChoose(st: StudState, choice: 1 | 2 | 3 | 'fold', mastery: Record<string, MasteryRecord>, rng = createRng()): StudState {
  if (st.status !== 'decide') return st;
  if (choice === 'fold') return { ...st, status: 'done', folded: true, result: { rank: evaluate(known(st)), pays: 0, stake: stake(st), profit: -stake(st) } };
  return { ...st, status: 'question', pending: { mult: choice, question: streetQuestion(st, choice, mastery, rng) } };
}

export function studAnswer(st: StudState, correct: boolean, given: string): StudState {
  if (st.status !== 'question' || !st.pending) return st;
  const mult = correct ? st.pending.mult : 1;
  const bonus = correct ? STREET_BONUS * st.pending.mult : 0;
  const feedback = correct ? `Correct! +${bonus} gears. Raise ${st.pending.mult}× stands: ${st.pending.mult * st.ante} gears on the line.` : `Wrong. Your raise drops to 1× (${st.ante} gears). Answer: ${answerLabel(st.pending.question)}.`;
  return { ...st, status: 'reveal', bets: [...st.bets, mult * st.ante], pending: { ...st.pending, correct, given }, lastFeedback: feedback, earned: st.earned + bonus };
}

/** Flip the next community card. After the fifth card, go to showdown. */
export function studReveal(st: StudState): StudState {
  if (st.status !== 'reveal') return st;
  const revealed = st.revealed + 1;
  const next: StudState = { ...st, revealed, pending: undefined, lastFeedback: undefined };
  if (revealed < 3) return { ...next, status: 'decide' };
  const rank = evaluate([...st.hole, ...st.community]);
  const pays = PAYS[rank]; const total = stake(st);
  const profit = rank === 2 ? 0 : pays > 0 ? total * pays : -total;
  const result = { rank, pays, stake: total, profit };
  // Winning hands: the player must work out the payout to collect it. Pushes and losses settle at once.
  return { ...next, status: pays > 0 ? 'collect' : 'done', result: pays > 0 ? result : { ...result, collected: rank === 2 ? total : 0 } };
}

/** The payout question: stake × pays. Right → full winnings; wrong → only the ante's share. */
export function payoutQuestion(st: StudState): Question {
  const r = st.result!;
  return {
    id: nextQuestionId('payout'), masterySkillId: 'mult', topic: 'Payout', subtopic: HAND_NAMES[r.rank], difficulty: 3, mode: 'applied',
    prompt: `${HAND_NAMES[r.rank]}! It pays ${r.pays} to 1 and you staked ${r.stake} gears.`, expression: `${r.stake} (gears staked) × ${r.pays} (profit per gear) = ?`, answer: r.profit, unit: 'gears',
    hint: `${r.pays} to 1 means ${r.pays} gears of profit for every 1 gear staked.`, solutionSteps: [`${r.stake} (gears staked) × ${r.pays} (profit per gear) = ${r.profit} (gears of profit).`],
    explanation: [`"${r.pays} to 1" means every gear you staked wins ${r.pays} more.`, `${r.stake} (gears staked) × ${r.pays} (profit per gear) = ${r.profit} (gears of profit), and your ${r.stake} gears staked come back too.`],
    visual: { type: 'none' }, prerequisites: ['mult'],
  };
}

export function studCollect(st: StudState, correct: boolean, given: string): StudState {
  if (st.status !== 'collect' || !st.result) return st;
  const r = st.result;
  const collected = r.stake + (correct ? r.profit : st.ante * r.pays);
  return { ...st, status: 'done', result: { ...r, collected, guess: given, guessRight: correct } };
}

/** Net change to the bankroll when a hand is done, question bonuses included. */
export function studNet(st: StudState): number {
  if (!st.result) return 0;
  if (st.folded) return st.earned - st.result.stake;
  return (st.result.collected ?? 0) - st.result.stake + st.earned;
}

