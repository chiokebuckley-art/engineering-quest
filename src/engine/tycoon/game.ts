import { createRng, type Rng } from '../rng';
import type { Question } from '../types';
import { checkAnswer } from '../questions';
import {
  SPACES, GROUPS, LEVELS, CELL, GO_BONUS, MAX_WORKSHOPS, LUXURY, groupSpaces, buyable, streetRent, railRent, utilRent, tollTax, mortgageValue, unmortgageCost,
  type Level, type GroupId, type RentCalc,
} from './board';
import { streetQuestion, moneyQuestion } from './questions';
import { lab, unit } from '../label';

/* ---------------- state ---------------- */

export type PlayerKind = 'human' | 'bot' | 'remote';
export type BotLevel = 'easy' | 'normal' | 'hard';
export interface PlayerStats { right: number; wrong: number; rentPaid: number; rentEarned: number; bought: number; built: number }
export interface TPlayer {
  id: string; name: string; kind: PlayerKind; bot?: BotLevel; color: string;
  gears: number; pos: number;
  /** Turns spent in the Error Book Cell; -1 when free. */
  jail: number;
  out: boolean;
  /** Sharp Mind tokens: 10% off the next rent. */
  sharp: number;
  stats: PlayerStats;
  /** Net worth at the end of each round, for the Ledger. */
  worth: number[];
}
export interface Deed { owner: string; workshops: number; mortgaged: boolean }
export interface Effect { to?: number; nearestRail?: boolean; back?: number; gears?: number; cell?: boolean }
export type Pending =
  | { kind: 'buy'; space: number; q: Question }
  | { kind: 'pay'; title: string; to: string; q: Question; amount: number }
  | { kind: 'collect'; title: string; q: Question; amount: number }
  | { kind: 'choice'; title: string; prompt: string; choices: string[]; answer: number; why: string; win: Effect; winText: string }
  | { kind: 'jailfix'; q: Question }
  | { kind: 'build'; space: number; q: Question; resume: 'roll' | 'done' }
  | { kind: 'park'; q: Question; amount: number };
/** What the player just answered, with the worked steps, shown until they tap Continue. */
export interface Review { player: string; title: string; correct: boolean; given: string; text: string; steps: string[]; q?: Question }
export interface LogLine { round: number; text: string; who?: string }
export interface TycoonSetup { level: Level; mode: 'quick' | 'classic'; players: { name: string; kind: PlayerKind; bot?: BotLevel; id?: string }[]; seed?: number }
export interface TycoonGame {
  v: 1; id: string; level: Level; mode: 'quick' | 'classic';
  /** Last round played (quick games end after it; classic games at a safety cap). */
  rounds: number; round: number; turn: number;
  players: TPlayer[]; deeds: Record<number, Deed>;
  phase: 'lobby' | 'roll' | 'act' | 'done' | 'over';
  dice: [number, number] | null; doubles: number;
  pending: Pending | null; review: Review | null;
  /** Ledger Park jar: each deposit, so the lander can add them up. */
  jar: number[];
  seed: number; step: number; rev: number;
  puzzle: number[]; chest: number[];
  log: LogLine[];
  winner?: string; startedAt: number; endedAt?: number;
  online?: { code: string; host: boolean; myId: string; lobby?: { id: string; name: string }[] };
}

export const COLORS = ['#2dd4bf', '#a78bfa', '#f59e0b', '#f472b6'];
export const JAIL_FEE = 50;
export const QUICK_ROUNDS = 15;
export const CLASSIC_ROUNDS = 60;
export const BOT_NAMES = ['Gearbot', 'Cogsworth', 'Sprocket'];
const BOT_SKILL: Record<BotLevel, { acc: number; reserve: number }> = { easy: { acc: 0.7, reserve: 60 }, normal: { acc: 0.85, reserve: 150 }, hard: { acc: 0.95, reserve: 250 } };

/* ---------------- helpers ---------------- */

const bump = (g: TycoonGame): TycoonGame => ({ ...g, rev: g.rev + 1 });
function draw(g: TycoonGame): [Rng, TycoonGame] { return [createRng((g.seed ^ Math.imul(g.step + 1, 2654435761)) >>> 0), { ...g, step: g.step + 1 }]; }
const log = (g: TycoonGame, text: string, who?: string): TycoonGame => ({ ...g, log: [...g.log, { round: g.round, text, who }].slice(-80) });
export const current = (g: TycoonGame) => g.players[g.turn];
const setPlayer = (g: TycoonGame, id: string, f: (p: TPlayer) => TPlayer): TycoonGame => ({ ...g, players: g.players.map((p) => (p.id === id ? f(p) : p)) });
export const playerById = (g: TycoonGame, id: string) => g.players.find((p) => p.id === id);
const alive = (g: TycoonGame) => g.players.filter((p) => !p.out);

export function ownsSet(g: TycoonGame, owner: string, group: GroupId): boolean {
  return groupSpaces(group).every((i) => g.deeds[i]?.owner === owner);
}
export function netWorth(g: TycoonGame, id: string): number {
  const p = playerById(g, id); if (!p) return 0;
  let w = p.gears;
  for (const [k, d] of Object.entries(g.deeds)) {
    if (d.owner !== id) continue;
    const s = SPACES[Number(k)];
    w += d.mortgaged ? mortgageValue(s.price!) : s.price!;
    if (s.group) w += d.workshops * GROUPS[s.group].workshop;
  }
  return w;
}
export const deedsOf = (g: TycoonGame, id: string) => Object.entries(g.deeds).filter(([, d]) => d.owner === id).map(([k]) => Number(k)).sort((a, b) => a - b);

