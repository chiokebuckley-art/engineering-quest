import { useEffect, useRef, useState } from 'react';
import { useGame } from '../store';
import { enemyById, depthDef } from '../../engine/combat/enemies';
import { regionById } from '../../engine/curriculum/regions';
import { MathChallenge } from '../components/MathChallenge';
import { labeled } from '../components/Labeled';
import { Bar, Icon } from '../components/ui';
import { battleAccuracy } from '../../engine/combat/CombatEngine';
import { factLabel } from '../../engine/curriculum/facts';
import { Confetti, Callout } from '../components/Fx';
import { asset } from '../../assets';
import { PlayHud, VerbPanel, RecoveryChoices, TipBar, trainAfter } from '../components/BattlePlay';
import { lessonById } from '../../content/lessons';
import { clearedWhere } from '../../engine/state/reducer';

export function BattleScreen() {
  const { state, dispatch, play } = useGame();
  const b = state.battle;
  const [fx, setFx] = useState<{ kind: 'hit' | 'miss'; id: number; damage: number; enemyDamage: number } | null>(null);
  const [showExplain, setShowExplain] = useState(false);
  const [confetti, setConfetti] = useState(0);
  const [combo, setCombo] = useState<{ n: number; text: string }>({ n: 0, text: '' });
  const lastFeedback = useRef<unknown>(null);

  // Trigger animations when feedback changes.
  useEffect(() => {
    if (!b?.feedback || b.feedback === lastFeedback.current) return;
    lastFeedback.current = b.feedback;
    setFx({ kind: b.feedback.correct ? 'hit' : 'miss', id: Date.now(), damage: b.feedback.damage, enemyDamage: b.feedback.enemyDamage });
    play(b.feedback.correct ? (b.feedback.damage ? 'hit' : 'correct') : 'enemy-hit');
    if (b.feedback.correct && b.streak >= 3 && b.feedback.damage && b.status === 'active') { setCombo({ n: Date.now(), text: b.streak >= 5 ? `COMBO ×${b.streak}!` : `COMBO ×${b.streak}` }); setTimeout(() => play('combo'), 150); }
    const t = setTimeout(() => setFx(null), 900);
    return () => clearTimeout(t);
  }, [b?.feedback, play]);

  useEffect(() => {
    if (b?.status === 'victory') { play(b.isBoss ? 'fanfare' : 'victory'); setConfetti(Date.now()); }
    if (b?.status === 'defeat') play('defeat');
  }, [b?.status, play]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setShowExplain(false); }, [b?.question.id]);

  // Boss phase changes get a big callout; the new phase's special is explained under it.
  const [phaseCall, setPhaseCall] = useState<{ n: number; text: string }>({ n: 0, text: '' });
  const lastPhase = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (b?.phase === undefined) { lastPhase.current = undefined; return; }
    if (lastPhase.current !== undefined && b.phase !== lastPhase.current) {
      const p = enemyById(b.enemyId)?.phases?.[b.phase];
      if (p) { setPhaseCall({ n: Date.now(), text: p.name.toUpperCase() }); play('boss-roar'); }
    }
    lastPhase.current = b.phase;
  }, [b?.phase, b?.enemyId, play]);

  if (!b || !state.character) return null;
  const enemy = enemyById(b.enemyId)!;
  const region = regionById(b.regionId);
  const c = state.character;
  const bg = b.regionId === 'mines' && (b.depth ?? 1) >= 5 ? asset('/assets/environments/mines-deep.svg') : region?.environment;
  const factCarried = state.dungeon ? state.dungeon.facts[state.dungeon.index] : undefined;

  return (
    <div className={`battle ${fx?.kind === 'miss' && fx.enemyDamage > 0 ? 'shake' : ''}`} style={{ backgroundImage: `url(${bg})` }}>
      <Confetti trigger={confetti} />
      <Callout text={combo.text} trigger={combo.n} />
      <Callout text={phaseCall.text} trigger={phaseCall.n} color="#f472b6" />
      <div className="scene-header" style={{ paddingBottom: 0 }}>
        <div className="loc"><h2>{b.isBoss ? 'BOSS BATTLE' : b.preview ? `SCOUTING · ${region?.name}` : region?.name}{b.depth ? ` · ${b.regionId === 'fraction-forest' ? 'Grove' : b.regionId === 'division' ? 'Hall' : 'Gallery'} ${b.depth}` : ''}</h2>
          {factCarried && <p>This specter carries <b className="brass">{factLabel(factCarried)}</b>.</p>}
        </div>
        <span className="spacer" />
        {b.isBoss && <span className="chip warn">Q {b.questionsAsked}/{enemy.bossRules?.questions} · misses {b.wrongCount}/{enemy.bossRules?.maxMisses}</span>}
        {b.status === 'active' && !b.isBoss && <button className="btn small ghost" onClick={() => dispatch({ type: 'BATTLE_FLEE' })}>Withdraw</button>}
      </div>

      <PlayHud b={b} />

      <div className="battle-stage">
        <div className="combatant player">
          <div className="plate">
            <div className="nm"><span>{c.name}</span><span className="muted">L{c.level}</span></div>
            <Bar value={c.hp} max={c.maxHp} kind="hp" right={`${c.hp}/${c.maxHp}`} thin />
            {b.shield > 0 && <div className="small muted">Shield {b.shield}</div>}
          </div>
          <img className={`sprite ${fx?.kind === 'miss' ? 'hit' : fx?.kind === 'hit' ? 'attack' : ''}`} src={c.avatar} alt="" />
          {fx?.kind === 'miss' && fx.enemyDamage > 0 && <div className="dmg-float player" style={{ left: '25%', top: '30%' }}>−{fx.enemyDamage}</div>}
        </div>
        <div className="combatant enemy">
          <div className="plate">
            <div className="nm"><span>{enemy.name}</span><span className="muted">{b.isBoss ? 'BOSS' : `Lv ${enemy.difficulty}`}</span></div>
            <div className="ttl">{enemy.title}</div>
            <Bar value={b.enemyHp} max={b.enemyMaxHp} kind="enemy" right={`${b.enemyHp}/${b.enemyMaxHp}`} thin />
          </div>
          <img className={`sprite ${b.status === 'victory' ? 'dead' : fx?.kind === 'hit' && fx.damage ? 'hit' : fx?.kind === 'miss' ? 'attack' : 'idle'}`} src={enemy.sprite} alt={enemy.name} style={enemy.hue ? { filter: `hue-rotate(${enemy.hue}deg) drop-shadow(0 12px 18px rgba(0,0,0,0.6))` } : undefined} />
          {fx?.kind === 'hit' && fx.damage > 0 && <div className="dmg-float" style={{ right: '25%', top: '30%' }}>−{fx.damage}</div>}
          {fx?.kind === 'hit' && fx.damage > 0 && <div className="bolt" style={{ left: '-20%', top: '55%', ['--dx' as string]: '260px', ['--dy' as string]: '-40px' }} />}
        </div>
      </div>

      <div className="battle-panel">
        <div className="stack" style={{ gap: 8 }}>
          {b.special && <div className="boss-special"><b>{b.special.kind === 'mirror' ? '🪞' : '💨'}</b> {b.special.text}</div>}
          {b.verb && b.verb !== 'type' ? (
            <VerbPanel b={b} onNext={() => { if (b.status === 'active') dispatch({ type: 'BATTLE_NEXT' }); }} />
          ) : (
            <MathChallenge
              question={b.question}
              feedback={b.feedback ? { correct: b.feedback.correct, text: b.feedback.correct ? `${b.feedback.text} ${b.feedback.damage ? `−${b.feedback.damage} HP to ${enemy.name}.` : ''}` : b.solutionShown ? `The answer is ${b.question.answer}. ${b.question.solutionSteps.join(' ')}` : b.recovery === 'choose' ? b.feedback.text : `${b.feedback.text}. Hint: ${b.question.hint}` } : undefined}
              onSubmit={(given) => dispatch({ type: 'BATTLE_ANSWER', given })}
              onNext={() => { if (b.status !== 'active') return; dispatch({ type: 'BATTLE_NEXT' }); }}
              hintShown={b.hintShown && !b.tip}
              showExplanation={showExplain}
              onToggleExplanation={() => setShowExplain((v) => !v)}
              nextLabel={b.feedback && !b.feedback.correct && !b.solutionShown ? (b.recovery === 'choose' ? 'Try again — full hit' : 'Try again') : 'Next'}
              compact
              silent
              disabled={b.status !== 'active'}
            />
          )}
          <RecoveryChoices b={b} showRetry={!!b.verb && b.verb !== 'type'} />
          <TipBar b={b} />
        </div>
        <div className="stack">
          <div className="battle-log" aria-live="polite">
            {[...b.log].reverse().map((l) => <div key={l.id} className={`l ${l.kind}`}>{labeled(l.text)}</div>)}
          </div>
          <div className="row wrap">
            {(state.inventory.items['repair-kit'] ?? 0) > 0 && <button className="btn small" onClick={() => dispatch({ type: 'USE_ITEM', itemId: 'repair-kit' })}><Icon name="repair" /> Repair Kit ({state.inventory.items['repair-kit']})</button>}
            {(state.inventory.items['focus-tonic'] ?? 0) > 0 && <button className="btn small" onClick={() => dispatch({ type: 'USE_ITEM', itemId: 'focus-tonic' })}><Icon name="potion" /> Focus Tonic ({state.inventory.items['focus-tonic']})</button>}
          </div>
        </div>
      </div>

      {b.status !== 'active' && <BattleEnd />}
    </div>
  );
}

