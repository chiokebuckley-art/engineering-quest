import { useGame } from '../store';
import { factLabel } from '../../engine/curriculum/facts';
import { effectiveMastery } from '../../engine/mastery/MasteryEngine';
import { Icon } from '../components/ui';
import { asset } from '../../assets';

export function DungeonScreen() {
  const { state, dispatch, play } = useGame();
  const d = state.dungeon;
  return (
    <div className="scene" style={{ backgroundImage: 'url(/assets/environments/forgotten-dungeon.svg)' }}>
      <div className="scene-header">
        <div className="loc"><h2>Dungeon of Forgotten Knowledge</h2><p>Specters built from your own missed and overdue facts. Defeat each one to strengthen it.</p></div>
        <span className="spacer" />
        <button className="btn small ghost" onClick={() => dispatch({ type: 'DUNGEON_EXIT' })}>Leave</button>
      </div>
      <div className="scene-body">
        {!d && <div className="panel"><p>The crypt is quiet.</p><button className="btn" onClick={() => dispatch({ type: 'DUNGEON_EXIT' })}>Return to the village</button></div>}
        {d && (
          <div className="stack">
            {d.status === 'cleared' && (
              <div className="panel center">
                <h1 className="brass">CRYPT CLEARED</h1>
                <p>{d.defeated} specters dissolved into knowledge. Those facts are stronger now — they will return on schedule for cumulative review.</p>
                <button className="btn primary big" onClick={() => { play('quest'); dispatch({ type: 'DUNGEON_EXIT' }); }}>Return to the village</button>
              </div>
            )}
            <div className="depth-list">
              {d.facts.map((f, i) => {
                const m = effectiveMastery(state.mastery[f]);
                const done = i < d.index;
                const cur = i === d.index && d.status === 'active';
                return (
                  <button key={f} className={`depth ${done ? 'cleared' : ''} ${!cur && !done ? 'locked' : ''}`} disabled={!cur} onClick={() => { play('open'); dispatch({ type: 'START_BATTLE', enemyId: 'forgotten-specter', regionId: 'forgotten', factId: f }); }}>
                    <img src={asset('/assets/enemies/forgotten-specter.svg')} alt="" style={{ filter: done ? 'grayscale(1) brightness(0.5)' : undefined }} />
                    <div>
                      <div className="dn">{done ? '✓ ' : ''}Specter of {factLabel(f)}</div>
                      <div className="ds">mastery {m}% · {state.mastery[f]?.srs.lapses ?? 0} lapses</div>
                      {cur && <div className="ds brass">Fight <Icon name="sword" /></div>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
