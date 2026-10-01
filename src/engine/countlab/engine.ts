import { createRng } from '../rng';

export const COUNT_LAB_ENABLED = true;
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const;
export const SUITS = ['♠', '♥', '♦', '♣'] as const;
export type Rank = typeof RANKS[number];
export interface Card { rank: Rank; suit: typeof SUITS[number]; id: string }
export const hiLo = (c: Card): number => ['A', '10', 'J', 'Q', 'K'].includes(c.rank) ? -1 : Number(c.rank) <= 6 ? 1 : 0;
export const cardValue = (c: Card): number => c.rank === 'A' ? 11 : ['J', 'Q', 'K'].includes(c.rank) ? 10 : Number(c.rank);
export const runningCount = (cards: Card[]) => cards.reduce((s, c) => s + hiLo(c), 0);
export const trueCount = (running: number, cardsLeft: number) => running / Math.max(cardsLeft / 52, 0.5);
export const halfCount = (n: number) => Math.sign(n) * Math.round(Math.abs(n) * 2) / 2;
export const signed = (n: number) => n > 0 ? `+${n}` : `${Object.is(n, -0) ? 0 : n}`;
export const spreadUnits = (tc: number) => tc < 1 ? 1 : tc < 3 ? 2 : tc < 5 ? 4 : 6;
export function chicagoDay(now = new Date()) { return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now); }
export function dailySeed(day = chicagoDay()) { return [...day].reduce((s, c) => (Math.imul(s, 31) + c.charCodeAt(0)) >>> 0, 2166136261); }
export function makeShoe(decks: number, seed: number): Card[] {
  if (!Number.isInteger(decks) || decks < 1 || decks > 9) throw Error('Choose 1–9 decks.');
  return createRng(seed).shuffle(Array.from({ length: decks }, (_, d) => SUITS.flatMap(suit => RANKS.map(rank => ({ rank, suit, id: `${d}-${suit}-${rank}` })))).flat());
}
export function total(cards: Card[]) {
  let value = cards.reduce((s, c) => s + cardValue(c), 0), aces = cards.filter(c => c.rank === 'A').length;
  while (value > 21 && aces > 0) { value -= 10; aces--; }
  return { value, soft: aces > 0 };
}
export interface Rules { decks: number; penetration: number; h17: boolean; das: boolean; rsa: boolean; surrender: boolean }
export const DEFAULT_RULES: Rules = { decks: 1, penetration: 0.75, h17: false, das: true, rsa: false, surrender: true };
export type Move = 'hit' | 'stand' | 'double' | 'split' | 'surrender';
export interface Hand { cards: Card[]; bet: number; split: boolean; splitAce: boolean; done: boolean; surrendered: boolean; result?: string }
export interface Table {
  rules: Rules; shoe: Card[]; pos: number; seen: Card[]; cut: number; dealer: Card[]; revealed: boolean;
  hands: Hand[]; active: number; phase: 'ready' | 'insurance' | 'player' | 'resolved'; chips: number;
  insurance: number; rounds: number; notes: string[]; startChips: number; roundStartChips: number; exhausted?: boolean;
}
export function newTable(rules: Rules, seed: number, chips = 250): Table {
  const r = { ...rules, decks: Math.max(1, Math.min(9, Math.round(rules.decks))), penetration: [0.5, 0.65, 0.75, 0.85].includes(rules.penetration) ? rules.penetration : 0.75 };
  return { rules: r, shoe: makeShoe(r.decks, seed), pos: 0, seen: [], cut: Math.floor(r.decks * 52 * r.penetration), dealer: [], revealed: false, hands: [], active: 0, phase: 'ready', chips, startChips: chips, roundStartChips: chips, insurance: 0, rounds: 0, notes: [] };
}
export const shoeFinished = (t: Table) => t.pos >= t.cut || !!t.exhausted || t.chips < 1;
const clone = (t: Table): Table => ({ ...t, seen: [...t.seen], dealer: [...t.dealer], hands: t.hands.map(h => ({ ...h, cards: [...h.cards] })), notes: [...t.notes] });
function draw(t: Table, visible = true) {
  const c = t.shoe[t.pos++];
  if (!c) throw Error('Shoe exhausted.');
  if (visible) t.seen.push(c);
  return c;
}
function reveal(t: Table) { if (!t.revealed && t.dealer[1]) { t.seen.push(t.dealer[1]); t.revealed = true; } }
const natural = (h: Hand) => !h.split && h.cards.length === 2 && total(h.cards).value === 21;
function settle(t: Table) {
  reveal(t);
  const dealerBJ = t.dealer.length === 2 && total(t.dealer).value === 21;
  if (!dealerBJ && t.hands.some(h => !h.surrendered && total(h.cards).value <= 21 && !natural(h))) {
    let d = total(t.dealer);
    while (d.value < 17 || (d.value === 17 && d.soft && t.rules.h17)) { t.dealer.push(draw(t)); d = total(t.dealer); }
  }
  const d = total(t.dealer).value;
  for (const h of t.hands) {
    const p = total(h.cards).value;
    if (h.surrendered) { t.chips += h.bet / 2; h.result = `Surrender · −${h.bet / 2} units`; }
    else if (p > 21) h.result = `Bust · −${h.bet} units`;
    else if (dealerBJ) { if (natural(h)) { t.chips += h.bet; h.result = 'Push · 0 units'; } else h.result = `Dealer blackjack · −${h.bet} units`; }
    else if (natural(h)) { t.chips += 2.5 * h.bet; h.result = `Blackjack 3:2 · +${1.5 * h.bet} units`; }
    else if (d > 21 || p > d) { t.chips += 2 * h.bet; h.result = `Win · +${h.bet} units`; }
    else if (p === d) { t.chips += h.bet; h.result = 'Push · 0 units'; }
    else h.result = `Dealer wins · −${h.bet} units`;
    h.done = true;
  }
  if (t.insurance) { t.chips += dealerBJ ? 3 * t.insurance : 0; t.notes.push(`Insurance: ${dealerBJ ? `+${2 * t.insurance}` : `−${t.insurance}`} practice units.`); }
  t.phase = 'resolved'; t.rounds++;
}
function peek(t: Table) {
  if ((cardValue(t.dealer[0]) >= 10 && total(t.dealer).value === 21) || natural(t.hands[0])) settle(t);
  else t.phase = 'player';
}
export function dealTable(table: Table, bet: number): Table {
  if (!['ready', 'resolved'].includes(table.phase) || shoeFinished(table) || ![1, 2, 4, 6].includes(bet) || bet > table.chips) return table;
  const t = clone(table); t.roundStartChips = t.chips; t.chips -= bet; t.insurance = 0; t.notes = []; t.dealer = []; t.revealed = false; t.active = 0;
  const h: Hand = { cards: [], bet, split: false, splitAce: false, done: false, surrendered: false };
  h.cards.push(draw(t)); t.dealer.push(draw(t)); h.cards.push(draw(t)); t.dealer.push(draw(t, false)); t.hands = [h];
  if (t.dealer[0].rank === 'A') t.phase = 'insurance'; else peek(t);
  return t;
}
export function insureTable(table: Table, yes: boolean): Table {
  if (table.phase !== 'insurance') return table;
  const t = clone(table), amount = t.hands[0].bet / 2;
  if (yes && t.chips < amount) return table;
  if (yes) { t.insurance = amount; t.chips -= amount; }
  peek(t); return t;
}
export function legalMoves(t: Table): Move[] {
  if (t.phase !== 'player') return [];
  const h = t.hands[t.active]; if (!h || h.done) return [];
  const pair = h.cards.length === 2 && h.cards[0].rank === h.cards[1].rank;
  const maySplit = pair && t.chips >= h.bet && (t.hands.length < 2 || (t.rules.rsa && h.cards[0].rank === 'A' && t.hands.length < 4));
  if (h.splitAce) return maySplit ? ['stand', 'split'] : ['stand'];
  const moves: Move[] = ['hit', 'stand'];
  if (h.cards.length === 2 && (!h.split || t.rules.das) && t.chips >= h.bet) moves.push('double');
  if (maySplit) moves.push('split');
  if (t.rules.surrender && !h.split && h.cards.length === 2) moves.push('surrender');
  return moves;
}
/** Total-dependent 4–8 deck baseline. Small shoes are deliberately labelled as approximations in the UI. */
export function baseline(cards: Card[], up: Card, allowed: Move[] = ['hit','stand','double','split','surrender'], h17 = false, das = true): Move {
  const { value: v, soft } = total(cards), d = cardValue(up), pair = cards.length === 2 && cards[0].rank === cards[1].rank, r = cardValue(cards[0]);
  if (!soft && allowed.includes('surrender') && ((v === 16 && !(pair && r === 8) && d >= 9) || (v === 15 && d === 10) || (h17 && d === 11 && [15,16,17].includes(v)))) return 'surrender';
  if (pair && allowed.includes('split') && (r === 11 || r === 8 || ([2,3].includes(r) && d <= 7 && (das || d >= 4)) || (r === 4 && das && [5,6].includes(d)) || (r === 6 && d <= 6 && (das || d >= 3)) || (r === 7 && d <= 7) || (r === 9 && (d <= 6 || d === 8 || d === 9)))) return 'split';
  if (allowed.includes('double') && (soft ? ((v === 13 || v === 14) && [5,6].includes(d)) || ((v === 15 || v === 16) && d >= 4 && d <= 6) || ((v === 17 || v === 18) && d >= 3 && d <= 6) || (h17 && v === 18 && d === 2) || (h17 && v === 19 && d === 6) : (v === 9 && d >= 3 && d <= 6) || (v === 10 && d <= 9) || (v === 11 && (d <= 10 || h17)))) return 'double';
  const move = (soft ? v >= 19 || (v === 18 && d <= 8) : v >= 17 || (v >= 13 && d <= 6) || (v === 12 && d >= 4 && d <= 6)) ? 'stand' : 'hit';
  return allowed.includes(move) ? move : allowed[0] || 'stand';
}
export function moveTable(table: Table, move: Move): Table {
  try { return applyMove(table, move); }
  catch (error) {
    if (!(error instanceof Error) || error.message !== 'Shoe exhausted.') throw error;
    // A rare long hand can exhaust a finite shoe. Roll back this atomic action,
    // reveal the existing hole card, and refund every stake from this round.
    const t = clone(table); reveal(t); t.chips = t.roundStartChips; t.exhausted = true;
    t.phase = 'resolved'; t.rounds++;
    for (const h of t.hands) { h.done = true; h.result = 'Shoe exhausted · round void · all stakes returned'; }
    t.notes.push('No replacement cards were invented. Start a fresh shoe after your count report.');
    return t;
  }
}
function applyMove(table: Table, move: Move): Table {
  if (!legalMoves(table).includes(move)) return table;
  const t = clone(table), h = t.hands[t.active], advice = baseline(h.cards, t.dealer[0], legalMoves(t), t.rules.h17, t.rules.das);
  t.notes.push(`${h.cards.map(c => c.rank).join(' + ')} vs ${t.dealer[0].rank}: you chose ${move}; multi-deck baseline ${advice}.`);
  if (move === 'hit') { h.cards.push(draw(t)); h.done = total(h.cards).value >= 21; }
  if (move === 'stand') h.done = true;
  if (move === 'surrender') { h.surrendered = true; h.done = true; }
  if (move === 'double') { t.chips -= h.bet; h.bet *= 2; h.cards.push(draw(t)); h.done = true; }
  if (move === 'split') {
    t.chips -= h.bet; const ace = h.cards[0].rank === 'A';
    const replacements = h.cards.map(c => ({ cards: [c, draw(t)], bet: h.bet, split: true, splitAce: ace, done: false, surrendered: false }));
    for (const sh of replacements) sh.done = total(sh.cards).value === 21 || (ace && (!t.rules.rsa || sh.cards[1].rank !== 'A'));
    t.hands.splice(t.active, 1, ...replacements);
  }
  while (t.active < t.hands.length && t.hands[t.active].done) t.active++;
  if (t.active >= t.hands.length) settle(t);
  return t;
}
export interface CountRecord {
  pinHash: string; salt: string; stage: number; cleanTracks: number; flashCorrect: number; sessions: number;
  reports: LabResult[]; badge: boolean; dailyBests: Record<string, number>; bestStreak: number; maxDecks: number; timers: boolean; coach: boolean;
}
export const initialCountRecord = (): CountRecord => ({ pinHash: '', salt: '', stage: 0, cleanTracks: 0, flashCorrect: 0, sessions: 0, reports: [], badge: false, dailyBests: {}, bestStreak: 0, maxDecks: 9, timers: true, coach: false });
export function migrateCountRecord(r?: Partial<CountRecord>): CountRecord {
  return { ...initialCountRecord(), ...r, stage: Math.max(0, Math.min(8, Math.floor(r?.stage || 0))), maxDecks: Math.max(1, Math.min(9, Math.floor(r?.maxDecks || 9))) };
}
export const unlockedDecks = (r: CountRecord) => Math.min(r.maxDecks, r.stage < 4 ? 1 : r.stage < 7 ? 2 : r.stage < 8 ? 6 : 9);
export type ResultKind = 'warmup' | 'flash' | 'running' | 'estimate' | 'true' | 'ev' | 'open' | 'hidden' | 'exam';
export interface LabResult { id: string; kind: ResultKind; correct: number; attempts: number; length?: number; perCard?: boolean; streak?: number; day?: string; examScore?: number; meanReactionMs?: number }
export function recordResult(record: CountRecord, result: LabResult): CountRecord {
  const r = { ...record, reports: [...(record.reports || []), result].slice(-20), dailyBests: { ...record.dailyBests }, sessions: record.sessions + 1 };
  const perfect = result.attempts > 0 && result.correct === result.attempts;
  if (result.kind === 'warmup' || result.kind === 'flash') { r.flashCorrect += result.correct; r.bestStreak = Math.max(r.bestStreak, result.streak || 0); }
  if (r.stage === 0 && result.kind === 'warmup' && perfect && result.attempts >= 10) r.stage = 1;
  else if (r.stage === 1 && result.kind === 'flash' && perfect && result.attempts >= 20) r.stage = 2;
  else if (r.stage === 2 && result.kind === 'running' && perfect && result.length === 15 && result.perCard) { r.cleanTracks++; if (r.cleanTracks >= 3) r.stage = 3; }
  else if (r.stage === 3 && result.kind === 'estimate' && perfect && result.attempts >= 5) r.stage = 4;
  else if (r.stage === 4 && result.kind === 'true' && perfect && result.attempts >= 9) r.stage = 5;
  else if (r.stage === 5 && result.kind === 'ev' && perfect && result.attempts >= 4) r.stage = 6;
  else if (r.stage === 6 && result.kind === 'open' && perfect && result.attempts >= 3) r.stage = 7;
  else if (r.stage === 7 && result.kind === 'hidden' && perfect && result.attempts >= 3) r.stage = 8;
  if (r.stage === 8 && result.kind === 'exam' && result.day && Number.isFinite(result.examScore)) {
    const score = Math.max(0, Math.min(100, result.examScore!));
    r.dailyBests[result.day] = Math.max(r.dailyBests[result.day] || 0, score);
    if (score >= 85) r.badge = true;
  }
  return r;
}
export interface CalcQuestion { decks: number; running: number; left: number; answer: number }
export function calcQuestions(seed: number): CalcQuestion[] {
  const rng = createRng(seed);
  return Array.from({ length: 9 }, (_, i) => { const decks = i + 1, halves = rng.int(1, decks * 2), running = rng.int(-8, 12); return { decks, running, left: halves * 26, answer: running / (halves / 2) }; });
}
export function examScore(flash: number, running: number, division: number, table: number) { return Math.round(25 * (flash + running + division + table)); }
