import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Difficulty, Question } from '../types';
import type { ContestVisual } from '../contest/visuals';
import { createRng } from '../rng';
import { checkAnswer } from '../questions';
import { PICTURE_GAMES } from '../questions/games';
import { LOGIC_KINDS, LOGIC_KIND_GRADES, LOGIC_META, logicQuestion, type LogicKind } from '../questions/logicLite';
import { LOGIC_LESSONS } from '../../content/contest/logicLite';
import { gradeOf } from '../contest/common';
import { violatesCaps } from '../contest/grades';
import { LABELED } from '../label';
import { arithmeticSlips } from '../academy/teachMath';
import { LogicGrid } from '../../game/components/contest/LogicViz';

/**
 * Logic Lite: every kind at every difficulty, many seeds. Each answer is worked out again here from the picture and
 * the words of the prompt, with its own small parser and a brute-force search (every arrangement, every world, every
 * handful), never with the generator's helpers. Grids, line-ups and fibber puzzles must have exactly one solution.
 */
type Scene = Extract<ContestVisual, { type: 'scene' }>;
type Grid = Extract<ContestVisual, { type: 'logicgrid' }>;
type Speak = Extract<ContestVisual, { type: 'speakers' }>;
const KINDS = ['truefalse', 'grid', 'order', 'mustmight', 'liar'] as const;
type Kind = (typeof KINDS)[number];
const DS: Difficulty[] = [1, 2, 3, 4, 5, 6];
const N = 120;

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const LABEL_OK = /^[A-Za-z][A-Za-z ',/-]*[A-Za-z]$/;
function checkLabels(s: string) {
  const after = [...s.matchAll(/(?:\d|\?|%) \(([^)]*)\)/g)];
  for (const m of after) expect(LABEL_OK.test(m[1]), `bad label "(${m[1]})" in: ${s}`).toBe(true);
  expect([...s.matchAll(new RegExp(LABELED.source, 'g'))].length, s).toBe(after.length);
}
/** Numbers in worked text with no label after them (quoted sentences, clue numbers and places like 2nd are fine). */
const bareNumbers = (s: string) => s.replace(/“[^”]*”/g, '').replace(/Clue \d+/g, '').replace(/\d+(st|nd|rd|th)\b/g, '')
  .match(/(?<!\d)\d+(?!\d)(?! \()/g) ?? [];
const words = (s: string) => s.split(/[.?!]/).map((x) => x.trim()).filter(Boolean).map((x) => x.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length);
const nums = (s: string) => [...s.matchAll(/\d[\d,]*(?:\.\d+)?/g)].map((m) => Number(m[0].replace(/,/g, '')));
const texts = (q: Question) => [q.prompt, q.expression, q.hint, q.readAloud ?? '', ...q.solutionSteps, ...q.explanation, ...(q.choices ?? []).map((c) => c.label)];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** "There are 1 birds", "1 (red apples)", "and 1 blue hats": a count of one with a plural noun or verb. */
const PLURALS = 'apples|frogs|balls|birds|cars|kites|hats|flowers|marbles|shirts|robots|colours|truth-tellers|fibbers|things';
const singularSlips = (s: string) => [
  ...(s.match(/\b(?:There|there) are 1\b/g) ?? []),
  ...(s.match(new RegExp(`(?<![\\d.])\\b1 \\(?(?:(?:more|red|blue|yellow|green|purple|orange) ){0,2}(?:${PLURALS})\\b`, 'g')) ?? []),
];
/** All orderings of 0..n-1. */
function perms(n: number): number[][] {
  if (n === 0) return [[]];
  return perms(n - 1).flatMap((p) => Array.from({ length: n }, (_, i) => [...p.slice(0, i), n - 1, ...p.slice(i)]));
}
/** Every way to take k things from piles of these sizes (how many of each pile). */
function handfuls(piles: number[], k: number): number[][] {
  if (!piles.length) return k === 0 ? [[]] : [];
  const out: number[][] = [];
  for (let a = 0; a <= Math.min(piles[0], k); a++) for (const rest of handfuls(piles.slice(1), k - a)) out.push([a, ...rest]);
  return out;
}
/** The value of the choice with this label. */
function valueOf(q: Question, label: string): number {
  const c = q.choices!.find((x) => x.label === label);
  expect(c, `no choice "${label}" in ${JSON.stringify(q.choices)}`).toBeTruthy();
  return c!.value;
}
/** The clue sentences of a grid or line-up prompt. */
function cluesOf(p: string): string[] {
  const parts = p.split(/ ?Clue \d+: /).slice(1);
  const last = parts.length - 1;
  parts[last] = parts[last].replace(/ (Who|What)\b.*$/, '');
  return parts.map((x) => x.trim());
}

/* ---------- true, false or can't tell ---------- */

const NOUN: Record<string, string> = {
  apple: 'apple', apples: 'apple', frog: 'frog', frogs: 'frog', ball: 'ball', balls: 'ball', fish: 'fish', bird: 'bird', birds: 'bird',
  car: 'car', cars: 'car', kite: 'kite', kites: 'kite', hat: 'hat', hats: 'hat', flower: 'flower', flowers: 'flower',
};
const ALL_COLORS = ['red', 'blue', 'yellow', 'green', 'purple', 'orange'];
const thing = (w: string) => { const t = NOUN[w]; expect(t, `unknown thing "${w}"`).toBeTruthy(); return t; };
type World = Map<string, number>;
/** A plain sentence about counts, read against one world (how many of each colour of each thing). */
function countTruth(text: string, w: World): boolean {
  const n = (t: string, c?: string) => sum([...w.entries()].filter(([k]) => k.startsWith(`${t}:`) && (!c || k === `${t}:${c}`)).map(([, v]) => v));
  let m: RegExpExecArray | null;
  if ((m = /^There (?:is|are) (\d+) more (\w+) (\w+) than (\w+) (\w+)\.$/.exec(text))) { expect(thing(m[3])).toBe(thing(m[5])); return n(thing(m[3]), m[2]) - n(thing(m[5]), m[4]) === +m[1]; }
  if ((m = /^There are more (\w+) (\w+) than (\w+) (\w+)\.$/.exec(text))) return n(thing(m[2]), m[1]) > n(thing(m[4]), m[3]);
  if ((m = /^There are fewer than (\d+) (\w+) (\w+)\.$/.exec(text))) return n(thing(m[3]), m[2]) < +m[1];
  if ((m = /^There are fewer (\w+) (\w+) than (\w+) (\w+)\.$/.exec(text))) return n(thing(m[2]), m[1]) < n(thing(m[4]), m[3]);
  if ((m = /^There are as many (\w+) (\w+) as (\w+) (\w+)\.$/.exec(text))) return n(thing(m[2]), m[1]) === n(thing(m[4]), m[3]);
  if ((m = /^There are twice as many (\w+) (\w+) as (\w+) (\w+)\.$/.exec(text))) return n(thing(m[2]), m[1]) === 2 * n(thing(m[4]), m[3]);
  if ((m = /^There are (\d+) (\w+) in all\.$/.exec(text))) return n(thing(m[2])) === +m[1];
  if ((m = /^There are at least (\d+) (\w+) (\w+)\.$/.exec(text))) return n(thing(m[3]), m[2]) >= +m[1];
  if ((m = /^There are exactly (\d+) (\w+) (\w+)\.$/.exec(text))) return n(thing(m[3]), m[2]) === +m[1];
  if ((m = /^There (?:is|are) (\d+) (\w+) (\w+)\.$/.exec(text))) return n(thing(m[3]), m[2]) === +m[1];
  if ((m = /^There is an? (\w+) (\w+)\.$/.exec(text))) return n(thing(m[2]), m[1]) >= 1;
  if ((m = /^Every (\w+) is (\w+)\.$/.exec(text))) return n(thing(m[1])) > 0 && n(thing(m[1]), m[2]) === n(thing(m[1]));
  if ((m = /^No (\w+) is (\w+)\.$/.exec(text))) return n(thing(m[1]), m[2]) === 0;
  if ((m = /^Half of the (\w+) are (\w+)\.$/.exec(text))) return 2 * n(thing(m[1]), m[2]) === n(thing(m[1]));
  throw new Error(`unknown sentence: ${text}`);
}
const CANNOT_SEE = /at home|taste|hungry|fastest|go fast|belongs? to|smell|heaviest|are heavy|fly high|hiding behind|is called/;
/** What a counting sentence is about: its thing, its colours, and whether it speaks of every colour of the thing. */
function subjectOf(part: string): { t: string; cs: string[]; all: boolean } {
  const ws = part.toLowerCase().match(/[a-z]+/g) ?? [];
  return { t: thing(ws.find((w) => NOUN[w])!), cs: ws.filter((w) => ALL_COLORS.includes(w)), all: /^every |in all|^half /i.test(part) };
}
/** 1 true, 2 false, 3 can't tell: true in every world the picture allows, false in every one, or it depends. */
function solveTrueFalse(q: Question): number {
  const v = q.visual as Scene; const text = q.expression.replace(/^“|”$/g, '');
  expect(q.readAloud).toContain(text);
  expect(q.choices!.map((c) => c.label)).toEqual(['True', 'False', "Can't tell"]);
  if (CANNOT_SEE.test(text)) return 3;
  const row = v.items.every((x) => x.n === 1 && !x.hidden);
  let m: RegExpExecArray | null;
  if (row && (m = /^The (\w+) is (next to|to the left of|between) the (\w+)(?: and the (\w+))?\.$/.exec(text))) {
    const at = (name: string) => { const i = v.items.findIndex((x) => x.label === name && x.icon === name); expect(i, name).toBeGreaterThanOrEqual(0); return i; };
    const a = at(m[1]), b = at(m[3]);
    if (m[2] === 'next to') return Math.abs(a - b) === 1 ? 1 : 2;
    if (m[2] === 'to the left of') return a < b ? 1 : 2;
    const c = at(m[4]);
    return Math.min(b, c) < a && a < Math.max(b, c) ? 1 : 2;
  }
  // The worlds: what you can see, plus anything from 0 to 25 more of one colour in the shut box.
  const base: World = new Map();
  for (const x of v.items.filter((i) => !i.hidden)) { const k = `${x.icon}:${x.color}`; base.set(k, (base.get(k) ?? 0) + x.n); }
  const box = v.items.find((x) => x.hidden);
  expect(/The box is shut/.test(q.prompt)).toBe(!!box);
  const worlds: World[] = [base];
  if (box) for (const c of ALL_COLORS) for (let k = 1; k <= 25; k++) { const w = new Map(base); w.set(`${box.icon}:${c}`, (w.get(`${box.icon}:${c}`) ?? 0) + k); worlds.push(w); }
  const and = /^(.*), and (.*)\.$/.exec(text);
  if (and) {
    // the two parts talk about different things, or different colours of one thing (never "a blue frog, and no frog is blue")
    const a = subjectOf(and[1]), b = subjectOf(and[2]);
    if (a.t === b.t) { expect(a.all || b.all, text).toBe(false); expect(a.cs.some((c) => b.cs.includes(c)), text).toBe(false); }
  }
  const truth = (w: World) => (and ? countTruth(`${and[1]}.`, w) && countTruth(`${cap(and[2])}.`, w) : countTruth(text, w));
  const seen = new Set(worlds.map(truth));
  return seen.size === 2 ? 3 : seen.has(true) ? 1 : 2;
}

/* ---------- who has what ---------- */

function solveGrid(q: Question): number {
  const v = q.visual as Grid; const names = v.rows, items = v.cols; const n = names.length;
  expect(v.cols.length).toBe(n);
  const who = (s: string) => { const i = names.indexOf(s); expect(i, s).toBeGreaterThanOrEqual(0); return i; };
  const what = (s: string) => { const i = items.indexOf(s); expect(i, s).toBeGreaterThanOrEqual(0); return i; };
  const clues = cluesOf(q.prompt);
  expect(clues.length, q.prompt).toBeGreaterThanOrEqual(2); expect(clues.length).toBeLessThanOrEqual(4);
  const tests = clues.map((c): ((pm: number[]) => boolean) => {
    let m: RegExpExecArray | null;
    if ((m = /^(\w+) does not have the (.+?) or the (.+?)\.$/.exec(c))) { const p = who(m[1]), x = what(m[2]), y = what(m[3]); return (pm) => pm[p] !== x && pm[p] !== y; }
    if ((m = /^(\w+) does not have the (.+?)\.$/.exec(c))) { const p = who(m[1]), x = what(m[2]); return (pm) => pm[p] !== x; }
    if ((m = /^(\w+) and (\w+) do not have the (.+?)\.$/.exec(c))) { const p = who(m[1]), r = who(m[2]), x = what(m[3]); return (pm) => pm[p] !== x && pm[r] !== x; }
    if ((m = /^(\w+) has the (.+?)\.$/.exec(c))) { const p = who(m[1]), x = what(m[2]); return (pm) => pm[p] === x; }
    if ((m = /^The (.+?) belongs to (\w+) or (\w+)\.$/.exec(c))) { const x = what(m[1]), p = who(m[2]), r = who(m[3]); return (pm) => pm[p] === x || pm[r] === x; }
    throw new Error(`unknown clue: ${c}`);
  });
  const sols = perms(n).filter((pm) => tests.every((t) => t(pm)));
  expect(sols.length, `${q.prompt} has ${sols.length} solutions`).toBe(1);
  const sol = sols[0];
  // every clue is needed
  for (let i = 0; i < tests.length; i++) expect(perms(n).filter((pm) => tests.every((t, j) => j === i || t(pm))).length, `clue ${i + 1} is not needed: ${q.prompt}`).toBeGreaterThan(1);
  const sv = q.solutionVisual as Grid;
  expect(sv.marks).toEqual(names.map((_, p) => items.map((_, x) => (sol[p] === x ? 'yes' : 'no'))));
  let m: RegExpExecArray | null;
  if ((m = /Who has the (.+?)\? Tap a name\.$/.exec(q.prompt))) {
    const owner = names[sol.indexOf(what(m[1]))];
    expect(q.choices!.map((c) => c.label)).toEqual(names);
    expect(clues).not.toContain(`${owner} has the ${m[1]}.`);
    return valueOf(q, owner);
  }
  m = /What does (\w+) have\? Tap the (\w+)\.$/.exec(q.prompt);
  expect(m, q.prompt).toBeTruthy();
  expect(q.choices!.map((c) => c.label)).toEqual(items);
  const item = items[sol[who(m![1])]];
  expect(clues).not.toContain(`${m![1]} has the ${item}.`);
  return valueOf(q, item);
}

/* ---------- line-ups ---------- */

const ORD = ['1st', '2nd', '3rd', '4th', '5th'];
function solveOrder(q: Question): number {
  const v = q.visual as Grid; const names = v.rows; const n = names.length;
  const height = /are all different heights/.test(q.prompt);
  expect(height || /stand in a line, one behind the other/.test(q.prompt)).toBe(true);
  const who = (s: string) => { const i = names.indexOf(s); expect(i, s).toBeGreaterThanOrEqual(0); return i; };
  const clues = cluesOf(q.prompt);
  expect(clues.length).toBeGreaterThanOrEqual(2); expect(clues.length).toBeLessThanOrEqual(5);
  // pos[p] = place of person p: 0 is the tallest, or the front of the line
  const tests = clues.map((c): ((pos: number[]) => boolean) => {
    let m: RegExpExecArray | null;
    if ((m = /^(\w+) is taller than (\w+) but shorter than (\w+)\.$/.exec(c))) { const a = who(m[1]), b = who(m[2]), d = who(m[3]); return (pos) => pos[a] < pos[b] && pos[a] > pos[d]; }
    if ((m = /^(\w+) is taller than (\w+)\.$/.exec(c))) { const a = who(m[1]), b = who(m[2]); return (pos) => pos[a] < pos[b]; }
    if ((m = /^(\w+) is shorter than (\w+)\.$/.exec(c))) { const a = who(m[1]), b = who(m[2]); return (pos) => pos[a] > pos[b]; }
    if ((m = /^(\w+) is somewhere in front of (\w+)\.$/.exec(c))) { const a = who(m[1]), b = who(m[2]); return (pos) => pos[a] < pos[b]; }
    if ((m = /^(\w+) is somewhere behind (\w+)\.$/.exec(c))) { const a = who(m[1]), b = who(m[2]); return (pos) => pos[a] > pos[b]; }
    if ((m = /^(\w+) is right behind (\w+)\.$/.exec(c))) { const a = who(m[1]), b = who(m[2]); return (pos) => pos[a] === pos[b] + 1; }
    if ((m = /^(\w+) stands next to (\w+)\.$/.exec(c))) { const a = who(m[1]), b = who(m[2]); return (pos) => Math.abs(pos[a] - pos[b]) === 1; }
    if ((m = /^(\w+) is somewhere between (\w+) and (\w+)\.$/.exec(c))) { const a = who(m[1]), b = who(m[2]), d = who(m[3]); return (pos) => Math.min(pos[b], pos[d]) < pos[a] && pos[a] < Math.max(pos[b], pos[d]); }
    if ((m = /^(\w+) is (the tallest|first in line)\.$/.exec(c))) { const a = who(m[1]); return (pos) => pos[a] === 0; }
    if ((m = /^(\w+) is (the shortest|last in line)\.$/.exec(c))) { const a = who(m[1]); return (pos) => pos[a] === n - 1; }
    if ((m = /^(\w+) is not (the tallest or the shortest|first or last)\.$/.exec(c))) { const a = who(m[1]); return (pos) => pos[a] !== 0 && pos[a] !== n - 1; }
    throw new Error(`unknown clue: ${c}`);
  });
  expect(clues.every((c) => (height ? !/front|behind|line|between|next to/.test(c) : !/taller|shorter|tallest|shortest/.test(c)))).toBe(true);
  const sols = perms(n).filter((pos) => tests.every((t) => t(pos)));
  expect(sols.length, `${q.prompt} has ${sols.length} solutions`).toBe(1);
  const pos = sols[0]; const at = (s: number) => names[pos.indexOf(s)];
  for (let i = 0; i < tests.length; i++) expect(perms(n).filter((x) => tests.every((t, j) => j === i || t(x))).length, `clue ${i + 1} is not needed`).toBeGreaterThan(1);
  const sv = q.solutionVisual as Grid;
  expect(sv.marks).toEqual(names.map((_, p) => v.cols.map((_, s) => (pos[p] === s ? 'yes' : 'no'))));
  const ask = /(Who is [^?]+|What place in line is \w+)\? Tap (a name|the place)\.$/.exec(q.prompt);
  expect(ask, q.prompt).toBeTruthy();
  const a = ask![1];
  const said = (p: string) => clues.some((c) => c.startsWith(`${p} is the`) || c.startsWith(`${p} is first`) || c.startsWith(`${p} is last`));
  let m: RegExpExecArray | null;
  if ((m = /^What place in line is (\w+)$/.exec(a))) {
    expect(height).toBe(false); expect(said(m[1])).toBe(false);
    expect(q.choices!.map((c) => c.label)).toEqual(ORD.slice(0, n));
    return valueOf(q, ORD[pos[who(m[1])]]);
  }
  expect(q.choices!.map((c) => c.label)).toEqual(names);
  if ((m = /^Who is right behind (\w+)$/.exec(a))) { expect(height).toBe(false); expect(clues.some((c) => c.endsWith(`right behind ${m![1]}.`))).toBe(false); return valueOf(q, at(pos[who(m[1])] + 1)); }
  const place = ({ 'Who is the tallest': 0, 'Who is first in line': 0, 'Who is the shortest': n - 1, 'Who is last in line': n - 1, 'Who is the 2nd tallest': 1, 'Who is in the middle': (n - 1) / 2 } as Record<string, number>)[a];
  expect(place, a).toBeDefined(); expect(Number.isInteger(place)).toBe(true);
  expect(said(at(place))).toBe(false);
  return valueOf(q, at(place));
}

/* ---------- must, might or can't; how many to be sure ---------- */

function bagOf(q: Question): { colors: string[]; piles: number[]; noun: string } {
  const v = q.visual as Scene;
  expect(v.items.every((x) => x.icon === v.items[0].icon && x.color && !x.hidden)).toBe(true);
  expect(new Set(v.items.map((x) => x.color)).size).toBe(v.items.length);
  return { colors: v.items.map((x) => x.color!), piles: v.items.map((x) => x.n), noun: v.items[0].icon === 'ball' ? 'marble' : v.items[0].icon };
}
function solveMustMight(q: Question): number {
  const { colors, piles, noun } = bagOf(q);
  const of = (h: number[], c: string) => (colors.includes(c) ? h[colors.indexOf(c)] : 0);
  const sure = /How many must (\w+) take to be sure of getting (.+)\?$/.exec(q.prompt);
  if (sure) {
    // the prompt says what is in the bag, and the picture shows the same: "2 purple, 6 blue and 2 red shirts", or with a
    // count of 1 every count has its own noun: "8 purple hats, 3 green hats and 1 blue hat"
    const body = /has (.+?)\. /.exec(q.prompt)![1];
    const parts = body.split(/, | and /).map((x) => x.split(' '));
    const plural = `${noun}s`;
    if (piles.includes(1)) parts.forEach(([k, , w]) => expect(w, body).toBe(k === '1' ? noun : plural));
    else { parts.slice(0, -1).forEach((x) => expect(x.length, body).toBe(2)); expect(parts.at(-1)![2], body).toBe(plural); }
    expect(parts.map(([k, c]) => [c, +k])).toEqual(colors.map((c, i) => [c, piles[i]]));
    // never a choice bigger than the whole bag
    for (const c of q.choices!) expect(c.value, `${q.prompt} ${JSON.stringify(q.choices)}`).toBeLessThanOrEqual(sum(piles));
    const goal = sure[2]; let m: RegExpExecArray | null;
    let ok: (h: number[]) => boolean;
    if ((m = /^(\d+) \w+ of the same colour$/.exec(goal))) { const k = +m[1]; ok = (h) => Math.max(...h) >= k; }
    else if (/^2 \w+ of different colours$/.test(goal)) ok = (h) => h.filter((x) => x > 0).length >= 2;
    else if (/^at least one \w+ of each colour$/.test(goal)) ok = (h) => h.every((x) => x > 0);
    else if ((m = /^at least one (\w+) \w+$/.exec(goal))) { const c = m[1]; ok = (h) => of(h, c) >= 1; }
    else if ((m = /^(\d+) (\w+) \w+$/.exec(goal))) { const k = +m[1], c = m[2]; ok = (h) => of(h, c) >= k; }
    else throw new Error(`unknown goal: ${goal}`);
    // the smallest handful size where every possible handful works
    for (let k = 1; k <= sum(piles); k++) if (handfuls(piles, k).every(ok)) {
      expect(q.choices!.every((c) => c.label === String(c.value))).toBe(true);
      // The worked picture is one unluckiest handful, as the steps tell it: it misses the goal and holds k − 1 things
      // (k − 2 for "2 red shirts": every shirt that is not red, before the 2 red ones).
      const sv = q.solutionVisual as Scene;
      expect(sv.title).toBe('The unluckiest picks');
      for (const x of sv.items) { expect(x.label).toBe(`${x.n} ${x.color}`); expect(x.n).toBeGreaterThan(0); }
      const unlucky = colors.map((c) => sum(sv.items.filter((x) => x.color === c).map((x) => x.n)));
      unlucky.forEach((x, i) => expect(x).toBeLessThanOrEqual(piles[i]));
      const twoOf = /^2 (red|blue|yellow|green|purple) \w+$/.test(goal);
      expect(sum(unlucky), `${q.prompt} ${JSON.stringify(sv.items)}`).toBe(k - (twoOf ? 2 : 1));
      expect(ok(unlucky), `${q.prompt} ${JSON.stringify(sv.items)}`).toBe(false);
      return k;
    }
    throw new Error('never sure');
  }
  const m0 = /^(\w+) (picks|takes) (\d+) (\w+) from the (bag|drawer|box) without looking\. \1 ___ get (.+) Tap Must, Might or Can't\.$/.exec(q.prompt);
  expect(m0, q.prompt).toBeTruthy();
  const k = +m0![3]; const ev = m0![6];
  expect(m0![4]).toBe(k === 1 ? noun : `${noun}s`);
  expect(k).toBeLessThan(sum(piles));
  expect(q.choices!.map((c) => c.label)).toEqual(['Must', 'Might', "Can't"]);
  let m: RegExpExecArray | null; let ok: (h: number[]) => boolean;
  if ((m = /^an? (\w+) or (\w+) \w+\.$/.exec(ev))) { const [c, d] = [m[1], m[2]]; expect(k).toBe(1); ok = (h) => of(h, c) + of(h, d) === 1; }
  else if ((m = /^an? (\w+) \w+\.$/.exec(ev))) { const c = m[1]; expect(k).toBe(1); ok = (h) => of(h, c) === 1; }
  else if ((m = /^at least one (\w+) \w+\.$/.exec(ev))) { const c = m[1]; ok = (h) => of(h, c) >= 1; }
  else if ((m = /^only (\w+) \w+\.$/.exec(ev))) { const c = m[1]; ok = (h) => of(h, c) === k; }
  else if (/^two \w+ of the same colour\.$/.test(ev)) ok = (h) => Math.max(...h) >= 2;
  else if (/^one \w+ of each colour\.$/.test(ev)) ok = (h) => h.every((x) => x >= 1);
  else if (/^\w+ that are all different colours\.$/.test(ev)) ok = (h) => Math.max(...h) <= 1;
  else throw new Error(`unknown event: ${ev}`);
  const hs = handfuls(piles, k);
  expect(hs.length).toBeGreaterThan(0);
  const yes = hs.filter(ok).length;
  return yes === hs.length ? 1 : yes > 0 ? 2 : 3;
}

/* ---------- truth-tellers and fibbers ---------- */

function solveLiar(q: Question): number {
  const v = q.visual as Speak; const names = v.people.map((p) => p.name); const n = names.length;
  const who = (s: string) => { const i = names.indexOf(s); expect(i, s).toBeGreaterThanOrEqual(0); return i; };
  for (const p of v.people) expect(q.prompt).toContain(`${p.name} says, “${p.says}”`);
  const says = v.people.map((p, s): ((w: boolean[]) => boolean) => {
    const t = p.says; let m: RegExpExecArray | null;
    if ((m = /^(\w+) is a fibber\.$/.exec(t))) { const b = who(m[1]); return (w) => !w[b]; }
    if ((m = /^(\w+) tells the truth\.$/.exec(t))) { const b = who(m[1]); return (w) => w[b]; }
    if ((m = /^(\w+) and I both tell the truth\.$/.exec(t))) { const b = who(m[1]); return (w) => w[s] && w[b]; }
    if ((m = /^(\w+) and I are both fibbers\.$/.exec(t))) { const b = who(m[1]); return (w) => !w[s] && !w[b]; }
    if ((m = /^(\w+) and I are the same kind\.$/.exec(t))) { const b = who(m[1]); return (w) => w[s] === w[b]; }
    if ((m = /^(\w+) and I are different kinds\.$/.exec(t))) { const b = who(m[1]); return (w) => w[s] !== w[b]; }
    if ((m = /^(\w+) and (\w+) are both fibbers\.$/.exec(t))) { const b = who(m[1]), c = who(m[2]); return (w) => !w[b] && !w[c]; }
    if ((m = /^(\w+) and (\w+) are the same kind\.$/.exec(t))) { const b = who(m[1]), c = who(m[2]); return (w) => w[b] === w[c]; }
    if (t === 'Exactly one of us is a fibber.') return (w) => w.filter((x) => !x).length === 1;
    if (t === 'Exactly one of us tells the truth.') return (w) => w.filter(Boolean).length === 1;
    if (t === 'At least one of us is a fibber.') return (w) => w.some((x) => !x);
    if (t === 'We all tell the truth.') return (w) => w.every(Boolean);
    if (t === 'I tell the truth.') return (w) => w[s];
    throw new Error(`unknown saying: ${t}`);
  });
  // nobody talks about themselves by name
  expect(v.people.every((p) => !p.says.includes(p.name)), q.prompt).toBe(true);
  const worlds = Array.from({ length: 1 << n }, (_, m) => names.map((_, p) => !!(m & (1 << p))));
  const fits = worlds.filter((w) => says.every((f, s) => f(w) === w[s]));
  expect(fits.length, `${q.prompt}: ${fits.length} worlds fit`).toBe(1);
  const w = fits[0];
  const sv = q.solutionVisual as Grid;
  expect(sv.marks).toEqual(w.map((x) => (x ? ['yes', 'no'] : ['no', 'yes'])));
  let m: RegExpExecArray | null;
  if (/Who is the fibber\?$/.test(q.prompt)) { expect(w.filter((x) => !x).length).toBe(1); return valueOf(q, names[w.indexOf(false)]); }
  if (/Who is the only truth-teller\?$/.test(q.prompt)) { expect(w.filter(Boolean).length).toBe(1); return valueOf(q, names[w.indexOf(true)]); }
  if (/How many of them tell the truth\?$/.test(q.prompt)) {
    expect(q.choices!.map((c) => c.value)).toEqual(Array.from({ length: n + 1 }, (_, i) => i));
    return w.filter(Boolean).length;
  }
  m = /Is (\w+) a truth-teller or a fibber\?$/.exec(q.prompt);
  expect(m, q.prompt).toBeTruthy();
  return valueOf(q, w[who(m![1])] ? 'Truth-teller' : 'Fibber');
}

const SOLVE: Record<Kind, (q: Question) => number> = { truefalse: solveTrueFalse, grid: solveGrid, order: solveOrder, mustmight: solveMustMight, liar: solveLiar };

/* ---------- the tests ---------- */

let boxWords = 0;
describe('Logic Lite questions', () => {
  for (const kind of KINDS) for (const d of DS) {
    it(`${kind} at difficulty ${d}: one right answer, fair choices, grade caps, labels`, () => {
      const r = createRng(1000 * d + kind.length * 13);
      const g = gradeOf(d); const inBand = LOGIC_KIND_GRADES[kind].includes(g);
      const answers = new Map<number, number>();
      for (let i = 0; i < N; i++) {
        const q = logicQuestion(kind, d, r);
        const where = `${kind} d${d} #${i}: ${q.prompt} ${q.expression} ${JSON.stringify(q.visual)}`;
        expect(q.topic).toBe(LOGIC_META.topic); expect(q.masterySkillId).toBe(`logic.${kind}`); expect(q.visualFirst).toBe(true);
        expect(q.difficulty).toBe(d);
        expect(SOLVE[kind](q), where).toBe(q.answer);
        if (kind === 'truefalse') {
          // Every hint about the boxed thing asks about the box, whatever the answer ("Look for a blue bird. Can you see
          // one?" alone leads to False when the box might hold one); hints about anything else never do.
          const box = (q.visual as Scene).items.find((x) => x.hidden); const text = q.expression.replace(/^“|”$/g, '');
          if (box) expect(/What could be in the shut box\?/.test(q.hint), `${where} :: ${q.hint}`).toBe(subjectOf(text).t === box.icon);
          else expect(q.hint, where).not.toMatch(/box/);
        }
        if (kind === 'grid' || kind === 'order') {
          // the boxes the steps name are boxes the grid has ("Put ✓ in Tia's tallest box" needs a "tallest" column)
          const cols = (q.visual as Grid).cols;
          for (const t of q.solutionSteps) for (const m of t.matchAll(/\b(?:in|and) [A-Z]\w+'s ([a-z0-9][a-z0-9 ,]*?) box(?:es)?\b/g)) {
            boxWords++;
            for (const w of m[1].split(/, | and /)) expect(cols, `${where} :: ${t}`).toContain(w);
          }
        }
        answers.set(q.answer, (answers.get(q.answer) ?? 0) + 1);
        expect(checkAnswer(q, String(q.answer)), where).toBe(true);
        expect(Number.isInteger(q.answer), where).toBe(true);
        for (const t of texts(q)) expect(t, where).not.toMatch(/undefined|NaN|\[object|Infinity|null/);
        for (const t of [q.hint, ...q.solutionSteps, ...q.explanation]) { checkLabels(t); expect(bareNumbers(t), `${where} :: ${t}`).toEqual([]); }
        expect(q.solutionSteps.flatMap(arithmeticSlips), where).toEqual([]);
        expect(q.solutionSteps.length).toBeGreaterThan(0);
        expect(q.explanation.length).toBeGreaterThan(0);
        expect(q.hint.length).toBeGreaterThan(10);
        // the hint helps without giving the answer away
        if (q.choices!.every((c) => /^\d+$/.test(c.label))) { if (q.answer > 2) expect(nums(q.hint), where).not.toContain(q.answer); }
        else if (kind !== 'liar') expect(q.hint, where).not.toContain(q.choices!.find((c) => c.value === q.answer)!.label);
        // Fibbers: the hint may name a robot to start with (see the balance test below) but never one case on its own,
        // so it cannot hint which case breaks: it names both, or asks which one could say the words.
        if (kind === 'liar') { expect(q.hint, where).not.toMatch(/\b(?:were|is|as|be) (?:a truth-teller|a fibber)\b/); expect(q.hint).toMatch(/truth/); expect(q.hint).toMatch(/fib/); }
        for (const t of texts(q)) expect(singularSlips(t), `${where} :: ${t}`).toEqual([]);
        // the question picture shows the problem, never the answer
        const v = q.visual as ContestVisual;
        expect(v.type).toBe(kind === 'truefalse' || kind === 'mustmight' ? 'scene' : kind === 'liar' ? 'speakers' : 'logicgrid');
        if (v.type === 'logicgrid') expect(v.marks, where).toBeUndefined();
        if (kind === 'grid' || kind === 'order' || kind === 'liar') expect((q.solutionVisual as ContestVisual).type).toBe('logicgrid');
        // choices
        expect(q.choices, where).toBeTruthy();
        const vals = q.choices!.map((c) => c.value);
        expect(vals.length, where).toBeGreaterThanOrEqual(2); expect(vals.length).toBeLessThanOrEqual(5);
        expect(new Set(vals).size, where).toBe(vals.length);
        expect(new Set(q.choices!.map((c) => c.label)).size, where).toBe(vals.length);
        expect(vals, where).toContain(q.answer);
        const numeric = q.choices!.every((c) => /^\d+$/.test(c.label));
        if (numeric) for (const c of q.choices!) expect(c.label).toBe(String(c.value));
        else expect(vals, where).toEqual(vals.map((_, j) => j + 1));
        if (inBand) expect(violatesCaps(g, { ...q, game: 'logic' }), where).toBeNull();
        if (inBand && g === 'g1') {
          expect(q.choices!.length).toBeLessThanOrEqual(4);
          expect(q.readAloud, where).toBeTruthy();
          for (const t of [q.prompt, q.readAloud!, q.expression]) expect(Math.max(...words(t)), t).toBeLessThanOrEqual(12);
          for (const t of texts(q)) expect(Math.max(0, ...nums(t)), `${where} :: ${t}`).toBeLessThanOrEqual(20);
          if (v.type === 'scene') expect(sum(v.items.map((x) => x.n))).toBeLessThanOrEqual(20);
        }
        if (inBand && g !== 'g5') {
          for (const t of texts(q)) expect(Math.max(0, ...nums(t)), `${where} :: ${t}`).toBeLessThanOrEqual(1000);
          expect(texts(q).join(' ')).not.toMatch(/%|percent/i);
        }
        expect(q.readAloud, where).toBeTruthy();
      }
      // True / false / can't tell and must / might / can't: roughly a third each
      if (kind === 'truefalse' || (kind === 'mustmight' && d <= 4)) for (const a of [1, 2, 3]) expect(answers.get(a) ?? 0, `${kind} d${d} answer ${a}: ${JSON.stringify([...answers])}`).toBeGreaterThanOrEqual(N * 0.2);
    });
  }

  it('the worked steps name grid boxes', () => expect(boxWords).toBeGreaterThan(500));

  it('is deterministic for a seed', () => {
    for (const kind of [...KINDS, 'all'] as LogicKind[]) for (const d of DS) {
      const a = logicQuestion(kind, d, createRng(5)), b = logicQuestion(kind, d, createRng(5));
      expect([a.prompt, a.expression, a.answer, a.visual, a.choices, a.solutionSteps, a.solutionVisual, a.readAloud]).toEqual([b.prompt, b.expression, b.answer, b.visual, b.choices, b.solutionSteps, b.solutionVisual, b.readAloud]);
    }
  });

  it('mixed play only picks kinds that suit the grade', () => {
    const r = createRng(9);
    for (const d of DS) for (let i = 0; i < 60; i++) {
      const q = logicQuestion('all', d, r);
      expect(q.masterySkillId).toBe('logic');
      const kind = LOGIC_KINDS.find((k) => k.label === q.subtopic)!.id;
      expect(LOGIC_KIND_GRADES[kind], `${kind} at d${d}`).toContain(gradeOf(d));
      expect(SOLVE[kind as Kind](q)).toBe(q.answer);
    }
  });

  it('says one thing with one noun, in a big sweep (rare counts of 1 included)', () => {
    // A count of 1 is rare ("There are 1 birds in all", "Half of them … = 1 (flowers)", "and 1 blue hats"), so this
    // sweeps many more questions than the full checks above, looking only at the words.
    const r = createRng(4242);
    for (const [kind, ds, n] of [['truefalse', [1, 2, 3, 4], 6000], ['mustmight', [3, 4, 5, 6], 3000], ['grid', [3, 5], 300], ['order', [3, 6], 300], ['liar', [5, 6], 600]] as [Kind, Difficulty[], number][]) {
      for (const d of ds) for (let i = 0; i < n; i++) {
        const q = logicQuestion(kind, d, r);
        for (const t of texts(q)) expect(singularSlips(t), `${kind} d${d}: ${t}`).toEqual([]);
        if (kind === 'mustmight' && /to be sure/.test(q.prompt)) {
          // the worked picture of the unluckiest picks has as many things as the steps say
          const sv = q.solutionVisual as Scene; const total = sum(sv.items.map((x) => x.n));
          expect(total, q.prompt).toBe(q.answer - (/getting 2 (red|blue|yellow|green|purple) /.test(q.prompt) ? 2 : 1));
          const bag = sum((q.visual as Scene).items.map((x) => x.n));
          for (const c of q.choices!) expect(c.value, q.prompt).toBeLessThanOrEqual(bag);
        }
        if (kind === 'truefalse' && /, and /.test(q.expression)) {
          const [a, b] = q.expression.replace(/^“|\.”$/g, '').split(', and ').map(subjectOf);
          if (a.t === b.t) expect(a.all || b.all || a.cs.some((c) => b.cs.includes(c)), q.expression).toBe(false);
        }
      }
    }
  });

  it("Grade 1: can't tell comes from the picture too, not only from words like 'at home'", () => {
    const r = createRng(31);
    for (const d of [1, 2] as Difficulty[]) {
      const ct: Question[] = []; const boxed = new Map<number, number>(); const seeHint = new Set<number>(); const hints = new Map<string, Set<number>>();
      for (let i = 0; i < 900; i++) {
        const q = logicQuestion('truefalse', d, r);
        if (q.answer === 3) ct.push(q);
        if ((q.visual as Scene).items.some((x) => x.hidden)) boxed.set(q.answer, (boxed.get(q.answer) ?? 0) + 1);
        if (/Can you see/.test(q.hint)) seeHint.add(q.answer);
        if ((q.visual as Scene).items.some((x) => x.hidden)) {
          const shape = q.hint.replace(/\b(red|blue|green|yellow|purple|orange)\b/g, 'C').replace(/\b(apple|frog|ball|fish|bird|car|kite|hat|flower)s?\b/g, 'T');
          if (!hints.has(shape)) hints.set(shape, new Set()); hints.get(shape)!.add(q.answer);
        }
      }
      const words = ct.filter((q) => CANNOT_SEE.test(q.expression)).length;
      const home = ct.filter((q) => /at home/.test(q.expression)).length;
      // some can't-tells hang on a shut box in the picture, and no one cue word carries them
      // Most can't-tells hang on the picture (a shut box), not on a word a child could spot without looking.
      expect(words / ct.length, `d${d}: ${words} of ${ct.length} can't-tells are word cues`).toBeLessThanOrEqual(0.45);
      expect(home / ct.length, `d${d}: ${home} of ${ct.length} can't-tells say "at home"`).toBeLessThanOrEqual(0.25);
      // a shut box also turns up with true and false sentences, so it is no giveaway either
      for (const a of [1, 2, 3]) expect(boxed.get(a) ?? 0, `d${d} box with answer ${a}`).toBeGreaterThan(0);
      const allBoxed = sum([...boxed.values()]);
      expect((boxed.get(3) ?? 0) / allBoxed, `d${d}: ${boxed.get(3)} of ${allBoxed} box pictures are can't tell`).toBeLessThanOrEqual(0.7);
      // "Look for a red bird. Can you see one? What could be in the shut box?" comes with true and with can't tell
      expect([...(hints.get('Look for a C T. Can you see one? What could be in the shut box?') ?? [])].sort(), `d${d}`).toEqual([1, 3]);
      // "Can you see …?" hints come with every answer, not only with can't tell
      expect([...seeHint].sort()).toEqual([1, 2, 3]);
    }
  });

  it('fibber hints do not point at the answer', () => {
    // The hint names the robot the steps start with. That robot is the fibber about as often as not.
    const r = createRng(17);
    let asked = 0, hit = 0;
    for (const d of [5, 6] as Difficulty[]) for (let i = 0; i < 400; i++) {
      const q = logicQuestion('liar', d, r);
      const names = (q.visual as Speak).people.map((p) => p.name);
      const named = names.filter((x) => new RegExp(`\\b${x}\\b`).test(q.hint));
      expect(named.length, q.hint).toBe(1);
      const marks = (q.solutionVisual as Grid).marks!;
      asked++; if (marks[names.indexOf(named[0])][1] === 'yes') hit++;
    }
    expect(hit / asked, `${hit} of ${asked} hinted robots are fibbers`).toBeGreaterThan(0.3);
    expect(hit / asked).toBeLessThan(0.7);
  });

  it('grid pictures: full-word headers big enough to read, the words the steps use; question grids can be marked', () => {
    const r = createRng(64);
    const attr = (tag: string, a: string) => new RegExp(`${a}="([^"]*)"`).exec(tag)?.[1];
    let fives = 0;
    for (const [kind, d] of [['order', 6], ['order', 5], ['order', 3], ['grid', 3], ['grid', 5], ['liar', 5], ['liar', 6]] as [Kind, Difficulty][]) for (let i = 0; i < 40; i++) {
      const q = logicQuestion(kind, d, r);
      for (const v of [q.visual, q.solutionVisual] as ContestVisual[]) {
        if (v.type !== 'logicgrid') continue;
        const html = renderToStaticMarkup(createElement(LogicGrid, { v }));
        const texts = [...html.matchAll(/<text([^>]*)>([^<]*)<\/text>/g)].map((m) => ({ size: Number(attr(m[1], 'font-size')), text: m[2] }));
        // "red hat", "blue hat": the hat is drawn above, so the header says just the colour
        const hats = v.cols.every((c) => / hat$/.test(c));
        for (const c of v.cols) {
          const head = hats ? c.replace(/ hat$/, '') : c;
          const t = texts.find((x) => x.text === head);
          expect(t, `${c} in ${JSON.stringify(texts)}`).toBeTruthy();
          expect(t!.size, `${c}: ${html}`).toBeGreaterThanOrEqual(12);
        }
        if (v.cols.length === 5 && v.cols.includes('tallest')) fives++;
        // the drawing stays phone-sized
        expect(Number(attr(/<svg[^>]*>/.exec(html)![0], 'width'))).toBeLessThanOrEqual(420);
        const buttons = html.match(/role="button"/g)?.length ?? 0;
        if (v.marks) { expect(buttons).toBe(0); expect(html).not.toMatch(/Tap a box/); }
        else { expect(buttons).toBe(v.rows.length * v.cols.length); expect(html).toMatch(/Tap a box: once for ✗, twice for ✓/); expect(html).not.toMatch(/stroke="#2dd4bf"|stroke="#f87171"/); }
      }
    }
    expect(fives, 'five-place height grids were drawn').toBeGreaterThan(5);
  });

  it('passes a given skill id through', () => {
    expect(logicQuestion('grid', 3, createRng(2), 'logic.custom').masterySkillId).toBe('logic.custom');
  });

  it('covers every question shape', () => {
    const r = createRng(77);
    const seen = new Set<string>();
    for (const kind of KINDS) for (const d of DS) for (let i = 0; i < (kind === 'truefalse' ? 300 : 80); i++) {
      const q = logicQuestion(kind, d, r);
      const ask = ((q.prompt.match(/(?:Who|What|How|Is) [^.?]*\?/g) ?? []).at(-1) ?? '').trim();
      if (kind === 'truefalse') {
        const t = q.expression;
        seen.add(`tf:${CANNOT_SEE.test(t) && !/hiding|called/.test(t) ? 'cannot' : /hiding/.test(t) ? 'hiding' : /called/.test(t) ? 'called' : /, and /.test(t) ? 'and' : /next to/.test(t) ? 'nextto' : /between/.test(t) ? 'between' : /left of/.test(t) ? 'leftof' : /at least/.test(t) ? 'atleast' : /exactly/.test(t) ? 'exactly' : /fewer than \d/.test(t) ? 'fewerthan' : /\d+ more/.test(t) ? 'kmore' : /twice/.test(t) ? 'twice' : /in all/.test(t) ? 'total' : /Half/.test(t) ? 'half' : /Every/.test(t) ? 'every' : /^“No /.test(t) ? 'none' : /as many/.test(t) ? 'same' : /fewer/.test(t) ? 'fewer' : /more/.test(t) ? 'more' : /There (is|are) \d/.test(t) ? 'exact' : 'exists'}:${(q.visual as Scene).items.some((x) => x.hidden) ? 'box' : 'open'}:${q.answer}`);
      } else if (kind === 'grid') {
        seen.add(`grid:${(q.visual as Grid).rows.length}:${/Who has/.test(ask) ? 'who' : 'what'}`);
        for (const c of cluesOf(q.prompt)) seen.add(`gclue:${/belongs to/.test(c) ? 'either' : / and \w+ do not/.test(c) ? 'negboth' : / or the /.test(c) ? 'neg2' : /does not/.test(c) ? 'neg1' : 'pos'}`);
      } else if (kind === 'order') {
        seen.add(`order:${/heights/.test(q.prompt) ? 'height' : 'queue'}:${ask.replace(/ [A-Z]\w+\?$/, ' X?')}`);
        for (const c of cluesOf(q.prompt)) seen.add(`oclue:${c.replace(/^\w+ /, '').replace(/ [A-Z]\w+/g, ' X')}`);
      } else if (kind === 'mustmight') {
        seen.add(/to be sure/.test(q.prompt) ? `sure:${/same colour/.test(q.prompt) ? (/getting 2/.test(q.prompt) ? 'pair' : 'triple') : /different colours/.test(q.prompt) ? 'diff' : /each colour/.test(q.prompt) ? 'each' : /at least one/.test(q.prompt) ? 'one' : 'two'}` : `mm:${q.answer}`);
      } else {
        seen.add(`liar:${(q.visual as Speak).people.length}:${ask.replace(/Is \w+/, 'Is X')}`);
      }
    }
    if (process.env.SHOW_SHAPES) console.log([...seen].sort().join('\n'));
    for (const s of ['tf:cannot:open:3', 'tf:hiding:open:3', 'tf:called:open:3', 'tf:nextto:open:1', 'tf:nextto:open:2', 'tf:between:open:1', 'tf:between:open:2', 'tf:leftof:open:1', 'tf:leftof:open:2',
      'tf:more:open:1', 'tf:more:open:2', 'tf:more:box:3', 'tf:same:open:1', 'tf:exact:open:1', 'tf:exact:open:2', 'tf:every:open:1', 'tf:every:open:2', 'tf:every:box:3', 'tf:exists:box:3', 'tf:none:open:1', 'tf:none:box:2',
      'tf:atleast:box:1', 'tf:atleast:box:3', 'tf:exactly:box:3', 'tf:fewerthan:box:2', 'tf:kmore:open:1', 'tf:kmore:open:2', 'tf:twice:open:1', 'tf:total:open:2', 'tf:half:open:1', 'tf:and:open:1', 'tf:and:open:2',
      'grid:3:who', 'grid:3:what', 'grid:4:who', 'grid:4:what', 'gclue:neg1', 'gclue:neg2', 'gclue:negboth', 'gclue:either', 'gclue:pos',
      'order:height:Who is the tallest?', 'order:height:Who is the shortest?', 'order:height:Who is in the middle?', 'order:height:Who is the 2nd tallest?', 'order:queue:Who is first in line?', 'order:queue:Who is last in line?',
      'order:queue:What place in line is X?', 'order:queue:Who is right behind X?', 'oclue:is taller than X.', 'oclue:is shorter than X.', 'oclue:is somewhere in front of X.', 'oclue:is somewhere behind X.', 'oclue:is right behind X.',
      'oclue:stands next to X.', 'oclue:is somewhere between X and X.', 'oclue:is taller than X but shorter than X.', 'oclue:is the tallest.', 'oclue:is first in line.', 'oclue:is not first or last.',
      'mm:1', 'mm:2', 'mm:3', 'sure:pair', 'sure:triple', 'sure:each', 'sure:one', 'sure:two', 'sure:diff',
      'liar:2:Who is the fibber?', 'liar:2:How many of them tell the truth?', 'liar:2:Is X a truth-teller or a fibber?', 'liar:3:Who is the only truth-teller?', 'liar:3:How many of them tell the truth?']) expect(seen, s).toContain(s);
  });
});

describe('Logic Lite lessons and wiring', () => {
  it('teaches on pictures, then tries real skills', () => {
    expect(LOGIC_LESSONS.length).toBeGreaterThanOrEqual(2);
    expect(PICTURE_GAMES.logic.lessons.map(([id]) => id)).toEqual(LOGIC_LESSONS.map((l) => l.id));
    const kinds = new Set(LOGIC_KINDS.filter((k) => k.id !== 'all').map((k) => `logic.${k.id}`));
    LOGIC_LESSONS.forEach((l, i) => {
      expect(l.id).toBe(`l.logic-${i + 1}`); expect(l.group).toBe(LOGIC_META.label); expect(['vector', 'newton']).toContain(l.teacher);
      expect(kinds.has(l.skillId)).toBe(true);
      const says = l.steps.filter((s) => s.type === 'say'); const tries = l.steps.filter((s) => s.type === 'try');
      expect(says.some((s) => s.type === 'say' && s.visual && s.caption)).toBe(true);
      expect(tries.length).toBeGreaterThan(0); expect(l.steps.at(-1)!.type).toBe('summary');
      for (const s of l.steps) {
        expect(['vector', 'newton']).toContain(s.speaker);
        if (s.type === 'say') { checkLabels(s.text); expect(bareNumbers(s.text), s.text).toEqual([]); expect(arithmeticSlips(s.text), s.text).toEqual([]); expect(s.text).not.toMatch(/AMC/); }
        if (s.type === 'try') {
          expect(kinds.has(s.skillId), s.skillId).toBe(true); expect(s.count).toBeGreaterThanOrEqual(3); expect(s.count).toBeLessThanOrEqual(4);
          const kind = s.skillId.split('.')[1] as Kind;
          expect(LOGIC_KIND_GRADES[kind]).toContain(gradeOf(s.difficulty));
          const q = logicQuestion(kind, s.difficulty, createRng(1));
          expect(q.masterySkillId).toBe(s.skillId); expect(SOLVE[kind](q)).toBe(q.answer);
        }
      }
    });
    // one lesson reaches Grades 1 to 3, one is all Grade 5 and points on to Logic Quest
    const tryGrades = LOGIC_LESSONS.map((l) => l.steps.flatMap((s) => (s.type === 'try' ? [gradeOf(s.difficulty)] : [])));
    expect(tryGrades.some((gs) => gs.includes('g1'))).toBe(true);
    const g5 = LOGIC_LESSONS.filter((_, i) => tryGrades[i].every((g) => g === 'g5'));
    expect(g5.length).toBeGreaterThan(0);
    for (const l of g5) { const sm = l.steps.at(-1)!; expect(sm.type === 'summary' && sm.points.at(-1)).toBe('More logic puzzles live in Logic Quest.'); }
    expect(LOGIC_META.intro.length).toBeGreaterThan(80); expect(LOGIC_META.intro).not.toBe(LOGIC_META.blurb);
    expect(`${LOGIC_META.intro} ${LOGIC_META.blurb}`).not.toMatch(/AMC/);
  });

  it('lesson pictures match their words', () => {
    for (const l of LOGIC_LESSONS) for (const s of l.steps) {
      if (s.type !== 'say' || !s.visual) continue;
      const v = s.visual as ContestVisual;
      if (v.type === 'logicgrid' && v.marks) {
        // a finished grid: one ✓ in every row (and column); a grid part way through: at most one ✓ in each
        expect(v.marks.length).toBe(v.rows.length);
        const done = v.marks.every((row) => row.every((x) => x !== null));
        for (const row of v.marks) {
          expect(row.length).toBe(v.cols.length);
          const yes = row.filter((x) => x === 'yes').length;
          if (done) expect(yes).toBe(1); else expect(yes).toBeLessThanOrEqual(1);
        }
        if (v.rows.length === v.cols.length) for (let j = 0; j < v.cols.length; j++) expect(v.marks.filter((row) => row[j] === 'yes').length).toBeLessThanOrEqual(1);
        if (done && v.rows.length === v.cols.length) for (let j = 0; j < v.cols.length; j++) expect(v.marks.filter((row) => row[j] === 'yes').length).toBe(1);
      }
      if (v.type === 'scene') for (const x of v.items) if (x.label && /^\d+ /.test(x.label)) expect(Number(x.label.split(' ')[0])).toBe(x.n);
    }
  });
});
