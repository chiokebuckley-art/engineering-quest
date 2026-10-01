import { normalizeGearAvatar, type GearAvatarId } from './gearAvatars';
import { applyDiceEvent, totals, CATEGORIES, MODES, type DiceRun, type Mode, type Category, type DiceData } from './diceWorkshop';

/**
 * Online Dice Workshop: two to four players share a table, each with their own scorecard. Players take turns
 * (roll up to three times, check the maths, score a category); everyone sees the dice live. The host's device
 * runs the table and applies each guest's moves only on that guest's turn.
 */

export interface DicePlayer { id: string; name: string; avatar: GearAvatarId; run: DiceRun; attempts: number; correct: number; left?: boolean }
export interface DiceSeat { id: string; name: string; avatar: GearAvatarId }
export interface DiceTable {
  v: 1; rev: number; phase: 'lobby' | 'playing' | 'over'; mode: Mode;
  players: DicePlayer[]; turn: number;
  log: string[];
  online: { code: string; host: boolean; myId: string; lobby: DiceSeat[] };
}
export type DiceAction =
  | { kind: 'roll' } | { kind: 'hold'; index: number } | { kind: 'check'; sum: string; group: string }
  | { kind: 'reveal' } | { kind: 'score'; category: Category };

const newRun = (mode: Mode): DiceRun => applyDiceEvent({ avatar: 'engineer', best: 0, games: 0, attempts: 0, correct: 0, run: null }, { kind: 'start', mode, avatar: 'engineer' }).run!;
const seat = (x: DiceSeat): DiceSeat => ({ id: String(x.id).slice(0, 20), name: String(x.name).trim().slice(0, 20) || 'Player', avatar: normalizeGearAvatar(x.avatar) });

export function hostTable(mode: Mode, code: string, me: DiceSeat): DiceTable {
  return { v: 1, rev: 1, phase: 'lobby', mode, players: [], turn: 0, log: [], online: { code, host: true, myId: me.id, lobby: [seat(me)] } };
}
export function joinTable(code: string, me: DiceSeat): DiceTable {
  return { v: 1, rev: 0, phase: 'lobby', mode: 'both', players: [], turn: 0, log: [], online: { code, host: false, myId: me.id, lobby: [] } };
}
export function setTableRoster(t: DiceTable, seats: DiceSeat[]): DiceTable {
  if (t.phase !== 'lobby' || !t.online.host) return t;
  return { ...t, rev: t.rev + 1, online: { ...t.online, lobby: seats.slice(0, 4).map(seat) } };
}
export function launchTable(t: DiceTable): DiceTable {
  if (t.phase !== 'lobby' || !t.online.host || t.online.lobby.length < 2) return t;
  const players = t.online.lobby.map((s) => ({ ...s, run: newRun(t.mode), attempts: 0, correct: 0 }));
  return { ...t, rev: t.rev + 1, phase: 'playing', players, turn: 0, log: [`${players[0].name} goes first.`] };
}

export const currentPlayer = (t: DiceTable): DicePlayer | undefined => t.players[t.turn];
export const playerTotal = (p: DicePlayer) => totals(p.run.card, p.run.bonus).total;
const activeUnfinished = (t: DiceTable) => t.players.filter((p) => !p.left && !p.run.finished);

function nextTurn(t: DiceTable): DiceTable {
  if (!activeUnfinished(t).length) return { ...t, phase: 'over', log: [...t.log, 'Every scorecard is full. Game over!'].slice(-30) };
  let i = t.turn;
  for (let k = 0; k < t.players.length; k++) { i = (i + 1) % t.players.length; const p = t.players[i]; if (!p.left && !p.run.finished) break; }
  return { ...t, turn: i };
}

