import type { Question } from '../engine/types';
import type { Rng } from '../engine/rng';
import { multFactId, divFactId } from '../engine/curriculum/facts';
import { multExplanation } from '../engine/questions/multiplication';
import { divExplanation } from '../engine/questions/division';
import { asset } from '../assets';
import { lab, labn } from '../engine/label';

export interface MissionStage {
  /** Prompt template; {a} and {b} are substituted, {answer} in the success line. */
  prompt: string;
  op: 'mult' | 'div';
  a: number[]; // candidate values for a (groups / divisor)
  b: number[]; // candidate values for b (per group / quotient)
  unit: string;
  success: string;
  image?: string; // build image shown after success
  application: string;
  /** What each number is, for the number labels in hints and worked steps: a (singular, plural), b, the total,
   *  and for a two-step stage the combined count (2 × a). Letters only, no digits. */
  labels: { a: [string, string]; b: string; total: string; groups?: string };
}

export interface MissionDef {
  id: string;
  name: string;
  giver: string;
  region: string;
  intro: string;
  outro: string;
  images: string[]; // stage 0..n
  stages: MissionStage[];
  environment: string;
}

const m = (f: string) => asset(`/assets/machines/${f}.svg`);

export const MISSIONS: MissionDef[] = [
  {
    id: 'm.bridge', name: 'Repair the Bridge', giver: 'ada', region: 'mines', environment: asset('/assets/environments/multiplication-mines.svg'),
    intro: 'The bridge over the chasm is down. I have the plans — every stage is a multiplication. Get the numbers right and the crew builds it.',
    outro: 'Lanterns lit, deck true, railings solid. The deep galleries are open. That is what multiplication looks like when it is finished.',
    images: [m('bridge-stage-0'), m('bridge-stage-1'), m('bridge-stage-2'), m('bridge-stage-3'), m('bridge-stage-3')],
    stages: [
      { prompt: 'The chasm needs {a} support assemblies. Each assembly requires {b} bolts. How many bolts must you bring?', labels: { a: ['support assembly', 'support assemblies'], b: 'bolts per assembly', total: 'total bolts' }, op: 'mult', a: [6, 7, 8], b: [8, 9, 12], unit: 'bolts', success: '{answer} bolts are delivered. The support assemblies rise from the chasm floor.', application: 'Structural fastener count.' },
      { prompt: 'The deck is laid in {a} sections. Each section is {b} metres long. How long is the finished deck?', labels: { a: ['deck section', 'deck sections'], b: 'metres per section', total: 'metres of deck' }, op: 'mult', a: [6, 7, 9], b: [6, 7, 8], unit: 'm', success: 'A {answer}-metre deck spans the chasm.', application: 'Total span from repeated segments.' },
      { prompt: 'The railing has {a} posts on each side, so 2 × {a} posts in total. Each post needs {b} brackets. How many brackets? (Multiply the total posts by {b}.)', labels: { a: ['post on each side', 'posts on each side'], groups: 'posts in total', b: 'brackets per post', total: 'total brackets' }, op: 'mult', a: [4, 5, 6], b: [3, 4, 6], unit: 'brackets', success: '{answer} brackets bolt the railings in place.', application: 'Two-step count: symmetrical structure.' },
      { prompt: 'Safety check. Each of the {a} assemblies is rated for {b} tonnes. What is the total load the bridge can carry?', labels: { a: ['assembly', 'assemblies'], b: 'tonnes per assembly', total: 'tonnes of load' }, op: 'mult', a: [6, 7, 8], b: [7, 9, 11], unit: 'tonnes', success: 'Rated for {answer} tonnes. The foreman signs off. The lanterns are lit.', application: 'Load rating = supports × rating per support.' },
    ],
  },
  {
    id: 'm.pump', name: 'Pump Failure', giver: 'ada', region: 'village', environment: asset('/assets/environments/arithmetic-village.svg'),
    intro: 'The pump is dead and the cisterns must be shared out by hand. I need division — fast and right.',
    outro: 'Pump primed, valves set, every house gets its share. Division is just multiplication read backwards — and now you can read both ways.',
    images: [m('water-pump'), m('water-pump'), m('water-pump'), m('water-pump')],
    stages: [
      { prompt: 'The main cistern holds {answer_total} litres. It must be shared equally among {a} houses. How many litres does each house get?', labels: { a: ['house', 'houses'], b: 'litres per house', total: 'litres in the cistern' }, op: 'div', a: [4, 6, 8], b: [6, 7, 9], unit: 'L', success: '{answer} litres to each house. The buckets go out.', application: 'Equal distribution of a resource.' },
      { prompt: 'The pump moved {answer_total} litres in {a} strokes before it failed. How many litres per stroke?', labels: { a: ['stroke', 'strokes'], b: 'litres per stroke', total: 'litres pumped' }, op: 'div', a: [5, 7, 9], b: [6, 8, 12], unit: 'L per stroke', success: '{answer} litres per stroke — that is the pump\'s rate. Now we know what a healthy pump should do.', application: 'A rate is a division: litres per stroke.' },
      { prompt: 'A {answer_total}-metre length of pipe must be cut into {a} equal runs to reach the far houses. How long is each run?', labels: { a: ['run', 'runs'], b: 'metres per run', total: 'metres of pipe' }, op: 'div', a: [3, 4, 6], b: [7, 8, 9], unit: 'm', success: 'Cut to {answer} metres each. The runs fit perfectly.', application: 'Dividing a length into equal segments.' },
    ],
  },
  {
    id: 'm.workshop', name: 'Build a Workshop', giver: 'ada', region: 'village', environment: asset('/assets/environments/workshop-lab.svg'),
    intro: 'A workshop of your own. Frame, walls, bench, roof. Multiplication forwards to count, division backwards to share — this project needs both.',
    outro: 'The workshop stands. This is where your laboratory begins — and every future project starts on this bench.',
    images: [m('workshop-building'), m('workshop-building'), m('workshop-building'), m('workshop-building'), m('workshop-building')],
    stages: [
      { prompt: 'The frame has {a} timber posts. Each post takes {b} bolts. How many bolts for the frame?', labels: { a: ['timber post', 'timber posts'], b: 'bolts per post', total: 'bolts for the frame' }, op: 'mult', a: [4, 6, 8], b: [4, 6, 7], unit: 'bolts', success: 'The frame is bolted square.', application: 'Fastener count.' },
      { prompt: 'You have {answer_total} bolts left for the {a} wall panels. If they are shared evenly, how many bolts per panel?', labels: { a: ['wall panel', 'wall panels'], b: 'bolts per panel', total: 'bolts left' }, op: 'div', a: [3, 4, 6], b: [6, 8, 9], unit: 'bolts per panel', success: 'Each panel gets {answer} bolts. The walls go up.', application: 'Sharing a fixed stock evenly.' },
      { prompt: 'The workbench top is made of {a} planks, each {b} centimetres wide. How wide is the bench?', labels: { a: ['plank', 'planks'], b: 'cm per plank', total: 'bench width in cm' }, op: 'mult', a: [6, 8, 9], b: [9, 11, 12], unit: 'cm', success: 'A {answer} cm bench. Wide enough for a reactor model.', application: 'Width from repeated plank widths.' },
      { prompt: 'The roof needs {a} rows of tiles with {b} tiles in each row. How many tiles?', labels: { a: ['row of tiles', 'rows of tiles'], b: 'tiles per row', total: 'total tiles' }, op: 'mult', a: [7, 8, 9], b: [8, 9, 12], unit: 'tiles', success: 'Roof on. {answer} tiles keep the rain off your notes.', application: 'Area as rows × columns — geometry is waiting.' },
    ],
  },
];

