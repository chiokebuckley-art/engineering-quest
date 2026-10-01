import { useEffect, useState } from 'react';
import { useGame } from '../store';
import { Icon } from './ui';
import { NPCS } from '../../content/npcs';
import { MINE_DEPTHS, depthDef, enemyById } from '../../engine/combat/enemies';
import { arrayGiven, plateValue } from '../../engine/combat/CombatEngine';
import { trainingFor } from '../../engine/state/reducer';
import { skillMastery } from '../../engine/mastery/MasteryEngine';
import type { BattleState, Question } from '../../engine/types';

/* ------------------------------------------------------------------ */
/* The Play HUD: Arcade's clarity, inside the adventure                 */
/* ------------------------------------------------------------------ */

/** Every correct answer charges a lamp; the gallery lamp lights when the creature falls. */
export function PlayHud({ b }: { b: BattleState }) {
  const { state } = useGame();
  const enemy = enemyById(b.enemyId)!;
  const def = b.depth !== undefined ? depthDef(b.regionId, b.depth) : undefined;
  const hits = Math.round(b.enemyMaxHp / enemy.hitDamage);
  const done = Math.round((b.enemyMaxHp - b.enemyHp) / enemy.hitDamage);
  const total = b.correctCount + b.wrongCount;
  const acc = total ? Math.round((b.correctCount / total) * 100) : 0;
  const wins = def ? state.world.depthWins[`${b.regionId}:${b.depth}`] ?? 0 : 0;
  const cleared = state.world.depthCleared[b.regionId] ?? 0;
  const toDragon = b.regionId === 'mines' ? MINE_DEPTHS.length - Math.max(cleared, (b.depth ?? 1) - 1) : 0;
  const focus = def?.tables.length ? def.tables.map((t) => `×${t}`).join(' ') : b.question.subtopic || b.question.topic;
  const side = def?.side;
  const sideDone = side && (state.world.sideDone ?? []).includes(`${b.regionId}:${b.depth}`);
  const secs = Math.round((Date.now() - b.startedAt) / 1000);
  const sideOk = !side || sideDone ? true : side.kind === 'nomiss' ? b.wrongCount === 0 : side.kind === 'nohint' ? (b.hintsUsed ?? 0) === 0 : side.kind === 'fast' ? secs <= side.target : true;
  return (
    <div className="play-hud" aria-label="Fight status">
      <div className="ph-lamps" title={`${done} of ${hits} hits`}>
        {Array.from({ length: Math.min(hits, 24) }, (_, i) => <i key={i} className={i < done ? 'on' : ''} />)}
        <span>{b.status === 'victory' ? 'Lamp lit!' : `${hits - done} to go`}</span>
      </div>
      <div className="ph-chips">
        <span className="chip"><b>{focus}</b></span>
        <span className="chip">Hit {b.correctCount}</span>
        <span className="chip">{total ? `${acc}%` : '–'} right</span>
        <span className={`chip ${b.streak >= 3 ? 'ok' : ''}`}>Streak {b.streak}</span>
        {def && !b.isBoss && <span className="chip">{(b.depth ?? 0) <= cleared ? 'Cleared ✓' : `Win ${wins}/${def.clears} to clear`}</span>}
        {toDragon > 0 && !b.isBoss && <span className="chip warn">Dragon: {toDragon} {toDragon === 1 ? 'gallery' : 'galleries'} away</span>}
        {b.route && <span className="chip">{b.route === 'quiet' ? 'Quiet tunnel' : 'Loud shaft'}</span>}
        {b.shield > 0 && <span className="chip ok">Shield {b.shield}</span>}
      </div>
      {side && !b.isBoss && (
        <div className={`ph-side ${sideDone ? 'done' : sideOk ? '' : 'lost'}`}>
          <Icon name="star" /> {sideDone ? `Done: ${side.text.split(':')[0]}` : `${side.text}${side.kind === 'streak' ? ` (best ${b.bestStreak ?? 0})` : ''}${sideOk ? '' : ' — missed this time'}`}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Verbs: choose an attack, match a plate, build the array             */
/* ------------------------------------------------------------------ */

export function VerbPanel({ b, onNext }: { b: BattleState; onNext: () => void }) {
  const { dispatch, play } = useGame();
  const [cell, setCell] = useState<[number, number] | null>(null);
  useEffect(() => { setCell(null); }, [b.question.id, b.attemptsOnCurrent]);
  const q = b.question;
  const fb = b.feedback;
  const m = /^(\d+) × (\d+)/.exec(q.expression);
  const [fa, fb2] = m ? [Number(m[1]), Number(m[2])] : [0, 0];
  const submit = (given: string) => { if (fb) return; play('click'); dispatch({ type: 'BATTLE_ANSWER', given }); };

  let body: JSX.Element | null = null;
  if (b.verb === 'choose' && b.choices) {
    body = (
      <>
        <div className="verb-ask">Pick your attack: <b>{q.expression}</b></div>
        <div className="verb-choices">
          {b.choices.map((c) => <button key={c} className={`btn big verb-btn ${fb && Number(c) === q.answer ? 'right' : ''}`} disabled={!!fb} onClick={() => submit(c)}>{c}</button>)}
        </div>
      </>
    );
  } else if (b.verb === 'plate' && b.choices) {
    body = (
      <>
        <div className="verb-ask">Fit the power plate that makes <b className="brass">{q.answer}</b></div>
        <div className="verb-choices plates">
          {b.choices.map((c) => <button key={c} className={`btn big verb-btn plate ${fb && plateValue(c) === q.answer ? 'right' : ''}`} disabled={!!fb} onClick={() => submit(String(plateValue(c)))}>{c}</button>)}
        </div>
      </>
    );
  } else if (b.verb === 'array') {
    const size = Math.max(5, Math.min(12, Math.max(fa, fb2) + 1));
    const [r, c] = cell ?? [0, 0];
    body = (
      <>
        <div className="verb-ask">Charge the cannon: build <b>{fa} {fa === 1 ? 'row' : 'rows'} of {fb2}</b>. Tap the corner cell.</div>
        <div className="array-build" style={{ gridTemplateColumns: `repeat(${size}, 1fr)`, maxWidth: size * 30 }} role="grid" aria-label={`Build ${fa} ${fa === 1 ? 'row' : 'rows'} of ${fb2}`}>
          {Array.from({ length: size * size }, (_, i) => {
            const rr = Math.floor(i / size) + 1; const cc = (i % size) + 1;
            const on = rr <= r && cc <= c;
            return <button key={i} className={`ab-cell ${on ? 'on' : ''}`} disabled={!!fb} aria-label={`${rr} rows by ${cc} columns`} onClick={() => { play('tick'); setCell([rr, cc]); }} />;
          })}
        </div>
        <div className="row" style={{ justifyContent: 'space-between', marginTop: 8 }}>
          <span className="small">{cell ? <>{r} row{r === 1 ? '' : 's'} of {c} = <b className="brass">{r * c}</b> dots</> : 'No array yet'}</span>
          <button className="btn primary" disabled={!cell || !!fb} onClick={() => submit(arrayGiven(q, r, c))}><Icon name="energy" /> Fire!</button>
        </div>
      </>
    );
  }
  return (
    <div className="challenge verb-panel">
      {body}
      {fb && <div className={`feedback ${fb.correct ? 'correct' : 'wrong'}`}>{fb.correct ? `${fb.text} ${fb.damage ? `−${fb.damage} HP.` : ''} ${q.expression.replace(' = ?', '')} = ${q.answer}.` : b.solutionShown ? `It was ${q.expression.replace(' = ?', '')} = ${q.answer}. ${q.solutionSteps.join(' ')}` : fb.text}</div>}
      {fb && b.recovery !== 'choose' && <button className="btn teal" onClick={onNext} autoFocus>{fb.correct || b.solutionShown ? 'Next' : 'Try again'} ⏎</button>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* After a miss: the player chooses how to come back                    */
/* ------------------------------------------------------------------ */

export function RecoveryChoices({ b, showRetry }: { b: BattleState; showRetry: boolean }) {
  const { state, dispatch, play } = useGame();
  if (b.recovery !== 'choose' || !b.feedback || b.feedback.correct || b.status !== 'active') return null;
  const kits = state.inventory.items['repair-kit'] ?? 0;
  const t = trainingFor(b.question);
  return (
    <div className="recovery" role="group" aria-label="How do you want to come back?">
      <div className="small muted">{showRetry ? 'Missed. How do you want to come back?' : 'Or come back another way:'}</div>
      <div className="recovery-grid">
        {showRetry && <button className="btn primary" onClick={() => { play('click'); dispatch({ type: 'BATTLE_RECOVER', choice: 'retry' }); }}><b>Try again</b><small>Right = full hit</small></button>}
        <button className="btn" onClick={() => { play('click'); dispatch({ type: 'BATTLE_RECOVER', choice: 'helper' }); }}><b>Show me the picture</b><small>Right = half hit</small></button>
        {kits > 0 && state.character && state.character.hp < state.character.maxHp && <button className="btn" onClick={() => { play('open'); dispatch({ type: 'USE_ITEM', itemId: 'repair-kit' }); }}><b>Repair Kit ({kits})</b><small>Heal, then choose</small></button>}
        {t && <button className="btn ghost" onClick={() => { play('open'); dispatch({ type: 'BATTLE_RECOVER', choice: 'train' }); }}><b>Train {t.label} in the Arcade</b><small>Come back with a shield</small></button>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tips and the Power Strike                                            */
/* ------------------------------------------------------------------ */

export function TipBar({ b }: { b: BattleState }) {
  const { state, dispatch, play } = useGame();
  const enemy = enemyById(b.enemyId)!;
  if (b.status !== 'active') return null;
  const canTip = !b.feedback && !b.tip && b.hintCharges > 0;
  const energy = state.character?.energy ?? 0;
  return (
    <div className="tip-bar">
      {b.tip ? (
        <div className="tip-text"><img src={NPCS[b.tip.npc].portrait} alt="" />{b.tip.text}</div>
      ) : (
        <div className="row wrap" style={{ gap: 6, alignItems: 'center' }}>
          <span className="small muted">Ask for a tip{b.hintCharges > 0 ? ` (${b.hintCharges})` : ' — none left'}:</span>
          {(['vector', 'ada', 'brick'] as const).map((n) => (
            <button key={n} className="tip-npc" disabled={!canTip} title={n === 'vector' ? 'Vector: what it means' : n === 'ada' ? 'Ada: a shortcut' : 'Brick: count it out'} onClick={() => { play('click'); dispatch({ type: 'BATTLE_TIP', npc: n }); }}>
              <img src={NPCS[n].portrait} alt={NPCS[n].name} /><span>{n === 'vector' ? 'Meaning' : n === 'ada' ? 'Shortcut' : 'Count it'}</span>
            </button>
          ))}
          {!enemy.isBoss && !b.preview && (
            <button className="btn small" disabled={!!b.feedback || energy < 10} title="Spend 10 energy: the answer is shown and the blow lands. The fact comes back for you to answer." onClick={() => { play('hit'); dispatch({ type: 'BATTLE_POWER' }); }}><Icon name="energy" /> Power Strike (10 ⚡)</button>
          )}
        </div>
      )}
    </div>
  );
}

/** What to train next in the Arcade after a fight: the weakest table of this gallery, or a fact that was missed. */
export function trainAfter(b: BattleState, mastery: Parameters<typeof skillMastery>[1]): { game: import('../../engine/state/types').ArcadeGame; selection: string; label: string } | null {
  const missed = b.retryQueue[0] ?? (b.wrongCount ? b.question : null);
  if (missed) { const t = trainingFor(missed as Question); if (t) return t; }
  const def = b.depth !== undefined ? depthDef(b.regionId, b.depth) : undefined;
  if (def?.tables.length) {
    // ×1 is never worth a trip to the Arcade when a real table is in the same gallery.
    const pool = def.tables.length > 1 ? def.tables.filter((t) => t !== 1) : def.tables;
    const weakest = [...pool].sort((x, y) => skillMastery(`mult.${x}`, mastery) - skillMastery(`mult.${y}`, mastery))[0];
    return b.regionId === 'division' ? { game: 'div', selection: `div:${weakest}`, label: `÷${weakest}` } : { game: 'mult', selection: `mult:${weakest}`, label: `×${weakest}` };
  }
  return trainingFor(b.question);
}