/** The rent a player owes on a space, or null when nothing is due. */
export function rentFor(g: TycoonGame, space: number, diceTotal: number): (RentCalc & { owner: string }) | null {
  const d = g.deeds[space]; if (!d || d.mortgaged) return null;
  const s = SPACES[space];
  if (s.kind === 'prop') return { ...streetRent(g.level, s.price!, d.workshops, ownsSet(g, d.owner, s.group!)), owner: d.owner };
  if (s.kind === 'rail') { const n = SPACES.filter((x) => x.kind === 'rail' && g.deeds[x.i]?.owner === d.owner).length; return { ...railRent(n), owner: d.owner }; }
  if (s.kind === 'util') { const both = SPACES.filter((x) => x.kind === 'util').every((x) => g.deeds[x.i]?.owner === d.owner); return { ...utilRent(diceTotal, both), owner: d.owner }; }
  return null;
}

/* ---------------- setup ---------------- */

export function startTycoon(setup: TycoonSetup, now = Date.now()): TycoonGame {
  const seed = setup.seed ?? Math.floor(Math.random() * 2 ** 31);
  const rng = createRng(seed);
  const start = LEVELS[setup.level].start;
  const players: TPlayer[] = setup.players.slice(0, 4).map((p, i) => ({
    id: p.id ?? `p${i + 1}`, name: p.name, kind: p.kind, bot: p.bot, color: COLORS[i], gears: start, pos: 0, jail: -1, out: false, sharp: 0,
    stats: { right: 0, wrong: 0, rentPaid: 0, rentEarned: 0, bought: 0, built: 0 }, worth: [start],
  }));
  const g: TycoonGame = {
    v: 1, id: `t${seed.toString(36)}`, level: setup.level, mode: setup.mode, rounds: setup.mode === 'quick' ? QUICK_ROUNDS : CLASSIC_ROUNDS, round: 1, turn: 0,
    players, deeds: {}, phase: 'roll', dice: null, doubles: 0, pending: null, review: null, jar: [], seed, step: 0, rev: 1,
    puzzle: rng.shuffle(PUZZLE_CARDS.map((_, i) => i)), chest: rng.shuffle(CHEST_CARDS.map((_, i) => i)), log: [], startedAt: now,
  };
  return log(g, `A ${LEVELS[setup.level].name} game begins. Everyone starts with ${start} gears.`);
}

/* ---------------- money ---------------- */

/** Move gears between players, the bank ('bank') or the park jar ('jar'). Raises cash or bankrupts the payer if needed. */
function transfer(g: TycoonGame, from: string, to: string, amount: number, why: string): TycoonGame {
  if (amount <= 0) return g;
  let next = g;
  const payer = playerById(next, from);
  if (payer && payer.gears < amount) next = raiseCash(next, from, amount);
  const p2 = playerById(next, from);
  if (p2 && p2.gears < amount) return bankrupt(next, from, to, why);
  if (p2) next = setPlayer(next, from, (p) => ({ ...p, gears: p.gears - amount }));
  if (to === 'jar') next = { ...next, jar: [...next.jar, amount] };
  else if (to !== 'bank') next = setPlayer(next, to, (p) => ({ ...p, gears: p.gears + amount }));
  return next;
}
/** Sell workshops (half price) and mortgage deeds until the player can pay. */
function raiseCash(g: TycoonGame, id: string, need: number): TycoonGame {
  let next = g;
  const own = () => deedsOf(next, id);
  while ((playerById(next, id)?.gears ?? 0) < need) {
    const withShop = own().filter((i) => next.deeds[i].workshops > 0).sort((a, b) => b - a)[0];
    if (withShop !== undefined) {
      const s = SPACES[withShop]; const back = GROUPS[s.group!].workshop / 2;
      next = { ...next, deeds: { ...next.deeds, [withShop]: { ...next.deeds[withShop], workshops: next.deeds[withShop].workshops - 1 } } };
      next = setPlayer(next, id, (p) => ({ ...p, gears: p.gears + back }));
      next = log(next, `${playerById(next, id)!.name} sells a workshop on ${s.name} for ${back}.`, id);
      continue;
    }
    const free = own().filter((i) => !next.deeds[i].mortgaged)[0];
    if (free === undefined) break;
    const s = SPACES[free]; const val = mortgageValue(s.price!);
    next = { ...next, deeds: { ...next.deeds, [free]: { ...next.deeds[free], mortgaged: true } } };
    next = setPlayer(next, id, (p) => ({ ...p, gears: p.gears + val }));
    next = log(next, `${playerById(next, id)!.name} mortgages ${s.name} for ${val}.`, id);
  }
  return next;
}
function bankrupt(g: TycoonGame, id: string, creditor: string, why: string): TycoonGame {
  const p = playerById(g, id)!;
  let next = g;
  const toPlayer = creditor !== 'bank' && creditor !== 'jar' && !!playerById(g, creditor);
  if (toPlayer) next = setPlayer(next, creditor, (c) => ({ ...c, gears: c.gears + p.gears }));
  const deeds = { ...next.deeds };
  for (const i of deedsOf(next, id)) { if (toPlayer) deeds[i] = { ...deeds[i], owner: creditor, workshops: 0 }; else delete deeds[i]; }
  next = { ...next, deeds };
  next = setPlayer(next, id, (x) => ({ ...x, gears: 0, out: true }));
  next = log(next, `${p.name} can't pay ${why} and is out of the game.${toPlayer ? ` Their streets go to ${playerById(next, creditor)!.name}.` : ''}`, id);
  return next;
}

/* ---------------- moving and landing ---------------- */