export const missionById = (id: string) => MISSIONS.find((x) => x.id === id);

/** Instantiate a mission stage into a concrete Question. */
export function stageQuestion(mission: MissionDef, stageIndex: number, rng: Rng): Question {
  const st = mission.stages[stageIndex];
  const a = rng.pick(st.a);
  const b = rng.pick(st.b);
  const twoStep = st.prompt.includes('2 × {a}');
  if (st.op === 'mult') {
    const groups = twoStep ? 2 * a : a;
    const answer = groups * b;
    const prompt = st.prompt.replace(/\{a\}/g, String(a)).replace(/\{b\}/g, String(b));
    const lb = st.labels;
    const A = labn(a, ...lb.a); const B = lab(b, lb.b); const T = lab(answer, lb.total); const P = lab(groups, lb.groups ?? lb.a[1]);
    return {
      id: `${mission.id}-${stageIndex}-${Date.now().toString(36)}`,
      masterySkillId: 'mult.applied',
      factId: twoStep ? undefined : multFactId(a, b),
      topic: 'Multiplication', subtopic: 'Engineering mission', difficulty: twoStep ? 6 : 5, mode: 'applied',
      prompt, expression: twoStep ? `2 × ${a} × ${b} = ?` : `${a} × ${b} = ?`, answer, unit: st.unit,
      hint: twoStep ? `First find the total posts: 2 (sides) × ${A} = ${P}. Then multiply by ${B}.` : `${a} groups of ${b}. Multiply: ${A} × ${B}.`,
      solutionSteps: twoStep ? [`Posts: 2 (sides) × ${A} = ${P}.`, `Brackets: ${P} × ${B} = ${T}.`] : [`${A} × ${B} = ${T}.`],
      explanation: twoStep ? ['Two steps: count the posts, then multiply by brackets per post.', `2 (sides) × ${A} = ${P}.`, `${P} × ${B} = ${T}.`] : multExplanation(a, b, { groups: lb.a, per: lb.b, total: lb.total }),
      visual: twoStep ? { type: 'none' } : { type: 'groups', groups: a, perGroup: b },
      prerequisites: ['mult'],
      engineeringApplication: st.application,
    };
  }
  const total = a * b;
  const prompt = st.prompt.replace(/\{answer_total\}/g, String(total)).replace(/\{a\}/g, String(a)).replace(/\{b\}/g, String(b));
  const lb = st.labels;
  const T = lab(total, lb.total); const G = labn(a, ...lb.a); const B = lab(b, lb.b);
  return {
    id: `${mission.id}-${stageIndex}-${Date.now().toString(36)}`,
    masterySkillId: 'div.applied',
    factId: divFactId(total, a),
    topic: 'Division', subtopic: 'Engineering mission', difficulty: 5, mode: 'applied',
    prompt, expression: `${total} ÷ ${a} = ?`, answer: b, unit: st.unit,
    hint: `Shared equally → divide: ${T} ÷ ${G}. Think ${a} × ? = ${total}.`,
    solutionSteps: [`${G} × ${B} = ${T}, so ${T} ÷ ${G} = ${B}.`],
    explanation: divExplanation(total, a, { groups: lb.a, per: lb.b, total: lb.total }),
    visual: { type: 'share', total, groups: a },
    prerequisites: ['div'],
    engineeringApplication: st.application,
  };
}
