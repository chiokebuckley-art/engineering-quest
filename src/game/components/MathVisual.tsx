import type { Visual } from '../../engine/types';
import { labeled } from './Labeled';
import { ContestVisualView } from './contest/ContestVisual';
import { isContestVisual } from '../../engine/contest/visuals';
import { PlotViz, UnitCircleCanvas, NumLineViz, GeoViz, MatViz } from './AcademyVisuals';

/**
 * Visual models of arithmetic: arrays, equal groups, number lines and sharing.
 * Pure SVG so it scales on any screen.
 */
export function MathVisual({ visual, caption }: { visual: Visual; caption?: string }) {
  if (visual.type === 'none') return null;
  return (
    <div className="mviz">
      <div>
        {isContestVisual(visual) && <ContestVisualView visual={visual} />}
        {visual.type === 'array' && <ArrayViz rows={visual.rows} cols={visual.cols} highlightRows={visual.highlightRows} highlightCols={visual.highlightCols} />}
        {visual.type === 'groups' && <GroupsViz groups={visual.groups} per={visual.perGroup} />}
        {visual.type === 'numberline' && <NumberLine step={visual.step} count={visual.count} max={visual.max} />}
        {visual.type === 'share' && <ShareViz total={visual.total} groups={visual.groups} />}
        {visual.type === 'bond' && <BondViz total={visual.total} part={visual.part} />}
        {visual.type === 'balance' && <BalanceViz left={visual.left} right={visual.right} unknown={visual.unknown} />}
        {visual.type === 'bar' && <BarViz bars={visual.bars} whole={visual.whole} />}
        {visual.type === 'jumps' && <JumpsViz from={visual.from} jumps={visual.jumps} />}
        {visual.type === 'cubes' && <CubesViz l={visual.l} w={visual.w} h={visual.h} />}
        {visual.type === 'box' && <BoxViz l={visual.l} w={visual.w} h={visual.h} unit={visual.unit} hide={visual.hide} />}
        {visual.type === 'beaker' && <BeakerViz capacity={visual.capacity} major={visual.major} divisions={visual.divisions} level={visual.level} unit={visual.unit} />}
        {visual.type === 'displace' && <DisplaceViz capacity={visual.capacity} major={visual.major} divisions={visual.divisions} before={visual.before} after={visual.after} unit={visual.unit} />}
        {visual.type === 'ruler' && <RulerViz unit={visual.unit} length={visual.length} start={visual.start} end={visual.end} divisions={visual.divisions} label={visual.label} />}
        {visual.type === 'dial' && <DialViz max={visual.max} major={visual.major} divisions={visual.divisions} value={visual.value} unit={visual.unit} />}
        {visual.type === 'thermometer' && <ThermometerViz min={visual.min} max={visual.max} major={visual.major} divisions={visual.divisions} value={visual.value} unit={visual.unit} />}
        {visual.type === 'clocks' && <ClocksViz start={visual.start} end={visual.end} />}
        {visual.type === 'refbar' && <RefBarViz refSize={visual.ref} refLabel={visual.refLabel} target={visual.target} targetLabel={visual.targetLabel} unit={visual.unit} />}
        {visual.type === 'units' && <UnitsViz big={visual.big} small={visual.small} n={visual.n} dims={visual.dims} />}
        {visual.type === 'rect' && <RectViz w={visual.w} h={visual.h} unit={visual.unit} ask={visual.ask} grid={visual.grid} />}
        {visual.type === 'compare' && <CompareViz a={visual.a} b={visual.b} unit={visual.unit} units={visual.units} />}
        {visual.type === 'protractor' && <ProtractorViz angle={visual.angle} />}
        {visual.type === 'angles' && <AnglesViz shape={visual.shape} known={visual.known} />}
        {visual.type === 'circle' && <CircleViz r={visual.r} unit={visual.unit} show={visual.show} wheel={visual.wheel} />}
        {visual.type === 'rtri' && <RightTriViz a={visual.a} b={visual.b} c={visual.c} hide={visual.hide} unit={visual.unit} context={visual.context} />}
        {visual.type === 'slope' && <SlopeViz rise={visual.rise} run={visual.run} unit={visual.unit} hide={visual.hide} />}
        {visual.type === 'cylinder' && <CylinderViz r={visual.r} h={visual.h} unit={visual.unit} label={visual.label} />}
        {visual.type === 'plan' && <PlanViz w={visual.w} h={visual.h} scale={visual.scale} unit={visual.unit} hide={visual.hide} />}
        {visual.type === 'ratio' && <RatioViz parts={visual.parts} unit={visual.unit} known={visual.known} ask={visual.ask} />}
        {visual.type === 'pairrule' && <PairRuleViz a={visual.a} b={visual.b} />}
        {visual.type === 'ftri' && <FormulaTriViz top={visual.top} left={visual.left} right={visual.right} known={visual.known} ask={visual.ask} />}
        {visual.type === 'flowtank' && <FlowTankViz capacity={visual.capacity} rate={visual.rate} minutes={visual.minutes} ask={visual.ask} />}
        {visual.type === 'chain' && <ChainViz start={visual.start} factors={visual.factors} result={visual.result} />}
        {visual.type === 'caliper' && <CaliperViz value={visual.value} />}
        {visual.type === 'micrometer' && <MicrometerViz value={visual.value} />}
        {visual.type === 'fit' && <FitViz nominal={visual.nominal} tol={visual.tol} measured={visual.measured} unit={visual.unit} />}
        {visual.type === 'feeler' && <FeelerViz blades={visual.blades} />}
        {visual.type === 'thread' && <ThreadViz pitch={visual.pitch} length={visual.length} unit={visual.unit} />}
        {visual.type === 'bolt' && <BoltViz thread={visual.thread} flats={visual.flats} hide={visual.hide} />}
        {visual.type === 'stack' && <StackViz parts={visual.parts} />}
        {visual.type === 'card' && <CardViz title={visual.title} lines={visual.lines} />}
        {visual.type === 'digits' && <DigitsViz value={visual.value} sig={visual.sig} />}
        {visual.type === 'hang' && <HangViz mass={visual.mass} unit={visual.unit} show={visual.show} />}
        {visual.type === 'torque' && <TorqueViz force={visual.force} arm={visual.arm} unit={visual.unit} hide={visual.hide} />}
        {visual.type === 'lever' && <LeverViz f1={visual.f1} d1={visual.d1} f2={visual.f2} d2={visual.d2} hide={visual.hide} />}
        {visual.type === 'piston' && <PistonViz force={visual.force} area={visual.area} />}
        {visual.type === 'head' && <HeadViz height={visual.height} unit={visual.unit} hide={visual.hide} />}
        {visual.type === 'push' && <PushViz force={visual.force} distance={visual.distance} hide={visual.hide} />}
        {visual.type === 'circuit' && <CircuitViz v={visual.v} i={visual.i} r={visual.r} ask={visual.ask} />}
        {visual.type === 'expand' && <ExpandViz length={visual.length} dT={visual.dT} material={visual.material} growth={visual.growth} />}
        {visual.type === 'pipesection' && <PipeSectionViz od={visual.od} id={visual.id} nominal={visual.nominal} ask={visual.ask} />}
        {visual.type === 'piperoute' && <PipeRouteViz cc={visual.cc} takeoffs={visual.takeoffs} />}
        {visual.type === 'route' && <RouteViz segs={visual.segs} />}
        {visual.type === 'offset' && <OffsetViz offset={visual.offset} angle={visual.angle} hide={visual.hide} />}
        {visual.type === 'oddsbar' && <OddsBarViz a={visual.a} b={visual.b} />}
        {visual.type === 'counttree' && <CountTreeViz levels={visual.levels} />}
        {visual.type === 'dicegrid' && <DiceGridViz total={visual.total} />}
        {visual.type === 'tree' && <TreeViz root={visual.root} branches={visual.branches} />}
        {visual.type === 'table2' && <Table2Viz rows={visual.rows} cols={visual.cols} n={visual.n} highlightRow={visual.highlightRow} highlightCol={visual.highlightCol} />}
        {visual.type === 'dots' && <DotsViz values={visual.values} mean={visual.mean} sd={visual.sd} />}
        {visual.type === 'lln' && <LlnViz p={visual.p} n={visual.n} />}
        {visual.type === 'bell' && <BellViz z={visual.z} shade={visual.shade} mu={visual.mu} sigma={visual.sigma} />}
        {visual.type === 'bars' && <BarsViz title={visual.title} values={visual.values} highlight={visual.highlight} highlightFrom={visual.highlightFrom} highlightTo={visual.highlightTo} />}
        {visual.type === 'scatter' && <ScatterViz a={visual.a} b={visual.b} x={visual.x} x2={visual.x2} />}
        {visual.type === 'logistic' && <LogisticViz z={visual.z} />}
        {visual.type === 'matrix' && <MatrixViz rows={visual.rows} vec={visual.vec} label={visual.label} />}
        {visual.type === 'elo' && <EloViz diff={visual.diff} />}
        {visual.type === 'markov' && <MarkovViz states={visual.states} p={visual.p} q={visual.q} />}
        {visual.type === 'walk' && <WalkViz p={visual.p} steps={visual.steps} />}
        {visual.type === 'hist' && <HistViz p={visual.p} sims={visual.sims} />}
        {visual.type === 'kelly' && <KellyViz p={visual.p} b={visual.b} />}
        {visual.type === 'solid' && <SolidViz parts={visual.parts} ghost={visual.ghost} unit={visual.unit} showLabels={visual.showLabels} />}
        {visual.type === 'pvchart' && <PvChartViz value={visual.value} shift={visual.shift} highlight={visual.highlight} />}
        {visual.type === 'areamodel' && <AreaModelViz divisor={visual.divisor} rows={visual.rows} blank={visual.blank} total={visual.total} />}
        {visual.type === 'options' && <OptionsViz items={visual.items} note={visual.note} />}
        {visual.type === 'fracbar' && <FracBarViz fracs={visual.fracs} into={visual.into} op={visual.op} />}
        {visual.type === 'grid' && <GridViz points={visual.points} line={visual.line} markX={visual.markX} range={visual.range} />}
        {visual.type === 'trirat' && <TriRatViz opp={visual.opp} adj={visual.adj} hyp={visual.hyp} theta={visual.theta} unit={visual.unit} />}
        {visual.type === 'plot' && <PlotViz range={visual.range} layers={visual.layers} w={visual.w} h={visual.h} />}
        {visual.type === 'unitcircle' && <UnitCircleCanvas angle={visual.angle} showCoords={visual.showCoords} radians={visual.radians} />}
        {visual.type === 'numline' && <NumLineViz min={visual.min} max={visual.max} step={visual.step} points={visual.points} ray={visual.ray} segment={visual.segment} jumps={visual.jumps} />}
        {visual.type === 'geo' && <GeoViz items={visual.items} w={visual.w} h={visual.h} />}
        {visual.type === 'mat' && <MatViz mats={visual.mats} ops={visual.ops} />}
        {caption && <div className="caption">{labeled(caption)}</div>}
      </div>
    </div>
  );
}

function ArrayViz({ rows, cols, highlightRows, highlightCols }: { rows: number; cols: number; highlightRows?: number; highlightCols?: number }) {
  const cell = cols > 10 || rows > 10 ? 16 : 22;
  const r = cell * 0.32;
  const w = cols * cell + 8; const h = rows * cell + 8;
  const dots = [];
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
    const hl = (highlightRows !== undefined && i < highlightRows) || (highlightCols !== undefined && j < highlightCols);
    dots.push(<circle key={`${i}-${j}`} cx={4 + j * cell + cell / 2} cy={4 + i * cell + cell / 2} r={r} fill={hl ? '#2dd4bf' : highlightRows !== undefined ? '#ffb347' : '#ffb347'} opacity={0.95} style={{ filter: 'drop-shadow(0 0 3px rgba(255,179,71,0.6))' }} />);
  }
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={Math.min(w, 360)} role="img" aria-label={`${rows} rows of ${cols}`}>
      <rect x="0.5" y="0.5" width={w - 1} height={h - 1} rx="6" fill="rgba(0,0,0,0.35)" stroke="rgba(201,162,39,0.35)" />
      {highlightRows !== undefined && highlightRows < rows && <line x1="4" x2={w - 4} y1={4 + highlightRows * cell} y2={4 + highlightRows * cell} stroke="#e5e7eb" strokeDasharray="4 3" />}
      {highlightCols !== undefined && highlightCols < cols && <line y1="4" y2={h - 4} x1={4 + highlightCols * cell} x2={4 + highlightCols * cell} stroke="#e5e7eb" strokeDasharray="4 3" />}
      {dots}
    </svg>
  );
}

function GroupsViz({ groups, per }: { groups: number; per: number }) {
  const cols = Math.ceil(Math.sqrt(per)); const rows = Math.ceil(per / cols);
  const dot = 9; const pad = 6; const gw = cols * dot + pad * 2; const gh = rows * dot + pad * 2 + 6;
  const perRow = Math.min(groups, 6); const gRows = Math.ceil(groups / perRow);
  const w = perRow * (gw + 8); const h = gRows * (gh + 8);
  const items = [];
  for (let g = 0; g < groups; g++) {
    const gx = (g % perRow) * (gw + 8); const gy = Math.floor(g / perRow) * (gh + 8);
    items.push(<rect key={`g${g}`} x={gx + 1} y={gy + 1} width={gw - 2} height={gh - 2} rx="6" fill="rgba(45,212,191,0.08)" stroke="rgba(45,212,191,0.5)" />);
    for (let k = 0; k < per; k++) {
      items.push(<circle key={`g${g}-${k}`} cx={gx + pad + (k % cols) * dot + dot / 2} cy={gy + pad + 4 + Math.floor(k / cols) * dot + dot / 2} r={dot * 0.34} fill="#ffb347" />);
    }
  }
  return <svg viewBox={`0 0 ${w} ${h}`} width={Math.min(w * 1.4, 420)} role="img" aria-label={`${groups} groups of ${per}`}>{items}</svg>;
}

function NumberLine({ step, count, max }: { step: number; count: number; max: number }) {
  const top = Math.max(max, step * count, 10);
  const w = 360; const pad = 16; const scale = (w - pad * 2) / top;
  const ticks = [];
  const every = top > 60 ? Math.ceil(top / 12) : top > 20 ? 5 : 1;
  for (let v = 0; v <= top; v += every) ticks.push(<g key={v}><line x1={pad + v * scale} x2={pad + v * scale} y1="26" y2="34" stroke="#94a3b8" /><text x={pad + v * scale} y="48" fontSize="9" fill="#94a3b8" textAnchor="middle">{v}</text></g>);
  const jumps = [];
  for (let i = 0; i < count; i++) {
    const x1 = pad + i * step * scale; const x2 = pad + (i + 1) * step * scale;
    jumps.push(<path key={i} d={`M${x1} 30 Q ${(x1 + x2) / 2} 4 ${x2} 30`} fill="none" stroke="#2dd4bf" strokeWidth="2" />);
  }
  return (
    <svg viewBox={`0 0 ${w} 54`} width={w} role="img" aria-label="number line">
      <line x1={pad} x2={w - pad} y1="30" y2="30" stroke="#e5e7eb" strokeWidth="2" />
      {ticks}{jumps}
    </svg>
  );
}

function ShareViz({ total, groups }: { total: number; groups: number }) {
  const per = Math.floor(total / groups);
  const cols = Math.ceil(Math.sqrt(per)); const rows = Math.ceil(per / cols);
  const dot = 9; const pad = 6; const gw = cols * dot + pad * 2; const gh = rows * dot + pad * 2 + 6;
  const perRow = Math.min(groups, 6); const gRows = Math.ceil(groups / perRow);
  const w = perRow * (gw + 8); const h = gRows * (gh + 8) + 18;
  const items = [<text key="t" x={w / 2} y="12" fontSize="10" fill="#94a3b8" textAnchor="middle">{total} shared into {groups} equal groups</text>];
  for (let g = 0; g < groups; g++) {
    const gx = (g % perRow) * (gw + 8); const gy = 18 + Math.floor(g / perRow) * (gh + 8);
    items.push(<rect key={`g${g}`} x={gx + 1} y={gy + 1} width={gw - 2} height={gh - 2} rx="6" fill="rgba(167,139,250,0.08)" stroke="rgba(167,139,250,0.5)" />);
    for (let k = 0; k < per; k++) items.push(<circle key={`g${g}-${k}`} cx={gx + pad + (k % cols) * dot + dot / 2} cy={gy + pad + 4 + Math.floor(k / cols) * dot + dot / 2} r={dot * 0.34} fill="#ffb347" />);
  }
  return <svg viewBox={`0 0 ${w} ${h}`} width={Math.min(w * 1.4, 420)} role="img" aria-label={`${total} shared among ${groups}`}>{items}</svg>;
}

function BondViz({ total, part }: { total: number; part: number }) {
  const w = 340; const h = 64; const pad = 10; const bw = w - pad * 2;
  const pw = (part / total) * bw;
  if (total <= 10) {
    // Ten-frame style dots.
    const cols = total <= 5 ? total : 5; const rows = Math.ceil(total / cols); const cell = 30;
    const W = cols * cell + 8; const H = rows * cell + 8;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width={Math.min(W * 1.4, 240)} role="img" aria-label={`${part} of ${total} filled`}>
        <rect x="0.5" y="0.5" width={W - 1} height={H - 1} rx="6" fill="rgba(0,0,0,0.35)" stroke="rgba(45,212,191,0.4)" />
        {Array.from({ length: total }, (_, i) => <circle key={i} cx={4 + (i % cols) * cell + cell / 2} cy={4 + Math.floor(i / cols) * cell + cell / 2} r={cell * 0.34} fill={i < part ? '#ffb347' : 'rgba(255,255,255,0.08)'} stroke={i < part ? 'none' : 'rgba(255,255,255,0.25)'} strokeDasharray={i < part ? undefined : '3 2'} />)}
      </svg>
    );
  }
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={Math.min(w, 360)} role="img" aria-label={`${part} plus ? makes ${total}`}>
      <rect x={pad} y="14" width={bw} height="28" rx="6" fill="rgba(255,255,255,0.06)" stroke="rgba(45,212,191,0.5)" />
      <rect x={pad} y="14" width={pw} height="28" rx="6" fill="#ffb347" />
      <text x={pad + pw / 2} y="33" fontSize="13" fill="#1a1405" textAnchor="middle" fontWeight="700">{part}</text>
      <text x={pad + pw + (bw - pw) / 2} y="33" fontSize="15" fill="#2dd4bf" textAnchor="middle" fontWeight="700">?</text>
      <text x={w / 2} y="58" fontSize="11" fill="#94a3b8" textAnchor="middle">whole = {total}</text>
    </svg>
  );
}

/** A balance scale: both pans hold the same weight. The unknown sits in a glowing box. */
function BalanceViz({ left, right, unknown }: { left: string; right: string; unknown: string }) {
  const pan = (label: string, x: number) => {
    const parts = label.split(/\s(?=[+−])|(?<=[+−])\s/).join(' ').split(' ');
    return (
      <g>
        <line x1={x} x2={x} y1="44" y2="62" stroke="#94a3b8" strokeWidth="2" />
        <path d={`M${x - 46} 62 Q ${x} 84 ${x + 46} 62 Z`} fill="rgba(201,162,39,0.25)" stroke="#c9a227" strokeWidth="2" />
        {parts.map((p, i) => {
          const isUnknown = p.includes(unknown);
          const w = 26 + p.length * 6; const cx = x - ((parts.length - 1) * 34) / 2 + i * 34;
          return (
            <g key={i}>
              <rect x={cx - w / 2} y="30" width={w} height="26" rx="6" fill={isUnknown ? 'rgba(45,212,191,0.2)' : 'rgba(255,179,71,0.2)'} stroke={isUnknown ? '#2dd4bf' : '#ffb347'} strokeWidth="1.5" />
              <text x={cx} y="48" fontSize="14" fontWeight="700" fill="#e5e7eb" textAnchor="middle">{p}</text>
            </g>
          );
        })}
      </g>
    );
  };
  return (
    <svg viewBox="0 0 360 100" width="340" role="img" aria-label={`${left} balances ${right}`}>
      <rect x="170" y="86" width="20" height="10" rx="2" fill="#6b7280" />
      <line x1="60" x2="300" y1="44" y2="44" stroke="#c9a227" strokeWidth="4" strokeLinecap="round" />
      <line x1="180" x2="180" y1="44" y2="88" stroke="#6b7280" strokeWidth="4" />
      <circle cx="180" cy="44" r="6" fill="#c9a227" />
      {pan(left, 100)}{pan(right, 260)}
      <text x="180" y="20" fontSize="11" fill="#94a3b8" textAnchor="middle">same weight on both sides</text>
    </svg>
  );
}

