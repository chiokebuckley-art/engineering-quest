/**
 * Hands-on model steps normally hide the question's picture, because in the Arithmetic Academy the
 * picture and the model are the same thing (counters, arrays, fraction bars). In the later academies the
 * picture is often the problem itself (a triangle diagram, a matrix, a graph to read), so it shows above
 * the model — unless the model already draws the same kind of picture.
 */
import type { AskStep } from './types';

const SAME_PICTURE: Record<string, string[]> = { plot: ['plot', 'grid'], unitcircle: ['unitcircle'], numberline: ['numline'], balance: ['balance'] };

export function showVisualOnModel(academyId: string, step: AskStep): boolean {
  const v = step.question.visual;
  if (academyId === 'arithmetic' || !v || v.type === 'none' || !step.model) return false;
  const same = SAME_PICTURE[step.model.kind];
  if (same?.includes(v.type)) return step.model.kind === 'plot' && !(step.model as { layers?: unknown }).layers;
  return true;
}
