import { useMemo, useState } from 'react';
import { useGame } from '../store';
import { Icon } from '../components/ui';
import { nextStep } from '../../engine/state/guide';
import { dailyPlan, type DailyItem } from '../../engine/state/selectors';
import { enemyById } from '../../engine/combat/enemies';
import { regionById } from '../../engine/curriculum/regions';
import { academyById } from '../../engine/academy/registry';
import { pausedPlaza } from '../../engine/state/plaza';
import { saveEngineCard } from '../components/World';
import { buildRegistry, goTo, libraryPrefs, type LibraryItem } from '../library';
import type { Action } from '../../engine/state/actions';
import type { GameState } from '../../engine/state/types';
import { asset } from '../../assets';

/** The Continue card: whatever was left unfinished, else the guide's one next step. */
interface Continue { where: string; title: string; meta: string; art?: string; go: () => void; label: string }

function continueFor(s: GameState, dispatch: (a: Action) => void): Continue {
  const regionName = (id: string) => regionById(id)?.name ?? 'The village';
  if (s.academy.run) {
    const a = academyById(s.academy.run.academyId);
    return { where: a?.name ?? 'Academy', title: 'Your academy quest', meta: 'Pick up where you stopped', go: () => dispatch({ type: 'NAVIGATE', screen: 'academy' }), label: 'RESUME' };
  }
  if (s.notebookRun) return { where: 'Notebook', title: 'Fixing a notebook card', meta: 'Finish the fix', go: () => dispatch({ type: 'NAVIGATE', screen: 'notebook' }), label: 'RESUME' };
  if (s.contest.run?.paused) return { where: 'Contest Path', title: 'Today’s session', meta: 'Paused · carry on', go: () => dispatch({ type: 'NAVIGATE', screen: 'contest' }), label: 'RESUME' };
  if ((s.plaza && s.plaza.phase !== 'over') || pausedPlaza(s.stats.plaza)) return { where: 'Equation Plaza', title: 'Your board is waiting', meta: 'Same tiles, same score', go: () => dispatch({ type: 'NAVIGATE', screen: 'plaza' }), label: 'RESUME' };
  if (s.tycoon && !s.tycoon.online) return { where: 'Engine City Tycoon', title: 'Your game is saved', meta: 'Carry on trading', go: () => dispatch({ type: 'NAVIGATE', screen: 'tycoon' }), label: 'RESUME' };
  const step = nextStep(s);
  const a = step.action;
  const art = a.type === 'START_BATTLE' ? enemyById(a.enemyId)?.sprite : undefined;
  const where = a.type === 'START_BATTLE' || a.type === 'TRAVEL' ? regionName(a.regionId) : regionName(s.world.currentRegion);
  return { where, title: step.label, meta: step.hint, art, go: () => dispatch(a), label: a.type === 'START_BATTLE' ? 'FIGHT' : 'GO' };
}

/** Today's plan: three steps, from the daily training plan. */
function runPlan(item: DailyItem, dispatch: (a: Action) => void) {
  const a = item.action;
  if (a.screen === 'drill' && a.params) dispatch({ type: 'START_DRILL', skillIds: [String(a.params.skill)], count: Number(a.params.count) });
  else if (a.screen === 'region' && a.params?.region) dispatch({ type: 'TRAVEL', regionId: String(a.params.region) });
  else if (a.screen === 'dungeon') dispatch({ type: 'START_DUNGEON' });
  else dispatch({ type: 'NAVIGATE', screen: a.screen as never });
}

export function HomeScreen() {
  const { state, dispatch, play, profiles } = useGame();
  const [shared, setShared] = useState('');
  const registry = useMemo(() => buildRegistry(state), [state]);
  if (!state.character) return null;
  const cont = continueFor(state, dispatch);
  const plan = dailyPlan(state).slice(0, 3);
  const done = plan.filter((p) => p.done).length;
  const current = plan.findIndex((p) => !p.done);
  const minutes = plan.reduce((n, p) => n + (p.done ? 0 : p.minutes), 0);
  const streak = state.stats.dayStreak ?? 0;
  const news = state.world.lastChange?.text;
  const recent = libraryPrefs.get(profiles.active).recent.map((id) => registry.find((i) => i.id === id)).filter((i): i is LibraryItem => !!i).slice(0, 6);
  const open = (i: LibraryItem) => { play('click'); libraryPrefs.touch(profiles.active, i.id); goTo(dispatch, i.go); };

  return (
    <div className="sq">
      <div className="sq-in">
        <button className="sq-search" onClick={() => { play('click'); dispatch({ type: 'NAVIGATE', screen: 'search' }); }}><Icon name="compass" /> Find anything</button>

        <section className="sq-continue">
          {cont.art && <img className="art" src={cont.art} alt="" />}
          <p className="sq-eyebrow">Continue · {cont.where}</p>
          <h2>{cont.title}</h2>
          <span className="meta">{cont.meta}</span>
          <button className="sq-cta" onClick={() => { play('open'); cont.go(); }}>{cont.label} ▸</button>
        </section>

        {plan.length > 0 && (
          <section className="sq-today">
            <p className="sq-eyebrow k-next">Today · {minutes} min<span className="right" style={{ color: 'var(--mint)' }}>{done} of {plan.length} done{streak > 0 ? ` · 🔥 streak ${streak}` : ''}</span></p>
            {plan.map((p, i) => (
              <button key={p.id} className={`step ${p.done ? 'done' : i === current ? 'current' : ''}`} onClick={() => { play('click'); runPlan(p, dispatch); }}>
                <span className="ring">{p.done ? '✓' : ''}</span>
                <span className="main">{p.label}</span>
                <span className="end">{p.done ? 'done' : p.target > 1 ? `${p.progress}/${p.target}` : `${p.minutes} min`}</span>
              </button>
            ))}
          </section>
        )}

        <section className="sq-card sq-news">
          <p className="sq-eyebrow k-friends">Village news</p>
          <p>{news ?? 'The village is quiet. Light a lantern in the mines and the news board will have something to say.'}</p>
        </section>

        {recent.length > 0 && (
          <section>
            <p className="sq-eyebrow">Recent</p>
            <div className="sq-chips scroll">
              {recent.map((i) => <button key={i.id} className={`sq-chip kind sq-recent k-${i.kind}`} onClick={() => open(i)}><Icon name={i.icon} style={{ width: 14, height: 14 }} />{i.name}</button>)}
            </div>
          </section>
        )}

        <section>
          <button className="sq-village" style={{ backgroundImage: `url(${asset('/assets/environments/arithmetic-village.svg')})` }} onClick={() => { play('open'); dispatch({ type: 'TRAVEL', regionId: 'village' }); }} aria-label="Go to the village">
            <span><p className="sq-eyebrow k-quest">The village</p><span className="sq-sub" style={{ color: 'var(--text-2)' }}>Talk to the engineers · see what you have rebuilt</span></span>
          </button>
          <button className="sq-btn2 k-play" onClick={async () => { const r = await saveEngineCard(state); setShared(r === 'shared' ? 'Shared!' : r === 'downloaded' ? 'Saved!' : 'Could not save'); setTimeout(() => setShared(''), 2000); }}>
            <Icon name="scroll" style={{ width: 16, height: 16, verticalAlign: '-3px', marginRight: 6 }} />{shared || 'Share my Engine'}
          </button>
        </section>
      </div>
    </div>
  );
}