/** Bar model (part / whole / compare): the picture that shows which operation a word problem needs. */
function BarViz({ bars, whole }: { bars: { label?: string; parts: (number | '?')[] }[]; whole?: number | '?' }) {
  // Size every part; an unknown part gets the leftover of the whole, or the mean of the known parts.
  const sized = bars.map((b) => {
    const known = b.parts.filter((p): p is number => typeof p === 'number');
    const total = typeof whole === 'number' ? whole : undefined;
    const mean = known.length ? known.reduce((a, c) => a + c, 0) / known.length : 10;
    const unknowns = b.parts.filter((p) => p === '?').length;
    const leftover = total !== undefined ? Math.max(1, (total - known.reduce((a, c) => a + c, 0)) / Math.max(1, unknowns)) : mean;
    return { label: b.label, parts: b.parts.map((p) => ({ v: p, w: typeof p === 'number' ? Math.max(p, 1) : leftover })) };
  });
  const max = Math.max(...sized.map((b) => b.parts.reduce((a, p) => a + p.w, 0)), 1);
  const W = 360; const H = 30; const gap = 14; const left = bars.some((b) => b.label) ? 54 : 6;
  const scale = (W - left - 8) / max;
  const rows = sized.map((b, i) => {
    let x = left; const y = (whole !== undefined ? 22 : 4) + i * (H + gap);
    const cells = b.parts.map((p, j) => {
      const w = p.w * scale; const el = (
        <g key={j}>
          <rect x={x} y={y} width={Math.max(2, w - 2)} height={H} rx="5" fill={p.v === '?' ? 'rgba(45,212,191,0.18)' : 'rgba(255,179,71,0.28)'} stroke={p.v === '?' ? '#2dd4bf' : '#ffb347'} strokeDasharray={p.v === '?' ? '5 3' : undefined} />
          {w > 18 && <text x={x + w / 2 - 1} y={y + H / 2 + 5} textAnchor="middle" fontSize="13" fill={p.v === '?' ? '#99f6e4' : '#fde68a'} fontFamily="var(--font-mono)">{p.v}</text>}
        </g>
      ); x += w; return el;
    });
    return (
      <g key={i}>
        {b.label && <text x={left - 8} y={y + H / 2 + 5} textAnchor="end" fontSize="12" fill="#cbd5e1">{b.label}</text>}
        {cells}
      </g>
    );
  });
  const totalW = sized[0].parts.reduce((a, p) => a + p.w, 0) * scale;
  const height = (whole !== undefined ? 22 : 4) + sized.length * (H + gap) - gap + 6;
  return (
    <svg viewBox={`0 0 ${W} ${height}`} width={Math.min(W, 420)} role="img" aria-label="bar model">
      {whole !== undefined && (
        <g>
          <path d={`M ${left} 14 L ${left} 8 L ${left + totalW - 2} 8 L ${left + totalW - 2} 14`} fill="none" stroke="#cbd5e1" />
          <rect x={left + totalW / 2 - 24} y={0} width={48} height={16} rx="4" fill="#0b1020" />
          <text x={left + totalW / 2} y={12} textAnchor="middle" fontSize="12" fill={whole === '?' ? '#99f6e4' : '#e5e7eb'} fontFamily="var(--font-mono)">{whole}</text>
        </g>
      )}
      {rows}
    </svg>
  );
}

/** Number line with labelled hops: the picture of a mental-math move (43 → +20 → +5). */
function JumpsViz({ from, jumps }: { from: number; jumps: number[] }) {
  const points = [from]; for (const j of jumps) points.push(points[points.length - 1] + j);
  const lo = Math.min(...points); const hi = Math.max(...points);
  const span = Math.max(10, hi - lo); const pad = span * 0.08;
  const W = 380; const left = 18; const right = 18; const y = 58;
  const x = (v: number) => left + ((v - (lo - pad)) / (span + pad * 2)) * (W - left - right);
  const ticks = [];
  const step = span > 60 ? 10 : span > 25 ? 5 : 1;
  for (let v = Math.ceil((lo - pad) / step) * step; v <= hi + pad; v += step) ticks.push(v);
  return (
    <svg viewBox={`0 0 ${W} 96`} width={Math.min(W, 420)} role="img" aria-label={`number line from ${from}: ${jumps.map((j) => (j >= 0 ? `+${j}` : `${j}`)).join(', ')}`}>
      <line x1={left} x2={W - right} y1={y} y2={y} stroke="#94a3b8" strokeWidth="1.5" />
      {ticks.map((v) => <g key={v}><line x1={x(v)} x2={x(v)} y1={y - (v % 10 === 0 ? 6 : 3)} y2={y + (v % 10 === 0 ? 6 : 3)} stroke="#94a3b8" />{v % 10 === 0 && !points.includes(v) && <text x={x(v)} y={y + 20} textAnchor="middle" fontSize="10" fill="#94a3b8" fontFamily="var(--font-mono)">{v}</text>}</g>)}
      {jumps.map((j, i) => {
        const a = points[i]; const b = points[i + 1]; const xa = x(a); const xb = x(b); const up = j >= 0; const h = Math.min(34, 12 + Math.abs(xb - xa) * 0.25);
        const cy = up ? y - h : y + h + 14;
        return (
          <g key={i}>
            <path d={`M ${xa} ${y} Q ${(xa + xb) / 2} ${cy} ${xb} ${y}`} fill="none" stroke={up ? '#2dd4bf' : '#f97316'} strokeWidth="2" markerEnd="url(#arrow)" />
            <text x={(xa + xb) / 2} y={up ? cy + 4 : cy - 4} textAnchor="middle" fontSize="12" fill={up ? '#99f6e4' : '#fed7aa'} fontFamily="var(--font-mono)">{j >= 0 ? `+${j}` : `${j}`}</text>
          </g>
        );
      })}
      {points.map((p, i) => {
        // Label the ends always, and an intermediate point only when it will not collide with its neighbours.
        const isEnd = i === 0 || i === points.length - 1;
        const room = points.every((q, j) => j === i || Math.abs(x(q) - x(p)) > 30 || (j > i && j !== points.length - 1));
        const show = isEnd || room;
        return (
          <g key={`p${i}`}>
            <circle cx={x(p)} cy={y} r="4" fill={i === 0 ? '#ffb347' : i === points.length - 1 ? '#4ade80' : '#e5e7eb'} />
            {show && <text x={x(p)} y={y + 34} textAnchor="middle" fontSize="12" fill={i === points.length - 1 ? '#bbf7d0' : '#fde68a'} fontFamily="var(--font-mono)" fontWeight="700">{p}</text>}
          </g>
        );
      })}
      <defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#cbd5e1" /></marker></defs>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Volume                                                              */
/* ------------------------------------------------------------------ */

/** Isometric projection helpers: grid (i right-down, j left-down, k up) → screen. */
const ISO = { a: 0.866, b: 0.5 };
function isoPoint(i: number, j: number, k: number, s: number, ox: number, oy: number): [number, number] {
  return [ox + (i - j) * s * ISO.a, oy + (i + j) * s * ISO.b - k * s];
}
const poly = (pts: [number, number][]) => pts.map((p) => p.map((n) => n.toFixed(1)).join(',')).join(' ');

/** One unit cube's three visible faces (top, left, right). */
function IsoCube({ i, j, k, s, ox, oy, colors, stroke = '#0f172a' }: { i: number; j: number; k: number; s: number; ox: number; oy: number; colors: [string, string, string]; stroke?: string }) {
  const P = (di: number, dj: number, dk: number) => isoPoint(i + di, j + dj, k + dk, s, ox, oy);
  const top = [P(0, 0, 1), P(1, 0, 1), P(1, 1, 1), P(0, 1, 1)];
  const left = [P(0, 1, 0), P(1, 1, 0), P(1, 1, 1), P(0, 1, 1)];
  const right = [P(1, 0, 0), P(1, 1, 0), P(1, 1, 1), P(1, 0, 1)];
  return (
    <g>
      <polygon points={poly(top)} fill={colors[0]} stroke={stroke} strokeWidth="0.8" strokeLinejoin="round" />
      <polygon points={poly(left)} fill={colors[1]} stroke={stroke} strokeWidth="0.8" strokeLinejoin="round" />
      <polygon points={poly(right)} fill={colors[2]} stroke={stroke} strokeWidth="0.8" strokeLinejoin="round" />
    </g>
  );
}

function isoFrame(l: number, w: number, h: number, W: number) {
  const widthUnits = (l + w) * ISO.a; const heightUnits = (l + w) * ISO.b + h;
  const s = Math.min(34, (W - 40) / widthUnits, 150 / heightUnits);
  const ox = W / 2 + ((w - l) * s * ISO.a) / 2; const oy = 14 + h * s;
  const H = Math.ceil(oy + (l + w) * s * ISO.b + 26);
  return { s, ox, oy, H };
}

/** A stack of unit cubes; the bottom layer is tinted so "one layer" is easy to see. */
function CubesViz({ l, w, h }: { l: number; w: number; h: number }) {
  const W = 360; const { s, ox, oy, H } = isoFrame(l, w, h, W);
  const cubes: { i: number; j: number; k: number }[] = [];
  for (let k = 0; k < h; k++) for (let j = 0; j < w; j++) for (let i = 0; i < l; i++) cubes.push({ i, j, k });
  cubes.sort((p, q) => (p.i + p.j) - (q.i + q.j) || p.k - q.k);
  const base: [string, string, string] = ['#fde68a', '#d97706', '#f59e0b'];
  const upper: [string, string, string] = ['#a5f3fc', '#0e7490', '#06b6d4'];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={Math.min(W, 420)} role="img" aria-label={`a stack of cubes ${l} by ${w} by ${h}`}>
      {cubes.map((c) => <IsoCube key={`${c.i}-${c.j}-${c.k}`} {...c} s={s} ox={ox} oy={oy} colors={c.k === 0 ? base : upper} />)}
      <text x={12} y={H - 8} fontSize="11" fill="#fde68a" fontFamily="var(--font-mono)">bottom layer</text>
      <text x={W - 12} y={H - 8} fontSize="11" fill="#a5f3fc" fontFamily="var(--font-mono)" textAnchor="end">{h} layer{h === 1 ? '' : 's'} high</text>
    </svg>
  );
}

/** A labelled box drawn as one solid with dimension lines; `hide` shows a "?" on that side. */
function BoxViz({ l, w, h, unit, hide }: { l: number; w: number; h: number; unit: string; hide?: 'l' | 'w' | 'h' }) {
  const W = 360; const { s, ox, oy, H } = isoFrame(l, w, h, W);
  const P = (i: number, j: number, k: number) => isoPoint(i, j, k, s, ox, oy);
  const top = [P(0, 0, h), P(l, 0, h), P(l, w, h), P(0, w, h)];
  const left = [P(0, w, 0), P(l, w, 0), P(l, w, h), P(0, w, h)];
  const right = [P(l, 0, 0), P(l, w, 0), P(l, w, h), P(l, 0, h)];
  const lbl = (which: 'l' | 'w' | 'h', v: number) => (hide === which ? '?' : `${v} ${unit}`);
  const [lx1, ly1] = P(0, w, 0); const [lx2, ly2] = P(l, w, 0); // length edge (front-left bottom)
  const [wx1, wy1] = P(l, 0, 0); const [wx2, wy2] = P(l, w, 0); // width edge (front-right bottom)
  const [hx1, hy1] = P(l, w, 0); const [hx2, hy2] = P(l, w, h); // height edge (front vertical)
  const dim = (x1: number, y1: number, x2: number, y2: number, dx: number, dy: number, text: string, anchor: 'start' | 'middle' | 'end') => (
    <g>
      <line x1={x1 + dx} y1={y1 + dy} x2={x2 + dx} y2={y2 + dy} stroke="#e5e7eb" strokeWidth="1" />
      <line x1={x1} y1={y1} x2={x1 + dx} y2={y1 + dy} stroke="#e5e7eb" strokeWidth="0.6" strokeDasharray="2 2" />
      <line x1={x2} y1={y2} x2={x2 + dx} y2={y2 + dy} stroke="#e5e7eb" strokeWidth="0.6" strokeDasharray="2 2" />
      <text x={(x1 + x2) / 2 + dx * 1.9} y={(y1 + y2) / 2 + dy * 1.9 + 4} fontSize="12" fontWeight="700" fill={text === '?' ? '#f472b6' : '#fde68a'} fontFamily="var(--font-mono)" textAnchor={anchor}>{text}</text>
    </g>
  );
  // faint unit grid on the top face so the sides are countable
  const grid: JSX.Element[] = [];
  if (l <= 15 && w <= 15) {
    for (let i = 1; i < l; i++) { const [x1, y1] = P(i, 0, h); const [x2, y2] = P(i, w, h); grid.push(<line key={`gi${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#0f172a" strokeOpacity="0.25" strokeWidth="0.6" />); }
    for (let j = 1; j < w; j++) { const [x1, y1] = P(0, j, h); const [x2, y2] = P(l, j, h); grid.push(<line key={`gj${j}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#0f172a" strokeOpacity="0.25" strokeWidth="0.6" />); }
  }
  return (
    <svg viewBox={`0 0 ${W} ${H + 10}`} width={Math.min(W, 420)} role="img" aria-label={`a box ${lbl('l', l)} by ${lbl('w', w)} by ${lbl('h', h)}`}>
      <polygon points={poly(top)} fill="#67e8f9" stroke="#0f172a" strokeWidth="1" strokeLinejoin="round" />
      <polygon points={poly(left)} fill="#0e7490" stroke="#0f172a" strokeWidth="1" strokeLinejoin="round" />
      <polygon points={poly(right)} fill="#06b6d4" stroke="#0f172a" strokeWidth="1" strokeLinejoin="round" />
      {grid}
      {dim(lx1, ly1, lx2, ly2, -8, 10, lbl('l', l), 'middle')}
      {dim(wx1, wy1, wx2, wy2, 12, 10, lbl('w', w), 'start')}
      {dim(hx1, hy1, hx2, hy2, 26, 0, lbl('h', h), 'start')}
    </svg>
  );
}

/** A measuring jug with a scale: labels every `major`, `divisions` marks between labels, filled to `level`. */
function Jug({ x, capacity, major, divisions, level, unit, fill, title, drop }: { x: number; capacity: number; major: number; divisions: number; level: number; unit: string; fill: string; title?: string; drop?: boolean }) {
  const top = 18; const bottom = 168; const left = x; const right = x + 96; const innerH = bottom - top;
  const y = (v: number) => bottom - (v / capacity) * innerH;
  const step = major / divisions; const n = Math.round(capacity / step);
  const marks: JSX.Element[] = [];
  for (let m = 0; m <= n; m++) {
    const v = m * step; const isMajor = m % divisions === 0; const yy = y(v);
    marks.push(<line key={`m${m}`} x1={right - (isMajor ? 22 : 12)} x2={right} y1={yy} y2={yy} stroke="#e5e7eb" strokeWidth={isMajor ? 1.4 : 0.8} />);
    if (isMajor) marks.push(<text key={`t${m}`} x={right - 26} y={yy + 4} fontSize="10" fill="#e5e7eb" fontFamily="var(--font-mono)" textAnchor="end" stroke="#0f172a" strokeWidth="3" paintOrder="stroke">{v}</text>);
  }
  const ly = y(level);
  return (
    <g>
      {title && <text x={(left + right) / 2} y={12} fontSize="11" fill="#fde68a" fontFamily="var(--font-mono)" textAnchor="middle" fontWeight="700">{title}</text>}
      <rect x={left} y={ly} width={right - left} height={bottom - ly} fill={fill} opacity="0.85" />
      <line x1={left} x2={right} y1={ly} y2={ly} stroke="#bae6fd" strokeWidth="2" />
      {drop && <ellipse cx={(left + right) / 2} cy={bottom - 12} rx="14" ry="9" fill="#78716c" stroke="#292524" strokeWidth="1" />}
      {marks}
      <path d={`M ${left} ${top - 4} L ${left} ${bottom} Q ${left} ${bottom + 8} ${left + 8} ${bottom + 8} L ${right - 8} ${bottom + 8} Q ${right} ${bottom + 8} ${right} ${bottom} L ${right} ${top - 4}`} fill="none" stroke="#cbd5e1" strokeWidth="2.5" />
      <path d={`M ${left} ${top + 2} l -10 6 l 10 6`} fill="none" stroke="#cbd5e1" strokeWidth="2" />
      <text x={right + 2} y={bottom + 20} fontSize="10" fill="#94a3b8" fontFamily="var(--font-mono)" textAnchor="end">{unit}</text>
    </g>
  );
}

function BeakerViz({ capacity, major, divisions, level, unit }: { capacity: number; major: number; divisions: number; level: number; unit: string }) {
  const W = 200; const H = 196;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={Math.min(W, 260)} role="img" aria-label={`a measuring jug filled to ${level} ${unit}`}>
      <Jug x={60} capacity={capacity} major={major} divisions={divisions} level={level} unit={unit} fill="#38bdf8" />
    </svg>
  );
}

function DisplaceViz({ capacity, major, divisions, before, after, unit }: { capacity: number; major: number; divisions: number; before: number; after: number; unit: string }) {
  const W = 340; const H = 196;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={Math.min(W, 400)} role="img" aria-label={`two jugs: ${before} ${unit} before, ${after} ${unit} after dropping the object in`}>
      <Jug x={40} capacity={capacity} major={major} divisions={divisions} level={before} unit={unit} fill="#38bdf8" title="BEFORE" />
      <path d="M 150 92 L 186 92" stroke="#fde68a" strokeWidth="2" markerEnd="url(#arrow)" />
      <ellipse cx={168} cy={70} rx="12" ry="8" fill="#78716c" stroke="#292524" strokeWidth="1" />
      <Jug x={204} capacity={capacity} major={major} divisions={divisions} level={after} unit={unit} fill="#38bdf8" title="AFTER" drop />
      <defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#cbd5e1" /></marker></defs>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Measurement                                                         */
/* ------------------------------------------------------------------ */

const MONO = 'var(--font-mono)';

/** A ruler: cm with mm marks, or inches split into eighths/sixteenths. Object drawn above it from start to end (smallest unit). */
function RulerViz({ unit, length, start, end, divisions = 8, label }: { unit: 'cm' | 'in'; length: number; start: number; end: number; divisions?: 8 | 16; label?: string }) {
  const W = 380; const H = 118; const left = 16; const right = W - 16; const base = 96; const topR = 60;
  const per = unit === 'cm' ? 10 : divisions; const total = length * per;
  const x = (v: number) => left + (v / total) * (right - left);
  const ticks: JSX.Element[] = [];
  for (let v = 0; v <= total; v++) {
    let h = 5; let stroke = 1;
    if (unit === 'cm') { if (v % 10 === 0) { h = 16; stroke = 1.6; } else if (v % 5 === 0) h = 10; }
    else { const q = v % per; if (q === 0) { h = 18; stroke = 1.8; } else if (q % (per / 2) === 0) { h = 14; stroke = 1.5; } else if (q % (per / 4) === 0) { h = 10; stroke = 1.2; } else if (q % (per / 8) === 0) h = 7; else { h = 4; stroke = 0.8; } }
    ticks.push(<line key={v} x1={x(v)} x2={x(v)} y1={base} y2={base - h} stroke="#1f2937" strokeWidth={stroke} />);
    if (v % per === 0) ticks.push(<text key={`t${v}`} x={x(v)} y={base - 20} fontSize="11" fontWeight="700" fill="#1f2937" fontFamily={MONO} textAnchor="middle">{v / per}</text>);
  }
  const ox1 = x(start); const ox2 = x(end);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={Math.min(W, 440)} role="img" aria-label={`a ${unit} ruler with an object from ${start} to ${end}`}>
      <rect x={left - 8} y={topR} width={right - left + 16} height={base - topR + 10} rx="3" fill="#fde68a" stroke="#a16207" strokeWidth="1.5" />
      {ticks}
      <text x={right + 4} y={base + 6} fontSize="9" fill="#78350f" fontFamily={MONO} textAnchor="end">{unit}</text>
      <line x1={ox1} x2={ox1} y1={22} y2={base - 2} stroke="#f472b6" strokeWidth="1" strokeDasharray="3 2" />
      <line x1={ox2} x2={ox2} y1={22} y2={base - 2} stroke="#f472b6" strokeWidth="1" strokeDasharray="3 2" />
      <rect x={ox1} y={26} width={Math.max(2, ox2 - ox1)} height={22} rx="4" fill="#94a3b8" stroke="#334155" strokeWidth="1.5" />
      <rect x={ox1 + 2} y={30} width={Math.max(1, ox2 - ox1 - 4)} height={5} rx="2" fill="#e2e8f0" opacity="0.6" />
      {label && <text x={(ox1 + ox2) / 2} y={16} fontSize="11" fill="#fde68a" fontFamily={MONO} textAnchor="middle">{label}</text>}
    </svg>
  );
}

/** A round dial: 270° sweep, labels at every `major`, minor ticks, a needle at `value`. */
function DialViz({ max, major, divisions, value, unit }: { max: number; major: number; divisions: number; value: number; unit: string }) {
  const W = 220; const H = 190; const cx = 110; const cy = 100; const R = 82;
  const ang = (v: number) => (-225 + (v / max) * 270) * (Math.PI / 180);
  const pt = (v: number, r: number): [number, number] => [cx + r * Math.cos(ang(v)), cy + r * Math.sin(ang(v))];
  const step = major / divisions; const n = Math.round(max / step);
  const ticks: JSX.Element[] = [];
  for (let m = 0; m <= n; m++) {
    const v = m * step; const isMajor = m % divisions === 0;
    const [x1, y1] = pt(v, R); const [x2, y2] = pt(v, R - (isMajor ? 14 : 7));
    ticks.push(<line key={m} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#e5e7eb" strokeWidth={isMajor ? 2 : 1} />);
    if (isMajor) { const [tx, ty] = pt(v, R - 26); ticks.push(<text key={`t${m}`} x={tx} y={ty + 4} fontSize="11" fontWeight="700" fill="#e5e7eb" fontFamily={MONO} textAnchor="middle">{v}</text>); }
  }
  const [nx, ny] = pt(value, R - 10);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={Math.min(W, 260)} role="img" aria-label={`a dial reading ${value} ${unit}`}>
      <circle cx={cx} cy={cy} r={R + 10} fill="#111827" stroke="#9ca3af" strokeWidth="3" />
      {ticks}
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#f97316" strokeWidth="3" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="5" fill="#f97316" />
      <text x={cx} y={cy + 40} fontSize="11" fill="#9ca3af" fontFamily={MONO} textAnchor="middle">{unit}</text>
    </svg>
  );
}

/** A thermometer with a scale on the right and a red column to `value`. */
function ThermometerViz({ min, max, major, divisions, value, unit }: { min: number; max: number; major: number; divisions: number; value: number; unit: string }) {
  const W = 160; const H = 200; const top = 16; const bottom = 160; const tx = 56;
  const y = (v: number) => bottom - ((v - min) / (max - min)) * (bottom - top);
  const step = major / divisions; const n = Math.round((max - min) / step);
  const ticks: JSX.Element[] = [];
  for (let m = 0; m <= n; m++) {
    const v = min + m * step; const isMajor = m % divisions === 0; const yy = y(v);
    ticks.push(<line key={m} x1={tx + 12} x2={tx + 12 + (isMajor ? 14 : 7)} y1={yy} y2={yy} stroke="#e5e7eb" strokeWidth={isMajor ? 1.4 : 0.8} />);
    if (isMajor) ticks.push(<text key={`t${m}`} x={tx + 32} y={yy + 4} fontSize="10" fill="#e5e7eb" fontFamily={MONO}>{v}</text>);
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={Math.min(W, 200)} role="img" aria-label={`a thermometer reading ${value} ${unit}`}>
      <rect x={tx - 8} y={top - 8} width={16} height={bottom - top + 8} rx="8" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2" />
      <rect x={tx - 4} y={y(value)} width={8} height={bottom - y(value) + 4} fill="#ef4444" />
      <circle cx={tx} cy={bottom + 14} r="14" fill="#ef4444" stroke="#cbd5e1" strokeWidth="2" />
      {ticks}
      <text x={tx + 32} y={bottom + 30} fontSize="10" fill="#9ca3af" fontFamily={MONO}>{unit}</text>
    </svg>
  );
}

function ClockFace({ cx, cy, minutes, title }: { cx: number; cy: number; minutes: number; title: string }) {
  const R = 44; const h = ((minutes / 60) % 12) * 30; const m = (minutes % 60) * 6;
  const hand = (deg: number, len: number, w: number, color: string) => { const a = (deg - 90) * (Math.PI / 180); return <line x1={cx} y1={cy} x2={cx + len * Math.cos(a)} y2={cy + len * Math.sin(a)} stroke={color} strokeWidth={w} strokeLinecap="round" />; };
  return (
    <g>
      <text x={cx} y={cy - R - 10} fontSize="11" fontWeight="700" fill="#fde68a" fontFamily={MONO} textAnchor="middle">{title}</text>
      <circle cx={cx} cy={cy} r={R + 4} fill="#f8fafc" stroke="#475569" strokeWidth="3" />
      {Array.from({ length: 60 }, (_, i) => { const a = (i * 6 - 90) * (Math.PI / 180); const big = i % 5 === 0; return <line key={i} x1={cx + (R - (big ? 7 : 3)) * Math.cos(a)} y1={cy + (R - (big ? 7 : 3)) * Math.sin(a)} x2={cx + R * Math.cos(a)} y2={cy + R * Math.sin(a)} stroke="#334155" strokeWidth={big ? 1.6 : 0.8} />; })}
      {Array.from({ length: 12 }, (_, i) => { const a = ((i + 1) * 30 - 90) * (Math.PI / 180); return <text key={i} x={cx + (R - 16) * Math.cos(a)} y={cy + (R - 16) * Math.sin(a) + 4} fontSize="10" fontWeight="700" fill="#1e293b" fontFamily={MONO} textAnchor="middle">{i + 1}</text>; })}
      {hand(h, R * 0.55, 3.5, '#1e293b')}
      {hand(m, R * 0.82, 2.2, '#dc2626')}
      <circle cx={cx} cy={cy} r="3" fill="#1e293b" />
    </g>
  );
}

function ClocksViz({ start, end }: { start: number; end: number }) {
  const W = 300; const H = 130;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={Math.min(W, 340)} role="img" aria-label="two clocks: start and end">
      <ClockFace cx={70} cy={72} minutes={start} title="START" />
      <path d="M 128 72 L 168 72" stroke="#fde68a" strokeWidth="2" markerEnd="url(#arrow)" />
      <ClockFace cx={230} cy={72} minutes={end} title="END" />
      <defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#cbd5e1" /></marker></defs>
    </svg>
  );
}

/** A labelled reference bar over an unlabelled target bar, drawn to the same scale. */
function RefBarViz({ refSize, refLabel, target, targetLabel, unit }: { refSize: number; refLabel: string; target: number; targetLabel: string; unit: string }) {
  const W = 380; const H = 96; const left = 16; const usable = W - 32; const longest = Math.max(refSize, target);
  const wRef = (refSize / longest) * usable; const wT = (target / longest) * usable;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={Math.min(W, 440)} role="img" aria-label={`reference ${refLabel} and a ${targetLabel} to estimate in ${unit}`}>
      <rect x={left} y={18} width={wRef} height={16} rx="4" fill="#fde68a" stroke="#a16207" strokeWidth="1.5" />
      <text x={left} y={13} fontSize="11" fill="#fde68a" fontFamily={MONO}>{refLabel}</text>
      <rect x={left} y={60} width={wT} height={16} rx="4" fill="#94a3b8" stroke="#334155" strokeWidth="1.5" />
      <text x={left} y={55} fontSize="11" fill="#e5e7eb" fontFamily={MONO}>{targetLabel}: ? {unit}</text>
      <text x={left + wT / 2} y={91} fontSize="10" fill="#94a3b8" fontFamily={MONO} textAnchor="middle">same scale</text>
    </svg>
  );
}

/** One big unit as n small ones: a divided line (dims 1), a tiled square (2) or a gridded cube (3). */
function UnitsViz({ big, small, n, dims }: { big: string; small: string; n: number; dims: 1 | 2 | 3 }) {
  const W = 380;
  const g = Math.round(Math.pow(n, 1 / dims)); const cells = g > 12 ? 10 : g; const per = g / cells; // cells drawn per side; each cell = `per` small units
  const cellLabel = per === 1 ? small : `${per} ${small}`;
  if (dims === 1) {
    const H = 70; const left = 16; const right = W - 16; const x = (i: number) => left + (i / cells) * (right - left);
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width={Math.min(W, 440)} role="img" aria-label={`1 ${big} = ${n} ${small}`}>
        <text x={left} y={14} fontSize="12" fontWeight="700" fill="#fde68a" fontFamily={MONO}>1 {big}</text>
        <rect x={left} y={22} width={right - left} height={18} rx="3" fill="#fde68a" stroke="#a16207" strokeWidth="1.5" />
        {Array.from({ length: cells - 1 }, (_, i) => <line key={i} x1={x(i + 1)} x2={x(i + 1)} y1={22} y2={40} stroke="#a16207" strokeWidth="1" />)}
        <text x={(left + right) / 2} y={58} fontSize="11" fill="#e5e7eb" fontFamily={MONO} textAnchor="middle">{cells} × {cellLabel} = {n} {small}</text>
      </svg>
    );
  }
  if (dims === 2) {
    const size = 150; const H = size + 44; const ox = (W - size) / 2; const oy = 24; const c = size / cells;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width={Math.min(W, 440)} role="img" aria-label={`1 ${big} = ${n} ${small}`}>
        <text x={ox} y={14} fontSize="12" fontWeight="700" fill="#fde68a" fontFamily={MONO}>1 {big} = {cells} × {cells} {per === 1 ? '' : `(each ${cellLabel})`}</text>
        <rect x={ox} y={oy} width={size} height={size} fill="#67e8f9" stroke="#0f172a" strokeWidth="1.5" />
        {Array.from({ length: cells - 1 }, (_, i) => <g key={i}><line x1={ox + c * (i + 1)} x2={ox + c * (i + 1)} y1={oy} y2={oy + size} stroke="#0f172a" strokeOpacity="0.5" strokeWidth="0.8" /><line y1={oy + c * (i + 1)} y2={oy + c * (i + 1)} x1={ox} x2={ox + size} stroke="#0f172a" strokeOpacity="0.5" strokeWidth="0.8" /></g>)}
        <rect x={ox} y={oy + size - c} width={c} height={c} fill="#f59e0b" stroke="#0f172a" strokeWidth="1" />
        <text x={(W) / 2} y={H - 8} fontSize="11" fill="#e5e7eb" fontFamily={MONO} textAnchor="middle">{g} × {g} = {n} {small}</text>
      </svg>
    );
  }
  const { s, ox, oy, H } = isoFrame(cells, cells, cells, W);
  const P = (i: number, j: number, k: number) => isoPoint(i, j, k, s, ox, oy);
  const lines: JSX.Element[] = [];
  for (let t = 1; t < cells; t++) {
    const seg = (a: [number, number], b: [number, number], key: string) => lines.push(<line key={key} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#0f172a" strokeOpacity="0.4" strokeWidth="0.7" />);
    seg(P(t, 0, cells), P(t, cells, cells), `ti${t}`); seg(P(0, t, cells), P(cells, t, cells), `tj${t}`);
    seg(P(t, cells, 0), P(t, cells, cells), `li${t}`); seg(P(0, cells, t), P(cells, cells, t), `lk${t}`);
    seg(P(cells, t, 0), P(cells, t, cells), `rj${t}`); seg(P(cells, 0, t), P(cells, cells, t), `rk${t}`);
  }
  return (
    <svg viewBox={`0 0 ${W} ${H + 12}`} width={Math.min(W, 440)} role="img" aria-label={`1 ${big} = ${n} ${small}`}>
      <text x={12} y={14} fontSize="12" fontWeight="700" fill="#fde68a" fontFamily={MONO}>1 {big} = {g} × {g} × {g}</text>
      <polygon points={poly([P(0, 0, cells), P(cells, 0, cells), P(cells, cells, cells), P(0, cells, cells)])} fill="#67e8f9" stroke="#0f172a" strokeWidth="1" />
      <polygon points={poly([P(0, cells, 0), P(cells, cells, 0), P(cells, cells, cells), P(0, cells, cells)])} fill="#0e7490" stroke="#0f172a" strokeWidth="1" />
      <polygon points={poly([P(cells, 0, 0), P(cells, cells, 0), P(cells, cells, cells), P(cells, 0, cells)])} fill="#06b6d4" stroke="#0f172a" strokeWidth="1" />
      {lines}
      <text x={W - 12} y={H + 4} fontSize="11" fill="#e5e7eb" fontFamily={MONO} textAnchor="end">{g} × {g} × {g} = {n} {small}{per === 1 ? '' : ` (each cell ${cellLabel})`}</text>
    </svg>
  );
}

