/**
 * Print generated academy questions for review:
 *   npx vite-node scripts/academy-sample.ts <academyId> [seeds=3] [chapterKey|all] [--unique]
 * --unique prints each distinct question type (subtopic + verb) at most 3 times per chapter.
 * --from=N starts at seed N (for a second look with fresh numbers).
 * Each line shows the prompt, expression, what the model/choices offer, the accepted answer, and the
 * worked steps, so a reviewer can re-derive every answer independently.
 */
import { createRng } from '../src/engine/rng';
import { academyById, ALL_ACADEMIES } from '../src/engine/academy/registry';
import { buildQuest, buildConcept, buildTransfer, buildTrial } from '../src/engine/academy/AcademyEngine';
import { rightAnswer } from '../src/engine/academy/judge';
import type { AcademyStep, AskStep } from '../src/engine/academy/types';

const argv = process.argv.slice(2); const unique = argv.includes('--unique'); const fromArg = argv.find((x) => x.startsWith('--from=')); const from = fromArg ? Number(fromArg.slice(7)) : 1; const [id, seedsArg, onlyArg] = argv.filter((x) => !x.startsWith('--')); const only = onlyArg === 'all' ? undefined : onlyArg;
const a = academyById(id ?? '') ?? ALL_ACADEMIES.find((x) => x.id === id);
if (!a) { console.error(`unknown academy ${id}; one of ${ALL_ACADEMIES.map((x) => x.id).join(', ')}`); process.exit(1); }
const seeds = Number(seedsArg ?? 3);
const asks = (steps: AcademyStep[]) => steps.filter((x): x is AskStep => x.kind === 'ask');
const show = (st: AskStep) => {
  const q = st.question;
  const offer = st.choices ? ` choices=[${st.choices.join(' | ')}]` : st.options ? ` options=[${st.options.map((o) => o.label).join(' | ')}]` : st.model ? ` model=${JSON.stringify(st.model)}` : '';
  return `  [${st.verb}] ${q.prompt.replace(/\s+/g, ' ')} || ${q.expression}${st.ask ? ` || build: ${st.ask}` : ''}${offer}\n      ANSWER: ${rightAnswer(st)}${q.unit ? ` ${q.unit}` : ''}   (numeric ${q.answer})\n      hint: ${q.hint}\n      steps: ${q.solutionSteps.join(' / ')}`;
};
for (const c of a.chapters) {
  if (only && c.key !== only) continue;
  console.log(`\n=== ${a.id} · ${c.n}. ${c.title} [${c.key}] ===`);
  console.log(`  GOAL ${c.goal}\n  MISCONCEPTION ${c.misconception}`);
  for (const t of c.teach) console.log(`  TEACH ${t.title}: ${t.text}${t.model ? ` [model ${t.model.kind}]` : ''}${t.visual ? ` [visual ${t.visual.type}]` : ''}`);
  const seen = new Map<string, number>();
  const emit = (label: string, st: AskStep) => {
    if (unique) { const k = `${st.question.subtopic}|${st.verb}`; const n = seen.get(k) ?? 0; if (n >= 3) return; seen.set(k, n + 1); }
    console.log(`-- ${label}`); console.log(show(st));
  };
  for (let s = from; s < from + seeds; s++) {
    for (const qd of c.quests) { const r = buildQuest(qd.id, createRng(s)); if (!r) continue; asks(r.steps).forEach((st) => emit(`quest "${qd.name}" ${st.wave} (seed ${s})`, st)); }
    const cc = buildConcept(a.id, c.key, createRng(s)); if (cc) asks(cc.steps).forEach((st) => emit(`concept (seed ${s})`, st));
    const tr = buildTransfer(a.id, c.key, createRng(s)); if (tr) asks(tr.steps).forEach((st) => emit(`transfer (seed ${s})`, st));
    if (c.practice) { const p = c.practice(createRng(s)); console.log(`-- practice (seed ${s}): ${p.prompt} || ${p.expression} = ${p.answerText ?? p.answer}   steps: ${p.solutionSteps.join(' / ')}`); }
  }
}
if (!only) for (let s = 1; s <= Math.min(seeds, 2); s++) { const t = buildTrial(a.id, createRng(s)); if (t) { console.log(`\n=== TRIAL (seed ${s}) ===`); asks(t.steps).forEach((st) => console.log(show(st))); } }
