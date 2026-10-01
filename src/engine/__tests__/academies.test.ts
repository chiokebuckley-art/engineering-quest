/**
 * Contract tests every academy must pass. Run one academy with
 *   ACADEMY=prealgebra npx vitest run src/engine/__tests__/academies.test.ts
 */
import { describe, it, expect } from 'vitest';
import { createRng } from '../rng';
import { ACADEMIES, ALL_ACADEMIES } from '../academy/registry';
import { buildQuest, buildConcept, buildTransfer, buildTrial } from '../academy/AcademyEngine';
import { judge, rightAnswer, wrongAnswer, modelProblem, norm } from '../academy/judge';
import { academySkill } from '../academy/defs';
import type { AcademyStep, AskStep } from '../academy/types';
import { answerLabel, checkAnswer, generateQuestion } from '../questions';
import type { Visual } from '../types';

const only = process.env.ACADEMY;
const targets = ACADEMIES.filter((a) => !a.draft && a.chapters.length && (!only || a.id === only));
const asks = (steps: AcademyStep[]) => steps.filter((x): x is AskStep => x.kind === 'ask');
const MODEL_VERBS = new Set(['counters', 'placevalue', 'numberline', 'array', 'fracbar', 'ratiotable', 'percent', 'power', 'root', 'balance', 'plot', 'angle', 'unitcircle', 'table', 'slider']);
const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8];

function visualProblems(v: Visual | undefined): string | null {
  if (!v) return null;
  const bad = JSON.stringify(v).match(/null|NaN|Infinity/);
  if (v.type === 'plot') { const [a, b, c, d] = v.range; if (!(a < b && c < d)) return 'plot range must be [xmin<xmax, ymin<ymax]'; }
  if (v.type === 'numline' && !(v.min < v.max)) return 'numline min must be < max';
  if (bad && v.type !== 'plot' && v.type !== 'mat') return `visual contains ${bad[0]}`;
  return null;
}

/** Every structural rule an ask must satisfy; returns problems. */
function askProblems(st: AskStep, ctx: string, skill: string | null): string[] {
  const out: string[] = [];
  const q = st.question;
  const text = `${q.prompt} ${q.expression} ${q.answerText ?? ''} ${q.hint} ${q.solutionSteps.join(' ')} ${(st.choices ?? []).join(' ')} ${st.ask ?? ''}`;
  if (/undefined|NaN|\[object Object\]|Infinity/.test(text)) out.push(`${ctx}: text contains undefined/NaN/Infinity: ${text.slice(0, 160)}`);
  if (!Number.isFinite(q.answer)) out.push(`${ctx}: answer is not a finite number`);
  if (!q.hint.trim()) out.push(`${ctx}: empty hint`);
  if (!q.solutionSteps.length) out.push(`${ctx}: no solution steps`);
  if (skill && q.masterySkillId !== skill) out.push(`${ctx}: masterySkillId ${q.masterySkillId} should be ${skill}`);
  const right = rightAnswer(st);
  if (!judge(st, right)) out.push(`${ctx}: right answer "${right}" is not accepted (${q.expression})`);
  if (judge(st, wrongAnswer(st))) out.push(`${ctx}: wrong answer accepted (${q.expression})`);
  if (st.verb === 'choose') {
    const cs = st.choices ?? [];
    if (cs.length < 2) out.push(`${ctx}: choose needs 2+ choices`);
    if (new Set(cs.map(norm)).size !== cs.length) out.push(`${ctx}: duplicate choices ${cs.join(' | ')}`);
    const ok = cs.filter((c) => judge(st, c)).length;
    if (ok !== 1) out.push(`${ctx}: ${ok} choices are accepted (need exactly 1): ${cs.join(' | ')} for ${q.expression}`);
  }
  if (st.verb === 'pickmodel') {
    const os = st.options ?? [];
    if (os.length < 2) out.push(`${ctx}: pickmodel needs 2+ options`);
    const ok = os.filter((o) => judge(st, o.label)).length;
    if (ok !== 1) out.push(`${ctx}: ${ok} picture options are accepted (need exactly 1)`);
    if (new Set(os.map((o) => norm(o.label))).size !== os.length) out.push(`${ctx}: duplicate option labels`);
    for (const o of os) { const vp = visualProblems(o.visual); if (vp) out.push(`${ctx}: option ${vp}`); }
    // labels are printed under each picture, so the right one must not repeat the thing the prompt asks for
    const rightLabel = os.find((o) => judge(st, o.label))?.label;
    const words = (t: string) => ` ${t.toLowerCase().replace(/[−–]/g, '-').replace(/[^a-z0-9/.\-]+/g, ' ').trim()} `;
    if (rightLabel && norm(rightLabel).length > 2 && words(`${q.prompt} ${st.ask ?? ''}`).includes(words(rightLabel))) out.push(`${ctx}: picture label "${rightLabel}" repeats the prompt and gives the answer away`);
  }
  if (MODEL_VERBS.has(st.verb)) {
    if (!st.model) out.push(`${ctx}: verb ${st.verb} needs a model`);
    else {
      if (st.model.kind !== st.verb) out.push(`${ctx}: verb ${st.verb} but model ${st.model.kind}`);
      if (!st.ask) out.push(`${ctx}: model steps need an "ask" line telling the player what to build`);
      const mp = modelProblem(st); if (mp) out.push(`${ctx}: ${mp} (answer ${right}, ${q.expression})`);
    }
  } else if (st.model) out.push(`${ctx}: verb ${st.verb} must not carry a model (use aid)`);
  if (st.aid && st.aid.kind !== 'riemann' && st.aid.kind !== 'secant' && st.aid.kind !== 'slider' && st.aid.kind !== 'plot') out.push(`${ctx}: aid must be riemann, secant, slider or plot`);
  const vp = visualProblems(q.visual); if (vp) out.push(`${ctx}: ${vp}`);
  if (st.verb === 'type' && (st.accept || st.rule)) {
    // typed answers go through the numeric keypad: accepted strings must be numbers
    for (const a of st.accept ?? []) if (!/^-?[\d.]+(\/\d+)?$/.test(norm(a))) out.push(`${ctx}: typed accept "${a}" is not a number the keypad can type`);
  }
  return out;
}

