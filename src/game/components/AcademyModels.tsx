/**
 * Hands-on models for the Arithmetic Academy. Each one lets the player build, shade, fill or place
 * something and turns the build into an answer string for ACADEMY_ANSWER. The same components run
 * in "teach" mode (no submit) so a chapter can show the model before asking.
 */
import { useEffect, useState } from 'react';
import { labeled } from './Labeled';
import { lab, labn } from '../../engine/label';
import type { ModelSpec, AskStep } from '../../engine/academy/types';
import { MathVisual } from './MathVisual';
import { Icon } from './ui';
import { useGame } from '../store';
import { PlotCanvas, UnitCircleCanvas, radLabel, unitCoords } from './AcademyVisuals';
import { evalFn, riemann } from '../../engine/academy/fn';

interface ModelProps { model: ModelSpec; onSubmit?: (given: string) => void; disabled?: boolean; resetKey?: string; ask?: string }

export function AcademyModel(p: ModelProps) {
  switch (p.model.kind) {
    case 'counters': return <Counters {...p} model={p.model} />;
    case 'placevalue': return <PlaceValue {...p} model={p.model} />;
    case 'numberline': return <NumberLine {...p} model={p.model} />;
    case 'array': return <ArrayBuild {...p} model={p.model} />;
    case 'fracbar': return <FracBar {...p} model={p.model} />;
    case 'ratiotable': return <RatioTable {...p} model={p.model} />;
    case 'percent': return <PercentDial {...p} model={p.model} />;
    case 'power': return <PowerTower {...p} model={p.model} />;
    case 'root': return <RootPanel {...p} model={p.model} />;
    case 'balance': return <Balance {...p} model={p.model} />;
    case 'plot': return <PlotPick {...p} model={p.model} />;
    case 'angle': return <AngleDial {...p} model={p.model} />;
    case 'unitcircle': return <UnitCirclePick {...p} model={p.model} />;
    case 'table': return <TableModel {...p} model={p.model} />;
    case 'slider': return <SliderModel {...p} model={p.model} />;
    case 'riemann': return <RiemannAid model={p.model} />;
    case 'secant': return <SecantAid model={p.model} />;
    default: return null;
  }
}

function LockIn({ label, value, onSubmit, disabled }: { label: string; value: string; onSubmit?: (v: string) => void; disabled?: boolean }) {
  if (!onSubmit) return null;
  return <button className="btn primary big-answer model-lock" disabled={disabled || !value} onClick={() => onSubmit(value)}><Icon name="energy" /> {label}</button>;
}

/* ---------- counters: one tap, one object ---------- */
function Counters({ model, onSubmit, disabled, resetKey }: ModelProps & { model: Extract<ModelSpec, { kind: 'counters' }> }) {
  const { play } = useGame();
  const [tapped, setTapped] = useState<boolean[]>(() => Array(model.items).fill(false));
  useEffect(() => { setTapped(Array(model.items).fill(false)); }, [model.items, resetKey]);
  const count = tapped.filter(Boolean).length;
  return (
    <div className="model">
      <div className="counter-pile" role="group" aria-label={`${model.items} ${model.label}`}>
        {tapped.map((on, i) => (
          <button key={i} className={`counter ${on ? 'on' : ''}`} disabled={disabled} aria-pressed={on} aria-label={`${model.label.replace(/s$/, '')} ${i + 1}`} onClick={() => { play('tick'); setTapped((t) => t.map((v, j) => (j === i ? !v : v))); }}>
            <span className="counter-gem" />{on && <b>{tapped.slice(0, i + 1).filter(Boolean).length}</b>}
          </button>
        ))}
      </div>
      <div className="model-readout">Counted: <b>{count}</b></div>
      <LockIn label={`That's ${count}`} value={count ? String(count) : ''} onSubmit={onSubmit} disabled={disabled} />
    </div>
  );
}

