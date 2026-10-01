import { useState } from 'react';
import { useGame } from '../store';
import { Bar, Icon } from './ui';
import { levelFromXp } from '../../engine/progression/xp';
import type { Screen } from '../../engine/state/types';
import { dueItems } from '../../engine/srs/SpacedRepetitionEngine';
import { dueEntries } from '../../engine/notebook/notebook';
import { useUpdateCheck } from '../hooks/useUpdateCheck';

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
      <button className="hud-profile" onClick={() => { play('click'); dispatch({ type: 'NAVIGATE', screen: 'settings' }); }} title="Profiles and settings" aria-label="Profiles">
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
      <button className="hud-btn" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'settings' })} title="Settings"><Icon name="settings" /><span className="lbl">Settings</span></button>
    </header>
    </>
  );
}

const NAV: { screen: Screen; label: string; icon: string }[] = [
  { screen: 'region', label: 'Play', icon: 'sword' },
  { screen: 'arcade', label: 'Arcade', icon: 'hourglass' },
  { screen: 'lessons', label: 'Learn', icon: 'scroll' },
  { screen: 'reality', label: 'Lab', icon: 'circuit' },
];
const MORE: { screen: Screen; label: string; icon: string; sub: string }[] = [
  { screen: 'map', label: 'World Map', icon: 'map', sub: 'Regions, routes and the road to the Core' },
  { screen: 'rocket', label: 'Rocket Game', icon: 'energy', sub: 'Steer to the answer. Earth to the Moon.' },
  { screen: 'millionaire', label: 'Math Millionaire', icon: 'coins', sub: 'Pick the setup for the word problem. Climb to $1,000,000.' },
  { screen: 'stud', label: 'Stud Math', icon: 'chest', sub: 'Mississippi Stud with gear tokens: odds, raises and payouts.' },
  { screen: 'plaza', label: 'Equation Plaza', icon: 'abacus', sub: 'Build connected equations. Solo, computer, or friends. Pick your math.' },
  { screen: 'tycoon', label: 'Engine City Tycoon', icon: 'factory', sub: 'Board game: buy streets with maths, work out rent, build workshops.' },
  { screen: 'gear', label: 'Weakest Gear', icon: 'cog', sub: 'Studio quiz vs friends and computer players. Bank, vote, survive.' },
  { screen: 'academy', label: 'The Academies', icon: 'reactor', sub: 'Ten academies from counting to differential equations, each opening the next' },
  { screen: 'mental', label: 'Mental Math Academy', icon: 'brain', sub: 'Do it in your head: ten worlds from place value to 125 × 24' },
  { screen: 'contest', label: 'Contest Path', icon: 'medal', sub: 'Calm contest-style picture puzzles for Grades 1, 3 and 5, with a plan for grown-ups' },
  { screen: 'notebook', label: 'Notebook', icon: 'book', sub: 'Your mistakes, until you fix them three times' },
  { screen: 'workshop', label: 'Model Workshop', icon: 'telescope', sub: 'Build your own probability of an outcome: factors, Elo, simulation, EV and Kelly' },
  { screen: 'quests', label: 'Quests', icon: 'quest', sub: 'Your quest log' },
  { screen: 'skilltree', label: 'Skills', icon: 'skill-tree', sub: 'Mastery of every table and fact' },
  { screen: 'dashboard', label: 'Stats', icon: 'dashboard', sub: 'Daily training, streaks, weak spots' },
  { screen: 'inventory', label: 'Items', icon: 'backpack', sub: 'Gear and loot' },
  { screen: 'lab', label: 'Projects', icon: 'lab', sub: 'Lab stations and construction projects' },
  { screen: 'drill', label: 'Training', icon: 'target', sub: 'Drills and diagnostics' },
  { screen: 'achievements', label: 'Trophies', icon: 'trophy', sub: 'Achievements' },
  { screen: 'settings', label: 'Settings', icon: 'settings', sub: 'Sound, save, reset' },
];

export function Nav() {
  const { state, dispatch, play } = useGame();
  const [more, setMore] = useState(false);
  const active = Object.values(state.quests).filter((q) => q.status === 'available').length;
  const due = dueItems(state.mastery).length;
  const fix = dueEntries(state.notebook ?? []).length;
  const moreActive = MORE.some((m) => m.screen === state.screen);
  const go = (screen: Screen) => { play('click'); setMore(false); dispatch({ type: 'NAVIGATE', screen }); };
  return (
    <>
      {more && (
        <div className="more-overlay" onClick={() => setMore(false)}>
          <div className="more-sheet" onClick={(e) => e.stopPropagation()}>
            {MORE.map((m) => (
              <button key={m.screen} className="more-item" onClick={() => go(m.screen)}>
                <Icon name={m.icon} className="lg" />
                <span><b>{m.label}</b><small>{m.sub}</small></span>
                {m.screen === 'dashboard' && due > 0 && <span className="badge static">{due} due</span>}
                {m.screen === 'notebook' && fix > 0 && <span className="badge static">{fix} to fix</span>}
              </button>
            ))}
          </div>
        </div>
      )}
      <nav className="nav" aria-label="Game navigation">
        {NAV.map((n) => (
          <button key={n.screen} className={state.screen === n.screen && !more ? 'active' : ''} onClick={() => go(n.screen)}>
            <Icon name={n.icon} />
            {n.label}
            {n.screen === 'region' && active > 0 && <span className="badge">{active}</span>}
          </button>
        ))}
        <button className={moreActive || more ? 'active' : ''} onClick={() => { play('click'); setMore((v) => !v); }}>
          <Icon name="gear" />
          More
          {due + fix > 0 && !moreActive && <span className="badge">{due + fix}</span>}
        </button>
      </nav>
    </>
  );
}

