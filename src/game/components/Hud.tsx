import { useGame } from '../store';
import { Bar, Icon } from './ui';
import { levelFromXp } from '../../engine/progression/xp';
import type { Screen } from '../../engine/state/types';
import { dueItems } from '../../engine/srs/SpacedRepetitionEngine';
import { dueEntries } from '../../engine/notebook/notebook';
import { useUpdateCheck } from '../hooks/useUpdateCheck';
import { TABS, tabFor } from '../nav';

export function Hud() {
  const { state, dispatch, flushSave, play } = useGame();
  const upd = useUpdateCheck();
  const c = state.character;
  if (!c) return null;
  const lv = levelFromXp(c.xp);
  const doReload = () => { play('click'); flushSave(); setTimeout(upd.reload, 150); };
  return (
    <>
    {upd.available && (
      <button className="update-banner" onClick={doReload}>
        <span>✨ A new version of Engineering Quest is ready.</span><b>Tap to update</b>
      </button>
    )}
    <header className="hud">
      <button className="hud-profile" onClick={() => { play('click'); dispatch({ type: 'NAVIGATE', screen: 'me' }); }} title="Me: progress, notebook and settings" aria-label="Me">
        <img className="avatar" src={c.avatar} alt="" />
        <div>
          <div className="name">{c.name}</div>
          <div className="title">{c.title}</div>
        </div>
      </button>
      <div className="lvl" title="Level">L{c.level}</div>
      <div className="stat"><Bar value={c.hp} max={c.maxHp} kind="hp" label="HP" right={`${c.hp}/${c.maxHp}`} thin /></div>
      <div className="stat"><Bar value={c.energy} max={c.maxEnergy} kind="energy" label="Energy" right={`${c.energy}/${c.maxEnergy}`} thin /></div>
      <div className="stat xp"><Bar value={lv.into} max={lv.needed} kind="xp" label="XP" right={`${lv.into}/${lv.needed}`} thin /></div>
      <span className="spacer" />
      <button className={`hud-btn refresh ${upd.available ? 'has-update' : ''}`} onClick={doReload} title={upd.available ? 'Update available — reload' : 'Reload the app'} aria-label="Refresh">
        <span className="refresh-glyph">↻</span>{upd.available && <span className="badge static">Update</span>}
      </button>
      <button className="hud-btn hud-search" onClick={() => { play('click'); dispatch({ type: 'NAVIGATE', screen: 'search' }); }} title="Find anything" aria-label="Find anything"><Icon name="compass" /><span className="lbl">Find</span></button>
    </header>
    </>
  );
}

export function Nav() {
  const { state, dispatch, play } = useGame();
  const active = Object.values(state.quests).filter((q) => q.status === 'available').length;
  const due = dueItems(state.mastery).length;
  const fix = dueEntries(state.notebook ?? []).length;
  const here = tabFor(state.screen);
  const go = (screen: Screen) => { play('click'); dispatch({ type: 'NAVIGATE', screen }); };
  return (
    <nav className="nav" aria-label="Game navigation">
      {TABS.map((t) => (
        <button key={t.tab} className={here === t.tab ? 'active' : ''} aria-current={here === t.tab ? 'page' : undefined} onClick={() => go(t.screen)}>
          <Icon name={t.icon} />
          {t.label}
          {t.tab === 'quest' && active > 0 && <span className="badge">{active}</span>}
          {t.tab === 'me' && fix + due > 0 && <span className="badge">{fix + due}</span>}
        </button>
      ))}
    </nav>
  );
}