export function roll(g: TycoonGame, dice?: [number, number]): TycoonGame {
  if (g.phase !== 'roll' || g.pending || g.review) return g;
  let [rng, next] = draw(g);
  const d: [number, number] = dice ?? [rng.int(1, 6), rng.int(1, 6)];
  const p = current(next);
  const isDouble = d[0] === d[1];
  next = { ...next, dice: d };
  if (p.jail >= 0) {
    // rolling for doubles to leave the cell
    if (isDouble) { next = setPlayer(next, p.id, (x) => ({ ...x, jail: -1 })); next = log(next, `${p.name} rolls ${d[0]} and ${d[1]}: doubles! Out of the Error Book Cell.`, p.id); next = { ...next, doubles: 0 }; return bump(move(next, d[0] + d[1], false)); }
    const tries = p.jail + 1;
    if (tries >= 3) {
      next = log(next, `${p.name} rolls ${d[0]} and ${d[1]}. Third try: pays ${JAIL_FEE} and leaves.`, p.id);
      next = transfer(next, p.id, 'jar', JAIL_FEE, 'the cell fee');
      next = setPlayer(next, p.id, (x) => ({ ...x, jail: -1 }));
      if (playerById(next, p.id)!.out) return bump(endTurn(next));
      return bump(move(next, d[0] + d[1], false));
    }
    next = setPlayer(next, p.id, (x) => ({ ...x, jail: tries }));
    next = log(next, `${p.name} rolls ${d[0]} and ${d[1]}: no doubles. Stays in the cell.`, p.id);
    return bump({ ...next, phase: 'done' });
  }
  const doubles = isDouble ? next.doubles + 1 : 0;
  if (doubles === 3) {
    next = log(next, `${p.name} rolls doubles three times in a row: off to the Error Book Cell.`, p.id);
    return bump({ ...sendToCell(next, p.id), phase: 'done', doubles: 0 });
  }
  next = log({ ...next, doubles }, `${p.name} rolls ${d[0]} + ${d[1]} = ${d[0] + d[1]} (dice total)${isDouble ? ' (doubles: roll again after this)' : ''}.`, p.id);
  return bump(move(next, d[0] + d[1], isDouble));
}

function sendToCell(g: TycoonGame, id: string): TycoonGame {
  return setPlayer(g, id, (p) => ({ ...p, pos: CELL, jail: 0 }));
}
function passStart(g: TycoonGame, id: string): TycoonGame {
  let next = setPlayer(g, id, (p) => ({ ...p, gears: p.gears + GO_BONUS }));
  const p = playerById(next, id)!;
  next = log(next, `${p.name} passes the Start Gate: +${GO_BONUS} gears.`, id);
  if (g.level === 'tycoon') {
    const interest = Math.round(p.gears * 0.05);
    next = setPlayer(next, id, (x) => ({ ...x, gears: x.gears + interest }));
    next = log(next, `Bank interest: 5% of ${p.gears} (your gears) = ${interest} (interest in gears).`, id);
  }
  return next;
}
/** Move forward by steps and resolve the landing. `again` = the player rolled doubles. */
function move(g: TycoonGame, steps: number, again: boolean): TycoonGame {
  const p = current(g);
  const to = (p.pos + steps) % 40;
  let next = setPlayer(g, p.id, (x) => ({ ...x, pos: to }));
  if (p.pos + steps >= 40) next = passStart(next, p.id);
  return land(next, again);
}
function moveTo(g: TycoonGame, to: number, again: boolean, collectOnPass = true): TycoonGame {
  const p = current(g);
  let next = setPlayer(g, p.id, (x) => ({ ...x, pos: to }));
  if (collectOnPass && to < p.pos) next = passStart(next, p.id);
  return land(next, again);
}
/** After the landing is fully resolved: roll again on doubles, otherwise the turn is done. */
const settle = (g: TycoonGame, again: boolean): TycoonGame => {
  const p = current(g);
  if (p.out) return endTurn(g);
  return { ...g, pending: null, phase: again && p.jail < 0 ? 'roll' : 'done' };
};
/** A pending decision; `again` is remembered in `doubles` (doubles > 0 means roll again after it). */
const ask = (g: TycoonGame, pending: Pending): TycoonGame => ({ ...g, pending, phase: 'act' });

function land(g: TycoonGame, again: boolean): TycoonGame {
  const p = current(g);
  const s = SPACES[p.pos];
  const total = g.dice ? g.dice[0] + g.dice[1] : 7;
  let next = g;
  switch (s.kind) {
    case 'prop': case 'rail': case 'util': {
      const d = next.deeds[s.i];
      if (!d) {
        let rng: Rng; [rng, next] = draw(next);
        const q = s.kind === 'prop' ? streetQuestion(next.level, s.group!, rng, false, s.name) : railUtilQuestion(next.level, s.name, s.price!, p.gears);
        return ask(next, { kind: 'buy', space: s.i, q });
      }
      if (d.owner === p.id) { next = log(next, `${p.name} lands on their own ${s.name}.`, p.id); return settle(next, again); }
      const rent = rentFor(next, s.i, total);
      if (!rent) { next = log(next, `${s.name} is mortgaged: no rent.`, p.id); return settle(next, again); }
      const owner = playerById(next, rent.owner)!;
      const detail = s.kind === 'prop' ? (d.workshops ? ` with ${d.workshops === MAX_WORKSHOPS ? 'an Engine Hall' : `${d.workshops} workshop${d.workshops > 1 ? 's' : ''}`}` : ownsSet(next, owner.id, s.group!) ? ' and the whole colour set' : '') : '';
      const q = moneyQuestion(`Rent on ${s.name}`, rent, `You landed on ${s.name}. ${owner.name} owns it${detail}. Work out the rent.`);
      return ask(next, { kind: 'pay', title: `Rent to ${owner.name}`, to: owner.id, q, amount: rent.amount });
    }
    case 'tax': {
      const calc = s.name === 'Toll Bridge' ? tollTax(next.level, p.gears) : { amount: LUXURY, expr: `${LUXURY}`, steps: [`The Luxury Levy is always ${LUXURY} gears.`] };
      if (next.level === 'junior' || s.name !== 'Toll Bridge') { next = log(next, `${p.name} pays the ${s.name}: ${calc.amount} gears into the park jar.`, p.id); next = transfer(next, p.id, 'jar', calc.amount, `the ${s.name}`); return settle(next, again); }
      return ask(next, { kind: 'pay', title: s.name, to: 'jar', q: moneyQuestion(s.name, calc, `Toll Bridge: pay 10% of your ${p.gears} gears, rounded to the nearest 10.`, 'percent'), amount: calc.amount });
    }
    case 'puzzle': case 'chest': return drawCard(next, s.kind, again);
    case 'park': {
      if (!next.jar.length) { next = log(next, `${p.name} rests in Ledger Park. The jar is empty.`, p.id); return settle(next, again); }
      const sum = next.jar.reduce((a, b) => a + b, 0);
      const q = moneyQuestion('Ledger Park jar', { amount: sum, expr: next.jar.join(' + '), steps: [`Add the deposits, in gears: ${next.jar.join(' + ')} = ${sum} (gears in the jar).`] }, 'Ledger Park! Say exactly how many gears are in the jar to take them all.', 'add.basic');
      return ask(next, { kind: 'park', q, amount: sum });
    }
    case 'gocell': next = log(next, `${p.name} goes to the Error Book Cell.`, p.id); return { ...sendToCell(next, p.id), phase: 'done', pending: null, doubles: 0 };
    default: return settle(next, again);
  }
}
function railUtilQuestion(_level: Level, name: string, price: number, gears: number): Question {
  if (gears < price) {
    const calc: RentCalc = { amount: price - gears, expr: `${price} (price) − ${gears} (your gears)`, steps: [`${price} (price) − ${gears} (your gears) = ${price - gears} (gears still needed).`] };
    return moneyQuestion(`Buy ${name}`, calc, `${name} costs ${price} gears and you have ${gears}. How many more gears would you need?`, 'sub.basic');
  }
  const calc: RentCalc = { amount: gears - price, expr: `${gears} (your gears) − ${price} (price)`, steps: [`${gears} (your gears) − ${price} (price) = ${gears - price} (gears left).`] };
  return moneyQuestion(`Buy ${name}`, calc, `Buy ${name} for ${price} gears. How many gears will you have left?`, 'sub.basic');
}

