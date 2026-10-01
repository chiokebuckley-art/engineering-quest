import { createRng, type Rng } from '../rng';

export const PLAZA_SIZE = 11;
export const PLAZA_CENTER = 60;
export type PlazaMath = 'add' | 'sub' | 'bonds' | 'mult' | 'div' | 'mixed';
export type PlazaOp = '+' | '−' | '×' | '÷';
export type PlazaMode = 'practice' | 'computer' | 'local' | 'online';
export interface PlazaConfig {
  math: PlazaMath; range: number; target: number; tables: number[]; ops: PlazaOp[];
  bonuses: 'off' | 'simple' | 'classic'; rounds: number; botLevel: 'easy' | 'medium' | 'hard';
}
export const DEFAULT_PLAZA: PlazaConfig = { math: 'add', range: 20, target: 10, tables: [2, 3, 4, 5], ops: ['+', '−'], bonuses: 'simple', rounds: 8, botLevel: 'easy' };
export const PLAZA_MATH: { id: PlazaMath; label: string }[] = [
  { id: 'add', label: 'Addition' }, { id: 'sub', label: 'Subtraction' }, { id: 'bonds', label: 'Number bonds' },
  { id: 'mult', label: 'Multiplication' }, { id: 'div', label: 'Division' }, { id: 'mixed', label: 'Mixed math' },
];
export interface PlazaPlayer {
  id: string; name: string; bot?: boolean; rack: string[]; score: number; turns: number; equations: number; best?: { text: string; points: number };
  /** Online: not connected right now. The seat, rack and score wait for them. */
  away?: boolean;
  /** Online: the host chose to skip this away player's turns (each still counts) until they come back. */
  sitOut?: boolean;
}
export interface PlazaMove { start: number; direction: 'across' | 'down'; tokens: string[] }
export interface PlazaPlay { player: string; text: string; points: number; detail: string }
export interface PlazaOnline { code: string; host: boolean; myId: string; lobby: { id: string; name: string }[] }
/** A Solo practice target: place N equations or reach N points. Null = free play. */
export interface PlazaGoal { kind: 'equations' | 'points'; n: number }
export const PLAZA_GOALS: (PlazaGoal | null)[] = [{ kind: 'equations', n: 5 }, { kind: 'equations', n: 10 }, { kind: 'points', n: 60 }, null];
export const goalLabel = (goal: PlazaGoal | null | undefined) => (!goal ? 'Free play' : goal.kind === 'equations' ? `Place ${goal.n} equations` : `Reach ${goal.n} points`);
export interface PlazaSetup { mode: PlazaMode; config: PlazaConfig; name: string; friends?: string[]; online?: Omit<PlazaOnline, 'lobby'>; goal?: PlazaGoal | null; coach?: boolean }
export interface PlazaState {
  id: string; seed: number; rev: number; mode: PlazaMode; config: PlazaConfig; phase: 'lobby' | 'playing' | 'over';
  board: (string | null)[]; boardNumber: number; players: PlazaPlayer[]; turn: number; log: PlazaPlay[];
  notice: string; online?: PlazaOnline; endedEarly?: boolean;
  /** Solo practice only: the goal, the guided first game, and one step of undo. */
  goal?: PlazaGoal | null; coach?: boolean; startedAt?: number; endedAt?: number; undo?: PlazaState;
}
export interface PlazaRecord {
  sessions: number; equations: number; wins: number; bests: Record<string, number>; lastId?: string; coached?: boolean;
  /** An unfinished match left with Leave: kept so the player can go back (to the same room seat) without the code. */
  paused?: { game: PlazaState; at: number };
}
export const initialPlaza = (): PlazaRecord => ({ sessions: 0, equations: 0, wins: 0, bests: {} });
export const currentPlazaPlayer = (g: PlazaState) => g.players[g.turn];
export const tokenPoints = (t: string) => t === '=' ? 0 : t === '÷' ? 3 : t === '×' || /^[456]$/.test(t) ? 2 : /^[789]$/.test(t) ? 3 : 1;
export const plazaOps = (c: PlazaConfig): PlazaOp[] => c.math === 'mixed' ? c.ops : c.math === 'bonds' ? ['+', '−'] : [{ add: '+', sub: '−', mult: '×', div: '÷' }[c.math] as PlazaOp];
export const plazaLabel = (c: PlazaConfig) => c.math === 'bonds' ? `Make ${c.target}` : c.math === 'mult' ? `Tables ${c.tables.join(', ')}` : c.math === 'div' ? `Divide by ${c.tables.join(', ')}` : c.math === 'mixed' ? `${c.ops.join(' ')} · sums to ${c.range}` : `${c.math === 'add' ? 'Addition' : 'Subtraction'} to ${c.range}`;
export const rackSize = (c: PlazaConfig) => (c.math === 'bonds' ? c.target > 20 : c.math === 'mult' || c.math === 'div' || c.math === 'mixed' ? true : c.range > 20) ? 9 : 7;