/* ---------- place value: tens and ones plates ---------- */
function PlaceValue({ model, onSubmit, disabled, resetKey }: ModelProps & { model: Extract<ModelSpec, { kind: 'placevalue' }> }) {
  const { play } = useGame();
  const [tens, setTens] = useState(0); const [ones, setOnes] = useState(0);
  useEffect(() => { setTens(0); setOnes(0); }, [model.target, resetKey]);
  const value = tens * 10 + ones;
  return (
    <div className="model">
      <div className="pv-build">
        <div className="pv-col">
          <div className="pv-label">TENS</div>
          <div className="pv-plates">{Array.from({ length: tens }, (_, i) => <span key={i} className="pv-ten" />)}</div>
          <div className="row"><button className="btn small" disabled={disabled || tens >= 9} onClick={() => { play('tick'); setTens((t) => t + 1); }}>+10</button><button className="btn small ghost" disabled={disabled || !tens} onClick={() => setTens((t) => t - 1)}>−</button></div>
        </div>
        <div className="pv-col">
          <div className="pv-label">ONES</div>
          <div className="pv-plates ones">{Array.from({ length: ones }, (_, i) => <span key={i} className="pv-one" />)}</div>
          <div className="row"><button className="btn small" disabled={disabled || ones >= 9} onClick={() => { play('tick'); setOnes((o) => o + 1); }}>+1</button><button className="btn small ghost" disabled={disabled || !ones} onClick={() => setOnes((o) => o - 1)}>−</button></div>
        </div>
      </div>
      <div className="model-readout">{tens} tens + {ones} ones = <b>{value}</b></div>
      <LockIn label={`Seat ${value}`} value={value ? String(value) : ''} onSubmit={onSubmit} disabled={disabled} />
    </div>
  );
}

/* ---------- number line: tap where you land ---------- */
function NumberLine({ model, onSubmit, disabled, resetKey }: ModelProps & { model: Extract<ModelSpec, { kind: 'numberline' }> }) {
  const { play } = useGame();
  const [landed, setLanded] = useState<number | null>(null);
  useEffect(() => { setLanded(null); }, [model.start, model.label, resetKey]);
  const sign = (n: number) => (n < 0 ? `−${-n}` : String(n));
  const max = Math.max(model.max, 10); const min = model.min ?? 0;
  const lo = landed === null ? model.start : Math.min(model.start, landed); const hi = landed === null ? model.start : Math.max(model.start, landed);
  return (
    <div className="model">
      <div className="model-ask small muted">{labeled(model.label)}</div>
      <div className="rail" role="group" aria-label="number line">
        {Array.from({ length: max - min + 1 }, (_, i) => i + min).map((n) => (
          <button key={n} className={`rail-tick ${n === model.start ? 'start' : ''} ${landed === n ? 'landed' : ''} ${n > lo && n < hi ? 'hop' : ''}`} disabled={disabled} aria-label={`${n}`} onClick={() => { play('tick'); setLanded(n); }}><i />{sign(n)}</button>
        ))}
      </div>
      <div className="model-readout">Start <b>{sign(model.start)}</b>{landed !== null && <> → land on <b>{sign(landed)}</b> ({Math.abs(landed - model.start)} hops {landed >= model.start ? 'right' : 'left'})</>}</div>
      <LockIn label={landed === null ? 'Tap the rail' : `Land on ${sign(landed)}`} value={landed === null ? '' : String(landed)} onSubmit={onSubmit} disabled={disabled} />
    </div>
  );
}

/* ---------- array: tap the corner cell ---------- */
function ArrayBuild({ model, onSubmit, disabled, resetKey }: ModelProps & { model: Extract<ModelSpec, { kind: 'array' }> }) {
  const { play } = useGame();
  const [cell, setCell] = useState<[number, number] | null>(null);
  useEffect(() => { setCell(null); }, [model.rows, model.cols, resetKey]);
  const size = Math.max(5, Math.min(12, Math.max(model.rows, model.cols) + 1));
  const [r, c] = cell ?? [0, 0];
  return (
    <div className="model">
      <div className="array-build" style={{ gridTemplateColumns: `repeat(${size}, 1fr)`, maxWidth: Math.max(300, size * 36) }} role="grid" aria-label="array grid">
        {Array.from({ length: size * size }, (_, i) => {
          const rr = Math.floor(i / size) + 1; const cc = (i % size) + 1;
          return <button key={i} className={`ab-cell ${rr <= r && cc <= c ? 'on' : ''}`} disabled={disabled} aria-label={`${rr} rows by ${cc} columns`} onClick={() => { play('tick'); setCell([rr, cc]); }} />;
        })}
      </div>
      <div className="model-readout">{cell ? <>{r} {r === 1 ? 'row' : 'rows'} of {c} = <b>{r * c}</b></> : 'Tap the bottom-right corner of your array.'}</div>
      <LockIn label={cell ? `Build ${r} × ${c}` : 'Build it'} value={cell ? `${r}x${c}` : ''} onSubmit={onSubmit} disabled={disabled} />
    </div>
  );
}

