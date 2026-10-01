import { useState } from 'react';
import type { Circuit, Env, SimResult } from '../../engine/reality/circuit';
import { PART_NAME } from '../../engine/reality/circuit';
import { renderSource, sourceTemplate, type SketchDef, type Slots, type Slot } from '../../engine/reality/runtime';
import type { Control } from '../../engine/reality/missions';
import { useGame } from '../store';
import { labeled } from '../components/Labeled';

/* ---------------- test station: change the world, read the meters ---------------- */

export function TestStation({ circuit, env, setEnv, result, controls, usb }: { circuit: Circuit; env: Env; setEnv: (e: Env) => void; result: SimResult; controls: Control[]; usb: boolean }) {
  const pots = circuit.parts.filter((p) => p.kind === 'pot');
  const buttons = circuit.parts.filter((p) => p.kind === 'button');
  const set = (patch: Partial<Env>) => setEnv({ ...env, ...patch });
  return (
    <div className="rl-station" aria-label="Test station">
      {controls.includes('light') && <label className="rl-slider"><span>☀ Room light <b>{env.light}%</b></span><input type="range" min={0} max={100} value={env.light} onChange={(e) => set({ light: Number(e.target.value) })} aria-label="Room light" /><small>dark · bright</small></label>}
      {controls.includes('temp') && <label className="rl-slider"><span>🌡 Room temperature <b>{env.tempC} °C</b></span><input type="range" min={0} max={45} value={env.tempC} onChange={(e) => set({ tempC: Number(e.target.value) })} aria-label="Room temperature" /><small>0 °C · 45 °C</small></label>}
      {controls.includes('distance') && <label className="rl-slider"><span>✋ Hand distance <b>{env.distanceCm} cm</b></span><input type="range" min={2} max={250} value={env.distanceCm} onChange={(e) => set({ distanceCm: Number(e.target.value) })} aria-label="Distance of your hand from the sensor" /><small>2 cm · 250 cm</small></label>}
      {controls.includes('knob') && pots.map((p) => <label key={p.id} className="rl-slider"><span>🎛 Turn the knob <b>{Math.round((env.knob[p.id] ?? 0.5) * 100)}%</b></span><input type="range" min={0} max={100} value={Math.round((env.knob[p.id] ?? 0.5) * 100)} onChange={(e) => set({ knob: { ...env.knob, [p.id]: Number(e.target.value) / 100 } })} aria-label="Potentiometer position" /><small>left end · right end</small></label>)}
      {controls.includes('button') && buttons.map((b) => (
        <button key={b.id} className={`rl-hold ${env.pressed[b.id] ? 'down' : ''}`} disabled={!usb}
          onPointerDown={() => set({ pressed: { ...env.pressed, [b.id]: true } })} onPointerUp={() => set({ pressed: { ...env.pressed, [b.id]: false } })} onPointerLeave={() => env.pressed[b.id] && set({ pressed: { ...env.pressed, [b.id]: false } })}
          onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') set({ pressed: { ...env.pressed, [b.id]: true } }); }} onKeyUp={() => set({ pressed: { ...env.pressed, [b.id]: false } })}>
          {env.pressed[b.id] ? 'Holding the button…' : 'Press and hold the button'}
        </button>
      ))}
      <Meters circuit={circuit} result={result} usb={usb} />
    </div>
  );
}

export function Meters({ circuit, result, usb }: { circuit: Circuit; result: SimResult; usb: boolean }) {
  const pins = Object.entries(result.pins).filter(([p]) => circuit.wires.some((w) => w.a === `u:${p}` || w.b === `u:${p}`));
  const lines: string[] = [];
  if (!usb) lines.push('No power: the USB cable is unplugged.');
  else if (!result.powered) lines.push('No power: the USB fuse has tripped.');
  for (const p of circuit.parts) {
    const st = result.parts[p.id]; if (!st) continue;
    if (p.kind === 'led') lines.push(`${PART_NAME.led}${p.blown ? ' (burned out)' : ''}: ${st.i.toFixed(1)} mA${(st.brightness ?? 0) > 0.05 ? ' · lit' : ' · dark'}`);
    if (p.kind === 'buzzer' || p.kind === 'pbuzzer') lines.push(`${PART_NAME[p.kind]}: ${st.sounding ? `sounding${st.freq ? ` ${st.freq} Hz` : ''}` : 'silent'}`);
  }
  for (const [p, st] of pins) {
    const d = st.drive;
    const what = d.mode === 'out' ? (d.high ? 'OUTPUT HIGH (5 V)' : 'OUTPUT LOW (0 V)') : d.mode === 'pwm' ? `PWM ${d.duty}/255` : d.mode === 'tone' ? `tone ${d.freq} Hz` : st.reading === 'float' ? 'INPUT floating ⚠' : `INPUT reads ${st.reading === 1 ? 'HIGH' : 'LOW'}`;
    const label = p.startsWith('D') ? `Pin ${p.slice(1)}` : p;
    lines.push(`${label}: ${what}${p.startsWith('A') && st.analog !== undefined && d.mode !== 'out' ? ` · analogRead ${st.analog}` : ''} · ${st.v.toFixed(2)} V`);
  }
  return (
    <div className="rl-meters" aria-live="polite">
      <div className="rl-meters-h">Multimeter</div>
      {lines.length ? lines.map((l, i) => <div key={i}>{l}</div>) : <div className="muted">Nothing connected yet.</div>}
      {result.warnings.filter((w) => w.kind !== 'floating-input').map((w, i) => <div key={`w${i}`} className="rl-warn">⚠ {w.text}</div>)}
    </div>
  );
}