export function normalizePlazaConfig(c: PlazaConfig): PlazaConfig {
  const tables = [...new Set((c.tables ?? []).filter(n => Number.isInteger(n) && n >= 1 && n <= 12))].sort((a, b) => a - b);
  const ops = [...new Set((c.ops ?? []).filter(o => ['+', '−', '×', '÷'].includes(o)))];
  return { math: PLAZA_MATH.some(x => x.id === c.math) ? c.math : 'add', range: [10, 20, 100].includes(c.range) ? c.range : 20,
    target: [5, 10, 20, 50, 100].includes(c.target) ? c.target : 10, tables: tables.length ? tables : [2], ops: ops.length ? ops : ['+'],
    bonuses: ['off', 'simple', 'classic'].includes(c.bonuses) ? c.bonuses : 'simple', rounds: [5, 8, 10].includes(c.rounds) ? c.rounds : 8,
    botLevel: ['easy', 'medium', 'hard'].includes(c.botLevel) ? c.botLevel : 'easy' };
}

const PREMIUM_ROWS = [
  'TE . DD . TO . TO . DD . TE', '. TD . . . DO . . . TD .', 'DD . DE . DD . DD . DE . DD',
  '. . . DO . . . DO . . .', 'TO . DD . DO . DO . DD . TO', '. DO . . . CE . . . DO .',
  'TO . DD . DO . DO . DD . TO', '. . . DO . . . DO . . .', 'DD . DE . DD . DD . DE . DD',
  '. TD . . . DO . . . TD .', 'TE . DD . TO . TO . DD . TE',
].flatMap(r => r.split(' '));
export const PREMIUM_INFO: Record<string, { name: string; shape: string }> = {
  DD: { name: 'Double digit', shape: '○' }, TD: { name: 'Triple digit', shape: '⬡' }, DO: { name: 'Double operation', shape: '◇' },
  TO: { name: 'Triple operation', shape: '△' }, DE: { name: 'Double equation', shape: '□' }, TE: { name: 'Triple equation', shape: '✳' },
  CE: { name: 'Center equals · double equation', shape: '=' },
};
export function plazaPremium(i: number, c: PlazaConfig): string {
  const p = PREMIUM_ROWS[i];
  if (i === PLAZA_CENTER) return 'CE';
  return c.bonuses === 'off' || (c.bonuses === 'simple' && !['DD', 'DE'].includes(p)) ? '.' : p;
}

/** V1 deliberately teaches one operation per equation. No eval, decimals, unary signs, or chained equals. */
export function checkPlazaEquation(tokens: string[], c: PlazaConfig): string | null {
  if (!Array.isArray(tokens) || tokens.length < 5 || tokens.length > 11 || tokens.some(t => typeof t !== 'string' || !/^[0-9+−×÷=]$/.test(t))) return 'Build an equation with number tiles, one operation, and one equals sign.';
  const text = tokens.join('');
  if ((text.match(/=/g) ?? []).length !== 1) return 'Use exactly one equals sign. Both sides must have the same value.';
  if (/(^|[+−×÷=])0\d/.test(text)) return 'A number cannot start with 0 unless it is just 0.';
  const [left, right] = text.split('=');
  const expression = /^\d+$/.test(right) ? left : right;
  const resultText = expression === left ? right : left;
  const m = /^(\d+)([+−×÷])(\d+)$/.exec(expression);
  if (!m || !/^\d+$/.test(resultText)) return 'For this board, put one operation between two numbers: number, operation, number = result.';
  const a = Number(m[1]), b = Number(m[3]), result = Number(resultText), op = m[2] as PlazaOp;
  if (!plazaOps(c).includes(op)) return 'That operation is not part of this game. Use the math selected for this board.';
  if (op === '÷' && (b === 0 || a % b !== 0)) return b === 0 ? 'We cannot divide by zero.' : 'Division must give a whole number on this board.';
  if (op === '−' && a < b) return 'Keep subtraction answers at zero or above on this board.';
  if (c.math === 'bonds') {
    if ((op === '+' && result !== c.target) || (op === '−' && a !== c.target)) return `Make ${c.target}: add two parts to get ${c.target}, or subtract one part from ${c.target}.`;
    if (Math.max(a, b, result) > c.target) return `Use parts from 0 to ${c.target}.`;
  } else if (op === '+' || op === '−') {
    if (Math.max(a, b, result) > c.range) return `Keep every number at ${c.range} or below.`;
  } else if (op === '×' && !(c.tables.includes(a) && b <= 12 || c.tables.includes(b) && a <= 12)) return 'Use a selected times table, with the other factor from 0 to 12.';
  else if (op === '÷' && (!c.tables.includes(b) || result > 12)) return 'Use a selected divisor, with an answer from 0 to 12.';
  const actual = op === '+' ? a + b : op === '−' ? a - b : op === '×' ? a * b : a / b;
  return actual === result ? null : 'Those sides are not equal yet. Check your numbers and try again.';
}

