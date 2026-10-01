import type { CSSProperties, ReactNode } from 'react';
import { bandFor, BAND_COLORS } from '../../engine/mastery/MasteryEngine';
import { asset } from '../../assets';

export function Icon({ name, className = '', style, title }: { name: string; className?: string; style?: CSSProperties; title?: string }) {
  const src = /^(\/|data:)/.test(name) ? asset(name) : asset(`/assets/icons/${name}.svg`);
  return <span className={`icon ${className}`} style={{ ...style, ['--icon' as string]: `url("${src}")` }} title={title} aria-hidden={!title} role={title ? 'img' : undefined} />;
}

export function Bar({ value, max, kind = '', className = '', label, right, thin, thick }: { value: number; max: number; kind?: string; className?: string; label?: string; right?: string; thin?: boolean; thick?: boolean }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className={className}>
      {(label || right) && <div className="bar-label"><span>{label}</span><span>{right}</span></div>}
      <div className={`bar ${kind} ${thin ? 'thin' : ''} ${thick ? 'thick' : ''}`}><i style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

export function MasteryChip({ value }: { value: number }) {
  const band = bandFor(value);
  return <span className="chip" style={{ borderColor: BAND_COLORS[band], color: BAND_COLORS[band] }}>{Math.round(value)}% · {band}</span>;
}

export function Ring({ value, label, size = 120, color = 'var(--amber)' }: { value: number; label?: string; size?: number; color?: string }) {
  const r = 50; const c = 2 * Math.PI * r;
  return (
    <div className="progress-ring" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" width={size} height={size}>
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${c}`} strokeDashoffset={`${c * (1 - Math.max(0, Math.min(1, value / 100)))}`} style={{ transition: 'stroke-dashoffset 0.6s ease', filter: 'drop-shadow(0 0 6px currentColor)' }} />
      </svg>
      <div className="v">{Math.round(value)}%{label && <small>{label}</small>}</div>
    </div>
  );
}

export function Panel({ title, icon, children, className = '', right }: { title?: string; icon?: string; children: ReactNode; className?: string; right?: ReactNode }) {
  return (
    <section className={`panel ${className}`}>
      {title && (
        <div className="panel-title">
          {icon && <Icon name={icon} className="lg brass" />}
          <h3>{title}</h3>
          <span className="spacer" />
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

export function fmtTime(ms: number) {
  if (!ms) return '—';
  return `${(ms / 1000).toFixed(1)}s`;
}

export function fmtAgo(ts: number, now = Date.now()) {
  if (!ts) return 'never';
  const d = now - ts;
  if (d < 60_000) return 'just now';
  if (d < 3_600_000) return `${Math.round(d / 60_000)} min ago`;
  if (d < 86_400_000) return `${Math.round(d / 3_600_000)} h ago`;
  return `${Math.round(d / 86_400_000)} d ago`;
}
