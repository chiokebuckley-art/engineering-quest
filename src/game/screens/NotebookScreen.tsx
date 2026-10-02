import { answerLabel } from '../../engine/questions';
import { useEffect, useState } from 'react';
import { useGame } from '../store';
import { MathChallenge } from '../components/MathChallenge';
import { labeled, LabelKey } from '../components/Labeled';
import { Confetti } from '../components/Fx';
import { activeEntries, dueEntries, ERROR_LABELS, CLEAN_TO_CLEAR, type NotebookEntry } from '../../engine/notebook/notebook';
import { OP_NAME } from '../../engine/questions/wordproblems';

const ago = (ms: number) => { const m = Math.round(ms / 60_000); if (m < 60) return `${Math.max(1, m)} min`; const h = Math.round(m / 60); if (h < 48) return `${h} h`; return `${Math.round(h / 24)} days`; };

export function NotebookScreen() {
  const { state } = useGame();
  return state.notebookRun ? <NotebookRunView /> : <NotebookList />;
}

const FROM: Record<string, string> = { battle: 'from a fight', boss: 'from a boss', lesson: 'from a lesson', drill: 'from a drill', mission: 'from a mission', review: 'from a review', diagnostic: 'from the diagnostic' };

/** 2m: one card per miss. Tap to fix; three clean fixes clear it. */
function Card({ e, now, onFix, onDrop }: { e: NotebookEntry; now: number; onFix: () => void; onDrop: () => void }) {
  const q = e.question; const k = ERROR_LABELS[e.kind];
  const due = !e.clearedAt && e.dueAt <= now;
  const fixed = !!e.clearedAt;
  const expr = q.expression.replace(/\s*=\s*\?\s*$/, '');
  return (
    <div className={`sq-nb ${due ? 'due' : ''}`}>
      <button className="body" onClick={onFix} disabled={fixed} aria-label={`Fix ${expr}`}>
        <span className="top">
          <span className="q">{labeled(fixed ? `${expr} = ${answerLabel(q)}` : `${expr} = ${e.given === '' ? '…' : e.given}`)} <b className={fixed ? 'ok' : 'x'}>{fixed ? '✓' : '✗'}</b></span>
          <span className={`tag ${fixed ? 'fixed' : due ? 'due' : 'heal'}`}>{fixed ? 'FIXED' : due ? 'DUE' : 'HEALING'}</span>
        </span>
        {q.prompt && !fixed && <span className="prompt">{labeled(q.prompt)}</span>}
        <span className="sub">{k.label.toLowerCase()} · {FROM[e.context] ?? q.topic}{e.lapses > 0 ? ` · missed ${e.lapses + 1}×` : ''} · {fixed ? 'cleared' : due ? `answer ${answerLabel(q)}${q.unit ? ` ${q.unit}` : ''}` : `next fix in ${ago(e.dueAt - now)}`}</span>
        {!fixed && <span className="tip">{k.advice}</span>}
        {q.word && !fixed && <span className="tip">{q.word.structure} → {q.word.ops.map((o) => OP_NAME[o]).join(', then ')}</span>}
        <span className="segs" title={`${e.clean} of ${CLEAN_TO_CLEAR} clean fixes`}>{Array.from({ length: CLEAN_TO_CLEAR }, (_, i) => <i key={i} className={fixed || i < e.clean ? 'on' : ''} />)}</span>
      </button>
      {!fixed && <button className="drop" onClick={onDrop} title="Remove this card" aria-label="Drop this card">✕</button>}
    </div>
  );
}

function NotebookList() {
  const { state, dispatch, play } = useGame();
  const now = Date.now();
  const book = state.notebook ?? [];
  const active = activeEntries(book); const due = dueEntries(book, now);
  const healing = active.filter((e) => e.dueAt > now);
  const cleared = book.filter((e) => e.clearedAt).slice().reverse();
  const [filter, setFilter] = useState<'due' | 'healing' | 'fixed'>(due.length ? 'due' : 'healing');
  const fix = (id: string) => { play('open'); dispatch({ type: 'NOTEBOOK_START', entryId: id }); };
  const shown = filter === 'due' ? due : filter === 'healing' ? healing : cleared;
  return (
    <div className="sq">
      <div className="sq-in">
        <button className="sq-back" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'me' })}>‹ Me</button>
        <div><h1 className="sq-title">Notebook</h1><p className="sq-sub">Every miss becomes a card. Fix it three times and it’s gone.</p></div>
        {due.length > 0 && (
          <section className="sq-due">
            <span className="big">{due.length}</span>
            <span className="main"><b>card{due.length === 1 ? '' : 's'} due today</b>~{Math.max(1, Math.round(due.length * 1.5))} minutes · original, three variations, one twist</span>
            <button className="sq-cta dark sm" onClick={() => fix(due[0].id)}>FIX ALL ▸</button>
          </section>
        )}
        <div className="sq-chips" role="group" aria-label="Which cards">
          <button className={`sq-chip k-next ${filter === 'due' ? 'on' : ''}`} onClick={() => setFilter('due')}>Due {due.length}</button>
          <button className={`sq-chip k-next ${filter === 'healing' ? 'on' : ''}`} onClick={() => setFilter('healing')}>Healing {healing.length}</button>
          <button className={`sq-chip k-done ${filter === 'fixed' ? 'on' : ''}`} onClick={() => setFilter('fixed')}>Fixed {cleared.length}</button>
        </div>
        {shown.length === 0 && <p className="sq-empty">{active.length === 0 ? 'Nothing to fix. Every miss in fights, drills, the Rocket, Millionaire, Stud or the arena lands here, and fixing it is how it sticks.' : filter === 'due' ? 'Nothing due right now. Healing cards come back on their own.' : filter === 'healing' ? 'No cards healing.' : 'No cards fixed yet.'}</p>}
        <div className="sq-rows">
          {shown.map((e) => <Card key={e.id} e={e} now={now} onFix={() => fix(e.id)} onDrop={() => { play('click'); dispatch({ type: 'NOTEBOOK_DROP', entryId: e.id }); }} />)}
        </div>
      </div>
    </div>
  );
}