export const moveIndices = (m: PlazaMove) => m.tokens.map((_, j) => m.start + j * (m.direction === 'across' ? 1 : PLAZA_SIZE));
const row = (i: number) => Math.floor(i / PLAZA_SIZE);
const col = (i: number) => i % PLAZA_SIZE;
function neighbor(i: number, dir: 'across' | 'down', delta: number): number {
  const r = row(i) + (dir === 'down' ? delta : 0), c = col(i) + (dir === 'across' ? delta : 0);
  return r < 0 || r >= 11 || c < 0 || c >= 11 ? -1 : r * 11 + c;
}
function lineAt(board: (string | null)[], i: number, dir: 'across' | 'down'): number[] {
  let start = i;
  while (neighbor(start, dir, -1) >= 0 && board[neighbor(start, dir, -1)]) start = neighbor(start, dir, -1);
  const cells: number[] = [];
  for (let at = start; at >= 0 && board[at]; at = neighbor(at, dir, 1)) cells.push(at);
  return cells;
}
const counts = (tokens: (string | null)[]) => { const out: Record<string, number> = {}; for (const t of tokens) if (t) out[t] = (out[t] ?? 0) + 1; return out; };
/** One equation's score with every number labelled: "(8 (face points) + 1 (tile bonus)) × 2 (equation bonus)". */
function scoreLine(face: number, tileBonus: number, multiplier: number, label: string): string {
  const base = tileBonus ? `${face} (face points) + ${tileBonus} (tile bonus)` : `${face} (face points)`;
  const body = multiplier > 1 ? `${tileBonus ? `(${base})` : base} × ${multiplier} (equation bonus)` : base;
  return label ? `${label}: ${body}` : body;
}
export interface CheckedPlazaMove { error: string | null; board: (string | null)[]; used: string[]; points: number; equations: string[]; detail: string }
export function checkPlazaMove(board: (string | null)[], rack: string[] | null, move: PlazaMove, c: PlazaConfig): CheckedPlazaMove {
  const fail = (error: string): CheckedPlazaMove => ({ error, board, used: [], points: 0, equations: [], detail: '' });
  if (!move || !Number.isInteger(move.start) || move.start < 0 || move.start >= 121 || !['across', 'down'].includes(move.direction)) return fail('Choose a square on the board.');
  const eqError = checkPlazaEquation(move.tokens, c); if (eqError) return fail(eqError);
  const cells = moveIndices(move), end = cells[cells.length - 1];
  if (end >= 121 || (move.direction === 'across' && row(end) !== row(move.start))) return fail('That equation reaches past the edge of the board.');
  if ([neighbor(move.start, move.direction, -1), neighbor(end, move.direction, 1)].some(i => i >= 0 && board[i])) return fail('Leave a space at each end, or include the whole existing equation.');
  const next = [...board], newCells: number[] = [], used: string[] = [];
  let connected = false;
  for (let j = 0; j < cells.length; j++) {
    const i = cells[j], token = move.tokens[j];
    if (board[i]) { if (board[i] !== token) return fail('An existing tile is in the way.'); connected = true; }
    else {
      newCells.push(i); used.push(token); next[i] = token;
    }
  }
  if (!newCells.length) return fail('Add at least one new tile.');
  if (board.some(Boolean) && !connected) return fail('Reuse at least one tile already on the board.');
  if (!board.some(Boolean) && (!cells.includes(PLAZA_CENTER) || next[PLAZA_CENTER] !== '=')) return fail('The first equals sign goes on the gold center square.');
  if (rack) { const available = counts(rack); for (const t of used) { if (!available[t]) return fail('You need a tile that is not in your rack. Reuse a matching board tile or build another equation.'); available[t]--; } }
  const lines = [cells];
  for (const i of newCells) {
    const cross = lineAt(next, i, move.direction === 'across' ? 'down' : 'across');
    if (cross.length <= 1) continue;
    if (checkPlazaEquation(cross.map(n => next[n]!), c)) return fail('A crossing line is not a complete, true equation. Leave a space beside it or try another position.');
    lines.push(cross);
  }
  let points = 0;
  const sums: string[] = [];
  for (const line of lines) {
    let face = 0, subtotal = 0, multiplier = 1;
    for (const i of line) if (newCells.includes(i)) {
      const token = next[i]!, p = plazaPremium(i, c), digit = /^\d$/.test(token);
      const tileMult = c.bonuses !== 'off' && (digit && ['DD', 'TD'].includes(p) || !digit && token !== '=' && ['DO', 'TO'].includes(p)) ? p.startsWith('T') ? 3 : 2 : 1;
      face += tokenPoints(token); subtotal += tokenPoints(token) * tileMult;
      if (c.bonuses !== 'off' && ['DE', 'TE', 'CE'].includes(p)) multiplier *= p === 'TE' ? 3 : 2;
    }
    points += subtotal * multiplier;
    sums.push(scoreLine(face, subtotal - face, multiplier, lines.length > 1 ? line.map(i => next[i]).join('') : ''));
  }
  const sweep = rack && used.length === rack.length ? 10 : 0;
  const total = points + sweep;
  const detail = `${sums.join(' + ')}${sweep ? ' + 10 (whole-rack bonus)' : ''} = ${total} (points)`;
  return { error: null, board: next, used, points: total, equations: lines.map(l => l.map(i => next[i]).join('')), detail };
}

