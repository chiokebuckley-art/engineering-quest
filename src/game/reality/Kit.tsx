import { useState, type CSSProperties } from 'react';
import { asset } from '../../assets';
import { KIT01, componentByTile } from '../../engine/reality/kit01';
import type { KitComponent } from '../../engine/reality/types';
import type { KitMark } from '../../engine/reality/progress';
import { MISSIONS } from '../../engine/reality/missions';
import { useGame } from '../store';
import { labeled } from '../components/Labeled';

/** Show just one tile of the lid photo (a crop by background positioning). */
export function cropStyle(tile: string): CSSProperties {
  const [x0, y0, x1, y1] = KIT01.hotspots[tile];
  const w = x1 - x0; const h = y1 - y0;
  return {
    backgroundImage: `url("${asset(KIT01.image)}")`, backgroundRepeat: 'no-repeat',
    backgroundSize: `${100 / w}% ${100 / h}%`,
    backgroundPosition: `${(x0 / (1 - w)) * 100}% ${(y0 / (1 - h)) * 100}%`,
    aspectRatio: `${(w * KIT01.imageW) / (h * KIT01.imageH)}`,
  };
}

const ROLE_LABEL: Record<KitComponent['role'], string> = { controller: 'Controller', input: 'Input', output: 'Output', support: 'Support', power: 'Power', driver: 'Driver' };
const MARK_LABEL: Record<KitMark, string> = { missing: 'Missing from my kit', misidentified: 'Looks different from the picture', different: 'A different model' };

/**
 * The lid photo as the lab map. In "hunt" mode a wrong tap names what was tapped and the right tiles are
 * revealed on request; `reveal` outlines tiles after an answer.
 */