function NotebookRunView() {
  const { state, dispatch, play } = useGame();
  const r = state.notebookRun!;
  const entry = (state.notebook ?? []).find((e) => e.id === r.entryId);
  const [explain, setExplain] = useState(false);
  const [burst, setBurst] = useState(0);
  const q = r.questions[r.index];
  const labels = ['The original', 'Variation 1', 'Variation 2', 'Variation 3', 'The twist'];
  const label = r.index === 0 ? labels[0] : r.index === r.questions.length - 1 ? labels[4] : labels[Math.min(3, r.index)];
  useEffect(() => { setExplain(false); }, [q?.id]);
  useEffect(() => { if (r.status === 'finished' && r.outcome?.clean) { setBurst(Date.now()); play(r.outcome.cleared ? 'fanfare' : 'victory'); } else if (r.status === 'finished') play('wrong'); }, [r.status]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="scene" style={{ backgroundImage: 'url(/assets/environments/workshop-lab.svg)' }}>
      <Confetti trigger={burst} />
      <div className="scene-header">
        <div className="loc"><h2>NOTEBOOK · {r.status === 'finished' ? 'RESULT' : `${label} · ${r.index + 1} of ${r.questions.length}`}</h2></div>
        <span className="spacer" />
        <button className="btn small ghost" onClick={() => dispatch({ type: 'NOTEBOOK_EXIT' })}>{r.status === 'finished' ? 'Back' : 'Stop'}</button>
      </div>
      <div className="scene-body">
        <div className="container" style={{ width: '100%', maxWidth: 760 }}>
          {r.status === 'active' && (
            <>
              <div className="nb-progress">{r.questions.map((_, i) => <i key={i} className={i < r.results.length ? (r.results[i] ? 'ok' : 'bad') : i === r.index ? 'now' : ''} />)}</div>
              {r.index === 0 && entry && <p className="small muted">Last time you said <b>{entry.given || '(blank)'}</b>. {ERROR_LABELS[entry.kind].advice}</p>}
              {r.index === r.questions.length - 1 && <p className="small muted">The twist: same idea, different shape. This one does not count against a clean fix.</p>}
              <MathChallenge question={q} feedback={r.feedback} onSubmit={(given) => dispatch({ type: 'NOTEBOOK_ANSWER', given })} onNext={() => { play('click'); dispatch({ type: 'NOTEBOOK_NEXT' }); }} hintShown={r.attempts > 0} showExplanation={explain} onToggleExplanation={() => setExplain((v) => !v)} nextLabel={r.feedback && !r.feedback.correct && r.attempts < 2 ? 'Try again' : 'Next'} showTimer={false} compact />
              {q.word && r.feedback && (r.feedback.correct || r.attempts >= 2) && <div className="why-box"><span className="tag">{q.word.structure}</span><b>{q.word.ops.map((o) => OP_NAME[o]).join(', then ')} → {labeled(`${q.word.setup ?? q.word.layout} = ${q.word.result ?? q.answer}`)}</b><p>{q.word.why}</p>{q.word.setup && <LabelKey />}</div>}
            </>
          )}
          {r.status === 'finished' && r.outcome && (
            <div className="panel center stack">
              <h1 className="brass">{r.outcome.cleared ? 'CARD CLEARED' : r.outcome.clean ? 'CLEAN FIX' : 'NOT CLEAN YET'}</h1>
              <div className="nb-progress big">{r.questions.map((_, i) => <i key={i} className={r.results[i] ? 'ok' : 'bad'} />)}</div>
              <p className="small muted">{r.outcome.cleared ? 'Three clean fixes. This mistake is history.' : r.outcome.clean ? `That's ${entry?.clean ?? 1} of ${CLEAN_TO_CLEAR}. It comes back in ${ago(r.outcome.nextDueAt - Date.now())} to prove it stuck.` : 'The original or a variation slipped. It comes back in 10 minutes. Read the worked steps first.'}</p>
              <div className="row wrap" style={{ justifyContent: 'center' }}>
                {dueEntries(state.notebook ?? []).length > 0 && <button className="btn primary big" onClick={() => { play('open'); dispatch({ type: 'NOTEBOOK_START', entryId: dueEntries(state.notebook ?? [])[0].id }); }}>Fix the next one</button>}
                <button className="btn" onClick={() => dispatch({ type: 'NOTEBOOK_EXIT' })}>Back to the notebook</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