/** Enumerate placements for an equation; fixed builder tokens must reuse their original board squares. */
export function plazaPlacements(board: (string | null)[], tokens: string[], c: PlazaConfig, rack: string[] | null = null, anchors: { offset: number; cell: number }[] = [], limit = 48): PlazaMove[] {
  if (checkPlazaEquation(tokens, c)) return [];
  const starts = new Map<string, PlazaMove>();
  const occupied = board.map((t, i) => t ? i : -1).filter(i => i >= 0);
  const add = (start: number, direction: 'across' | 'down') => { if (start >= 0 && start < 121) starts.set(`${direction}:${start}`, { start, direction, tokens }); };
  if (!occupied.length) for (const direction of ['across', 'down'] as const) add(PLAZA_CENTER - tokens.indexOf('=') * (direction === 'across' ? 1 : 11), direction);
  else for (const i of occupied) for (let j = 0; j < tokens.length; j++) if (tokens[j] === board[i]) {
    if (col(i) >= j) add(i - j, 'across');
    if (row(i) >= j) add(i - j * 11, 'down');
  }
  const out: PlazaMove[] = [];
  for (const move of starts.values()) {
    const step = move.direction === 'across' ? 1 : 11;
    if (anchors.some(a => move.start + a.offset * step !== a.cell)) continue;
    // Most candidates collide or touch an incomplete side fragment. Reject those before
    // allocating a board and evaluating/scoring every equation (especially on phones).
    const end = move.start + (tokens.length - 1) * step;
    if (end >= 121 || move.direction === 'across' && row(end) !== row(move.start)) continue;
    if ([neighbor(move.start, move.direction, -1), neighbor(end, move.direction, 1)].some(i => i >= 0 && board[i])) continue;
    const available = rack ? counts(rack) : null;
    let viable = true, added = 0;
    for (let j = 0; j < tokens.length; j++) {
      const i = move.start + j * step, t = tokens[j];
      if (board[i]) { if (board[i] !== t) { viable = false; break; } }
      else {
        added++;
        if (available) { if (!available[t]) { viable = false; break; } available[t]--; }
        const across = move.direction === 'across' ? 'down' : 'across';
        let crossLength = 1;
        for (const sign of [-1, 1]) for (let n = neighbor(i, across, sign); n >= 0 && board[n]; n = neighbor(n, across, sign)) crossLength++;
        if (crossLength > 1 && crossLength < 5) { viable = false; break; }
      }
    }
    if (!viable || !added) continue;
    if (!checkPlazaMove(board, rack, move, c).error) out.push(move);
    if (out.length >= limit) break;
  }
  return out;
}

