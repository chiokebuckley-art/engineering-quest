import { normalizeGearAvatar, type GearAvatarId } from './gearAvatars';
import type { Difficulty, MasteryRecord, Question } from '../types';
import type { ArcadeGame } from './types';
import { createRng, type Rng } from '../rng';
import { generateFromSkills, answerLabel } from '../questions';
import { parseSelection } from './arcade';

/**
 * WEAKEST GEAR — a studio quiz for friends and computer contestants.
 * Questions go round the podiums. Each correct answer climbs the chain; BANK locks the
 * chain into the pot; a miss drops the chain to zero. When the clock runs out everyone
 * votes off the weakest gear. The last two play a head-to-head final for the pot.
 */
export const CHAIN = [10, 20, 50, 100, 200, 500, 1000];
export const ROUND_MS_BASE = 90_000;
export const ROUND_MS_MIN = 40_000;
export const FINAL_QUESTIONS = 5;
export const BOT_NAMES = ['Cog', 'Sprocket', 'Piston', 'Dynamo', 'Rivet', 'Torque'];
export const BOT_LEVELS: { id: 'easy' | 'medium' | 'hard'; label: string; skill: number }[] = [
  { id: 'easy', label: 'Apprentice', skill: 0.55 }, { id: 'medium', label: 'Technician', skill: 0.72 }, { id: 'hard', label: 'Engineer', skill: 0.88 },
];
export const SEND_OFFS = [
  'The chain is only as strong as its weakest gear. You are that gear. Leave the arena.',
  'Every machine sheds the part that slows it. Your podium goes dark.',
  'The team has spoken. Hand in your spanner and go.',
  'Not enough right answers, too many gears lost. Goodbye.',
];

export interface Tally { right: number; wrong: number; banked: number; lost: number }
const tally = (): Tally => ({ right: 0, wrong: 0, banked: 0, lost: 0 });

export interface Contestant {
  id: string; name: string; color: string; isMe: boolean; avatarId?: GearAvatarId;
  bot?: { skill: number; level: string };
  /** Round in which this contestant was voted off. */
  out?: number;
  total: Tally; round: Tally;
}

export type GearPhase = 'lobby' | 'question' | 'feedback' | 'vote' | 'tiebreak' | 'eliminated' | 'final' | 'finalFeedback' | 'over';

/** Online room: the host's phone runs the arena and broadcasts the state; guests send actions. */
export interface GearOnline { roomCode: string; isHost: boolean; myId: string; myName: string; myAvatarId?: GearAvatarId; lobby: { id: string; name: string; avatarId?: GearAvatarId }[] }

export interface GearState {
  selection: { game: ArcadeGame; key: string };
  setup: GearSetup;
  seed: number;
  contestants: Contestant[];
  round: number;
  roundMs: number;
  deadlineAt: number;
  /** Index of the contestant answering now. */
  turn: number;
  chain: number; // steps climbed this chain (0..CHAIN.length)
  pot: number;
  question: Question;
  questionStartedAt: number;
  bankedThisTurn?: number;
  feedback?: { correct: boolean; text: string };
  phase: GearPhase;
  votes: Record<string, string>;
  /** Who still has to vote (humans first; bots vote in one go). */
  voter?: string;
  tie?: { candidates: string[]; strongest: string };
  eliminated?: { id: string; votes: number; byTie?: boolean; sendOff: string };
  final?: { players: [string, string]; asked: Record<string, number>; score: Record<string, number>; suddenDeath: boolean; current: string; history: { id: string; correct: boolean }[] };
  winnerId?: string;
  newBest?: boolean;
  online?: GearOnline;
}

export interface GearRecord { games: number; wins: number; bestPot: number; finals: number; fullChains: number }
export const initialGear = (): GearRecord => ({ games: 0, wins: 0, bestPot: 0, finals: 0, fullChains: 0 });