/* ---------------- cards ---------------- */

interface CardCtx { g: TycoonGame; p: TPlayer; rng: Rng }
type CardFx = { title: string; text: string; pending?: Pending; direct?: Effect };
const pickLv = <T,>(lv: Level, j: T, e: T, t: T) => (lv === 'junior' ? j : lv === 'explorer' ? e : t);

export const PUZZLE_CARDS: ((c: CardCtx) => CardFx)[] = [
  ({ g, rng }) => { const a = pickLv(g.level, rng.int(8, 12), rng.int(15, 25), rng.int(28, 45)); const b = pickLv(g.level, 5, rng.int(15, 25), rng.int(28, 45)); const t = pickLv(g.level, 50, 400, 1200); const ans = a * b < t ? 1 : 0; return { title: 'Estimate it', text: '', pending: { kind: 'choice', title: 'Estimate it', prompt: `Without working it out exactly: is ${a} × ${b} more or less than ${t}?`, choices: ['More', 'Less'], answer: a * b === t ? 0 : ans, why: `${a} × ${b} = ${a * b}.`, win: { nearestRail: true }, winText: 'Move to the nearest Rail line.' } }; },
  ({ g, rng }) => { const pairs = pickLv(g.level, [[47, 74], [36, 63], [59, 95]], [[2 / 3, 3 / 4, '2/3', '3/4'], [3 / 5, 1 / 2, '3/5', '1/2'], [5 / 8, 2 / 3, '5/8', '2/3']], [[0.45, 0.5, '0.45', '0.5'], [0.7, 0.65, '0.7', '0.65'], [3 / 8, 0.4, '3/8', '0.4']]) as (number | string)[][]; const pr = rng.pick(pairs); const [x, y] = [pr[0] as number, pr[1] as number]; const lx = String(pr[2] ?? x), ly = String(pr[3] ?? y); return { title: 'Which is bigger?', text: '', pending: { kind: 'choice', title: 'Which is bigger?', prompt: `Which is bigger: ${lx} or ${ly}?`, choices: [lx, ly], answer: x > y ? 0 : 1, why: `${lx} = ${+x.toFixed(3)} and ${ly} = ${+y.toFixed(3)}.`, win: { gears: 50 }, winText: 'Collect 50 gears.' } }; },
  () => ({ title: 'Express train', text: 'Advance to the Start Gate and collect 200 gears.', direct: { to: 0 } }),
  () => ({ title: 'Check your work', text: 'Go straight to the Error Book Cell. Do not pass the Start Gate.', direct: { cell: true } }),
  ({ g, rng }) => { const n = pickLv(g.level, rng.int(11, 99), rng.int(101, 999), rng.int(1001, 9999)); const to = pickLv(g.level, 10, 10, 100); const r = Math.round(n / to) * to; const wrong = [r + to, r - to].filter((x) => x > 0); const choices = rng.shuffle([r, ...wrong]).map(String); return { title: 'Round it', text: '', pending: { kind: 'choice', title: 'Round it', prompt: `Round ${n} to the nearest ${to}.`, choices, answer: choices.indexOf(String(r)), why: `${n} is closest to ${r}.`, win: { gears: 30 }, winText: 'Collect 30 gears.' } }; },
  () => ({ title: 'Park break', text: 'Take a walk to Ledger Park.', direct: { to: 20 } }),
  () => ({ title: 'Recount', text: 'Go back 3 spaces.', direct: { back: 3 } }),
  ({ g, rng }) => { const a = pickLv(g.level, rng.int(3, 9), rng.int(7, 19), rng.int(13, 39)), b = pickLv(g.level, rng.int(2, 5), rng.int(3, 13), rng.int(7, 23)); const odd = (a * b) % 2 === 1; return { title: 'Odd or even?', text: '', pending: { kind: 'choice', title: 'Odd or even?', prompt: `Is ${a} × ${b} odd or even? (You don't need to work it out.)`, choices: ['Odd', 'Even'], answer: odd ? 0 : 1, why: odd ? 'Odd × odd is always odd.' : 'If either number is even, the product is even.', win: { gears: 40 }, winText: 'Collect 40 gears.' } }; },
];

