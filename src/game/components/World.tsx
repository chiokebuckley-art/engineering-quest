import { academyById, nextAcademy } from '../../engine/academy/registry';
import { useState } from 'react';
import { useGame } from '../store';
import { Icon } from './ui';
import { Confetti } from './Fx';
import { worldView, type WorldView } from '../../engine/state/world';
import { nextStep } from '../../engine/state/guide';
import { MINE_DEPTHS } from '../../engine/combat/enemies';
import { skillMastery } from '../../engine/mastery/MasteryEngine';
import { TABLE_ORDER } from '../../engine/curriculum/skills';
import type { GameState } from '../../engine/state/types';

const AMBER = '#fbbf24';
const DARK = '#1e293b';

/* ------------------------------------------------------------------ */
/* The village at night: every gallery, rescue and repair shows here    */
/* ------------------------------------------------------------------ */

export function VillageScene() {
  const { state } = useGame();
  const v = worldView(state);
  const lampX = (i: number) => 50 + i * 100;
  const houses = [{ x: 150, w: 70 }, { x: 232, w: 60 }, { x: 490, w: 64 }, { x: 566, w: 78 }, { x: 656, w: 60 }, { x: 118, w: 0 }].slice(0, 5);
  return (
    <figure className="village-scene" aria-label={`The village: ${v.lanterns} of 8 street lanterns lit, ${v.houses} houses lit${v.cores.mult ? ', Power Core I seated' : ''}.`}>
      <svg viewBox="0 0 800 320" role="img" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="vs-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#070b18" /><stop offset="1" stopColor="#14213d" /></linearGradient>
          <radialGradient id="vs-glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor={AMBER} stopOpacity="0.75" /><stop offset="1" stopColor={AMBER} stopOpacity="0" /></radialGradient>
          <radialGradient id="vs-core" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#fff7d6" /><stop offset="0.5" stopColor="#ffb347" /><stop offset="1" stopColor="#b45309" /></radialGradient>
          <radialGradient id="vs-cyan" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#67e8f9" stopOpacity="0.8" /><stop offset="1" stopColor="#67e8f9" stopOpacity="0" /></radialGradient>
          <radialGradient id="vs-green" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#bef264" stopOpacity="0.8" /><stop offset="1" stopColor="#bef264" stopOpacity="0" /></radialGradient>
        </defs>
        <rect width="800" height="320" fill="url(#vs-sky)" />
        {Array.from({ length: 24 }, (_, i) => <circle key={i} cx={(i * 137) % 800} cy={(i * 53) % 110 + 8} r={i % 3 === 0 ? 1.4 : 0.9} fill="#e2e8f0" opacity={0.3 + (v.lanterns / 8) * 0.5} />)}

        {/* The Engine, with fifteen core slots and a gauge for the next core */}
        <g transform="translate(300 34)">
          <rect x="0" y="0" width="200" height="140" rx="10" fill="#1f2937" stroke="#64748b" strokeWidth="3" />
          <rect x="10" y="10" width="180" height="20" rx="4" fill="#0f172a" />
          <text x="100" y="24" textAnchor="middle" fontSize="11" fill={v.cores.mult ? AMBER : '#64748b'} fontFamily="var(--font-display)" letterSpacing="2">{v.cores.mult ? 'ENGINE RUNNING' : 'ENGINE DORMANT'}</text>
          {Array.from({ length: 15 }, (_, i) => {
            const cx = 30 + (i % 5) * 35; const cy = 50 + Math.floor(i / 5) * 26;
            const lit = (i === 0 && v.cores.mult) || (i === 1 && v.cores.frac) || (i === 2 && v.cores.div);
            return <g key={i}>{lit && <circle cx={cx} cy={cy} r="16" fill={i === 1 ? 'url(#vs-green)' : i === 2 ? 'url(#vs-cyan)' : 'url(#vs-glow)'} />}<circle cx={cx} cy={cy} r="8" fill={lit ? (i === 1 ? '#a3e635' : i === 2 ? '#22d3ee' : 'url(#vs-core)') : '#0b1220'} stroke="#475569" strokeWidth="2" /></g>;
          })}
          <rect x="16" y="126" width="168" height="8" rx="4" fill="#0f172a" />
          <rect x="16" y="126" width={168 * Math.min(1, v.charge.done / v.charge.total)} height="8" rx="4" fill={AMBER} />
        </g>
        {v.crystal && [270, 530].map((x) => <g key={x}><circle cx={x} cy="150" r="22" fill="url(#vs-cyan)" /><rect x={x - 3} y="150" width="6" height="60" fill="#334155" /><circle cx={x} cy="150" r="7" fill="#67e8f9" /></g>)}

        {/* Bell tower (with the town clock on top once it ticks again) */}
        <g>
          <rect x="30" y="100" width="64" height="150" fill="#334155" stroke="#0f172a" strokeWidth="3" />
          <path d="M26 100 L62 62 L98 100 Z" fill="#475569" stroke="#0f172a" strokeWidth="3" />
          <path d="M50 130 q12 -24 24 0 l2 10 h-28 z" fill={v.bell ? AMBER : '#57534e'} stroke="#0f172a" strokeWidth="2" />
          {v.bell && <path d="M40 124 q-8 12 0 24 M84 124 q8 12 0 24" stroke={AMBER} strokeWidth="2" fill="none" />}
          <circle cx="62" cy="180" r="16" fill={v.clock ? '#fef3c7' : '#1e293b'} stroke="#0f172a" strokeWidth="3" />
          {v.clock && <path d="M62 180 L62 170 M62 180 L70 184" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />}
          {v.crypt && <g transform="translate(40 222)"><rect width="44" height="28" fill="#1e293b" stroke="#94a3b8" strokeWidth="2" /><circle cx="22" cy="12" r="4" fill={AMBER} /><rect x="20.5" y="14" width="3" height="8" fill={AMBER} /></g>}
        </g>

        {/* Houses: a window lights for each gallery cleared */}
        {houses.map((h, i) => (
          <g key={i}>
            <rect x={h.x} y="190" width={h.w} height="62" fill="#3f3a36" stroke="#0f172a" strokeWidth="3" />
            <path d={`M${h.x - 6} 190 L${h.x + h.w / 2} 160 L${h.x + h.w + 6} 190 Z`} fill="#57534e" stroke="#0f172a" strokeWidth="3" />
            <rect x={h.x + h.w / 2 - 10} y="206" width="20" height={i === 2 && v.library ? 30 : 18} fill={i < v.houses ? AMBER : DARK} stroke="#0f172a" strokeWidth="2" />
            {i < v.houses && <circle cx={h.x + h.w / 2} cy="215" r="20" fill="url(#vs-glow)" opacity="0.6" />}
            {i === 3 && <rect x={h.x + h.w - 18} y="158" width="12" height="24" fill="#57534e" stroke="#0f172a" strokeWidth="2" />}
            {i === 3 && v.chimney && [0, 1, 2].map((k) => <circle key={k} cx={h.x + h.w - 12 + k * 6} cy={148 - k * 12} r={5 + k * 2} fill="#94a3b8" opacity={0.5 - k * 0.12} />)}
          </g>
        ))}

        {/* Market stall: its ore glows once the Goblin ore is recovered */}
        <g transform="translate(410 214)">
          <path d="M-6 0 L66 0 L60 -16 L0 -16 Z" fill={v.stall ? '#b45309' : '#57534e'} stroke="#0f172a" strokeWidth="2" />
          <rect x="4" y="0" width="52" height="30" fill="#292524" stroke="#0f172a" strokeWidth="2" />
          {v.stall && [14, 30, 46].map((x) => <g key={x}><circle cx={x} cy="12" r="10" fill="url(#vs-glow)" /><circle cx={x} cy="12" r="4" fill={AMBER} /></g>)}
        </g>

        {/* Pump, bridge and the forest gate */}
        <g transform="translate(726 196)">
          <rect x="0" y="10" width="18" height="46" fill={v.pump ? '#0e7490' : '#475569'} stroke="#0f172a" strokeWidth="2" />
          <path d="M18 18 h14" stroke="#0f172a" strokeWidth="4" />
          {v.pump && <path d="M32 18 q10 10 4 36" stroke="#38bdf8" strokeWidth="4" fill="none" strokeLinecap="round" />}
        </g>
        {v.bridge && <path d="M740 262 q30 -22 60 0" stroke="#a16207" strokeWidth="6" fill="none" />}
        {v.forest > 0 && Array.from({ length: v.forest }, (_, i) => <g key={i}><circle cx={770} cy={120 + i * 26} r="12" fill="url(#vs-green)" /><circle cx={770} cy={120 + i * 26} r="4" fill="#bef264" /></g>)}

        {/* The street: eight lanterns, one per mine gallery */}
        <rect x="0" y="252" width="800" height="68" fill="#1f2937" />
        <rect x="0" y="252" width="800" height="4" fill="#334155" />
        {Array.from({ length: 8 }, (_, i) => {
          const lit = i < v.lanterns;
          return (
            <g key={i}>
              {lit && <circle cx={lampX(i)} cy="236" r="26" fill="url(#vs-glow)" />}
              <rect x={lampX(i) - 2} y="236" width="4" height="46" fill="#475569" />
              <rect x={lampX(i) - 7} y="226" width="14" height="14" rx="3" fill={lit ? AMBER : '#0b1220'} stroke="#94a3b8" strokeWidth="1.5" />
              <text x={lampX(i)} y="300" textAnchor="middle" fontSize="11" fill={lit ? '#fde68a' : '#475569'} fontFamily="var(--font-mono)">{i + 1}</text>
            </g>
          );
        })}
        {v.pip && <g transform="translate(78 256)"><circle cx="0" cy="6" r="6" fill="#fcd9b6" /><rect x="-5" y="12" width="10" height="14" rx="3" fill="#b45309" /><path d="M-7 4 h14 l-2 -6 h-10 z" fill={AMBER} /></g>}
      </svg>
      <figcaption className="vs-cap">
        <span>{v.charge.label}: <b>{v.charge.done}/{v.charge.total}</b></span>
        <span>{v.lanterns}/8 lanterns lit</span>
      </figcaption>
    </figure>
  );
}

