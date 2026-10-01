import { Fragment, useState, type ReactNode } from 'react';
import { GLOSSARY_RE, termFor, type Term } from '../../engine/reality/intro';
import { LABELED } from '../../engine/label';
import { labeled } from '../components/Labeled';

/**
 * Text with its technical words made tappable: tap one to see what it means, in plain words. Only the first
 * use of each word in a block is marked, so the text stays readable. Number labels such as "3 (resistor volts)" are
 * styled by `labeled`, and words inside a label are never made into glossary buttons.
 */
export function Glossed({ text, as = 'span', className }: { text: string; as?: 'span' | 'p'; className?: string }) {
  const [open, setOpen] = useState<Term | null>(null);
  const seen = new Set<string>();
  const out: ReactNode[] = [];
  let last = 0;
  const labels = [...text.matchAll(new RegExp(LABELED.source, 'g'))].map((m) => [m.index ?? 0, (m.index ?? 0) + m[0].length]);
  for (const m of text.matchAll(GLOSSARY_RE)) {
    const at = m.index ?? 0;
    if (labels.some(([a, b]) => at < b && at + m[0].length > a)) continue;
    const t = termFor(m[0]);
    if (!t || seen.has(t.key)) continue;
    seen.add(t.key);
    out.push(<Fragment key={`t${m.index}`}>{labeled(text.slice(last, m.index))}</Fragment>);
    out.push(<button key={`b${m.index}`} type="button" className={`rl-term ${open?.key === t.key ? 'on' : ''}`} onClick={(e) => { e.stopPropagation(); setOpen(open?.key === t.key ? null : t); }} aria-expanded={open?.key === t.key}>{m[0]}</button>);
    last = (m.index ?? 0) + m[0].length;
  }
  out.push(<Fragment key="end">{labeled(text.slice(last))}</Fragment>);
  const Tag = as;
  return (
    <>
      <Tag className={className}>{out}</Tag>
      {open && <span className="rl-def" role="note"><b>{open.key}</b> {open.def} <button type="button" className="rl-def-x" onClick={() => setOpen(null)} aria-label="Close">✕</button></span>}
    </>
  );
}