export const CHEST_CARDS: ((c: CardCtx) => CardFx)[] = [
  ({ g, p }) => { const calc: RentCalc = g.level === 'junior' ? { amount: Math.floor(p.gears / 100) * 10, expr: `${Math.floor(p.gears / 100)} (whole hundreds) × 10 (gears per hundred)`, steps: [`You have ${p.gears} gears: that is ${Math.floor(p.gears / 100)} whole hundreds.`, `${Math.floor(p.gears / 100)} (whole hundreds) × 10 (gears per hundred) = ${Math.floor(p.gears / 100) * 10} (interest in gears).`] } : { amount: Math.round(p.gears * 0.05), expr: `5% of ${p.gears} (your gears)`, steps: [`10% of ${p.gears} (your gears) is ${p.gears / 10} (tenth of your gears).`, `5% is half of that: ${p.gears / 10} (tenth of your gears) ÷ 2 = ${p.gears / 20} (${Number.isInteger(p.gears / 20) ? 'interest in gears' : 'exact interest'})${Number.isInteger(p.gears / 20) ? '' : `, which rounds to ${Math.round(p.gears * 0.05)} (interest in gears)`}.`] }; return { title: 'Interest day', text: '', pending: { kind: 'collect', title: 'Interest day', q: moneyQuestion('Interest day', calc, g.level === 'junior' ? `The bank pays 10 gears for every 100 you hold. You hold ${p.gears}.` : `The bank pays 5% on the ${p.gears} gears you hold (to the nearest gear).`, 'percent'), amount: calc.amount } }; },
  ({ g, p }) => { const shops = deedsOf(g, p.id).reduce((n, i) => n + g.deeds[i].workshops, 0); const each = g.level === 'junior' ? 10 : 15; if (!shops) return { title: 'Repair day', text: `Pay ${each} for each workshop you own. You have none, so you pay nothing.` }; const calc: RentCalc = { amount: shops * each, expr: `${lab(shops, unit(shops, 'workshop'))} × ${each} (gears per workshop)`, steps: [`${lab(shops, unit(shops, 'workshop'))} × ${each} (gears per workshop) = ${shops * each} (repair bill in gears).`] }; return { title: 'Repair day', text: '', pending: { kind: 'pay', title: 'Repair day', to: 'jar', q: moneyQuestion('Repair day', calc, `Pay ${each} gears for each of your ${shops} workshops.`), amount: calc.amount } }; },
  ({ g }) => { const n = alive(g).length - 1; const each = g.level === 'junior' ? 10 : 25; const calc: RentCalc = { amount: n * each, expr: `${lab(n, unit(n, 'other player'))} × ${each} (gears per player)`, steps: [`${lab(n, unit(n, 'other player'))} × ${each} (gears per player) = ${n * each} (gift in gears).`] }; return { title: 'Birthday', text: '', pending: { kind: 'collect', title: 'Birthday', q: moneyQuestion('Birthday', calc, `It's your birthday! The bank gives you ${each} gears for each other player.`), amount: calc.amount } }; },
  ({ g, rng }) => { const n = alive(g).length; const each = pickLv(g.level, rng.int(2, 6) * 5, rng.int(4, 15) * 5, rng.int(8, 30) * 5); const prize = n * each; const calc: RentCalc = { amount: each, expr: `${prize} (prize in gears) ÷ ${n} (players)`, steps: [`Share the prize equally: ${prize} (prize in gears) ÷ ${n} (players) = ${each} (gears each).`] }; return { title: 'Prize draw', text: '', pending: { kind: 'collect', title: 'Prize draw', q: moneyQuestion('Prize draw', calc, `A ${prize}-gear prize is shared equally between all ${n} players. How much is your share? (Everyone gets the same.)`, 'div'), amount: each } }; },
  ({ g, rng }) => { const a = pickLv(g.level, rng.int(11, 40), rng.int(45, 99), rng.int(120, 390)), b = pickLv(g.level, rng.int(5, 30), rng.int(26, 89), rng.int(85, 280)); const calc: RentCalc = { amount: a + b, expr: `${a} (first machine) + ${b} (second machine)`, steps: [`${a} (first machine) + ${b} (second machine) = ${a + b} (gears from the sale).`] }; return { title: 'Workshop sale', text: '', pending: { kind: 'collect', title: 'Workshop sale', q: moneyQuestion('Workshop sale', calc, `You sell two old machines for ${a} and ${b} gears.`, 'add.basic'), amount: a + b } }; },
  ({ g, rng }) => { const k = rng.int(2, 4), each = pickLv(g.level, 10, 25, 35); const calc: RentCalc = { amount: k * each, expr: `${k} (tools) × ${each} (gears per tool)`, steps: [`${k} (tools) × ${each} (gears per tool) = ${k * each} (hire cost in gears).`] }; return { title: 'Tool hire', text: '', pending: { kind: 'pay', title: 'Tool hire', to: 'jar', q: moneyQuestion('Tool hire', calc, `You hire ${k} tools at ${each} gears each.`), amount: k * each } }; },
  () => ({ title: 'Fast track', text: 'Advance to the Start Gate and collect 200 gears.', direct: { to: 0 } }),
];

function drawCard(g: TycoonGame, deck: 'puzzle' | 'chest', again: boolean): TycoonGame {
  let [rng, next] = draw(g);
  const order = next[deck];
  const idx = order[0];
  next = { ...next, [deck]: [...order.slice(1), idx] };
  const p = current(next);
  const fx = (deck === 'puzzle' ? PUZZLE_CARDS : CHEST_CARDS)[idx]({ g: next, p, rng });
  next = log(next, `${p.name} draws ${deck === 'puzzle' ? 'a Puzzle' : 'a Workshop Chest'} card: ${fx.title}.${fx.text ? ` ${fx.text}` : ''}`, p.id);
  if (fx.pending) return ask(next, fx.pending);
  if (fx.direct) return applyEffect(next, fx.direct, again);
  return settle(next, again);
}
function applyEffect(g: TycoonGame, e: Effect, again: boolean): TycoonGame {
  const p = current(g);
  if (e.gears) { const next = setPlayer(g, p.id, (x) => ({ ...x, gears: x.gears + e.gears! })); return settle(next, again); }
  if (e.cell) return { ...sendToCell(g, p.id), phase: 'done', pending: null, doubles: 0 };
  if (e.back) { const to = (p.pos - e.back + 40) % 40; return moveTo({ ...g, pending: null }, to, again, false); }
  if (e.nearestRail) { const rails = SPACES.filter((s) => s.kind === 'rail').map((s) => s.i); const to = rails.find((r) => r > p.pos) ?? rails[0]; return moveTo({ ...g, pending: null }, to, again); }
  if (e.to !== undefined) return moveTo({ ...g, pending: null }, e.to, again);
  return settle(g, again);
}