/* ---------- fraction bar: light the planks ---------- */
function FracBar({ model, onSubmit, disabled, resetKey }: ModelProps & { model: Extract<ModelSpec, { kind: 'fracbar' }> }) {
  const { play } = useGame();
  const [lit, setLit] = useState<boolean[]>(() => Array(model.pieces).fill(false));
  useEffect(() => { setLit(Array(model.pieces).fill(false)); }, [model.pieces, resetKey]);
  const n = lit.filter(Boolean).length;
  return (
    <div className="model">
      <div className="model-ask small muted">{labeled(`One whole ${model.label}, cut into ${lab(model.pieces, 'equal pieces')}.`)}</div>
      <div className="plank-bar" role="group" aria-label={`${model.pieces} equal pieces`}>
        {lit.map((on, i) => <button key={i} className={`plank ${on ? 'lit' : ''}`} disabled={disabled} aria-pressed={on} aria-label={`piece ${i + 1}`} onClick={() => { play('tick'); setLit((l) => l.map((v, j) => (j === i ? !v : v))); }} />)}
      </div>
      <div className="model-readout">Lit: <b>{n}/{model.pieces}</b></div>
      <LockIn label={`Light ${n}/${model.pieces}`} value={n ? `${n}/${model.pieces}` : ''} onSubmit={onSubmit} disabled={disabled} />
    </div>
  );
}

/* ---------- ratio table: fill the blank cells ---------- */
function RatioTable({ model, onSubmit, disabled, resetKey }: ModelProps & { model: Extract<ModelSpec, { kind: 'ratiotable' }> }) {
  const blanks = model.rows.flatMap((row, ri) => row.map((v, ci) => (v === null ? `${ri}-${ci}` : null)).filter(Boolean) as string[]);
  const [vals, setVals] = useState<Record<string, string>>({});
  useEffect(() => { setVals({}); }, [model.labels[0], model.rows.length, resetKey]);
  const value = blanks.map((k) => vals[k] ?? '').every((v) => v.trim()) ? blanks.map((k) => vals[k].trim()).join(',') : '';
  return (
    <div className="model">
      <table className="ratio-table"><thead><tr><th>{model.labels[0]}</th><th>{model.labels[1]}</th></tr></thead>
        <tbody>{model.rows.map((row, ri) => (
          <tr key={ri}>{row.map((v, ci) => <td key={ci}>{v === null ? <input className="text rt-input" inputMode="numeric" value={vals[`${ri}-${ci}`] ?? ''} disabled={disabled} aria-label={`${model.labels[ci]} row ${ri + 1}`} onChange={(e) => setVals((x) => ({ ...x, [`${ri}-${ci}`]: e.target.value.replace(/[^0-9]/g, '') }))} /> : <b>{v}</b>}</td>)}</tr>
        ))}</tbody></table>
      <LockIn label="Fill the table" value={value} onSubmit={onSubmit} disabled={disabled} />
    </div>
  );
}

/* ---------- percent dial: 20 segments of 5% ---------- */
function PercentDial({ model, onSubmit, disabled, resetKey }: ModelProps & { model: Extract<ModelSpec, { kind: 'percent' }> }) {
  const { play } = useGame();
  const [segs, setSegs] = useState(0), [typed, setTyped] = useState('');
  useEffect(() => { setSegs(0); setTyped(''); }, [model.of, resetKey]);
  const pct = segs * 5; const amount = (pct / 100) * model.of; const per = model.of / 20;
  const show = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0$/, ''));
  const one = model.label.replace(/s$/, '');
  const thing = (n: number) => labn(Number(show(n)), one, model.label);
  const perSeg = (n: number) => labn(Number(show(n)), `${one} per segment`, `${model.label} per segment`);
  const dial = (on: number, interactive: boolean, label: string) => (
    <div className={`pct-dial ${interactive ? '' : 'example'}`} role="group" aria-label={label}>
      {Array.from({ length: 20 }, (_, i) => <button key={i} className={`pct-seg ${i < on ? 'on' : ''}`} disabled={!interactive || disabled} aria-label={`${(i + 1) * 5}%`} onClick={() => { play('tick'); setSegs(i + 1 === segs ? i : i + 1); }} />)}
    </div>
  );
  const ex = model.example ?? 0, exSegs = ex / 5;
  return (
    <div className="model">
      <div className="model-ask small muted">
        <div>{labeled(`The whole dial is 100% = ${lab(model.of, `total ${model.label}`)}, drawn as ${lab(20, 'equal segments')}: one segment is one box.`)}</div>
        <div>{labeled(`${lab('100%', 'whole')} ÷ ${lab(20, 'equal segments')} = ${lab('5%', 'share per segment')}`)}</div>
        <div>{labeled(`${lab(model.of, `total ${model.label}`)} ÷ ${lab(20, 'equal segments')} = ${perSeg(per)}`)}</div>
      </div>
      {!onSubmit && ex > 0 && <>
        <div className="small muted">Worked example</div>
        {dial(exSegs, false, `worked example: ${ex}% shaded`)}
        <div className="model-readout">{labeled(`${ex}% of ${model.of} ${model.label} = ${thing((ex / 100) * model.of)}: ${lab(exSegs, 'shaded segments')} × ${perSeg(per)}`)}</div>
        <div className="small muted">Your turn</div>
      </>}
      {dial(segs, true, 'percent dial')}
      <div className="model-readout">{segs === 0 ? 'Your current selection: 0% (0 segments shaded)' : onSubmit
        ? `Your current selection: ${pct}% (${segs} segment${segs === 1 ? '' : 's'} shaded)`
        : labeled(`Your current selection: ${pct}% (${segs} segment${segs === 1 ? '' : 's'} shaded). ${lab(segs, 'shaded segments')} × ${perSeg(per)} = ${thing(amount)}`)}</div>
      {onSubmit && <>
        {/* A question: working out the amount is the player's job. */}
        <label className="model-typed">How many {model.label} is that?
          <input className="input" inputMode="decimal" value={typed} disabled={disabled} onChange={(e) => setTyped(e.target.value.replace(/[^0-9.]/g, '').slice(0, 7))} onKeyDown={(e) => { if (e.key === 'Enter' && typed) onSubmit(typed); }} />
        </label>
        <LockIn label={typed ? `${typed} ${model.label}` : 'Lock in'} value={typed} onSubmit={onSubmit} disabled={disabled} />
      </>}
    </div>
  );
}

