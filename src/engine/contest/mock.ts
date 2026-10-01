import type { Difficulty, Question } from '../types';
import type { Rng } from '../rng';
import type { ContestHistoryEntry, ContestRun, MockSkill, RunItem } from './state';

/**
 * The Grade 5 mini-mock: 10 original items, balanced across contest skills and ramped like a contest (easier first),
 * played Calm or, only if the player agrees, with a 15-minute clock. Results are a bar per skill, never a score.
 */
export const MOCK_MS = 15 * 60_000;
export const MOCK_SIZE = 10;
export const MOCK_SKILL_LABELS: Record<MockSkill, string> = {
  arith: 'Creative arithmetic', geometry: 'Geometry and blocks', counting: 'Counting paths', data: 'Data and Venn',
  pattern: 'Patterns', logic: 'Logic', percent: 'Multi-step percent', ratio: 'Ratio',
};
export const MOCK_SKILL_ORDER: MockSkill[] = ['arith', 'geometry', 'counting', 'data', 'pattern', 'logic', 'percent', 'ratio'];

/**
 * One slot of the blueprint: the skill it counts toward, its difficulty, the (game, kind) picks that can fill it, and
 * (optionally) what a drawn item must be to count for the slot.
 */
export interface MockSlot { skill: MockSkill; d: Difficulty; picks: [string, string][]; accept?: (q: Question) => boolean }
/** A fraction item: a pie cut into equal parts (no percent), so the answer is a fraction of the whole. */
export const isFractionPie = (q: Question) => q.visual?.type === 'pie' && typeof (q.visual as { parts?: unknown }).parts === 'number' && !/%|percent/i.test(`${q.prompt} ${q.expression}`);
/**
 * 2 creative arithmetic (one fraction of a whole, one percent), 2 geometry (blocks, then a grid), 1 counting, 1 data or
 * Venn, 1 pattern, 1 logic, 1 multi-step percent, 1 ratio. The first five are the gentler half. Every pick is a game
 * that really plays at Grade 5 difficulty (the Arcade fraction and ratio games stay at one Grade 3 level, so they are
 * not used here).
 */
export const MOCK_BLUEPRINT: MockSlot[] = [
  { skill: 'arith', d: 5, picks: [['data', 'pie']], accept: isFractionPie },
  { skill: 'pattern', d: 5, picks: [['pattern', 'term'], ['pattern', 'machine'], ['pattern', 'grow'], ['pattern', 'number']] },
  { skill: 'data', d: 5, picks: [['data', 'venn'], ['data', 'mean'], ['data', 'bar']] },
  { skill: 'geometry', d: 5, picks: [['blocks', 'hidden'], ['blocks', 'layers'], ['blocks', 'fill'], ['blocks', 'painted']] },
  { skill: 'arith', d: 5, picks: [['pctmulti', 'outof100']] },
  { skill: 'counting', d: 6, picks: [['paths', 'grid'], ['paths', 'orders'], ['paths', 'menus'], ['paths', 'pairs']] },
  { skill: 'logic', d: 6, picks: [['logic', 'grid'], ['logic', 'order'], ['logic', 'mustmight'], ['logic', 'liar']] },
  { skill: 'geometry', d: 6, picks: [['grid', 'area'], ['grid', 'perimeter'], ['grid', 'lines'], ['geo', 'angles'], ['blocks', 'painted']] },
  { skill: 'percent', d: 6, picks: [['pctmulti', 'discounttax'], ['pctmulti', 'twosteps'], ['pctmulti', 'pctofpct'], ['pctmulti', 'updown']] },
  { skill: 'ratio', d: 6, picks: [['rates', 'ratio']] },
];

/** Draws one capped item for Grade 5 (or null); passed in by the track so this file has no generator imports. */
export type MockDraw = (game: string, kind: string, d: Difficulty, rng: Rng, seen: Set<string>) => Question | null;

/**
 * Draws per pick before giving up on it. A slot with `accept` keeps only some of what its game draws (about half of
 * the Grade 5 pies are fraction pies), so it gets many more: 8 draws left about 1 mock in 150 without its fraction item.
 */
export const MOCK_TRIES = 8;
export const MOCK_ACCEPT_TRIES = 48;
/** The 10 items, one per blueprint slot (a slot whose picks all fail at its difficulty is tried at difficulty 5). */
export function buildMock(rng: Rng, draw: MockDraw): RunItem[] {
  const seen = new Set<string>();
  const out: RunItem[] = [];
  for (const slot of MOCK_BLUEPRINT) {
    let item: RunItem | null = null;
    const ok = (q: Question | null) => (q && (!slot.accept || slot.accept(q)) ? q : null);
    const tries = slot.accept ? MOCK_ACCEPT_TRIES : MOCK_TRIES;
    for (const [game, kind] of rng.shuffle(slot.picks)) {
      let q: Question | null = null; let d = slot.d;
      for (let t = 0; t < tries && !q; t++) q = ok(draw(game, kind, d, rng, seen));
      if (!q && d !== 5) { d = 5; for (let t = 0; t < tries && !q; t++) q = ok(draw(game, kind, d, rng, seen)); }
      if (q) { item = { key: `${game}:${kind}@d${d}`, game, kind, section: 'mock', question: q, skill: slot.skill }; break; }
    }
    if (item) out.push(item);
  }
  return out;
}

export interface MockBar { skill: MockSkill; label: string; right: number; of: number }
/** Right and asked per skill, in blueprint order (the "radar" as a bar list). */
export function mockBars(src: ContestRun | ContestHistoryEntry): MockBar[] {
  const tally: Partial<Record<MockSkill, [number, number]>> = {};
  if ('items' in src && Array.isArray(src.items)) {
    const run = src as ContestRun;
    run.items.forEach((it, i) => {
      if (!it.skill) return;
      const t = tally[it.skill] ?? [0, 0];
      tally[it.skill] = [t[0] + (run.results[i]?.correct && run.results[i]?.firstTry ? 1 : 0), t[1] + 1];
    });
  } else Object.assign(tally, (src as ContestHistoryEntry).mock ?? {});
  return MOCK_SKILL_ORDER.filter((k) => tally[k]).map((k) => ({ skill: k, label: MOCK_SKILL_LABELS[k], right: tally[k]![0], of: tally[k]![1] }));
}
/** The tally saved in history. */
export function mockTally(run: ContestRun): Partial<Record<MockSkill, [number, number]>> {
  const out: Partial<Record<MockSkill, [number, number]>> = {};
  for (const b of mockBars(run)) out[b.skill] = [b.right, b.of];
  return out;
}