const equationCache = new Map<string, string[][]>();
export function plazaEquations(c: PlazaConfig): string[][] {
  const key = JSON.stringify([c.math, c.range, c.target, c.tables, c.ops]);
  if (equationCache.has(key)) return equationCache.get(key)!;
  const texts = new Set<string>();
  const add = (a: number, op: PlazaOp, b: number, result: number) => { texts.add(`${a}${op}${b}=${result}`); texts.add(`${result}=${a}${op}${b}`); };
  if (c.math === 'bonds') for (let a = 0; a <= c.target; a++) { add(a, '+', c.target - a, c.target); add(c.target, '−', a, c.target - a); }
  else for (const op of plazaOps(c)) {
    if (op === '+') for (let a = 0; a <= c.range; a++) for (let b = 0; a + b <= c.range; b++) add(a, op, b, a + b);
    if (op === '−') for (let a = 0; a <= c.range; a++) for (let b = 0; b <= a; b++) add(a, op, b, a - b);
    if (op === '×') for (const a of c.tables) for (let b = 0; b <= 12; b++) { add(a, op, b, a * b); add(b, op, a, a * b); }
    if (op === '÷') for (const b of c.tables) for (let result = 0; result <= 12; result++) add(b * result, op, b, result);
  }
  const result = [...texts].map(t => [...t]);
  if (equationCache.size >= 24) equationCache.clear();
  equationCache.set(key, result); return result;
}

/** Searches known arithmetic facts, then validates their complete geometry and crossings. */
export function findPlazaMoves(g: Pick<PlazaState, 'board' | 'config'>, rack: string[] | null, seed = 1, limit = 1): PlazaMove[] {
  const pool = plazaEquations(g.config), rng = createRng(seed), start = rng.int(0, Math.max(0, pool.length - 1));
  const available = rack ? counts([...rack, ...g.board]) : null;
  const out: PlazaMove[] = [];
  for (let offset = 0; offset < pool.length; offset++) {
    const tokens = pool[(start + offset) % pool.length];
    if (available && Object.entries(counts(tokens)).some(([t, n]) => (available[t] ?? 0) < n)) continue;
    const moves = plazaPlacements(g.board, tokens, g.config, rack, [], limit - out.length);
    out.push(...moves);
    if (out.length >= limit) break;
  }
  return out;
}