const COLORS = ['#ffb347', '#2dd4bf', '#a78bfa', '#4ade80', '#f472b6', '#22d3ee', '#fb923c', '#facc15'];

export const active = (g: GearState) => g.contestants.filter((c) => c.out === undefined);
export const byId = (g: GearState, id: string) => g.contestants.find((c) => c.id === id)!;
export const chainValue = (chain: number) => (chain > 0 ? CHAIN[chain - 1] : 0);
export const roundMsFor = (round: number) => Math.max(ROUND_MS_MIN, ROUND_MS_BASE - (round - 1) * 10_000);

function rngFor(g: GearState, salt: number) { return createRng((g.seed * 31 + g.round * 977 + salt) >>> 0); }

function nextQuestion(g: GearState, mastery: Record<string, MasteryRecord>, rng: Rng, chain = g.chain): Question {
  const sel = parseSelection(g.selection.game, g.selection.key);
  const difficulty = Math.max(1, Math.min(6, sel.difficulty + Math.floor(chain / 2))) as Difficulty;
  return generateFromSkills(sel.skillIds, mastery, { rng, difficulty, recentFacts: [] });
}

export interface GearSetup { selection: { game: ArcadeGame; key: string }; me: string; avatarId?: GearAvatarId; friends: string[]; friendAvatars?: GearAvatarId[]; bots: { level: 'easy' | 'medium' | 'hard' }[]; roundMs?: number; online?: { roomCode: string; isHost: boolean; myId: string } }

export function startGear(setup: GearSetup, mastery: Record<string, MasteryRecord>, now = Date.now(), rng = createRng()): GearState {
  if (setup.online) {
    // Online: wait in the lobby until the host launches with the connected roster.
    const o = setup.online; const me = { id: o.myId, name: setup.me.trim() || 'Player', avatarId: normalizeGearAvatar(setup.avatarId) };
    return {
      selection: setup.selection, setup, seed: 0, contestants: [], round: 0, roundMs: setup.roundMs ?? roundMsFor(1), deadlineAt: 0, turn: 0, chain: 0, pot: 0,
      question: null as unknown as Question, questionStartedAt: now, phase: 'lobby', votes: {},
      online: { roomCode: o.roomCode, isHost: o.isHost, myId: o.myId, myName: me.name, myAvatarId: me.avatarId, lobby: o.isHost ? [me] : [] },
    };
  }
  const humans = [setup.me, ...setup.friends].map((n, i) => ({ id: i === 0 ? 'me' : `friend-${i}`, name: n, isMe: i === 0, avatarId: normalizeGearAvatar(i === 0 ? setup.avatarId : setup.friendAvatars?.[i-1]) }));
  return buildGame(setup, humans, mastery, now, rng);
}

/** Host: launch an online game from the lobby roster (or replay from the results). */
export function gearLaunch(g: GearState, mastery: Record<string, MasteryRecord>, now = Date.now(), rng = createRng()): GearState {
  if (!g.online || !g.online.isHost || (g.phase !== 'lobby' && g.phase !== 'over')) return g;
  const humans = g.online.lobby.map((p) => ({ id: p.id, name: p.name, avatarId: normalizeGearAvatar(p.avatarId), isMe: p.id === g.online!.myId }));
  if (humans.length + g.setup.bots.length < 3 || humans.length + g.setup.bots.length > 8) return g;
  return { ...buildGame(g.setup, humans, mastery, now, rng), online: g.online };
}

/** Guests: adopt the host's broadcast state, seen from this phone. */
export function adoptRemote(local: GearState, remote: GearState): GearState {
  const o = local.online!;
  return { ...remote, contestants: remote.contestants.map((c) => ({ ...c, isMe: c.id === o.myId })), online: { ...(remote.online ?? o), isHost: false, myId: o.myId, myName: o.myName, myAvatarId: o.myAvatarId } };
}

