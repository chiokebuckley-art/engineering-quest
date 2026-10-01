/**
 * Number labels: a word label in parentheses right after a number says what the number is:
 * "40 (total coins) ÷ 20 (equal segments) = 2 (coins per segment)". Labels are display text only. They never reach
 * an answer or a calculation, and the maths checks strip them first.
 *
 * A label starts with a letter and holds only letters, spaces and a little punctuation (no digits or operators),
 * so maths brackets like (x + 3), (2 × 20) or (ln 2) are never mistaken for labels.
 */
const LABEL_BODY = "[A-Za-z][A-Za-z '’,/²³-]*[A-Za-z²³]";
/** A plain number, money, a fraction, a percent or degrees, and exact values like 10π, 4√3 or 4π/3; or a "?" still to find. */
const NUMBER = '(?:[−-]?\\$?(?:\\d[\\d,]*(?:\\.\\d+)?(?:√\\d+)?π?|√\\d+|π)(?:\\/\\d+)?(?:%|°)?|\\?)';
/** A number and its label: group 1 is the number, group 2 the label text. */
export const LABELED = new RegExp(`(${NUMBER}) \\((${LABEL_BODY})\\)`, 'g');
/** The text with every number label removed, for maths checks: "40 (total coins) ÷ 20 (equal segments)" → "40 ÷ 20". */
export const stripLabels = (s: string) => s.replace(new RegExp(`(${NUMBER}) \\(${LABEL_BODY}\\)`, 'g'), '$1');
/** Singular or plural for a count: unit(1, 'coin') = 'coin', unit(3, 'coin') = 'coins'. */
export const unit = (n: number, one: string, many = `${one}s`) => (Math.abs(n) === 1 ? one : many);
/** A number with its label: lab(40, 'total coins') = '40 (total coins)'. */
export const lab = (n: number | string, label: string) => `${n} (${label})`;
/** A count labelled with the right singular or plural: labn(1, 'coin') = '1 (coin)', labn(4, 'coin') = '4 (coins)'. */
export const labn = (n: number, one: string, many?: string) => lab(n, unit(n, one, many));