/* ---------- power tower ---------- */
function PowerTower({ model, onSubmit, disabled, resetKey }: ModelProps & { model: Extract<ModelSpec, { kind: 'power' }> }) {
  const { play } = useGame();
  const [base, setBase] = useState<number | null>(null); const [exp, setExp] = useState<number | null>(null);
  useEffect(() => { setBase(null); setExp(null); }, [resetKey]);
  return (
    <div className="model">
      <div className="tower-row"><span className="small muted">Base</span>{model.bases.map((b) => <button key={b} className={`btn small ${base === b ? 'primary' : ''}`} disabled={disabled} onClick={() => { play('tick'); setBase(b); }}>{b}</button>)}</div>
      <div className="tower-row"><span className="small muted">Exponent</span>{model.exps.map((e) => <button key={e} className={`btn small ${exp === e ? 'primary' : ''}`} disabled={disabled} onClick={() => { play('tick'); setExp(e); }}>{e}</button>)}</div>
      <div className="model-readout tower-readout">{base !== null && exp !== null ? <><b>{base}<sup>{exp}</sup></b> = {Array(exp).fill(base).join(' × ')} = <b>{base ** exp}</b></> : 'Pick a base and an exponent.'}</div>
      <LockIn label="Set the tower" value={base !== null && exp !== null ? `${base}^${exp}` : ''} onSubmit={onSubmit} disabled={disabled} />
    </div>
  );
}

/* ---------- root panel: pick the side whose square (or cube) is the area ---------- */
function RootPanel({ model, onSubmit, disabled, resetKey }: ModelProps & { model: Extract<ModelSpec, { kind: 'root' }> }) {
  const { play } = useGame();
  const [side, setSide] = useState<number | null>(null);
  useEffect(() => { setSide(null); }, [model.area, resetKey]);
  const p = model.cube ? 3 : 2;
  return (
    <div className="model">
      <div className="root-panel">
        <div className="root-square" style={{ width: side ? 24 + side * 10 : 90, height: side ? 24 + side * 10 : 90 }}><span>{model.cube ? 'volume' : 'area'} {model.area}</span>{side !== null && <em>side {side}</em>}</div>
      </div>
      <div className="tower-row wrap">{Array.from({ length: 12 }, (_, i) => i + 1).map((s) => <button key={s} className={`btn small ${side === s ? 'primary' : ''}`} disabled={disabled} onClick={() => { play('tick'); setSide(s); }}>{s}</button>)}</div>
      <div className="model-readout">{side !== null ? <>{Array(p).fill(side).join(' × ')} = <b>{side ** p}</b>{side ** p === model.area ? ' ✓' : ''}</> : `Which number ${model.cube ? 'cubed' : 'squared'} makes ${model.area}?`}</div>
      <LockIn label={side !== null ? `Side ${side}` : 'Pick a side'} value={side !== null ? String(side) : ''} onSubmit={onSubmit} disabled={disabled} />
    </div>
  );
}

