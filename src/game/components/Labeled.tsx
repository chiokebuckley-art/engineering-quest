import { Fragment, type ReactNode } from 'react';
import { LABELED } from '../../engine/label';

/**
 * Shows maths text with its number labels styled: "40 (total coins)" keeps the number and its label together on one
 * line (a long equation wraps at an operator instead) and sets the label apart from maths brackets. Screen readers
 * read the same words as the text.
 */
export function labeled(text: string | undefined | null): ReactNode {
  if (!text) return text ?? null;
  const out: ReactNode[] = []; let last = 0;
  for (const m of text.matchAll(new RegExp(LABELED.source, 'g'))) {
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    out.push(<span key={at} className="qty">{m[1]}{' '}<span className="qty-label">({m[2]})</span></span>);
    last = at + m[0].length;
  }
  if (!out.length) return text;
  if (last < text.length) out.push(text.slice(last));
  return <>{out.map((x, i) => <Fragment key={i}>{x}</Fragment>)}</>;
}
export const hasLabels = (text: string | undefined | null) => !!text && new RegExp(LABELED.source).test(text);
/** Maths text with labelled numbers. */
export function Labeled({ text }: { text: string | undefined | null }) { return <>{labeled(text)}</>; }
/** The one-line key that says what the words in brackets are. */
export const LabelKey = () => <p className="qty-key">Words in (brackets) say what each number is.</p>;
