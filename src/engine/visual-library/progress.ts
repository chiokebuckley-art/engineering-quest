import cards from '../../content/visual-library.json';

export type VisualDomain = 'k12' | 'phys' | 'ee';
export type VisualMode = 'choice' | 'recall';
export interface VisualCard {
  id: string; name: string; domain: VisualDomain; tier: string; family: string;
  definition: string; features: string[]; aliases: string[]; lessonArt: string; quizArt: string;
  chapter?: string; related?: { academy: string; chapter: string };
}
export const VISUAL_CARDS = cards as VisualCard[];
const byId = new Map(VISUAL_CARDS.map(c => [c.id, c]));
export const visualCard = (id: string) => byId.get(id);
export interface VisualRecord {
  studied: boolean; attempts: number; correct: number; choiceCorrect: number; recallCorrect: number;
  missed: boolean; reviewStreak: number;
}
export type VisualProgress = Record<string, VisualRecord>;
export const emptyVisualRecord = (): VisualRecord => ({ studied: false, attempts: 0, correct: 0, choiceCorrect: 0, recallCorrect: 0, missed: false, reviewStreak: 0 });
export function migrateVisualProgress(raw: unknown): VisualProgress {
  const out: VisualProgress = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const [id, value] of Object.entries(raw)) {
    if (!byId.has(id) || !value || typeof value !== 'object') continue;
    const r = value as Partial<VisualRecord>;
    const count = (n: unknown) => typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
    const attempts = count(r.attempts); const correct = Math.min(attempts, count(r.correct));
    out[id] = { studied: r.studied === true, attempts, correct, choiceCorrect: Math.min(correct, count(r.choiceCorrect)), recallCorrect: Math.min(correct, count(r.recallCorrect)), missed: r.missed === true, reviewStreak: Math.min(2, count(r.reviewStreak)) };
  }
  return out;
}
export function studyVisual(progress: VisualProgress, id: string): VisualProgress {
  if (!byId.has(id)) return progress;
  return { ...progress, [id]: { ...(progress[id] ?? emptyVisualRecord()), studied: true } };
}
/** Two successful typed recalls clear a missed name; recognition alone keeps it in review. */
export function answerVisual(progress: VisualProgress, id: string, mode: VisualMode, correct: boolean): VisualProgress {
  if (!byId.has(id)) return progress;
  const r = progress[id] ?? emptyVisualRecord();
  const reviewStreak = correct ? mode === 'recall' ? Math.min(2, r.reviewStreak + 1) : r.reviewStreak : 0;
  return { ...progress, [id]: { ...r, attempts: r.attempts + 1, correct: r.correct + Number(correct), choiceCorrect: r.choiceCorrect + Number(correct && mode === 'choice'), recallCorrect: r.recallCorrect + Number(correct && mode === 'recall'), missed: !correct || (r.missed && reviewStreak < 2), reviewStreak } };
}
export const normalizeVisualName = (s: string) => s.normalize('NFKC').toLowerCase().replace(/[–—-]/g, ' ').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
export const matchesVisualName = (card: VisualCard, given: string) => [card.name, ...card.aliases].some(n => normalizeVisualName(n) === normalizeVisualName(given));
export function visualPool(domain: VisualDomain, progress: VisualProgress, explore = false, missedOnly = false, chapter?: string): VisualCard[] {
  return VISUAL_CARDS.filter(c => c.domain === domain && (!chapter || c.chapter === chapter) && (missedOnly ? progress[c.id]?.missed : explore || progress[c.id]?.studied));
}
export function visualChoices(card: VisualCard, rng: () => number = Math.random): VisualCard[] {
  const names = new Set([card.name, ...card.aliases].map(normalizeVisualName));
  const triangle = card.domain === 'k12' && card.chapter === 'triangles';
  const candidates = VISUAL_CARDS.filter(c => c.domain === card.domain && !(triangle && c.chapter === 'triangles') && ![c.name, ...c.aliases].some(n => names.has(normalizeVisualName(n))));
  const nearby = candidates.filter(c => c.family === card.family);
  const rest = candidates.filter(c => c.family !== card.family);
  const shuffle = (list: VisualCard[]) => {
    const result = [...list]; for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; } return result;
  };
  const used = new Set([normalizeVisualName(card.name)]);
  const wrong = [...shuffle(nearby), ...shuffle(rest)].filter(c => { const n = normalizeVisualName(c.name); if (used.has(n)) return false; used.add(n); return true; }).slice(0, 3);
  return shuffle([card, ...wrong]);
}