export function PhotoBench({ onPick, reveal = [], flash, hint }: { onPick: (c: KitComponent) => void; reveal?: string[]; flash?: { tile: string; ok: boolean } | null; hint?: string }) {
  const { state } = useGame();
  const [zoom, setZoom] = useState(1);
  const [list, setList] = useState(false);
  const marks = state.reality.kit;
  return (
    <div className="rl-bench">
      <div className="rl-bench-bar">
        <span className="small muted">{hint ?? 'Tap any tile to open its card.'}</span>
        <span className="rl-bench-tools">
          <button className="rl-chip" onClick={() => setList((l) => !l)} aria-pressed={list}>{list ? '🖼 Photo' : '☰ List'}</button>
          {!list && <><button className="rl-chip" disabled={zoom <= 1} onClick={() => setZoom((z) => Math.max(1, z - 0.6))} aria-label="Zoom out">−</button><button className="rl-chip" disabled={zoom >= 2.8} onClick={() => setZoom((z) => Math.min(2.8, z + 0.6))} aria-label="Zoom in">＋</button></>}
        </span>
      </div>
      {list ? (
        <div className="rl-kit-list">
          {KIT01.components.map((c) => (
            <button key={c.id} className={`rl-kit-item ${reveal.includes(c.id) ? 'reveal' : ''} ${flash?.tile === c.tile ? (flash.ok ? 'ok' : 'bad') : ''}`} onClick={() => onPick(c)}>
              <span className="rl-crop" style={cropStyle(c.tile)} aria-hidden="true" />
              <span><b>{c.name}</b><small>{c.tile} · {ROLE_LABEL[c.role]}{marks[c.id] ? ` · ${MARK_LABEL[marks[c.id].status]}` : ''}</small></span>
            </button>
          ))}
        </div>
      ) : (
        <div className="rl-photo-scroll">
          <div className="rl-photo" style={{ width: `${zoom * 100}%` }}>
            <img src={asset(KIT01.image)} alt={KIT01.imageAlt} draggable={false} />
            {KIT01.components.map((c) => {
              const [x0, y0, x1, y1] = KIT01.hotspots[c.tile];
              return (
                <button key={c.id} className={`rl-hot ${reveal.includes(c.id) ? 'reveal' : ''} ${flash?.tile === c.tile ? (flash.ok ? 'ok' : 'bad') : ''} ${marks[c.id] ? 'marked' : ''}`}
                  style={{ left: `${x0 * 100}%`, top: `${y0 * 100}%`, width: `${(x1 - x0) * 100}%`, height: `${(y1 - y0) * 100}%` }}
                  onClick={() => onPick(c)} aria-label={`${c.tile}: ${c.printed}`} title={c.printed} />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/** Input → principle → output, animated. */
export function IoStrip({ c }: { c: KitComponent }) {
  return (
    <div className="rl-io" aria-label={`${c.io.input}, then ${c.io.change}, then ${c.io.output}`}>
      <div className="rl-io-box in"><small>IN</small>{c.io.input}</div>
      <div className="rl-io-arrow" aria-hidden="true"><i /></div>
      <div className="rl-io-box mid"><small>INSIDE</small>{c.io.change}</div>
      <div className="rl-io-arrow" aria-hidden="true"><i /></div>
      <div className="rl-io-box out"><small>OUT</small>{c.io.output}</div>
    </div>
  );
}

export function ComponentCard({ c, onClose, onMission }: { c: KitComponent; onClose: () => void; onMission?: (id: string) => void }) {
  const { state, dispatch } = useGame();
  const mark = state.reality.kit[c.id];
  const [marking, setMarking] = useState(false);
  const m = state.reality.components[c.id] ?? {};
  return (
    <div className="rl-card" role="dialog" aria-label={c.name}>
      <div className="rl-card-head">
        <span className="rl-crop big" style={cropStyle(c.tile)} role="img" aria-label={`Photo tile ${c.tile}: ${c.printed}`} />
        <div>
          <div className="small muted">{c.tile} · printed “{c.printed}”</div>
          <h3>{c.name}</h3>
          <div className="rl-tags"><span className={`rl-tag role-${c.role}`}>{ROLE_LABEL[c.role]}</span><span className="rl-tag">×{c.count}</span><span className="rl-tag review" title="The printed lid label confirms the name; check the real part before a build.">label-confirmed</span>{c.simulated && <span className="rl-tag sim">on the bench</span>}{c.later && <span className="rl-tag">later pack</span>}</div>
        </div>
        <button className="rl-chip" onClick={onClose} aria-label="Close card">✕</button>
      </div>
      <p className="rl-what">{c.what}</p>
      <IoStrip c={c} />
      <p>{labeled(c.principle)}</p>
      {c.aliases.length > 0 && <p className="small muted">Also called: {c.aliases.join(', ')}</p>}
      {c.pins.length > 0 && <div className="rl-pins">{c.pins.map((p) => <span key={p} className="rl-tag">{p}</span>)}</div>}
      <div className="rl-safety">⚠ {c.safety}</div>
      <div className="small"><b>Used in:</b> {c.uses.join(' · ')}</div>
      {c.missions.length > 0 && <div className="rl-card-missions">{c.missions.map((id) => { const mm = MISSIONS.find((x) => x.id === id); return mm ? <button key={id} className="rl-chip" onClick={() => onMission?.(id)}>{mm.id === 'boss' ? '★' : `M${String(mm.n).padStart(2, '0')}`} {mm.title}</button> : null; })}</div>}
      <div className="small muted">Your checks: {(['recognize', 'explain', 'apply'] as const).map((k) => `${k} ${m[k]?.ok ? '✓' : '·'}`).join('  ')}</div>
      <div className="rl-card-foot">
        {mark ? <span className="small">Marked: <b>{MARK_LABEL[mark.status]}</b>{mark.note ? ` (${mark.note})` : ''} <button className="rl-chip" onClick={() => dispatch({ type: 'REALITY_KIT', component: c.id, status: null })}>Undo</button></span>
          : marking ? <span className="rl-mark">{(Object.keys(MARK_LABEL) as KitMark[]).map((k) => <button key={k} className="rl-chip" onClick={() => { dispatch({ type: 'REALITY_KIT', component: c.id, status: k }); setMarking(false); }}>{MARK_LABEL[k]}</button>)}<button className="rl-chip" onClick={() => setMarking(false)}>Cancel</button></span>
          : <button className="rl-chip" onClick={() => setMarking(true)}>Doesn’t match my kit?</button>}
      </div>
    </div>
  );
}

export { componentByTile };