/* ---------------- answering ---------------- */

const rollAgain = (g: TycoonGame) => g.doubles > 0;
function tally(g: TycoonGame, id: string, ok: boolean): TycoonGame { return setPlayer(g, id, (p) => ({ ...p, stats: { ...p.stats, right: p.stats.right + (ok ? 1 : 0), wrong: p.stats.wrong + (ok ? 0 : 1) } })); }
const reviewOf = (p: TPlayer, title: string, correct: boolean, given: string, text: string, q?: Question): Review => ({ player: p.id, title, correct, given, text, steps: q?.solutionSteps ?? [], q });

/** Answer the pending question (typed answer, or a choice index as a string for choice cards). */
export function answer(g: TycoonGame, given: string): TycoonGame {
  const pd = g.pending; if (!pd || g.phase === 'over') return g;
  const p = current(g);
  const again = rollAgain(g);
  let next: TycoonGame = { ...g, pending: null };
  switch (pd.kind) {
    case 'buy': {
      const s = SPACES[pd.space];
      const ok = checkAnswer(pd.q, given);
      next = tally(next, p.id, ok);
      if (!ok) { next = log(next, `${p.name} answers ${given}: not quite. ${s.name} stays for sale.`, p.id); return bump(settle({ ...next, review: reviewOf(p, `Buy ${s.name}`, false, given, `Not this time: ${s.name} stays for sale.`, pd.q) }, again)); }
      if (p.gears < s.price!) { next = log(next, `${p.name} is right but can't afford ${s.name}.`, p.id); return bump(settle({ ...next, review: reviewOf(p, `Buy ${s.name}`, true, given, `Right, but ${s.name} costs ${s.price} and you have ${p.gears}.`, pd.q) }, again)); }
      next = setPlayer(next, p.id, (x) => ({ ...x, gears: x.gears - s.price!, stats: { ...x.stats, bought: x.stats.bought + 1 } }));
      next = { ...next, deeds: { ...next.deeds, [s.i]: { owner: p.id, workshops: 0, mortgaged: false } } };
      next = log(next, `${p.name} buys ${s.name} for ${s.price} gears.`, p.id);
      const set = s.group && ownsSet(next, p.id, s.group) ? ` That completes the ${GROUPS[s.group].name} set: rents double and you can build workshops.` : '';
      return bump(settle({ ...next, review: reviewOf(p, `Buy ${s.name}`, true, given, `Right! ${s.name} is yours.${set}`, pd.q) }, again));
    }
    case 'pay': {
      const ok = checkAnswer(pd.q, given);
      next = tally(next, p.id, ok);
      const discount = p.sharp > 0 && pd.to !== 'jar' ? Math.round(pd.amount / 10) : 0;
      const pay = pd.amount - discount;
      next = setPlayer(next, p.id, (x) => ({ ...x, sharp: Math.min(3, x.sharp - (discount ? 1 : 0) + (ok && pd.to !== 'jar' ? 1 : 0)), stats: { ...x.stats, rentPaid: x.stats.rentPaid + (pd.to !== 'jar' ? pay : 0) } }));
      if (pd.to !== 'jar') next = setPlayer(next, pd.to, (x) => ({ ...x, stats: { ...x.stats, rentEarned: x.stats.rentEarned + pay } }));
      next = transfer(next, p.id, pd.to, pay, pd.title.toLowerCase());
      const text = `${ok ? 'Right!' : `Not quite: it's ${pd.amount} gears.`}${discount ? ` A Sharp Mind token takes 10% off: you pay ${pd.amount} (amount due) − ${discount} (discount) = ${pay} (gears you pay).` : ` You pay ${pay} gears.`}${ok && pd.to !== 'jar' ? ' You earn a Sharp Mind token (10% off your next rent).' : ''}`;
      next = log(next, `${p.name} works out ${pd.title.toLowerCase()}: ${given} (${ok ? 'right' : `the answer was ${pd.amount}`}). Pays ${pay}.`, p.id);
      return bump(settle({ ...next, review: reviewOf(p, pd.title, ok, given, text, pd.q) }, again));
    }
    case 'collect': {
      const ok = checkAnswer(pd.q, given);
      next = tally(next, p.id, ok);
      const got = ok ? pd.amount : Math.floor(pd.amount / 2);
      next = setPlayer(next, p.id, (x) => ({ ...x, gears: x.gears + got }));
      next = log(next, `${p.name} collects ${got} gears (${pd.title}).`, p.id);
      return bump(settle({ ...next, review: reviewOf(p, pd.title, ok, given, ok ? `Right! Collect ${got} gears.` : `Not quite: it's ${pd.amount} gears. You collect half: ${got} gears.`, pd.q) }, again));
    }
    case 'choice': {
      const ok = Number(given) === pd.answer;
      next = tally(next, p.id, ok);
      next = log(next, `${p.name} answers “${pd.choices[Number(given)] ?? given}”: ${ok ? 'right' : 'not quite'}.`, p.id);
      const rv = reviewOf(p, pd.title, ok, pd.choices[Number(given)] ?? given, `${ok ? `Right! ${pd.winText}` : 'Not quite. Stay where you are.'} ${pd.why}`);
      next = { ...next, review: { ...rv, steps: [pd.why] } };
      return bump(ok ? applyEffect(next, pd.win, again) : settle(next, again));
    }
    case 'park': {
      const ok = checkAnswer(pd.q, given);
      next = tally(next, p.id, ok);
      if (ok) { next = setPlayer({ ...next, jar: [] }, p.id, (x) => ({ ...x, gears: x.gears + pd.amount })); next = log(next, `${p.name} counts the jar exactly and takes ${pd.amount} gears!`, p.id); }
      else next = log(next, `${p.name} miscounts the jar. It stays for the next visitor.`, p.id);
      return bump(settle({ ...next, review: reviewOf(p, 'Ledger Park jar', ok, given, ok ? `Right! You take all ${pd.amount} gears.` : `Not quite: it holds ${pd.amount} gears. The jar stays.`, pd.q) }, again));
    }
    case 'jailfix': {
      const ok = checkAnswer(pd.q, given);
      next = tally(next, p.id, ok);
      if (ok) { next = setPlayer(next, p.id, (x) => ({ ...x, jail: -1 })); next = log(next, `${p.name} fixes a mistake and leaves the Error Book Cell.`, p.id); return bump({ ...next, phase: 'roll', review: reviewOf(p, 'Fix a mistake', true, given, 'Fixed! You are free. Roll the dice.', pd.q) }); }
      next = setPlayer(next, p.id, (x) => ({ ...x, jail: x.jail + 1 }));
      next = log(next, `${p.name} tries to fix a mistake but misses. Stays in the cell.`, p.id);
      return bump({ ...next, phase: 'done', review: reviewOf(p, 'Fix a mistake', false, given, 'Not yet. You stay in the cell this turn; try again next turn.', pd.q) });
    }
    case 'build': {
      const s = SPACES[pd.space]; const cost = GROUPS[s.group!].workshop;
      const ok = checkAnswer(pd.q, given);
      next = tally(next, p.id, ok);
      if (!ok) { next = log(next, `${p.name} misses the building question for ${s.name}.`, p.id); return bump({ ...next, phase: pd.resume, review: reviewOf(p, `Build on ${s.name}`, false, given, 'Not quite, so no workshop this time. You can try again on a later turn.', pd.q) }); }
      const d = next.deeds[s.i];
      next = setPlayer(next, p.id, (x) => ({ ...x, gears: x.gears - cost, stats: { ...x.stats, built: x.stats.built + 1 } }));
      next = { ...next, deeds: { ...next.deeds, [s.i]: { ...d, workshops: d.workshops + 1 } } };
      const hall = d.workshops + 1 === MAX_WORKSHOPS;
      next = log(next, `${p.name} builds ${hall ? 'an Engine Hall' : 'a workshop'} on ${s.name} (${cost} gears).`, p.id);
      const r = streetRent(next.level, s.price!, d.workshops + 1, true);
      return bump({ ...next, phase: pd.resume, review: reviewOf(p, `Build on ${s.name}`, true, given, `Right! ${hall ? 'Engine Hall' : 'Workshop'} built. Rent there is now ${r.expr} = ${r.amount} (rent in gears).`, pd.q) });
    }
    default: return g;
  }
}