/* ---------- balance scale: inverse operations on both sides ---------- */
const nice = (n: number) => { const r = Math.round(n * 1000) / 1000; return r < 0 ? `−${-r}` : String(r); };
function side(coef: number, k: number, v: string) {
  const parts: string[] = [];
  if (Math.abs(coef) > 1e-12) parts.push(coef === 1 ? v : coef === -1 ? `−${v}` : `${nice(coef)}${v}`);
  if (Math.abs(k) > 1e-12 || !parts.length) parts.push(parts.length ? (k < 0 ? `− ${nice(-k)}` : `+ ${nice(k)}`) : nice(k));
  return parts.join(' ');
}
function Balance({ model, onSubmit, disabled, resetKey }: ModelProps & { model: Extract<ModelSpec, { kind: 'balance' }> }) {
  const { play } = useGame();
  const v = model.variable ?? 'x';
  const start = [model.a, model.b, model.c, model.d] as const;
  const [hist, setHist] = useState<{ eq: number[]; op: string }[]>([]);
  useEffect(() => { setHist([]); }, [model.a, model.b, model.c, model.d, resetKey]);
  const eq = hist.length ? hist[hist.length - 1].eq : [...start];
  const [a, b, c, d] = eq;
  const solved = (Math.abs(a - 1) < 1e-12 && Math.abs(b) < 1e-12 && Math.abs(c) < 1e-12) || (Math.abs(c - 1) < 1e-12 && Math.abs(d) < 1e-12 && Math.abs(a) < 1e-12);
  const x = Math.abs(a - 1) < 1e-12 ? d : b;
  // Offered moves: undo a constant, undo an x-term, divide out a coefficient, plus one unhelpful move.
  const ops: { label: string; apply: (e: number[]) => number[] }[] = [];
  const addK = (k: number) => ({ label: `${k < 0 ? 'Subtract' : 'Add'} ${nice(Math.abs(k))}`, apply: (e: number[]) => [e[0], e[1] + k, e[2], e[3] + k] });
  const addX = (k: number) => ({ label: `${k < 0 ? 'Subtract' : 'Add'} ${Math.abs(k) === 1 ? '' : nice(Math.abs(k))}${v}`, apply: (e: number[]) => [e[0] + k, e[1], e[2] + k, e[3]] });
  const div = (k: number) => ({ label: `Divide by ${nice(k)}`, apply: (e: number[]) => e.map((t) => t / k) });
  if (Math.abs(b) > 1e-12) ops.push(addK(-b));
  if (Math.abs(d) > 1e-12 && Math.abs(c) > 1e-12) ops.push(addK(-d));
  if (Math.abs(c) > 1e-12) ops.push(addX(-c));
  if (Math.abs(a) > 1e-12 && Math.abs(c) > 1e-12) ops.push(addX(-a));
  if (Math.abs(c) < 1e-12 && Math.abs(a) > 1e-12 && Math.abs(a - 1) > 1e-12 && Math.abs(b) < 1e-12) ops.push(div(a));
  if (Math.abs(a) < 1e-12 && Math.abs(c) > 1e-12 && Math.abs(c - 1) > 1e-12 && Math.abs(d) < 1e-12) ops.push(div(c));
  if (!solved && Math.abs(b) > 1e-12) ops.push(addK(b));
  else if (!solved && Math.abs(a) > 1e-12 && Math.abs(a - 1) > 1e-12) ops.push({ label: 'Multiply by 2', apply: (e: number[]) => e.map((t) => t * 2) });
  // the same move can be offered twice (e.g. both sides end in + 6): keep one button per move
  const uniq = ops.filter((o, i) => ops.findIndex((p) => p.label === o.label) === i);
  const order = uniq.map((o, i) => ({ o, k: (o.label.length * 7 + i * 3 + model.a * 5 + model.b) % 11 })).sort((p, q) => p.k - q.k).map((p) => p.o);
  return (
    <div className="model">
      <div className="balance-beam" aria-label="balance scale">
        <div className="pan">{side(a, b, v)}</div><div className="fulcrum">=</div><div className="pan">{side(c, d, v)}</div>
      </div>
      <div className="balance-log small muted">{hist.length ? hist.map((h) => h.op).join(' → ') : model.label ?? 'Do the same thing to both sides until ' + v + ' stands alone.'}</div>
      {!solved && <div className="tower-row wrap">{order.map((o) => <button key={o.label} className="btn small" disabled={disabled} onClick={() => { play('tick'); setHist((h) => [...h, { eq: o.apply(eq), op: `${o.label} (both sides)` }]); }}>{o.label}</button>)}</div>}
      <div className="row" style={{ gap: 6 }}>{hist.length > 0 && <button className="btn small ghost" disabled={disabled} onClick={() => setHist((h) => h.slice(0, -1))}>Undo</button>}{hist.length > 0 && <button className="btn small ghost" disabled={disabled} onClick={() => setHist([])}>Reset</button>}</div>
      {solved && <div className="model-readout"><b>{v} = {nice(x)}</b></div>}
      <LockIn label={solved ? `${v} = ${nice(x)}` : `Get ${v} alone`} value={solved ? String(Math.round(x * 1e9) / 1e9) : ''} onSubmit={onSubmit} disabled={disabled} />
    </div>
  );
}