/** A contestant's phone dropped out: they leave the arena; a finalist leaving hands the pot over. */
export function gearLeft(g: GearState, id: string): GearState {
  if (g.phase === 'lobby') return g.online ? { ...g, online: { ...g.online, lobby: g.online.lobby.filter((p) => p.id !== id) } } : g;
  const c = g.contestants.find((x) => x.id === id);
  if (!c || c.out !== undefined || g.phase === 'over') return g;
  let next: GearState = { ...g, contestants: g.contestants.map((x) => (x.id === id ? { ...x, out: g.round } : x)) };
  if (g.phase === 'final' || g.phase === 'finalFeedback') { const other = g.final!.players.find((p) => p !== id)!; return { ...next, phase: 'over', winnerId: other, feedback: undefined }; }
  if (active(next).length <= 2 && (g.phase === 'question' || g.phase === 'feedback' || g.phase === 'vote' || g.phase === 'tiebreak')) {
    // Down to two: skip straight to the send-off so the host can start the final.
    return { ...next, phase: 'eliminated', eliminated: { id, votes: 0, byTie: false, sendOff: 'Their connection dropped. The arena moves on without them.' }, tie: undefined, votes: {}, voter: undefined };
  }
  if ((g.phase === 'question' || g.phase === 'feedback') && g.contestants[g.turn]?.id === id) {
    const ids = next.contestants.map((_, i) => i).filter((i) => next.contestants[i].out === undefined);
    next = { ...next, turn: ids.find((i) => i > g.turn) ?? ids[0], phase: 'question', feedback: undefined, bankedThisTurn: undefined };
  }
  if (g.phase === 'vote') { const votes = { ...g.votes }; delete votes[id]; const humans = active(next).filter((x) => !x.bot); next = { ...next, votes, voter: humans.find((h) => !votes[h.id])?.id }; if (!next.voter) { const rng = rngFor(next, 7); for (const b of active(next).filter((x) => x.bot)) votes[b.id] = botVote(next, b, rng); return resolveVote({ ...next, votes }); } }
  if (g.phase === 'tiebreak' && g.tie) { if (g.tie.strongest === id) { const pick = g.tie.candidates.find((x) => x !== id) ?? g.tie.candidates[0]; return eliminate(next, pick, 0, true); } if (g.tie.candidates.includes(id)) return { ...next, phase: 'question', tie: undefined, votes: {} }; }
  return next;
}

function buildGame(setup: GearSetup, humansIn: { id: string; name: string; isMe: boolean; avatarId?: GearAvatarId }[], mastery: Record<string, MasteryRecord>, now: number, rng: Rng): GearState {
  const seed = Math.floor(rng.next() * 1e9);
  const names = new Set<string>();
  const uniq = (n: string) => { let x = n.trim() || 'Player'; let i = 2; while (names.has(x)) x = `${n.trim() || 'Player'} ${i++}`; names.add(x); return x; };
  const humans: Contestant[] = humansIn.map((h) => ({ id: h.id, name: uniq(h.name), avatarId: normalizeGearAvatar(h.avatarId), color: '', isMe: h.isMe, total: tally(), round: tally() }));
  const bots: Contestant[] = setup.bots.slice(0, 6).map((b, i) => {
    const lv = BOT_LEVELS.find((l) => l.id === b.level) ?? BOT_LEVELS[1];
    return { id: `bot-${i}`, name: uniq(BOT_NAMES[i]), color: '', isMe: false, bot: { skill: lv.skill, level: lv.label }, total: tally(), round: tally() };
  });
  const contestants = rng.shuffle([...humans, ...bots]).map((c, i) => ({ ...c, color: COLORS[i % COLORS.length] }));
  const roundMs = setup.roundMs ?? roundMsFor(1);
  const g: GearState = {
    selection: setup.selection, setup, seed, contestants, round: 1, roundMs, deadlineAt: now + roundMs, turn: 0, chain: 0, pot: 0,
    question: null as unknown as Question, questionStartedAt: now, phase: 'question', votes: {},
  };
  return { ...g, question: nextQuestion(g, mastery, createRng(seed)) };
}

