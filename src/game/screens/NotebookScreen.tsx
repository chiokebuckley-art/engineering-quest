import { answerLabel } from '../../engine/questions';
import { useEffect, useState } from 'react';
import { useGame } from '../store';
import { Icon, Panel } from '../components/ui';
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

function Card({ e, now, onFix, onDrop }: { e: NotebookEntry; now: number; onFix: () => void; onDrop: () => void }) {
  const q = e.question; const k = ERROR_LABELS[e.kind];
  const due = e.dueAt <= now;
  return (
    <div className={`nb-card ${due ? 'due' : ''}`}>
      <div className="nb-top">
        <span className={`chip kind-${e.kind}`}>{k.label}</span>
        <span className="chip">{q.topic}{q.subtopic ? ` · ${q.subtopic}` : ''}</span>
        {e.lapses > 0 && <span className="chip hot">missed {e.lapses + 1}×</span>}
        <span className="spacer" />
        <span className="small muted">{due ? 'Due now' : `Due in ${ago(e.dueAt - now)}`}</span>
      </div>
      {q.prompt && <div className="nb-prompt">{labeled(q.prompt)}</div>}
      <div className="nb-expr">{labeled(q.expression)}</div>
      <div className="nb-answers"><span className="wrong">You: {e.given === '' ? '(blank)' : e.given}</span><span className="right">Answer: {answerLabel(q)}{q.unit ? ` ${q.unit}` : ''}</span></div>
      {q.word && <div className="small muted">{q.word.structure} → {q.word.ops.map((o) => OP_NAME[o]).join(', then ')}: {labeled(q.word.setup ?? q.word.layout)}</div>}
      <div className="nb-advice">{k.advice}</div>
      <div className="row wrap" style={{ marginTop: 8 }}>
        <span className="nb-dots" title={`${e.clean} of ${CLEAN_TO_CLEAR} clean fixes`}>{Array.from({ length: CLEAN_TO_CLEAR }, (_, i) => <i key={i} className={i < e.clean ? 'on' : ''} />)}</span>
        <span className="spacer" />
        <button className="btn small ghost" onClick={onDrop} title="Remove this card">Drop</button>
        <button className={`btn small ${due ? 'primary' : ''}`} onClick={onFix}><Icon name="repair" /> Fix it</button>
      </div>
    </div>
  );
}

function NotebookList() {
  const { state, dispatch, play } = useGame();
  const now = Date.now();
  const book = state.notebook ?? [];
  const active = activeEntries(book); const due = dueEntries(book, now);
  const cleared = book.filter((e) => e.clearedAt).length;
  const [showCleared, setShowCleared] = useState(false);
  const fix = (id: string) => { play('open'); dispatch({ type: 'NOTEBOOK_START', entryId: id }); };
  return (
    <div className="screen-scroll" style={{ background: 'url(/assets/environments/workshop-lab.svg) center / cover' }}>
      <div className="container stack" style={{ maxWidth: 820 }}>
        <div className="row wrap">
          <h2 className="brass">Wrong-Answer Notebook</h2>
          <span className="chip">{active.length} open</span>
          <span className="chip ok">{cleared} cleared</span>
          <span className="spacer" />
          <button className="btn small ghost" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'me' })}>‹ Me</button>
        </div>
        <Panel title="How the notebook works" icon="book">
          <p className="small muted">Every miss lands here with what you answered and what kind of mistake it was. <b>Fix it</b> means re-solving it, then three variations of the same structure, then one twist. A fix is clean when the original and all three variations are right first time. Three clean fixes, spaced out (now, 3 days, 7 days), clear the card. This is how the best students in the world study: they own their mistakes.</p>
          {due.length > 0 && <button className="btn primary big" onClick={() => fix(due[0].id)}><Icon name="repair" /> Fix the next one ({due.length} due)</button>}
        </Panel>
        {active.length === 0 && <div className="panel center"><h3 className="brass">Nothing to fix.</h3><p className="small muted">Go make some mistakes. Every miss in battles, the Arcade, the Rocket, Millionaire, Stud or the arena lands here.</p></div>}
        {active.map((e) => <Card key={e.id} e={e} now={now} onFix={() => fix(e.id)} onDrop={() => { play('click'); dispatch({ type: 'NOTEBOOK_DROP', entryId: e.id }); }} />)}
        {cleared > 0 && (
          <div className="stack">
            <button className="btn small ghost" onClick={() => setShowCleared((v) => !v)}>{showCleared ? 'Hide' : 'Show'} cleared cards ({cleared})</button>
            {showCleared && book.filter((e) => e.clearedAt).slice().reverse().map((e) => <div key={e.id} className="nb-card cleared"><span className="chip ok">Cleared</span> <span className="nb-expr small">{labeled(`${e.question.prompt ? `${e.question.prompt} ` : ''}${e.question.expression}`)}</span> <span className="small muted">missed {e.lapses + 1}×, fixed {e.fixes}×</span></div>)}
          </div>
        )}
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