export function SerialMonitor({ lines, usb }: { lines: string[]; usb: boolean }) {
  return (
    <div className="rl-serial" aria-label="Serial Monitor" aria-live="polite">
      <div className="rl-serial-h"><span>Serial Monitor</span><small>9600 baud</small></div>
      <pre>{usb ? (lines.slice(-10).join('\n') || '(nothing printed yet)') : '(unplugged)'}</pre>
    </div>
  );
}

/* ---------------- code card: real Arduino C++ with editable blanks ---------------- */

export function CodeCard({ sketch, slots, setSlots, onUpload, usb, running, lockedKeys = [] }: { sketch: SketchDef; slots: Slots; setSlots: (s: Slots) => void; onUpload: () => void; usb: boolean; running: boolean; lockedKeys?: string[] }) {
  const { play } = useGame();
  const [phase, setPhase] = useState<'idle' | 'compiling' | 'uploading' | 'done'>('idle');
  const [editing, setEditing] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const template = sourceTemplate(sketch, slots);
  const parts = template.split(/(\{\{\w+\}\})/g);
  const slotOf = (k: string) => sketch.slots.find((x) => x.key === k)!;
  const upload = () => {
    if (!usb) return;
    play('click'); setPhase('compiling');
    window.setTimeout(() => setPhase('uploading'), 700);
    window.setTimeout(() => { setPhase('done'); onUpload(); play('correct'); }, 1600);
  };
  const copy = async () => { try { await navigator.clipboard.writeText(renderSource(sketch, slots)); setCopied(true); window.setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ } };
  return (
    <div className="rl-code">
      <div className="rl-code-h">
        <span>📄 {sketch.title}.ino</span>
        <span className="rl-code-actions">
          <button className="rl-chip" onClick={copy} title="Copy the C++ to use on the real UNO later">{copied ? 'Copied ✓' : 'Copy'}</button>
          <button className="rl-chip primary" disabled={!usb || phase === 'compiling' || phase === 'uploading'} onClick={upload}>⬆ Upload</button>
        </span>
      </div>
      {sketch.libraries?.length ? <div className="rl-code-lib">Needs: {sketch.libraries.join(', ')}</div> : null}
      <pre className="rl-code-src">{parts.map((part, i) => {
        const m = /^\{\{(\w+)\}\}$/.exec(part);
        if (!m) return <span key={i}>{part}</span>;
        const k = m[1]; const sl = slotOf(k); const v = slots[k] ?? sl.default; const locked = lockedKeys.includes(k);
        return <button key={i} className={`rl-blank ${locked ? 'locked' : ''}`} disabled={locked} onClick={() => setEditing(editing === k ? null : k)} aria-label={`${sl.label}: ${String(v)}. Tap to change.`}>{String(v).replace(/^D(\d+)$/, '$1')}</button>;
      })}</pre>
      {editing && <SlotEditor slot={slotOf(editing)} value={slots[editing] ?? slotOf(editing).default} onChange={(v) => setSlots({ ...slots, [editing]: v })} onClose={() => setEditing(null)} />}
      <div className="rl-code-status">
        {!usb ? 'Plug in the USB cable to upload.' : phase === 'compiling' ? 'Compiling sketch…' : phase === 'uploading' ? 'Uploading… (TX/RX lights flicker)' : phase === 'done' ? (running ? 'Done uploading. The board is running your code.' : 'Done uploading.') : 'Tap a highlighted value to change it, then Upload.'}
      </div>
    </div>
  );
}

function SlotEditor({ slot, value, onChange, onClose }: { slot: Slot; value: string | number; onChange: (v: string | number) => void; onClose: () => void }) {
  return (
    <div className="rl-slot-editor" role="dialog" aria-label={slot.label}>
      <div className="rl-slot-h"><b>{slot.label}</b><button className="rl-chip" onClick={onClose}>Done</button></div>
      {slot.kind === 'number' ? (
        <div className="rl-slot-num">
          <button className="rl-chip" onClick={() => onChange(Math.max(slot.min ?? 0, Number(value) - (slot.step ?? 1)))}>−</button>
          <input type="number" inputMode="numeric" value={value} min={slot.min} max={slot.max} step={slot.step} onChange={(e) => { const n = Number(e.target.value); if (Number.isFinite(n)) onChange(Math.max(slot.min ?? -1e9, Math.min(slot.max ?? 1e9, n))); }} />
          <button className="rl-chip" onClick={() => onChange(Math.min(slot.max ?? 1e9, Number(value) + (slot.step ?? 1)))}>+</button>
        </div>
      ) : (
        <div className="rl-slot-opts">{slot.options?.map((o) => <button key={String(o)} className={`rl-chip ${o === value ? 'on' : ''}`} onClick={() => onChange(o)}>{String(o).replace(/^D(\d+)$/, '$1')}</button>)}</div>
      )}
      {slot.hint && <small>{labeled(slot.hint)}</small>}
    </div>
  );
}