/** Lock the current chain into the pot (allowed once, before answering). */
export function gearBank(g: GearState): GearState {
  if (g.phase !== 'question' || g.chain === 0 || g.bankedThisTurn !== undefined) return g;
  const amount = chainValue(g.chain);
  const c = g.contestants[g.turn];
  const contestants = g.contestants.map((x) => (x.id === c.id ? { ...x, round: { ...x.round, banked: x.round.banked + amount }, total: { ...x.total, banked: x.total.banked + amount } } : x));
  return { ...g, contestants, pot: g.pot + amount, chain: 0, bankedThisTurn: amount };
}

/** Answer the current question (round play or final). */
export function gearAnswer(g: GearState, correct: boolean): GearState {
  if (g.phase === 'final') return finalAnswer(g, correct);
  if (g.phase !== 'question') return g;
  const c = g.contestants[g.turn];
  let chain = g.chain; let pot = g.pot; let lost = 0; let text: string;
  if (correct) {
    chain = Math.min(CHAIN.length, chain + 1);
    text = chain === CHAIN.length ? `Top of the chain! ${CHAIN[CHAIN.length - 1]} gears banked automatically.` : `Correct. Chain at ${chainValue(chain)} gears. Bank or keep climbing?`;
  } else { lost = chainValue(chain); chain = 0; text = lost ? `Wrong. The chain drops: ${lost} gears lost. Answer: ${answerLabel(g.question)}.` : `Wrong. Answer: ${answerLabel(g.question)}.`; }
  let bankedAuto = 0;
  if (correct && chain === CHAIN.length) { bankedAuto = CHAIN[CHAIN.length - 1]; pot += bankedAuto; chain = 0; }
  const contestants = g.contestants.map((x) => x.id === c.id ? {
    ...x,
    round: { right: x.round.right + (correct ? 1 : 0), wrong: x.round.wrong + (correct ? 0 : 1), banked: x.round.banked + bankedAuto, lost: x.round.lost + lost },
    total: { right: x.total.right + (correct ? 1 : 0), wrong: x.total.wrong + (correct ? 0 : 1), banked: x.total.banked + bankedAuto, lost: x.total.lost + lost },
  } : x);
  return { ...g, contestants, chain, pot, phase: 'feedback', feedback: { correct, text } };
}

/** Move to the next contestant, or to the vote when the clock has run out. */
export function gearNext(g: GearState, mastery: Record<string, MasteryRecord>, now = Date.now(), rng = createRng()): GearState {
  if (g.phase === 'finalFeedback') return finalNext(g, mastery, now, rng);
  if (g.phase !== 'feedback') return g;
  if (now >= g.deadlineAt) return beginVote({ ...g, feedback: undefined, bankedThisTurn: undefined });
  const ids = g.contestants.map((_, i) => i).filter((i) => g.contestants[i].out === undefined);
  const pos = ids.indexOf(g.turn);
  const turn = ids[(pos + 1) % ids.length];
  return { ...g, turn, question: nextQuestion(g, mastery, rng), questionStartedAt: now, feedback: undefined, bankedThisTurn: undefined, phase: 'question' };
}

/** The clock ran out mid-question: the round ends, unbanked chain is lost. */
export function gearTimeout(g: GearState): GearState {
  if (g.phase !== 'question' && g.phase !== 'feedback') return g;
  return beginVote({ ...g, feedback: undefined, bankedThisTurn: undefined });
}

function beginVote(g: GearState): GearState {
  const humans = active(g).filter((c) => !c.bot);
  const v: GearState = { ...g, phase: 'vote', votes: {}, voter: humans[0]?.id, chain: 0, tie: undefined, eliminated: undefined };
  if (humans.length) return v;
  // Only computer contestants left: they vote at once.
  const rng = rngFor(g, 7); const votes: Record<string, string> = {};
  for (const b of active(g)) votes[b.id] = botVote(g, b, rng);
  return resolveVote({ ...v, votes });
}

