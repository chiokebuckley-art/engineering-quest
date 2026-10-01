import type { TeachCard } from './defs';
import { stripLabels } from '../label';

/**
 * The teach-card rule: a card that shows a picture or a model must also show the working, not just the answer.
 * "Working" is a worked equation (numbers on both sides of an equals sign, with an operation or "of") in the text or the steps.
 */
export function showsWorking(card: Pick<TeachCard, 'text' | 'steps'>): boolean {
  const clauses = [card.text, ...(card.steps ?? [])].map(stripLabels).flatMap((t) => t.split(/(?<=[.;!?])\s+/));
  return clauses.some((c) => {
    const i = c.indexOf('='); if (i < 0) return false;
    const left = c.slice(0, i), right = c.slice(i + 1);
    return /\d/.test(left) && /\d/.test(right) && /[+\-−×÷*/^²³√]|\bof\b/.test(c);
  });
}
export const answerOnly = (card: TeachCard) => !!(card.visual || card.model) && !showsWorking(card);
