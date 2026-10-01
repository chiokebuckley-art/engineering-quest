import type { FactId } from '../types';

/** Canonical multiplication fact id: smaller factor first, so 6×7 and 7×6 share one record. */
export function multFactId(a: number, b: number): FactId {
  const [x, y] = a <= b ? [a, b] : [b, a];
  return `fact:mult:${x}x${y}`;
}

export function parseMultFact(id: FactId): { a: number; b: number } | null {
  const m = /^fact:mult:(\d+)x(\d+)$/.exec(id);
  return m ? { a: Number(m[1]), b: Number(m[2]) } : null;
}

/** Division fact: dividend ÷ divisor. 42÷6 and 42÷7 are different facts. */
export function divFactId(dividend: number, divisor: number): FactId {
  return `fact:div:${dividend}/${divisor}`;
}

export function parseDivFact(id: FactId): { dividend: number; divisor: number } | null {
  const m = /^fact:div:(\d+)\/(\d+)$/.exec(id);
  return m ? { dividend: Number(m[1]), divisor: Number(m[2]) } : null;
}

/** All facts of one multiplication table (n × 1 … n × 12), canonicalised. */
export function tableFacts(n: number, max = 12): FactId[] {
  const out: FactId[] = [];
  for (let m = 1; m <= max; m++) out.push(multFactId(n, m));
  return out;
}

export function divisionTableFacts(divisor: number, max = 12): FactId[] {
  const out: FactId[] = [];
  for (let q = 1; q <= max; q++) out.push(divFactId(divisor * q, divisor));
  return out;
}

/** Number bond fact: the pair (part, total − part) that makes `total`. Canonical: smaller part first. */
export function bondFactId(total: number, part: number): FactId {
  const p = Math.min(part, total - part);
  return `fact:bond:${total}:${p}`;
}
export function parseBondFact(id: FactId): { total: number; part: number } | null {
  const m = /^fact:bond:(\d+):(\d+)$/.exec(id);
  return m ? { total: Number(m[1]), part: Number(m[2]) } : null;
}
/** The tracked bonds for a total: every integer up to 10, steps of 5 above that. */
export function bondFacts(total: number): FactId[] {
  const step = total <= 20 ? 1 : 5;
  const out: FactId[] = [];
  for (let p = 0; p <= total / 2; p += step) out.push(bondFactId(total, p));
  return out;
}

export function factLabel(id: FactId): string {
  const m = parseMultFact(id);
  if (m) return `${m.a} × ${m.b}`;
  const d = parseDivFact(id);
  if (d) return `${d.dividend} ÷ ${d.divisor}`;
  const b = parseBondFact(id);
  if (b) return `${b.part} + ${b.total - b.part} = ${b.total}`;
  return id;
}