/** Round strength: right answers minus wrong, then gears banked, then fewer gears lost. */
export function strength(c: Contestant): number { return (c.round.right - c.round.wrong) * 1000 + c.round.banked - c.round.lost / 10; }

function botVote(g: GearState, bot: Contestant, rng: Rng): string {
  const others = active(g).filter((c) => c.id !== bot.id);
  const weakest = [...others].sort((a, b) => strength(a) - strength(b))[0];
  const strongest = [...others].sort((a, b) => strength(b) - strength(a))[0];
  // A little of the show's meanness: sometimes gang up on the strongest gear.
  return rng.chance(0.22) && strongest.id !== weakest.id ? strongest.id : weakest.id;
}

/** A human vote. Once every human has voted, bots vote and the round resolves. */
export function gearVote(g: GearState, voterId: string, targetId: string): GearState {
  const voter = g.contestants.find((c) => c.id === voterId);
  if (g.phase !== 'vote' || !voter || voter.bot || voter.out !== undefined || g.votes[voterId] || voterId === targetId || byId(g, targetId).out !== undefined) return g;
  const votes = { ...g.votes, [voterId]: targetId };
  const humans = active(g).filter((c) => !c.bot);
  const nextHuman = humans.find((h) => !votes[h.id]);
  if (nextHuman) return { ...g, votes, voter: nextHuman.id };
  const rng = rngFor(g, 7);
  for (const b of active(g).filter((c) => c.bot)) votes[b.id] = botVote(g, b, rng);
  return resolveVote({ ...g, votes, voter: undefined });
}

function resolveVote(g: GearState): GearState {
  const counts: Record<string, number> = {};
  for (const t of Object.values(g.votes)) counts[t] = (counts[t] ?? 0) + 1;
  const max = Math.max(...Object.values(counts));
  const top = Object.keys(counts).filter((id) => counts[id] === max);
  if (top.length === 1) return eliminate(g, top[0], max, false);
  const strongest = [...active(g)].sort((a, b) => strength(b) - strength(a))[0];
  if (strongest.bot) {
    const pick = [...top].map((id) => byId(g, id)).filter((c) => c.id !== strongest.id).sort((a, b) => strength(a) - strength(b))[0] ?? byId(g, top[0]);
    return eliminate(g, pick.id, max, true);
  }
  return { ...g, phase: 'tiebreak', tie: { candidates: top, strongest: strongest.id } };
}

/** The strongest gear breaks a tie. */
export function gearTiebreak(g: GearState, targetId: string): GearState {
  if (g.phase !== 'tiebreak' || !g.tie || !g.tie.candidates.includes(targetId)) return g;
  return eliminate(g, targetId, Object.values(g.votes).filter((t) => t === targetId).length, true);
}

function eliminate(g: GearState, id: string, votes: number, byTie: boolean): GearState {
  const contestants = g.contestants.map((c) => (c.id === id ? { ...c, out: g.round } : c));
  const sendOff = SEND_OFFS[(g.round - 1) % SEND_OFFS.length];
  return { ...g, contestants, phase: 'eliminated', eliminated: { id, votes, byTie, sendOff }, tie: undefined };
}

