import { useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../store';
import { chapterOf } from '../../engine/academy/registry';
import { VISUAL_CARDS, visualCard, visualPool, visualChoices, matchesVisualName, type VisualCard, type VisualDomain, type VisualMode } from '../../engine/visual-library/progress';
import './VisualLibraryScreen.css';

const DOMAINS: { id: VisualDomain; label: string; count: number }[] = [
  { id: 'k12', label: 'Geometry · K–12', count: 45 },
  { id: 'phys', label: 'Physics & Chemical · Advanced', count: 110 },
  { id: 'ee', label: 'Electrical · Advanced', count: 110 },
];
const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;
/** A fresh element prevents the browser retaining the previous bitmap during a source change. */
function VisualArtwork({ src, alt, onReady }: { src: string; alt: string; onReady: (ready: boolean) => void }) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  const generation = useRef(0);
  return <figure className="vl-art" aria-busy={status === 'loading'}>
    <img key={attempt} src={src} alt={alt} style={{ visibility: status === 'ready' ? 'visible' : 'hidden' }}
      onLoad={() => { if (generation.current !== attempt) return; setStatus('ready'); onReady(true); }}
      onError={() => { if (generation.current !== attempt) return; setStatus('error'); onReady(false); }} />
    {status === 'loading' && <p role="status">Loading image…</p>}
    {status === 'error' && <div role="alert"><p>Image could not load. Retry before answering.</p><button className="btn ghost" onClick={() => { generation.current += 1; setAttempt(generation.current); setStatus('loading'); onReady(false); }}>Retry image</button></div>}
  </figure>;
}
export function VisualLibraryScreen() {
  const { state, dispatch } = useGame();
  const initialDomain = state.screenParams.domain;
  const [domain, setDomain] = useState<VisualDomain>(initialDomain === 'phys' || initialDomain === 'ee' ? initialDomain : 'k12');
  const [chapter, setChapter] = useState(String(state.screenParams.chapter ?? ''));
  const [phase, setPhase] = useState<'learn' | VisualMode>(state.screenParams.practice ? 'choice' : 'learn');
  const [explore, setExplore] = useState(false);
  const [review, setReview] = useState(false);
  const [id, setId] = useState(String(state.screenParams.card ?? ''));
  const [given, setGiven] = useState('');
  const [submitted, setSubmitted] = useState<{ correct: boolean; given: string } | null>(null);
  const [hint, setHint] = useState(false);
  const [artReady, setArtReady] = useState(false);
  const artGeneration = useRef(0);
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => { if (scroller.current) scroller.current.scrollTop = 0; }, [phase, domain, chapter]);
  const heading = useRef<HTMLHeadingElement>(null);
  const answered = useRef(false);
  const progress = state.visualLibrary;
  const browse = useMemo(() => VISUAL_CARDS.filter(c => c.domain === domain && (!chapter || c.chapter === chapter)), [domain, chapter]);
  const pool = useMemo(() => visualPool(domain, progress, explore, review, chapter || undefined), [domain, progress, explore, review, chapter]);
  const visible = phase === 'learn' ? browse : pool;
  // Keep the answered card visible while feedback is open, even if it just left review.
  const card = (submitted ? visualCard(id) : visible.find(c => c.id === id)) ?? visible[0];
  const artPath = card && (phase === 'learn' || submitted ? card.lessonArt : card.quizArt);
  const artKey = `${card?.id}:${phase}:${submitted ? 'feedback' : 'question'}:${artGeneration.current}`;
  const options = useMemo(() => card ? visualChoices(card) : [], [card?.id]);
  const studied = browse.filter(c => progress[c.id]?.studied).length;
  const missed = browse.filter(c => progress[c.id]?.missed).length;
  const record = card && progress[card.id];
  const comparison = submitted && !submitted.correct ? VISUAL_CARDS.find(c => c.domain === domain && matchesVisualName(c, submitted.given)) : undefined;
  const chapterDef = chapter && chapterOf('geometry', chapter);
  const resetAnswer = () => { setGiven(''); setSubmitted(null); setHint(false); answered.current = false; artGeneration.current += 1; setArtReady(false); };
  const selectCard = (next: VisualCard) => { setId(next.id); resetAnswer(); };
  const switchPhase = (next: 'learn' | VisualMode) => { if (next !== phase) { setPhase(next); resetAnswer(); } };
  const markStudied = () => card && dispatch({ type: 'VISUAL_STUDY', id: card.id });
  const practice = (mode: VisualMode) => {
    if (card) { markStudied(); setId(card.id); }
    setReview(false); switchPhase(mode);
  };
  const submit = () => {
    if (!artReady || !card || !given.trim() || answered.current || submitted) return;
    answered.current = true;
    const correct = phase === 'choice' ? given === card.id : matchesVisualName(card, given);
    dispatch({ type: 'VISUAL_ANSWER', id: card.id, mode: phase === 'choice' ? 'choice' : 'recall', correct });
    setId(card.id); setSubmitted({ correct, given: phase === 'choice' ? visualCard(given)?.name ?? given : given });
  };
  const move = (direction: number) => {
    if (!visible.length) { resetAnswer(); return; }
    const index = visible.findIndex(c => c.id === card?.id);
    selectCard(visible[index < 0 ? direction > 0 ? 0 : visible.length - 1 : (index + direction + visible.length) % visible.length]);
    heading.current?.focus();
  };
  return <div ref={scroller} className="screen-scroll"><div className="container stack visual-library">
    <div className="vl-head"><div><div className="small muted">The Academies / Visual Library{phase !== 'learn' ? ' / Practice' : ''}</div><h1 ref={heading} tabIndex={-1}>{phase === 'learn' ? 'Visual Library' : 'Name the Image'}</h1><p>{phase === 'learn' ? 'See it. Understand it. Name it.' : phase === 'choice' ? 'Look closely. Choose the most specific name.' : 'Recall the name from the image.'}</p></div><button className="btn ghost" onClick={() => dispatch({ type: 'ACADEMY_OPEN', view: 'campus' })}>The Academies</button></div>
    <div className="vl-layout">
      <aside className="vl-side" aria-label="Visual Library settings"><h2 className="brass">265 illustrated cards</h2>
        {DOMAINS.map(d => <button key={d.id} className={`btn ${domain === d.id ? 'selected' : 'ghost'}`} aria-pressed={domain === d.id} onClick={() => { setDomain(d.id); setChapter(''); setId(''); setReview(false); resetAnswer(); }}>{d.label}<br /><span className="small">{d.count} cards</span></button>)}
        <div className="vl-settings"><label><input type="radio" name={'visual-pool'} checked={!explore} onChange={() => { setExplore(false); resetAnswer(); }} />Studied cards</label><label><input type="radio" name={'visual-pool'} checked={explore} onChange={() => { setExplore(true); resetAnswer(); }} />Explore all</label><label><input type="checkbox" checked={review} onChange={e => { setReview(e.target.checked); switchPhase('recall'); resetAnswer(); }} />Review missed names ({missed})</label></div>
        <div className="vl-counter">{studied} / {browse.length} studied · {missed} names to review.<br />Practice starts with cards you have marked studied. Advanced subjects have their own sets.</div>
        {domain === 'k12' && <div><label htmlFor="vl-chapter">Geometry chapter</label><select id="vl-chapter" value={chapter} onChange={e => { setChapter(e.target.value); setId(''); resetAnswer(); }}><option value="">All geometry</option>{['triangles','polygons','circles','solids'].map(k => <option key={k} value={k}>{chapterOf('geometry', k)?.title}</option>)}</select></div>}
        {chapterDef && <button className="btn ghost" onClick={() => dispatch({ type: 'ACADEMY_OPEN', view: 'chapter', academy: 'geometry', chapter })}>Chapter {chapterDef.n} · {chapterDef.title}</button>}
        {domain !== 'k12' && <p className="small muted">Advanced visual reference. These cards do not unlock or certify an Academy chapter.</p>}
        <button className="btn ghost" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'library' })}>‹ Library</button>
      </aside>
      <section className="vl-content" aria-label="Visual learning content">
        <div className="vl-steps" aria-label="Learning mode">{(['learn','choice','recall'] as const).map((p,i) => <button key={p} className="btn ghost" aria-pressed={phase === p} onClick={() => switchPhase(p)}>{i+1} · {p === 'learn' ? 'Learn' : p === 'choice' ? 'Choose the name' : 'Type the name'}</button>)}</div>
        {!card ? <div className="vl-empty"><h2>{review ? 'No missed names in this set' : 'Learn a card first'}</h2><p>{review ? 'Missed names appear here until you recall them correctly twice.' : 'Browse a lesson and mark it studied, then try naming its image.'}</p><button className="btn primary" onClick={() => { setReview(false); switchPhase('learn'); }}>Browse lessons</button>{!review && <button className="btn ghost" onClick={() => setExplore(true)}>Explore all cards</button>}</div> : <>
          <div className="vl-card"><VisualArtwork key={artKey} src={asset(artPath!)} alt={phase === 'learn' || submitted ? `${card.name} illustrated lesson` : 'Unlabelled image to identify'} onReady={setArtReady} />
            <section className="vl-info" aria-label={phase === 'learn' ? 'Image lesson' : 'Answer panel'}>
              {phase === 'learn' ? <><span className="small muted">{card.tier} · {card.family}</span><h2>Meet {card.name}</h2><p>{card.definition}</p><h3>Look for the clue</h3><ul>{card.features.map((f,i) => <li key={i}>{f}</li>)}</ul><p className="small muted">Compare the outline, repeated parts and relationships in the annotated image.</p><button className="btn primary" onClick={markStudied}>{record?.studied ? '✓ Studied' : 'Mark studied'}</button><button className="btn primary" onClick={() => practice('choice')}>Try choosing the name →</button><button className="btn ghost" onClick={() => practice('recall')}>Try typing the name</button>{card.related && <button className="btn ghost" onClick={() => dispatch({ type: 'ACADEMY_OPEN', view: 'chapter', academy: card.related!.academy, chapter: card.related!.chapter })}>Related math · {chapterOf(card.related.academy,card.related.chapter)?.title}</button>}{card.chapter && <button className="btn ghost" onClick={() => dispatch({ type: 'ACADEMY_OPEN', view: 'chapter', academy: 'geometry', chapter: card.chapter })}>Geometry · {chapterOf('geometry',card.chapter)?.title}</button>}</> : submitted ? <div className={`vl-feedback ${submitted.correct ? '' : 'missed'}`} role="status"><h2>{submitted.correct ? 'Correct!' : 'Keep learning'}</h2><p>Your answer: {submitted.given}</p><h3>{card.name}</h3><p>{card.definition}</p><ul>{card.features.map((f,i) => <li key={i}>{f}</li>)}</ul>{comparison && <p><b>Compare {comparison.name}:</b> {comparison.definition}</p>}<p className="small">{submitted.correct ? 'Recognition grows into recall. Explain which features helped you.' : 'This name is saved in missed-names review. Two correct typed recalls will clear it.'}</p><button className="btn primary" onClick={() => move(1)}>Next image →</button>{phase === 'choice' && <button className="btn ghost" onClick={() => switchPhase('recall')}>Type this name from memory</button>}<button className="btn ghost" onClick={() => switchPhase('learn')}>Back to lesson</button></div> : <><h2>{phase === 'choice' ? 'Choose one answer' : 'What is its name?'}</h2><form className="stack" onSubmit={e => { e.preventDefault(); submit(); }}>
                {phase === 'choice' ? options.map((option,i) => <button type="button" disabled={!artReady} key={option.id} className="btn ghost vl-answer" aria-pressed={given === option.id} onClick={() => setGiven(option.id)}>{String.fromCharCode(65+i)} · {option.name}</button>) : <><label htmlFor="vl-answer">Your answer</label><input id="vl-answer" disabled={!artReady} value={given} onChange={e => setGiven(e.target.value)} autoComplete="off" autoCorrect="off" spellCheck={false} placeholder="Type the name" /></>}
                <button className="btn primary" disabled={!artReady || !given.trim()} type="submit">Check answer</button></form><button className="btn ghost" onClick={() => setHint(true)}>I need a hint</button>{hint && <p role="status">{card.features.join(' ')}</p>}<p className="small muted">Untimed practice · {pool.length} {pool.length === 1 ? 'card' : 'cards'} in this set</p></>}
              {record && <p className="vl-counter">Saved: {record.choiceCorrect} recognized · {record.recallCorrect} recalled{record.missed ? ' · needs review' : ''}</p>}
            </section>
          </div>
          {phase === 'learn' && <div className="vl-browser"><label htmlFor="vl-browse">Browse a card </label><select id="vl-browse" value={card.id} onChange={e => { const selected = visualCard(e.target.value); if (selected) selectCard(selected); }}>{browse.map(c => <option key={c.id} value={c.id}>{c.name}{progress[c.id]?.studied ? ' ✓' : ''}</option>)}</select></div>}
          <div className="vl-navigation"><button className="btn ghost" onClick={() => move(-1)}>← Previous</button><span className="vl-counter">{visible.length ? `${Math.max(1, visible.findIndex(c => c.id === card.id)+1)} / ${visible.length}` : 'Review complete'}</span><button className="btn ghost" onClick={() => move(1)}>Next →</button></div>
        </>}
      </section>
    </div>
  </div></div>;
}
