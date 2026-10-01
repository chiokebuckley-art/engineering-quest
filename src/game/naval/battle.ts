import type { VersusState } from '../../engine/state/types';

export const POINTS_PER_SHELL = 10;
const COLORS = ['#ffb347', '#2dd4bf', '#a78bfa', '#4ade80', '#f472b6', '#22d3ee'];
export const SHIP_CLASSES = ['Patrol boat', 'Corvette', 'Frigate', 'Destroyer', 'Cruiser', 'Battlecruiser', 'Battleship', 'Dreadnought', 'Carrier', 'Flagship', 'Leviathan'];
/** Every level won makes the ship 8% bigger, up to 1.8× after ten wins. */
export const shipSize = (wins: number) => 1 + Math.min(10, Math.max(0, wins)) * 0.08;
export const shipClass = (wins: number) => SHIP_CLASSES[Math.min(SHIP_CLASSES.length - 1, Math.max(0, wins))];

export interface BattleShip {
  id: string; name: string; color: string; score: number; correct: number;
  /** Levels won this match, and the hull size/class they earn. */
  wins: number; size: number; shipClass: string;
  shells: number; incoming: number; hull: number; winner: boolean; sunk: boolean;
  isMe: boolean; done: boolean; withdrawn: boolean;
}
export interface BattleView {
  key: string; ships: BattleShip[]; final: boolean; activeId: string;
  playing: boolean; reducedMotion: boolean;
}
export interface Salvo { from: string; to: string; ordinal: number }

/** Uses stable IDs, never each device's roster order, for targets and ship colours. */
export function targetForShell(ids: string[], from: string, ordinal: number): string | undefined {
  const rivals = ids.filter(id => id !== from).sort();
  return rivals.length ? rivals[ordinal % rivals.length] : undefined;
}

export function battleView(v: VersusState, reducedMotion = false): BattleView {
  const players = [...v.players].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const eligible = players.filter(p => !p.withdrawn);
  const best = [...eligible].sort((a, b) => b.score - a.score || b.correct - a.correct)[0];
  const final = players.length >= 2 && players.every(p => p.done);
  const shells = new Map(players.map(p => [p.id, Math.floor(Math.max(0, Math.min(10000, p.score)) / POINTS_PER_SHELL)]));
  const ids = players.map(p => p.id);
  const incoming = new Map(ids.map(id => [id, 0]));
  for (const from of ids) {
    for (let n = 0; n < shells.get(from)!; n++) {
      const to = targetForShell(ids, from, n);
      if (to) incoming.set(to, incoming.get(to)! + 1);
    }
  }
  return {
    key: `${v.kind}:${v.seed}:${v.startAt ?? v.round}`,
    activeId: v.kind === 'hotseat' ? v.players[v.turn]?.id ?? v.myId : v.myId,
    final, playing: v.status === 'playing' || v.status === 'between', reducedMotion,
    ships: players.map((p, index) => {
      const winner = final && !p.withdrawn && !!best && p.score === best.score && p.correct === best.correct;
      const sunk = final && !winner;
      const wins = v.wins?.[p.id] ?? 0;
      return { id: p.id, name: p.name, color: COLORS[index % COLORS.length], score: p.score, correct: p.correct, wins, size: shipSize(wins), shipClass: shipClass(wins),
        shells: shells.get(p.id)!, incoming: incoming.get(p.id)!, hull: sunk ? 0 : Math.max(10, 100 - incoming.get(p.id)! * 3),
        winner, sunk, isMe: p.isMe, done: p.done, withdrawn: !!p.withdrawn };
    }),
  };
}

/** Cumulative counters make duplicate progress packets harmless. Never replay historical fire on mount. */
export function newSalvos(previous: BattleView | undefined, next: BattleView): Salvo[] {
  if (!previous || previous.key !== next.key || !next.playing) return [];
  const ids = next.ships.map(s => s.id);
  const result: Salvo[] = [];
  for (const ship of next.ships) {
    const before = previous.ships.find(s => s.id === ship.id);
    if (!before || ship.shells <= before.shells) continue;
    // Render the most recent burst if packets arrive together after backgrounding.
    for (let ordinal = Math.max(before.shells, ship.shells - 6); ordinal < ship.shells; ordinal++) {
      const to = targetForShell(ids, ship.id, ordinal);
      if (to) result.push({ from: ship.id, to, ordinal });
    }
  }
  return result;
}

export function battleWinners(v: VersusState) { return battleView(v).ships.filter(s => s.winner); }
