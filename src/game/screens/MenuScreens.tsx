import { useState } from 'react';
import { useGame } from '../store';
import { STORY } from '../../content/story';
import { AVATARS, SPECIALIZATIONS } from '../../content/npcs';
import { Icon } from '../components/ui';
import type { Specialization } from '../../engine/types';
import { asset } from '../../assets';

export function MainMenu() {
  const { state, dispatch, importSave, play, profiles, switchProfile, newProfile, sync, linkProfile } = useGame();
  const [importing, setImporting] = useState(false);
  const [linking, setLinking] = useState(false);
  const [code, setCode] = useState('');
  const [linkError, setLinkError] = useState('');
  const doLink = async () => { setLinkError(''); const err = await linkProfile(code); if (err) setLinkError(err); else { setLinking(false); setCode(''); } };
  const list = [...profiles.profiles].sort((a, b) => b.lastPlayedAt - a.lastPlayedAt);
  const ago = (t: number) => { const h = Math.round((Date.now() - t) / 3_600_000); return h < 1 ? 'just now' : h < 48 ? `${h} h ago` : `${Math.round(h / 24)} days ago`; };
  const [raw, setRaw] = useState('');
  return (
    <div className="menu">
      <div className="inner">
        <img className="engine" src={asset('/assets/machines/mathematical-engine.svg')} alt="The dormant Mathematical Engine" />
        <h1 className="logo">ENGINEERING<br />QUEST</h1>
        <div className="tag">{STORY.tagline.toUpperCase()}</div>
        <div className="stack" style={{ maxWidth: 320, margin: '0 auto' }}>
          {list.length > 0 && <div className="who">Who's playing?</div>}
          {list.map((p) => (
            <button key={p.id} className={`profile-row ${p.id === profiles.active ? 'active' : ''}`} onClick={() => { play('open'); if (p.id === profiles.active && state.character) dispatch({ type: 'NAVIGATE', screen: 'home' }); else switchProfile(p.id); }}>
              {p.avatar ? <img src={p.avatar} alt="" /> : <span className="ph"><Icon name="helmet" /></span>}
              <span className="pr-body"><b>{p.name}</b><small>{p.id === profiles.active && !state.character ? 'New adventure' : `Level ${p.level} · ${ago(p.lastPlayedAt)}`}{p.sync ? ' · synced' : ''}</small></span>
              <span className="pr-go">{p.id === profiles.active && state.character ? 'Continue ▸' : 'Play ▸'}</span>
            </button>
          ))}
          <button className={`btn big block ${list.length ? '' : 'primary'}`} onClick={() => { play('open'); newProfile(); }}>{list.length ? '+ New profile' : 'New Game'}</button>
          {state.character && list.length > 0 && <p className="small muted">Switch, rename, reset or delete profiles in Settings. No passwords.</p>}
          <a className="btn ghost block" href={`${import.meta.env.BASE_URL}forex-quest/`}>Forex Quest · Currency expedition ↗</a>
          {sync.available && <button className="btn ghost block" onClick={() => { setLinking((v) => !v); setLinkError(''); }}>Link a player from another device</button>}
          {linking && (
            <form className="panel tight stack" style={{ textAlign: 'left' }} onSubmit={(e) => { e.preventDefault(); void doLink(); }}>
              <p className="small muted" style={{ margin: 0 }}>On the other device open Settings → Sync across devices and enter its code here.</p>
              <input className="text sync-input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="EQ4K-9TQ2-MHB7" autoCapitalize="characters" autoCorrect="off" spellCheck={false} maxLength={14} />
              {linkError && <p className="small" style={{ color: 'var(--amber)', margin: 0 }}>{linkError}</p>}
              <button type="submit" className="btn small primary" disabled={sync.busy || code.replace(/[^A-Za-z0-9]/g, '').length < 12}>{sync.busy ? 'Linking…' : 'Link player'}</button>
            </form>
          )}
          <button className="btn ghost block" onClick={() => setImporting((v) => !v)}>Import Save</button>
          {importing && (
            <div className="panel tight" style={{ textAlign: 'left' }}>
              <textarea value={raw} onChange={(e) => setRaw(e.target.value)} placeholder="Paste exported save JSON" style={{ width: '100%', height: 80, background: '#050912', color: 'var(--text)', border: '1px solid var(--line)', borderRadius: 6 }} />
              <button className="btn small primary" style={{ marginTop: 6 }} onClick={() => { if (importSave(raw)) { setImporting(false); dispatch({ type: 'NAVIGATE', screen: 'home' }); } else alert('That does not look like a valid save.'); }}>Load</button>
            </div>
          )}
        </div>
        <p className="muted small" style={{ marginTop: 22 }}>An RPG that takes you from multiplication facts to the mathematics of chemical, electrical and physics engineering.</p>
      </div>
    </div>
  );
}

export function IntroScreen() {
  const { dispatch, play } = useGame();
  const [i, setI] = useState(0);
  const lines = STORY.intro;
  return (
    <div className="menu" style={{ backgroundImage: 'url(/assets/environments/dragon-forge.svg)' }}>
      <div className="inner story">
        {lines.slice(0, i + 1).map((l, k) => <p key={k} style={{ animationDelay: `${k === i ? 0 : 0}s` }}>{l}</p>)}
        <div className="row" style={{ justifyContent: 'center', marginTop: 20 }}>
          {i + 1 < lines.length ? (
            <>
              <button className="btn primary big" onClick={() => { play('click'); setI(i + 1); }}>Continue ▸</button>
              <button className="btn ghost" onClick={() => dispatch({ type: 'SEEN_INTRO' })}>Skip</button>
            </>
          ) : (
            <button className="btn primary big" onClick={() => { play('open'); dispatch({ type: 'SEEN_INTRO' }); }}>Begin your apprenticeship</button>
          )}
        </div>
      </div>
    </div>
  );
}

export function CharacterCreation() {
  const { dispatch, play } = useGame();
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0].path);
  const [spec, setSpec] = useState<Specialization>('undecided');
  return (
    <div className="screen-scroll" style={{ background: 'url(/assets/environments/workshop-lab.svg) center / cover' }}>
      <div className="container" style={{ maxWidth: 760 }}>
        <div className="panel">
          <div className="panel-title"><Icon name="gear" className="lg brass" /><h2>Create your Apprentice</h2></div>
          <div className="stack">
            <label>
              <h4>Name</h4>
              <input className="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Apprentice name" maxLength={24} autoFocus />
            </label>
            <div>
              <h4>Avatar</h4>
              <div className="avatar-pick">
                {AVATARS.map((a) => <img key={a.id} src={a.path} alt={a.label} className={avatar === a.path ? 'on' : ''} onClick={() => { play('click'); setAvatar(a.path); }} />)}
              </div>
            </div>
            <div>
              <h4>Engineering specialization <span className="muted">(optional — never blocks mathematics)</span></h4>
              <div className="spec-pick">
                {SPECIALIZATIONS.map((s) => (
                  <button key={s.id} className={spec === s.id ? 'on' : ''} onClick={() => { play('click'); setSpec(s.id as Specialization); }}>
                    <div className="row"><Icon name={s.icon} /><b>{s.name}</b></div>
                    <div className="small muted">{s.blurb}</div>
                  </button>
                ))}
              </div>
            </div>
            <button className="btn primary big" onClick={() => { play('unlock'); dispatch({ type: 'CREATE_CHARACTER', name, avatar, specialization: spec }); }}>Enter Arithmetic Village</button>
          </div>
        </div>
      </div>
    </div>
  );
}