function BattleEnd() {
  const { state, dispatch, play } = useGame();
  const b = state.battle!;
  const enemy = enemyById(b.enemyId)!;
  const acc = Math.round(battleAccuracy(b) * 100);
  const secs = Math.round((Date.now() - b.startedAt) / 1000);
  const win = b.status === 'victory';
  const def = b.depth !== undefined ? depthDef(b.regionId, b.depth) : undefined;
  const wins = def ? state.world.depthWins[`${b.regionId}:${b.depth}`] ?? 0 : 0;
  const cleared = (state.world.depthCleared[b.regionId] ?? 0) >= (b.depth ?? 99);
  const sideKey = `${b.regionId}:${b.depth}`;
  const sideDone = (state.world.sideDone ?? []).includes(sideKey);
  const train = trainAfter(b, state.mastery);
  const story = b.preview ? `You scouted ${enemy.name}'s territory. The road ahead is marked on your map.`
    : b.isBoss && win ? 'Carry the core home: the Engine is waiting in the village.'
    : def && win ? (cleared ? `${def.name} is clear — ${clearedWhere(b.regionId, b.depth!)}.` : `${def.clears - wins} more win${def.clears - wins === 1 ? '' : 's'} clears ${def.name} and lights its lamp in the village.`)
    : null;
  const again = () => { dispatch({ type: 'BATTLE_CLOSE' }); if (!b.preview) dispatch({ type: 'START_BATTLE', enemyId: b.enemyId, regionId: b.regionId, depth: b.depth, route: b.route }); };
  const lessonHelp = b.regionId === 'mines' && (b.depth ?? 0) <= 2 && !state.stats.lessonsCompleted.includes('l.mult-intro') ? lessonById('l.mult-intro') : undefined;
  return (
    <div className="battle-end">
      <div className="panel">
        <h1 className={win ? '' : 'lose'}>{win ? (b.isBoss ? 'POWER CORE RECOVERED' : 'VICTORY') : b.status === 'fled' ? 'WITHDRAWN' : b.isBoss ? 'THE DRAGON ENDURES' : 'RETREAT'}</h1>
        <p className="muted">{win ? `${enemy.name} is defeated.` : b.status === 'fled' ? 'You withdraw to fight another day.' : b.isBoss ? 'Too many misses. Study the facts it caught you on, then return.' : 'You retreat. Every missed fact has been added to your review schedule.'}</p>
        <div className="stat-grid">
          <div className="st"><b>{b.correctCount}</b><span>correct</span></div>
          <div className="st"><b>{b.wrongCount}</b><span>missed</span></div>
          <div className="st"><b>{acc}%</b><span>accuracy</span></div>
          <div className="st"><b>{secs}s</b><span>time</span></div>
        </div>
        {b.retryQueue.length > 0 && <p className="small muted">Facts to review: {b.retryQueue.map((q) => q.expression.replace(' = ?', `= ${q.answer}`)).join(' · ')}</p>}
        {story && <div className="end-story"><Icon name={b.isBoss ? 'crystal' : 'lantern'} /> {story}</div>}
        {def?.side && !b.preview && <div className={`end-side ${sideDone ? 'done' : ''}`}><Icon name="star" /> {sideDone ? `Side objective done: ${def.side.text.split(':')[0]} — ${def.side.reward}.` : `Side objective: ${def.side.text}.`}</div>}
        {b.buffUsed && <div className="small muted">{b.buffUsed} absorbed the first blows.</div>}
        <div className="end-actions">
          <button className="btn primary big" onClick={() => dispatch({ type: 'BATTLE_CLOSE' })}>Continue ▸</button>
          {def && !b.isBoss && !b.preview && state.character && state.character.hp > 0 && <button className="btn" onClick={() => { play('open'); again(); }}>Fight again</button>}
        </div>
        {train && !b.preview && (
          <button className="end-train" onClick={() => { play('open'); dispatch({ type: 'PLAY_TRAIN', ...train }); }}>
            <Icon name="hourglass" /><span><b>Sharpen {train.label} in the Arcade</b><small>5 right in Practice earns a shield for your next fight here</small></span><span>▸</span>
          </button>
        )}
        {lessonHelp && <button className="btn small ghost" style={{ marginTop: 6 }} onClick={() => { dispatch({ type: 'BATTLE_CLOSE' }); dispatch({ type: 'START_LESSON', lessonId: lessonHelp.id }); }}>Why does it work? Vector's 5-minute lesson</button>}
      </div>
    </div>
  );
}
