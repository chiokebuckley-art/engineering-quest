import { useState } from 'react';
import type { Difficulty, Question } from '../../engine/types';
import { PICTURE_GAMES } from '../../engine/questions/games';
import { checkAnswer, answerLabel } from '../../engine/questions';
import { createRng } from '../../engine/rng';
import { MathChallenge, Explanation } from '../components/MathChallenge';
import { labeled } from '../components/Labeled';

/**
 * Question gallery for checking pictures and wording: ?gallery=<game>&kind=<kind>&d=<1-6>&n=<count>&seed=<n>.
 * Each card is a live question (tap or type to answer), with its answer, hint and worked solution printed below.
 */
export function GalleryScreen({ params }: { params: URLSearchParams }) {
  const game = params.get('gallery') ?? 'pattern'; const kind = params.get('kind') ?? 'all';
  const d = Math.min(6, Math.max(1, Number(params.get('d') ?? 2))) as Difficulty;
  const n = Math.min(40, Math.max(1, Number(params.get('n') ?? 8))); const seed = Number(params.get('seed') ?? 1);
  const g = PICTURE_GAMES[game];
  if (!g) return <div className="container"><h2>No game "{game}"</h2><p>{Object.keys(PICTURE_GAMES).join(', ')}</p></div>;
  const rng = createRng(seed);
  const qs: Question[] = Array.from({ length: n }, () => g.question(kind, d, rng));
  return (
    <div className="screen-scroll"><div className="container stack" style={{ maxWidth: 720 }}>
      <h2 className="brass">{g.label} · {kind} · difficulty {d}</h2>
      {qs.map((q, i) => <GalleryCard key={q.id} q={q} i={i} />)}
    </div></div>
  );
}
function GalleryCard({ q, i }: { q: Question; i: number }) {
  const [fb, setFb] = useState<{ correct: boolean; text: string } | undefined>();
  return (
    <section className="panel gallery-card" data-gallery-index={i} style={{ padding: 12 }}>
      <div className="small muted">#{i + 1} · {q.subtopic} · {q.masterySkillId}</div>
      <MathChallenge question={q} feedback={fb} onSubmit={(g) => { const ok = checkAnswer(q, g); setFb({ correct: ok, text: ok ? 'Right.' : `Not yet: the answer is ${answerLabel(q)}.` }); }} onNext={() => setFb(undefined)} showExplanation={false} onToggleExplanation={() => {}} showTimer={false} readAloud />
      <div className="small gallery-answer">Answer: <b>{answerLabel(q)}{q.unit ? ` ${q.unit}` : ''}</b>{q.choices ? ` (choices: ${q.choices.map((c) => `${c.label}=${c.value}`).join(', ')})` : ''}</div>
      <div className="small">Hint: {labeled(q.hint)}</div>
      <Explanation q={q} />
    </section>
  );
}