describe.each(targets.map((a) => [a.id, a] as const))('%s academy', (id, a) => {
  const own = id !== 'arithmetic';
  it('has a sound structure', () => {
    const problems: string[] = [];
    const keys = a.chapters.map((c) => c.key);
    if (new Set(keys).size !== keys.length) problems.push('duplicate chapter keys');
    if (keys[keys.length - 1] !== 'trial') problems.push('the last chapter must have key "trial"');
    if (a.chapters.length < 7) problems.push(`only ${a.chapters.length} chapters (need 6+ plus the trial)`);
    if (!a.coreLine || !a.trialIntro) problems.push('coreLine and trialIntro are required');
    for (const c of a.chapters) {
      if (!a.wings[c.wing]) problems.push(`${c.key}: wing "${c.wing}" is not in wings`);
      if (!c.goal || !c.misconception) problems.push(`${c.key}: goal and misconception are required`);
      if (c.teach.length < (c.key === 'trial' ? 1 : 2)) problems.push(`${c.key}: needs 2+ teach cards`);
      if (!c.quests[0].guided) problems.push(`${c.key}: the first quest must be guided`);
      for (const q of c.quests) {
        if (q.waves.length < (c.key === 'trial' ? 2 : 3)) problems.push(`${q.id}: needs 3 waves`);
        if (!q.hook || !q.change) problems.push(`${q.id}: hook and change are required`);
        if (!['vector', 'ada', 'brick', 'catalyst', 'volt', 'newton'].includes(q.giver)) problems.push(`${q.id}: unknown giver ${q.giver}`);
      }
      for (const t of c.teach) { const vp = visualProblems(t.visual); if (vp) problems.push(`${c.key} teach "${t.title}": ${vp}`); }
      if (own && c.fluency.skills[0] !== academySkill(id, c.key)) problems.push(`${c.key}: fluency family should be ${academySkill(id, c.key)}`);
    }
    expect(problems).toEqual([]);
  });

  it('every quest builds, judges its own answers, and asks with hands-on verbs', () => {
    const problems: string[] = [];
    for (const c of a.chapters) {
      const skill = own ? academySkill(id, c.key) : null;
      let handsOn = 0;
      for (const q of c.quests) for (const seed of SEEDS) {
        const run = buildQuest(q.id, createRng(seed));
        if (!run) { problems.push(`${q.id}: does not build`); continue; }
        const items = asks(run.steps);
        if (items.length < (c.key === 'trial' ? 6 : 7)) problems.push(`${q.id}: only ${items.length} asks`);
        const nonTyped = items.filter((s) => s.verb !== 'type').length;
        if (nonTyped < 2) problems.push(`${q.id} seed ${seed}: only ${nonTyped} non-typing asks (need 2+)`);
        handsOn += items.filter((s) => MODEL_VERBS.has(s.verb)).length;
        items.forEach((st, i) => problems.push(...askProblems(st, `${q.id}#${seed}.${i}`, skill && c.key !== 'trial' ? skill : null)));
      }
      if (c.key !== 'trial' && handsOn === 0) problems.push(`${c.key}: no hands-on model verb in either quest`);
    }
    expect(problems.slice(0, 40)).toEqual([]);
  });

  it('concept checks, transfer sets and practice work', () => {
    const problems: string[] = [];
    for (const c of a.chapters) for (const seed of SEEDS.slice(0, 5)) {
      const skill = own && c.key !== 'trial' ? academySkill(id, c.key) : null;
      const cc = buildConcept(id, c.key, createRng(seed))!;
      const ci = asks(cc.steps);
      if (ci.length !== 3) problems.push(`${c.key}: concept check has ${ci.length} items (need 3)`);
      ci.forEach((st, i) => problems.push(...askProblems(st, `${c.key} concept#${seed}.${i}`, skill)));
      const tr = buildTransfer(id, c.key, createRng(seed))!;
      const ti = asks(tr.steps);
      if (ti.length !== c.transferCount) problems.push(`${c.key}: transfer has ${ti.length} items`);
      ti.forEach((st, i) => problems.push(...askProblems(st, `${c.key} transfer#${seed}.${i}`, skill)));
      if (c.practice) {
        const pq = c.practice(createRng(seed));
        if (!Number.isFinite(pq.answer) || !checkAnswer(pq, answerLabel(pq))) problems.push(`${c.key}: practice question does not accept its own answer (${pq.expression})`);
        if (/[a-zπ√]/i.test(answerLabel(pq)) && !/^-?[\d./]+$/.test(answerLabel(pq))) problems.push(`${c.key}: practice answers must be numeric (got ${answerLabel(pq)})`);
      }
      if (own && c.key !== 'trial') {
        const g = generateQuestion(academySkill(id, c.key), {}, { rng: createRng(seed) });
        if (g.masterySkillId !== academySkill(id, c.key)) problems.push(`${c.key}: arcade practice records under ${g.masterySkillId}`);
        if (!checkAnswer(g, answerLabel(g))) problems.push(`${c.key}: arcade practice question does not accept its own answer`);
      }
    }
    expect(problems.slice(0, 40)).toEqual([]);
  });

  it('the Mastery Trial spans the academy', () => {
    const problems: string[] = [];
    for (const seed of SEEDS.slice(0, 5)) {
      const t = buildTrial(id, createRng(seed))!;
      const items = asks(t.steps);
      if (items.length < 20 || items.length > 32) problems.push(`trial has ${items.length} asks (need 20–32)`);
      if ((t.phases?.length ?? 0) < 3) problems.push('trial needs 3+ phases');
      items.forEach((st, i) => problems.push(...askProblems(st, `trial#${seed}.${i}`, null)));
    }
    expect(problems.slice(0, 40)).toEqual([]);
  });

  it('quest ids are globally unique', () => {
    const ids = ACADEMIES.flatMap((x) => x.chapters.flatMap((c) => c.quests.map((q) => q.id)));
    const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
    expect(dup).toEqual([]);
  });
});

describe('the ladder is complete', () => {
  it.skipIf(!!only)('no placeholder academies or chapters remain', () => {
    const drafts = ALL_ACADEMIES.flatMap((a) => (a.draft ? [a.id] : a.chapters.filter((c) => c.draft).map((c) => `${a.id}.${c.key}`)));
    expect(drafts).toEqual([]);
  });
});