/* ---------- plot: tap lattice points ---------- */
function PlotPick({ model, onSubmit, disabled, resetKey }: ModelProps & { model: Extract<ModelSpec, { kind: 'plot' }> }) {
  const { play } = useGame();
  const [picked, setPicked] = useState<[number, number][]>([]);
  useEffect(() => { setPicked([]); }, [model.label, resetKey]);
  const onPick = (x: number, y: number) => { play('tick'); setPicked((p) => { const without = p.filter((q) => !(q[0] === x && q[1] === y)); if (without.length !== p.length) return without; return [...p, [x, y] as [number, number]].slice(-model.count); }); };
  const val = picked.length === model.count ? picked.map((p) => `${p[0]},${p[1]}`).join(';') : '';
  const sign = (n: number) => (n < 0 ? `−${-n}` : String(n));
  return (
    <div className="model">
      <div className="model-ask small muted">{labeled(model.label)}</div>
      <PlotCanvas range={model.range} layers={model.layers} pick={{ picked, onPick, arrows: model.arrows, disabled }} />
      <div className="model-readout">{picked.length ? picked.map((p) => `(${sign(p[0])}, ${sign(p[1])})`).join('  ') : `Tap ${model.count === 1 ? 'a point' : 'two points'} on the grid.`}</div>
      <LockIn label={model.count === 1 ? 'Place it' : 'Draw it'} value={val} onSubmit={onSubmit} disabled={disabled} />
    </div>
  );
}

