import type { Level } from './board';
import {
  startTycoon, current, roll, answer, ack, passBuy, jailChoice, startBuild, cancelBuild, toggleMortgage, endTurn,
  type TycoonGame, type BotLevel,
} from './game';

/**
 * Online Engine City Tycoon: the host's device runs the game and sends everyone the state; guests send their
 * moves to the host, which applies them only on that player's own turn.
 */

export type TycoonGuestAction =
  | { kind: 'roll' } | { kind: 'answer'; given: string } | { kind: 'pass' } | { kind: 'ack' }
  | { kind: 'jail'; choice: 'fix' | 'pay' | 'roll' } | { kind: 'build'; space: number } | { kind: 'buildCancel' }
  | { kind: 'mortgage'; space: number } | { kind: 'end' };

/** A hosted room waiting for friends. */
export function hostLobby(level: Level, mode: 'quick' | 'classic', code: string, host: { id: string; name: string }, now = Date.now()): TycoonGame {
  const g = startTycoon({ level, mode, players: [{ id: host.id, name: host.name, kind: 'human' }] }, now);
  return { ...g, phase: 'lobby', online: { code, host: true, myId: host.id, lobby: [host] } };
}
/** A guest's placeholder until the host's state arrives. */
export function guestLobby(code: string, me: { id: string; name: string }, now = Date.now()): TycoonGame {
  const g = startTycoon({ level: 'explorer', mode: 'quick', players: [{ id: me.id, name: me.name, kind: 'human' }] }, now);
  return { ...g, rev: 0, phase: 'lobby', online: { code, host: false, myId: me.id, lobby: [] } };
}
export function setRoster(g: TycoonGame, players: { id: string; name: string }[]): TycoonGame {
  if (g.phase !== 'lobby' || !g.online?.host) return g;
  return { ...g, rev: g.rev + 1, online: { ...g.online, lobby: players.slice(0, 4) } };
}
/** Start the hosted game with everyone in the lobby, plus computer players to fill seats. */
export function launchOnline(g: TycoonGame, bots: BotLevel[] = [], now = Date.now()): TycoonGame {
  if (g.phase !== 'lobby' || !g.online?.host) return g;
  const lobby = g.online.lobby ?? [];
  const names = ['Gearbot', 'Cogsworth', 'Sprocket'];
  const seats = [
    ...lobby.map((p) => ({ id: p.id, name: p.name, kind: p.id === g.online!.myId ? 'human' as const : 'remote' as const })),
    ...bots.slice(0, Math.max(0, 4 - lobby.length)).map((b, i) => ({ id: `bot-${i + 1}`, name: names[i], kind: 'bot' as const, bot: b })),
  ];
  if (seats.length < 2) return g;
  const next = startTycoon({ level: g.level, mode: g.mode, players: seats }, now);
  return { ...next, rev: g.rev + 1, online: { ...g.online } };
}
/** Someone left: in the lobby they are dropped; mid-game a computer player takes their seat so the game goes on. */
export function leaveOnline(g: TycoonGame, id: string): TycoonGame {
  if (!g.online) return g;
  if (g.phase === 'lobby') return { ...g, rev: g.rev + 1, online: { ...g.online, lobby: (g.online.lobby ?? []).filter((p) => p.id !== id) } };
  if (!g.players.some((p) => p.id === id && !p.out)) return g;
  return { ...g, rev: g.rev + 1, players: g.players.map((p) => (p.id === id ? { ...p, kind: 'bot', bot: 'normal', name: `${p.name} (computer)` } : p)), log: [...g.log, { round: g.round, text: `${g.players.find((p) => p.id === id)!.name} left. A computer player takes over their seat.`, who: id }].slice(-80) };
}
/** Host side: apply a guest's move if it is that guest's turn (or their own answer review). */
export function applyGuest(g: TycoonGame, id: string, a: TycoonGuestAction): TycoonGame {
  if (!g.online?.host || g.phase === 'lobby' || g.phase === 'over') return g;
  if (a.kind === 'ack') return g.review?.player === id ? ack(g) : g;
  if (current(g).id !== id) return g;
  switch (a.kind) {
    case 'roll': return roll(g);
    case 'answer': return typeof a.given === 'string' ? answer(g, a.given.slice(0, 20)) : g;
    case 'pass': return passBuy(g);
    case 'jail': return ['fix', 'pay', 'roll'].includes(a.choice) ? jailChoice(g, a.choice) : g;
    case 'build': return Number.isInteger(a.space) ? startBuild(g, a.space) : g;
    case 'buildCancel': return cancelBuild(g);
    case 'mortgage': return Number.isInteger(a.space) ? toggleMortgage(g, a.space) : g;
    case 'end': return endTurn(g);
    default: return g;
  }
}
/** What the host sends one guest: the whole game, marked as that guest's view. */
export function viewFor(g: TycoonGame, id: string): TycoonGame {
  return { ...g, online: { code: g.online!.code, host: false, myId: id, lobby: g.online!.lobby } };
}
/** Accept a state from the host only if it is well-formed and meant for this device. */
export function validView(g: unknown, code: string, id: string): g is TycoonGame {
  const x = g as TycoonGame;
  if (!x || typeof x !== 'object' || x.v !== 1 || !Number.isInteger(x.rev) || !Number.isInteger(x.round) || !Number.isInteger(x.turn)) return false;
  if (!['lobby', 'roll', 'act', 'done', 'over'].includes(x.phase) || !['junior', 'explorer', 'tycoon'].includes(x.level)) return false;
  if (!Array.isArray(x.players) || x.players.length < 1 || x.players.length > 4 || x.turn < 0 || x.turn >= x.players.length) return false;
  if (!x.players.every((p) => p && typeof p.id === 'string' && typeof p.name === 'string' && p.name.length <= 40 && Number.isFinite(p.gears) && Number.isInteger(p.pos) && p.pos >= 0 && p.pos < 40)) return false;
  if (!x.deeds || typeof x.deeds !== 'object' || !Array.isArray(x.log) || x.log.length > 80 || !Array.isArray(x.jar)) return false;
  return x.online?.code === code && x.online.myId === id && !x.online.host;
}