function drawPlayable(g: PlazaState, rng: Rng): { rack: string[]; fresh: boolean } {
  let move = findPlazaMoves(g, null, rng.int(1, 2 ** 30), 1)[0];
  let fresh = false;
  if (!move) { g.board = Array(121).fill(null); g.boardNumber++; fresh = true; move = findPlazaMoves(g, null, rng.int(1, 2 ** 30), 1)[0]; }
  const used = checkPlazaMove(g.board, null, move, g.config).used;
  const rack = [...used];
  const extras = ['0', '1', '1', '2', '2', '3', '4', '5', '6', '7', '8', '9', '=', ...plazaOps(g.config)];
  while (rack.length < rackSize(g.config)) rack.push(rng.pick(extras));
  return { rack: rng.shuffle(rack), fresh };
}
function prepareTurn(g: PlazaState): PlazaState {
  const rng = createRng(g.seed + g.rev * 997 + g.turn * 17), p = currentPlazaPlayer(g);
  if (p.rack.length && findPlazaMoves(g, p.rack, rng.int(1, 2 ** 30)).length) {
    while (p.rack.length < rackSize(g.config)) p.rack.push(rng.pick(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '=', ...plazaOps(g.config)]));
    p.rack = rng.shuffle(p.rack); return g;
  }
  const drawn = drawPlayable(g, rng); p.rack = drawn.rack;
  if (drawn.fresh) g.notice = 'The plaza is full of connections! A fresh board opens; everyone keeps their points and turns.';
  else if (p.turns > 0) g.notice = 'No move with the remaining tiles: your rack was refreshed for free.';
  return g;
}
const makePlayer = (id: string, name: string, bot = false): PlazaPlayer => ({ id, name: name.trim().slice(0, 20) || 'Player', bot, rack: [], score: 0, turns: 0, equations: 0 });
export function startPlaza(setup: PlazaSetup, seed = Math.floor(Math.random() * 2 ** 30)): PlazaState {
  const config = normalizePlazaConfig(setup.config), online = setup.online ? { ...setup.online, lobby: [{ id: setup.online.myId, name: setup.name.trim().slice(0, 20) || 'Player' }] } : undefined;
  const players = [makePlayer(online?.myId ?? 'me', setup.name)];
  if (setup.mode === 'computer') players.push(makePlayer('bot', 'Plaza Bot', true));
  if (setup.mode === 'local') players.push(...(setup.friends?.length ? setup.friends : ['Player 2']).slice(0, 3).map((name, i) => makePlayer(`friend-${i}`, name)));
  const goal = setup.mode === 'practice' && setup.goal && ['equations', 'points'].includes(setup.goal.kind) && setup.goal.n > 0 ? { kind: setup.goal.kind, n: Math.min(500, Math.round(setup.goal.n)) } : null;
  const g: PlazaState = { id: `plaza-${seed}-${Date.now()}`, seed, rev: 0, mode: setup.mode, config, phase: online ? 'lobby' : 'playing', board: Array(121).fill(null), boardNumber: 1, players, turn: 0, log: [], notice: '', online,
    ...(setup.mode === 'practice' ? { goal, coach: !!setup.coach, startedAt: Date.now() } : {}) };
  return online ? g : prepareTurn(g);
}
export function launchPlaza(g: PlazaState): PlazaState {
  if (g.phase !== 'lobby' || !g.online?.host || g.online.lobby.length < 2) return g;
  return prepareTurn({ ...g, phase: 'playing', rev: g.rev + 1, players: g.online.lobby.map(p => makePlayer(p.id, p.name)) });
}
const skipped = (p: PlazaPlayer): PlazaPlay => ({ player: p.name, text: 'Away: turn skipped', points: 0, detail: 'Turn used while away' });
/** Moves to the next player with turns left. An away player's turn waits for them, unless the host set them to sit out. */
function advancePlaza(g: PlazaState): PlazaState {
  const finished = (p: PlazaPlayer) => g.mode !== 'practice' && p.turns >= g.config.rounds;
  for (;;) {
    if (g.mode !== 'practice' && g.players.every(finished)) return { ...g, phase: 'over' };
    for (let i = 1; i <= g.players.length; i++) { const next = (g.turn + i) % g.players.length; if (!finished(g.players[next])) { g.turn = next; break; } }
    const p = currentPlazaPlayer(g);
    if (!p.sitOut) return prepareTurn(g);
    // Sitting out still uses the turn, so everyone ends with the same number.
    p.turns++; g.log = [skipped(p), ...g.log].slice(0, 20);
  }
}
export function playPlaza(g: PlazaState, move: PlazaMove): PlazaState {
  if (g.phase !== 'playing') return g;
  const check = checkPlazaMove(g.board, currentPlazaPlayer(g).rack, move, g.config); if (check.error) return g;
  const players = g.players.map(p => ({ ...p, rack: [...p.rack] })), p = players[g.turn];
  for (const t of check.used) p.rack.splice(p.rack.indexOf(t), 1);
  p.score += check.points; p.equations += check.equations.length; p.turns++;
  if (!p.best || check.points > p.best.points) p.best = { text: check.equations.join(' · '), points: check.points };
  // Solo practice keeps one step of undo: the state just before this Place.
  const undo = g.mode === 'practice' ? { ...g, undo: undefined } : undefined;
  return advancePlaza({ ...g, players, board: check.board, rev: g.rev + 1, notice: '', undo, log: [{ player: p.name, text: check.equations.join(' · '), points: check.points, detail: check.detail }, ...g.log].slice(0, 20) });
}
export function passPlaza(g: PlazaState): PlazaState {
  if (g.phase !== 'playing') return g;
  const players = g.players.map(p => ({ ...p, rack: [...p.rack] })); players[g.turn].rack = []; players[g.turn].turns++;
  return advancePlaza({ ...g, players, rev: g.rev + 1, notice: '', undo: undefined, log: [{ player: players[g.turn].name, text: 'Swapped their rack', points: 0, detail: 'Turn used' }, ...g.log].slice(0, 20) });
}
/** Solo practice: take back the last Place (once), restoring board, rack and score. */
export function undoPlaza(g: PlazaState): PlazaState {
  if (g.mode !== 'practice' || g.phase !== 'playing' || !g.undo) return g;
  // Board, racks, scores and log go back; the guide's on/off state stays as it is now.
  return { ...g.undo, coach: g.coach, rev: g.rev + 1, undo: undefined, notice: 'Last move undone. Your tiles are back in your rack.' };
}
/** How far the Solo practice player is toward the goal (0–1), or null in free play. */
export function plazaGoalProgress(g: PlazaState): { have: number; need: number; done: boolean } | null {
  if (g.mode !== 'practice' || !g.goal) return null;
  const me = g.players[0]; const have = g.goal.kind === 'equations' ? me.equations : me.score;
  return { have, need: g.goal.n, done: have >= g.goal.n };
}
export function botPlaza(g: PlazaState): PlazaState {
  if (g.phase !== 'playing' || !currentPlazaPlayer(g).bot) return g;
  const limit = g.config.botLevel === 'easy' ? 3 : g.config.botLevel === 'medium' ? 12 : 48;
  const moves = findPlazaMoves(g, currentPlazaPlayer(g).rack, g.seed + g.rev * 97, limit);
  if (!moves.length) return passPlaza(g);
  moves.sort((a, b) => checkPlazaMove(g.board, currentPlazaPlayer(g).rack, b, g.config).points - checkPlazaMove(g.board, currentPlazaPlayer(g).rack, a, g.config).points);
  const selected = g.config.botLevel === 'easy' ? moves[moves.length - 1] : g.config.botLevel === 'medium' ? moves[Math.floor(moves.length / 3)] : moves[0];
  return playPlaza(g, selected);
}
/**
 * Host: who is connected right now. A player who drops out (a reload, lost signal, Leave by accident) keeps their seat,
 * rack and score as "away", and takes the seat back when they return. The match never ends because someone dropped.
 */
