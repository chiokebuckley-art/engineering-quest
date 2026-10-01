import { useState } from 'react';
import { useGame } from '../store';
import { Icon, Panel } from '../components/ui';
import { Sound } from '../../engine/sound/SoundEngine';
import { useUpdateCheck } from '../hooks/useUpdateCheck';
import { formatCode, ago } from '../../engine/save/sync';

export function SettingsScreen() {
  const { state, dispatch, exportSave, flushSave, profiles, switchProfile, newProfile, resetProfile, deleteProfile, renameProfile, play, sync, turnOnSync, turnOffSync, syncNow } = useGame();
  const me = profiles.profiles.find((p) => p.id === profiles.active);
  const [codeCopied, setCodeCopied] = useState(false);
  const copyCode = async (code: string) => { try { await navigator.clipboard.writeText(formatCode(code)); setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000); } catch { prompt('Your sync code:', formatCode(code)); } };
  const [renaming, setRenaming] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const upd = useUpdateCheck();
  const [copied, setCopied] = useState(false);
  const [checkMsg, setCheckMsg] = useState('');
  const checkNow = async () => {
    setCheckMsg('Checking…');
    const info = await upd.check();
    if (!info) setCheckMsg(upd.current.builtAt ? 'Could not reach the server. Try again later.' : 'Update checks run only in the deployed app.');
    else if (info.builtAt !== upd.current.builtAt) setCheckMsg(`New version ${info.version} is available.`);
    else setCheckMsg('You have the latest version.');
  };
  const s = state.settings;
  const doExport = async () => {
    const raw = exportSave();
    try { await navigator.clipboard.writeText(raw); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { prompt('Copy your save data:', raw); }
  };
  return (
    <div className="screen-scroll">
      <div className="container stack" style={{ maxWidth: 640 }}>
        <Panel title="Profiles" icon="helmet" right={<button className="btn small ghost" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'region' })}>Back</button>}>
          <p className="small muted">Everyone on this phone gets their own profile with their own progress. Switching is one tap, no passwords. Reset wipes a profile's progress but keeps the slot.</p>
          <div className="stack">
            {profiles.profiles.map((p) => (
              <div key={p.id} className={`profile-card ${p.id === profiles.active ? 'active' : ''}`}>
                {p.avatar ? <img src={p.avatar} alt="" /> : <span className="ph"><Icon name="helmet" /></span>}
                <div className="pr-body">
                  {renaming === p.id ? (
                    <form className="row" onSubmit={(e) => { e.preventDefault(); renameProfile(p.id, newName); setRenaming(null); }}>
                      <input className="text" value={newName} maxLength={16} onChange={(e) => setNewName(e.target.value)} autoFocus />
                      <button type="submit" className="btn small primary">Save</button>
                      <button type="button" className="btn small ghost" onClick={() => setRenaming(null)}>Cancel</button>
                    </form>
                  ) : <><b>{p.name}{p.id === profiles.active ? ' (playing now)' : ''}</b><small>Level {p.level}</small></>}
                </div>
                <div className="row wrap pr-actions">
                  {p.id !== profiles.active && <button className="btn small primary" onClick={() => { play('open'); switchProfile(p.id); }}>Switch</button>}
                  <button className="btn small ghost" onClick={() => { setRenaming(p.id); setNewName(p.name); }}>Rename</button>
                  <button className="btn small ghost" onClick={() => { if (confirm(`Reset ${p.name}'s progress back to the start? The profile stays.`)) { play('wrong'); resetProfile(p.id); } }}>Reset</button>
                  <button className="btn small danger" onClick={() => { if (confirm(`Delete the profile ${p.name} and all its progress?`)) { play('wrong'); deleteProfile(p.id); } }}>Delete</button>
                </div>
              </div>
            ))}
            <button className="btn" onClick={() => { play('open'); newProfile(); }}>+ New profile</button>
          </div>
        </Panel>
        <Panel title="Settings" icon="settings">
          <div className="list-row"><span><Icon name={s.sound ? 'sound-on' : 'sound-off'} /> Sound effects</span><button className={`btn small ${s.sound ? 'primary' : 'ghost'}`} onClick={() => { dispatch({ type: 'SET_SETTINGS', settings: { sound: !s.sound } }); if (!s.sound) { Sound.setMuted(false); Sound.play('click'); } }}>{s.sound ? 'On' : 'Off'}</button></div>
          <div className="list-row"><span>Volume</span><input type="range" min={0} max={1} step={0.05} value={s.volume} onChange={(e) => dispatch({ type: 'SET_SETTINGS', settings: { volume: Number(e.target.value) } })} /></div>
          <div className="list-row"><span>Show response timer</span><button className={`btn small ${s.showTimer ? 'primary' : 'ghost'}`} onClick={() => dispatch({ type: 'SET_SETTINGS', settings: { showTimer: !s.showTimer } })}>{s.showTimer ? 'On' : 'Off'}</button></div>
          <div className="list-row"><span>Reduced motion</span><button className={`btn small ${s.reducedMotion ? 'primary' : 'ghost'}`} onClick={() => dispatch({ type: 'SET_SETTINGS', settings: { reducedMotion: !s.reducedMotion } })}>{s.reducedMotion ? 'On' : 'Off'}</button></div>
        </Panel>
        <Panel title="Sync across devices" icon="cloud-sync">
          {!sync.available ? <p className="small muted">Sync is switched off in this copy of the game.</p> : sync.link ? (
            <div className="stack">
              <p className="small muted">{me?.name ?? 'This player'} syncs with the cloud. Enter this code on another phone or tablet (main menu → <b>Link a player from another device</b>) and the same progress follows.</p>
              <div className="sync-code" onClick={() => copyCode(sync.link!.code)} title="Tap to copy">{formatCode(sync.link.code)}</div>
              <div className="row wrap">
                <button className="btn small" onClick={() => copyCode(sync.link!.code)}>{codeCopied ? 'Copied!' : 'Copy code'}</button>
                <button className="btn small" disabled={sync.busy} onClick={() => { play('open'); void syncNow(); }}>{sync.busy ? 'Syncing…' : 'Sync now'}</button>
                <button className="btn small ghost" onClick={() => { if (confirm('Stop syncing this player on this device? The cloud copy stays, and other devices keep syncing.')) turnOffSync(); }}>Turn off</button>
              </div>
              <p className="small muted">Last synced {sync.link.at ? ago(Date.now() - sync.link.at) : 'never'}. Keep the code private: anyone who has it can load this player.{sync.note ? ` · ${sync.note}` : ''}</p>
            </div>
          ) : (
            <div className="stack">
              <p className="small muted">Play the same profile on several phones and tablets. Turn it on here, then enter the code it gives you on each other device. Every device pulls when the game opens and pushes as you play; the newest save always wins.</p>
              <button className="btn primary" disabled={sync.busy || !state.character} onClick={() => { play('open'); void turnOnSync(); }}>{sync.busy ? 'Connecting…' : `Turn on sync for ${me?.name ?? 'this player'}`}</button>
              {sync.note && <p className="small muted">{sync.note}</p>}
            </div>
          )}
        </Panel>
        <Panel title="Save Data" icon="chest">
          <p className="small muted">This profile's progress saves automatically to this browser. Export to move it to another device or keep a backup; import from the main menu.</p>
          <div className="row wrap">
            <button className="btn" onClick={doExport}><Icon name="scroll" /> {copied ? 'Copied!' : 'Export save to clipboard'}</button>
            <button className="btn ghost" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'menu' })}>Main menu</button>

          </div>
        </Panel>
        <Panel title="Updates" icon="repair">
          <div className="list-row"><span>Installed version</span><b>{upd.current.version}{upd.current.builtAt ? ` · built ${new Date(upd.current.builtAt).toLocaleString()}` : ' (dev)'}</b></div>
          <p className="small muted">The app checks for a new version when it opens and every few minutes. If you added it to your home screen, tap ↻ in the top bar (or the button below) to load the newest version. Your progress is saved first.</p>
          <div className="row wrap">
            <button className="btn" onClick={checkNow} disabled={upd.checking}>Check for updates</button>
            <button className={`btn ${upd.available ? 'primary' : 'ghost'}`} onClick={() => { flushSave(); setTimeout(upd.reload, 150); }}>↻ {upd.available ? 'Update now' : 'Reload app'}</button>
            {checkMsg && <span className="small muted">{checkMsg}</span>}
          </div>
        </Panel>
        <Panel title="About" icon="book">
          <p className="small muted">Engineering Quest — Version 1 vertical slice: Arithmetic Village, Multiplication Mines, the Dragon's Forge, the Division Dungeon and the Dungeon of Forgotten Knowledge. Character, mastery and world data are designed to carry through every later world.</p>
          <p className="small muted">Icons: game-icons.net (CC BY 3.0). Characters, enemies, environments: original artwork (CC0). Fonts: Orbitron, Exo 2 (OFL). See ASSET_LICENSES.md.</p>
        </Panel>
      </div>
    </div>
  );
}