/** Clear the answer review. */
export const ack = (g: TycoonGame): TycoonGame => (g.review ? bump({ ...g, review: null }) : g);

/** Walk away from a street without buying it. */
export function passBuy(g: TycoonGame): TycoonGame {
  if (g.pending?.kind !== 'buy') return g;
  const p = current(g);
  return bump(settle(log({ ...g, pending: null }, `${p.name} leaves ${SPACES[g.pending.space].name} for now.`, p.id), rollAgain(g)));
}

/* ---------------- the Error Book Cell ---------------- */

/** At the start of a turn in the cell: fix a mistake (a question), pay the fee, or try for doubles. */
export function jailChoice(g: TycoonGame, choice: 'fix' | 'pay' | 'roll', fix?: Question): TycoonGame {
  const p = current(g);
  if (g.phase !== 'roll' || p.jail < 0 || g.pending || g.review) return g;
  if (choice === 'pay') {
    let next = transfer(g, p.id, 'jar', JAIL_FEE, 'the cell fee');
    next = setPlayer(next, p.id, (x) => ({ ...x, jail: -1 }));
    return bump(log(next, `${p.name} pays ${JAIL_FEE} and leaves the cell.`, p.id));
  }
  if (choice === 'fix') {
    let q = fix;
    let next = g;
    if (!q) { let rng: Rng; [rng, next] = draw(next); const groups = Object.keys(GROUPS) as GroupId[]; q = streetQuestion(next.level, rng.pick(groups), rng); }
    return bump(ask(next, { kind: 'jailfix', q: { ...q, prompt: `Fix a mistake: ${q.prompt}` } }));
  }
  return roll(g);
}

/* ---------------- building and mortgages ---------------- */

export function canBuild(g: TycoonGame, space: number): string | null {
  const p = current(g); const s = SPACES[space]; const d = g.deeds[space];
  if (!d || d.owner !== p.id || s.kind !== 'prop') return 'You can only build on your own streets.';
  if (!ownsSet(g, p.id, s.group!)) return `Own the whole ${GROUPS[s.group!].name} set first.`;
  if (groupSpaces(s.group!).some((i) => g.deeds[i].mortgaged)) return 'Buy back the mortgaged streets in this set first.';
  if (d.workshops >= MAX_WORKSHOPS) return 'This street already has an Engine Hall.';
  if (p.gears < GROUPS[s.group!].workshop) return `A workshop here costs ${GROUPS[s.group!].workshop} gears.`;
  if (g.phase !== 'roll' && g.phase !== 'done') return 'Finish what you are doing first.';
  if (g.pending || g.review) return 'Finish what you are doing first.';
  return null;
}
export function startBuild(g: TycoonGame, space: number): TycoonGame {
  if (canBuild(g, space)) return g;
  let [rng, next] = draw(g);
  const s = SPACES[space];
  const q = streetQuestion(next.level, s.group!, rng, true, s.name);
  return bump({ ...next, pending: { kind: 'build', space, q, resume: next.phase as 'roll' | 'done' }, phase: 'act' });
}
export function cancelBuild(g: TycoonGame): TycoonGame {
  return g.pending?.kind === 'build' ? bump({ ...g, pending: null, phase: g.pending.resume }) : g;
}
export function toggleMortgage(g: TycoonGame, space: number): TycoonGame {
  const p = current(g); const d = g.deeds[space]; const s = SPACES[space];
  if (!d || d.owner !== p.id || g.pending || g.review || (g.phase !== 'roll' && g.phase !== 'done')) return g;
  if (!d.mortgaged) {
    if (s.group && groupSpaces(s.group).some((i) => (g.deeds[i]?.workshops ?? 0) > 0)) return g;
    const val = mortgageValue(s.price!);
    const next = setPlayer({ ...g, deeds: { ...g.deeds, [space]: { ...d, mortgaged: true } } }, p.id, (x) => ({ ...x, gears: x.gears + val }));
    return bump(log(next, `${p.name} mortgages ${s.name} for ${val} gears.`, p.id));
  }
  const cost = unmortgageCost(s.price!);
  if (p.gears < cost) return g;
  const next = setPlayer({ ...g, deeds: { ...g.deeds, [space]: { ...d, mortgaged: false } } }, p.id, (x) => ({ ...x, gears: x.gears - cost }));
  return bump(log(next, `${p.name} buys back ${s.name} for ${cost} gears (half price + 10%).`, p.id));
}

