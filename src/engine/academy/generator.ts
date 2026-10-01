/**
 * Question generator for the Academy's umbrella skills (num.sense, frac, ratio, percent, exponents),
 * so drills, the skill tree and the Dungeon of Forgotten Knowledge can ask them too. Model-verb
 * questions answer fine by typing: the build they ask for has a numeric result.
 */
import type { Generator } from '../questions/context';
import type { Question } from '../types';
import type { Rng } from '../rng';
import * as Q from './questions';
import { chapterForSkill } from './registry';
import { lab, labn } from '../label';

/**
 * Typed versions of two model questions. In the Academy these are "tap to shade" builds; typed practice
 * (arcade, drills, the dungeon) asks the reverse: read the picture and write the fraction, or give the
 * missing top number.
 */
function typedShade(rng: Rng): { question: Question } {
  const base = Q.shadeFractionStep(rng).question;
  const f = (base.visual as { fracs: { n: number; d: number }[] }).fracs[0];
  const { n, d } = f;
  return { question: { ...base, prompt: `The bridge deck is one whole cut into ${d} equal planks. What fraction of the deck is lit?`, expression: 'Lit part = ?', answer: n / d, answerText: `${n}/${d}`, acceptable: undefined, allowFraction: true,
    visual: { type: 'fracbar', fracs: [{ n, d, label: '?' }] } as Question['visual'], hint: 'Count the lit planks for the top number and all the planks for the bottom number.',
    solutionSteps: [`${labn(n, 'lit plank')} out of ${lab(d, 'equal planks')}.`, `So the lit part is ${n}/${d}.`], explanation: [`The bottom number, ${lab(d, 'equal planks')}, counts the equal parts in the whole.`, `The top number, ${labn(n, 'lit plank')}, counts the parts we have.`, `So the lit part is ${n}/${d}.`] } };
}
function typedEquiv(rng: Rng): { question: Question } {
  const base = Q.equivalentStep(rng).question;
  const [a, b] = (base.visual as { fracs: { n: number; d: number }[] }).fracs;
  const k = b.d / a.d;
  return { question: { ...base, prompt: `${a.n}/${a.d} of the deck is lit. Cut the same deck into ${b.d} planks: how many planks are lit now?`, expression: `${a.n}/${a.d} = ?/${b.d}`, answer: b.n, answerText: String(b.n), acceptable: undefined, allowFraction: false,
    visual: { type: 'fracbar', fracs: [{ n: a.n, d: a.d, label: `${a.n}/${a.d}` }, { n: 0, d: b.d, label: `?/${b.d}` }] } as Question['visual'], hint: `${lab(b.d, 'planks now')} is ${k} times as many as ${lab(a.d, 'planks before')}. Multiply the top by ${k} too.`,
    solutionSteps: [`${lab(a.d, 'planks before')} × ${lab(k, 'planks per old plank')} = ${lab(b.d, 'planks now')}, so multiply the top by ${k} as well.`, `${labn(a.n, 'lit plank before', 'lit planks before')} × ${lab(k, 'planks per old plank')} = ${lab(b.n, 'lit planks now')}, so ${a.n}/${a.d} = ${b.n}/${b.d}.`], explanation: ['Equal fractions: multiply the top and the bottom by the same number, and the amount stays the same.'] } };
}

const POOLS: Record<string, ((rng: Rng) => { question: Question })[]> = {
  'num.sense': [(r) => Q.countStep(r, 20), Q.subitizeStep, (r) => Q.compareStep(r, 20), (r) => Q.buildNumberStep(r, 99), Q.tensOnesStep, Q.bundleStep],
  frac: [typedShade, typedEquiv, Q.compareFractionsStep, Q.addSameDenomStep, Q.fractionOfStep, Q.unlikeDenomStep],
  ratio: [Q.ratioTableStep, Q.partPartWholeStep, Q.unitRateStep, Q.scaleRecipeStep, Q.crossProductStep, Q.scaleDrawingStep],
  percent: [Q.percentOfStep, Q.fracToPercentStep, Q.percentChangeStep],
  exponents: [Q.writePowerStep, Q.evaluatePowerStep, Q.powerOfTenStep, Q.sideFromAreaStep, Q.estimateRootStep, Q.squareCheckStep],
};

/** Arcade question types for fractions and ratios: one per question in each pool, in the same order. */
export const ARCADE_ACADEMY_KINDS: Record<'frac' | 'ratio', { id: string; label: string; desc: string }[]> = {
  frac: [
    { id: 'shade', label: 'Shaded parts', desc: 'What fraction of the shape is shaded?' },
    { id: 'equiv', label: 'Equal fractions', desc: 'Find the missing number that makes two fractions equal.' },
    { id: 'compare', label: 'Compare', desc: 'Which fraction is bigger?' },
    { id: 'addsame', label: 'Add, same bottom', desc: 'Add fractions that share a denominator.' },
    { id: 'of', label: 'Fraction of an amount', desc: 'Find ¾ of 24 and friends.' },
    { id: 'unlike', label: 'Add, different bottoms', desc: 'Find a common denominator, then add.' },
  ],
  ratio: [
    { id: 'table', label: 'Ratio tables', desc: 'Fill the missing number in a ratio table.' },
    { id: 'ppw', label: 'Part and whole', desc: 'Share a total in a ratio.' },
    { id: 'unitrate', label: 'Unit rates', desc: 'How much for one?' },
    { id: 'recipe', label: 'Scale a recipe', desc: 'Make more or less of a recipe in the same ratio.' },
    { id: 'cross', label: 'Proportions', desc: 'Solve a proportion with cross products.' },
    { id: 'scale', label: 'Scale drawings', desc: 'Turn a drawing measurement into a real size.' },
  ],
};
/** frac.of, ratio.table …: one question type; mastery still feeds the umbrella skill. */
const ARCADE_KIND_RE = /^(frac|ratio)\.([a-z]+)$/;

export const genAcademy: Generator = (skillId, _params, ctx) => {
  const kind = ARCADE_KIND_RE.exec(skillId);
  if (kind) {
    const umbrella = kind[1] as 'frac' | 'ratio';
    const i = ARCADE_ACADEMY_KINDS[umbrella].findIndex((k) => k.id === kind[2]);
    const make = POOLS[umbrella][Math.max(0, i)];
    return { ...make(ctx.rng).question, masterySkillId: umbrella };
  }
  const found = skillId.startsWith('acad.') ? chapterForSkill(skillId) : undefined;
  if (found) {
    const c = found.chapter;
    if (c.practice) return { ...c.practice(ctx.rng), masterySkillId: skillId };
    // No practice builder: a typed quest item with a plain numeric answer.
    for (let tries = 0; tries < 12; tries++) {
      const q = c.quests[Math.floor(ctx.rng.next() * c.quests.length)];
      const w = q.waves[Math.floor(ctx.rng.next() * q.waves.length)];
      const typedSteps = w.build(ctx.rng).filter((s) => s.verb === 'type' && !s.accept && !s.rule);
      if (typedSteps.length) return { ...typedSteps[0].question, masterySkillId: skillId };
    }
  }
  const pool = POOLS[skillId] ?? POOLS['num.sense'];
  const step = pool[Math.floor(ctx.rng.next() * pool.length)](ctx.rng);
  return { ...step.question, masterySkillId: skillId };
};