/** The mine tunnel: a lamp per gallery, and the ore cart parked at the gallery you are working on. */
export function MineLamps() {
  const { state } = useGame();
  const cleared = state.world.depthCleared['mines'] ?? 0;
  const cart = Math.min(cleared, MINE_DEPTHS.length - 1);
  const x = (i: number) => 40 + i * 90;
  return (
    <svg className="mine-lamps" viewBox="0 0 720 70" role="img" aria-label={`${cleared} of 8 gallery lamps lit`}>
      <defs><radialGradient id="ml-glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor={AMBER} stopOpacity="0.8" /><stop offset="1" stopColor={AMBER} stopOpacity="0" /></radialGradient></defs>
      <rect x="0" y="10" width="720" height="6" fill="#78350f" />
      <rect x="0" y="56" width="720" height="3" fill="#57534e" /><rect x="0" y="64" width="720" height="3" fill="#57534e" />
      {Array.from({ length: 8 }, (_, i) => (
        <g key={i}>
          {i < cleared && <circle cx={x(i)} cy="26" r="18" fill="url(#ml-glow)" />}
          <path d={`M${x(i)} 16 v6`} stroke="#a8a29e" strokeWidth="2" />
          <rect x={x(i) - 6} y="22" width="12" height="12" rx="3" fill={i < cleared ? AMBER : '#0b1220'} stroke="#a8a29e" strokeWidth="1.5" />
        </g>
      ))}
      <g transform={`translate(${x(cart) - 18} 38)`} style={{ transition: 'transform 0.6s' }}>
        <path d="M0 0 h36 l-4 16 h-28 z" fill="#57534e" stroke="#0f172a" strokeWidth="2" />
        <circle cx="10" cy="18" r="4" fill="#1f2937" /><circle cx="26" cy="18" r="4" fill="#1f2937" />
        <circle cx="12" cy="-2" r="4" fill={AMBER} /><circle cx="22" cy="-3" r="5" fill="#b45309" />
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Seating a core: the Engine wakes                                     */
/* ------------------------------------------------------------------ */

const CORE_NAMES: Record<string, { title: string; line: string; color: string }> = {
  'multiplication-dragon': { title: 'POWER CORE I', line: 'Multiplication. The Engine turns over for the first time in a year — and every lantern in the village flares.', color: '#ffb347' },
  'fraction-hydra': { title: 'THE FRACTION CORE', line: 'Fractions: equal parts of a whole. Green light runs through the Engine.', color: '#a3e635' },
  'division-titan': { title: 'THE DIVISION CORE', line: 'Division: multiplication run backwards. Two halves of the world click together.', color: '#22d3ee' },
  'arithmetic-core': { title: 'THE ARITHMETIC POWER CORE', line: 'Counting to roots, the whole stack. The Engine turns at full arithmetic power, a graduation banner unfurls over the village, and the road to Algebra City lights.', color: '#fde68a' },
};

export function CoreCeremony() {
  const { state, dispatch, play } = useGame();
  const [seated, setSeated] = useState(0);
  const id = state.world.ceremony;
  if (!id) return null;
  const acad = id.startsWith('academy:') ? academyById(id.slice(8)) : undefined;
  const nxt = acad ? nextAcademy(acad.id) : undefined;
  const c = acad ? { title: acad.coreName.toUpperCase(), line: `${acad.coreLine}${nxt ? ` The ${nxt.name} is open.` : ''}`, color: acad.coreColor } : CORE_NAMES[id] ?? { title: 'A NEW CORE', line: 'Another piece of the Engine is back.', color: '#ffb347' };
  return (
    <div className="ceremony" role="dialog" aria-label={`${c.title} ceremony`}>
      <Confetti trigger={seated} count={60} />
      <div className="panel ceremony-panel">
        <div className="small muted">THE MATHEMATICAL ENGINE</div>
        <svg viewBox="0 0 240 200" className={`ceremony-engine ${seated ? 'seated' : ''}`} style={{ ['--core' as string]: c.color }}>
          <rect x="40" y="60" width="160" height="120" rx="10" fill="#1f2937" stroke="#64748b" strokeWidth="3" />
          <circle cx="120" cy="120" r="30" fill="#0b1220" stroke="#475569" strokeWidth="4" />
          <circle className="ce-glow" cx="120" cy="120" r="46" fill={c.color} opacity="0" />
          <circle className="ce-core" cx="120" cy="120" r="20" fill={c.color} stroke="#fff7d6" strokeWidth="3" />
          {[0, 1, 2, 3].map((i) => <rect key={i} className="ce-light" x={56 + i * 36} y="72" width="20" height="8" rx="3" fill={c.color} opacity="0.15" style={{ animationDelay: `${0.6 + i * 0.15}s` }} />)}
        </svg>
        <h2 className="brass">{c.title}</h2>
        <p>{c.line}</p>
        {!seated ? (
          <button className="btn primary big" onClick={() => { play('fanfare'); setSeated(Date.now()); }}>Seat the core</button>
        ) : (
          <button className="btn primary big" onClick={() => { play('open'); dispatch({ type: 'CEREMONY_DONE' }); setSeated(0); }}>Back to the village ▸</button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The village board: today's quest (Play) and today's training (Arcade) */
/* ------------------------------------------------------------------ */

/** The Arcade drill that best serves the adventure right now: the weakest table you have met in the mines. */
export function trainingPick(s: GameState): { game: 'mult'; selection: string; label: string; mastery: number } {
  const cleared = s.world.depthCleared['mines'] ?? 0;
  const met = MINE_DEPTHS.filter((d) => d.depth <= cleared + 1).flatMap((d) => d.tables);
  const pool = met.filter((t) => t !== 1).length ? met.filter((t) => t !== 1) : [2];
  const t = [...new Set(pool)].sort((a, b) => skillMastery(`mult.${a}`, s.mastery) - skillMastery(`mult.${b}`, s.mastery) || TABLE_ORDER.indexOf(a) - TABLE_ORDER.indexOf(b))[0];
  return { game: 'mult', selection: `mult:${t}`, label: `×${t}`, mastery: Math.round(skillMastery(`mult.${t}`, s.mastery)) };
}

export function VillageBoard() {
  const { state, dispatch, play } = useGame();
  const step = nextStep(state);
  const t = trainingPick(state);
  const buff = state.world.buff;
  const last = state.world.lastChange;
  return (
    <div className="village-board">
      {last && <div className="vb-news"><Icon name="lantern" /> {last.text}</div>}
      <div className="vb-cards">
        <button className="vb-card quest" onClick={() => { play('open'); dispatch(step.action); }}>
          <small>TODAY'S QUEST · PLAY</small>
          <b><Icon name={step.icon} /> {step.label}</b>
          <span>{step.hint}</span>
        </button>
        <button className="vb-card train" onClick={() => { play('open'); dispatch({ type: 'ARCADE_START', game: t.game, mode: 'practice', selection: t.selection }); }}>
          <small>TODAY'S TRAINING · ARCADE</small>
          <b><Icon name="hourglass" /> Practise {t.label} ({t.mastery}%)</b>
          <span>{buff ? `Shield ready: ${buff.shield} points for your next fight` : '10 right at 80% earns a shield for your next fight'}</span>
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* A picture of the Engine to show someone                              */
/* ------------------------------------------------------------------ */

export function engineCardSvg(v: WorldView, name: string, level: number, date = new Date()): string {
  const esc = (t: string) => t.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]!);
  const slots = Array.from({ length: 15 }, (_, i) => {
    const lit = (i === 0 && v.cores.mult) || (i === 1 && v.cores.frac) || (i === 2 && v.cores.div);
    const color = i === 1 ? '#a3e635' : i === 2 ? '#22d3ee' : '#ffb347';
    return `<circle cx="${470 + (i % 5) * 70}" cy="${230 + Math.floor(i / 5) * 60}" r="20" fill="${lit ? color : '#0b1220'}" stroke="#475569" stroke-width="4"/>`;
  }).join('');
  const lamps = Array.from({ length: 8 }, (_, i) => `<rect x="${80 + i * 130}" y="520" width="34" height="34" rx="8" fill="${i < v.lanterns ? '#fbbf24' : '#0b1220'}" stroke="#94a3b8" stroke-width="3"/>`).join('');
  const cores = [v.cores.mult, v.cores.frac, v.cores.div].filter(Boolean).length;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070b18"/><stop offset="1" stop-color="#1e293b"/></linearGradient></defs>
<rect width="1200" height="630" fill="url(#bg)"/>
<text x="60" y="90" font-family="Georgia, serif" font-size="44" font-weight="700" fill="#fbbf24">ENGINEERING QUEST</text>
<text x="60" y="140" font-family="Georgia, serif" font-size="30" fill="#e2e8f0">${esc(name)} · Level ${level}</text>
<text x="60" y="190" font-family="Georgia, serif" font-size="24" fill="#94a3b8">${cores} of 15 power cores restored · ${v.lanterns} of 8 lanterns lit</text>
<rect x="420" y="170" width="380" height="260" rx="16" fill="#1f2937" stroke="#64748b" stroke-width="5"/>${slots}
<rect x="440" y="400" width="340" height="14" rx="7" fill="#0f172a"/><rect x="440" y="400" width="${340 * Math.min(1, v.charge.done / v.charge.total)}" height="14" rx="7" fill="#fbbf24"/>
<text x="610" y="460" text-anchor="middle" font-family="Georgia, serif" font-size="22" fill="#fde68a">${esc(v.charge.label)}: ${v.charge.done}/${v.charge.total}</text>
<rect x="0" y="500" width="1200" height="130" fill="#111827"/>${lamps}
<text x="1140" y="610" text-anchor="end" font-family="Georgia, serif" font-size="20" fill="#64748b">${date.toLocaleDateString()}</text>
</svg>`;
}

/** Turn the Engine card into a PNG and share it (or download it where sharing files is not supported). */
export async function saveEngineCard(state: GameState): Promise<'shared' | 'downloaded' | 'failed'> {
  try {
    const svg = engineCardSvg(worldView(state), state.character?.name ?? 'Apprentice', state.character?.level ?? 1);
    const img = new Image();
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    await img.decode();
    const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 630;
    canvas.getContext('2d')!.drawImage(img, 0, 0);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));
    if (!blob) return 'failed';
    const file = new File([blob], 'engineering-quest-engine.png', { type: 'image/png' });
    const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
    if (nav.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: 'My Engineering Quest Engine' }); return 'shared'; }
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = file.name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    return 'downloaded';
  } catch { return 'failed'; }
}