export function seatsPlaza(g: PlazaState, here: string[]): PlazaState {
  if (!g.online?.host || g.phase !== 'playing') return g;
  const me = g.online.myId, back: string[] = [], gone: string[] = [];
  const players = g.players.map(p => {
    if (p.id === me || p.bot || !here.includes(p.id) === !!p.away) return p;
    (p.away ? back : gone).push(p.name);
    return p.away ? { ...p, away: false, sitOut: false } : { ...p, away: true };
  });
  if (!back.length && !gone.length) return g;
  const names = (n: string[]) => n.join(' & ');
  const notice = [
    back.length ? `${names(back)} ${back.length > 1 ? 'are' : 'is'} back.` : '',
    gone.length ? `${names(gone)} ${gone.length > 1 ? 'are' : 'is'} away. ${gone.length > 1 ? 'Their seats are' : 'Their seat is'} saved until they come back.` : '',
  ].filter(Boolean).join(' ');
  return { ...g, players, rev: g.rev + 1, notice };
}
/** Host: skip an away player's turns (each still counts) until they come back, so the others can play on. */
export function sitOutPlaza(g: PlazaState, id: string): PlazaState {
  if (!g.online?.host || g.phase !== 'playing') return g;
  const target = g.players.find(p => p.id === id && p.away && !p.sitOut); if (!target) return g;
  const players = g.players.map(p => ({ ...p, rack: [...p.rack], sitOut: !!p.sitOut || p.id === id }));
  const next: PlazaState = { ...g, players, rev: g.rev + 1, notice: `${target.name}’s turns are skipped until they come back.` };
  if (currentPlazaPlayer(next).id !== id) return next;
  const p = currentPlazaPlayer(next); p.turns++; next.log = [skipped(p), ...next.log].slice(0, 20);
  return advancePlaza(next);
}
/** Host: end an online match for everyone. A match ended early never counts toward records. */
export function endPlazaEarly(g: PlazaState): PlazaState {
  if (!g.online?.host || g.phase !== 'playing') return g;
  return { ...g, phase: 'over', endedEarly: true, rev: g.rev + 1, notice: 'The host ended the match early.' };
}
/**
 * What the host sends one guest: only their own rack, and only their own seat id. The id is what gets a player back
 * into their seat, so nobody else in the room can see it (or take the seat).
 */
export function plazaViewFor(g: PlazaState, id: string): PlazaState {
  const seat = (pid: string, i: number) => (pid === id ? pid : `seat-${i + 1}`);
  return { ...g, undo: undefined, players: g.players.map((p, i) => ({ ...p, id: seat(p.id, i), rack: p.id === id ? [...p.rack] : [] })),
    online: g.online ? { ...g.online, host: false, myId: id, lobby: g.online.lobby.map((p, i) => ({ ...p, id: seat(p.id, i) })) } : undefined };
}