/** Apply a move by player `id` (host side). Returns the table unchanged if it isn't their turn or the move isn't allowed. */
export function actAtTable(t: DiceTable, id: string, a: DiceAction, random: () => number = Math.random): DiceTable {
  if (t.phase !== 'playing') return t;
  const p = currentPlayer(t);
  if (!p || p.id !== id || p.left) return t;
  const data: DiceData = { avatar: p.avatar, best: 0, games: 0, attempts: p.attempts, correct: p.correct, run: p.run };
  let ev;
  switch (a.kind) {
    case 'roll': ev = { kind: 'roll' as const }; break;
    case 'hold': ev = { kind: 'hold' as const, index: Number(a.index) }; break;
    case 'check': ev = { kind: 'check' as const, sum: String(a.sum ?? '').slice(0, 6), group: String(a.group ?? '').slice(0, 6) }; break;
    case 'reveal': ev = { kind: 'reveal' as const }; break;
    case 'score': if (!CATEGORIES.includes(a.category)) return t; ev = { kind: 'score' as const, category: a.category }; break;
    default: return t;
  }
  const out = applyDiceEvent(data, ev, random);
  if (out === data) return t;
  const np: DicePlayer = { ...p, run: out.run!, attempts: out.attempts, correct: out.correct };
  let next: DiceTable = { ...t, rev: t.rev + 1, players: t.players.map((x) => (x.id === id ? np : x)) };
  if (a.kind === 'roll') next = { ...next, log: [...next.log, `${p.name} rolls ${np.run.dice.join(', ')}.`].slice(-30) };
  if (a.kind === 'score') {
    next = { ...next, log: [...next.log, `${p.name} scores ${np.run.last}`].slice(-30) };
    next = nextTurn(next);
  }
  return next;
}

/** A player left: in the lobby they're dropped; mid-game their scorecard stays and their turns are skipped. */
export function leaveTable(t: DiceTable, id: string): DiceTable {
  if (t.phase === 'lobby') return { ...t, rev: t.rev + 1, online: { ...t.online, lobby: t.online.lobby.filter((s) => s.id !== id) } };
  const p = t.players.find((x) => x.id === id); if (!p || p.left) return t;
  let next: DiceTable = { ...t, rev: t.rev + 1, players: t.players.map((x) => (x.id === id ? { ...x, left: true } : x)), log: [...t.log, `${p.name} left the table.`].slice(-30) };
  if (t.phase === 'playing' && currentPlayer(t)?.id === id) next = nextTurn(next);
  else if (t.phase === 'playing' && !activeUnfinished(next).length) next = { ...next, phase: 'over' };
  return next;
}

export function standingsOf(t: DiceTable) {
  return [...t.players].map((p) => ({ p, total: playerTotal(p) })).sort((a, b) => b.total - a.total);
}
export function winners(t: DiceTable): string[] {
  const s = standingsOf(t); const top = s[0]?.total ?? 0;
  return s.filter((x) => x.total === top).map((x) => x.p.id);
}

/** What the host sends one guest. */
export const tableViewFor = (t: DiceTable, id: string): DiceTable => ({ ...t, online: { ...t.online, host: false, myId: id } });

const validRun = (r: DiceRun) => !!r && Array.isArray(r.dice) && r.dice.length === 5 && r.dice.every((d) => Number.isInteger(d) && d >= 1 && d <= 6) && Array.isArray(r.held) && r.held.length === 5 && Number.isInteger(r.rolls) && r.rolls >= 0 && r.rolls <= 3 && !!r.card && typeof r.card === 'object' && MODES.includes(r.mode);
/** Accept a table from the host only if it is well-formed and addressed to this device. */
export function validTable(x: unknown, code: string, id: string): x is DiceTable {
  const t = x as DiceTable;
  if (!t || typeof t !== 'object' || t.v !== 1 || !Number.isInteger(t.rev) || !['lobby', 'playing', 'over'].includes(t.phase) || !MODES.includes(t.mode)) return false;
  if (!Array.isArray(t.players) || t.players.length > 4 || !Number.isInteger(t.turn) || (t.players.length && (t.turn < 0 || t.turn >= t.players.length))) return false;
  if (!t.players.every((p) => p && typeof p.id === 'string' && typeof p.name === 'string' && p.name.length <= 20 && validRun(p.run))) return false;
  if (!Array.isArray(t.log) || t.log.length > 30 || !t.online || !Array.isArray(t.online.lobby) || t.online.lobby.length > 4) return false;
  return t.online.code === code && t.online.myId === id && !t.online.host;
}