/** A rectangle with labelled sides: a dashed fence around it (perimeter) or shaded tiles inside (area). */
function RectViz({ w, h, unit, ask, grid }: { w: number; h: number; unit: string; ask: 'perimeter' | 'area'; grid?: boolean }) {
  const W = 380; const maxW = 300; const maxH = 150; const c = Math.min(maxW / w, maxH / h);
  const rw = w * c; const rh = h * c; const ox = (W - rw) / 2; const oy = 24; const H = rh + 60;
  const lines: JSX.Element[] = [];
  if (grid || ask === 'area') for (let i = 1; i < w; i++) lines.push(<line key={`v${i}`} x1={ox + i * c} x2={ox + i * c} y1={oy} y2={oy + rh} stroke="#0f172a" strokeOpacity="0.35" strokeWidth="0.8" />);
  if (grid || ask === 'area') for (let j = 1; j < h; j++) lines.push(<line key={`h${j}`} y1={oy + j * c} y2={oy + j * c} x1={ox} x2={ox + rw} stroke="#0f172a" strokeOpacity="0.35" strokeWidth="0.8" />);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={Math.min(W, 440)} role="img" aria-label={`a rectangle ${w} by ${h} ${unit}; ${ask}`}>
      <rect x={ox} y={oy} width={rw} height={rh} fill={ask === 'area' ? '#5eead4' : '#1f2937'} stroke={ask === 'perimeter' ? '#f97316' : '#0f172a'} strokeWidth={ask === 'perimeter' ? 4 : 1.5} strokeDasharray={ask === 'perimeter' ? '8 5' : undefined} />
      {lines}
      <text x={ox + rw / 2} y={oy - 8} fontSize="12" fontWeight="700" fill="#fde68a" fontFamily={MONO} textAnchor="middle">{w} {unit}</text>
      <text x={ox + rw + 8} y={oy + rh / 2 + 4} fontSize="12" fontWeight="700" fill="#fde68a" fontFamily={MONO}>{h} {unit}</text>
      <text x={ox + rw / 2} y={oy + rh + 22} fontSize="11" fill={ask === 'perimeter' ? '#fdba74' : '#99f6e4'} fontFamily={MONO} textAnchor="middle">{ask === 'perimeter' ? 'fence all the way around' : `tiles inside, each 1 ${unit} × 1 ${unit}`}</text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Shared bits for the engineering pictures                            */
/* ------------------------------------------------------------------ */
const C = { label: '#fde68a', muted: '#94a3b8', line: '#e5e7eb', teal: '#2dd4bf', orange: '#f97316', ask: '#f472b6', steel: '#94a3b8', dark: '#0f172a', water: '#38bdf8' };
const fmtN = (n: number, p = 2) => String(Math.round(n * 10 ** p) / 10 ** p);
function Lbl({ x, y, text, color = C.label, size = 11, anchor = 'middle', bold = false }: { x: number; y: number; text: string; color?: string; size?: number; anchor?: 'start' | 'middle' | 'end'; bold?: boolean }) {
  return <text x={x} y={y} fontSize={size} fill={color} fontFamily={MONO} textAnchor={anchor} fontWeight={bold ? 700 : 400} stroke={C.dark} strokeWidth="3" paintOrder="stroke">{text}</text>;
}
function Dim({ x1, y1, x2, y2, text, off = 10, color = C.line, ask = false }: { x1: number; y1: number; x2: number; y2: number; text: string; off?: number; color?: string; ask?: boolean }) {
  const dx = x2 - x1; const dy = y2 - y1; const len = Math.hypot(dx, dy) || 1; const nx = -dy / len; const ny = dx / len;
  const ax1 = x1 + nx * off; const ay1 = y1 + ny * off; const ax2 = x2 + nx * off; const ay2 = y2 + ny * off;
  return (
    <g>
      <line x1={ax1} y1={ay1} x2={ax2} y2={ay2} stroke={color} strokeWidth="1" markerStart="url(#dimA)" markerEnd="url(#dimA)" />
      <line x1={x1} y1={y1} x2={ax1} y2={ay1} stroke={color} strokeWidth="0.6" strokeDasharray="2 2" />
      <line x1={x2} y1={y2} x2={ax2} y2={ay2} stroke={color} strokeWidth="0.6" strokeDasharray="2 2" />
      <Lbl x={(ax1 + ax2) / 2 + nx * 9} y={(ay1 + ay2) / 2 + ny * 9 + 4} text={text} color={ask ? C.ask : C.label} bold />
    </g>
  );
}
const Defs = () => (
  <defs>
    <marker id="dimA" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 5 L 10 5" stroke="#e5e7eb" strokeWidth="2" /><path d="M 5 0 L 5 10" stroke="#e5e7eb" strokeWidth="2" /></marker>
    <marker id="arrowT" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#f97316" /></marker>
    <marker id="arrowW" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#e5e7eb" /></marker>
  </defs>
);
const Svg = ({ w, h, label, children, max = 440 }: { w: number; h: number; label: string; children: React.ReactNode; max?: number }) => (
  <svg viewBox={`0 0 ${w} ${h}`} width={Math.min(w, max)} role="img" aria-label={label}><Defs />{children}</svg>
);

/* ---------------- measurement: compare ---------------- */
function CompareViz({ a, b, unit, units }: { a: { label: string; len: number }; b: { label: string; len: number }; unit: string; units?: boolean }) {
  const W = 380; const left = 16; const usable = W - 32; const longest = Math.max(a.len, b.len); const k = usable / longest;
  return (
    <Svg w={W} h={units ? 110 : 96} label={`${a.label} and ${b.label}`}>
      <Lbl x={left} y={13} text={a.label} anchor="start" />
      <rect x={left} y={18} width={a.len * k} height={16} rx="4" fill="#fbbf24" stroke="#92400e" strokeWidth="1.5" />
      {units && Array.from({ length: a.len }, (_, i) => <rect key={i} x={left + i * k + 1} y={38} width={k - 2} height={12} rx="2" fill="#2dd4bf" stroke="#0f172a" strokeWidth="1" />)}
      <Lbl x={left} y={units ? 70 : 55} text={b.label} anchor="start" color={C.line} />
      <rect x={left} y={units ? 75 : 60} width={b.len * k} height={16} rx="4" fill="#94a3b8" stroke="#334155" strokeWidth="1.5" />
      <line x1={left} x2={left} y1={14} y2={units ? 95 : 80} stroke={C.ask} strokeWidth="1" strokeDasharray="3 2" />
      <Lbl x={W - 12} y={units ? 104 : 92} text={units ? 'each block = 1 unit' : `lined up at the same end · ${unit}`} color={C.muted} size={10} anchor="end" />
    </Svg>
  );
}

/* ---------------- shapes & angles ---------------- */
function ProtractorViz({ angle }: { angle: number }) {
  const W = 320; const H = 190; const cx = 160; const cy = 160; const R = 140;
  const pt = (deg: number, r: number): [number, number] => [cx + r * Math.cos((-deg * Math.PI) / 180), cy + r * Math.sin((-deg * Math.PI) / 180)];
  const ticks: JSX.Element[] = [];
  for (let a = 0; a <= 180; a += 5) { const big = a % 10 === 0; const [x1, y1] = pt(a, R); const [x2, y2] = pt(a, R - (big ? 12 : 6)); ticks.push(<line key={a} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1f2937" strokeWidth={big ? 1.2 : 0.7} />); if (a % 30 === 0) { const lift = a === 0 || a === 180 ? -9 : 0; const [tx, ty] = pt(a, R - 22); ticks.push(<text key={`t${a}`} x={tx} y={ty + 4 + lift} fontSize="10" fill="#1f2937" fontFamily={MONO} textAnchor="middle" fontWeight="700">{a}</text>); const [ox, oy] = pt(a, R - 48); ticks.push(<text key={`o${a}`} x={ox} y={oy + 3 + lift} fontSize="8" fill="#6b7280" fontFamily={MONO} textAnchor="middle">{180 - a}</text>); } }
  const [ex, ey] = pt(angle, R + 14); const [bx, by] = pt(0, R + 14); const [qx, qy] = pt(angle / 2, 46);
  return (
    <Svg w={W} h={H} label={`a protractor showing ${angle} degrees`}>
      <path d={`M ${cx - R - 6} ${cy} A ${R + 6} ${R + 6} 0 0 1 ${cx + R + 6} ${cy} Z`} fill="#fde68a" fillOpacity="0.9" stroke="#a16207" strokeWidth="1.5" />
      {ticks}
      <path d={`M ${cx + 22} ${cy} A 22 22 0 0 0 ${pt(angle, 22)[0]} ${pt(angle, 22)[1]}`} fill="none" stroke={C.orange} strokeWidth="2" />
      <line x1={cx} y1={cy} x2={bx} y2={by} stroke={C.orange} strokeWidth="3" strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={ex} y2={ey} stroke={C.orange} strokeWidth="3" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="3" fill={C.orange} />
      <Lbl x={qx} y={qy + 5} text="?" color={C.ask} size={14} bold />
      <Lbl x={W - 8} y={14} text="inner scale: baseline on 0" color={C.muted} size={9} anchor="end" />
    </Svg>
  );
}

function AnglesViz({ shape, known }: { shape: 'line' | 'point' | 'triangle' | 'right'; known: number[] }) {
  const W = 320; const H = 170;
  const arcLabel = (cx: number, cy: number, from: number, to: number, r: number, text: string, ask = false) => {
    const mid = (from + to) / 2; const p = (deg: number, rr: number): [number, number] => [cx + rr * Math.cos((-deg * Math.PI) / 180), cy + rr * Math.sin((-deg * Math.PI) / 180)];
    const [x1, y1] = p(from, r); const [x2, y2] = p(to, r); const [lx, ly] = p(mid, r + 16); const large = to - from > 180 ? 1 : 0;
    return <g key={`${from}-${to}`}><path d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 0 ${x2} ${y2}`} fill="none" stroke={ask ? C.ask : C.teal} strokeWidth="2" /><Lbl x={lx} y={ly + 4} text={text} color={ask ? C.ask : C.label} bold /></g>;
  };
  const ray = (cx: number, cy: number, deg: number, len: number) => <line key={`r${deg}`} x1={cx} y1={cy} x2={cx + len * Math.cos((-deg * Math.PI) / 180)} y2={cy + len * Math.sin((-deg * Math.PI) / 180)} stroke={C.line} strokeWidth="3" strokeLinecap="round" />;
  if (shape === 'line' || shape === 'right' || shape === 'point') {
    const cx = 160; const cy = shape === 'point' ? 90 : 130; const total = shape === 'line' ? 180 : shape === 'right' ? 90 : 360;
    const angles = [...known, total - known.reduce((a, b) => a + b, 0)]; let acc = 0; const els: JSX.Element[] = [];
    els.push(ray(cx, cy, 0, 130));
    angles.forEach((a, i) => { const from = acc; acc += a; if (acc < 360 || shape !== 'point') els.push(ray(cx, cy, acc, 120)); els.push(arcLabel(cx, cy, from, acc, 28 + i * 8, i === angles.length - 1 ? '?' : `${a}°`, i === angles.length - 1)); });
    if (shape === 'right') els.push(<path key="sq" d={`M ${cx + 14} ${cy} L ${cx + 14} ${cy - 14} L ${cx} ${cy - 14}`} fill="none" stroke={C.muted} strokeWidth="1" />);
    if (shape === 'line') els.push(ray(cx, cy, 180, 130));
    return <Svg w={W} h={H} label="angles diagram">{els}</Svg>;
  }
  const A = known[0]; const B = known[1]; const Cc = 180 - A - B;
  const ax = 30; const ay = 140; const base = 250; const bx = ax + base; const by = ay;
  const rad = (d: number) => (d * Math.PI) / 180; const ab = (base * Math.sin(rad(B))) / Math.sin(rad(Cc));
  const cxp = ax + ab * Math.cos(rad(A)); const cyp = ay - ab * Math.sin(rad(A));
  return (
    <Svg w={W} h={H} label="a triangle with two known angles">
      <polygon points={`${ax},${ay} ${bx},${by} ${cxp},${cyp}`} fill="#1f2937" stroke={C.line} strokeWidth="2.5" strokeLinejoin="round" />
      <Lbl x={ax + 30} y={ay - 8} text={`${A}°`} bold /><Lbl x={bx - 30} y={by - 8} text={`${B}°`} bold /><Lbl x={cxp} y={cyp + 26} text="?" color={C.ask} size={14} bold />
    </Svg>
  );
}

function CircleViz({ r, unit, show, wheel }: { r: number; unit: string; show: 'r' | 'd'; wheel?: boolean }) {
  const W = 300; const H = 200; const cx = 150; const cy = 100; const R = 78;
  return (
    <Svg w={W} h={H} label={`a circle with ${show === 'r' ? 'radius' : 'diameter'} shown`}>
      <circle cx={cx} cy={cy} r={R} fill={wheel ? '#1f2937' : '#164e63'} stroke={C.line} strokeWidth={wheel ? 8 : 2} />
      {wheel && Array.from({ length: 8 }, (_, i) => <line key={i} x1={cx} y1={cy} x2={cx + (R - 6) * Math.cos((i * Math.PI) / 4)} y2={cy + (R - 6) * Math.sin((i * Math.PI) / 4)} stroke={C.muted} strokeWidth="2" />)}
      <circle cx={cx} cy={cy} r="4" fill={C.label} />
      {show === 'r' ? <g><line x1={cx} y1={cy} x2={cx + R} y2={cy} stroke={C.orange} strokeWidth="3" /><Lbl x={cx + R / 2} y={cy - 8} text={`r = ${r} ${unit}`} bold /></g>
        : <g><line x1={cx - R} y1={cy} x2={cx + R} y2={cy} stroke={C.orange} strokeWidth="3" /><Lbl x={cx} y={cy - 8} text={`d = ${2 * r} ${unit}`} bold /></g>}
      {wheel && <line x1={20} y1={cy + R + 6} x2={W - 20} y2={cy + R + 6} stroke={C.muted} strokeWidth="2" />}
    </Svg>
  );
}

function RightTriViz({ a, b, c, hide, unit, context }: { a: number; b: number; c: number; hide: 'a' | 'b' | 'c'; unit: string; context: string }) {
  const W = 340; const H = 200; const k = Math.min(240 / a, 130 / b); const x0 = 50; const y0 = 170; const x1 = x0 + a * k; const y1 = y0 - b * k;
  const t = (v: number, h: string) => (hide === h ? '?' : `${v} ${unit}`);
  return (
    <Svg w={W} h={H} label={`a right triangle (${context})`}>
      <polygon points={`${x0},${y0} ${x1},${y0} ${x1},${y1}`} fill="#1f2937" stroke={C.line} strokeWidth="2.5" strokeLinejoin="round" />
      <path d={`M ${x1 - 14} ${y0} L ${x1 - 14} ${y0 - 14} L ${x1} ${y0 - 14}`} fill="none" stroke={C.muted} strokeWidth="1" />
      <Dim x1={x0} y1={y0} x2={x1} y2={y0} text={t(a, 'a')} off={16} ask={hide === 'a'} />
      <Dim x1={x1} y1={y0} x2={x1} y2={y1} text={t(b, 'b')} off={-16} ask={hide === 'b'} />
      <Lbl x={(x0 + x1) / 2 - 14} y={(y0 + y1) / 2 - 10} text={t(c, 'c')} color={hide === 'c' ? C.ask : C.label} bold />
      <Lbl x={W - 8} y={14} text={context} color={C.muted} size={10} anchor="end" />
    </Svg>
  );
}

function SlopeViz({ rise, run, unit, hide }: { rise: number; run: number; unit: string; hide?: 'rise' | 'run' }) {
  const W = 340; const H = 170; const x0 = 30; const y0 = 140; const len = 260; const riseP = Math.max(14, Math.min(100, (rise / run) * len));
  return (
    <Svg w={W} h={H} label="a slope with rise and run">
      <polygon points={`${x0},${y0} ${x0 + len},${y0} ${x0 + len},${y0 - riseP}`} fill="#1f2937" stroke={C.line} strokeWidth="2.5" strokeLinejoin="round" />
      <Dim x1={x0} y1={y0} x2={x0 + len} y2={y0} text={hide === 'run' ? '?' : `run ${fmtN(run)} ${unit}`} off={16} ask={hide === 'run'} />
      <Dim x1={x0 + len} y1={y0} x2={x0 + len} y2={y0 - riseP} text={hide === 'rise' ? '?' : `rise ${fmtN(rise)} ${unit}`} off={-16} ask={hide === 'rise'} />
      <Lbl x={x0 + 8} y={y0 - 8} text="slope = rise ÷ run" color={C.muted} size={10} anchor="start" />
    </Svg>
  );
}

function CylinderViz({ r, h, unit, label }: { r: number; h: number; unit: string; label?: string }) {
  const W = 300; const H = 210; const cx = 150; const rx = 70; const ry = 18; const top = 40; const bot = 160;
  return (
    <Svg w={W} h={H} label={label ?? `a cylinder radius ${r} height ${h}`}>
      <path d={`M ${cx - rx} ${top} L ${cx - rx} ${bot} A ${rx} ${ry} 0 0 0 ${cx + rx} ${bot} L ${cx + rx} ${top}`} fill="#164e63" stroke={C.line} strokeWidth="2" />
      <ellipse cx={cx} cy={top} rx={rx} ry={ry} fill="#67e8f9" stroke={C.line} strokeWidth="2" />
      <line x1={cx} y1={top} x2={cx + rx} y2={top} stroke={C.orange} strokeWidth="2.5" />
      <Lbl x={cx + rx / 2} y={top - 6} text={`r = ${fmtN(r)} ${unit}`} bold />
      <Dim x1={cx + rx} y1={top} x2={cx + rx} y2={bot} text={`h = ${fmtN(h)} ${unit}`} off={-18} />
      <Lbl x={cx} y={H - 8} text={label ?? 'V = π r² h'} color={C.muted} size={10} />
    </Svg>
  );
}

function PlanViz({ w, h, scale, unit, hide }: { w: number; h: number; scale: number; unit: string; hide?: boolean }) {
  const W = 340; const H = 190; const k = Math.min(240 / w, 110 / h); const x0 = 50; const y0 = 30; const rw = w * k; const rh = h * k;
  return (
    <Svg w={W} h={H} label={`a plan at 1:${scale}`}>
      <rect x={x0} y={y0} width={rw} height={rh} fill="#fef3c7" stroke="#1f2937" strokeWidth="2" />
      <rect x={x0 + rw * 0.1} y={y0 + rh - 4} width={rw * 0.25} height={4} fill="#1f2937" />
      <Dim x1={x0} y1={y0 + rh} x2={x0 + rw} y2={y0 + rh} text={hide ? '?' : `${w} ${unit} on paper`} off={18} ask={!!hide} />
      <rect x={x0} y={H - 40} width={80} height={6} fill="#1f2937" /><rect x={x0 + 40} y={H - 40} width={40} height={6} fill="#fef3c7" stroke="#1f2937" strokeWidth="1" />
      <Lbl x={x0} y={H - 12} text={`SCALE 1:${scale} · 1 cm = ${scale} cm real`} color={C.label} size={11} anchor="start" bold />
    </Svg>
  );
}

/* ---------------- rates ---------------- */
function RatioViz({ parts, unit, known, ask }: { parts: { label: string; n: number }[]; unit: string; known: { label: string; amount: number }; ask: string }) {
  const W = 380; const total = parts.reduce((a, p) => a + p.n, 0); const cols = ['#f59e0b', '#94a3b8', '#78716c', '#2dd4bf']; const H = 30 + parts.length * 30;
  const maxN = Math.max(...parts.map((p) => p.n)); const cell = Math.min(24, 300 / maxN);
  return (
    <Svg w={W} h={H} label="mix ratio">
      {parts.map((p, i) => (
        <g key={p.label}>
          <Lbl x={12} y={24 + i * 30} text={p.label} anchor="start" color={p.label === ask ? C.ask : p.label === known.label ? C.label : C.line} bold={p.label === ask} />
          {Array.from({ length: Math.min(p.n, 60) }, (_, j) => <rect key={j} x={110 + j * cell} y={12 + i * 30} width={cell - 2} height={16} rx="2" fill={cols[i % cols.length]} stroke={C.dark} strokeWidth="0.8" />)}
          <Lbl x={W - 8} y={24 + i * 30} text={p.label === known.label ? `${known.amount} ${unit}` : p.label === ask ? '?' : `${p.n} part${p.n === 1 ? '' : 's'}`} anchor="end" color={p.label === ask ? C.ask : C.label} size={10} />
        </g>
      ))}
      <Lbl x={110} y={H - 4} text={`${parts.map((p) => p.n).join(' : ')} · ${total} parts in all`} color={C.muted} size={10} anchor="start" />
    </Svg>
  );
}

function PairRuleViz({ a, b }: { a: { unit: string; n: number }; b: { unit: string; n: number } }) {
  const W = 380; const H = 96; const left = 16; const right = W - 16;
  const ticksB = b.n >= 10 ? Math.min(Math.round(b.n), 26) : Math.round(b.n * 4);
  return (
    <Svg w={W} h={H} label={`${a.n} ${a.unit} equals ${b.n} ${b.unit}`}>
      <rect x={left} y={12} width={right - left} height={22} rx="3" fill="#fde68a" stroke="#a16207" strokeWidth="1.5" />
      <line x1={left} x2={left} y1={12} y2={34} stroke="#1f2937" strokeWidth="2" /><line x1={right} x2={right} y1={12} y2={34} stroke="#1f2937" strokeWidth="2" />
      <text x={(left + right) / 2} y={28} fontSize="12" fontWeight="700" fill="#1f2937" fontFamily={MONO} textAnchor="middle">{a.n} {a.unit}</text>
      <rect x={left} y={48} width={right - left} height={22} rx="3" fill="#bae6fd" stroke="#0369a1" strokeWidth="1.5" />
      {Array.from({ length: ticksB + 1 }, (_, i) => <line key={i} x1={left + (i / ticksB) * (right - left)} x2={left + (i / ticksB) * (right - left)} y1={62} y2={70} stroke="#0c4a6e" strokeWidth={i === 0 || i === ticksB ? 2 : 0.8} />)}
      <text x={(left + right) / 2} y={60} fontSize="12" fontWeight="700" fill="#0c4a6e" fontFamily={MONO} textAnchor="middle">{b.n} {b.unit}</text>
      <Lbl x={(left + right) / 2} y={90} text="same length, two names" color={C.muted} size={10} />
    </Svg>
  );
}

function FormulaTriViz({ top, left, right, known, ask }: { top: string; left: string; right: string; known: Record<string, string>; ask: string }) {
  const W = 300; const H = 170; const cx = 150;
  const cell = (x: number, y: number, key: string) => <g key={key}><Lbl x={x} y={y} text={key} color={ask === key ? C.ask : C.line} size={16} bold /><Lbl x={x} y={y + 16} text={ask === key ? '?' : known[key] ?? ''} color={ask === key ? C.ask : C.label} size={10} /></g>;
  return (
    <Svg w={W} h={H} label="formula triangle">
      <polygon points={`${cx},18 ${cx - 120},150 ${cx + 120},150`} fill="#1f2937" stroke={C.line} strokeWidth="2" strokeLinejoin="round" />
      <line x1={cx - 70} y1={92} x2={cx + 70} y2={92} stroke={C.line} strokeWidth="1.5" /><line x1={cx} y1={92} x2={cx} y2={150} stroke={C.line} strokeWidth="1.5" />
      {cell(cx, 62, top)}{cell(cx - 40, 122, left)}{cell(cx + 40, 122, right)}
      <Lbl x={cx} y={H - 4} text="cover the one you want" color={C.muted} size={10} />
    </Svg>
  );
}

function FlowTankViz({ capacity, rate, minutes, ask }: { capacity: number; rate: number; minutes: number; ask: 'time' | 'volume' | 'rate' }) {
  const W = 320; const H = 170;
  return (
    <Svg w={W} h={H} label="a tank filling from a tap">
      <path d="M 40 30 L 40 150 L 200 150 L 200 30" fill="none" stroke={C.line} strokeWidth="3" />
      <rect x={42} y={95} width={156} height={53} fill={C.water} opacity="0.8" />
      <path d="M 120 10 L 120 40 L 128 40" fill="none" stroke={C.steel} strokeWidth="5" strokeLinecap="round" />
      <line x1={128} y1={45} x2={128} y2={92} stroke={C.water} strokeWidth="4" strokeDasharray="6 4" />
      <Lbl x={120} y={140} text={ask === 'volume' ? '? L' : `${capacity} L`} color={ask === 'volume' ? C.ask : C.label} size={14} bold />
      <Lbl x={260} y={50} text="tap" color={C.muted} size={10} /><Lbl x={260} y={68} text={ask === 'rate' ? '? L/min' : `${fmtN(rate, 1)} L/min`} color={ask === 'rate' ? C.ask : C.label} bold />
      <circle cx={260} cy={112} r="22" fill="#f8fafc" stroke="#475569" strokeWidth="2" /><line x1={260} y1={112} x2={260} y2={96} stroke="#1e293b" strokeWidth="2" /><line x1={260} y1={112} x2={272} y2={112} stroke="#dc2626" strokeWidth="2" />
      <Lbl x={260} y={152} text={ask === 'time' ? '? min' : `${fmtN(minutes, 1)} min`} color={ask === 'time' ? C.ask : C.label} bold />
    </Svg>
  );
}

function ChainViz({ start, factors, result }: { start: string; factors: [string, string][]; result: string }) {
  const W = 380; const H = 80; const cw = Math.min(90, (W - 100) / factors.length);
  return (
    <Svg w={W} h={H} label="units cancelling">
      <Lbl x={8} y={44} text={start} anchor="start" size={12} bold />
      {factors.map(([t, b], i) => { const x = 80 + i * cw; return (
        <g key={i}>
          <Lbl x={x - 8} y={44} text="×" color={C.muted} size={12} />
          <Lbl x={x + cw / 2 - 8} y={30} text={t} size={11} color={C.line} /><line x1={x + 2} x2={x + cw - 18} y1={38} y2={38} stroke={C.line} strokeWidth="1" /><Lbl x={x + cw / 2 - 8} y={56} text={b} size={11} color={C.line} />
          <line x1={x + 10} y1={60} x2={x + cw - 26} y2={24} stroke={C.orange} strokeWidth="1.2" opacity="0.7" />
        </g>
      ); })}
      <Lbl x={W - 8} y={44} text={`= ${result}`} anchor="end" size={12} color={C.ask} bold />
      <Lbl x={W / 2} y={H - 4} text="each fraction equals 1 · strike matching units top and bottom" color={C.muted} size={9} />
    </Svg>
  );
}

/* ---------------- precision & fit ---------------- */
function CaliperViz({ value }: { value: number }) {
  const W = 380; const H = 120; const px = 11; const whole = Math.floor(value); const tenths = Math.round((value - whole) * 10);
  const startMm = Math.max(0, whole - 7); const left = 20; const x = (mm: number) => left + (mm - startMm) * px; const y0 = 50; const vy = 62;
  const mainTicks: JSX.Element[] = [];
  for (let mm = startMm; mm <= startMm + 30; mm++) { const big = mm % 10 === 0; const mid = mm % 5 === 0; mainTicks.push(<line key={mm} x1={x(mm)} x2={x(mm)} y1={y0 - (big ? 18 : mid ? 12 : 7)} y2={y0} stroke="#1f2937" strokeWidth={big ? 1.4 : 0.8} />); if (big) mainTicks.push(<text key={`t${mm}`} x={x(mm)} y={y0 - 22} fontSize="10" fontWeight="700" fill="#1f2937" fontFamily={MONO} textAnchor="middle">{mm}</text>); }
  const vx = (i: number) => x(value) + i * px * 0.9; // vernier: 10 divisions over 9 mm
  return (
    <Svg w={W} h={H} label={`a vernier caliper reading ${value} mm`}>
      <rect x={left - 10} y={y0 - 30} width={W - 20} height={32} fill="#e5e7eb" stroke="#475569" strokeWidth="1.5" />
      {mainTicks}
      <rect x={vx(0) - 4} y={vy - 8} width={px * 9 + 12} height={30} fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" rx="2" />
      {Array.from({ length: 11 }, (_, i) => <g key={i}><line x1={vx(i)} x2={vx(i)} y1={vy - 6} y2={vy + (i === tenths ? 14 : 8)} stroke={i === tenths ? '#dc2626' : '#1f2937'} strokeWidth={i === tenths ? 2 : i === 0 || i === 10 ? 1.4 : 0.8} />{i % 5 === 0 && <text x={vx(i)} y={vy + 22} fontSize="8" fill="#1f2937" fontFamily={MONO} textAnchor="middle">{i === 10 ? 10 : i}</text>}</g>)}
      <line x1={vx(0)} x2={vx(0)} y1={y0 - 34} y2={vy - 8} stroke="#dc2626" strokeWidth="1" strokeDasharray="2 2" />
      <Lbl x={left} y={H - 6} text="main: mm · vernier: 0.1 mm per line" color={C.muted} size={9} anchor="start" />
      <Lbl x={W - 8} y={H - 6} text="red = the line that aligns" color="#fca5a5" size={9} anchor="end" />
    </Svg>
  );
}

function MicrometerViz({ value }: { value: number }) {
  const W = 380; const H = 130; const sleeve = Math.floor(value * 2) / 2; const thimble = Math.round((value - sleeve) * 100);
  const left = 20; const px = 11; const startMm = Math.max(0, Math.floor(sleeve) - 12); const x = (mm: number) => left + (mm - startMm) * px; const axis = 60;
  const ticks: JSX.Element[] = [];
  for (let mm = startMm; mm <= sleeve; mm++) { ticks.push(<line key={`u${mm}`} x1={x(mm)} x2={x(mm)} y1={axis - 14} y2={axis} stroke="#1f2937" strokeWidth={mm % 5 === 0 ? 1.4 : 0.8} />); if (mm % 5 === 0) ticks.push(<text key={`t${mm}`} x={x(mm)} y={axis - 18} fontSize="9" fontWeight="700" fill="#1f2937" fontFamily={MONO} textAnchor="middle">{mm}</text>); if (mm + 0.5 <= sleeve) ticks.push(<line key={`l${mm}`} x1={x(mm + 0.5)} x2={x(mm + 0.5)} y1={axis} y2={axis + 12} stroke="#1f2937" strokeWidth="0.8" />); }
  const tx = x(sleeve) + 6;
  const rows = [-2, -1, 0, 1, 2].map((k) => ({ v: (thimble + k + 50) % 50, y: axis + k * 14 }));
  return (
    <Svg w={W} h={H} label={`a micrometer reading ${value} mm`}>
      <rect x={left - 10} y={axis - 24} width={tx - left + 6} height={48} fill="#e5e7eb" stroke="#475569" strokeWidth="1.5" />
      <line x1={left - 10} x2={tx} y1={axis} y2={axis} stroke="#1f2937" strokeWidth="1" />
      {ticks}
      <rect x={tx} y={axis - 40} width={110} height={80} rx="6" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />
      {rows.map((r) => <g key={r.v}><line x1={tx} x2={tx + 14} y1={r.y} y2={r.y} stroke={r.v === thimble ? '#dc2626' : '#1f2937'} strokeWidth={r.v === thimble ? 2 : 0.8} /><text x={tx + 20} y={r.y + 3} fontSize="9" fill={r.v === thimble ? '#dc2626' : '#1f2937'} fontFamily={MONO} fontWeight={r.v === thimble ? 700 : 400}>{r.v}</text></g>)}
      <Lbl x={left} y={H - 6} text="sleeve: 1 mm above the line, 0.5 mm below · thimble: 0.01 mm" color={C.muted} size={9} anchor="start" />
    </Svg>
  );
}

function FitViz({ nominal, tol, measured, unit }: { nominal: number; tol: number; measured?: number; unit: string }) {
  const W = 380; const H = 96; const left = 30; const right = W - 30; const lo = nominal - tol; const hi = nominal + tol; const span = tol * 6;
  const x = (v: number) => left + ((v - (nominal - span / 2)) / span) * (right - left);
  return (
    <Svg w={W} h={H} label={`tolerance band ${nominal} ± ${tol}`}>
      <rect x={left} y={30} width={right - left} height={22} fill="#7f1d1d" /><rect x={x(lo)} y={30} width={x(hi) - x(lo)} height={22} fill="#166534" />
      <line x1={x(nominal)} x2={x(nominal)} y1={24} y2={58} stroke={C.label} strokeWidth="2" />
      <Lbl x={x(nominal)} y={18} text={`nominal ${fmtN(nominal)} ${unit}`} bold />
      <Lbl x={x(lo)} y={70} text={`${fmtN(lo)}`} size={10} /><Lbl x={x(hi)} y={70} text={`${fmtN(hi)}`} size={10} />
      <Lbl x={left} y={86} text="too small · loose" color="#fca5a5" size={9} anchor="start" /><Lbl x={(left + right) / 2} y={86} text="fits" color="#86efac" size={9} /><Lbl x={right} y={86} text="too big · tight" color="#fca5a5" size={9} anchor="end" />
      {measured !== undefined && <g><polygon points={`${x(measured)},44 ${x(measured) - 6},60 ${x(measured) + 6},60`} fill={C.ask} /><Lbl x={x(measured)} y={72} text={`measured ${fmtN(measured)}`} color={C.ask} size={10} bold /></g>}
    </Svg>
  );
}

function FeelerViz({ blades }: { blades: number[] }) {
  const W = 320; const H = 120; const total = blades.reduce((a, b) => a + b, 0); const k = 50 / Math.max(total, 0.5);
  let y = 40;
  return (
    <Svg w={W} h={H} label="feeler gauge blades in a gap">
      <rect x={40} y={10} width={240} height={30} fill="#475569" /><rect x={40} y={40 + total * k} width={240} height={30} fill="#475569" />
      {blades.map((b, i) => { const h = Math.max(4, b * k); const el = <g key={i}><rect x={60} y={y} width={200} height={h} fill={['#fbbf24', '#2dd4bf', '#f472b6'][i % 3]} stroke={C.dark} strokeWidth="0.8" /><Lbl x={266} y={y + h / 2 + 4} text={`${b.toFixed(2)} mm`} size={10} anchor="start" /></g>; y += h; return el; })}
      <Lbl x={40} y={H - 6} text="gap = blades stacked" color={C.muted} size={10} anchor="start" />
    </Svg>
  );
}

function ThreadViz({ pitch, length, unit }: { pitch: number; length: number; unit: string }) {
  const W = 380; const H = 110; const left = 40; const n = Math.round(length / pitch); const px = Math.min(28, 260 / n); const right = left + n * px;
  const path: string[] = [`M ${left} 60`];
  for (let i = 0; i < n; i++) path.push(`L ${left + i * px + px / 2} 40 L ${left + (i + 1) * px} 60`);
  return (
    <Svg w={W} h={H} label={`a thread with ${n} crests over ${length} ${unit}`}>
      <rect x={left - 30} y={30} width={30} height={60} fill="#94a3b8" stroke="#334155" strokeWidth="1.5" />
      <rect x={left} y={60} width={right - left} height={30} fill="#94a3b8" stroke="#334155" strokeWidth="1.5" />
      <path d={path.join(' ')} fill="#cbd5e1" stroke="#334155" strokeWidth="1.5" />
      <Dim x1={left} y1={30} x2={right} y2={30} text={`${fmtN(length)} ${unit}`} off={-12} />
      <line x1={left + px / 2} x2={left + px * 1.5} y1={98} y2={98} stroke={C.orange} strokeWidth="2" markerStart="url(#dimA)" markerEnd="url(#dimA)" />
      <Lbl x={left + px * 2 + 8} y={102} text="pitch: crest to crest" color={C.orange} size={9} anchor="start" />
      <Lbl x={W - 8} y={102} text={`${n} crests`} size={10} anchor="end" />
    </Svg>
  );
}

function BoltViz({ thread, flats, hide }: { thread: number; flats: number; hide: 'thread' | 'flats' }) {
  const W = 340; const H = 150; const k = 5; const hw = flats * k; const hx = 40; const cy = 70; const tw = thread * k; const shank = 170;
  return (
    <Svg w={W} h={H} label="a hex bolt with head and thread">
      <polygon points={`${hx},${cy - hw / 2} ${hx + 24},${cy - hw / 2} ${hx + 36},${cy} ${hx + 24},${cy + hw / 2} ${hx},${cy + hw / 2} ${hx - 12},${cy}`} fill="#cbd5e1" stroke="#334155" strokeWidth="1.5" />
      <rect x={hx + 36} y={cy - tw / 2} width={shank} height={tw} fill="#94a3b8" stroke="#334155" strokeWidth="1.5" />
      {Array.from({ length: Math.floor(shank / 8) }, (_, i) => <line key={i} x1={hx + 44 + i * 8} x2={hx + 40 + i * 8} y1={cy - tw / 2} y2={cy + tw / 2} stroke="#334155" strokeWidth="0.8" />)}
      <Dim x1={hx + 12} y1={cy - hw / 2} x2={hx + 12} y2={cy + hw / 2} text={hide === 'flats' ? '?' : `${flats} mm across flats`} off={-30} ask={hide === 'flats'} />
      <Dim x1={hx + 36 + shank} y1={cy - tw / 2} x2={hx + 36 + shank} y2={cy + tw / 2} text={hide === 'thread' ? '?' : `M${thread}: ${thread} mm thread`} off={-24} ask={hide === 'thread'} />
      <Lbl x={W / 2} y={H - 6} text="head size ≠ thread size" color={C.muted} size={10} />
    </Svg>
  );
}

function StackViz({ parts }: { parts: { nominal: number; tol: number }[] }) {
  const W = 380; const H = 90; const total = parts.reduce((a, p) => a + p.nominal, 0); const left = 20; const k = (W - 40) / total; let x = left;
  return (
    <Svg w={W} h={H} label="a stack of toleranced parts">
      {parts.map((p, i) => { const w = p.nominal * k; const el = <g key={i}><rect x={x} y={20} width={w} height={30} fill={['#fbbf24', '#94a3b8', '#2dd4bf', '#f472b6'][i % 4]} stroke={C.dark} strokeWidth="1" /><Lbl x={x + w / 2} y={40} text={`${fmtN(p.nominal, 1)} ± ${p.tol.toFixed(2)}`} size={9} color={C.dark} /></g>; x += w; return el; })}
      <Dim x1={left} y1={50} x2={W - 20} y2={50} text={`${fmtN(total)} mm nominal`} off={16} />
    </Svg>
  );
}

function CardViz({ title, lines }: { title: string; lines: string[] }) {
  const W = 320; const H = 34 + lines.length * 20;
  return (
    <Svg w={W} h={H} label={title}>
      <rect x={4} y={4} width={W - 8} height={H - 8} rx="8" fill="#1f2937" stroke={C.line} strokeWidth="1.5" />
      <Lbl x={16} y={22} text={title.toUpperCase()} anchor="start" size={10} bold />
      {lines.map((l, i) => <Lbl key={i} x={16} y={44 + i * 20} text={l} anchor="start" size={12} color={C.line} />)}
    </Svg>
  );
}

function DigitsViz({ value, sig }: { value: string; sig: number }) {
  const W = 340; const H = 70; const chars = value.split(''); const cw = Math.min(26, (W - 40) / chars.length);
  let seen = 0; let started = false;
  return (
    <Svg w={W} h={H} label={`the number ${value}`}>
      {chars.map((ch, i) => { const isDigit = /\d/.test(ch); if (isDigit && ch !== '0') started = true; const significant = sig > 0 && isDigit && started && seen < sig; if (significant) seen++; return <g key={i}><rect x={20 + i * cw} y={14} width={cw - 3} height={34} rx="4" fill={significant ? '#164e63' : '#1f2937'} stroke={significant ? C.teal : '#334155'} strokeWidth="1.2" /><text x={20 + i * cw + (cw - 3) / 2} y={38} fontSize="18" fontWeight="700" fill={significant ? '#99f6e4' : C.line} fontFamily={MONO} textAnchor="middle">{ch}</text></g>; })}
      <Lbl x={20} y={H - 6} text={sig > 0 ? `${sig} significant figure${sig === 1 ? '' : 's'} highlighted` : 'place value: each step left is × 10'} color={C.muted} size={9} anchor="start" />
    </Svg>
  );
}

/* ---------------- forces & power ---------------- */
function HangViz({ mass, unit, show }: { mass: number; unit: string; show: 'mass' | 'weight' }) {
  const W = 220; const H = 170;
  return (
    <Svg w={W} h={H} label="a mass on a hook scale">
      <rect x={70} y={8} width={80} height={44} rx="6" fill="#f8fafc" stroke="#475569" strokeWidth="2" />
      <Lbl x={110} y={36} text={show === 'weight' ? `${mass * 10} N` : '? N'} color={show === 'weight' ? C.dark : C.ask} size={14} bold />
      <line x1={110} y1={52} x2={110} y2={96} stroke="#475569" strokeWidth="3" />
      <rect x={70} y={96} width={80} height={56} rx="6" fill="#78716c" stroke="#292524" strokeWidth="2" />
      <Lbl x={110} y={130} text={show === 'mass' ? `${mass} ${unit}` : '? kg'} color={show === 'mass' ? C.label : C.ask} size={14} bold />
      <Lbl x={110} y={H - 6} text="10 N for every kg" color={C.muted} size={10} />
    </Svg>
  );
}

function TorqueViz({ force, arm, unit, hide }: { force: number; arm: number; unit: string; hide?: 'force' | 'arm' }) {
  const W = 340; const H = 130; const bx = 40; const cy = 70; const len = 230;
  return (
    <Svg w={W} h={H} label="a wrench on a bolt with a force at its end">
      <polygon points={`${bx},${cy - 16} ${bx + 14},${cy - 16} ${bx + 21},${cy} ${bx + 14},${cy + 16} ${bx},${cy + 16} ${bx - 7},${cy}`} fill="#cbd5e1" stroke="#334155" strokeWidth="1.5" />
      <rect x={bx + 18} y={cy - 8} width={len} height={16} rx="6" fill="#94a3b8" stroke="#334155" strokeWidth="1.5" />
      <line x1={bx + len + 8} y1={cy + 40} x2={bx + len + 8} y2={cy + 12} stroke={C.orange} strokeWidth="3" markerEnd="url(#arrowT)" />
      <Lbl x={bx + len + 8} y={cy + 54} text={hide === 'force' ? '?' : `${force} N`} color={hide === 'force' ? C.ask : C.orange} bold />
      <Dim x1={bx + 7} y1={cy - 10} x2={bx + len + 8} y2={cy - 10} text={hide === 'arm' ? '?' : `arm ${fmtN(arm)} m`} off={-14} ask={hide === 'arm'} />
      <Lbl x={W / 2} y={H - 4} text={`torque (${unit}) = force × arm`} color={C.muted} size={10} />
    </Svg>
  );
}

function LeverViz({ f1, d1, f2, d2, hide }: { f1: number; d1: number; f2: number; d2: number; hide: string }) {
  const W = 360; const H = 150; const px = 180; const py = 100; const k = Math.min(150 / d1, 150 / d2, 120);
  const lx = px - d1 * k; const rx = px + d2 * k;
  return (
    <Svg w={W} h={H} label="a lever balanced on a pivot">
      <rect x={Math.min(lx, px - 150) - 10} y={py - 5} width={Math.max(rx, px + 150) - Math.min(lx, px - 150) + 20} height={10} rx="3" fill="#94a3b8" stroke="#334155" strokeWidth="1.5" />
      <polygon points={`${px},${py + 5} ${px - 16},${py + 34} ${px + 16},${py + 34}`} fill="#475569" stroke="#1f2937" strokeWidth="1.5" />
      <line x1={lx} y1={py - 50} x2={lx} y2={py - 12} stroke={C.orange} strokeWidth="3" markerEnd="url(#arrowT)" /><Lbl x={lx} y={py - 56} text={hide === 'f1' ? '?' : `${f1} N`} color={hide === 'f1' ? C.ask : C.orange} bold />
      <line x1={rx} y1={py - 50} x2={rx} y2={py - 12} stroke={C.orange} strokeWidth="3" markerEnd="url(#arrowT)" /><Lbl x={rx} y={py - 56} text={hide === 'f2' ? '?' : `${f2} N`} color={hide === 'f2' ? C.ask : C.orange} bold />
      <Dim x1={lx} y1={py + 5} x2={px} y2={py + 5} text={hide === 'd1' ? '?' : `${fmtN(d1)} m`} off={22} ask={hide === 'd1'} />
      <Dim x1={px} y1={py + 5} x2={rx} y2={py + 5} text={hide === 'd2' ? '?' : `${fmtN(d2)} m`} off={22} ask={hide === 'd2'} />
    </Svg>
  );
}

function PistonViz({ force, area }: { force: number; area: number }) {
  const W = 260; const H = 150;
  return (
    <Svg w={W} h={H} label="a force on an area">
      <line x1={130} y1={16} x2={130} y2={54} stroke={C.orange} strokeWidth="4" markerEnd="url(#arrowT)" /><Lbl x={150} y={36} text={`${force} N`} color={C.orange} anchor="start" bold />
      <rect x={60} y={58} width={140} height={22} rx="3" fill="#94a3b8" stroke="#334155" strokeWidth="1.5" />
      <rect x={60} y={80} width={140} height={40} fill="#164e63" stroke="#334155" strokeWidth="1.5" />
      <Lbl x={130} y={104} text={`area ${fmtN(area, 3)} m²`} bold />
      <Lbl x={130} y={H - 6} text="pressure = force ÷ area" color={C.muted} size={10} />
    </Svg>
  );
}

function HeadViz({ height, unit, hide }: { height: number; unit: string; hide?: boolean }) {
  const W = 260; const H = 190;
  return (
    <Svg w={W} h={H} label="a tank above a tap">
      <rect x={70} y={14} width={90} height={40} fill="#164e63" stroke={C.line} strokeWidth="2" /><rect x={72} y={22} width={86} height={30} fill={C.water} opacity="0.8" />
      <line x1={115} y1={54} x2={115} y2={150} stroke={C.steel} strokeWidth="6" /><line x1={115} y1={150} x2={150} y2={150} stroke={C.steel} strokeWidth="6" />
      <path d="M 150 142 L 150 158 L 160 158" fill="none" stroke={C.steel} strokeWidth="5" />
      <Dim x1={200} y1={22} x2={200} y2={150} text={hide ? '?' : `head ${height} ${unit}`} off={0} ask={!!hide} />
      <Lbl x={130} y={H - 6} text="water level to tap" color={C.muted} size={10} />
    </Svg>
  );
}

function PushViz({ force, distance, hide }: { force: number; distance: number; hide?: 'force' | 'distance' }) {
  const W = 340; const H = 120;
  return (
    <Svg w={W} h={H} label="a push over a distance">
      <line x1={20} y1={80} x2={W - 20} y2={80} stroke={C.muted} strokeWidth="2" />
      <rect x={60} y={40} width={60} height={40} fill="#78716c" stroke="#292524" strokeWidth="1.5" /><rect x={230} y={40} width={60} height={40} fill="#78716c" stroke="#292524" strokeWidth="1.5" opacity="0.4" />
      <line x1={14} y1={60} x2={54} y2={60} stroke={C.orange} strokeWidth="3" markerEnd="url(#arrowT)" /><Lbl x={34} y={50} text={hide === 'force' ? '?' : `${force} N`} color={hide === 'force' ? C.ask : C.orange} bold />
      <Dim x1={60} y1={86} x2={230} y2={86} text={hide === 'distance' ? '?' : `${distance} m`} off={14} ask={hide === 'distance'} />
    </Svg>
  );
}

function CircuitViz({ v, i, r, ask }: { v: number; i: number; r: number; ask: 'v' | 'i' | 'r' | 'p' }) {
  const W = 320; const H = 184;
  const t = (key: 'v' | 'i' | 'r', val: string) => (ask === key ? '?' : val);
  return (
    <Svg w={W} h={H} label="a battery, a resistor and meters">
      <rect x={40} y={30} width={240} height={110} fill="none" stroke={C.line} strokeWidth="2.5" rx="4" />
      <line x1={30} y1={70} x2={50} y2={70} stroke={C.line} strokeWidth="4" /><line x1={34} y1={90} x2={46} y2={90} stroke={C.line} strokeWidth="4" /><rect x={38} y={60} width={4} height={40} fill={C.dark} />
      <Lbl x={14} y={84} text={t('v', `${v} V`)} color={ask === 'v' ? C.ask : C.label} anchor="start" size={11} bold />
      <path d="M 200 30 l 8 -10 l 10 20 l 10 -20 l 10 20 l 10 -20 l 10 20 l 8 -10" fill="none" stroke={C.orange} strokeWidth="2.5" />
      <Lbl x={236} y={10} text={t('r', `${r} Ω`)} color={ask === 'r' ? C.ask : C.label} bold />
      <circle cx={160} cy={140} r="18" fill="#1f2937" stroke={C.line} strokeWidth="2" /><Lbl x={160} y={145} text="A" size={12} color={C.line} bold />
      <Lbl x={160} y={H - 8} text={t('i', `${fmtN(i)} A`)} color={ask === 'i' ? C.ask : C.label} bold />
      {ask === 'p' && <Lbl x={W - 8} y={84} text="P = ? W" color={C.ask} anchor="end" bold />}
    </Svg>
  );
}

function ExpandViz({ length, dT, material, growth }: { length: number; dT: number; material: string; growth: number }) {
  const W = 360; const H = 110;
  return (
    <Svg w={W} h={H} label={`a ${material} bar growing when heated`}>
      <rect x={20} y={20} width={260} height={16} fill="#94a3b8" stroke="#334155" strokeWidth="1.5" /><Lbl x={150} y={16} text={`${material}, ${length} m, cold`} size={10} />
      <rect x={20} y={60} width={260} height={16} fill="#fb923c" stroke="#7c2d12" strokeWidth="1.5" /><rect x={280} y={60} width={26} height={16} fill="#fde68a" stroke="#7c2d12" strokeWidth="1.5" />
      <Lbl x={150} y={56} text={`+${dT} °C`} size={10} color="#fdba74" />
      <Lbl x={293} y={92} text={`+${growth} µm (exaggerated)`} color={C.ask} size={10} bold />
    </Svg>
  );
}

/* ---------------- plumbing ---------------- */
function PipeSectionViz({ od, id, nominal, ask }: { od: number; id: number; nominal: string; ask: 'wall' | 'od' | 'id' }) {
  const W = 340; const H = 200; const cx = 110; const cy = 100; const k = 150 / od; const Ro = (od * k) / 2; const Ri = (id * k) / 2;
  return (
    <Svg w={W} h={H} label={`cutaway of a ${nominal} pipe`}>
      <circle cx={cx} cy={cy} r={Ro} fill="#e5e7eb" stroke="#334155" strokeWidth="1.5" /><circle cx={cx} cy={cy} r={Ri} fill="#164e63" stroke="#334155" strokeWidth="1.5" />
      <line x1={cx - Ro} y1={cy} x2={cx + Ro} y2={cy} stroke={C.orange} strokeWidth="2" strokeDasharray={ask === 'od' ? undefined : '4 3'} />
      <line x1={cx - Ri} y1={cy + 18} x2={cx + Ri} y2={cy + 18} stroke={C.teal} strokeWidth="2" />
      <Lbl x={240} y={60} text={`"${nominal}" nominal`} anchor="start" size={12} bold />
      <Lbl x={240} y={90} text={`OD ${ask === 'od' ? '?' : od + ' mm'}`} anchor="start" color={ask === 'od' ? C.ask : C.orange} bold />
      <Lbl x={240} y={112} text={`ID ${ask === 'id' ? '?' : id + ' mm'}`} anchor="start" color={ask === 'id' ? C.ask : C.teal} bold />
      <Lbl x={240} y={134} text={`wall ${ask === 'wall' ? '?' : fmtN((od - id) / 2) + ' mm'}`} anchor="start" color={ask === 'wall' ? C.ask : C.line} bold />
      <Lbl x={cx} y={H - 6} text="fittings grip the outside; water sees the inside" color={C.muted} size={9} />
    </Svg>
  );
}

function PipeRouteViz({ cc, takeoffs }: { cc: number; takeoffs: [number, number] }) {
  const W = 380; const H = 120; const left = 50; const right = W - 50; const y = 60; const k = (right - left) / cc; const t1 = takeoffs[0] * k; const t2 = takeoffs[1] * k;
  return (
    <Svg w={W} h={H} label="a pipe between two fittings">
      <rect x={left - 22} y={y - 22} width={44} height={44} rx="6" fill="#cbd5e1" stroke="#334155" strokeWidth="1.5" /><rect x={right - 22} y={y - 22} width={44} height={44} rx="6" fill="#cbd5e1" stroke="#334155" strokeWidth="1.5" />
      <rect x={left + t1} y={y - 10} width={right - t2 - left - t1} height={20} fill="#94a3b8" stroke="#334155" strokeWidth="1.5" />
      <line x1={left} y1={y - 30} x2={left} y2={y + 30} stroke={C.label} strokeWidth="1" strokeDasharray="3 2" /><line x1={right} y1={y - 30} x2={right} y2={y + 30} stroke={C.label} strokeWidth="1" strokeDasharray="3 2" />
      <Dim x1={left} y1={y - 22} x2={right} y2={y - 22} text={`centre to centre ${cc} mm`} off={-12} />
      <Dim x1={left + t1} y1={y + 12} x2={right - t2} y2={y + 12} text="cut length ?" off={16} ask />
      <Lbl x={left} y={H - 4} text={`take-off ${takeoffs[0]}`} size={9} color={C.muted} /><Lbl x={right} y={H - 4} text={`take-off ${takeoffs[1]}`} size={9} color={C.muted} />
    </Svg>
  );
}

function RouteViz({ segs }: { segs: number[] }) {
  const W = 380; const H = 150; const total = segs.reduce((a, b) => a + b, 0); const k = 300 / total;
  let x = 30; let y = 30; const pts: [number, number][] = [[x, y]]; const labels: JSX.Element[] = [];
  segs.forEach((s, i) => { const horiz = i % 2 === 0; const len = s * k; const nx = horiz ? x + len : x; const ny = horiz ? y : y + Math.min(len, 40); labels.push(<Lbl key={i} x={(x + nx) / 2 + (horiz ? 0 : 14)} y={(y + ny) / 2 + (horiz ? -6 : 4)} text={`${fmtN(s)} m`} size={10} anchor={horiz ? 'middle' : 'start'} />); x = nx; y = ny; pts.push([x, y]); });
  return (
    <Svg w={W} h={H} label="a pipe route of several segments">
      <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke="#94a3b8" strokeWidth="8" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="5" fill="#cbd5e1" stroke="#334155" strokeWidth="1.2" />)}
      {labels}
    </Svg>
  );
}

function OffsetViz({ offset, angle, hide }: { offset: number; angle: number; hide?: 'run' }) {
  const W = 360; const H = 170; const y1 = 40; const y2 = 120; const x1 = 40; const xj = 150; const run = y2 - y1; const xk = xj + run;
  return (
    <Svg w={W} h={H} label={`a ${angle}° pipe offset`}>
      <line x1={x1} y1={y1} x2={xj} y2={y1} stroke="#94a3b8" strokeWidth="10" strokeLinecap="round" /><line x1={xj} y1={y1} x2={xk} y2={y2} stroke="#94a3b8" strokeWidth="10" strokeLinecap="round" /><line x1={xk} y1={y2} x2={W - 30} y2={y2} stroke="#94a3b8" strokeWidth="10" strokeLinecap="round" />
      <Dim x1={xk + 30} y1={y1} x2={xk + 30} y2={y2} text={`offset ${offset} mm`} off={-30} />
      <Dim x1={xj} y1={y2 + 10} x2={xk} y2={y2 + 10} text={hide === 'run' ? '?' : `run = offset`} off={16} ask={hide === 'run'} />
      <Lbl x={(xj + xk) / 2 - 24} y={(y1 + y2) / 2 - 6} text="travel ?" color={hide === 'run' ? C.label : C.ask} bold />
      <Lbl x={xj - 6} y={y1 - 10} text={`${angle}° elbow`} size={9} color={C.muted} />
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/* Probability                                                         */
/* ------------------------------------------------------------------ */
const pctS = (p: number) => `${Math.round(p * 1000) / 10}%`;
const phiV = (z: number) => { const t = 1 / (1 + 0.2316419 * Math.abs(z)); const d = 0.3989423 * Math.exp((-z * z) / 2); const p = 1 - d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return z >= 0 ? p : 1 - p; };

function OddsBarViz({ a, b }: { a: number; b: number }) {
  const W = 360; const total = a + b; const wa = ((W - 40) * a) / total;
  return (
    <Svg w={W} h={70} label={`${a} to ${b}`}>
      <rect x={20} y={20} width={wa} height={26} fill="#7f1d1d" stroke={C.dark} /><rect x={20 + wa} y={20} width={W - 40 - wa} height={26} fill="#166534" stroke={C.dark} />
      <Lbl x={20 + wa / 2} y={37} text={`${a}`} bold /><Lbl x={20 + wa + (W - 40 - wa) / 2} y={37} text={`${b}`} bold />
      <Lbl x={20} y={62} text="against" color="#fca5a5" size={10} anchor="start" /><Lbl x={W - 20} y={62} text={`for · ${total} in all`} color="#86efac" size={10} anchor="end" />
    </Svg>
  );
}

function CountTreeViz({ levels }: { levels: number[] }) {
  const W = 380; const H = 40 + levels.length * 40; const shown = levels.slice(0, 3);
  const nodes: JSX.Element[] = []; let prev: number[] = [W / 2];
  shown.forEach((n, li) => {
    const y = 40 + li * 40; const next: number[] = []; const totalLeaves = prev.length * n; const gap = (W - 40) / totalLeaves;
    prev.forEach((px, pi) => { for (let j = 0; j < n; j++) { const x = 20 + gap * (pi * n + j) + gap / 2; next.push(x); nodes.push(<line key={`${li}-${pi}-${j}`} x1={px} y1={y - 30} x2={x} y2={y} stroke={C.muted} strokeWidth="1" />); if (totalLeaves <= 24) nodes.push(<circle key={`c${li}-${pi}-${j}`} cx={x} cy={y} r="4" fill={C.teal} />); } });
    nodes.push(<Lbl key={`l${li}`} x={W - 6} y={y + 4} text={`× ${n}`} anchor="end" size={10} />);
    prev = next;
  });
  return <Svg w={W} h={H} label="counting tree"><circle cx={W / 2} cy={10} r="5" fill={C.label} />{nodes}<Lbl x={12} y={H - 6} text={`${levels.join(' × ')} = ${levels.reduce((a, b) => a * b, 1)} paths`} anchor="start" size={10} color={C.muted} /></Svg>;
}

function DiceGridViz({ total }: { total: number }) {
  const W = 260; const c = 32; const ox = 40; const oy = 30;
  return (
    <Svg w={W} h={oy + 6 * c + 10} label={`36 dice outcomes, total ${total} highlighted`}>
      {[1, 2, 3, 4, 5, 6].map((b) => <Lbl key={`c${b}`} x={ox + (b - 0.5) * c} y={22} text={String(b)} size={11} />)}
      {[1, 2, 3, 4, 5, 6].map((a) => <g key={a}><Lbl x={ox - 14} y={oy + (a - 0.5) * c + 4} text={String(a)} size={11} />{[1, 2, 3, 4, 5, 6].map((b) => <g key={b}><rect x={ox + (b - 1) * c} y={oy + (a - 1) * c} width={c - 2} height={c - 2} rx="4" fill={a + b === total ? '#166534' : '#1f2937'} stroke={C.line} strokeWidth="0.8" /><text x={ox + (b - 0.5) * c - 1} y={oy + (a - 0.5) * c + 4} fontSize="11" fill={a + b === total ? '#bbf7d0' : C.muted} fontFamily={MONO} textAnchor="middle">{a + b}</text></g>)}</g>)}
    </Svg>
  );
}

function TreeViz({ root, branches }: { root: string; branches: { label: string; p: number; children?: { label: string; p: number }[] }[] }) {
  const W = 380; const H = 60 + branches.length * 64; const x0 = 60; const x1 = 190; const x2 = 320;
  return (
    <Svg w={W} h={H} label="probability tree">
      <Lbl x={x0} y={H / 2 + 4} text={root} anchor="middle" bold />
      {branches.map((b, i) => { const y = 40 + i * 64 + (branches.length === 1 ? 20 : 0); const kids = b.children ?? []; return (
        <g key={i}>
          <line x1={x0 + 30} y1={H / 2} x2={x1 - 40} y2={y} stroke={C.line} strokeWidth="1.5" />
          <Lbl x={(x0 + x1) / 2 - 5} y={(H / 2 + y) / 2 - 6} text={pctS(b.p)} color={C.teal} size={10} />
          <Lbl x={x1} y={y + 4} text={b.label} size={11} bold />
          {kids.map((k, j) => { const ky = y - 14 + j * 28; return <g key={j}><line x1={x1 + 44} y1={y} x2={x2 - 44} y2={ky} stroke={C.muted} strokeWidth="1.2" /><Lbl x={(x1 + x2) / 2} y={(y + ky) / 2 - 5} text={pctS(k.p)} color={C.teal} size={9} /><Lbl x={x2} y={ky + 4} text={k.label} size={10} /></g>; })}
        </g>
      ); })}
    </Svg>
  );
}

function Table2Viz({ rows, cols, n, highlightRow, highlightCol }: { rows: [string, string]; cols: [string, string]; n: [[number, number], [number, number]]; highlightRow?: number; highlightCol?: number }) {
  const W = 340; const cw = 80; const ox = 90; const oy = 34; const rh = 30; const rowT = n.map((r) => r[0] + r[1]); const colT = [n[0][0] + n[1][0], n[0][1] + n[1][1]]; const total = rowT[0] + rowT[1];
  const cell = (x: number, y: number, text: string, hl: boolean, muted = false) => <g key={`${x}-${y}-${text}`}><rect x={x} y={y} width={cw - 2} height={rh - 2} rx="3" fill={hl ? '#164e63' : '#1f2937'} stroke={C.line} strokeWidth="0.8" /><text x={x + cw / 2 - 1} y={y + 19} fontSize="12" fill={muted ? C.muted : hl ? '#99f6e4' : C.line} fontFamily={MONO} textAnchor="middle" fontWeight={hl ? 700 : 400}>{text}</text></g>;
  return (
    <Svg w={W} h={oy + 3 * rh + 10} label="two-way table">
      {cols.map((c, j) => <Lbl key={c} x={ox + j * cw + cw / 2} y={24} text={c} size={11} bold />)}<Lbl x={ox + 2 * cw + cw / 2} y={24} text="total" size={11} color={C.muted} />
      {rows.map((r, i) => <g key={r}><Lbl x={ox - 8} y={oy + i * rh + 19} text={r} anchor="end" size={11} bold />{[0, 1].map((j) => cell(ox + j * cw, oy + i * rh, String(n[i][j]), highlightRow === i || highlightCol === j))}{cell(ox + 2 * cw, oy + i * rh, String(rowT[i]), highlightRow === i, true)}</g>)}
      <Lbl x={ox - 8} y={oy + 2 * rh + 19} text="total" anchor="end" size={11} color={C.muted} />{[0, 1].map((j) => cell(ox + j * cw, oy + 2 * rh, String(colT[j]), highlightCol === j, true))}{cell(ox + 2 * cw, oy + 2 * rh, String(total), false, true)}
    </Svg>
  );
}

function DotsViz({ values, mean, sd }: { values: number[]; mean: number; sd?: number }) {
  const W = 360; const lo = Math.min(...values, mean - (sd ?? 0)) - 1; const hi = Math.max(...values, mean + (sd ?? 0)) + 1; const x = (v: number) => 20 + ((v - lo) / (hi - lo)) * (W - 40);
  const counts: Record<number, number> = {};
  return (
    <Svg w={W} h={90} label="dot plot with mean">
      <line x1={20} x2={W - 20} y1={60} y2={60} stroke={C.muted} strokeWidth="1.5" />
      {sd !== undefined && <rect x={x(mean - sd)} y={30} width={x(mean + sd) - x(mean - sd)} height={30} fill="#2dd4bf" opacity="0.15" />}
      {values.map((v, i) => { counts[v] = (counts[v] ?? 0) + 1; return <circle key={i} cx={x(v)} cy={56 - (counts[v] - 1) * 12} r="5" fill={C.orange} stroke={C.dark} />; })}
      <line x1={x(mean)} x2={x(mean)} y1={22} y2={66} stroke={C.label} strokeWidth="2" strokeDasharray="4 3" /><Lbl x={x(mean)} y={16} text={`mean ${Math.round(mean * 100) / 100}`} bold />
      {values.map((v, i) => <Lbl key={`t${i}`} x={x(v)} y={78} text={String(v)} size={9} color={C.muted} />)}
      {sd !== undefined && <Lbl x={W - 20} y={86} text={`±1 SD shaded`} size={9} color={C.teal} anchor="end" />}
    </Svg>
  );
}

function LlnViz({ p, n }: { p: number; n: number }) {
  const W = 360; const H = 120; let seed = Math.round(p * 1000 + n); const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const N = Math.min(n, 300); let wins = 0; const pts: [number, number][] = [];
  for (let i = 1; i <= N; i++) { if (rnd() < p) wins++; pts.push([20 + (i / N) * (W - 40), 100 - (wins / i) * 80]); }
  return (
    <Svg w={W} h={H} label="running proportion settling toward p">
      <line x1={20} x2={W - 20} y1={100 - p * 80} y2={100 - p * 80} stroke={C.label} strokeWidth="1.5" strokeDasharray="4 3" /><Lbl x={W - 20} y={100 - p * 80 - 6} text={`true p = ${pctS(p)}`} anchor="end" size={10} />
      <polyline points={pts.map((q) => q.join(',')).join(' ')} fill="none" stroke={C.teal} strokeWidth="1.5" />
      <Lbl x={20} y={H - 4} text="1 trial" size={9} color={C.muted} anchor="start" /><Lbl x={W - 20} y={H - 4} text={`${N} trials · SE = √(p(1−p)/n)`} size={9} color={C.muted} anchor="end" />
    </Svg>
  );
}

function BellViz({ z, shade, mu, sigma }: { z: number; shade: 'none' | 'below' | 'above' | 'tails'; mu?: number; sigma?: number }) {
  const W = 360; const H = 130; const x = (zz: number) => W / 2 + zz * 50; const y = (zz: number) => 105 - Math.exp(-zz * zz / 2) * 85;
  const pts: string[] = []; for (let zz = -3.4; zz <= 3.4; zz += 0.1) pts.push(`${x(zz)},${y(zz)}`);
  const area = (from: number, to: number) => { const a: string[] = [`${x(from)},105`]; for (let zz = from; zz <= to; zz += 0.05) a.push(`${x(zz)},${y(zz)}`); a.push(`${x(to)},105`); return a.join(' '); };
  const zc = Math.max(-3.3, Math.min(3.3, z));
  return (
    <Svg w={W} h={H} label={`normal curve, z = ${Math.round(z * 100) / 100}`}>
      {shade === 'below' && <polygon points={area(-3.4, zc)} fill="#2dd4bf" opacity="0.35" />}
      {shade === 'above' && <polygon points={area(zc, 3.4)} fill="#2dd4bf" opacity="0.35" />}
      {shade === 'tails' && <g><polygon points={area(-3.4, -Math.abs(zc))} fill="#f97316" opacity="0.4" /><polygon points={area(Math.abs(zc), 3.4)} fill="#f97316" opacity="0.4" /></g>}
      <polyline points={pts.join(' ')} fill="none" stroke={C.line} strokeWidth="2" />
      <line x1={20} x2={W - 20} y1={105} y2={105} stroke={C.muted} />
      {[-2, -1, 0, 1, 2].map((t) => <Lbl key={t} x={x(t)} y={118} text={mu !== undefined && sigma !== undefined ? String(mu + t * sigma) : String(t)} size={9} color={C.muted} />)}
      <line x1={x(zc)} x2={x(zc)} y1={y(zc) - 6} y2={105} stroke={C.ask} strokeWidth="2" /><Lbl x={x(zc)} y={y(zc) - 12} text={`z = ${Math.round(z * 100) / 100}`} color={C.ask} bold />
      {shade !== 'none' && <Lbl x={W - 20} y={14} text={shade === 'below' ? `Φ(z) = ${pctS(phiV(z))}` : shade === 'above' ? `1 − Φ(z) = ${pctS(1 - phiV(z))}` : `two tails = ${pctS(2 * (1 - phiV(Math.abs(z))))}`} anchor="end" size={10} />}
    </Svg>
  );
}

function BarsViz({ title, values, highlight, highlightFrom, highlightTo }: { title: string; values: { label: string; v: number }[]; highlight?: number; highlightFrom?: number; highlightTo?: number }) {
  const W = 360; const H = 150; const max = Math.max(...values.map((v) => v.v), 0.01); const bw = (W - 40) / values.length;
  const on = (i: number) => i === highlight || (highlightFrom !== undefined && i >= highlightFrom) || (highlightTo !== undefined && i <= highlightTo);
  return (
    <Svg w={W} h={H} label={title}>
      <Lbl x={20} y={14} text={title} anchor="start" size={10} />
      {values.map((v, i) => { const h = (v.v / max) * 95; return <g key={i}><rect x={20 + i * bw + 3} y={120 - h} width={bw - 6} height={h} fill={on(i) ? C.teal : '#334155'} stroke={C.dark} /><Lbl x={20 + i * bw + bw / 2} y={134} text={v.label} size={9} color={C.muted} />{bw > 30 && <Lbl x={20 + i * bw + bw / 2} y={116 - h} text={pctS(v.v)} size={8} color={on(i) ? '#99f6e4' : C.muted} />}</g>; })}
    </Svg>
  );
}

function ScatterViz({ a, b, x, x2 }: { a: number; b: number; x: number; x2?: number }) {
  const W = 360; const H = 150; const maxX = Math.max(x, x2 ?? 0) + 6; const maxY = a + b * maxX + 5; const X = (v: number) => 30 + (v / maxX) * (W - 50); const Y = (v: number) => 120 - (v / maxY) * 100;
  let seed = a * 7 + b * 13 + x; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648 - 0.5; };
  const pts = Array.from({ length: 12 }, (_, i) => { const px = 1 + (i / 11) * (maxX - 2); return [X(px), Y(a + b * px + rnd() * maxY * 0.16)]; });
  return (
    <Svg w={W} h={H} label="scatter with fitted line">
      <line x1={30} x2={W - 20} y1={120} y2={120} stroke={C.muted} /><line x1={30} x2={30} y1={10} y2={120} stroke={C.muted} />
      {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3" fill={C.muted} />)}
      <line x1={X(0)} y1={Y(a)} x2={X(maxX)} y2={Y(a + b * maxX)} stroke={C.teal} strokeWidth="2" />
      <circle cx={X(x)} cy={Y(a + b * x)} r="5" fill={C.ask} /><Lbl x={X(x)} y={Y(a + b * x) - 10} text={`x = ${x}`} color={C.ask} size={10} bold />
      {x2 !== undefined && <g><circle cx={X(x2)} cy={Y(a + b * x2)} r="5" fill={C.ask} /><Lbl x={X(x2)} y={Y(a + b * x2) - 10} text={`x = ${x2}`} color={C.ask} size={10} bold /></g>}
      <Lbl x={W - 20} y={H - 4} text={`ŷ = ${a} + ${Math.round(b * 100) / 100}x`} anchor="end" size={10} />
    </Svg>
  );
}

function LogisticViz({ z }: { z: number }) {
  const W = 360; const H = 130; const X = (v: number) => W / 2 + v * 40; const Y = (p: number) => 110 - p * 90; const pts: string[] = [];
  for (let v = -4; v <= 4; v += 0.1) pts.push(`${X(v)},${Y(1 / (1 + Math.exp(-v)))}`);
  const p = 1 / (1 + Math.exp(-z));
  return (
    <Svg w={W} h={H} label="logistic curve">
      <line x1={20} x2={W - 20} y1={110} y2={110} stroke={C.muted} /><line x1={20} x2={W - 20} y1={Y(0.5)} y2={Y(0.5)} stroke={C.muted} strokeDasharray="3 3" /><Lbl x={22} y={Y(0.5) - 4} text="50%" size={9} color={C.muted} anchor="start" />
      <polyline points={pts.join(' ')} fill="none" stroke={C.teal} strokeWidth="2" />
      {[-4, -2, 0, 2, 4].map((v) => <Lbl key={v} x={X(v)} y={122} text={String(v)} size={9} color={C.muted} />)}
      <circle cx={X(z)} cy={Y(p)} r="5" fill={C.ask} /><Lbl x={X(z)} y={Y(p) - 10} text={`z = ${z} → ${pctS(p)}`} color={C.ask} size={10} bold />
      <Lbl x={W - 20} y={12} text="p = 1 / (1 + e^−z)" anchor="end" size={10} />
    </Svg>
  );
}

function MatrixViz({ rows, vec, label }: { rows: number[][]; vec: number[]; label: string }) {
  const W = 340; const H = 40 + Math.max(rows.length, vec.length) * 26; const cw = 30;
  return (
    <Svg w={W} h={H} label={label}>
      <Lbl x={20} y={22} text={label} anchor="start" bold />
      <path d={`M 40 34 L 34 34 L 34 ${H - 12} L 40 ${H - 12}`} fill="none" stroke={C.line} /><path d={`M ${40 + rows[0].length * cw} 34 L ${46 + rows[0].length * cw} 34 L ${46 + rows[0].length * cw} ${H - 12} L ${40 + rows[0].length * cw} ${H - 12}`} fill="none" stroke={C.line} />
      {rows.map((r, i) => r.map((v, j) => <Lbl key={`${i}-${j}`} x={40 + j * cw + cw / 2} y={54 + i * 26} text={String(v)} color={C.label} size={13} />))}
      <Lbl x={70 + rows[0].length * cw} y={54 + ((rows.length - 1) * 26) / 2} text="·" size={16} />
      {(() => { const vx = 90 + rows[0].length * cw; return <g><path d={`M ${vx} 34 L ${vx - 6} 34 L ${vx - 6} ${H - 12} L ${vx} ${H - 12}`} fill="none" stroke={C.line} /><path d={`M ${vx + cw} 34 L ${vx + cw + 6} 34 L ${vx + cw + 6} ${H - 12} L ${vx + cw} ${H - 12}`} fill="none" stroke={C.line} />{vec.map((v, i) => <Lbl key={i} x={vx + cw / 2} y={54 + i * 26} text={String(v)} color={C.teal} size={13} />)}</g>; })()}
    </Svg>
  );
}

function EloViz({ diff }: { diff: number }) {
  const W = 360; const H = 130; const X = (d: number) => W / 2 + d * 0.3; const Y = (p: number) => 110 - p * 90; const pts: string[] = [];
  for (let d = -500; d <= 500; d += 10) pts.push(`${X(d)},${Y(1 / (1 + 10 ** (-d / 400)))}`);
  const e = 1 / (1 + 10 ** (-diff / 400));
  return (
    <Svg w={W} h={H} label="Elo expected score curve">
      <line x1={20} x2={W - 20} y1={110} y2={110} stroke={C.muted} /><line x1={20} x2={W - 20} y1={Y(0.5)} y2={Y(0.5)} stroke={C.muted} strokeDasharray="3 3" />
      <polyline points={pts.join(' ')} fill="none" stroke={C.teal} strokeWidth="2" />
      {[-400, -200, 0, 200, 400].map((d) => <Lbl key={d} x={X(d)} y={122} text={String(d)} size={9} color={C.muted} />)}
      <circle cx={X(diff)} cy={Y(e)} r="5" fill={C.ask} /><Lbl x={X(diff)} y={Y(e) - 10} text={`${diff >= 0 ? '+' : ''}${diff} → ${pctS(e)}`} color={C.ask} size={10} bold />
      <Lbl x={W - 20} y={12} text="rating difference (A − B)" anchor="end" size={10} />
    </Svg>
  );
}

function MarkovViz({ states, p, q }: { states: string[]; p: number; q: number }) {
  const W = 340; const H = 120;
  return (
    <Svg w={W} h={H} label="two-state Markov chain">
      <circle cx={90} cy={60} r="34" fill="#164e63" stroke={C.line} strokeWidth="2" /><Lbl x={90} y={64} text={states[0]} bold />
      <circle cx={250} cy={60} r="34" fill="#1f2937" stroke={C.line} strokeWidth="2" /><Lbl x={250} y={64} text={states[1]} bold />
      <path d="M 124 48 Q 170 20 216 48" fill="none" stroke={C.orange} strokeWidth="2" markerEnd="url(#arrowT)" /><Lbl x={170} y={26} text={pctS(1 - p)} color={C.orange} size={10} />
      <path d="M 216 72 Q 170 100 124 72" fill="none" stroke={C.orange} strokeWidth="2" markerEnd="url(#arrowT)" /><Lbl x={170} y={104} text={pctS(1 - q)} color={C.orange} size={10} />
      <path d="M 66 34 A 22 22 0 1 1 72 28" fill="none" stroke={C.teal} strokeWidth="2" markerEnd="url(#arrowT)" /><Lbl x={40} y={14} text={`stay ${pctS(p)}`} color={C.teal} size={10} />
      <path d="M 274 34 A 22 22 0 1 0 268 28" fill="none" stroke={C.teal} strokeWidth="2" markerEnd="url(#arrowT)" /><Lbl x={300} y={14} text={`stay ${pctS(q)}`} color={C.teal} size={10} />
    </Svg>
  );
}

function WalkViz({ p, steps }: { p: number; steps: number }) {
  const W = 360; const H = 130; const N = Math.min(steps, 60); let seed = Math.round(p * 100) * 17 + steps;
  const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const paths = [0, 1, 2].map(() => { let pos = 0; const pts = [[20, 65]]; for (let i = 1; i <= N; i++) { pos += rnd() < p ? 1 : -1; pts.push([20 + (i / N) * (W - 40), 65 - pos * 4]); } return pts; });
  return (
    <Svg w={W} h={H} label="three random walks">
      <line x1={20} x2={W - 20} y1={65} y2={65} stroke={C.muted} strokeDasharray="3 3" />
      {paths.map((pts, i) => <polyline key={i} points={pts.map((q) => q.join(',')).join(' ')} fill="none" stroke={[C.teal, C.orange, C.label][i]} strokeWidth="1.5" />)}
      <Lbl x={W - 20} y={H - 4} text={`+1 with p = ${pctS(p)}, ${N} steps shown`} anchor="end" size={9} color={C.muted} />
    </Svg>
  );
}

function HistViz({ p, sims }: { p: number; sims: number }) {
  const W = 360; const H = 130; const bins = 15; const se = Math.sqrt((p * (1 - p)) / Math.max(sims, 1)); const lo = Math.max(0, p - 4 * se); const hi = Math.min(1, p + 4 * se);
  const vals = Array.from({ length: bins }, (_, i) => { const c = lo + ((i + 0.5) / bins) * (hi - lo); return Math.exp(-((c - p) ** 2) / (2 * se * se)); });
  const bw = (W - 40) / bins; const max = Math.max(...vals);
  return (
    <Svg w={W} h={H} label="Monte Carlo estimate spread">
      {vals.map((v, i) => <rect key={i} x={20 + i * bw + 1} y={100 - (v / max) * 80} width={bw - 2} height={(v / max) * 80} fill={Math.abs(i - (bins - 1) / 2) < 1 ? C.teal : '#334155'} />)}
      <Lbl x={20} y={114} text={pctS(lo)} size={9} color={C.muted} anchor="start" /><Lbl x={W / 2} y={114} text={`estimate ${pctS(p)}`} size={10} bold /><Lbl x={W - 20} y={114} text={pctS(hi)} size={9} color={C.muted} anchor="end" />
      <Lbl x={W / 2} y={H - 4} text={`${sims} runs · ±${Math.round(se * 1000) / 10} pts standard error`} size={9} color={C.muted} />
    </Svg>
  );
}

function KellyViz({ p, b }: { p: number; b: number }) {
  const W = 360; const H = 130; const q = 1 - p; const fk = Math.max(0, (b * p - q) / b); const g = (f: number) => p * Math.log(1 + b * f) + q * Math.log(1 - f);
  const fmax = Math.min(0.95, Math.max(0.3, fk * 2.5)); const X = (f: number) => 30 + (f / fmax) * (W - 50); const gmax = fk > 0 ? g(fk) : 0.01; const gmin = g(fmax);
  const Y = (v: number) => 20 + ((gmax - v) / Math.max(1e-6, gmax - gmin)) * 85; const pts: string[] = [];
  for (let f = 0; f <= fmax; f += fmax / 60) pts.push(`${X(f)},${Math.min(118, Y(g(f)))}`);
  return (
    <Svg w={W} h={H} label="growth rate against stake fraction">
      <line x1={30} x2={W - 20} y1={Y(0)} y2={Y(0)} stroke={C.muted} strokeDasharray="3 3" /><Lbl x={32} y={Y(0) - 4} text="growth 0" size={9} color={C.muted} anchor="start" />
      <polyline points={pts.join(' ')} fill="none" stroke={C.teal} strokeWidth="2" />
      {fk > 0 && <g><line x1={X(fk)} x2={X(fk)} y1={Y(gmax)} y2={118} stroke={C.ask} strokeWidth="1.5" strokeDasharray="4 3" /><Lbl x={X(fk)} y={Y(gmax) - 8} text={`Kelly f = ${pctS(fk)}`} color={C.ask} size={10} bold /></g>}
      <Lbl x={W - 20} y={H - 2} text="fraction of bankroll staked →" anchor="end" size={9} color={C.muted} />
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/* Composite solids: breaking a figure apart to find its volume        */
/* ------------------------------------------------------------------ */

type SolidPart = { x: number; y: number; z: number; l: number; w: number; h: number; label?: string };

/** Palette per piece: [top, left, right] so each prism reads as its own block. */
const PART_COLORS: [string, string, string][] = [
  ['#67e8f9', '#0e7490', '#06b6d4'],
  ['#fcd34d', '#b45309', '#f59e0b'],
  ['#c4b5fd', '#6d28d9', '#8b5cf6'],
  ['#86efac', '#15803d', '#22c55e'],
  ['#fda4af', '#be123c', '#f43f5e'],
];

/** One rectangular prism sitting at (x, y, z) on the grid, drawn as its three visible faces. */
function IsoBox({ b, s, ox, oy, colors, ghost }: { b: SolidPart; s: number; ox: number; oy: number; colors: [string, string, string]; ghost?: boolean }) {
  const P = (di: number, dj: number, dk: number): [number, number] => isoPoint(b.x + di, b.y + dj, b.z + dk, s, ox, oy);
  const top = [P(0, 0, b.h), P(b.l, 0, b.h), P(b.l, b.w, b.h), P(0, b.w, b.h)];
  const left = [P(0, b.w, 0), P(b.l, b.w, 0), P(b.l, b.w, b.h), P(0, b.w, b.h)];
  const right = [P(b.l, 0, 0), P(b.l, b.w, 0), P(b.l, b.w, b.h), P(b.l, 0, b.h)];
  const face = (pts: [number, number][], fill: string, key: string) => (
    <polygon key={key} points={poly(pts)} fill={ghost ? 'none' : fill} fillOpacity={ghost ? 0 : 1}
      stroke={ghost ? '#f472b6' : '#0f172a'} strokeWidth={ghost ? 1.4 : 1} strokeDasharray={ghost ? '5 4' : undefined} strokeLinejoin="round" />
  );
  return <g>{face(top, colors[0], 't')}{face(left, colors[1], 'l')}{face(right, colors[2], 'r')}</g>;
}

/**
 * A figure built from rectangular prisms, drawn back to front so the pieces stack correctly.
 * Each piece keeps its own colour and letter, and the legend under the drawing gives its
 * dimensions — that is the whole "break it apart" move made visible. A `ghost` piece is the
 * gap you fill in for the subtract method, so it is outlined rather than filled.
 */
function SolidViz({ parts, ghost, unit, showLabels }: { parts: SolidPart[]; ghost?: SolidPart; unit: string; showLabels?: boolean }) {
  const W = 380;
  const span = (f: (b: SolidPart) => number) => Math.max(...[...parts, ...(ghost ? [ghost] : [])].map(f));
  const L = span((b) => b.x + b.l); const Wd = span((b) => b.y + b.w); const H = span((b) => b.z + b.h);
  const { s, ox, oy, H: figH } = isoFrame(L, Wd, H, W);
  // Painter's algorithm: the piece whose back corner is furthest away is drawn first.
  const drawn = [...parts.map((b, i) => ({ b, i, ghost: false })), ...(ghost ? [{ b: ghost, i: -1, ghost: true }] : [])]
    .sort((p, q) => (p.b.x + p.b.y) - (q.b.x + q.b.y) || p.b.z - q.b.z);
  const legend = [...parts, ...(ghost ? [ghost] : [])];
  const rowH = 15; const legendTop = figH + 4;
  const totalH = legendTop + legend.length * rowH + 8;
  const centreOfTop = (b: SolidPart) => {
    const c = isoPoint(b.x + b.l / 2, b.y + b.w / 2, b.z + b.h, s, ox, oy);
    return c;
  };
  return (
    <Svg w={W} h={totalH} label={`a figure made of ${parts.length} rectangular prisms`}>
      {drawn.map((d) => <IsoBox key={d.ghost ? 'ghost' : `p${d.i}`} b={d.b} s={s} ox={ox} oy={oy} colors={PART_COLORS[Math.max(0, d.i) % PART_COLORS.length]} ghost={d.ghost} />)}
      {showLabels !== false && drawn.map((d) => {
        const [cx, cy] = centreOfTop(d.b);
        return <Lbl key={d.ghost ? 'gl' : `l${d.i}`} x={cx} y={cy + 4} text={d.b.label ?? ''} color={d.ghost ? C.ask : '#0f172a'} size={13} bold />;
      })}
      {legend.map((b, i) => {
        const isGhost = ghost !== undefined && i === legend.length - 1;
        const col = isGhost ? C.ask : PART_COLORS[i % PART_COLORS.length][2];
        const y = legendTop + i * rowH;
        return (
          <g key={`leg${i}`}>
            <rect x={16} y={y - 8} width={10} height={10} rx="2" fill={isGhost ? 'none' : col} stroke={isGhost ? C.ask : C.dark} strokeWidth="1" strokeDasharray={isGhost ? '3 2' : undefined} />
            <Lbl x={32} y={y + 1} text={`${b.label ?? ''}${b.label ? '  ' : ''}${b.l} × ${b.w} × ${b.h} ${unit}`} anchor="start" size={11} color={isGhost ? C.ask : C.line} />
            <Lbl x={W - 16} y={y + 1} text={`${b.l * b.w * b.h} ${unit}³`} anchor="end" size={11} color={isGhost ? C.ask : C.label} bold />
          </g>
        );
      })}
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/* Spiral review: place-value chart, area model, multiple choice        */
/* ------------------------------------------------------------------ */

const PLACE_LABEL: Record<number, string> = { 5: '100,000', 4: '10,000', 3: '1,000', 2: '100', 1: '10', 0: '1', [-1]: '0.1', [-2]: '0.01', [-3]: '0.001', [-4]: '0.0001' };
const PLACE_NAME: Record<number, string> = { 5: 'hund thou', 4: 'ten thou', 3: 'thousands', 2: 'hundreds', 1: 'tens', 0: 'ones', [-1]: 'tenths', [-2]: 'hundredths', [-3]: 'thousandths', [-4]: 'ten-thous' };

/**
 * A place-value chart. `shift` draws a second row with every digit moved that many places
 * (positive = left, ×10), with arrows between the rows, which is what multiplying and
 * dividing by a power of ten actually does. `highlight` rings one place column.
 */
function PvChartViz({ value, shift, highlight }: { value: string; shift?: number; highlight?: number }) {
  const clean = value.replace(/,/g, '').trim();
  const neg = clean.startsWith('-');
  const body = neg ? clean.slice(1) : clean;
  const dot = body.indexOf('.');
  const intPart = dot === -1 ? body : body.slice(0, dot);
  const decPart = dot === -1 ? '' : body.slice(dot + 1);
  const cells: { exp: number; d: string }[] = [
    ...intPart.split('').map((d, i) => ({ exp: intPart.length - 1 - i, d })),
    ...decPart.split('').map((d, i) => ({ exp: -(i + 1), d })),
  ];
  const sh = shift ?? 0;
  const exps = [...cells.map((c) => c.exp), ...cells.map((c) => c.exp + sh), 0, -1];
  const hi = Math.min(5, Math.max(...exps)); const lo = Math.max(-4, Math.min(...exps));
  const cols: number[] = []; for (let e = hi; e >= lo; e--) cols.push(e);
  const W = 384; const cw = Math.min(46, (W - 36) / cols.length); const x0 = (W - cols.length * cw) / 2;
  const X = (e: number) => x0 + (hi - e) * cw;
  const headY = 16; const nameY = 28; const row1 = 52; const row2 = 96;
  const H = sh ? 126 : 76;
  /** The digit in that column, filling in the zeros a written number needs (6140, 0.708). */
  const digitAt = (e: number, list: { exp: number; d: string }[]) => {
    const hit = list.find((c) => c.exp === e);
    if (hit) return hit.d;
    const top = Math.max(...list.map((c) => c.exp), 0); const bottom = Math.min(...list.map((c) => c.exp), 0);
    return e <= top && e >= bottom ? '0' : undefined;
  };
  const shifted = cells.map((c) => ({ exp: c.exp + sh, d: c.d }));
  const dotX = X(0) + cw; // the decimal point sits after the ones column
  return (
    <Svg w={W} h={H} label={`place value chart for ${value}`}>
      {cols.map((e) => (
        <g key={e}>
          <rect x={X(e)} y={row1 - 18} width={cw} height={24} fill={highlight === e ? '#0e7490' : 'none'} stroke={C.muted} strokeWidth="0.8" />
          <Lbl x={X(e) + cw / 2} y={headY} text={PLACE_LABEL[e] ?? ''} size={cols.length > 6 ? 8 : 9} color={C.muted} />
          <Lbl x={X(e) + cw / 2} y={nameY} text={PLACE_NAME[e] ?? ''} size={7} color="#64748b" />
        </g>
      ))}
      <line x1={dotX} x2={dotX} y1={row1 - 20} y2={sh ? row2 + 8 : row1 + 8} stroke={C.orange} strokeWidth="1.5" strokeDasharray="3 3" />
      {cols.map((e) => { const d = digitAt(e, cells); return d ? <Lbl key={`d${e}`} x={X(e) + cw / 2} y={row1} text={d} size={16} bold color={highlight === e ? '#fef08a' : C.line} /> : null; })}
      {!!sh && (
        <g>
          {cols.map((e) => <rect key={`sc${e}`} x={X(e)} y={row2 - 18} width={cw} height={24} fill="none" stroke={C.muted} strokeWidth="0.8" strokeOpacity="0.6" />)}
          {cols.map((e) => { const d = digitAt(e, shifted); return d ? <Lbl key={`s${e}`} x={X(e) + cw / 2} y={row2} text={d} size={16} bold color={C.teal} /> : null; })}
          {cells.map((c, i) => {
            const from = X(c.exp) + cw / 2; const to = X(c.exp + sh) + cw / 2;
            if (to < x0 - 2 || to > x0 + cols.length * cw + 2) return null;
            return <path key={`a${i}`} d={`M ${from} ${row1 + 8} Q ${(from + to) / 2} ${row1 + 30} ${to} ${row2 - 20}`} fill="none" stroke={C.teal} strokeWidth="1.2" markerEnd="url(#arrowT)" opacity="0.8" />;
          })}
          <Lbl x={W - 8} y={row2 + 18} text={sh > 0 ? `× 10${'⁰¹²³⁴'[Math.abs(sh)] ?? ''} — every digit moves ${sh} place${sh === 1 ? '' : 's'} left` : `÷ 10${'⁰¹²³⁴'[Math.abs(sh)] ?? ''} — every digit moves ${-sh} place${sh === -1 ? '' : 's'} right`} anchor="end" size={9} color={C.teal} />
        </g>
      )}
    </Svg>
  );
}

/**
 * A partial-quotients area model: one strip per chunk taken off, the divisor down the side,
 * the partial quotient over each strip and its product inside. A `blank` strip shows "?".
 */
function AreaModelViz({ divisor, rows, blank, total }: { divisor: number; rows: { q: number; product: number }[]; blank?: number; total?: number }) {
  const W = 384; const left = 44; const avail = W - left - 14;
  const base = Math.min(46, avail / Math.max(rows.length, 1));
  const spare = Math.max(0, avail - base * rows.length);
  const sum = rows.reduce((a, r) => a + r.product, 0) || 1;
  const widths = rows.map((r) => base + (spare * r.product) / sum);
  const top = 34; const boxH = 52; const H = total !== undefined ? 124 : 104;
  let x = left;
  const strips = rows.map((r, i) => { const w = widths[i]; const s = { r, i, x, w }; x += w; return s; });
  return (
    <Svg w={W} h={H} label={`area model dividing by ${divisor}`}>
      <rect x={left} y={top} width={x - left} height={boxH} fill="#0f172a" stroke={C.line} strokeWidth="1.5" />
      <Lbl x={left - 8} y={top + boxH / 2 + 2} text={String(divisor)} anchor="end" size={15} bold />
      <Lbl x={left - 8} y={top + boxH / 2 + 16} text="wide" anchor="end" size={8} color={C.muted} />
      {strips.map(({ r, i, x: sx, w }) => (
        <g key={i}>
          {i > 0 && <line x1={sx} x2={sx} y1={top} y2={top + boxH} stroke={C.line} strokeWidth="1.2" />}
          <Lbl x={sx + w / 2} y={top - 8} text={String(r.q)} size={13} bold color={C.teal} />
          <Lbl x={sx + w / 2} y={top + boxH / 2 + 5} text={blank === i ? '?' : String(r.product)} size={w > 60 ? 13 : 11} bold color={blank === i ? C.ask : C.label} />
        </g>
      ))}
      <Lbl x={left + (x - left) / 2} y={top + boxH + 18} text={`${rows.map((r, i) => (blank === i ? '?' : r.product)).join(' + ')} = ${sum.toLocaleString('en-US')}`} size={10} color={C.muted} />
      {total !== undefined && <Lbl x={left + (x - left) / 2} y={top + boxH + 36} text={`quotient: ${rows.map((r) => r.q).join(' + ')} = ${total}`} size={11} color={C.teal} bold />}
    </Svg>
  );
}

/** Numbered choices, the way a review sheet lays them out, with the clue to use written under. */
function OptionsViz({ items, note }: { items: string[]; note?: string }) {
  const W = 384; const rowH = 30; const H = items.length * rowH + (note ? 30 : 12);
  return (
    <Svg w={W} h={H} label={`${items.length} options to choose between`}>
      {items.map((it, i) => (
        <g key={i}>
          <rect x={16} y={6 + i * rowH} width={W - 32} height={rowH - 6} rx="6" fill="#0f172a" stroke={C.muted} strokeWidth="1" />
          <circle cx={34} cy={6 + i * rowH + (rowH - 6) / 2} r="10" fill="#164e63" stroke={C.teal} strokeWidth="1.2" />
          <Lbl x={34} y={6 + i * rowH + (rowH - 6) / 2 + 4} text={String(i + 1)} size={11} color={C.teal} bold />
          <Lbl x={54} y={6 + i * rowH + (rowH - 6) / 2 + 5} text={it} anchor="start" size={14} bold />
        </g>
      ))}
      {note && <Lbl x={W / 2} y={H - 8} text={note} size={10} color={C.muted} />}
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/* Calculus prep: fraction bars, a coordinate grid, a trig triangle     */
/* ------------------------------------------------------------------ */

/** Each fraction as a strip cut into d parts with n shaded; `into` re-cuts every strip into the common denominator so the pieces line up. */
function FracBarViz({ fracs, into, op }: { fracs: { n: number; d: number; label?: string }[]; into?: number; op?: string }) {
  const W = 384; const left = 64; const barW = W - left - 16; const rowH = 34; const H = fracs.length * rowH + 22;
  return (
    <Svg w={W} h={H} label={`fraction bars ${fracs.map((f) => `${f.n}/${f.d}`).join(op ? ` ${op} ` : ', ')}`}>
      {fracs.map((f, r) => {
        const y = 8 + r * rowH; const cells = into ?? f.d; const cw = barW / cells; const per = into ? into / f.d : 1;
        return (
          <g key={r}>
            <Lbl x={left - 10} y={y + 16} text={f.label?.trim() || `${f.n}/${f.d}`} anchor="end" size={13} bold />
            {Array.from({ length: cells }, (_, i) => <rect key={i} x={left + i * cw + 1} y={y} width={Math.max(1, cw - 2)} height={22} rx="2" fill={i < f.n * per ? (r === 0 ? '#0d9488' : '#b45309') : 'rgba(255,255,255,0.06)'} stroke="rgba(148,163,184,0.35)" strokeWidth="0.8" />)}
            {into && into !== f.d && Array.from({ length: f.d + 1 }, (_, i) => <line key={`m${i}`} x1={left + (i * barW) / f.d} x2={left + (i * barW) / f.d} y1={y - 2} y2={y + 24} stroke={C.line} strokeWidth="1.4" />)}
            {into && <Lbl x={W - 16} y={y + 16} text={`= ${f.n * per}/${into}`} anchor="end" size={11} color={C.muted} />}
            {r > 0 && op && <Lbl x={left - 10} y={y - 4} text={op} anchor="end" size={12} color={C.muted} />}
          </g>
        );
      })}
      <Lbl x={W / 2} y={H - 4} text={into ? `same whole, now ${into} equal pieces in each strip` : fracs.length === 1 ? 'one whole; equal pieces; the shaded pieces are the part' : 'compare the shaded parts of the same-size whole'} size={9} color={C.muted} />
    </Svg>
  );
}

/** A small coordinate grid with a line and marked points. */
function GridViz({ points, line, markX, range }: { points: [number, number][]; line?: { m: number; b: number }; markX?: number; range?: number }) {
  const R = range ?? Math.max(5, ...points.flatMap((p) => [Math.abs(p[0]), Math.abs(p[1])]), markX !== undefined ? Math.abs(markX) : 0) + 1;
  const W = 300; const H = 300; const s = (W - 40) / (2 * R); const X = (x: number) => W / 2 + x * s; const Y = (y: number) => H / 2 - y * s;
  const ticks: number[] = []; for (let v = -R; v <= R; v++) ticks.push(v);
  const every = R > 8 ? 2 : 1;
  const yAt = (x: number) => (line ? line.m * x + line.b : 0);
  return (
    <Svg w={W} h={H} label={`a grid with the points ${points.map((p) => `(${p[0]}, ${p[1]})`).join(' and ')}`} max={360}>
      {ticks.map((v) => <g key={v}><line x1={X(v)} x2={X(v)} y1={Y(-R)} y2={Y(R)} stroke={v === 0 ? C.muted : GRID_LINE} strokeWidth={v === 0 ? 1.4 : 1} /><line x1={X(-R)} x2={X(R)} y1={Y(v)} y2={Y(v)} stroke={v === 0 ? C.muted : GRID_LINE} strokeWidth={v === 0 ? 1.4 : 1} />{v !== 0 && v % every === 0 && <><Lbl x={X(v)} y={Y(0) + 12} text={String(v)} size={8} color={C.muted} /><Lbl x={X(0) - 4} y={Y(v) + 3} text={String(v)} size={8} color={C.muted} anchor="end" /></>}</g>)}
      <Lbl x={X(R) - 2} y={Y(0) - 4} text="x" size={10} color={C.muted} anchor="end" /><Lbl x={X(0) + 6} y={Y(R) + 10} text="y" size={10} color={C.muted} anchor="start" />
      {line && <line x1={X(-R)} y1={Y(yAt(-R))} x2={X(R)} y2={Y(yAt(R))} stroke={C.teal} strokeWidth="2" strokeLinecap="round" />}
      {markX !== undefined && line && <g><line x1={X(markX)} x2={X(markX)} y1={Y(0)} y2={Y(yAt(markX))} stroke={C.ask} strokeWidth="1.2" strokeDasharray="3 3" /><line x1={X(0)} x2={X(markX)} y1={Y(yAt(markX))} y2={Y(yAt(markX))} stroke={C.ask} strokeWidth="1.2" strokeDasharray="3 3" /></g>}
      {points.map((p, i) => <g key={i}><circle cx={X(p[0])} cy={Y(p[1])} r="6" fill={C.dark} /><circle cx={X(p[0])} cy={Y(p[1])} r="4" fill={C.label} /><Lbl x={X(p[0]) + 8} y={Y(p[1]) - 6} text={`(${p[0]}, ${p[1]})`} size={10} anchor="start" bold /></g>)}
    </Svg>
  );
}
const GRID_LINE = 'rgba(148,163,184,0.16)';

/** A right triangle with θ at the bottom-left, sides named from θ: opposite (vertical), adjacent (bottom), hypotenuse. */
function TriRatViz({ opp, adj, hyp, theta, unit }: { opp: number | '?'; adj: number | '?'; hyp: number | '?'; theta?: number | '?'; unit?: string }) {
  const W = 360; const H = 210;
  // Draw the true shape: from the angle when it is given, else from whichever sides are known.
  let a = 4; let o = 3;
  if (typeof theta === 'number' && theta > 0 && theta < 90) { a = 1; o = Math.tan((theta * Math.PI) / 180); }
  else if (typeof adj === 'number' && typeof opp === 'number') { a = adj; o = opp; }
  else if (typeof hyp === 'number' && typeof adj === 'number') { a = adj; o = Math.sqrt(Math.max(0.2, hyp * hyp - adj * adj)); }
  else if (typeof hyp === 'number' && typeof opp === 'number') { o = opp; a = Math.sqrt(Math.max(0.2, hyp * hyp - opp * opp)); }
  const k = Math.min(200 / a, 140 / o); const x0 = 36; const y0 = 176; const x1 = x0 + a * k; const y1 = y0 - o * k;
  const u = unit ? ` ${unit}` : '';
  const t = (v: number | '?') => (v === '?' ? '?' : `${v}${u}`);
  return (
    <Svg w={W} h={H} label="a right triangle with the angle theta marked">
      <polygon points={`${x0},${y0} ${x1},${y0} ${x1},${y1}`} fill="#1f2937" stroke={C.line} strokeWidth="2.5" strokeLinejoin="round" />
      <path d={`M ${x1 - 14} ${y0} L ${x1 - 14} ${y0 - 14} L ${x1} ${y0 - 14}`} fill="none" stroke={C.muted} strokeWidth="1" />
      <path d={`M ${x0 + 28} ${y0} A 28 28 0 0 0 ${x0 + 28 * Math.cos(Math.atan2(o, a))} ${y0 - 28 * Math.sin(Math.atan2(o, a))}`} fill="none" stroke={C.orange} strokeWidth="2" />
      <Lbl x={x0 + 40} y={y0 - 8} text={theta === undefined ? 'θ' : theta === '?' ? 'θ = ?' : `θ = ${theta}°`} color={C.orange} size={12} bold anchor="start" />
      <Lbl x={(x0 + x1) / 2} y={y0 + 16} text={`adjacent ${t(adj)}`} color={adj === '?' ? C.ask : C.label} size={11} bold />
      <Lbl x={x1 + 8} y={(y0 + y1) / 2 + 4} text={`opp. ${t(opp)}`} color={opp === '?' ? C.ask : C.label} size={11} bold anchor="start" />
      <Lbl x={(x0 + x1) / 2 - 12} y={(y0 + y1) / 2 - 10} text={`hyp. ${t(hyp)}`} color={hyp === '?' ? C.ask : C.label} size={11} bold anchor="end" />
      <Lbl x={W - 8} y={14} text="SOH · CAH · TOA" color={C.muted} size={10} anchor="end" />
    </Svg>
  );
}