const TILE = /^[0-9+−×÷=]$/;
const tiles = (x: unknown, max: number) => Array.isArray(x) && x.length <= max && x.every(t => typeof t === 'string' && TILE.test(t));
/** A well-formed game: from this device's save, or a view from the host. */
export function isPlazaState(x: unknown): x is PlazaState {
  const g = x as PlazaState;
  if (!g || typeof g !== 'object' || typeof g.id !== 'string' || g.id.length >= 80 || !Number.isInteger(g.rev) || g.rev < 0 || !Number.isInteger(g.seed)) return false;
  if (!['practice', 'computer', 'local', 'online'].includes(g.mode) || !['lobby', 'playing', 'over'].includes(g.phase) || (g.mode === 'online') !== !!g.online) return false;
  if (!Array.isArray(g.board) || g.board.length !== 121 || !g.board.every(t => t === null || typeof t === 'string' && TILE.test(t)) || !Number.isInteger(g.boardNumber) || g.boardNumber < 1) return false;
  if (!Array.isArray(g.players) || g.players.length < 1 || g.players.length > 4 || !Number.isInteger(g.turn) || g.turn < 0 || g.turn >= g.players.length) return false;
  if (!g.players.every(p => p && typeof p.id === 'string' && p.id.length <= 40 && typeof p.name === 'string' && p.name.length <= 20 && tiles(p.rack, 9) && Number.isFinite(p.score) && Number.isInteger(p.turns) && Number.isInteger(p.equations))) return false;
  const c = g.config;
  if (!c || typeof c !== 'object' || !PLAZA_MATH.some(m => m.id === c.math) || !Array.isArray(c.tables) || c.tables.length > 12 || !Array.isArray(c.ops) || c.ops.length > 4) return false;
  if (!Array.isArray(g.log) || g.log.length > 20 || !g.log.every(l => l && typeof l.text === 'string' && typeof l.player === 'string' && typeof l.detail === 'string' && Number.isFinite(l.points)) || typeof g.notice !== 'string') return false;
  const o = g.online;
  return !o || typeof o === 'object' && typeof o.code === 'string' && /^[A-Z0-9]{4}$/.test(o.code) && typeof o.myId === 'string' && typeof o.host === 'boolean' &&
    Array.isArray(o.lobby) && o.lobby.length <= 4 && o.lobby.every(p => p && typeof p.id === 'string' && typeof p.name === 'string');
}
/** A game saved on this device, checked before it is played again. Finished games are not brought back. */
export function restorePlaza(x: unknown): PlazaState | null {
  if (!isPlazaState(x) || x.phase === 'over') return null;
  return x.undo == null || isPlazaState(x.undo) ? x : { ...x, undo: undefined };
}
/** Leaving an unfinished match keeps it to go back to. Solo practice ends with its summary instead. */
export function plazaResumable(g: PlazaState): boolean {
  if (g.mode === 'practice' || g.phase === 'over') return false;
  return g.phase === 'playing' || !!g.online && (g.online.host ? g.online.lobby.length > 1 : g.rev > 0);
}
/** How long a left match stays on offer to go back to. */
export const PLAZA_PAUSE_MS = 24 * 60 * 60 * 1000;
export const pausedPlaza = (rec: PlazaRecord | undefined, now = Date.now()): PlazaState | null =>
  rec?.paused && now - rec.paused.at < PLAZA_PAUSE_MS ? restorePlaza(rec.paused.game) : null;
export function plazaBestKey(g: PlazaState) { return JSON.stringify([g.mode, g.config, g.mode === 'practice' ? 'session' : g.players.length]); }
export function recordPlaza(rec: PlazaRecord, g: PlazaState): PlazaRecord {
  if (g.phase !== 'over' || g.id === rec.lastId || g.endedEarly) return rec;
  const me = g.players.find(p => p.id === (g.online?.myId ?? 'me')); if (!me) return rec;
  const won = g.mode !== 'practice' && g.players.every(p => p.id === me.id || p.score < me.score);
  return { ...rec, sessions: rec.sessions + 1, equations: rec.equations + me.equations, wins: rec.wins + (won ? 1 : 0), bests: { ...rec.bests, [plazaBestKey(g)]: Math.max(rec.bests[plazaBestKey(g)] ?? 0, me.score) }, lastId: g.id };
}
