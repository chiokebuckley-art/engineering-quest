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
import { NPCS } from '../../content/npcs';

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

  const where = `${b.isBoss ? 'Boss' : b.preview ? `Scouting · ${region?.name}` : region?.name}${b.depth ? ` · ${b.regionId === 'fraction-forest' ? 'Grove' : b.regionId === 'division' ? 'Hall' : 'Gallery'} ${b.depth}` : ''}`;
  // One pip per question: mint right, red miss, gold the one being asked, dim the ones still to come.
  const marks = b.log.filter((l) => l.kind === 'hit' || l.kind === 'miss').map((l) => l.kind);
  const hitsLeft = Math.max(0, Math.ceil(b.enemyHp / Math.max(1, enemy.hitDamage)) - 1);
  const upcoming = b.isBoss && enemy.bossRules ? Math.max(0, enemy.bossRules.questions - b.questionsAsked) : hitsLeft;
  const pips = [...marks, ...(b.status === 'active' && !b.feedback ? ['now'] : []), ...Array(Math.min(upcoming, 24)).fill('later')].slice(-28);

  return (
    <div className={`battle bq ${fx?.kind === 'miss' && fx.enemyDamage > 0 ? 'shake' : ''}`}>
      <Confetti trigger={confetti} />
      <Callout text={combo.text} trigger={combo.n} />
      <Callout text={phaseCall.text} trigger={phaseCall.n} color="#f472b6" />
      <div className="bq-top">
        {b.status === 'active' && !b.isBoss ? <button className="bq-x" aria-label="Withdraw from the fight" title="Withdraw" onClick={() => dispatch({ type: 'BATTLE_FLEE' })}>✕</button> : <span className="bq-x" aria-hidden />}
        <div className="bq-pips" aria-label={`${b.correctCount} right, ${b.wrongCount} missed`}>{pips.map((k, i) => <i key={i} className={k} />)}</div>
        <span className="bq-streak" title="Streak">🔥 ×{b.streak}</span>
      </div>
      <div className="bq-where">
        <b>{where}</b>
        {factCarried && <span> · carries <b className="brass">{factLabel(factCarried)}</b></span>}
        {b.isBoss && <span className="chip warn">Q {b.questionsAsked}/{enemy.bossRules?.questions} · misses {b.wrongCount}/{enemy.bossRules?.maxMisses}</span>}
      </div>

      <div className="bq-scene" style={bg ? { ['--scene' as string]: `url(${bg})` } : undefined}>
        <div className="bq-me">
          <img className={`sprite ${fx?.kind === 'miss' ? 'hit' : fx?.kind === 'hit' ? 'attack' : ''}`} src={c.avatar} alt="" />
          <Bar value={c.hp} max={c.maxHp} kind="hp" right={`${c.hp}/${c.maxHp}`} thin />
          {b.shield > 0 && <small>Shield {b.shield}</small>}
          {fx?.kind === 'miss' && fx.enemyDamage > 0 && <div className="dmg-float player">−{fx.enemyDamage}</div>}
        </div>
        <img className={`sprite bq-enemy ${b.status === 'victory' ? 'dead' : fx?.kind === 'hit' && fx.damage ? 'hit' : fx?.kind === 'miss' ? 'attack' : 'idle'}`} src={enemy.sprite} alt={enemy.name} style={enemy.hue ? { filter: `hue-rotate(${enemy.hue}deg) drop-shadow(0 12px 18px rgba(0,0,0,0.6))` } : undefined} />
        {fx?.kind === 'hit' && fx.damage > 0 && <div className="dmg-float">−{fx.damage}</div>}
        <div className="bq-hp">
          <div className="nm"><span>{enemy.name}</span><span>{b.enemyHp} / {b.enemyMaxHp}</span></div>
          <Bar value={b.enemyHp} max={b.enemyMaxHp} kind="enemy" />
        </div>
      </div>

      <div className="battle-panel bq-panel">
        <div className="stack" style={{ gap: 8 }}>
          {b.special && <div className="boss-special"><b>{b.special.kind === 'mirror' ? '🪞' : '💨'}</b> {b.special.text}</div>}
          {b.verb && b.verb !== 'type' ? (
            <>
              <VerbPanel b={b} onNext={() => { if (b.status === 'active') dispatch({ type: 'BATTLE_NEXT' }); }} />
              <TipBar b={b} />
            </>
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
              submitLabel="FIRE"
              guideLine={b.tip ? <><img src={NPCS[b.tip.npc].portrait} alt="" />{b.tip.text}</> : <>{enemy.title}</>}
              helpExtra={<TipBar b={b} />}
              compact
              silent
              disabled={b.status !== 'active'}
            />
          )}
          <RecoveryChoices b={b} showRetry={!!b.verb && b.verb !== 'type'} />
        </div>
        <PlayHud b={b} />
        <details className="bq-log">
          <summary>Battle log · items</summary>
          <div className="battle-log" aria-live="polite">
            {[...b.log].reverse().map((l) => <div key={l.id} className={`l ${l.kind}`}>{labeled(l.text)}</div>)}
          </div>
          <div className="row wrap" style={{ marginTop: 6 }}>
            {(state.inventory.items['repair-kit'] ?? 0) > 0 && <button className="btn small" onClick={() => dispatch({ type: 'USE_ITEM', itemId: 'repair-kit' })}><Icon name="repair" /> Repair Kit ({state.inventory.items['repair-kit']})</button>}
            {(state.inventory.items['focus-tonic'] ?? 0) > 0 && <button className="btn small" onClick={() => dispatch({ type: 'USE_ITEM', itemId: 'focus-tonic' })}><Icon name="potion" /> Focus Tonic ({state.inventory.items['focus-tonic']})</button>}
          </div>
        </details>
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
  const xp = b.log.filter((l) => l.kind === 'victory').map((l) => /\+(\d+) XP/.exec(l.text)?.[1]).find(Boolean);
  const total = b.correctCount + b.wrongCount;
  const eyebrow = win ? (b.isBoss ? 'Power core recovered' : b.preview ? 'Scouted' : cleared && def ? `${b.regionId === 'fraction-forest' ? 'Grove' : b.regionId === 'division' ? 'Hall' : 'Gallery'} cleared` : 'Victory') : b.status === 'fled' ? 'Withdrawn' : b.isBoss ? 'The boss endures' : 'Retreat';
  return (
    <div className="battle-end bq-end">
      <div className="bq-end-in">
        <p className={`sq-eyebrow ${win ? 'k-next' : 'k-fix'}`} style={{ justifyContent: 'center' }}>{eyebrow}</p>
        <h1>{def?.name ?? enemy.name}{def && b.depth ? ` · ${def.tables.map((t) => `×${t}`).join(' ')}` : ''}</h1>
        <div className={`bq-medal ${win ? '' : 'dim'}`}><Icon name={b.isBoss ? 'crystal' : 'lantern'} /></div>
        <p className="bq-story">{story ?? (win ? `${enemy.name} is defeated.` : b.status === 'fled' ? 'You withdraw to fight another day.' : b.isBoss ? 'Too many misses. Study the facts it caught you on, then return.' : 'You retreat. Every missed fact has been added to your review schedule.')}</p>
        <div className="sq-stats">
          <div className="sq-stat k-next"><b>{xp ? `+${xp}` : `${secs}s`}</b><small>{xp ? 'XP' : 'time'}</small></div>
          <div className="sq-stat k-done"><b>{b.correctCount}/{total}</b><small>right · {acc}%</small></div>
          <div className="sq-stat k-play"><b>{def?.side && sideDone ? '✓' : b.wrongCount}</b><small>{def?.side && sideDone ? 'side goal' : 'missed'}</small></div>
        </div>
        {(b.retryQueue.length > 0 || (def?.side && !b.preview) || b.buffUsed) && (
          <div className="sq-card bq-changed">
            <p className="sq-eyebrow k-drill">What changed</p>
            {b.retryQueue.map((q) => <div key={q.id} className="ln"><span>{q.expression.replace(' = ?', '')} = {q.answer}</span><span className="o">missed → review</span></div>)}
            {def?.side && !b.preview && <div className="ln"><span>{def.side.text.split(':')[0]}</span><span className={sideDone ? 'g' : 'm'}>{sideDone ? def.side.reward : 'still open'}</span></div>}
            {b.buffUsed && <div className="ln"><span>{b.buffUsed}</span><span className="m">absorbed the first blows</span></div>}
          </div>
        )}
        <button className="sq-cta" onClick={() => dispatch({ type: 'BATTLE_CLOSE' })}>{win && cleared && !b.isBoss && !b.preview ? 'NEXT' : 'CONTINUE'} ▸</button>
        <div className="bq-end-row">
          {train && !b.preview && <button className="sq-btn2 k-drill" onClick={() => { play('open'); dispatch({ type: 'PLAY_TRAIN', ...train }); }} title="5 right in Practice earns a shield for your next fight here">Drill {train.label} (2 min)</button>}
          {def && !b.isBoss && !b.preview && state.character && state.character.hp > 0 && <button className="sq-btn2" onClick={() => { play('open'); again(); }}>Fight again</button>}
        </div>
        {lessonHelp && <button className="btn small ghost" onClick={() => { dispatch({ type: 'BATTLE_CLOSE' }); dispatch({ type: 'START_LESSON', lessonId: lessonHelp.id }); }}>Why does it work? Vector's 5-minute lesson</button>}
      </div>
    </div>
  );
}