/* ---------------- turns and the end ---------------- */

export function endTurn(g: TycoonGame): TycoonGame {
  if (g.phase === 'over') return g;
  if (g.pending) return g;
  let next: TycoonGame = { ...g, pending: null, review: null, doubles: 0, dice: g.dice };
  const living = alive(next);
  if (living.length <= 1) return finish(next);
  let t = next.turn; let wrapped = false;
  do { t = (t + 1) % next.players.length; if (t === 0) wrapped = true; } while (next.players[t].out);
  if (wrapped) {
    next = { ...next, players: next.players.map((p) => ({ ...p, worth: [...p.worth, p.out ? 0 : netWorth(next, p.id)] })) };
    if (next.round >= next.rounds) return finish(next);
    next = { ...next, round: next.round + 1 };
  }
  next = { ...next, turn: t, phase: 'roll' };
  const p = current(next);
  if (p.jail >= 0) next = log(next, `${p.name} is in the Error Book Cell: fix a mistake, pay ${JAIL_FEE}, or try for doubles.`, p.id);
  return bump(next);
}
export function finish(g: TycoonGame, now = Date.now()): TycoonGame {
  const ranked = [...g.players].filter((p) => !p.out).sort((a, b) => netWorth(g, b.id) - netWorth(g, a.id));
  const winner = ranked[0]?.id;
  const next = { ...g, phase: 'over' as const, pending: null, winner, endedAt: now, players: g.players.map((p) => (p.worth.length && p.worth[p.worth.length - 1] === netWorth(g, p.id) ? p : { ...p, worth: [...p.worth, p.out ? 0 : netWorth(g, p.id)] })) };
  return bump(log(next, `Game over! ${playerById(next, winner!)?.name ?? 'Nobody'} wins with ${netWorth(next, winner!)} gears of net worth.`));
}
export function standings(g: TycoonGame) {
  return [...g.players].map((p) => ({ p, worth: p.out ? 0 : netWorth(g, p.id) })).sort((a, b) => (a.p.out === b.p.out ? b.worth - a.worth : a.p.out ? 1 : -1));
}

/* ---------------- computer players ---------------- */

function botAnswerFor(g: TycoonGame, rng: Rng, acc: number): string {
  const pd = g.pending!;
  const right = rng.chance(acc);
  if (pd.kind === 'choice') return String(right ? pd.answer : (pd.answer + 1) % pd.choices.length);
  const q = pd.q;
  if (right) return q.answerText ?? String(q.answer);
  const off = Math.max(1, Math.round(Math.abs(q.answer) * 0.1)) * (rng.chance(0.5) ? 1 : -1);
  return String(Math.round((q.answer + off) * 100) / 100);
}

/** One decision for the current computer player. Call repeatedly (with a pause) until it is a human's turn. */
export function botStep(g: TycoonGame): TycoonGame {
  const p = current(g);
  if (p.kind !== 'bot' || g.phase === 'over') return g;
  const skill = BOT_SKILL[p.bot ?? 'normal'];
  if (g.review) return ack(g);
  let [rng, next] = draw(g);
  if (next.pending) {
    const pd = next.pending;
    if (pd.kind === 'buy') {
      const s = SPACES[pd.space];
      const completes = s.group ? groupSpaces(s.group).filter((i) => i !== s.i).every((i) => next.deeds[i]?.owner === p.id) : false;
      if (p.gears - s.price! < skill.reserve && !(completes && p.gears >= s.price!)) return passBuy(next);
    }
    return answer(next, botAnswerFor(next, rng, skill.acc));
  }
  if (next.phase === 'roll' && p.jail >= 0) {
    const choice = p.bot === 'hard' && next.round < 10 && p.gears > 300 ? 'pay' : p.bot === 'easy' ? 'roll' : 'fix';
    return jailChoice(next, choice);
  }
  if (next.phase === 'roll' || next.phase === 'done') {
    // build where it can afford to, keeping a reserve
    const target = deedsOf(next, p.id).find((i) => !canBuild(next, i) && p.gears - GROUPS[SPACES[i].group!].workshop >= skill.reserve && rng.chance(0.8));
    if (target !== undefined) return startBuild(next, target);
    // buy back a mortgage when rich
    const mort = deedsOf(next, p.id).find((i) => next.deeds[i].mortgaged && p.gears - unmortgageCost(SPACES[i].price!) > skill.reserve * 2);
    if (mort !== undefined) return toggleMortgage(next, mort);
  }
  if (next.phase === 'roll') return roll(next);
  if (next.phase === 'done') return endTurn(next);
  return next;
}

/** Views and checks the screen needs. */
export const isHumanTurn = (g: TycoonGame) => current(g).kind === 'human';
export { buyable };