/** After the send-off: next round, or the final when two remain. */
export function gearContinue(g: GearState, mastery: Record<string, MasteryRecord>, now = Date.now(), rng = createRng()): GearState {
  if (g.phase !== 'eliminated') return g;
  const left = active(g);
  const contestants = g.contestants.map((c) => ({ ...c, round: tally() }));
  if (left.length <= 2) {
    const [a, b] = left;
    const final: NonNullable<GearState['final']> = { players: [a.id, b.id], asked: { [a.id]: 0, [b.id]: 0 }, score: { [a.id]: 0, [b.id]: 0 }, suddenDeath: false, current: a.id, history: [] };
    const base = { ...g, contestants, final, phase: 'final' as const, chain: 0, feedback: undefined, questionStartedAt: now, eliminated: undefined };
    return { ...base, question: nextQuestion(base, mastery, rng, 4) };
  }
  const round = g.round + 1; const roundMs = roundMsFor(round);
  const base = { ...g, contestants, round, roundMs, deadlineAt: now + roundMs, chain: 0, votes: {}, eliminated: undefined, feedback: undefined, phase: 'question' as const, questionStartedAt: now };
  const ids = contestants.map((_, i) => i).filter((i) => contestants[i].out === undefined);
  // The strongest gear from the last round starts the next one.
  const strongestId = [...left].sort((a, b) => strength(b) - strength(a))[0].id;
  const turn = ids.find((i) => contestants[i].id === strongestId) ?? ids[0];
  return { ...base, turn, question: nextQuestion(base, mastery, rng, 0) };
}

function finalAnswer(g: GearState, correct: boolean): GearState {
  const f = g.final!; const id = f.current;
  const asked = { ...f.asked, [id]: f.asked[id] + 1 };
  const score = { ...f.score, [id]: f.score[id] + (correct ? 1 : 0) };
  const history = [...f.history, { id, correct }];
  const contestants = g.contestants.map((c) => (c.id === id ? { ...c, total: { ...c.total, right: c.total.right + (correct ? 1 : 0), wrong: c.total.wrong + (correct ? 0 : 1) } } : c));
  const [a, b] = f.players; const other = id === a ? b : a;
  const final = { ...f, asked, score, history };
  let winnerId: string | undefined;
  const done = asked[a] === asked[b];
  if (!f.suddenDeath) {
    // Decided early if the other cannot catch up; otherwise after five each.
    const remainA = FINAL_QUESTIONS - asked[a]; const remainB = FINAL_QUESTIONS - asked[b];
    if (score[a] > score[b] + remainB) winnerId = a; else if (score[b] > score[a] + remainA) winnerId = b;
    else if (done && asked[a] >= FINAL_QUESTIONS) { if (score[a] !== score[b]) winnerId = score[a] > score[b] ? a : b; else final.suddenDeath = true; }
  } else if (done) {
    const last = history.slice(-2);
    if (last[0].correct !== last[1].correct) winnerId = last.find((h) => h.correct)!.id;
  }
  return { ...g, contestants, final: { ...final, current: other }, feedback: { correct, text: correct ? `${byId(g, id).name}: correct!` : `${byId(g, id).name}: wrong. Answer: ${answerLabel(g.question)}.` }, phase: winnerId ? 'over' : 'finalFeedback', winnerId };
}

function finalNext(g: GearState, mastery: Record<string, MasteryRecord>, now: number, rng: Rng): GearState {
  return { ...g, phase: 'final', feedback: undefined, question: nextQuestion(g, mastery, rng, 4), questionStartedAt: now };
}

/** Computer contestants: decide to bank, then answer with skill-based accuracy. */
export function botTurn(g: GearState, rng: Rng): { bank: boolean; correct: boolean } {
  const c = g.phase === 'final' ? byId(g, g.final!.current) : g.contestants[g.turn];
  const skill = c.bot?.skill ?? 0.7;
  const p = Math.max(0.15, Math.min(0.97, skill - 0.07 * (g.question.difficulty - 2)));
  const bank = g.phase === 'question' && g.chain > 0 && g.bankedThisTurn === undefined && (g.chain >= 5 ? rng.chance(0.85) : g.chain >= 3 ? rng.chance(0.55) : rng.chance(0.15));
  return { bank, correct: rng.chance(p) };
}

export const currentId = (g: GearState) => (g.phase === 'final' || g.phase === 'finalFeedback' ? g.final!.current : g.contestants[g.turn]?.id);