/* ---------- angle dial ---------- */
function AngleDial({ model, onSubmit, disabled, resetKey }: ModelProps & { model: Extract<ModelSpec, { kind: 'angle' }> }) {
  const { play } = useGame();
  const [deg, setDeg] = useState(0);
  useEffect(() => { setDeg(0); }, [model.label, resetKey]);
  const W = 280; const H = model.max === 180 ? 160 : 280; const cx = W / 2; const cy = model.max === 180 ? 140 : 140; const R = 110;
  const P = (d: number, r = R) => [cx + r * Math.cos((d * Math.PI) / 180), cy - r * Math.sin((d * Math.PI) / 180)];
  const [px, py] = P(deg); const [ax, ay] = P(deg, 30);
  const ticks = []; for (let d = 0; d <= model.max; d += model.max === 180 ? 10 : 15) ticks.push(d);
  const set = (d: number) => { const v = Math.max(0, Math.min(model.max, Math.round(d / model.step) * model.step)); setDeg(v); play('tick'); };
  return (
    <div className="model">
      <div className="model-ask small muted">{labeled(model.label)}</div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 320 }} role="img" aria-label={`angle ${deg} degrees`}>
        {model.max === 180 ? <path d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`} fill="rgba(0,0,0,0.3)" stroke="#e5e7eb" /> : <circle cx={cx} cy={cy} r={R} fill="rgba(0,0,0,0.3)" stroke="#e5e7eb" />}
        {ticks.map((d) => { const [x1, y1] = P(d, R); const [x2, y2] = P(d, d % 30 === 0 ? R - 12 : R - 6); const [tx, ty] = P(d, R - 22); return <g key={d}><line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#94a3b8" />{d % 30 === 0 && d !== 360 && <text x={tx} y={ty + 3} fontSize="8" fill="#94a3b8" textAnchor="middle">{d}</text>}</g>; })}
        <line x1={cx} y1={cy} x2={cx + R} y2={cy} stroke="#e5e7eb" strokeWidth="2.4" />
        <line x1={cx} y1={cy} x2={px} y2={py} stroke="#f472b6" strokeWidth="3" />
        {deg > 0 && <path d={`M ${cx + 30} ${cy} A 30 30 0 ${deg > 180 ? 1 : 0} 0 ${ax} ${ay}`} fill="none" stroke="#f97316" strokeWidth="2" />}
        <circle cx={cx} cy={cy} r="4" fill="#fde68a" />
      </svg>
      <input type="range" className="angle-range" min={0} max={model.max} step={model.step} value={deg} disabled={disabled} onChange={(e) => set(Number(e.target.value))} aria-label="angle" />
      <div className="row" style={{ gap: 6 }}>
        <button className="btn small" disabled={disabled} onClick={() => set(deg - model.step)}>−{model.step}°</button>
        <div className="model-readout"><b>{deg}°</b></div>
        <button className="btn small" disabled={disabled} onClick={() => set(deg + model.step)}>+{model.step}°</button>
      </div>
      <LockIn label={`Set ${deg}°`} value={String(deg)} onSubmit={onSubmit} disabled={disabled} />
    </div>
  );
}

/* ---------- unit circle: tap a special angle ---------- */
function UnitCirclePick({ model, onSubmit, disabled, resetKey, ask }: ModelProps & { model: Extract<ModelSpec, { kind: 'unitcircle' }> }) {
  const { play } = useGame();
  const [deg, setDeg] = useState<number | null>(null);
  useEffect(() => { setDeg(null); }, [model.label, resetKey]);
  const c = deg !== null ? unitCoords(deg) : null;
  // when the question is posed in radians, showing the radian name of the tapped point would give it away
  const radiansAsked = /π|radian/i.test(`${model.label} ${ask ?? ''}`);
  return (
    <div className="model">
      <div className="model-ask small muted">{labeled(model.label)}</div>
      <UnitCircleCanvas picked={deg} showCoords={model.showCoords} onPick={(d) => { play('tick'); setDeg(d); }} disabled={disabled} />
      <div className="model-readout">{deg === null ? 'Tap a point on the circle.' : <><b>{deg}°</b>{radiansAsked ? null : <> = {radLabel(deg)}</>}{model.showCoords && c ? <> · ({c[0]}, {c[1]})</> : null}</>}</div>
      <LockIn label={deg === null ? 'Pick a point' : `Choose ${deg}°`} value={deg === null ? '' : String(deg)} onSubmit={onSubmit} disabled={disabled} />
    </div>
  );
}

/* ---------- table / matrix: fill the blanks ---------- */
function TableModel({ model, onSubmit, disabled, resetKey }: ModelProps & { model: Extract<ModelSpec, { kind: 'table' }> }) {
  const blanks = model.rows.flatMap((row, ri) => row.map((v, ci) => (v === null ? `${ri}-${ci}` : null)).filter(Boolean) as string[]);
  const [vals, setVals] = useState<Record<string, string>>({});
  useEffect(() => { setVals({}); }, [model.rows.length, model.label, resetKey]);
  const value = blanks.every((k) => (vals[k] ?? '').trim()) ? blanks.map((k) => vals[k].trim()).join(',') : '';
  const show = (v: number | string) => (typeof v === 'number' ? nice(v) : v);
  return (
    <div className="model">
      {model.label && <div className="model-ask small muted">{labeled(model.label)}</div>}
      <table className={`ratio-table ${model.bracket ? 'matrix' : ''}`}>
        {model.cols && <thead><tr>{model.rowLabels && <th />}{model.cols.map((c, i) => <th key={i}>{c}</th>)}</tr></thead>}
        <tbody>{model.rows.map((row, ri) => (
          <tr key={ri}>{model.rowLabels && <th>{model.rowLabels[ri]}</th>}{row.map((v, ci) => <td key={ci}>{v === null ? <input className="text rt-input" inputMode="text" autoComplete="off" value={vals[`${ri}-${ci}`] ?? ''} disabled={disabled} aria-label={`row ${ri + 1} column ${ci + 1}`} onChange={(e) => setVals((x) => ({ ...x, [`${ri}-${ci}`]: e.target.value.replace(/[−–]/g, '-').replace(/[^0-9./-]/g, '') }))} /> : <b>{show(v)}</b>}</td>)}</tr>
        ))}</tbody>
      </table>
      <LockIn label="Fill it in" value={value} onSubmit={onSubmit} disabled={disabled} />
    </div>
  );
}

/* ---------- slider ---------- */
function SliderModel({ model, onSubmit, disabled, resetKey }: ModelProps & { model: Extract<ModelSpec, { kind: 'slider' }> }) {
  const { play } = useGame();
  const [v, setV] = useState(model.min);
  useEffect(() => { setV(model.min); }, [model.min, model.max, model.label, resetKey]);
  const set = (x: number) => { const k = Math.round((x - model.min) / model.step); setV(Math.max(model.min, Math.min(model.max, Math.round((model.min + k * model.step) * 1e6) / 1e6))); play('tick'); };
  return (
    <div className="model">
      <div className="model-ask small muted">{labeled(model.label)}</div>
      {model.range && <PlotCanvas range={model.range} layers={{ ...model.layers, vlines: [...(model.layers?.vlines ?? []), { x: v, label: nice(v) }] }} />}
      <input type="range" className="angle-range" min={model.min} max={model.max} step={model.step} value={v} disabled={disabled} onChange={(e) => set(Number(e.target.value))} aria-label={model.label} />
      <div className="row" style={{ gap: 6 }}>
        <button className="btn small" disabled={disabled} onClick={() => set(v - model.step)}>−</button>
        <div className="model-readout"><b>{nice(v)}{model.unit ? ` ${model.unit}` : ''}</b></div>
        <button className="btn small" disabled={disabled} onClick={() => set(v + model.step)}>+</button>
      </div>
      <LockIn label={`Lock ${nice(v)}`} value={String(v)} onSubmit={onSubmit} disabled={disabled} />
    </div>
  );
}

/* ---------- aids: Riemann rectangles and shrinking secants ---------- */
function RiemannAid({ model }: { model: Extract<ModelSpec, { kind: 'riemann' }> }) {
  const [n, setN] = useState(model.ns[0]);
  const sum = riemann(model.fn, model.a, model.b, n, model.rule ?? 'left');
  return (
    <div className="model aid">
      <PlotCanvas range={model.range} layers={{ fns: [{ fn: model.fn }], rects: { fn: model.fn, a: model.a, b: model.b, n, rule: model.rule } }} />
      <div className="tower-row wrap"><span className="small muted">Rectangles</span>{model.ns.map((k) => <button key={k} className={`btn small ${k === n ? 'primary' : ''}`} onClick={() => setN(k)}>{k}</button>)}</div>
      <div className="model-readout">{n} rectangles ({model.rule ?? 'left'}) ≈ <b>{nice(sum)}</b></div>
    </div>
  );
}
function SecantAid({ model }: { model: Extract<ModelSpec, { kind: 'secant' }> }) {
  const [h, setH] = useState(model.hs[0]);
  const y0 = evalFn(model.fn, model.x); const y1 = evalFn(model.fn, model.x + h); const m = (y1 - y0) / h;
  const [x0, x1] = model.range;
  return (
    <div className="model aid">
      <PlotCanvas range={model.range} layers={{ fns: [{ fn: model.fn }], segments: [{ a: [x0, y0 + m * (x0 - model.x)], b: [x1, y0 + m * (x1 - model.x)], color: 'orange', dashed: true }], points: [{ x: model.x, y: y0, label: 'P' }, { x: model.x + h, y: y1, color: 'orange' }] }} />
      <div className="tower-row wrap"><span className="small muted">h</span>{model.hs.map((k) => <button key={k} className={`btn small ${k === h ? 'primary' : ''}`} onClick={() => setH(k)}>{k}</button>)}</div>
      <div className="model-readout">secant slope with h = {h}: <b>{nice(m)}</b></div>
    </div>
  );
}

/* ---------- choose / pick-model ---------- */
export function ChoiceButtons({ step, onSubmit, disabled, judged }: { step: AskStep; onSubmit: (v: string) => void; disabled?: boolean; judged?: (v: string) => boolean }) {
  const { play } = useGame();
  return (
    <div className={`verb-choices ${step.choices && step.choices.length > 4 ? 'three' : ''}`}>
      {step.choices?.map((c) => <button key={c} className={`btn big verb-btn ${disabled && judged?.(c) ? 'right' : ''}`} disabled={disabled} onClick={() => { play('click'); onSubmit(c); }}>{c}</button>)}
    </div>
  );
}
export function PickModel({ step, onSubmit, disabled, judged }: { step: AskStep; onSubmit: (v: string) => void; disabled?: boolean; judged?: (v: string) => boolean }) {
  const { play } = useGame();
  return (
    <div className="pick-models">
      {step.options?.map((o, i) => (
        <button key={i} className={`pick-model ${disabled && judged?.(o.label) ? 'right' : ''}`} disabled={disabled} onClick={() => { play('click'); onSubmit(o.label); }} aria-label={o.label}>
          <MathVisual visual={o.visual} />
          <span className="pick-label">{o.label}</span>
        </button>
      ))}
    </div>
  );
}
